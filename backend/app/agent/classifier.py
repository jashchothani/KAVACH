"""
KAVACH Edge Severity Classifier.

Performs immediate, low-overhead heuristic sorting on the monitored host before
buffering and network transmission. Categorizes events into:
- CRITICAL: Immediate threat or evasion attempt (priority transmission <500ms)
- HIGH: Suspicious network beaconing, honeypot hits, unauthorized USB, temp path execution (<1s)
- MEDIUM: Failed auth bursts, persistence hooks, FIM configuration modifications (3s batch)
- LOW: Routine OS processes, benign network and DNS telemetry (10s batch)
- STATISTICAL: Host performance metrics, vital health heartbeats, collector stats (60s window)
"""

from __future__ import annotations

import re
from enum import Enum
from typing import Any


class EdgeTier(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    STATISTICAL = "statistical"


class EdgeClassifier:
    """Fast, memory-efficient edge heuristic classifier."""

    # High-risk reverse shell / C2 beaconing ports
    SUSPICIOUS_PORTS = {4444, 1337, 8888, 5555, 6667, 9001, 4445, 31337, 12345}

    # Malicious process names & credential dumpers
    CRITICAL_PROCESS_NAMES = {
        "mimikatz.exe", "procdump.exe", "pwdump.exe", "lazagne.exe",
        "cobaltstrike.exe", "meterpreter.exe", "psexec.exe", "sharphound.exe",
        "bloodhound.exe", "rubeus.exe", "safetykatz.exe",
    }

    # Ransomware & evasion command patterns
    CRITICAL_PATTERNS = [
        re.compile(r"vssadmin\s+delete\s+shadows", re.IGNORECASE),
        re.compile(r"wbadmin\s+delete\s+catalog", re.IGNORECASE),
        re.compile(r"wevtutil\s+cl\s+(Security|System)", re.IGNORECASE),
        re.compile(r"Set-MpPreference\s+.*-DisableRealtimeMonitoring\s+\$true", re.IGNORECASE),
        re.compile(r"-ExecutionPolicy\s+Bypass\s+.*(-w\s+hidden|-enc)", re.IGNORECASE),
        re.compile(r"DownloadString\s*\(\s*['\"]http", re.IGNORECASE),
        re.compile(r"Invoke-Expression\s*\(New-Object\s+Net\.WebClient", re.IGNORECASE),
    ]

    # Suspicious execution directories
    TEMP_DIR_PATTERNS = [
        re.compile(r"[\\/]AppData[\\/]Local[\\/]Temp[\\/]", re.IGNORECASE),
        re.compile(r"[\\/]Windows[\\/]Temp[\\/]", re.IGNORECASE),
        re.compile(r"/tmp/|/dev/shm/|/var/tmp/", re.IGNORECASE),
    ]

    # Ransomware extensions
    RANSOM_EXTENSIONS = {
        ".locked", ".crypto", ".crypt", ".wnry", ".wannacry",
        ".locky", ".cerber", ".blackmatter", ".revil",
    }

    def classify(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Evaluate raw event and attach edge classification tags:
        - edge_tier: EdgeTier value
        - edge_score: 0.0 - 100.0
        - edge_reason: Concise justification
        """
        collector = str(event.get("collector") or "").lower()
        event_type = str(event.get("event_type") or "").lower()
        meta = event.get("metadata") or {}

        # 1. STATISTICAL Check
        if collector == "system" or event_type in ("metrics", "heartbeat", "stats", "telemetry_stats"):
            return self._tag(event, EdgeTier.STATISTICAL, 5.0, "Host metrics or system telemetry heartbeat")

        if "cpu_percent" in meta or "memory_percent" in meta:
            if not event.get("severity") or str(event.get("severity")).lower() in ("info", "low"):
                return self._tag(event, EdgeTier.STATISTICAL, 5.0, "Host resource utilization snapshot")

        # 2. CRITICAL Check: Process and Command Line Analysis
        proc_name = str(event.get("process_name") or meta.get("process_name") or meta.get("image") or "").lower()
        cmd_line = str(meta.get("command_line") or meta.get("cmdline") or event.get("command_line") or "")
        script_text = str(event.get("script_text") or meta.get("script_text") or "")

        if proc_name in self.CRITICAL_PROCESS_NAMES:
            return self._tag(event, EdgeTier.CRITICAL, 95.0, f"Critical hack tool or credential dumper invoked: {proc_name}")

        full_text = f"{cmd_line} {script_text}"
        for pattern in self.CRITICAL_PATTERNS:
            if pattern.search(full_text):
                return self._tag(event, EdgeTier.CRITICAL, 98.0, f"Critical defense evasion or ransomware command pattern matched")

        # CRITICAL Check: Honeypot & Defender Alerts
        if collector == "honeypot" or "honeypot" in event_type:
            return self._tag(event, EdgeTier.CRITICAL, 92.0, "Active canary honeypot sensor triggered")

        if collector == "defender":
            threat_name = meta.get("threat_name") or "malware"
            threat_status = str(meta.get("threat_status") or "").lower()
            if "active" in threat_status or "failed" in threat_status:
                return self._tag(event, EdgeTier.CRITICAL, 95.0, f"Active Windows Defender malware threat: {threat_name}")
            return self._tag(event, EdgeTier.HIGH, 75.0, f"Windows Defender alert detected: {threat_name}")

        # CRITICAL Check: Ransomware file extensions
        file_path = str(event.get("file_path") or meta.get("file_path") or "").lower()
        for ext in self.RANSOM_EXTENSIONS:
            if file_path.endswith(ext):
                return self._tag(event, EdgeTier.CRITICAL, 96.0, f"Known ransomware extension detected on file modification: {ext}")

        # 3. HIGH Check: Suspicious Ports & Ingress/Egress
        dest_port = event.get("destination_port") or meta.get("remote_port") or meta.get("dst_port")
        try:
            port_num = int(dest_port) if dest_port else 0
        except (ValueError, TypeError):
            port_num = 0

        if port_num in self.SUSPICIOUS_PORTS:
            return self._tag(event, EdgeTier.HIGH, 82.0, f"Outbound connection to known suspicious/C2 port {port_num}")

        # HIGH Check: Execution from temp paths
        if proc_name:
            for t_pattern in self.TEMP_DIR_PATTERNS:
                if t_pattern.search(proc_name) or t_pattern.search(str(meta.get("exe_path") or "")):
                    return self._tag(event, EdgeTier.HIGH, 78.0, f"Executable running from temporary directory")

        # HIGH Check: High-entropy or overly long DNS domains (DGA / Tunneling)
        domain = str(event.get("domain") or event.get("query_name") or meta.get("query") or "")
        if domain and len(domain) > 40 and not domain.endswith(".akadns.net"):
            return self._tag(event, EdgeTier.HIGH, 74.0, f"Suspicious long or high-entropy DNS query: {domain[:35]}...")

        # HIGH Check: Removable Media (USB)
        if collector == "usb" or "usb" in event_type:
            action = str(meta.get("action") or "").lower()
            if "inserted" in action or "mounted" in action:
                return self._tag(event, EdgeTier.HIGH, 70.0, f"Removable USB storage device attached")

        # 4. MEDIUM Check: Auth, Persistence & FIM
        if collector in ("auth", "ssh") or "auth" in event_type:
            if "failed" in event_type or "failed" in str(meta.get("status", "")).lower():
                return self._tag(event, EdgeTier.MEDIUM, 60.0, "Failed authentication or credential challenge attempt")

        if collector == "registry" and any(k in file_path.lower() for k in ("currentversion\\run", "services\\", "startup")):
            return self._tag(event, EdgeTier.MEDIUM, 65.0, "Registry persistence key modification")

        if collector == "fim" or "fim" in event_type:
            action = str(event.get("action") or meta.get("action") or "modified").lower()
            return self._tag(event, EdgeTier.MEDIUM, 55.0, f"Monitored file integrity alteration: {action}")

        if collector == "wifi" and "unsecured" in str(meta.get("ssid_security", "")).lower():
            return self._tag(event, EdgeTier.MEDIUM, 50.0, "Association with unsecured wireless network")

        # 5. LOW Check: Routine OS Activity
        explicit_sev = str(event.get("severity") or "").lower()
        if explicit_sev == "critical":
            return self._tag(event, EdgeTier.CRITICAL, 90.0, "Upstream marked critical")
        elif explicit_sev == "high":
            return self._tag(event, EdgeTier.HIGH, 75.0, "Upstream marked high")
        elif explicit_sev == "medium":
            return self._tag(event, EdgeTier.MEDIUM, 50.0, "Upstream marked medium")

        return self._tag(event, EdgeTier.LOW, 15.0, "Routine system operation")

    def _tag(self, event: dict[str, Any], tier: EdgeTier, score: float, reason: str) -> dict[str, Any]:
        """Attach edge classification metadata to event copy."""
        event["edge_tier"] = tier.value
        event["edge_score"] = score
        event["edge_reason"] = reason
        # Ensure severity is synchronized if unset
        if not event.get("severity"):
            if tier == EdgeTier.CRITICAL:
                event["severity"] = "CRITICAL"
            elif tier == EdgeTier.HIGH:
                event["severity"] = "HIGH"
            elif tier == EdgeTier.MEDIUM:
                event["severity"] = "MEDIUM"
            else:
                event["severity"] = "LOW"
        return event
