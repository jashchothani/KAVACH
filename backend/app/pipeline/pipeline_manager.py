"""
KAVACH Central Telemetry Pipeline.

Orchestrates the canonical event lifecycle across distributed edge agents and cloud analysis:
- Pluggable Message Broker / Event Bus -> Tiered Ingestion
- Dedicated Priority Worker Pool (sub-100ms processing for CRITICAL & HIGH streams)
- Background Worker Pool (controlled processing for MEDIUM, LOW & STATISTICAL streams)
- Normalization -> Deduplication -> Sigma Rule Engine -> ML Isolation Forest -> Threat Intel
- Cross-Host Incident Correlation Engine -> Relational DB Persistence -> Cold Partitioned JSONL
- Real-time WebSocket Live Broadcast
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.core.constants import Topic, Severity
from app.core.events import get_event_bus
from app.core.logging import get_logger, record_system_log, LogStream
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
    """Time-windowed MD5 deduplication to prevent socket/query flooding while allowing continuous telemetry flow."""

    def __init__(self, window_size: int = 20_000, ttl_seconds: float = 5.0) -> None:
        self._seen: dict[str, float] = {}
        self._window_size = window_size
        self._ttl_seconds = ttl_seconds

    def is_duplicate(self, event: dict[str, Any]) -> bool:
        now = time.time()
        col = str(event.get("collector") or "").lower()
        etype = str(event.get("event_type") or "").lower()
        meta = event.get("metadata") or {}

        pname = str(event.get("process_name") or meta.get("process_name") or meta.get("image") or "")
        pid = str(event.get("process_id") or meta.get("pid") or "")
        cmd = str(event.get("command_line") or meta.get("command_line") or "")[:80]
        dip = str(event.get("destination_ip") or meta.get("remote_ip") or meta.get("remote_address") or "")
        dport = str(event.get("destination_port") or meta.get("remote_port") or "")
        domain = str(event.get("domain") or event.get("query_name") or meta.get("query") or "")
        fpath = str(event.get("file_path") or meta.get("file_path") or "")
        stext = str(event.get("script_text") or meta.get("script_text") or "")[:80]
        eid = str(event.get("event_id") or "")
        host = str(event.get("host_id") or "")

        key_data = f"{host}:{col}:{etype}:{pname}:{pid}:{cmd}:{dip}:{dport}:{domain}:{fpath}:{stext}:{eid}"
        if key_data.replace(":", "") == f"{host}{col}{etype}":
            key_data = f"{host}:{col}:{etype}:{str(now)}"

        h = hashlib.md5(key_data.encode("utf-8")).hexdigest()
        last_seen = self._seen.get(h)
        if last_seen and (now - last_seen) < self._ttl_seconds:
            return True

        self._seen[h] = now
        if len(self._seen) > self._window_size:
            # Evict oldest entries
            sorted_keys = sorted(self._seen, key=self._seen.get)
            for k in sorted_keys[: len(self._seen) - self._window_size]:
                self._seen.pop(k, None)
        return False


class CentralPipelineManager:
    """Consolidated telemetry processing and correlation pipeline for KAVACH."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._dedup = Deduplicator()
        self._rule_engine = RuleEngine()
        self._risk_engine = HybridRiskEngine()
        self._correlator = IncidentCorrelationManager()

        # Dedicated Priority Queues for Quality-of-Service (QoS)
        self._priority_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=10_000)
        self._background_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=30_000)

        # Worker tasks
        self._priority_worker_count = 4
        self._background_worker_count = 6
        self._worker_tasks: list[asyncio.Task] = []

        # Metrics
        self._processed_count = 0
        self._priority_processed_count = 0
        self._background_processed_count = 0
        self._priority_dropped_count = 0
        self._background_dropped_count = 0
        self._alerts_generated = 0
        self._incidents_generated = 0
        self._last_priority_latency_ms = 0.0
        self._last_host_upsert: dict[str, float] = {}

        self._running = False

    def _normalize_event(self, raw_event: dict[str, Any]) -> dict[str, Any]:
        """Normalize raw event into standardized top-level schema with rich metadata."""
        event = dict(raw_event)
        event.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        meta = dict(event.get("metadata") or {})

        # 1. Network attributes
        if not event.get("destination_ip"):
            event["destination_ip"] = meta.get("remote_ip") or meta.get("destination_ip") or event.get("dst_ip")
        if not event.get("source_ip"):
            l_addr = meta.get("local_address") or ""
            event["source_ip"] = meta.get("local_ip") or (l_addr.split(":")[0] if l_addr else None) or event.get("src_ip")
        if not event.get("destination_port"):
            event["destination_port"] = meta.get("remote_port") or meta.get("dst_port")
        if not event.get("protocol"):
            event["protocol"] = meta.get("protocol") or ("TCP" if "tcp" in str(event.get("event_type", "")).lower() else "UDP")

        # 2. Process attributes
        if not event.get("process_name"):
            event["process_name"] = meta.get("process_name") or meta.get("image") or meta.get("process")
        if not event.get("process_id"):
            event["process_id"] = meta.get("pid") or event.get("pid")
        if not event.get("command_line"):
            event["command_line"] = meta.get("command_line") or meta.get("cmdline") or event.get("cmd")

        # 3. DNS attributes
        if not event.get("domain"):
            event["domain"] = meta.get("query") or meta.get("domain") or event.get("query_name")
        if not event.get("query_name"):
            event["query_name"] = event.get("domain") or meta.get("query")

        # 4. FIM & File attributes
        if not event.get("file_path"):
            event["file_path"] = meta.get("file_path")
        if not event.get("action"):
            event["action"] = meta.get("action")

        # 5. PowerShell script block
        if not event.get("script_text"):
            event["script_text"] = meta.get("script_text")

        # 6. Host & Edge Classification attributes
        if not event.get("host_id"):
            event["host_id"] = meta.get("host_id") or "kavach-node-default"
        if not event.get("hostname"):
            event["hostname"] = meta.get("hostname") or event.get("host_id") or "localhost"

        if not event.get("edge_tier"):
            sev = str(event.get("severity") or "").lower()
            if sev == "critical":
                event["edge_tier"] = "critical"
            elif sev == "high":
                event["edge_tier"] = "high"
            elif sev == "medium":
                event["edge_tier"] = "medium"
            elif any(k in str(event.get("collector", "")).lower() for k in ("stat", "metric", "heartbeat")) or "metric" in str(event.get("event_type", "")).lower():
                event["edge_tier"] = "statistical"
            else:
                event["edge_tier"] = meta.get("edge_tier") or "low"

        if not event.get("edge_score"):
            event["edge_score"] = float(meta.get("edge_score") or 10.0)
        if not event.get("edge_reason"):
            event["edge_reason"] = meta.get("edge_reason") or "Edge verified telemetry"

        # 7. Concise SOC summary
        if not event.get("summary"):
            col = str(event.get("collector") or "").lower()
            evt = str(event.get("event_type") or "telemetry").lower()
            if "network" in col or "network" in evt:
                proto = event.get("protocol") or "TCP"
                r_addr = meta.get("remote_address") or (f"{event.get('destination_ip')}:{event.get('destination_port')}" if event.get("destination_ip") else meta.get("local_address") or "active_socket")
                pname = event.get("process_name") or "system"
                event["summary"] = f"{proto} {r_addr} [{pname}]"
            elif "dns" in col or "dns" in evt:
                q = event.get("domain") or meta.get("query") or "unknown"
                event["summary"] = f"DNS query: {q}"
            elif "process" in col or "process" in evt:
                event["summary"] = f"Process {event.get('process_name') or 'unknown'} (PID {event.get('process_id') or '-'})"
            elif "powershell" in col or "powershell" in evt:
                st = str(event.get("script_text") or meta.get("script_text") or "")[:50]
                event["summary"] = f"PowerShell: {st}" if st else "PowerShell script invocation"
            elif "file" in col or "fim" in col:
                event["summary"] = f"File {event.get('action') or 'modified'}: {event.get('file_path') or 'sensitive_file'}"
            elif "usb" in col:
                event["summary"] = f"USB device: {meta.get('device_name') or 'Removable Drive'}"
            elif "defender" in col:
                event["summary"] = f"Defender: {meta.get('threat_name') or 'Antivirus event'}"
            else:
                event["summary"] = f"{col.upper()} {evt}"

        # Reflect enriched fields back to metadata for backwards compatibility
        meta.update({
            "destination_ip": event.get("destination_ip"),
            "source_ip": event.get("source_ip"),
            "destination_port": event.get("destination_port"),
            "protocol": event.get("protocol"),
            "process_name": event.get("process_name"),
            "command_line": event.get("command_line"),
            "domain": event.get("domain"),
            "query_name": event.get("query_name"),
            "summary": event.get("summary"),
            "host_id": event.get("host_id"),
            "hostname": event.get("hostname"),
            "edge_tier": event.get("edge_tier"),
            "edge_score": event.get("edge_score"),
            "edge_reason": event.get("edge_reason"),
        })
        event["metadata"] = meta
        return event

    async def enqueue_priority(self, event: dict[str, Any]) -> None:
        """Enqueue critical/high events for immediate sub-100ms analysis."""
        try:
            self._priority_queue.put_nowait(event)
        except asyncio.QueueFull:
            self._priority_dropped_count += 1
            logger.warning("priority_queue_full_direct_dispatch")
            asyncio.create_task(self.process_priority_event(event))

    async def enqueue_background(self, event: dict[str, Any]) -> None:
        """Enqueue medium/low/statistical telemetry for background batching."""
        try:
            self._background_queue.put_nowait(event)
        except asyncio.QueueFull:
            self._background_dropped_count += 1
            if self._background_dropped_count % 1000 == 1:
                logger.warning("background_queue_full_dropped", dropped_total=self._background_dropped_count)

    async def _on_raw_bus_event(self, raw_event: dict[str, Any]) -> None:
        """Handler for raw events incoming from the internal event bus."""
        if self._dedup.is_duplicate(raw_event):
            return
        tier = str(raw_event.get("edge_tier") or raw_event.get("severity") or "").lower()
        if tier in ("critical", "high"):
            await self.enqueue_priority(raw_event)
        else:
            await self.enqueue_background(raw_event)

    async def start(self) -> None:
        """Start worker pools and subscribe to event bus and broker."""
        global _global_pipeline
        _global_pipeline = self
        self._running = True

        # 1. Spawn dedicated priority workers (<100ms processing)
        for i in range(self._priority_worker_count):
            t = asyncio.create_task(self._priority_worker_loop(i))
            self._worker_tasks.append(t)

        # 2. Spawn background workers
        for i in range(self._background_worker_count):
            t = asyncio.create_task(self._background_worker_loop(i))
            self._worker_tasks.append(t)

        # 3. Subscribe to internal event bus
        bus = get_event_bus()
        await bus.subscribe(Topic.RAW_EVENTS, self._on_raw_bus_event)

        # 4. Subscribe to Pluggable Message Broker priority channels
        try:
            from app.core.broker import get_message_broker
            broker = get_message_broker()
            # Critical & High streams go to priority queue
            await broker.subscribe_tier("critical", self.enqueue_priority)
            await broker.subscribe_tier("high", self.enqueue_priority)

            # Medium, Low, Statistical streams go to background queue
            await broker.subscribe_tier("medium", self.enqueue_background)
            await broker.subscribe_tier("low", self.enqueue_background)
            await broker.subscribe_tier("statistical", self.enqueue_background)
            logger.info("broker_tiered_subscriptions_initialized")
        except Exception as exc:
            logger.warning("broker_subscription_failed", error=str(exc))

        logger.info(
            "central_pipeline_manager_started",
            priority_workers=self._priority_worker_count,
            background_workers=self._background_worker_count,
        )

    async def stop(self) -> None:
        """Gracefully stop worker tasks and drain queues."""
        self._running = False
        for t in self._worker_tasks:
            t.cancel()
        if self._worker_tasks:
            await asyncio.gather(*self._worker_tasks, return_exceptions=True)
        self._worker_tasks.clear()
        logger.info(
            "central_pipeline_manager_stopped",
            processed=self._processed_count,
            priority_processed=self._priority_processed_count,
            background_processed=self._background_processed_count,
        )

    async def _priority_worker_loop(self, worker_id: int) -> None:
        """Loop dedicated to critical/high events with sub-100ms target latency."""
        while self._running:
            try:
                event = await self._priority_queue.get()
                start_t = time.perf_counter()
                await self.process_priority_event(event)
                latency_ms = (time.perf_counter() - start_t) * 1000.0
                self._last_priority_latency_ms = latency_ms
                self._priority_processed_count += 1
                self._processed_count += 1
                self._priority_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("priority_worker_error", worker_id=worker_id, error=str(exc))
                await asyncio.sleep(0.05)

    async def _background_worker_loop(self, worker_id: int) -> None:
        """Loop dedicated to routine medium, low, and statistical telemetry."""
        while self._running:
            try:
                event = await self._background_queue.get()
                await self.process_background_event(event)
                self._background_processed_count += 1
                self._processed_count += 1
                self._background_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("background_worker_error", worker_id=worker_id, error=str(exc))
                await asyncio.sleep(0.1)

    async def process_event(self, raw_event: dict[str, Any]) -> None:
        """Process a single telemetry event synchronously through the priority pipeline."""
        await self.process_priority_event(raw_event)

    async def process_priority_event(self, raw_event: dict[str, Any]) -> None:
        """Fast-path full evaluation for critical and high severity telemetry."""
        try:
            event = self._normalize_event(raw_event)

            if self._dedup.is_duplicate(event):
                return

            # 1. Deterministic Rule Evaluation (MITRE ATT&CK Matrix)
            rule_res = self._rule_engine.evaluate(event)
            rule_score = float(rule_res.get("rule_score", 0.0))
            rule_matches = rule_res.get("matches", [])
            if rule_res.get("primary_mitre"):
                event["mitre"] = rule_res["primary_mitre"]

            # 2. ML Anomaly Detection (Isolation Forest)
            detector = get_anomaly_detector()
            ml_res = detector.predict(event)
            event["ml_anomaly_score"] = ml_res.get("raw_anomaly_score", 0.0)
            event["is_anomaly"] = ml_res.get("is_anomaly", False)

            # 3. Threat Intelligence IOC Matching
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

            # 4. Hybrid Risk Engine Scoring (Weighted blend of rules, ML, and TI)
            behavior_score = 60.0 if event.get("is_nonstandard_port") else 20.0
            risk_res = self._risk_engine.calculate_risk(
                rule_score=rule_score,
                rule_matches=rule_matches,
                ml_res=ml_res,
                ti_score=ti_score,
                behavior_score=behavior_score,
            )

            # Ensure critical/high edge tier maintains strong floor
            base_risk = 80.0 if event.get("edge_tier") == "critical" else 60.0
            event["risk_score"] = max(base_risk, risk_res["risk_score"])
            event["risk_level"] = "CRITICAL" if event["risk_score"] >= 75 else "HIGH"
            event["confidence"] = risk_res["confidence"]
            event["evidence_coverage"] = risk_res["evidence_coverage"]
            event["why_explanation"] = risk_res["why_explanation"]
            event["breakdown"] = risk_res["breakdown"]

            # 5. Database Persistence & Cross-Host Correlation
            hostname = event.get("hostname") or event.get("host_id") or "local_device"
            device_id: str | None = None
            try:
                async with get_session() as dev_session:
                    dev_repo = DeviceRepository(dev_session)
                    device_obj = await dev_repo.upsert(
                        hostname=hostname,
                        ip_address=event.get("source_ip") or event.get("destination_ip"),
                        risk_score=event["risk_score"],
                    )
                    if device_obj:
                        device_id = device_obj.id
            except Exception as dev_err:
                logger.warning("device_upsert_failed", error=str(dev_err))

            # Create SecurityEvent record
            try:
                async with get_session() as sec_session:
                    sec_repo = SecurityEventRepository(sec_session)
                    await sec_repo.create(
                        collector=event.get("collector", "generic"),
                        event_type=event.get("event_type", "unknown"),
                        severity=event["risk_level"].lower(),
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
            except Exception as sec_err:
                logger.warning("security_event_insert_failed", error=str(sec_err))

            # 6. Enterprise Multi-Host Incident Correlation
            correlation = self._correlator.correlate(event)
            inc_id: str | None = None
            if correlation and correlation.get("is_incident_candidate"):
                try:
                    async with get_session() as inc_session:
                        inc_repo = IncidentRepository(inc_session)
                        inc_record = await inc_repo.create(
                            title=correlation.get("title", "Correlated Security Incident"),
                            description="\n".join(correlation.get("evidence_summary", [])),
                            severity=correlation.get("severity", "high"),
                            status="detected",
                            root_cause=correlation.get("root_cause") or "Multi-vector anomalous attack sequence detected by KAVACH engine",
                            evidence={
                                "events": correlation.get("event_count", 1),
                                "techniques": list(correlation.get("techniques", [])),
                                "affected_hosts": list(correlation.get("affected_hosts", [hostname])),
                                "correlation_type": correlation.get("correlation_type", "single_host"),
                                "indicators": list(correlation.get("indicators", [])),
                            },
                            recommended_playbook=correlation.get("recommended_playbook") or "isolate_device",
                            raksha_summary=risk_res.get("why_explanation", {}).get("summary", ""),
                        )
                        inc_id = inc_record.id
                        self._incidents_generated += 1

                    record_system_log(
                        stream=LogStream.DETECTION,
                        level="CRITICAL",
                        component="incident_correlator",
                        message=f"🚨 High Risk Incident correlated: {correlation.get('title')}",
                        details={
                            "affected_hosts": list(correlation.get("affected_hosts", [hostname])),
                            "techniques": list(correlation.get("techniques", [])),
                        },
                    )
                except Exception as inc_exc:
                    logger.warning("incident_creation_deferred", error=str(inc_exc))
                    inc_id = None

            # 7. Generate Alert Record (with incident link already committed in DB)
            alert_title = event.get("event_type", "Security Anomaly").replace("_", " ").title()
            if rule_matches:
                alert_title = rule_matches[0]["name"]

            friendly_what = f"⚠️ KAVACH Priority Alert: {alert_title} on {hostname}."
            friendly_why = risk_res.get("why_explanation", {}).get("summary", "")
            friendly_action = "KAVACH correlated and contained the anomaly."

            alert_kwargs = {
                "title": alert_title,
                "description": f"{friendly_what} {friendly_why}".strip(),
                "severity": event["risk_level"].lower(),
                "risk_score": event["risk_score"],
                "confidence": event["confidence"],
                "event_type": event.get("event_type"),
                "source_collector": event.get("collector"),
                "mitre_technique_id": event.get("mitre", {}).get("technique_id"),
                "mitre_technique_name": event.get("mitre", {}).get("technique_name"),
                "mitre_tactic": event.get("mitre", {}).get("tactic"),
                "status": "new",
                "analyst_notes": f"Breakdown: {risk_res['breakdown']}",
                "ai_explanation": f"{friendly_what}\nWhy: {friendly_why}\nAction: {friendly_action}",
                "device_id": device_id,
                "incident_id": inc_id,
            }
            try:
                async with get_session() as alert_session:
                    alert_repo = AlertRepository(alert_session)
                    alert_record = await alert_repo.create(**alert_kwargs)
                self._alerts_generated += 1
            except Exception as alert_err:
                logger.warning("alert_fk_fallback", error=str(alert_err))
                try:
                    alert_kwargs["incident_id"] = None
                    alert_kwargs["device_id"] = None
                    async with get_session() as fallback_session:
                        alert_repo = AlertRepository(fallback_session)
                        alert_record = await alert_repo.create(**alert_kwargs)
                    self._alerts_generated += 1
                except Exception as fb_err:
                    logger.error("alert_creation_failed", error=str(fb_err))

            record_system_log(
                stream=LogStream.DETECTION,
                level="CRITICAL" if event["risk_score"] >= 75 else "WARNING",
                component=event.get("collector", "detection_engine"),
                message=f"🛡️ Threat Alert: {alert_title} (Risk {round(event['risk_score'], 1)}/100) on {hostname}",
                details={"risk_score": event["risk_score"], "host": hostname, "collector": event.get("collector")},
            )

            # 8. WebSocket Broadcast
            bus = get_event_bus()
            await bus.publish(Topic.ALERTS, event)

            # 9. Dual Storage: Write to partitioned JSONL cold files
            asyncio.create_task(asyncio.to_thread(self._write_json_logs_sync, raw_event, event))

        except Exception as exc:
            logger.error("priority_event_processing_error", error=str(exc))

    async def _upsert_device_throttled(self, hostname: str, ip: str | None, risk: float) -> None:
        """Throttle device database upserts to at most once per 15s per host unless risk changes."""
        now = time.time()
        last = self._last_host_upsert.get(hostname, 0.0)
        if (now - last) >= 15.0 or risk >= 25.0:
            self._last_host_upsert[hostname] = now
            try:
                async with get_session() as session:
                    dev_repo = DeviceRepository(session)
                    await dev_repo.upsert(
                        hostname=hostname,
                        ip_address=ip,
                        risk_score=risk,
                    )
            except Exception as e:
                logger.debug("device_upsert_throttled_error", error=str(e))

    async def process_background_event(self, raw_event: dict[str, Any]) -> None:
        """Controlled evaluation for medium, low, and statistical telemetry."""
        try:
            event = self._normalize_event(raw_event)

            if self._dedup.is_duplicate(event):
                return

            # Special bypass for statistical vitals / heartbeats
            if event.get("edge_tier") == "statistical":
                event["risk_score"] = 0.0
                event["risk_level"] = "INFO"
                event["confidence"] = 100.0
                event["is_anomaly"] = False

                # Throttled host device upsert
                hostname = event.get("hostname") or event.get("host_id") or "local_device"
                await self._upsert_device_throttled(
                    hostname,
                    event.get("source_ip") or event.get("destination_ip"),
                    0.0,
                )

                bus = get_event_bus()
                await bus.publish(Topic.NORMALIZED_EVENTS, event)
                asyncio.create_task(asyncio.to_thread(self._write_json_logs_sync, raw_event, event))
                return

            # Medium & Low Evaluation
            rule_res = self._rule_engine.evaluate(event)
            rule_score = float(rule_res.get("rule_score", 0.0))
            rule_matches = rule_res.get("matches", [])
            if rule_res.get("primary_mitre"):
                event["mitre"] = rule_res["primary_mitre"]

            detector = get_anomaly_detector()
            ml_res = detector.predict(event)
            event["ml_anomaly_score"] = ml_res.get("raw_anomaly_score", 0.0)
            event["is_anomaly"] = ml_res.get("is_anomaly", False)

            ti_score = 0.0
            behavior_score = 20.0 if event.get("is_nonstandard_port") else 5.0
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
            event["why_explanation"] = risk_res["why_explanation"]

            hostname = event.get("hostname") or event.get("host_id") or "local_device"
            await self._upsert_device_throttled(
                hostname,
                event.get("source_ip") or event.get("destination_ip"),
                event["risk_score"],
            )

            # Only write to SQLite security_events table for anomalous, tagged, or elevated risk events.
            # 100% of telemetry is always preserved in partitioned JSONL cold files and stream bus.
            if (
                event["risk_score"] >= 15.0
                or event.get("is_anomaly")
                or event.get("mitre")
                or event.get("severity") in ("medium", "high", "critical")
            ):
                async with get_session() as session:
                    sec_repo = SecurityEventRepository(session)
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

            bus = get_event_bus()
            if event["risk_score"] >= 40.0:
                await bus.publish(Topic.ALERTS, event)
            else:
                await bus.publish(Topic.NORMALIZED_EVENTS, event)

            asyncio.create_task(asyncio.to_thread(self._write_json_logs_sync, raw_event, event))

        except Exception as exc:
            logger.error("background_event_processing_error", error=str(exc))

    def _write_json_logs_sync(self, raw_event: dict[str, Any], event: dict[str, Any]) -> None:
        """Write events to appropriate collector and host-partitioned JSON logs."""
        try:
            subdirs = self._settings.paths.log_subdirs
            today = datetime.now(timezone.utc).strftime("%Y%m%d")
            host_id = str(event.get("host_id") or "default")
            clean_host = re.sub(r"[^a-zA-Z0-9_\-]", "_", host_id)

            # 1. Raw event log
            raw_dir = subdirs.get("raw")
            if raw_dir:
                raw_dir.mkdir(parents=True, exist_ok=True)
                with open(raw_dir / f"{today}_raw.jsonl", "a", encoding="utf-8") as f:
                    f.write(json.dumps(raw_event, default=str) + "\n")
                    f.flush()

            # 2. Processed normalized event log
            proc_dir = subdirs.get("processed")
            if proc_dir:
                proc_dir.mkdir(parents=True, exist_ok=True)
                with open(proc_dir / f"{today}_processed.jsonl", "a", encoding="utf-8") as f:
                    f.write(json.dumps(event, default=str) + "\n")
                    f.flush()
                if clean_host != "default" and clean_host != "kavach_node_default":
                    with open(proc_dir / f"{today}_{clean_host}_processed.jsonl", "a", encoding="utf-8") as f:
                        f.write(json.dumps(event, default=str) + "\n")
                        f.flush()

            # 3. Collector-specific archive
            collector = str(event.get("collector") or "").lower()
            event_type = str(event.get("event_type") or "").lower()
            target_key = "processed"
            if "dns" in collector or "dns" in event_type:
                target_key = "dns"
            elif "defender" in collector or "defender" in event_type:
                target_key = "defender"
            elif "powershell" in collector or "powershell" in event_type:
                target_key = "powershell"
            elif "process" in collector or "process" in event_type:
                target_key = "process"
            elif "network" in collector or "network" in event_type:
                target_key = "network"
            elif any(k in collector for k in ("fim", "file_monitor", "canary")) or "file" in event_type:
                target_key = "fim"
            elif "sysmon" in collector:
                target_key = "sysmon"
            elif any(k in collector for k in ("eventlog", "login", "windows_eventlog")) or "login" in event_type:
                target_key = "eventlog"
            elif "usb" in collector or "usb" in event_type:
                target_key = "usb"

            target_dir = subdirs.get(target_key)
            if target_dir:
                target_dir.mkdir(parents=True, exist_ok=True)
                with open(target_dir / f"{today}_{target_key}.jsonl", "a", encoding="utf-8") as f:
                    f.write(json.dumps(event, default=str) + "\n")
                    f.flush()
                if clean_host != "default" and clean_host != "kavach_node_default":
                    with open(target_dir / f"{today}_{clean_host}_{target_key}.jsonl", "a", encoding="utf-8") as f:
                        f.write(json.dumps(event, default=str) + "\n")
                        f.flush()

            # 4. MITRE mapped telemetry
            if event.get("mitre"):
                mitre_dir = subdirs.get("mitre")
                if mitre_dir:
                    mitre_dir.mkdir(parents=True, exist_ok=True)
                    with open(mitre_dir / f"{today}_mitre.jsonl", "a", encoding="utf-8") as f:
                        f.write(json.dumps(event, default=str) + "\n")
                        f.flush()

            # 5. Alert & Detection logs
            if event.get("risk_score", 0.0) >= 30.0 or event.get("status") == "alert":
                alert_dir = subdirs.get("alerts")
                if alert_dir:
                    alert_dir.mkdir(parents=True, exist_ok=True)
                    with open(alert_dir / f"{today}_alerts.jsonl", "a", encoding="utf-8") as f:
                        f.write(json.dumps(event, default=str) + "\n")
                        f.flush()

                det_dir = subdirs.get("detections")
                if det_dir:
                    det_dir.mkdir(parents=True, exist_ok=True)
                    with open(det_dir / f"{today}_detections.jsonl", "a", encoding="utf-8") as f:
                        f.write(json.dumps(event, default=str) + "\n")
                        f.flush()
        except Exception as exc:
            logger.error("json_log_write_error", error=str(exc))

    def get_metrics(self) -> dict[str, Any]:
        """Expose real-time worker pool and pipeline health metrics."""
        return {
            "status": "healthy" if self._running else "stopped",
            "priority_queue_depth": self._priority_queue.qsize(),
            "background_queue_depth": self._background_queue.qsize(),
            "priority_workers": self._priority_worker_count,
            "background_workers": self._background_worker_count,
            "priority_processed_count": self._priority_processed_count,
            "background_processed_count": self._background_processed_count,
            "total_processed_count": self._processed_count,
            "priority_dropped_count": self._priority_dropped_count,
            "background_dropped_count": self._background_dropped_count,
            "alerts_generated": self._alerts_generated,
            "incidents_generated": self._incidents_generated,
            "last_priority_latency_ms": round(self._last_priority_latency_ms, 2),
        }


# Singleton reference
_global_pipeline: CentralPipelineManager | None = None


def get_pipeline_manager() -> CentralPipelineManager | None:
    """Return active global pipeline manager instance."""
    return _global_pipeline
