"""
KAVACH Sysmon Collector.

Reads Microsoft-Windows-Sysmon/Operational event log for detailed telemetry:
- Process creation (Event 1), Network connections (3), File creation (11),
  Registry events (12-14), DNS queries (22), Process access (10), etc.
"""

from __future__ import annotations

from typing import Any
from collectors.base import BaseCollector, TelemetryEvent
from core.constants import CollectorName, EventType, Severity, SysmonEventID
from core.logging import get_logger

logger = get_logger(__name__)

SYSMON_EVENT_MAP: dict[int, tuple[EventType, Severity]] = {
    SysmonEventID.PROCESS_CREATE: (EventType.PROCESS_CREATE, Severity.INFO),
    SysmonEventID.NETWORK_CONNECT: (EventType.NETWORK_CONNECTION, Severity.INFO),
    SysmonEventID.PROCESS_TERMINATE: (EventType.PROCESS_TERMINATE, Severity.INFO),
    SysmonEventID.DRIVER_LOAD: (EventType.DRIVER_LOAD, Severity.MEDIUM),
    SysmonEventID.IMAGE_LOAD: (EventType.DLL_LOAD, Severity.INFO),
    SysmonEventID.CREATE_REMOTE_THREAD: (EventType.MEMORY_ACCESS, Severity.HIGH),
    SysmonEventID.PROCESS_ACCESS: (EventType.LSASS_ACCESS, Severity.HIGH),
    SysmonEventID.FILE_CREATE: (EventType.FILE_CREATE, Severity.INFO),
    SysmonEventID.REGISTRY_EVENT_ADD_DEL: (EventType.REGISTRY_CREATE, Severity.MEDIUM),
    SysmonEventID.REGISTRY_EVENT_SET: (EventType.REGISTRY_MODIFY, Severity.MEDIUM),
    SysmonEventID.DNS_QUERY: (EventType.DNS_QUERY, Severity.INFO),
    SysmonEventID.FILE_DELETE: (EventType.FILE_DELETE, Severity.INFO),
}


class SysmonCollector(BaseCollector):
    """Reads Sysmon operational event log."""

    name = CollectorName.SYSMON
    description = "Sysmon event log reader (process, network, file, registry, DNS)"

    async def _collect_real(self) -> list[TelemetryEvent]:
        import win32evtlog

        events: list[TelemetryEvent] = []
        try:
            hand = win32evtlog.OpenEventLog(None, "Microsoft-Windows-Sysmon/Operational")
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            read = 0
            while read < 200:
                raw = win32evtlog.ReadEventLog(hand, flags, 0)
                if not raw:
                    break
                for ev in raw:
                    read += 1
                    if read > 200:
                        break
                    eid = ev.EventID & 0xFFFF
                    mapping = SYSMON_EVENT_MAP.get(eid)
                    if not mapping:
                        continue
                    event_type, sev = mapping
                    strings = ev.StringInserts or []
                    risk = sev.weight * 0.6

                    # LSASS access detection (Event 10 targeting lsass.exe)
                    if eid == SysmonEventID.PROCESS_ACCESS:
                        target = strings[8] if len(strings) > 8 else ""
                        if "lsass" in target.lower():
                            sev = Severity.CRITICAL
                            risk = 95.0

                    event = self._create_event(
                        event_type,
                        severity=sev.value,
                        risk_score=risk,
                        tags=[f"sysmon_event_{eid}"],
                        metadata={
                            "sysmon_event_id": eid,
                            "strings": strings[:10],
                        },
                    )
                    events.append(event)
            win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.error("sysmon_collector_error", error=str(exc))

        return events

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(
                EventType.PROCESS_CREATE, severity=Severity.INFO.value, risk_score=5.0,
                tags=["simulated", "sysmon_event_1"],
                metadata={"sysmon_event_id": 1, "image": "C:\\Windows\\System32\\cmd.exe", "cmdline": "cmd.exe /c whoami", "parent": "explorer.exe"},
            ),
            self._create_event(
                EventType.NETWORK_CONNECTION, severity=Severity.INFO.value, risk_score=10.0,
                tags=["simulated", "sysmon_event_3"],
                metadata={"sysmon_event_id": 3, "dest_ip": "104.21.5.100", "dest_port": 443, "image": "chrome.exe"},
            ),
            self._create_event(
                EventType.LSASS_ACCESS, severity=Severity.CRITICAL.value, risk_score=95.0,
                tags=["simulated", "sysmon_event_10", "lsass_access", "credential_access"],
                metadata={"sysmon_event_id": 10, "source_image": "C:\\Temp\\mimikatz.exe", "target_image": "C:\\Windows\\System32\\lsass.exe"},
            ),
            self._create_event(
                EventType.DNS_QUERY, severity=Severity.INFO.value, risk_score=5.0,
                tags=["simulated", "sysmon_event_22"],
                metadata={"sysmon_event_id": 22, "query": "suspicious-c2-domain.xyz", "image": "powershell.exe"},
            ),
            self._create_event(
                EventType.REGISTRY_MODIFY, severity=Severity.MEDIUM.value, risk_score=40.0,
                tags=["simulated", "sysmon_event_13", "persistence"],
                metadata={"sysmon_event_id": 13, "target": "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\Backdoor", "details": "C:\\Temp\\malware.exe"},
            ),
        ]
