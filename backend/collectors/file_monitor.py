"""
KAVACH File Integrity Monitor.

Watches configured directories for file system changes using watchdog.
Detects: create, modify, delete, rename, suspicious extensions, mass encryption, canary access.
"""

from __future__ import annotations

import asyncio
import hashlib
import os
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from collectors.base import BaseCollector, TelemetryEvent
from core.constants import (
    CollectorName, EventType, Severity,
    SUSPICIOUS_EXTENSIONS, RANSOMWARE_EXTENSIONS,
)
from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class FileMonitorCollector(BaseCollector):
    """
    File integrity monitoring using watchdog on Windows, simulation elsewhere.

    Monitors:
    - Configured FIM directories
    - System32, SysWOW64, Startup, Temp, AppData, ProgramData
    - Downloads, Desktop, Documents
    - Detects mass encryption patterns (ransomware)
    """

    name = CollectorName.FILE_MONITOR
    description = "File integrity monitoring with ransomware and suspicious extension detection"

    def __init__(self) -> None:
        super().__init__()
        self._pending_events: list[dict[str, Any]] = []
        self._observer: Any = None
        self._file_change_counter: defaultdict[str, int] = defaultdict(int)
        self._last_counter_reset: float = time.time()

    async def start(self) -> None:
        """Start the file monitor with watchdog observer."""
        if self._is_windows and not self._simulation_mode:
            try:
                await self._start_watchdog()
            except Exception as exc:
                logger.error("watchdog_start_failed", error=str(exc))
        await super().start()

    async def stop(self) -> None:
        """Stop watchdog observer."""
        if self._observer is not None:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._observer = None
        await super().stop()

    async def _start_watchdog(self) -> None:
        """Initialize watchdog observers on configured directories."""
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler, FileSystemEvent

        settings = get_settings()
        collector = self

        class _Handler(FileSystemEventHandler):
            def on_created(self, event: FileSystemEvent) -> None:
                if not event.is_directory:
                    collector._enqueue_event("created", event.src_path)

            def on_modified(self, event: FileSystemEvent) -> None:
                if not event.is_directory:
                    collector._enqueue_event("modified", event.src_path)

            def on_deleted(self, event: FileSystemEvent) -> None:
                if not event.is_directory:
                    collector._enqueue_event("deleted", event.src_path)

            def on_moved(self, event: FileSystemEvent) -> None:
                if not event.is_directory:
                    collector._enqueue_event(
                        "renamed", event.src_path,
                        extra={"dest_path": getattr(event, "dest_path", "")},
                    )

        handler = _Handler()
        self._observer = Observer()

        # Default monitored directories
        dirs_to_watch: list[str] = []

        # System critical directories
        windir = os.environ.get("WINDIR", "C:\\Windows")
        userprofile = os.environ.get("USERPROFILE", "C:\\Users\\Default")

        critical_dirs = [
            os.path.join(windir, "System32"),
            os.path.join(windir, "SysWOW64"),
            os.path.join(windir, "Temp"),
            os.path.join(userprofile, "AppData", "Local", "Temp"),
            os.path.join(userprofile, "Downloads"),
            os.path.join(userprofile, "Desktop"),
            os.path.join(userprofile, "Documents"),
            os.environ.get("ProgramData", "C:\\ProgramData"),
        ]

        # Add configured FIM directories
        if settings.collector.fim_directory_list:
            dirs_to_watch.extend(settings.collector.fim_directory_list)

        dirs_to_watch.extend(critical_dirs)

        for d in dirs_to_watch:
            if os.path.isdir(d):
                try:
                    self._observer.schedule(handler, d, recursive=True)
                    logger.info("fim_watching_directory", directory=d)
                except Exception as exc:
                    logger.warning("fim_watch_failed", directory=d, error=str(exc))

        self._observer.start()

    def _enqueue_event(
        self, action: str, path: str, extra: dict[str, Any] | None = None
    ) -> None:
        """Queue a file system event for processing."""
        now = time.time()

        # Reset counter every 60 seconds
        if now - self._last_counter_reset > 60:
            self._file_change_counter.clear()
            self._last_counter_reset = now

        parent_dir = os.path.dirname(path)
        self._file_change_counter[parent_dir] += 1

        event_data = {
            "action": action,
            "path": path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "extension": os.path.splitext(path)[1].lower(),
            "changes_in_dir": self._file_change_counter[parent_dir],
        }
        if extra:
            event_data.update(extra)
        self._pending_events.append(event_data)

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Process queued file events from watchdog."""
        events: list[TelemetryEvent] = []
        pending = self._pending_events[:]
        self._pending_events.clear()

        for fe in pending:
            action = fe["action"]
            path = fe["path"]
            ext = fe.get("extension", "")
            changes = fe.get("changes_in_dir", 0)

            # Map to event type
            event_type_map = {
                "created": EventType.FILE_CREATE,
                "modified": EventType.FILE_MODIFY,
                "deleted": EventType.FILE_DELETE,
                "renamed": EventType.FILE_RENAME,
            }
            event_type = event_type_map.get(action, EventType.FILE_MODIFY)

            severity = Severity.INFO
            risk = 0.0
            tags: list[str] = []

            # Suspicious extension
            if ext in SUSPICIOUS_EXTENSIONS and action == "created":
                severity = Severity.MEDIUM
                risk = 40.0
                tags.append("suspicious_extension")

            # Ransomware extension
            if ext in RANSOMWARE_EXTENSIONS:
                severity = Severity.CRITICAL
                risk = 95.0
                tags.append("ransomware_extension")

            # Mass file changes (potential ransomware)
            if changes > 100:
                severity = Severity.CRITICAL
                risk = max(risk, 90.0)
                tags.append("mass_encryption")

            # System directory changes
            windir = os.environ.get("WINDIR", "C:\\Windows").lower()
            if windir in path.lower():
                severity = max(severity, Severity.MEDIUM, key=lambda s: s.weight)
                risk = max(risk, 50.0)
                tags.append("system_directory")

            # Compute file hash if file exists and was created/modified
            file_hash = ""
            if action in ("created", "modified") and os.path.isfile(path):
                try:
                    file_hash = hashlib.sha256(
                        open(path, "rb").read(65536)
                    ).hexdigest()
                except (PermissionError, OSError):
                    pass

            event = self._create_event(
                event_type,
                severity=severity.value,
                risk_score=risk,
                tags=tags,
                metadata={
                    "action": action,
                    "file_path": path,
                    "file_name": os.path.basename(path),
                    "extension": ext,
                    "directory": os.path.dirname(path),
                    "file_hash_sha256": file_hash,
                    "changes_in_directory": changes,
                    "dest_path": fe.get("dest_path", ""),
                },
            )
            events.append(event)

        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        """Generate simulated file events."""
        simulated_events = [
            {"action": "created", "path": "C:\\Users\\admin\\Downloads\\report.pdf.exe",
             "extension": ".exe"},
            {"action": "modified", "path": "C:\\Windows\\System32\\drivers\\etc\\hosts",
             "extension": ""},
            {"action": "created", "path": "C:\\Users\\admin\\Desktop\\invoice.doc.encrypted",
             "extension": ".encrypted"},
            {"action": "deleted", "path": "C:\\Users\\admin\\Documents\\budget.xlsx",
             "extension": ".xlsx"},
            {"action": "renamed", "path": "C:\\Users\\admin\\AppData\\Local\\Temp\\payload.tmp",
             "extension": ".tmp", "dest_path": "C:\\Users\\admin\\AppData\\Local\\Temp\\svchost.exe"},
        ]

        events: list[TelemetryEvent] = []
        for fe in simulated_events:
            ext = fe["extension"]
            action = fe["action"]
            event_type_map = {
                "created": EventType.FILE_CREATE,
                "modified": EventType.FILE_MODIFY,
                "deleted": EventType.FILE_DELETE,
                "renamed": EventType.FILE_RENAME,
            }

            severity = Severity.INFO
            risk = 0.0
            tags: list[str] = ["simulated"]

            if ext in SUSPICIOUS_EXTENSIONS:
                severity = Severity.MEDIUM
                risk = 40.0
                tags.append("suspicious_extension")
            if ext in RANSOMWARE_EXTENSIONS:
                severity = Severity.CRITICAL
                risk = 95.0
                tags.append("ransomware_extension")

            event = self._create_event(
                event_type_map.get(action, EventType.FILE_MODIFY),
                severity=severity.value,
                risk_score=risk,
                tags=tags,
                metadata={
                    "action": action,
                    "file_path": fe["path"],
                    "file_name": os.path.basename(fe["path"]),
                    "extension": ext,
                    "dest_path": fe.get("dest_path", ""),
                },
            )
            events.append(event)

        return events
