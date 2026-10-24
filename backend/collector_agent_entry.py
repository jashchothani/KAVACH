"""
KAVACH Dedicated Endpoint Collector Agent Executable Entrypoint.

Packages all 16 telemetry collectors, edge severity classification,
local resilient SQLite spooler, and cloud shipper into a standalone Windows binary.
Configured for automatic Windows startup execution.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import platform
import signal
import sys
import time
import winreg
from pathlib import Path
from typing import Any

# Ensure safe std streams for GUI / windowless executions (avoids NoneType errors)
if sys.platform == "win32":
    try:
        if sys.stdout is None:
            sys.stdout = open(os.devnull, "w", encoding="utf-8", errors="replace")
        if sys.stderr is None:
            sys.stderr = open(os.devnull, "w", encoding="utf-8", errors="replace")
    except Exception:
        pass


def hide_console_window() -> None:
    """Instantly hide the Windows console window for silent background execution."""
    if sys.platform == "win32":
        try:
            import ctypes
            hwnd = ctypes.windll.kernel32.GetConsoleWindow()
            if hwnd:
                ctypes.windll.user32.ShowWindow(hwnd, 0)  # 0 = SW_HIDE
        except Exception:
            pass


# Unconditionally hide console window immediately on execution for silent background running
hide_console_window()

# Ensure backend root and subdirectories are properly in sys.path
_CURRENT_DIR = Path(__file__).resolve().parent
if str(_CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(_CURRENT_DIR))

# Ensure bundled/frozen environment paths work
if getattr(sys, "frozen", False):
    _MEIPASS = getattr(sys, "_MEIPASS", None)
    if _MEIPASS and str(_MEIPASS) not in sys.path:
        sys.path.insert(0, str(_MEIPASS))
        sys.path.insert(0, str(Path(_MEIPASS) / "backend"))
    _APP_DIR = Path(sys.executable).parent
    sys.path.insert(0, str(_APP_DIR))
    sys.path.insert(0, str(_APP_DIR / "backend"))
else:
    _APP_DIR = _CURRENT_DIR

from app.agent.classifier import EdgeClassifier, EdgeTier
from app.agent.identity import DeviceIdentityManager
from app.agent.shipper import ShipperClient, get_host_fingerprint
from app.agent.spooler import ResilientSpooler
from app.collectors.registry import CollectorRegistry, create_default_registry
from app.core.config import get_settings
from app.core.constants import Topic
from app.core.events import MessageBus, SubscriberCallback, set_event_bus
from app.core.logging import get_logger, setup_logging

logger = get_logger("kavach_collector_agent")

_LOCAL_APP_DIR = Path(os.getenv("LOCALAPPDATA", ".")) / "KAVACH"
_STATUS_FILE = _LOCAL_APP_DIR / "agent_runtime_status.json"
_CMD_FILE = _LOCAL_APP_DIR / "agent_command.json"
_REG_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
_REG_VALUE_NAME = "KavachCollectorAgent"


class StandaloneAgentMessageBus(MessageBus):
    """Event bus bridging all 16 endpoint collectors to classifier, spooler and cloud shipper."""

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

        # 2. Resilient SQLite Spooling
        self.spooler.enqueue_batch([classified])
        self._published_count += 1

        # 3. Maintain ring buffer for live health & monitoring UI
        if len(self.recent_events) >= 100:
            self.recent_events.pop(0)
        self.recent_events.append({
            "timestamp": classified.get("timestamp") or time.time(),
            "collector": classified.get("collector", "unknown"),
            "event_type": classified.get("event_type", "event"),
            "tier": tier,
            "summary": classified.get("summary", ""),
        })

        # 4. Immediate wake-up for critical/high threats
        if tier in (EdgeTier.CRITICAL.value, EdgeTier.HIGH.value):
            self.shipper.notify_immediate()

    async def subscribe(self, topic: Topic | str, callback: SubscriberCallback, group: str = "default") -> None:
        pass

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> dict[str, Any]:
        return {
            "bus_type": "standalone_edge_bus",
            "running": self._running,
            "events_captured": self._published_count,
            "spool": self.spooler.get_stats(),
        }


def configure_windows_startup(enable: bool = True) -> bool:
    """Register or remove KavachCollectorAgent from Windows CurrentUser Run key."""
    if getattr(sys, "frozen", False):
        exe_path = f'"{sys.executable}" --startup --silent'
    else:
        # Use pythonw so no cmd window ever opens on boot
        py_exe = Path(sys.executable)
        pyw_candidate = py_exe.parent / "pythonw.exe"
        chosen_py = str(pyw_candidate) if pyw_candidate.exists() else str(py_exe)
        exe_path = f'"{chosen_py}" "{Path(__file__).resolve()}" --startup --silent'

    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, _REG_KEY, 0, winreg.KEY_SET_VALUE)
        if enable:
            winreg.SetValueEx(key, _REG_VALUE_NAME, 0, winreg.REG_SZ, exe_path)
            logger.info("windows_startup_registered", path=exe_path)
        else:
            try:
                winreg.DeleteValue(key, _REG_VALUE_NAME)
                logger.info("windows_startup_unregistered")
            except FileNotFoundError:
                pass
        winreg.CloseKey(key)
        return True
    except Exception as e:
        logger.error("windows_startup_configuration_failed", error=str(e))
        return False


class Kavach16CollectorEngine:
    """Master controller for all 16 background telemetry sensors."""

    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8000",
        host_token: str = "kavach_agent_default_secret",
        spool_path: str = "agent_spool.db",
    ) -> None:
        self.server_url = server_url
        self.host_token = host_token
        self.spool_path = spool_path
        self._LOCAL_APP_DIR = _LOCAL_APP_DIR
        self._LOCAL_APP_DIR.mkdir(parents=True, exist_ok=True)

        self.identity_mgr = DeviceIdentityManager(store_dir=self._LOCAL_APP_DIR)
        self.host_meta = self.identity_mgr.ensure_device_identity()

        self.classifier = EdgeClassifier()
        self.spooler = ResilientSpooler(db_path=self._LOCAL_APP_DIR / spool_path)
        self.shipper = ShipperClient(
            endpoint_url=server_url,
            host_token=self.host_token,
            spooler=self.spooler,
            batch_size=50,
            identity_manager=self.identity_mgr,
        )
        self.bus = StandaloneAgentMessageBus(
            classifier=self.classifier,
            spooler=self.spooler,
            shipper=self.shipper,
            host_meta=self.host_meta,
        )
        set_event_bus(self.bus)
        self.registry: CollectorRegistry = create_default_registry()
        self._running = False
        self._status_task: asyncio.Task | None = None

    async def start(self) -> None:
        self._running = True
        logger.info("kavach_16_collector_engine_starting", host_id=self.host_meta["host_id"])

        await self.bus.start()
        await self.shipper.start()
        await self.registry.start_all()

        self._status_task = asyncio.create_task(self._periodic_status_writer())
        logger.info("all_16_collectors_active", count=len(self.registry.all_collectors))

    async def stop(self) -> None:
        self._running = False
        if self._status_task:
            self._status_task.cancel()
            try:
                await self._status_task
            except asyncio.CancelledError:
                pass

        await self.registry.stop_all()
        await self.bus.stop()
        await self.shipper.stop()
        logger.info("kavach_16_collector_engine_stopped")

    async def _periodic_status_writer(self) -> None:
        while self._running:
            try:
                # Check for command from UI/CLI
                if _CMD_FILE.exists():
                    try:
                        cmd = json.loads(_CMD_FILE.read_text(encoding="utf-8"))
                        _CMD_FILE.unlink(missing_ok=True)
                        if cmd.get("action") == "RESTART_COLLECTORS":
                            await self.registry.stop_all()
                            await self.registry.start_all()
                    except Exception:
                        pass

                # Write live telemetry status
                status_payload = {
                    "running": self._running,
                    "host_id": self.host_meta["host_id"],
                    "hostname": self.host_meta["hostname"],
                    "server_url": self.server_url,
                    "collectors_count": len(self.registry.all_collectors),
                    "collectors": self.registry.health_report(),
                    "spool": self.spooler.get_stats(),
                    "recent_events": self.bus.recent_events[-20:],
                    "timestamp": time.time(),
                }
                _STATUS_FILE.write_text(json.dumps(status_payload, indent=2), encoding="utf-8")
            except Exception as e:
                logger.warning("status_write_error", error=str(e))
            await asyncio.sleep(3.0)


async def async_main(args: argparse.Namespace) -> None:
    setup_logging()
    logger.info("kavach_agent_starting", autostart=args.startup)

    # Ensure Windows startup persistence if requested
    if args.install_startup:
        configure_windows_startup(enable=True)
        print("[+] KavachCollectorAgent registered in Windows Startup (Run key).")
        return

    if args.remove_startup:
        configure_windows_startup(enable=False)
        print("[-] KavachCollectorAgent removed from Windows Startup.")
        return

    # Check status command
    if args.status:
        if _STATUS_FILE.exists():
            print(_STATUS_FILE.read_text(encoding="utf-8"))
        else:
            print(json.dumps({"running": False, "message": "KAVACH Collector Agent is not running."}))
        return

    # Automatically ensure startup is configured on first launch
    configure_windows_startup(enable=True)

    engine = Kavach16CollectorEngine(
        server_url=args.server,
        host_token=args.token,
        spool_path=args.spool,
    )

    stop_event = asyncio.Event()

    def _sig_handler():
        stop_event.set()

    if sys.platform != "win32":
        loop = asyncio.get_running_loop()
        for s in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(s, _sig_handler)

    try:
        await engine.start()
        if not (args.silent or args.startup or args.daemon):
            print(f"[✓] KAVACH 16-Collector Security Agent running.")
            print(f"    Target Server: {args.server}")
            print(f"    Telemetry Spool: {_LOCAL_APP_DIR / args.spool}")
            print(f"    Startup Persistence: ACTIVE (Run Key & Services)")

        while not stop_event.is_set():
            await asyncio.sleep(1.0)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        await engine.stop()


def main() -> None:
    hide_console_window()
    parser = argparse.ArgumentParser(description="KAVACH 16-Collector Endpoint Security Agent")
    parser.add_argument("--server", default=os.getenv("KAVACH_CLOUD_URL", "https://api.kavachcybertech.in"), help="Server URL")
    parser.add_argument("--token", default=os.getenv("KAVACH_HOST_TOKEN", "kavach_agent_default_secret"), help="Host token")
    parser.add_argument("--spool", default="agent_spool.db", help="Spool SQLite file name")
    parser.add_argument("--startup", action="store_true", help="Started automatically by Windows Startup")
    parser.add_argument("--silent", "-s", action="store_true", help="Run completely silently in background (no console window)")
    parser.add_argument("--daemon", "-d", action="store_true", help="Run as detached daemon in background")
    parser.add_argument("--install-startup", action="store_true", help="Register in Windows Startup registry")
    parser.add_argument("--remove-startup", action="store_true", help="Remove from Windows Startup registry")
    parser.add_argument("--status", action="store_true", help="Print live health of all 16 collectors and exit")
    args = parser.parse_args()

    try:
        asyncio.run(async_main(args))
    except (KeyboardInterrupt, SystemExit):
        pass


if __name__ == "__main__":
    main()
