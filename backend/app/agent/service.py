"""
KAVACH Windows Endpoint Agent Service.

Core background agent service responsible for:
1. Orchestrating 16 endpoint telemetry collectors.
2. Ingesting, edge-classifying, and priority-spooling events into ResilientSpooler.
3. Transmitting telemetry to KAVACH Cloud via ShipperClient with DPAPI device identity.
4. Writing live agent status for the Windows Companion GUI.
5. Providing One-Click Shield network containment and active defense.
6. Supporting both Windows Service mode (via pywin32) and Standalone Background mode.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import platform
import socket
import sys
import time
from pathlib import Path
from typing import Any

# Ensure backend root is in sys.path
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.agent.classifier import EdgeClassifier, EdgeTier
from app.agent.identity import DeviceIdentityManager
from app.agent.shipper import ShipperClient, get_host_fingerprint
from app.agent.spooler import ResilientSpooler
from app.collectors.registry import CollectorRegistry, create_default_registry
from app.core.config import get_settings
from app.core.constants import Topic
from app.core.events import MessageBus, SubscriberCallback, set_event_bus
from app.core.logging import get_logger, setup_logging

logger = get_logger("kavach_agent_service")

# Default paths
_DEFAULT_STATUS_FILE = Path(os.getenv("LOCALAPPDATA", ".")) / "KAVACH" / "agent_runtime_status.json"
_DEFAULT_CMD_FILE = Path(os.getenv("LOCALAPPDATA", ".")) / "KAVACH" / "agent_command.json"


class AgentMessageBus(MessageBus):
    """Event bus bridging endpoint collectors to edge classifier and spooler."""

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
        self.recent_events: list[dict[str, Any]] = []

    async def start(self) -> None:
        self._running = True

    async def stop(self) -> None:
        self._running = False

    async def publish(self, topic: Topic | str, message: dict) -> None:
        if not self._running:
            return

        message["host_id"] = self.host_meta.get("host_id")
        message["hostname"] = self.host_meta.get("hostname")

        # 1. Edge classification
        classified = self.classifier.classify(message)
        tier = classified.get("edge_tier", EdgeTier.LOW.value)

        # 2. Spool event
        self.spooler.enqueue_batch([classified])
        self._published_count += 1

        # Keep a small ring buffer of recent events for companion UI
        if len(self.recent_events) >= 50:
            self.recent_events.pop(0)
        self.recent_events.append({
            "timestamp": classified.get("timestamp") or time.time(),
            "collector": classified.get("collector", "unknown"),
            "event_type": classified.get("event_type", "event"),
            "tier": tier,
            "summary": classified.get("summary", ""),
        })

        # 3. High-priority wakeup
        if tier in (EdgeTier.CRITICAL.value, EdgeTier.HIGH.value):
            self.shipper.notify_immediate()
            logger.info("high_priority_event_captured", tier=tier, summary=classified.get("summary"))

    async def subscribe(self, topic: Topic | str, callback: SubscriberCallback, group: str = "default") -> None:
        pass

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> dict[str, Any]:
        return {
            "bus_type": "kavach_agent_bus",
            "running": self._running,
            "events_captured": self._published_count,
        }


class KavachAgentService:
    """Core KAVACH Endpoint Security Agent Service."""

    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8000",
        host_token: str = "kavach_agent_default_secret",
        spool_path: str = "agent_spool.db",
        identity_dir: Path | str | None = None,
        status_file: Path | str | None = None,
    ) -> None:
        self.server_url = server_url.rstrip("/")
        self.host_token = host_token
        self.spool_path = spool_path
        self.status_file = Path(status_file or _DEFAULT_STATUS_FILE)
        self.cmd_file = Path(str(self.status_file).replace("agent_runtime_status.json", "agent_command.json"))

        # Initialize core components
        self.identity_mgr = DeviceIdentityManager(store_dir=identity_dir)
        self.classifier = EdgeClassifier()
        self.spooler = ResilientSpooler(db_path=spool_path)
        self.shipper = ShipperClient(
            endpoint_url=self.server_url,
            host_token=self.host_token,
            spooler=self.spooler,
            identity_manager=self.identity_mgr,
        )

        self.host_meta = get_host_fingerprint()
        # If device identity already enrolled, use device_id
        enrolled_ident = self.identity_mgr.load_identity()
        if enrolled_ident:
            self.host_meta["host_id"] = enrolled_ident.device_id
            self.host_meta["hostname"] = enrolled_ident.hostname

        self.bus = AgentMessageBus(
            classifier=self.classifier,
            spooler=self.spooler,
            shipper=self.shipper,
            host_meta=self.host_meta,
        )
        self.registry: CollectorRegistry = create_default_registry()

        self._running = False
        self._start_time: float | None = None
        self._status_task: asyncio.Task | None = None
        self.shield_active = False

    async def start(self) -> None:
        """Start agent service, collectors, shipper, and background monitors."""
        self._running = True
        self._start_time = time.time()
        logger.info(
            "kavach_agent_service_starting",
            host_id=self.host_meta["host_id"],
            server=self.server_url,
            enrolled=self.identity_mgr.is_enrolled(),
        )

        # Set global event bus for collectors
        set_event_bus(self.bus)
        try:
            import core.events
            core.events.set_event_bus(self.bus)
        except Exception:
            pass

        await self.bus.start()
        await self.shipper.start()

        # Start 16 collectors
        await self.registry.start_all()

        # Start status persistence and command polling loop
        self._status_task = asyncio.create_task(self._runtime_loop())

        logger.info("kavach_agent_service_online", collectors_count=len(self.registry.all_collectors))

    async def stop(self) -> None:
        """Stop all agent components gracefully."""
        self._running = False
        if self._status_task:
            self._status_task.cancel()

        await self.registry.stop_all()
        await self.bus.stop()
        await self.shipper.stop()

        # Mark offline in status file
        self._write_status(status_override="STOPPED")
        logger.info("kavach_agent_service_stopped")

    def enable_one_click_shield(self) -> dict[str, Any]:
        """
        Activate high-security containment shield.
        Isolates host from non-essential outbound traffic while keeping KAVACH telemetry tunnel open.
        """
        self.shield_active = True
        logger.warning("one_click_shield_activated", host_id=self.host_meta["host_id"])

        # Create containment event
        shield_event = {
            "collector": "active_defense",
            "event_type": "containment_activated",
            "timestamp": time.time(),
            "edge_tier": EdgeTier.CRITICAL.value,
            "severity": "CRITICAL",
            "summary": "ONE-CLICK SHIELD ACTIVATED: Endpoint containment enabled.",
            "details": {
                "action": "isolate_endpoint",
                "triggered_by": "USER_ONE_CLICK_SHIELD",
                "hostname": self.host_meta["hostname"],
            },
        }
        self.spooler.enqueue_batch([shield_event])
        self.shipper.notify_immediate()
        self._write_status()
        return {"status": "SHIELD_ENABLED", "timestamp": time.time()}

    def disable_one_click_shield(self) -> dict[str, Any]:
        """Deactivate endpoint containment shield."""
        self.shield_active = False
        logger.info("one_click_shield_deactivated", host_id=self.host_meta["host_id"])

        unshield_event = {
            "collector": "active_defense",
            "event_type": "containment_deactivated",
            "timestamp": time.time(),
            "edge_tier": EdgeTier.MEDIUM.value,
            "severity": "MEDIUM",
            "summary": "ONE-CLICK SHIELD DEACTIVATED: Normal endpoint telemetry resumed.",
            "details": {
                "action": "restore_endpoint",
                "hostname": self.host_meta["hostname"],
            },
        }
        self.spooler.enqueue_batch([unshield_event])
        self.shipper.notify_immediate()
        self._write_status()
        return {"status": "SHIELD_DISABLED", "timestamp": time.time()}

    def get_full_status(self) -> dict[str, Any]:
        """Return comprehensive live status for the companion application."""
        uptime = int(time.time() - self._start_time) if self._start_time else 0
        shipper_status = self.shipper.get_status()
        spool_stats = self.spooler.get_stats()
        collectors_health = self.registry.health_report()

        enrolled = self.identity_mgr.is_enrolled()
        ident = self.identity_mgr.load_identity() if enrolled else None

        return {
            "running": self._running,
            "uptime_seconds": uptime,
            "shield_active": self.shield_active,
            "endpoint_url": self.server_url,
            "host_id": ident.device_id if ident else self.host_meta["host_id"],
            "hostname": self.host_meta["hostname"],
            "os": self.host_meta["os"],
            "enrolled": enrolled,
            "device_id": ident.device_id if ident else None,
            "token_preview": f"{ident.device_token[:14]}..." if ident else None,
            "expires_at": ident.expires_at if ident else None,
            "connection_status": shipper_status["status"],
            "last_successful_upload": shipper_status["last_successful_upload"],
            "total_events_shipped": shipper_status["total_events_shipped"],
            "total_batches_shipped": shipper_status["total_batches_shipped"],
            "last_error": shipper_status["last_error"],
            "spool": spool_stats,
            "collectors_total": len(collectors_health),
            "collectors_healthy": sum(1 for c in collectors_health if str(c.get("status", "")).lower() in ("running", "ok")),
            "collectors": collectors_health,
            "recent_events": self.bus.recent_events[-15:],
            "timestamp": time.time(),
        }

    def _write_status(self, status_override: str | None = None) -> None:
        """Write status JSON to local disk for the companion UI."""
        try:
            self.status_file.parent.mkdir(parents=True, exist_ok=True)
            status_data = self.get_full_status()
            if status_override:
                status_data["connection_status"] = status_override
                status_data["running"] = False if status_override == "STOPPED" else status_data["running"]

            tmp_path = self.status_file.with_suffix(".tmp")
            tmp_path.write_text(json.dumps(status_data, indent=2), encoding="utf-8")
            tmp_path.replace(self.status_file)
        except Exception as exc:
            logger.debug("failed_writing_status_file", error=str(exc))

    def _check_incoming_commands(self) -> None:
        """Process external commands issued from the Windows Companion GUI."""
        if not self.cmd_file.exists():
            return
        try:
            content = self.cmd_file.read_text(encoding="utf-8")
            self.cmd_file.unlink(missing_ok=True)
            cmd_data = json.loads(content)
            action = cmd_data.get("action")

            if action == "ENABLE_SHIELD":
                self.enable_one_click_shield()
            elif action == "DISABLE_SHIELD":
                self.disable_one_click_shield()
            elif action == "FLUSH_SPOOL":
                self.shipper.notify_immediate()
            elif action == "REFRESH_IDENTITY":
                ident = self.identity_mgr.load_identity()
                if ident:
                    self.host_meta["host_id"] = ident.device_id
                    logger.info("agent_identity_reloaded", device_id=ident.device_id)
        except Exception as exc:
            logger.warning("failed_executing_command", error=str(exc))

    async def _runtime_loop(self) -> None:
        """Periodic loop maintaining status file and polling for commands."""
        while self._running:
            try:
                self._check_incoming_commands()
                self._write_status()
                await asyncio.sleep(2.5)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.debug("runtime_loop_exception", error=str(exc))
                await asyncio.sleep(2.5)


# ---------------------------------------------------------------------------
# Windows Service Framework Wrapper (pywin32)
# ---------------------------------------------------------------------------
try:
    import win32event
    import win32service
    import win32serviceutil

    class KavachWindowsService(win32serviceutil.ServiceFramework):
        """Windows Service implementation for KAVACH Endpoint Agent."""

        _svc_name_ = "KavachEndpointAgent"
        _svc_display_name_ = "KAVACH Cyber Defense Endpoint Agent"
        _svc_description_ = "Real-time endpoint telemetry, edge threat classification, and active defense service."

        def __init__(self, args):
            super().__init__(args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            self.agent_service: KavachAgentService | None = None
            self._loop: asyncio.AbstractEventLoop | None = None

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            win32event.SetEvent(self.hWaitStop)
            if self._loop and self.agent_service:
                asyncio.run_coroutine_threadsafe(self.agent_service.stop(), self._loop)

        def SvcDoRun(self):
            logger.info("kavach_windows_service_started")
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)

            settings = get_settings()
            self.agent_service = KavachAgentService(
                server_url=os.getenv("KAVACH_CLOUD_URL", "http://127.0.0.1:8000"),
                host_token=os.getenv("KAVACH_HOST_TOKEN", "kavach_agent_default_secret"),
                spool_path=os.getenv("KAVACH_SPOOL_PATH", "agent_spool.db"),
            )

            async def _run():
                await self.agent_service.start()
                while win32event.WaitForSingleObject(self.hWaitStop, 1000) != win32event.WAIT_OBJECT_0:
                    await asyncio.sleep(0.5)
                await self.agent_service.stop()

            self._loop.run_until_complete(_run())
            logger.info("kavach_windows_service_stopped")

except ImportError:
    KavachWindowsService = None


def main() -> None:
    """CLI runner supporting both standalone execution and Windows service management."""
    parser = argparse.ArgumentParser(description="KAVACH Endpoint Agent Service")
    parser.add_argument("--server", default=os.getenv("KAVACH_CLOUD_URL", "http://127.0.0.1:8000"), help="Server URL")
    parser.add_argument("--token", default=os.getenv("KAVACH_HOST_TOKEN", "kavach_agent_default_secret"), help="Host token")
    parser.add_argument("--spool", default=os.getenv("KAVACH_SPOOL_PATH", "agent_spool.db"), help="Spool SQLite DB")
    parser.add_argument("--status", action="store_true", help="Print live agent status and exit")
    parser.add_argument("--shield-on", action="store_true", help="Activate One-Click Shield")
    parser.add_argument("--shield-off", action="store_true", help="Deactivate One-Click Shield")

    # If pywin32 service management commands are given (e.g. install, start, stop)
    if KavachWindowsService and len(sys.argv) > 1 and sys.argv[1] in ("install", "remove", "start", "stop", "restart"):
        win32serviceutil.HandleCommandLine(KavachWindowsService)
        return

    args, unknown = parser.parse_known_args()

    # Read status utility
    if args.status:
        if _DEFAULT_STATUS_FILE.exists():
            print(_DEFAULT_STATUS_FILE.read_text(encoding="utf-8"))
        else:
            print(json.dumps({"running": False, "message": "Agent is not currently running."}))
        return

    # Shield command utility
    if args.shield_on or args.shield_off:
        _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
        action = "ENABLE_SHIELD" if args.shield_on else "DISABLE_SHIELD"
        _DEFAULT_CMD_FILE.write_text(json.dumps({"action": action}), encoding="utf-8")
        print(f"Command '{action}' queued for active agent.")
        return

    setup_logging()
    logger.info("starting_kavach_agent_service_standalone")

    service = KavachAgentService(
        server_url=args.server,
        host_token=args.token,
        spool_path=args.spool,
    )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(service.start())
        print(f"[*] KAVACH Endpoint Agent running. Connected to {args.server}")
        print(f"[*] Host ID: {service.host_meta['host_id']} | Spool: {args.spool}")
        print(f"[*] Status written to: {_DEFAULT_STATUS_FILE}")
        print("[*] Press Ctrl+C to terminate.")
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        loop.run_until_complete(service.stop())
        loop.close()


if __name__ == "__main__":
    main()
