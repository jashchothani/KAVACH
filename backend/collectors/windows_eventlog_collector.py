"""
KAVACH Windows Event Log Collector.

Reads Security, System, and Application event logs via win32evtlog.
Covers: Firewall rules, service installs, policy changes, and general security events.
"""

from __future__ import annotations

from typing import Any
from collectors.base import BaseCollector, TelemetryEvent
from core.constants import CollectorName, EventType, Severity, WinEventID
from core.logging import get_logger

logger = get_logger(__name__)


class WindowsEventLogCollector(BaseCollector):
    """Collects key events from Windows Security, System, and Application logs."""

    name = CollectorName.WINDOWS_EVENTLOG
    description = "Windows Event Log reader (Security, System, Application)"

    async def _collect_real(self) -> list[TelemetryEvent]:
        import win32evtlog

        events: list[TelemetryEvent] = []
        logs = {"System": [7045], "Security": [4719, 4946, 4947, 4948, 4902]}

        for log_name, target_ids in logs.items():
            try:
                hand = win32evtlog.OpenEventLog(None, log_name)
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
                        eid = ev.EventID & 0xFFFF
                        if eid not in target_ids:
                            continue
                        strings = ev.StringInserts or []
                        event = self._map_event(eid, strings)
                        if event:
                            events.append(event)
                win32evtlog.CloseEventLog(hand)
            except Exception as exc:
                logger.info("eventlog_read_unprivileged_fallback", log=log_name, reason=str(exc))
                sim_events = await self._collect_simulated()
                events.extend(sim_events)

        return events

    def _map_event(self, eid: int, strings: list[str]) -> TelemetryEvent | None:
        if eid == WinEventID.SERVICE_INSTALLED:
            svc_name = strings[0] if strings else "unknown"
            svc_path = strings[1] if len(strings) > 1 else ""
            return self._create_event(
                EventType.SERVICE_INSTALL,
                severity=Severity.HIGH.value, risk_score=55.0,
                tags=["service_install"],
                metadata={"event_id": eid, "service_name": svc_name, "service_path": svc_path},
            )
        if eid in (WinEventID.FIREWALL_RULE_ADD, WinEventID.FIREWALL_RULE_MODIFY, WinEventID.FIREWALL_RULE_DELETE):
            rule_name = strings[0] if strings else "unknown"
            return self._create_event(
                EventType.FIREWALL_EVENT,
                severity=Severity.MEDIUM.value, risk_score=40.0,
                tags=["firewall_change"],
                metadata={"event_id": eid, "rule_name": rule_name},
            )
        if eid == WinEventID.AUDIT_POLICY_CHANGE:
            return self._create_event(
                EventType.REGISTRY_MODIFY,
                severity=Severity.HIGH.value, risk_score=60.0,
                tags=["audit_policy_change", "defense_evasion"],
                metadata={"event_id": eid},
            )
        return None

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        return [
            self._create_event(
                EventType.SERVICE_INSTALL,
                severity=Severity.HIGH.value, risk_score=55.0,
                tags=["simulated", "service_install"],
                metadata={"event_id": 7045, "service_name": "MaliciousService", "service_path": "C:\\Temp\\svc.exe"},
            ),
            self._create_event(
                EventType.FIREWALL_EVENT,
                severity=Severity.MEDIUM.value, risk_score=40.0,
                tags=["simulated", "firewall_change"],
                metadata={"event_id": 4946, "rule_name": "Allow All Inbound"},
            ),
            self._create_event(
                EventType.REGISTRY_MODIFY,
                severity=Severity.HIGH.value, risk_score=60.0,
                tags=["simulated", "audit_policy_change"],
                metadata={"event_id": 4719},
            ),
        ]
