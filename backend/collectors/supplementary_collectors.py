"""KAVACH USB, DNS, Registry, Service, Scheduled Task, Software, System Info, Defender, and Canary collectors."""

from __future__ import annotations

import os
import platform
import socket
import uuid
from datetime import datetime, timezone
from typing import Any

from collectors.base import BaseCollector, TelemetryEvent
from core.constants import CollectorName, EventType, Severity
from core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# USB Collector
# ---------------------------------------------------------------------------
class USBCollector(BaseCollector):
    name = CollectorName.USB
    description = "USB device insertion/removal monitoring"

    async def _collect_real(self) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        try:
            import wmi
            c = wmi.WMI()
            for disk in c.Win32_DiskDrive():
                if "USB" in (disk.InterfaceType or ""):
                    events.append(self._create_event(
                        EventType.USB_INSERT,
                        severity=Severity.MEDIUM.value, risk_score=30.0,
                        tags=["usb_device"],
                        metadata={"device": disk.Caption, "serial": disk.SerialNumber,
                                  "size_gb": round((int(disk.Size or 0)) / 1e9, 2),
                                  "interface": disk.InterfaceType},
                    ))
        except Exception as exc:
            logger.error("usb_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [self._create_event(
            EventType.USB_INSERT, severity=Severity.MEDIUM.value, risk_score=30.0,
            tags=["simulated", "usb_device"],
            metadata={"device": "SanDisk Cruzer Blade USB Device", "serial": "4C530001141006", "size_gb": 14.5, "interface": "USB"},
        )]


# ---------------------------------------------------------------------------
# DNS Collector
# ---------------------------------------------------------------------------
class DNSCollector(BaseCollector):
    name = CollectorName.DNS
    description = "DNS query monitoring via Sysmon Event 22 or DNS Client log"

    async def _collect_real(self) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        try:
            import win32evtlog
            hand = win32evtlog.OpenEventLog(None, "Microsoft-Windows-Sysmon/Operational")
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            read = 0
            while read < 100:
                raw = win32evtlog.ReadEventLog(hand, flags, 0)
                if not raw:
                    break
                for ev in raw:
                    read += 1
                    if read > 100:
                        break
                    if (ev.EventID & 0xFFFF) != 22:
                        continue
                    strings = ev.StringInserts or []
                    query = strings[4] if len(strings) > 4 else ""
                    image = strings[2] if len(strings) > 2 else ""
                    if query:
                        sev, risk, tags = Severity.INFO, 5.0, []
                        # Suspicious TLD detection
                        for tld in [".xyz", ".top", ".tk", ".pw", ".cc", ".ru", ".cn"]:
                            if query.endswith(tld):
                                sev, risk = Severity.MEDIUM, 45.0
                                tags.append("suspicious_tld")
                        # Very long subdomain (potential DNS tunneling)
                        if len(query) > 60:
                            sev, risk = Severity.HIGH, 65.0
                            tags.append("possible_dns_tunnel")
                        events.append(self._create_event(
                            EventType.DNS_QUERY, severity=sev.value, risk_score=risk, tags=tags,
                            metadata={"query": query, "image": image},
                        ))
            win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.error("dns_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(EventType.DNS_QUERY, severity=Severity.INFO.value, risk_score=5.0,
                               tags=["simulated"], metadata={"query": "www.google.com", "image": "chrome.exe"}),
            self._create_event(EventType.DNS_QUERY, severity=Severity.MEDIUM.value, risk_score=45.0,
                               tags=["simulated", "suspicious_tld"], metadata={"query": "c2-server.xyz", "image": "powershell.exe"}),
            self._create_event(EventType.DNS_QUERY, severity=Severity.HIGH.value, risk_score=65.0,
                               tags=["simulated", "possible_dns_tunnel"],
                               metadata={"query": "aHR0cHM6Ly9tYWx3YXJlLmV4YW1wbGUuY29tL3BheWxvYWQ.tunnel.evil.com", "image": "svchost.exe"}),
        ]


# ---------------------------------------------------------------------------
# Registry Collector
# ---------------------------------------------------------------------------
class RegistryCollector(BaseCollector):
    name = CollectorName.REGISTRY
    description = "Windows Registry persistence key monitoring"

    WATCHED_KEYS: list[str] = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
        r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon",
        r"SYSTEM\CurrentControlSet\Services",
    ]

    async def _collect_real(self) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        try:
            import winreg
            for key_path in self.WATCHED_KEYS:
                try:
                    key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path, 0, winreg.KEY_READ)
                    i = 0
                    while True:
                        try:
                            name, value, vtype = winreg.EnumValue(key, i)
                            events.append(self._create_event(
                                EventType.REGISTRY_MODIFY, severity=Severity.MEDIUM.value, risk_score=35.0,
                                tags=["registry_persistence"],
                                metadata={"key": f"HKLM\\{key_path}", "name": name, "value": str(value)[:500]},
                            ))
                            i += 1
                        except OSError:
                            break
                    winreg.CloseKey(key)
                except OSError:
                    continue
        except Exception as exc:
            logger.error("registry_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(EventType.REGISTRY_MODIFY, severity=Severity.HIGH.value, risk_score=60.0,
                               tags=["simulated", "registry_persistence"],
                               metadata={"key": r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "name": "Backdoor", "value": "C:\\Temp\\malware.exe"}),
        ]


# ---------------------------------------------------------------------------
# Service Collector
# ---------------------------------------------------------------------------
class ServiceCollector(BaseCollector):
    name = CollectorName.SERVICE
    description = "Windows service and driver monitoring"

    async def _collect_real(self) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        try:
            import psutil
            for svc in psutil.win_service_iter():
                try:
                    info = svc.as_dict()
                    events.append(self._create_event(
                        EventType.SERVICE_INSTALL, severity=Severity.INFO.value, risk_score=5.0,
                        metadata={"name": info.get("name"), "display_name": info.get("display_name"),
                                  "status": info.get("status"), "start_type": info.get("start_type"),
                                  "binpath": info.get("binpath", "")[:500], "username": info.get("username")},
                    ))
                except Exception:
                    continue
        except Exception as exc:
            logger.error("service_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(EventType.SERVICE_INSTALL, severity=Severity.INFO.value, risk_score=5.0,
                               tags=["simulated"], metadata={"name": "wuauserv", "display_name": "Windows Update", "status": "running", "start_type": "automatic"}),
            self._create_event(EventType.SERVICE_INSTALL, severity=Severity.HIGH.value, risk_score=55.0,
                               tags=["simulated", "suspicious_service"], metadata={"name": "MalSvc", "display_name": "System Maintenance", "status": "running", "binpath": "C:\\Temp\\svc.exe"}),
        ]


# ---------------------------------------------------------------------------
# Scheduled Task Collector
# ---------------------------------------------------------------------------
class ScheduledTaskCollector(BaseCollector):
    name = CollectorName.SCHEDULED_TASK
    description = "Scheduled task monitoring"

    async def _collect_real(self) -> list[TelemetryEvent]:
        import subprocess, json
        events: list[TelemetryEvent] = []
        try:
            result = subprocess.run(
                ["schtasks", "/query", "/fo", "CSV", "/v"],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split("\n")
                for line in lines[1:50]:  # Skip header, limit
                    parts = line.strip('"').split('","')
                    if len(parts) > 8:
                        task_name = parts[1] if len(parts) > 1 else ""
                        task_action = parts[8] if len(parts) > 8 else ""
                        sev, risk = Severity.INFO, 5.0
                        tags: list[str] = []
                        if any(s in task_action.lower() for s in ["powershell", "cmd", "temp", "appdata"]):
                            sev, risk = Severity.MEDIUM, 40.0
                            tags.append("suspicious_task")
                        events.append(self._create_event(
                            EventType.SCHEDULED_TASK, severity=sev.value, risk_score=risk, tags=tags,
                            metadata={"task_name": task_name, "action": task_action[:500]},
                        ))
        except Exception as exc:
            logger.error("scheduled_task_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(EventType.SCHEDULED_TASK, severity=Severity.INFO.value, risk_score=5.0,
                               tags=["simulated"], metadata={"task_name": "GoogleUpdateTaskMachineUA", "action": "C:\\Program Files\\Google\\Update\\GoogleUpdate.exe"}),
            self._create_event(EventType.SCHEDULED_TASK, severity=Severity.HIGH.value, risk_score=55.0,
                               tags=["simulated", "suspicious_task"],
                               metadata={"task_name": "SystemMaint", "action": "powershell.exe -WindowStyle Hidden -File C:\\Temp\\update.ps1"}),
        ]


# ---------------------------------------------------------------------------
# Software Collector
# ---------------------------------------------------------------------------
class SoftwareCollector(BaseCollector):
    name = CollectorName.SOFTWARE
    description = "Installed software inventory"

    async def _collect_real(self) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        try:
            import winreg
            paths = [
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
            ]
            for hive, path in paths:
                try:
                    key = winreg.OpenKey(hive, path, 0, winreg.KEY_READ)
                    i = 0
                    while True:
                        try:
                            subkey_name = winreg.EnumKey(key, i)
                            subkey = winreg.OpenKey(key, subkey_name)
                            try:
                                name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                                version = ""
                                try:
                                    version = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                                except OSError:
                                    pass
                                publisher = ""
                                try:
                                    publisher = winreg.QueryValueEx(subkey, "Publisher")[0]
                                except OSError:
                                    pass
                                events.append(self._create_event(
                                    EventType.SOFTWARE_INSTALL, severity=Severity.INFO.value, risk_score=0.0,
                                    metadata={"name": name, "version": version, "publisher": publisher},
                                ))
                            except OSError:
                                pass
                            winreg.CloseKey(subkey)
                            i += 1
                        except OSError:
                            break
                    winreg.CloseKey(key)
                except OSError:
                    continue
        except Exception as exc:
            logger.error("software_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        software = [
            {"name": "Google Chrome", "version": "125.0.6422.112", "publisher": "Google LLC"},
            {"name": "Visual Studio Code", "version": "1.90.0", "publisher": "Microsoft Corporation"},
            {"name": "Python 3.12.4", "version": "3.12.4", "publisher": "Python Software Foundation"},
            {"name": "Suspicious Tool v1.0", "version": "1.0", "publisher": "Unknown"},
        ]
        return [
            self._create_event(EventType.SOFTWARE_INSTALL, severity=Severity.INFO.value, risk_score=0.0,
                               tags=["simulated"], metadata=s)
            for s in software
        ]


# ---------------------------------------------------------------------------
# System Info Collector
# ---------------------------------------------------------------------------
class SystemInfoCollector(BaseCollector):
    name = CollectorName.SYSTEM_INFO
    description = "System hardware and OS information"

    async def _collect_real(self) -> list[TelemetryEvent]:
        import psutil
        uname = platform.uname()
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/") if os.name != "nt" else psutil.disk_usage("C:\\")
        boot = datetime.fromtimestamp(psutil.boot_time(), tz=timezone.utc).isoformat()

        return [self._create_event(
            EventType.SYSTEM_INFO, severity=Severity.INFO.value, risk_score=0.0,
            metadata={
                "hostname": uname.node, "os": uname.system, "os_version": uname.version,
                "os_release": uname.release, "architecture": uname.machine,
                "processor": uname.processor, "cpu_count": psutil.cpu_count(),
                "cpu_freq_mhz": getattr(psutil.cpu_freq(), "current", 0),
                "memory_total_gb": round(mem.total / 1e9, 2),
                "memory_available_gb": round(mem.available / 1e9, 2),
                "memory_percent": mem.percent,
                "disk_total_gb": round(disk.total / 1e9, 2),
                "disk_free_gb": round(disk.free / 1e9, 2),
                "disk_percent": disk.percent,
                "boot_time": boot,
                "ip_address": socket.gethostbyname(socket.gethostname()),
                "network_interfaces": [nic for nic in psutil.net_if_addrs().keys()],
            },
        )]

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [self._create_event(
            EventType.SYSTEM_INFO, severity=Severity.INFO.value, risk_score=0.0,
            tags=["simulated"],
            metadata={
                "hostname": "DESKTOP-KAVACH", "os": "Windows", "os_version": "10.0.19045",
                "architecture": "AMD64", "cpu_count": 8, "memory_total_gb": 16.0,
                "memory_available_gb": 8.5, "memory_percent": 46.9,
                "disk_total_gb": 500.0, "disk_free_gb": 220.0, "disk_percent": 56.0,
                "boot_time": "2026-07-28T06:00:00+00:00", "ip_address": "192.168.1.100",
            },
        )]


# ---------------------------------------------------------------------------
# Defender Collector
# ---------------------------------------------------------------------------
class DefenderCollector(BaseCollector):
    name = CollectorName.DEFENDER
    description = "Windows Defender threat detection events"

    async def _collect_real(self) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        try:
            import win32evtlog
            hand = win32evtlog.OpenEventLog(None, "Microsoft-Windows-Windows Defender/Operational")
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            read = 0
            threat_ids = {1006, 1007, 1008, 1116, 1117}  # Detection/action events
            while read < 50:
                raw = win32evtlog.ReadEventLog(hand, flags, 0)
                if not raw:
                    break
                for ev in raw:
                    read += 1
                    if read > 50:
                        break
                    eid = ev.EventID & 0xFFFF
                    if eid not in threat_ids:
                        continue
                    strings = ev.StringInserts or []
                    threat_name = strings[0] if strings else "Unknown"
                    events.append(self._create_event(
                        EventType.DEFENDER_ALERT, severity=Severity.HIGH.value, risk_score=65.0,
                        tags=["defender_detection"],
                        metadata={"event_id": eid, "threat_name": threat_name, "strings": strings[:5]},
                    ))
            win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.error("defender_collector_error", error=str(exc))
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(EventType.DEFENDER_ALERT, severity=Severity.HIGH.value, risk_score=70.0,
                               tags=["simulated", "defender_detection"],
                               metadata={"event_id": 1116, "threat_name": "Trojan:Win32/Emotet.RPX!MTB", "action": "Quarantined"}),
            self._create_event(EventType.DEFENDER_ALERT, severity=Severity.CRITICAL.value, risk_score=85.0,
                               tags=["simulated", "defender_detection"],
                               metadata={"event_id": 1117, "threat_name": "Ransom:Win32/Conti.A", "action": "Blocked"}),
        ]


# ---------------------------------------------------------------------------
# Canary File Collector
# ---------------------------------------------------------------------------
class CanaryCollector(BaseCollector):
    name = CollectorName.CANARY
    description = "Canary file honeypot monitoring"

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Check canary files for access/modification."""
        events: list[TelemetryEvent] = []
        settings = self._settings
        canary_dir = settings.collector.canary_directory
        if not canary_dir or not os.path.isdir(canary_dir):
            return events

        for fname in os.listdir(canary_dir):
            fpath = os.path.join(canary_dir, fname)
            if os.path.isfile(fpath):
                try:
                    stat = os.stat(fpath)
                    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
                    atime = datetime.fromtimestamp(stat.st_atime, tz=timezone.utc)
                    now = datetime.now(timezone.utc)
                    # If accessed in last collection interval, it's suspicious
                    if (now - atime).total_seconds() < self._settings.collector.collection_interval * 2:
                        events.append(self._create_event(
                            EventType.CANARY_ACCESS, severity=Severity.CRITICAL.value, risk_score=90.0,
                            tags=["canary_triggered"],
                            metadata={"file": fpath, "last_access": atime.isoformat(), "last_modified": mtime.isoformat()},
                        ))
                except OSError:
                    continue
        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [self._create_event(
            EventType.CANARY_ACCESS, severity=Severity.CRITICAL.value, risk_score=90.0,
            tags=["simulated", "canary_triggered"],
            metadata={"file": "C:\\Canary\\confidential_salaries.xlsx", "last_access": datetime.now(timezone.utc).isoformat()},
        )]
