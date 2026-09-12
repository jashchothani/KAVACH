"""
KAVACH ML Feature Extraction Engine.

Extracts real, meaningful numerical feature vectors from raw telemetry events.
Never feeds raw strings directly to Isolation Forest.
"""

from __future__ import annotations

import math
from typing import Any
import numpy as np

from app.core.constants import LOLBINS, SUSPICIOUS_EXTENSIONS

# Common standard ports (web, secure mail, dns, etc.)
STANDARD_PORTS = frozenset({80, 443, 53, 123, 8080, 8443, 22, 21, 25, 587, 993, 995})

# Canonical feature schema keys
FEATURE_SCHEMA = [
    "risk_score_norm",
    "severity_weight",
    "is_lolbin",
    "has_suspicious_ext",
    "has_mitre_mapping",
    "is_nonstandard_port",
    "destination_port_norm",
    "dns_query_length",
    "encoded_cmd_flag",
    "collector_weight",
]


class FeatureExtractor:
    """Extracts normalized numerical vectors from security telemetry."""

    SEVERITY_WEIGHTS = {
        "critical": 1.0,
        "high": 0.8,
        "medium": 0.5,
        "low": 0.2,
        "info": 0.05,
    }

    COLLECTOR_WEIGHTS = {
        "powershell": 0.9,
        "sysmon": 0.85,
        "network": 0.75,
        "process": 0.7,
        "login": 0.6,
        "file_monitor": 0.65,
        "usb": 0.5,
        "windows_eventlog": 0.5,
        "dns": 0.6,
    }

    def extract_vector(self, event: dict[str, Any]) -> np.ndarray:
        """Convert an event dictionary into a normalized 1D float array."""
        features_dict = self.extract_features_dict(event)
        return np.array([features_dict[k] for k in FEATURE_SCHEMA], dtype=np.float32)

    def extract_features_dict(self, event: dict[str, Any]) -> dict[str, float]:
        """Convert an event dictionary into a named feature map."""
        # 1. Risk score normalized 0.0 - 1.0
        risk_score = float(event.get("risk_score") or 0.0)
        risk_score_norm = min(1.0, max(0.0, risk_score / 100.0))

        # 2. Severity weight
        sev = str(event.get("severity") or "info").lower()
        severity_weight = self.SEVERITY_WEIGHTS.get(sev, 0.05)

        # 3. LOLBIN flag
        proc = str(event.get("process_name") or "").lower()
        cmd = str(event.get("command_line") or "").lower()
        is_lolbin = 1.0 if any(bin_name in proc or bin_name in cmd for bin_name in LOLBINS) else 0.0

        # 4. Suspicious file extension flag
        file_path = str(event.get("file_path") or "").lower()
        has_suspicious_ext = 1.0 if any(file_path.endswith(ext) for ext in SUSPICIOUS_EXTENSIONS) else 0.0

        # 5. MITRE technique presence
        mitre = event.get("mitre") or {}
        has_mitre_mapping = 1.0 if mitre.get("technique_id") else 0.0

        # 6. Port analysis
        dest_port = event.get("destination_port")
        try:
            port_num = int(dest_port) if dest_port is not None else 0
        except (ValueError, TypeError):
            port_num = 0

        is_nonstandard_port = 0.0
        if port_num > 0 and port_num not in STANDARD_PORTS:
            is_nonstandard_port = 1.0

        dest_port_norm = min(1.0, float(port_num) / 65535.0) if port_num > 0 else 0.0

        # 7. DNS query length anomaly
        domain = str(event.get("domain") or event.get("dns_query") or "")
        dns_query_length = min(1.0, len(domain) / 100.0) if domain else 0.0

        # 8. Encoded command flag
        tags = event.get("tags") or []
        encoded_cmd_flag = 1.0 if ("encoded_command" in tags or "encoded" in cmd or "-enc" in cmd) else 0.0

        # 9. Collector baseline weight
        collector = str(event.get("collector") or event.get("source_collector") or "generic").lower()
        collector_weight = self.COLLECTOR_WEIGHTS.get(collector, 0.4)

        return {
            "risk_score_norm": risk_score_norm,
            "severity_weight": severity_weight,
            "is_lolbin": is_lolbin,
            "has_suspicious_ext": has_suspicious_ext,
            "has_mitre_mapping": has_mitre_mapping,
            "is_nonstandard_port": is_nonstandard_port,
            "destination_port_norm": dest_port_norm,
            "dns_query_length": dns_query_length,
            "encoded_cmd_flag": encoded_cmd_flag,
            "collector_weight": collector_weight,
        }
