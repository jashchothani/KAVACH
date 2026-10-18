"""
KAVACH Standalone Endpoint Collector Agent.

Lightweight, high-reliability agent designed to run on monitored endpoints
(Windows, Linux, macOS). Collects raw telemetry from all 16 sensors,
evaluates edge severity rules, spools securely to a local SQLite ring buffer,
and ships prioritized batches to the KAVACH Cloud Analysis Server.

Usage:
    python collector_agent.py --server http://127.0.0.1:8000 --token default_agent_secret
    python collector_agent.py --server https://cloud.kavach.io --spool ./data/agent_spool.db
"""

from __future__ import annotations

import argparse
import asyncio
import os
import signal
import sys
from typing import Any

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agent.classifier import EdgeClassifier, EdgeTier
from app.agent.shipper import ShipperClient, get_host_fingerprint
from app.agent.spooler import ResilientSpooler
from app.collectors.registry import create_default_registry
from app.core.config import get_settings
from app.core.constants import Topic
from app.core.events import MessageBus, SubscriberCallback, set_event_bus
from app.core.logging import get_logger, setup_logging

logger = get_logger("kavach_agent")


class EdgeAgentMessageBus(MessageBus):
    """
    Custom in-agent event bus.
    Intercepts collector events, runs Edge Classification, spools to SQLite,
    and signals the Shipper Client for high-priority tiers.
    """

    def __init__(
        self,
        classifier: EdgeClassifier,
        spooler: ResilientSpooler,
        shipper: ShipperClient,
        host_meta: dict[str, Any],
    ) -> None:
        self.classifier = classifier
        self.spooler = spooler
        self.shipper = shipper
        self.host_meta = host_meta
        self._running = False
        self._published_count = 0

    async def start(self) -> None:
        self._running = True

    async def stop(self) -> None:
        self._running = False

    async def publish(self, topic: Topic | str, message: dict) -> None:
        if not self._running:
            return

        # Attach host identity
        message["host_id"] = self.host_meta.get("host_id")
        message["hostname"] = self.host_meta.get("hostname")

        # 1. Edge Severity Classification
        classified_event = self.classifier.classify(message)
        tier = classified_event.get("edge_tier")

        # 2. Resilient Spooling to SQLite
        self.spooler.enqueue_batch([classified_event])
        self._published_count += 1

        # 3. High-Priority Wakeup Signal
        if tier in (EdgeTier.CRITICAL.value, EdgeTier.HIGH.value):
            self.shipper.notify_immediate()
            logger.info(
                "edge_high_priority_event",
                tier=tier,
                collector=classified_event.get("collector"),
                summary=classified_event.get("summary"),
            )

    async def subscribe(self, topic: Topic | str, callback: SubscriberCallback, group: str = "default") -> None:
        pass  # Agent collectors produce telemetry; analysis happens on the cloud

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> dict:
        return {
            "bus_type": "edge_spooler",
            "running": self._running,
            "events_captured": self._published_count,
            "spool": self.spooler.get_stats(),
        }


async def main() -> None:
    parser = argparse.ArgumentParser(description="KAVACH Standalone Endpoint Collector Agent")
    parser.add_argument(
        "--server",
        default=os.getenv("KAVACH_CLOUD_URL", "http://127.0.0.1:8000"),
        help="Target KAVACH Cloud Ingestion Server URL",
    )
    parser.add_argument(
        "--token",
        default=os.getenv("KAVACH_HOST_TOKEN", "kavach_agent_default_secret"),
        help="Host authentication token",
    )
    parser.add_argument(
        "--spool",
        default=os.getenv("KAVACH_SPOOL_PATH", "agent_spool.db"),
        help="Path to local SQLite spool database",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Max events per HTTP payload",
    )
    args = parser.parse_args()

    setup_logging()
    settings = get_settings()
    host_meta = get_host_fingerprint()

    logger.info(
        "starting_kavach_agent",
        version="2.1.0",
        host_id=host_meta["host_id"],
        hostname=host_meta["hostname"],
        cloud_server=args.server,
        spool_path=args.spool,
    )

    # 1. Initialize Edge Components
    classifier = EdgeClassifier()
    spooler = ResilientSpooler(db_path=args.spool)
    shipper = ShipperClient(
        endpoint_url=args.server,
        host_token=args.token,
        spooler=spooler,
        batch_size=args.batch_size,
    )

    # 2. Attach Edge Message Bus
    edge_bus = EdgeAgentMessageBus(
        classifier=classifier,
        spooler=spooler,
        shipper=shipper,
        host_meta=host_meta,
    )
    set_event_bus(edge_bus)
    try:
        import core.events
        core.events.set_event_bus(edge_bus)
    except Exception:
        pass
    await edge_bus.start()
    await shipper.start()

    # 3. Ensure collectors enabled
    if not settings.collector.enabled:
        settings.collector.enabled = True

    # 4. Initialize and start 16 collectors
    registry = create_default_registry()
    await registry.start_all()

    logger.info(
        "kavach_agent_active",
        collectors_running=len(registry.all_collectors),
        message="Collecting, classifying into 5 tiers, and shipping to Cloud.",
    )

    # Graceful shutdown event
    stop_event = asyncio.Event()

    def handle_stop():
        stop_event.set()

    loop = asyncio.get_running_loop()
    if sys.platform != "win32":
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, handle_stop)

    try:
        while not stop_event.is_set():
            await asyncio.sleep(1.0)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        logger.info("kavach_agent_shutting_down...")
        await registry.stop_all()
        await edge_bus.stop()
        await shipper.stop()
        logger.info("kavach_agent_shutdown_complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
