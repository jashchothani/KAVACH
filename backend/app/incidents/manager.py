"""
KAVACH Incident Correlation & Lifecycle Manager.

Aggregates related security events into cohesive incidents:
- Deduplicates repetitive alerts
- Groups by time-window, device, process, or MITRE technique
- Manages lifecycle: DETECTED -> TRIAGED -> INVESTIGATING -> CONTAINED -> RESOLVED
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


class IncidentCorrelationManager:
    """Groups related events into high-confidence incident records."""

    def __init__(self, window_seconds: int = 300) -> None:
        self._window = window_seconds
        self._active_clusters: dict[str, dict[str, Any]] = {}

    def correlate(self, event: dict[str, Any]) -> dict[str, Any] | None:
        """
        Check if an incoming high-risk event correlates with existing active clusters.
        Returns correlated incident summary if a multi-signal attack chain is identified.
        """
        device = event.get("device_id") or event.get("hostname") or "local_device"
        event_type = event.get("event_type", "unknown")
        tags = event.get("tags") or []
        mitre = event.get("mitre") or {}
        now = time.time()

        # Clean expired clusters
        expired_keys = [k for k, v in self._active_clusters.items() if now - v["last_seen"] > self._window]
        for k in expired_keys:
            del self._active_clusters[k]

        cluster_key = f"{device}"
        if cluster_key not in self._active_clusters:
            self._active_clusters[cluster_key] = {
                "device": device,
                "first_seen": now,
                "last_seen": now,
                "events": [],
                "techniques": set(),
                "severities": set(),
            }

        cluster = self._active_clusters[cluster_key]
        cluster["last_seen"] = now
        cluster["events"].append(event)
        if mitre.get("technique_id"):
            cluster["techniques"].add(mitre["technique_id"])
        cluster["severities"].add(event.get("severity", "info"))

        # If 3 or more high-risk events or multiple MITRE techniques detected on same endpoint within window
        if len(cluster["events"]) >= 3 or len(cluster["techniques"]) >= 2:
            return {
                "is_incident_candidate": True,
                "device": device,
                "event_count": len(cluster["events"]),
                "techniques": list(cluster["techniques"]),
                "title": f"Correlated Attack Chain on {device}",
                "severity": "critical" if "critical" in cluster["severities"] else "high",
                "evidence_summary": [
                    f"Observed {len(cluster['events'])} related telemetry anomalies within {self._window}s window",
                    f"Triggered MITRE techniques: {', '.join(cluster['techniques']) if cluster['techniques'] else 'Multi-vector anomaly'}",
                ],
            }

        return None
