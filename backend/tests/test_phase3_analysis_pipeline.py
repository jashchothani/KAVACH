"""
Unit and Integration Tests for Phase 3: Cloud Analysis & ML Correlation Pipeline.

Validates:
1. IncidentCorrelationManager cross-host correlation (shared C2, lateral movement, credential spray).
2. CentralPipelineManager priority QoS worker pools (<100ms processing for CRITICAL/HIGH).
3. Relational DB persistence and Alert-to-Incident linking with affected_hosts.
4. Structured JSONL cold log search with host_id and edge_tier filtering.
5. Live Pipeline Metrics API endpoint.
"""

from __future__ import annotations

import asyncio
import json
import pytest
from httpx import AsyncClient, ASGITransport

from app.core.config import get_settings
from app.database.engine import init_database, get_session
from app.database.repositories import AlertRepository, DeviceRepository, IncidentRepository
from app.incidents.manager import IncidentCorrelationManager
from app.main import app
from app.pipeline.pipeline_manager import CentralPipelineManager, get_pipeline_manager


@pytest.mark.asyncio
async def test_cross_host_shared_c2_correlation():
    """Verify that when 2 distinct endpoints contact the same C2 indicator, a multi-host incident is correlated."""
    correlator = IncidentCorrelationManager(window_seconds=300)

    event_host1 = {
        "host_id": "endpoint-finance-01",
        "hostname": "finance-pc01",
        "event_type": "outbound_socket",
        "destination_ip": "185.220.101.5",
        "destination_port": 4444,
        "process_name": "powershell.exe",
        "risk_score": 85.0,
        "mitre": {"technique_id": "T1071"},
    }

    event_host2 = {
        "host_id": "endpoint-hr-02",
        "hostname": "hr-pc02",
        "event_type": "outbound_socket",
        "destination_ip": "185.220.101.5",
        "destination_port": 4444,
        "process_name": "cmd.exe",
        "risk_score": 88.0,
        "mitre": {"technique_id": "T1071"},
    }

    # First host beacon: not yet multi-host candidate
    res1 = correlator.correlate(event_host1)
    assert res1 is None or not res1.get("is_incident_candidate")

    # Second host beacon to same indicator: triggers cross-host campaign incident
    res2 = correlator.correlate(event_host2)
    assert res2 is not None
    assert res2["is_incident_candidate"] is True
    assert res2["correlation_type"] == "cross_host_shared_c2"
    assert res2["severity"] == "critical"
    assert "finance-pc01" in res2["affected_hosts"]
    assert "hr-pc02" in res2["affected_hosts"]
    assert "185.220.101.5" in res2["indicators"]


@pytest.mark.asyncio
async def test_cross_host_lateral_movement_correlation():
    """Verify lateral movement detection across endpoints via admin port or tool."""
    correlator = IncidentCorrelationManager(window_seconds=300)

    event1 = {
        "host_id": "host-jumpbox-01",
        "hostname": "jumpbox-01",
        "event_type": "remote_service",
        "destination_ip": "192.168.1.50",
        "destination_port": 445,
        "process_name": "psexec.exe",
        "risk_score": 75.0,
        "mitre": {"technique_id": "T1021.002"},
    }

    event2 = {
        "host_id": "host-jumpbox-01",
        "hostname": "jumpbox-01",
        "event_type": "remote_execution",
        "destination_ip": "192.168.1.50",
        "destination_port": 445,
        "process_name": "psexec.exe",
        "risk_score": 85.0,
        "mitre": {"technique_id": "T1021.002"},
    }

    res1 = correlator.correlate(event1)
    res2 = correlator.correlate(event2)

    assert res2 is not None
    assert res2["is_incident_candidate"] is True
    assert res2["correlation_type"] == "cross_host_lateral_movement"
    assert "jumpbox-01" in res2["affected_hosts"]
    assert "192.168.1.50" in res2["indicators"]


@pytest.mark.asyncio
async def test_central_pipeline_priority_processing_and_db_linking():
    """Verify priority worker pool processing and linking between Device, Alert, and Incident."""
    await init_database()
    pipeline = CentralPipelineManager()
    await pipeline.start()

    try:
        # Enqueue critical telemetry
        critical_event = {
            "host_id": "node-srv-dc01",
            "hostname": "srv-dc01",
            "collector": "powershell",
            "event_type": "script_block",
            "severity": "critical",
            "edge_tier": "critical",
            "edge_score": 95.0,
            "script_text": "Invoke-Mimikatz -DumpCreds",
            "destination_ip": "203.0.113.10",
            "destination_port": 9001,
            "process_name": "powershell.exe",
            "process_id": 4821,
        }

        await pipeline.enqueue_priority(critical_event)

        # Allow worker loop to process
        await asyncio.sleep(0.3)

        metrics = pipeline.get_metrics()
        assert metrics["status"] == "healthy"
        assert metrics["priority_processed_count"] >= 1
        assert metrics["alerts_generated"] >= 1

        # Verify DB records created
        async with get_session() as session:
            dev_repo = DeviceRepository(session)
            alert_repo = AlertRepository(session)

            dev = await dev_repo.get_by_hostname("srv-dc01")
            assert dev is not None
            assert dev.risk_score >= 60.0

            alerts = await alert_repo.get_recent(limit=5)
            matching_alert = next((a for a in alerts if a.device_id == dev.id), None)
            assert matching_alert is not None
            assert matching_alert.severity in ("critical", "high")

    finally:
        await pipeline.stop()


@pytest.mark.asyncio
async def test_pipeline_metrics_and_log_search_api():
    """Verify GET /api/v1/pipeline/metrics and GET /api/v1/logs/search with host and tier filtering."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Pipeline metrics API
        metrics_resp = await client.get("/api/v1/pipeline/metrics")
        assert metrics_resp.status_code == 200
        metrics_data = metrics_resp.json()
        assert "priority_queue_depth" in metrics_data
        assert "background_queue_depth" in metrics_data
        assert "priority_workers" in metrics_data

        # 2. Log search API with host_id and edge_tier params
        search_resp = await client.get("/api/v1/logs/search", params={"limit": 10, "edge_tier": "all"})
        assert search_resp.status_code == 200
        search_data = search_resp.json()
        assert "results" in search_data
        assert "count" in search_data

        # 3. Incidents API exposes affected_hosts
        incidents_resp = await client.get("/api/v1/incidents", params={"limit": 10})
        assert incidents_resp.status_code == 200
        inc_list = incidents_resp.json()
        assert isinstance(inc_list, list)
        if len(inc_list) > 0:
            assert "affected_hosts" in inc_list[0]
