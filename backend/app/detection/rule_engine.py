"""
KAVACH Deterministic Rule Engine.

Contains deterministic rules for known adversary behaviors, mapped to MITRE ATT&CK techniques.
Provides deterministic scoring and explanations.
"""

from __future__ import annotations

from typing import Any
from app.core.constants import LOLBINS, SUSPICIOUS_EXTENSIONS, RANSOMWARE_EXTENSIONS

# Rule definitions
RULES = [
    {
        "rule_id": "RUL-001",
        "name": "Encoded PowerShell Command",
        "description": "Base64 or obfuscated command line execution in PowerShell",
        "severity": "high",
        "mitre_id": "T1027",
        "mitre_name": "Obfuscated Files or Information",
        "tactic": "Defense Evasion",
        "score": 75.0,
        "check": lambda e: (
            "encoded_command" in (e.get("tags") or [])
            or "-enc" in str(e.get("command_line") or "").lower()
            or "frombase64string" in str(e.get("command_line") or "").lower()
        ),
    },
    {
        "rule_id": "RUL-002",
        "name": "Living-off-the-Land Binary Execution",
        "description": "Execution of legitimate system utility often leveraged by attackers",
        "severity": "medium",
        "mitre_id": "T1218",
        "mitre_name": "System Binary Proxy Execution",
        "tactic": "Defense Evasion",
        "score": 60.0,
        "check": lambda e: any(
            bin_name in str(e.get("process_name") or "").lower() for bin_name in LOLBINS
        ),
    },
    {
        "rule_id": "RUL-003",
        "name": "Ransomware Extension Anomaly",
        "description": "File created or renamed with known ransomware extension",
        "severity": "critical",
        "mitre_id": "T1486",
        "mitre_name": "Data Encrypted for Impact",
        "tactic": "Impact",
        "score": 95.0,
        "check": lambda e: any(
            str(e.get("file_path") or "").lower().endswith(ext) for ext in RANSOMWARE_EXTENSIONS
        ),
    },
    {
        "rule_id": "RUL-004",
        "name": "Suspicious Outbound Port",
        "description": "Connection to non-standard or dangerous network service port",
        "severity": "medium",
        "mitre_id": "T1571",
        "mitre_name": "Non-Standard Port",
        "tactic": "Command and Control",
        "score": 50.0,
        "check": lambda e: int(e.get("destination_port") or 0) in {4444, 1337, 6667, 31337, 8888, 9001},
    },
    {
        "rule_id": "RUL-005",
        "name": "LSASS Memory Access",
        "description": "Attempt to open or dump Local Security Authority Subsystem Service",
        "severity": "critical",
        "mitre_id": "T1003.001",
        "mitre_name": "LSASS Memory",
        "tactic": "Credential Access",
        "score": 95.0,
        "check": lambda e: (
            "lsass_access" in (e.get("tags") or [])
            or "lsass.exe" in str(e.get("command_line") or "").lower()
        ),
    },
    {
        "rule_id": "RUL-006",
        "name": "Failed Authentication Spike",
        "description": "Multiple logon failures indicating possible brute force",
        "severity": "high",
        "mitre_id": "T1110",
        "mitre_name": "Brute Force",
        "tactic": "Credential Access",
        "score": 70.0,
        "check": lambda e: e.get("event_type") == "login_failure",
    },
    {
        "rule_id": "RUL-007",
        "name": "Registry Persistence Modification",
        "description": "Modification of Run or RunOnce startup registry keys",
        "severity": "high",
        "mitre_id": "T1547.001",
        "mitre_name": "Registry Run Keys",
        "tactic": "Persistence",
        "score": 75.0,
        "check": lambda e: (
            "registry" in str(e.get("collector") or "").lower()
            and any(k in str(e.get("metadata") or {}).lower() for k in ["run", "runonce", "currentversion"])
        ),
    },
]


class RuleEngine:
    """Evaluates telemetry events against deterministic detection rules."""

    def evaluate(self, event: dict[str, Any]) -> dict[str, Any]:
        """Evaluate an event against all active rules."""
        matched_rules = []
        max_score = 0.0
        primary_mitre = None

        for rule in RULES:
            try:
                if rule["check"](event):
                    matched_rules.append({
                        "rule_id": rule["rule_id"],
                        "name": rule["name"],
                        "severity": rule["severity"],
                        "score": rule["score"],
                        "mitre_id": rule["mitre_id"],
                        "mitre_name": rule["mitre_name"],
                        "tactic": rule["tactic"],
                    })
                    if rule["score"] > max_score:
                        max_score = rule["score"]
                        primary_mitre = {
                            "technique_id": rule["mitre_id"],
                            "technique_name": rule["mitre_name"],
                            "tactic": rule["tactic"],
                        }
            except Exception:
                continue

        return {
            "matches": matched_rules,
            "rule_score": max_score,
            "matched_count": len(matched_rules),
            "primary_mitre": primary_mitre,
        }
