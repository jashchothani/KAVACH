"""
KAVACH Raksha AI Context Sanitizer.

Enforces strict privacy and security boundaries:
- Redacts passwords, secrets, tokens, and API keys.
- Minimizes personally identifiable information.
- Structures telemetry into concise, safe evidence dictionaries.
"""

from __future__ import annotations

import re
from typing import Any

# Regular expressions for credential and secret pattern stripping
REDACT_PATTERNS = [
    (re.compile(r"(?i)(bearer\s+)[a-zA-Z0-9_\-\.]{20,}", re.IGNORECASE), r"\1[REDACTED_TOKEN]"),
    (re.compile(r"(?i)(api[_\-]?key|apikey|secret|password|passwd|token)['\"]?\s*[:=]\s*['\"]?[^\s,'\"]+", re.IGNORECASE), r"\1=[REDACTED]"),
    (re.compile(r"(?i)nvapi-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE), "[REDACTED_NVIDIA_KEY]"),
    (re.compile(r"(?i)eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}", re.IGNORECASE), "[REDACTED_JWT]"),
]


def sanitize_text(text: str) -> str:
    """Scrub sensitive secrets, tokens, and credentials from a text string."""
    if not text:
        return ""
    cleaned = text
    for pattern, replacement in REDACT_PATTERNS:
        cleaned = pattern.sub(replacement, cleaned)
    return cleaned


def sanitize_telemetry(event: dict[str, Any]) -> dict[str, Any]:
    """
    Format telemetry into a sanitized, structured context dictionary for Raksha AI.
    Strips raw memory, credentials, and full environment blocks.
    """
    return {
        "event_type": event.get("event_type", "unknown"),
        "severity": event.get("severity", "info"),
        "risk_score": event.get("risk_score", 0.0),
        "device": event.get("device_id") or event.get("hostname", "local_endpoint"),
        "process_name": sanitize_text(str(event.get("process_name") or "")),
        "destination": sanitize_text(str(event.get("destination_ip") or event.get("domain") or "")),
        "mitre_technique": event.get("mitre", {}).get("technique_id"),
        "indicators": [sanitize_text(str(i)) for i in (event.get("tags") or [])],
        "ml_anomaly": event.get("is_anomaly", False),
    }
