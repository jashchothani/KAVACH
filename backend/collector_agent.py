import asyncio
import sys
import os
import httpx

# Add backend directory to sys.path if not present
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.core.events import MessageBus, set_event_bus, SubscriberCallback
from app.core.constants import Topic
from app.collectors.registry import create_default_registry

logger = get_logger("collector_agent")

class RESTMessageBus(MessageBus):
    """Message bus that forwards published events to the FastAPI server via REST."""
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        self._running = False
        self._client = None
        self._batch = []
        self._batch_task = None

    async def start(self) -> None:
        self._running = True
        self._client = httpx.AsyncClient(timeout=5.0)
        self._batch_task = asyncio.create_task(self._batch_loop())

    async def stop(self) -> None:
        self._running = False
        if self._batch_task:
            self._batch_task.cancel()
        if self._client:
            await self._client.aclose()

    async def publish(self, topic: Topic | str, message: dict) -> None:
        if self._running:
            self._batch.append(message)

    async def _batch_loop(self):
        while self._running:
            await asyncio.sleep(1.0)
            if self._batch:
                events_to_send = self._batch[:]
                self._batch.clear()
                try:
                    await self._client.post(
                        self.endpoint, 
                        json={"events": events_to_send}
                    )
                    logger.info("telemetry_batch_sent", count=len(events_to_send))
                except Exception as e:
                    logger.error("telemetry_batch_failed", error=str(e))
                    # Basic retry mechanism could go here, but dropping is safer for memory

    async def subscribe(self, topic: Topic | str, callback: SubscriberCallback, group: str = "default") -> None:
        pass # Agent doesn't consume events

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> dict:
        return {"bus_type": "rest", "running": self._running}


async def main():
    setup_logging()
    settings = get_settings()
    logger.info("Starting standalone KAVACH telemetry agent...")

    # Set Global Bus to REST Message Bus
    rest_bus = RESTMessageBus(endpoint="http://127.0.0.1:8000/api/v1/telemetry/ingest")
    set_event_bus(rest_bus)
    await rest_bus.start()

    if not settings.collector.enabled:
        logger.warning("Collectors are disabled in settings. Enabling for standalone agent.")
        settings.collector.enabled = True

    # Start all registered collectors
    registry = create_default_registry()
    await registry.start_all()

    logger.info("Collector agent is running. Sending telemetry to KAVACH Server via REST.")

    try:
        while True:
            # Poll forever, allowing collectors to run in background tasks
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        logger.info("Collector agent shutting down...")
    finally:
        await registry.stop_all()
        await rest_bus.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
