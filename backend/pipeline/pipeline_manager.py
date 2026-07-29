"""
KAVACH Pipeline Manager.

Orchestrates the full event processing pipeline:
Raw → Normalize → Deduplicate → Enrich → MITRE Map → Risk Score → Correlate → Store/Alert

Subscribes to RAW_EVENTS on the message bus and pushes processed events
through each stage asynchronously.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from core.config import get_settings
from core.constants import (
    EventType, Severity, Topic, AlertStatus, IOCType,
    SUSPICIOUS_EXTENSIONS, RANSOMWARE_EXTENSIONS, LOLBINS,
)
from core.events import get_event_bus
from core.logging import get_logger
from database.engine import get_session
from database.repositories import AlertRepository, DeviceRepository, IOCRepository

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# MITRE ATT&CK Mapping Rules
# ---------------------------------------------------------------------------

# Event ID / event type → MITRE technique mapping
MITRE_MAPPING: dict[str, dict[str, str]] = {
    # Process-based detections
    "process_create": {"technique_id": "T1059", "technique_name": "Command and Scripting Interpreter", "tactic": "Execution"},
    "powershell_execution": {"technique_id": "T1059.001", "technique_name": "PowerShell", "tactic": "Execution"},
    "encoded_command": {"technique_id": "T1027", "technique_name": "Obfuscated Files or Information", "tactic": "Defense Evasion"},
    "lsass_access": {"technique_id": "T1003.001", "technique_name": "LSASS Memory", "tactic": "Credential Access"},
    "memory_access": {"technique_id": "T1055", "technique_name": "Process Injection", "tactic": "Defense Evasion"},

    # File-based detections
    "file_create": {"technique_id": "T1105", "technique_name": "Ingress Tool Transfer", "tactic": "Command and Control"},
    "mass_encryption": {"technique_id": "T1486", "technique_name": "Data Encrypted for Impact", "tactic": "Impact"},
    "ransomware_extension": {"technique_id": "T1486", "technique_name": "Data Encrypted for Impact", "tactic": "Impact"},
    "suspicious_extension": {"technique_id": "T1036", "technique_name": "Masquerading", "tactic": "Defense Evasion"},

    # Network-based detections
    "network_connection": {"technique_id": "T1071", "technique_name": "Application Layer Protocol", "tactic": "Command and Control"},
    "dns_query": {"technique_id": "T1071.004", "technique_name": "DNS", "tactic": "Command and Control"},
    "possible_dns_tunnel": {"technique_id": "T1572", "technique_name": "Protocol Tunneling", "tactic": "Command and Control"},
    "beaconing": {"technique_id": "T1071", "technique_name": "Application Layer Protocol", "tactic": "Command and Control"},
    "suspicious_port": {"technique_id": "T1571", "technique_name": "Non-Standard Port", "tactic": "Command and Control"},
    "smb_outbound": {"technique_id": "T1021.002", "technique_name": "SMB/Windows Admin Shares", "tactic": "Lateral Movement"},
    "rdp_outbound": {"technique_id": "T1021.001", "technique_name": "Remote Desktop Protocol", "tactic": "Lateral Movement"},

    # Authentication-based
    "login_failure": {"technique_id": "T1110", "technique_name": "Brute Force", "tactic": "Credential Access"},
    "login_success": {"technique_id": "T1078", "technique_name": "Valid Accounts", "tactic": "Persistence"},
    "privilege_escalation": {"technique_id": "T1068", "technique_name": "Exploitation for Privilege Escalation", "tactic": "Privilege Escalation"},
    "account_create": {"technique_id": "T1136", "technique_name": "Create Account", "tactic": "Persistence"},
    "account_delete": {"technique_id": "T1531", "technique_name": "Account Access Removal", "tactic": "Impact"},

    # Persistence
    "registry_modify": {"technique_id": "T1547.001", "technique_name": "Registry Run Keys", "tactic": "Persistence"},
    "registry_persistence": {"technique_id": "T1547.001", "technique_name": "Registry Run Keys", "tactic": "Persistence"},
    "scheduled_task": {"technique_id": "T1053.005", "technique_name": "Scheduled Task", "tactic": "Persistence"},
    "service_install": {"technique_id": "T1543.003", "technique_name": "Windows Service", "tactic": "Persistence"},
    "suspicious_task": {"technique_id": "T1053.005", "technique_name": "Scheduled Task", "tactic": "Persistence"},

    # Other
    "usb_insert": {"technique_id": "T1091", "technique_name": "Replication Through Removable Media", "tactic": "Lateral Movement"},
    "canary_access": {"technique_id": "T1083", "technique_name": "File and Directory Discovery", "tactic": "Discovery"},
    "defender_detection": {"technique_id": "T1562.001", "technique_name": "Disable or Modify Tools", "tactic": "Defense Evasion"},
    "download_cradle": {"technique_id": "T1059.001", "technique_name": "PowerShell", "tactic": "Execution"},
    "amsi_bypass": {"technique_id": "T1562.001", "technique_name": "Disable or Modify Tools", "tactic": "Defense Evasion"},
    "lolbin": {"technique_id": "T1218", "technique_name": "System Binary Proxy Execution", "tactic": "Defense Evasion"},
    "firewall_change": {"technique_id": "T1562.004", "technique_name": "Disable or Modify System Firewall", "tactic": "Defense Evasion"},
    "audit_policy_change": {"technique_id": "T1562.002", "technique_name": "Disable Windows Event Logging", "tactic": "Defense Evasion"},
    "suspicious_service": {"technique_id": "T1543.003", "technique_name": "Windows Service", "tactic": "Persistence"},
}


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

class Deduplicator:
    """Sliding-window deduplication using a hash set."""

    def __init__(self, window_size: int = 10_000) -> None:
        self._seen: set[str] = set()
        self._window_size = window_size

    def is_duplicate(self, event: dict[str, Any]) -> bool:
        """Check if event is a duplicate based on key fields."""
        key_data = f"{event.get('collector', '')}:{event.get('event_type', '')}:{json.dumps(event.get('metadata', {}), sort_keys=True, default=str)}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()

        if key_hash in self._seen:
            return True

        self._seen.add(key_hash)
        # Evict oldest when window is full
        if len(self._seen) > self._window_size:
            # Simple eviction — remove arbitrary element
            self._seen.pop()
        return False


# ---------------------------------------------------------------------------
# Risk Scorer
# ---------------------------------------------------------------------------

class RiskScorer:
    """
    Multi-factor risk scoring engine.

    Score = severity_weight × confidence × mitre_weight × tag_boost
    Produces a 0-100 risk score.
    """

    SEVERITY_WEIGHTS: dict[str, float] = {
        "critical": 1.0, "high": 0.8, "medium": 0.5, "low": 0.2, "info": 0.05,
    }

    TAG_BOOSTS: dict[str, float] = {
        "lsass_access": 1.5, "amsi_bypass": 1.4, "ransomware_extension": 1.5,
        "mass_encryption": 1.5, "canary_triggered": 1.3, "encoded_command": 1.2,
        "download_cradle": 1.2, "suspicious_port": 1.1, "privilege_escalation": 1.2,
        "brute_force_candidate": 1.2, "lolbin": 1.1, "credential_access": 1.3,
    }

    def calculate(self, event: dict[str, Any]) -> float:
        """Calculate risk score for an event."""
        severity = event.get("severity", "info")
        confidence = event.get("confidence", 0.5)
        existing_risk = event.get("risk_score", 0.0)
        tags = event.get("tags", [])

        base = self.SEVERITY_WEIGHTS.get(severity, 0.05)
        mitre_boost = 1.2 if event.get("mitre") else 1.0

        tag_boost = 1.0
        for tag in tags:
            tag_boost *= self.TAG_BOOSTS.get(tag, 1.0)

        calculated = base * confidence * mitre_boost * tag_boost * 100
        # Blend with existing risk score
        final = max(existing_risk, min(calculated, 100.0))
        return round(final, 1)


# ---------------------------------------------------------------------------
# Correlator
# ---------------------------------------------------------------------------

class EventCorrelator:
    """
    Time-window based event correlation.

    Detects attack chains by grouping related events within a time window.
    """

    def __init__(self, window_seconds: int = 300) -> None:
        self._window = window_seconds
        self._event_buffer: list[dict[str, Any]] = []
        self._correlation_rules = [
            self._detect_brute_force,
            self._detect_lateral_movement,
            self._detect_ransomware_chain,
        ]

    def add_event(self, event: dict[str, Any]) -> list[dict[str, str]]:
        """Add event and check correlation rules. Returns list of triggered correlations."""
        self._event_buffer.append(event)
        # Trim old events
        cutoff = time.time() - self._window
        self._event_buffer = [
            e for e in self._event_buffer
            if self._parse_timestamp(e.get("timestamp", "")) > cutoff
        ]

        findings: list[dict[str, str]] = []
        for rule in self._correlation_rules:
            result = rule()
            if result:
                findings.append(result)
        return findings

    def _detect_brute_force(self) -> dict[str, str] | None:
        """Detect multiple login failures from same source."""
        failures = [
            e for e in self._event_buffer
            if e.get("event_type") == EventType.LOGIN_FAILURE.value
        ]
        if len(failures) >= 5:
            return {
                "correlation": "brute_force_detected",
                "severity": "high",
                "description": f"{len(failures)} login failures detected in {self._window}s window",
                "mitre_technique": "T1110",
            }
        return None

    def _detect_lateral_movement(self) -> dict[str, str] | None:
        """Detect SMB + RDP activity pattern."""
        has_smb = any(
            "smb_outbound" in e.get("tags", []) for e in self._event_buffer
        )
        has_rdp = any(
            e.get("event_type") == EventType.LOGIN_RDP.value for e in self._event_buffer
        )
        if has_smb and has_rdp:
            return {
                "correlation": "lateral_movement_detected",
                "severity": "critical",
                "description": "SMB + RDP activity pattern detected — possible lateral movement",
                "mitre_technique": "T1021",
            }
        return None

    def _detect_ransomware_chain(self) -> dict[str, str] | None:
        """Detect download → file creation → mass modification pattern."""
        has_download = any(
            "download_cradle" in e.get("tags", []) or "suspicious_download" in e.get("tags", [])
            for e in self._event_buffer
        )
        has_mass = any(
            "mass_encryption" in e.get("tags", []) or "ransomware_extension" in e.get("tags", [])
            for e in self._event_buffer
        )
        if has_download and has_mass:
            return {
                "correlation": "ransomware_chain_detected",
                "severity": "critical",
                "description": "Download + mass file encryption pattern — possible ransomware attack",
                "mitre_technique": "T1486",
            }
        return None

    @staticmethod
    def _parse_timestamp(ts: str) -> float:
        try:
            return datetime.fromisoformat(ts).timestamp()
        except (ValueError, TypeError):
            return time.time()


# ---------------------------------------------------------------------------
# Pipeline Manager
# ---------------------------------------------------------------------------

class PipelineManager:
    """
    Orchestrates the complete event processing pipeline.

    Flow: Raw → Normalize → Dedup → MITRE Map → Risk Score → Correlate → Store → Alert
    """

    def __init__(self) -> None:
        self._dedup = Deduplicator()
        self._scorer = RiskScorer()
        self._correlator = EventCorrelator()
        self._processed_count = 0
        self._dropped_count = 0
        self._alert_count = 0
        self._settings = get_settings()

    async def start(self) -> None:
        """Subscribe to raw events on the message bus."""
        bus = get_event_bus()
        await bus.subscribe(Topic.RAW_EVENTS, self._process_event)
        logger.info("pipeline_started")

    async def _process_event(self, raw_event: dict[str, Any]) -> None:
        """Process a single raw event through the full pipeline."""
        try:
            # 1. Deduplication
            if self._dedup.is_duplicate(raw_event):
                self._dropped_count += 1
                return

            event = dict(raw_event)

            # 2. Normalize timestamps
            if "timestamp" not in event or not event["timestamp"]:
                event["timestamp"] = datetime.now(timezone.utc).isoformat()

            # 3. MITRE ATT&CK Mapping
            event = self._apply_mitre_mapping(event)

            # 4. Risk scoring
            event["risk_score"] = self._scorer.calculate(event)

            # 5. Correlation
            correlations = self._correlator.add_event(event)
            if correlations:
                event["correlations"] = correlations
                # Boost risk for correlated events
                event["risk_score"] = min(event["risk_score"] * 1.3, 100.0)

            # 6. Mark as processed
            event["processed"] = True
            event["status"] = "processed"
            self._processed_count += 1

            # 7. Write to JSON log files
            await self._write_log(event)

            # 8. If high-risk, create alert in database
            if event["risk_score"] >= 30.0:
                await self._create_alert(event)

            # 9. Publish processed event for live dashboard
            bus = get_event_bus()
            await bus.publish(Topic.ALERTS if event["risk_score"] >= 30 else Topic.NORMALIZED_EVENTS, event)

        except Exception:
            logger.exception("pipeline_processing_error")

    def _apply_mitre_mapping(self, event: dict[str, Any]) -> dict[str, Any]:
        """Map event to MITRE ATT&CK techniques based on event type and tags."""
        event_type = event.get("event_type", "")
        tags = event.get("tags", [])

        # Try mapping by tags first (more specific)
        for tag in tags:
            mapping = MITRE_MAPPING.get(tag)
            if mapping:
                event["mitre"] = mapping
                return event

        # Fall back to event type mapping
        mapping = MITRE_MAPPING.get(event_type)
        if mapping:
            event["mitre"] = mapping

        return event

    async def _write_log(self, event: dict[str, Any]) -> None:
        """Write processed event to appropriate JSON log directory."""
        settings = self._settings
        subdirs = settings.paths.log_subdirs

        # Determine target directory
        collector = event.get("collector", "")
        dir_map: dict[str, str] = {
            "process": "process", "network": "network", "file_monitor": "fim",
            "login": "eventlog", "powershell": "powershell", "sysmon": "sysmon",
            "dns": "dns", "windows_eventlog": "eventlog", "defender": "defender",
            "usb": "usb", "canary": "fim",
        }

        target_dir = subdirs.get(dir_map.get(collector, "processed"), subdirs["processed"])

        # Also write to detections/ if alert-worthy
        if event.get("risk_score", 0) >= 30:
            det_dir = subdirs["detections"]
            det_dir.mkdir(parents=True, exist_ok=True)
            det_file = det_dir / f"{datetime.now().strftime('%Y%m%d')}_{collector}_detections.jsonl"
            try:
                with open(det_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(event, default=str) + "\n")
            except OSError:
                pass

        # Write to collector-specific directory
        target_dir.mkdir(parents=True, exist_ok=True)
        log_file = target_dir / f"{datetime.now().strftime('%Y%m%d')}_{collector}.jsonl"
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(event, default=str) + "\n")
        except OSError as exc:
            logger.error("log_write_error", path=str(log_file), error=str(exc))

    async def _create_alert(self, event: dict[str, Any]) -> None:
        """Create an alert record in the database."""
        try:
            mitre = event.get("mitre", {})
            async with get_session() as session:
                alert_repo = AlertRepository(session)
                device_repo = DeviceRepository(session)

                # Upsert device
                hostname = event.get("hostname", "unknown")
                await device_repo.upsert(
                    hostname=hostname,
                    ip_address=event.get("metadata", {}).get("remote_ip", ""),
                    risk_score=event.get("risk_score", 0),
                )

                # Determine title from event
                event_type = event.get("event_type", "Unknown Event")
                tags = event.get("tags", [])
                title_parts = [event_type.replace("_", " ").title()]
                if "lsass_access" in tags:
                    title_parts = ["LSASS Memory Access Detected"]
                elif "amsi_bypass" in tags:
                    title_parts = ["AMSI Bypass Attempt Detected"]
                elif "ransomware_extension" in tags or "mass_encryption" in tags:
                    title_parts = ["Ransomware Activity Detected"]
                elif "encoded_command" in tags:
                    title_parts = ["Encoded PowerShell Command Detected"]
                elif "download_cradle" in tags:
                    title_parts = ["PowerShell Download Cradle Detected"]
                elif "canary_triggered" in tags:
                    title_parts = ["Canary File Accessed — Possible Breach"]
                elif "brute_force_candidate" in tags:
                    title_parts = ["Brute Force Login Attempt"]
                elif "suspicious_port" in tags:
                    title_parts = ["Connection to Suspicious Port"]

                # Extract IOC
                metadata = event.get("metadata", {})
                ioc_type = None
                ioc_value = None
                if metadata.get("remote_ip"):
                    ioc_type = IOCType.IP.value
                    ioc_value = metadata["remote_ip"]
                elif metadata.get("file_hash_sha256"):
                    ioc_type = IOCType.HASH_SHA256.value
                    ioc_value = metadata["file_hash_sha256"]
                elif metadata.get("query"):
                    ioc_type = IOCType.DOMAIN.value
                    ioc_value = metadata["query"]

                await alert_repo.create(
                    title=" — ".join(title_parts),
                    description=f"Collector: {event.get('collector')} | Event: {event_type}",
                    severity=event.get("severity", "info"),
                    risk_score=event.get("risk_score", 0),
                    confidence=event.get("confidence", 0.5),
                    event_type=event_type,
                    source_collector=event.get("collector"),
                    mitre_technique_id=mitre.get("technique_id"),
                    mitre_technique_name=mitre.get("technique_name"),
                    mitre_tactic=mitre.get("tactic"),
                    ioc_type=ioc_type,
                    ioc_value=ioc_value,
                    raw_log_ref=event.get("raw_reference"),
                    status=AlertStatus.NEW.value,
                    tags=tags,
                    metadata_json=metadata,
                )

                # Upsert IOC if found
                if ioc_type and ioc_value:
                    ioc_repo = IOCRepository(session)
                    await ioc_repo.upsert(
                        ioc_type=ioc_type,
                        value=ioc_value,
                        source=event.get("collector", "pipeline"),
                        severity=event.get("severity", "medium"),
                        confidence=event.get("confidence", 0.5),
                    )

                self._alert_count += 1
                logger.info(
                    "alert_created",
                    title=title_parts[0],
                    severity=event.get("severity"),
                    risk_score=event.get("risk_score"),
                    mitre=mitre.get("technique_id"),
                )

        except Exception:
            logger.exception("alert_creation_error")

    @property
    def stats(self) -> dict[str, int]:
        return {
            "processed": self._processed_count,
            "dropped_duplicates": self._dropped_count,
            "alerts_created": self._alert_count,
        }
