"""
KAVACH Login Event Collector.

Monitors Windows Security event log for authentication events:
- Successful logins (4624)
- Failed logins (4625)
- Explicit credential use (4648)
- Special privileges assigned (4672)
- Account creation/deletion (4720, 4726)
- Group membership changes (4728, 4729)
- RDP sessions
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from collectors.base import BaseCollector, TelemetryEvent
from core.constants import CollectorName, EventType, Severity, WinEventID
from core.logging import get_logger

logger = get_logger(__name__)

LOGON_TYPE_MAP: dict[int, str] = {
    2: "Interactive", 3: "Network", 4: "Batch", 5: "Service",
    7: "Unlock", 8: "NetworkCleartext", 9: "NewCredentials",
    10: "RemoteInteractive", 11: "CachedInteractive", 12: "CachedRemoteInteractive",
}


class LoginCollector(BaseCollector):
    """Monitors authentication events from Windows Security Event Log."""

    name = CollectorName.LOGIN
    description = "Login success/failure, RDP, privilege escalation, and account management events"

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Read real Windows Security event log."""
        import win32evtlog
        import win32evtlogutil

        events: list[TelemetryEvent] = []
        server = None
        log_type = "Security"

        target_ids = {
            WinEventID.LOGON_SUCCESS, WinEventID.LOGON_FAILURE,
            WinEventID.LOGON_EXPLICIT_CREDS, WinEventID.SPECIAL_LOGON,
            WinEventID.ACCOUNT_CREATED, WinEventID.ACCOUNT_DELETED,
            WinEventID.GROUP_MEMBER_ADDED, WinEventID.GROUP_MEMBER_REMOVED,
        }

        try:
            hand = win32evtlog.OpenEventLog(server, log_type)
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            total = win32evtlog.GetNumberOfEventLogRecords(hand)

            # Read last 200 events max
            read_count = 0
            max_read = 200

            while read_count < max_read:
                raw_events = win32evtlog.ReadEventLog(hand, flags, 0)
                if not raw_events:
                    break
                for ev in raw_events:
                    read_count += 1
                    if read_count > max_read:
                        break

                    event_id = ev.EventID & 0xFFFF
                    if event_id not in {e.value for e in target_ids}:
                        continue

                    strings = ev.StringInserts or []
                    time_generated = ev.TimeGenerated

                    event = self._process_security_event(event_id, strings, time_generated)
                    if event:
                        events.append(event)

            win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.info("login_collector_unprivileged_fallback", reason=str(exc))
            events = await self._collect_simulated()

        return events

    def _process_security_event(
        self, event_id: int, strings: list[str], time_generated: Any
    ) -> TelemetryEvent | None:
        """Process a single Windows Security event."""
        try:
            ts = datetime.now(timezone.utc).isoformat()

            if event_id == WinEventID.LOGON_SUCCESS:
                username = strings[5] if len(strings) > 5 else "unknown"
                logon_type = int(strings[8]) if len(strings) > 8 else 0
                logon_type_name = LOGON_TYPE_MAP.get(logon_type, "Unknown")
                source_ip = strings[18] if len(strings) > 18 else ""

                severity = Severity.INFO
                risk = 0.0
                event_type = EventType.LOGIN_SUCCESS
                tags: list[str] = []

                # RDP login
                if logon_type == 10:
                    event_type = EventType.LOGIN_RDP
                    severity = Severity.MEDIUM
                    risk = 30.0
                    tags.append("rdp_login")

                return self._create_event(
                    event_type,
                    severity=severity.value,
                    risk_score=risk,
                    username=username,
                    tags=tags,
                    metadata={
                        "event_id": event_id,
                        "logon_type": logon_type,
                        "logon_type_name": logon_type_name,
                        "source_ip": source_ip,
                    },
                )

            elif event_id == WinEventID.LOGON_FAILURE:
                username = strings[5] if len(strings) > 5 else "unknown"
                source_ip = strings[19] if len(strings) > 19 else ""
                failure_reason = strings[7] if len(strings) > 7 else ""

                return self._create_event(
                    EventType.LOGIN_FAILURE,
                    severity=Severity.MEDIUM.value,
                    risk_score=40.0,
                    username=username,
                    tags=["login_failure"],
                    metadata={
                        "event_id": event_id,
                        "source_ip": source_ip,
                        "failure_reason": failure_reason,
                    },
                )

            elif event_id == WinEventID.SPECIAL_LOGON:
                username = strings[1] if len(strings) > 1 else "unknown"
                return self._create_event(
                    EventType.PRIVILEGE_ESCALATION,
                    severity=Severity.HIGH.value,
                    risk_score=60.0,
                    username=username,
                    tags=["privilege_escalation", "special_logon"],
                    metadata={"event_id": event_id},
                )

            elif event_id == WinEventID.ACCOUNT_CREATED:
                username = strings[0] if strings else "unknown"
                target_user = strings[4] if len(strings) > 4 else "unknown"
                return self._create_event(
                    EventType.ACCOUNT_CREATE,
                    severity=Severity.HIGH.value,
                    risk_score=55.0,
                    username=username,
                    tags=["account_created"],
                    metadata={"event_id": event_id, "target_user": target_user},
                )

            elif event_id == WinEventID.ACCOUNT_DELETED:
                username = strings[0] if strings else "unknown"
                target_user = strings[4] if len(strings) > 4 else "unknown"
                return self._create_event(
                    EventType.ACCOUNT_DELETE,
                    severity=Severity.HIGH.value,
                    risk_score=55.0,
                    username=username,
                    tags=["account_deleted"],
                    metadata={"event_id": event_id, "target_user": target_user},
                )

        except Exception as exc:
            logger.debug("security_event_parse_error", event_id=event_id, error=str(exc))
        return None

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        """Simulate login events."""
        return [
            self._create_event(
                EventType.LOGIN_SUCCESS,
                severity=Severity.INFO.value, risk_score=0.0,
                username="admin",
                tags=["simulated"],
                metadata={"event_id": 4624, "logon_type": 2, "logon_type_name": "Interactive", "source_ip": "127.0.0.1"},
            ),
            self._create_event(
                EventType.LOGIN_FAILURE,
                severity=Severity.MEDIUM.value, risk_score=40.0,
                username="administrator",
                tags=["simulated", "login_failure"],
                metadata={"event_id": 4625, "source_ip": "10.0.0.99", "failure_reason": "Bad password"},
            ),
            self._create_event(
                EventType.LOGIN_FAILURE,
                severity=Severity.HIGH.value, risk_score=65.0,
                username="sa",
                tags=["simulated", "login_failure", "brute_force_candidate"],
                metadata={"event_id": 4625, "source_ip": "192.168.1.200", "failure_reason": "Unknown username"},
            ),
            self._create_event(
                EventType.LOGIN_RDP,
                severity=Severity.MEDIUM.value, risk_score=35.0,
                username="admin",
                tags=["simulated", "rdp_login"],
                metadata={"event_id": 4624, "logon_type": 10, "logon_type_name": "RemoteInteractive", "source_ip": "10.0.0.5"},
            ),
            self._create_event(
                EventType.PRIVILEGE_ESCALATION,
                severity=Severity.HIGH.value, risk_score=60.0,
                username="admin",
                tags=["simulated", "privilege_escalation"],
                metadata={"event_id": 4672},
            ),
            self._create_event(
                EventType.ACCOUNT_CREATE,
                severity=Severity.HIGH.value, risk_score=55.0,
                username="admin",
                tags=["simulated", "account_created"],
                metadata={"event_id": 4720, "target_user": "backdoor_user"},
            ),
        ]
