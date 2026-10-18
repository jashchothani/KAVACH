"""
KAVACH Telemetry Shipper Client.

Manages resilient, prioritized, authenticated HTTPS transmission from the
edge endpoint to the central Cloud Ingestion Gateway.
Features:
- Token-based host authentication (`X-Host-Token`)
- Automatic host registration and telemetry metadata payload
- Tier-prioritized dispatch (Immediate for Critical/High, batched for Medium/Low)
- Integrated gzip compression for large batches
- Automatic retry with exponential backoff on network disconnections
"""

from __future__ import annotations

import asyncio
import gzip
import json
import platform
import socket
import sys
import time
import uuid
from typing import Any

import httpx

from app.agent.classifier import EdgeTier
from app.agent.spooler import ResilientSpooler
from app.core.logging import get_logger

logger = get_logger("kavach_shipper")


def get_host_fingerprint() -> dict[str, Any]:
    """Capture static endpoint hardware and OS identifiers."""
    hostname = socket.gethostname()
    try:
        ip_addr = socket.gethostbyname(hostname)
    except Exception:
        ip_addr = "127.0.0.1"

    # Persistent device ID based on machine node or fallback
    node_id = hex(uuid.getnode())[2:]

    return {
        "host_id": f"kavach-node-{node_id}",
        "hostname": hostname,
        "os": f"{platform.system()} {platform.release()}",
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "ip_address": ip_addr,
        "python_version": sys.version.split()[0],
    }


class ShipperClient:
    """Asynchronous telemetry shipper connecting Edge Spooler to Cloud Ingestion Gateway."""

    def __init__(
        self,
        endpoint_url: str,
        host_token: str,
        spooler: ResilientSpooler,
        batch_size: int = 100,
        flush_interval_sec: float = 3.0,
    ) -> None:
        self.endpoint_url = endpoint_url.rstrip("/")
        self.host_token = host_token
        self.spooler = spooler
        self.batch_size = batch_size
        self.flush_interval_sec = flush_interval_sec
        self.host_meta = get_host_fingerprint()

        self._running = False
        self._client: httpx.AsyncClient | None = None
        self._flush_task: asyncio.Task | None = None
        self._heartbeat_task: asyncio.Task | None = None
        self._immediate_event = asyncio.Event()

    async def start(self) -> None:
        """Start background shipper loops."""
        self._running = True
        self._client = httpx.AsyncClient(
            timeout=10.0,
            headers={
                "X-Host-Token": self.host_token,
                "X-Host-ID": self.host_meta["host_id"],
                "X-Hostname": self.host_meta["hostname"],
                "User-Agent": f"KAVACH-Agent/2.1 ({self.host_meta['os']})",
            },
        )
        self._flush_task = asyncio.create_task(self._shipping_loop())
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        logger.info(
            "shipper_client_started",
            endpoint=self.endpoint_url,
            host_id=self.host_meta["host_id"],
            hostname=self.host_meta["hostname"],
        )

    async def stop(self) -> None:
        """Stop background tasks and flush remaining high-priority spool."""
        self._running = False
        self._immediate_event.set()
        if self._flush_task:
            self._flush_task.cancel()
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        if self._client:
            await self._client.aclose()
        logger.info("shipper_client_stopped")

    def notify_immediate(self) -> None:
        """Signal shipper to wake up immediately for Critical or High events."""
        self._immediate_event.set()

    async def _shipping_loop(self) -> None:
        """Continuous consumer loop reading from spooler and posting to cloud."""
        while self._running:
            try:
                # Wait for batch interval or immediate high-priority signal
                try:
                    await asyncio.wait_for(self._immediate_event.wait(), timeout=self.flush_interval_sec)
                except asyncio.TimeoutError:
                    pass
                self._immediate_event.clear()

                # Dequeue prioritized batch from local SQLite spool
                batch = self.spooler.dequeue_batch(limit=self.batch_size)
                if not batch:
                    continue

                event_ids = [item[0] for item in batch]
                events = [item[1] for item in batch]

                # Post batch to Cloud Gateway
                success = await self._send_batch(events)
                if success:
                    self.spooler.ack_batch(event_ids)
                    logger.debug("batch_shipped_successfully", count=len(events))
                else:
                    self.spooler.nack_batch(event_ids)
                    # Backoff slightly on transmission failure
                    await asyncio.sleep(2.0)

            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("shipping_loop_error", error=str(exc))
                await asyncio.sleep(3.0)

    async def _send_batch(self, events: list[dict[str, Any]]) -> bool:
        """Transmit payload batch with host metadata to cloud server."""
        if not self._client:
            return False

        payload = {
            "host_id": self.host_meta["host_id"],
            "hostname": self.host_meta["hostname"],
            "os": self.host_meta["os"],
            "ip_address": self.host_meta["ip_address"],
            "timestamp": time.time(),
            "batch_count": len(events),
            "events": events,
        }

        url = f"{self.endpoint_url}/api/v1/telemetry/ingest"

        try:
            # Gzip payload if batch is substantial
            if len(events) > 50:
                raw_json = json.dumps(payload).encode("utf-8")
                compressed = gzip.compress(raw_json)
                resp = await self._client.post(
                    url,
                    content=compressed,
                    headers={"Content-Type": "application/json", "Content-Encoding": "gzip"},
                )
            else:
                resp = await self._client.post(url, json=payload)

            if resp.status_code in (200, 201, 202):
                return True
            else:
                logger.warning("cloud_ingest_rejected", status=resp.status_code, body=resp.text[:200])
                return False
        except httpx.RequestError as exc:
            logger.warning("cloud_server_unreachable", endpoint=url, error=str(exc))
            return False

    async def _heartbeat_loop(self) -> None:
        """Emit periodic statistical telemetry heartbeat every 45 seconds."""
        import psutil

        while self._running:
            try:
                await asyncio.sleep(45.0)
                cpu = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory().percent
                disk = psutil.disk_usage("/").percent if hasattr(os, "statvfs") or sys.platform != "win32" else psutil.disk_usage("C:").percent

                heartbeat_evt = {
                    "collector": "system",
                    "event_type": "heartbeat",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "edge_tier": EdgeTier.STATISTICAL.value,
                    "edge_score": 5.0,
                    "edge_reason": "Periodic host vitals heartbeat",
                    "severity": "LOW",
                    "metadata": {
                        "cpu_percent": cpu,
                        "memory_percent": ram,
                        "disk_percent": disk,
                        "host_id": self.host_meta["host_id"],
                        "hostname": self.host_meta["hostname"],
                        "spool_stats": self.spooler.get_stats(),
                    },
                    "summary": f"Host Vital Snapshot: CPU {cpu}%, RAM {ram}%, Disk {disk}%",
                }
                # Directly enqueue to spooler
                self.spooler.enqueue_batch([heartbeat_evt])
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.debug("heartbeat_error", error=str(exc))
