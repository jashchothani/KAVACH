"""
KAVACH Central Telemetry Pipeline.

Orchestrates the canonical event lifecycle:
Collectors -> Event Bus -> Normalization -> Deduplication -> Rule Engine ->
ML Isolation Forest -> Threat Intelligence -> Hybrid Risk Scoring ->
Incident Correlation -> Database Persistence -> WebSocket Live Broadcast
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.core.constants import Topic, Severity
from app.core.events import get_event_bus
from app.core.logging import get_logger
from app.database.engine import get_session
from app.database.repositories import (
    AlertRepository,
    DeviceRepository,
    IncidentRepository,
    IOCRepository,
    SecurityEventRepository,
)
from app.detection.risk_engine import HybridRiskEngine
from app.detection.rule_engine import RuleEngine
from app.incidents.manager import IncidentCorrelationManager
from app.ml.anomaly_detector import get_anomaly_detector

logger = get_logger(__name__)


class Deduplicator:
    """Sliding-window MD5 deduplication."""

    def __init__(self, window_size: int = 10_000) -> None:
        self._seen: set[str] = set()
        self._window_size = window_size

    def is_duplicate(self, event: dict[str, Any]) -> bool:
        key_data = (
            f"{event.get('collector', '')}:{event.get('event_type', '')}:"
            f"{event.get('process_name', '')}:{event.get('destination_ip', '')}"
        )
        h = hashlib.md5(key_data.encode()).hexdigest()
        if h in self._seen:
            return True
        self._seen.add(h)
        if len(self._seen) > self._window_size:
            self._seen.pop()
        return False


class CentralPipelineManager:
    """Consolidated telemetry processing pipeline for KAVACH."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._dedup = Deduplicator()
        self._rule_engine = RuleEngine()
        self._risk_engine = HybridRiskEngine()
        self._correlator = IncidentCorrelationManager()
        self._processed_count = 0
        self._running = False

    async def start(self) -> None:
        """Subscribe to raw events on the message bus."""
        bus = get_event_bus()
        await bus.subscribe(Topic.RAW_EVENTS, self.process_event)
        self._running = True
        logger.info("central_pipeline_manager_started")

    async def stop(self) -> None:
        self._running = False
        logger.info("central_pipeline_manager_stopped", processed=self._processed_count)

    async def process_event(self, raw_event: dict[str, Any]) -> None:
        """Process a single telemetry event through all security gates."""
        try:
            # 1. Deduplication
            if self._dedup.is_duplicate(raw_event):
                return

            event = dict(raw_event)
            event.setdefault("timestamp", datetime.now(timezone.utc).isoformat())

            # 2. Rule Evaluation
            rule_res = self._rule_engine.evaluate(event)
            rule_score = float(rule_res.get("rule_score", 0.0))
            rule_matches = rule_res.get("matches", [])
            if rule_res.get("primary_mitre"):
                event["mitre"] = rule_res["primary_mitre"]

            # 3. ML Anomaly Detection (Isolation Forest)
            detector = get_anomaly_detector()
            ml_res = detector.predict(event)
            event["ml_anomaly_score"] = ml_res.get("raw_anomaly_score", 0.0)
            event["is_anomaly"] = ml_res.get("is_anomaly", False)

            # 4. Threat Intelligence matching (IOC)
            ti_score = 0.0
            dest_ip = event.get("destination_ip") or ""
            domain = event.get("domain") or ""
            async with get_session() as session:
                ioc_repo = IOCRepository(session)
                if dest_ip:
                    ioc_match = await ioc_repo.match_indicator(dest_ip)
                    if ioc_match:
                        ti_score = 80.0
                        event["ioc"] = {"type": "ip", "value": dest_ip, "severity": ioc_match.severity}
                if domain and ti_score == 0.0:
                    ioc_match = await ioc_repo.match_indicator(domain)
                    if ioc_match:
                        ti_score = 85.0
                        event["ioc"] = {"type": "domain", "value": domain, "severity": ioc_match.severity}

            # 5. Hybrid Risk Engine Scoring
            behavior_score = 50.0 if event.get("is_nonstandard_port") else 10.0
            risk_res = self._risk_engine.calculate_risk(
                rule_score=rule_score,
                rule_matches=rule_matches,
                ml_res=ml_res,
                ti_score=ti_score,
                behavior_score=behavior_score,
            )

            event["risk_score"] = risk_res["risk_score"]
            event["risk_level"] = risk_res["risk_level"]
            event["confidence"] = risk_res["confidence"]
            event["evidence_coverage"] = risk_res["evidence_coverage"]
            event["why_explanation"] = risk_res["why_explanation"]
            event["breakdown"] = risk_res["breakdown"]

            # 6. Database Persistence (Normalized Event)
            async with get_session() as session:
                sec_repo = SecurityEventRepository(session)
                dev_repo = DeviceRepository(session)
                alert_repo = AlertRepository(session)
                inc_repo = IncidentRepository(session)

                # Upsert Device
                hostname = event.get("hostname") or event.get("device_id") or "local_device"
                await dev_repo.upsert(
                    hostname=hostname,
                    ip_address=event.get("source_ip") or event.get("destination_ip"),
                    risk_score=event["risk_score"],
                )

                # Create SecurityEvent record
                await sec_repo.create(
                    collector=event.get("collector", "generic"),
                    event_type=event.get("event_type", "unknown"),
                    severity=event.get("severity", "info"),
                    device_id=hostname,
                    username=event.get("username"),
                    process_name=event.get("process_name"),
                    process_id=event.get("process_id"),
                    parent_process_id=event.get("parent_process_id"),
                    source_ip=event.get("source_ip"),
                    destination_ip=event.get("destination_ip"),
                    destination_port=event.get("destination_port"),
                    domain=event.get("domain"),
                    url=event.get("url"),
                    risk_score=event["risk_score"],
                    ml_score=ml_res.get("raw_anomaly_score"),
                    rule_score=rule_score,
                    ti_score=ti_score,
                    is_anomaly=event["is_anomaly"],
                    status="processed",
                    raw_data=event.get("raw_data") or event,
                )

                # 7. Generate Alert if Risk Score >= 40.0
                alert_record = None
                if event["risk_score"] >= 40.0:
                    alert_title = event.get("event_type", "Security Anomaly").replace("_", " ").title()
                    if rule_matches:
                        alert_title = rule_matches[0]["name"]

                    alert_record = await alert_repo.create(
                        title=alert_title,
                        description=risk_res["why_explanation"]["summary"],
                        severity=event["risk_level"].lower(),
                        risk_score=event["risk_score"],
                        confidence=event["confidence"],
                        event_type=event.get("event_type"),
                        source_collector=event.get("collector"),
                        mitre_technique_id=event.get("mitre", {}).get("technique_id"),
                        mitre_technique_name=event.get("mitre", {}).get("technique_name"),
                        mitre_tactic=event.get("mitre", {}).get("tactic"),
                        status="new",
                        analyst_notes=f"Breakdown: {risk_res['breakdown']}",
                        ai_explanation=risk_res["why_explanation"]["summary"],
                    )

                # 8. Incident Correlation
                if event["risk_score"] >= 65.0:
                    correlation = self._correlator.correlate(event)
                    if correlation and correlation.get("is_incident_candidate"):
                        await inc_repo.create(
                            title=correlation["title"],
                            description="\n".join(correlation["evidence_summary"]),
                            severity=correlation["severity"],
                            status="detected",
                            root_cause="Multi-vector anomalous event sequence detected by KAVACH engine",
                            evidence={"events": correlation["event_count"], "techniques": correlation["techniques"]},
                            recommended_playbook="isolate_device",
                            raksha_summary=risk_res["why_explanation"]["summary"],
                        )

            # 9. WebSocket Live Broadcast
            bus = get_event_bus()
            self._processed_count += 1
            if event["risk_score"] >= 40.0:
                await bus.publish(Topic.ALERTS, event)
            else:
                await bus.publish(Topic.NORMALIZED_EVENTS, event)

        except Exception as exc:
            logger.error("pipeline_event_processing_error", error=str(exc))
