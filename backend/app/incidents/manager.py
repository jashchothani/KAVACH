"""
KAVACH Incident Correlation & Lifecycle Manager.

Aggregates related security events across single endpoints and the entire fleet
into cohesive, high-confidence incident records:
1. Multi-vector single-host attack chains (Defense evasion -> Credential dump -> Execution).
2. Cross-host lateral movement (SMB, RDP, WinRM, SSH, PsExec across multiple endpoints).
3. Cross-host shared C2 / threat infrastructure beaconing (Multiple endpoints contacting same IOC).
4. Cross-host credential spraying & distributed brute force.
5. Cross-host ransomware & Canary honeypot tripping.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)

# Administrative and lateral movement ports
LATERAL_PORTS = frozenset({445, 139, 3389, 5985, 5986, 22, 23})
LATERAL_PROCESSES = frozenset({
    "psexec.exe", "psexesvc.exe", "wmic.exe", "winrs.exe", "mstsc.exe",
    "ssh.exe", "powershell.exe", "pwsh.exe", "cmd.exe"
})


class IncidentCorrelationManager:
    """Enterprise multi-host & single-endpoint incident correlation engine."""

    def __init__(self, window_seconds: int = 600) -> None:
        self._window = window_seconds
        # Endpoint-specific clusters: host_id -> cluster
        self._endpoint_clusters: dict[str, dict[str, Any]] = {}
        # Shared C2 / IOC clusters: indicator (ip/domain) -> cluster
        self._shared_c2_clusters: dict[str, dict[str, Any]] = {}
        # Lateral movement clusters: pair or target_ip -> cluster
        self._lateral_clusters: dict[str, dict[str, Any]] = {}
        # Credential spray clusters: username or source_ip -> cluster
        self._credential_clusters: dict[str, dict[str, Any]] = {}
        # Deduplication of emitted incidents to prevent alert storms: incident_key -> emit_time
        self._emitted_incidents: dict[str, float] = {}

    def _cleanup_expired(self, now: float) -> None:
        """Evict clusters outside the sliding correlation window."""
        for mapping in (
            self._endpoint_clusters,
            self._shared_c2_clusters,
            self._lateral_clusters,
            self._credential_clusters,
        ):
            expired = [k for k, v in mapping.items() if now - v.get("last_seen", 0) > self._window]
            for k in expired:
                mapping.pop(k, None)

        # Cleanup emitted incident dedup cache (keep 15 minutes)
        expired_emits = [k for k, ts in self._emitted_incidents.items() if now - ts > 900]
        for k in expired_emits:
            self._emitted_incidents.pop(k, None)

    def correlate(self, event: dict[str, Any]) -> dict[str, Any] | None:
        """
        Evaluate an incoming high-risk event for single-endpoint chains and cross-host attacks.
        Returns a rich incident candidate dict if a threshold is reached, or None.
        """
        now = time.time()
        self._cleanup_expired(now)

        host = event.get("host_id") or event.get("hostname") or event.get("device_id") or "kavach-node-default"
        hostname = event.get("hostname") or host
        event_type = str(event.get("event_type") or "").lower()
        collector = str(event.get("collector") or "").lower()
        mitre = event.get("mitre") or {}
        technique_id = mitre.get("technique_id")
        dest_ip = str(event.get("destination_ip") or "")
        dest_port = event.get("destination_port")
        domain = str(event.get("domain") or "")
        process_name = str(event.get("process_name") or "").lower()
        risk_score = float(event.get("risk_score") or 0.0)

        # ---------------------------------------------------------------------
        # 1. CROSS-HOST SHARED C2 / EXTERNAL THREAT INFRASTRUCTURE CORRELATION
        # ---------------------------------------------------------------------
        # If an external IP or domain is contacted by multiple distinct hosts
        for indicator in (dest_ip, domain):
            if indicator and not indicator.startswith(("10.", "192.168.", "172.16.", "127.", "localhost")):
                if indicator not in self._shared_c2_clusters:
                    self._shared_c2_clusters[indicator] = {
                        "indicator": indicator,
                        "first_seen": now,
                        "last_seen": now,
                        "hosts": set(),
                        "events": [],
                        "techniques": set(),
                    }

                c2_cluster = self._shared_c2_clusters[indicator]
                c2_cluster["last_seen"] = now
                c2_cluster["hosts"].add(hostname)
                c2_cluster["events"].append(event)
                if technique_id:
                    c2_cluster["techniques"].add(technique_id)

                # Cross-host threshold: 2 or more distinct endpoints contacting same external indicator
                if len(c2_cluster["hosts"]) >= 2:
                    dedup_key = f"c2:{indicator}"
                    if dedup_key not in self._emitted_incidents:
                        self._emitted_incidents[dedup_key] = now
                        host_list = sorted(list(c2_cluster["hosts"]))
                        logger.warning("cross_host_c2_detected", indicator=indicator, hosts=host_list)
                        return {
                            "is_incident_candidate": True,
                            "correlation_type": "cross_host_shared_c2",
                            "severity": "critical",
                            "title": f"🚨 Distributed Multi-Host Campaign: Shared C2 Beaconing to {indicator}",
                            "affected_hosts": host_list,
                            "event_count": len(c2_cluster["events"]),
                            "techniques": list(c2_cluster["techniques"]) or ["T1071"],
                            "indicators": [indicator],
                            "root_cause": (
                                f"Multiple endpoints ({', '.join(host_list)}) established outbound connections "
                                f"to common threat infrastructure: {indicator}."
                            ),
                            "recommended_playbook": "block_c2_network_and_isolate_hosts",
                            "evidence_summary": [
                                f"Detected synchronized beaconing from {len(host_list)} hosts to external indicator {indicator}",
                                f"Involved hosts: {', '.join(host_list)}",
                                f"Observed techniques: {', '.join(c2_cluster['techniques']) if c2_cluster['techniques'] else 'Standard C2 protocol'}",
                            ],
                        }

        # ---------------------------------------------------------------------
        # 2. CROSS-HOST LATERAL MOVEMENT CORRELATION
        # ---------------------------------------------------------------------
        # Check for admin ports (SMB 445, RDP 3389, WinRM 5985/5986, SSH 22) or remote execution tools
        try:
            port_num = int(dest_port) if dest_port is not None else 0
        except (ValueError, TypeError):
            port_num = 0

        is_lateral_port = port_num in LATERAL_PORTS
        is_lateral_proc = any(proc in process_name for proc in LATERAL_PROCESSES)

        if is_lateral_port or is_lateral_proc or "lateral" in event_type:
            # Group by target IP or remote connection
            lat_key = f"lat:{dest_ip or process_name}"
            if lat_key not in self._lateral_clusters:
                self._lateral_clusters[lat_key] = {
                    "first_seen": now,
                    "last_seen": now,
                    "source_hosts": set(),
                    "target": dest_ip or "internal_network",
                    "events": [],
                    "techniques": set(),
                }

            lat_cluster = self._lateral_clusters[lat_key]
            lat_cluster["last_seen"] = now
            lat_cluster["source_hosts"].add(hostname)
            lat_cluster["events"].append(event)
            if technique_id:
                lat_cluster["techniques"].add(technique_id)
            else:
                lat_cluster["techniques"].add("T1021")  # Remote Services

            if len(lat_cluster["events"]) >= 2:
                dedup_key = f"lat_emit:{lat_key}"
                if dedup_key not in self._emitted_incidents:
                    self._emitted_incidents[dedup_key] = now
                    source_hosts = sorted(list(lat_cluster["source_hosts"]))
                    logger.warning("cross_host_lateral_movement_detected", target=lat_cluster["target"], sources=source_hosts)
                    return {
                        "is_incident_candidate": True,
                        "correlation_type": "cross_host_lateral_movement",
                        "severity": "critical",
                        "title": f"🚨 Lateral Movement Detected: Network Pivot towards {lat_cluster['target']}",
                        "affected_hosts": source_hosts,
                        "event_count": len(lat_cluster["events"]),
                        "techniques": list(lat_cluster["techniques"]),
                        "indicators": [lat_cluster["target"], process_name] if process_name else [lat_cluster["target"]],
                        "root_cause": (
                            f"Suspicious inter-host lateral activity originating from {', '.join(source_hosts)} "
                            f"targeting {lat_cluster['target']} via port {port_num or 'admin service'}."
                        ),
                        "recommended_playbook": "quarantine_originating_host_and_revoke_credentials",
                        "evidence_summary": [
                            f"High-risk remote administration probe from host(s): {', '.join(source_hosts)}",
                            f"Target: {lat_cluster['target']} (Port {port_num or 'N/A'}, Process {process_name or 'N/A'})",
                            f"Identified MITRE techniques: {', '.join(lat_cluster['techniques'])}",
                        ],
                    }

        # ---------------------------------------------------------------------
        # 3. CROSS-HOST CREDENTIAL SPRAYING CORRELATION
        # ---------------------------------------------------------------------
        if "login" in event_type or "auth" in event_type or "login_failed" in event_type or "4625" in str(event.get("event_id") or ""):
            user = str(event.get("username") or "target_user")
            spray_key = f"spray:{user}"
            if spray_key not in self._credential_clusters:
                self._credential_clusters[spray_key] = {
                    "username": user,
                    "first_seen": now,
                    "last_seen": now,
                    "hosts": set(),
                    "events": [],
                }

            spray_cluster = self._credential_clusters[spray_key]
            spray_cluster["last_seen"] = now
            spray_cluster["hosts"].add(hostname)
            spray_cluster["events"].append(event)

            # Spray across 2+ hosts or 4+ failed logins in the window
            if len(spray_cluster["hosts"]) >= 2 or len(spray_cluster["events"]) >= 4:
                dedup_key = f"spray_emit:{user}"
                if dedup_key not in self._emitted_incidents:
                    self._emitted_incidents[dedup_key] = now
                    host_list = sorted(list(spray_cluster["hosts"]))
                    return {
                        "is_incident_candidate": True,
                        "correlation_type": "cross_host_credential_spray",
                        "severity": "high",
                        "title": f"🚨 Distributed Credential Spraying Attack on User: '{user}'",
                        "affected_hosts": host_list,
                        "event_count": len(spray_cluster["events"]),
                        "techniques": ["T1110.003", "T1078"],
                        "indicators": [user],
                        "root_cause": f"Rapid repeated authentication failures targeting account '{user}' across {len(host_list)} hosts.",
                        "recommended_playbook": "lock_user_account_and_force_mfa",
                        "evidence_summary": [
                            f"Detected {len(spray_cluster['events'])} failed authentication attempts across hosts: {', '.join(host_list)}",
                            f"Targeted account: {user}",
                            "MITRE Technique: T1110 (Brute Force / Password Spraying)",
                        ],
                    }

        # ---------------------------------------------------------------------
        # 4. SINGLE-ENDPOINT MULTI-VECTOR ATTACK CHAIN CORRELATION
        # ---------------------------------------------------------------------
        cluster_key = f"host:{hostname}"
        if cluster_key not in self._endpoint_clusters:
            self._endpoint_clusters[cluster_key] = {
                "host": hostname,
                "first_seen": now,
                "last_seen": now,
                "events": [],
                "techniques": set(),
                "severities": set(),
                "max_risk": 0.0,
            }

        cluster = self._endpoint_clusters[cluster_key]
        cluster["last_seen"] = now
        cluster["events"].append(event)
        cluster["max_risk"] = max(cluster["max_risk"], risk_score)
        if technique_id:
            cluster["techniques"].add(technique_id)
        cluster["severities"].add(str(event.get("severity") or "high").lower())

        # If 3 or more high-risk events or multiple MITRE techniques detected on this endpoint
        if len(cluster["events"]) >= 3 or len(cluster["techniques"]) >= 2:
            dedup_key = f"single_host_emit:{hostname}"
            if dedup_key not in self._emitted_incidents:
                self._emitted_incidents[dedup_key] = now
                technique_list = sorted(list(cluster["techniques"]))
                return {
                    "is_incident_candidate": True,
                    "correlation_type": "single_host_attack_chain",
                    "severity": "critical" if ("critical" in cluster["severities"] or cluster["max_risk"] >= 80) else "high",
                    "title": f"Correlated Attack Chain on {hostname}",
                    "affected_hosts": [hostname],
                    "event_count": len(cluster["events"]),
                    "techniques": technique_list,
                    "indicators": [process_name] if process_name else [],
                    "root_cause": f"Multi-signal security anomalies detected on endpoint '{hostname}'.",
                    "recommended_playbook": "isolate_device",
                    "evidence_summary": [
                        f"Observed {len(cluster['events'])} related telemetry anomalies within {self._window}s window",
                        f"Triggered MITRE techniques: {', '.join(technique_list) if technique_list else 'Multi-vector anomaly'}",
                        f"Peak composite risk score: {round(cluster['max_risk'], 1)}/100",
                    ],
                }

        return None
