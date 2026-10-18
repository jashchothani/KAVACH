"""
Tests for Phase 2: Cloud Ingestion Gateway, Host Fleet Management, and Pluggable Broker.
"""

import asyncio
import time
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.broker import MemoryPriorityBroker, get_message_broker, set_message_broker
from app.database.engine import init_database, close_database


@pytest.fixture(autouse=True)
def setup_broker():
    broker = MemoryPriorityBroker()
    set_message_broker(broker)
    yield broker


@pytest.mark.asyncio
async def test_memory_priority_broker():
    broker = MemoryPriorityBroker()
    await broker.start()

    received = []
    async def cb(msg):
        received.append(msg)

    await broker.subscribe_tier("critical", cb)
    await broker.subscribe_tier("low", cb)

    await broker.publish_tier("critical", {"id": "crit_1", "action": "blocked"})
    await broker.publish_tier("low", {"id": "low_1", "action": "normal"})

    await asyncio.sleep(0.1)
    await broker.stop()

    assert len(received) == 2
    assert received[0]["id"] == "crit_1"
    assert received[1]["id"] == "low_1"


@pytest.mark.asyncio
async def test_host_token_generation_and_ingest():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Generate enrollment token
        token_res = await client.post("/api/v1/telemetry/tokens", json={"label": "Test-Host", "expires_in_days": 30})
        assert token_res.status_code == 201
        token = token_res.json()["token"]
        assert token.startswith("kavach_live_")

        # 2. Ingest telemetry using the token
        payload = {
            "host_id": "test-host-id-001",
            "hostname": "test-host-001",
            "os": "Windows 11 Pro",
            "ip_address": "192.168.1.99",
            "events": [
                {
                    "collector": "process",
                    "event_type": "process_started",
                    "edge_tier": "critical",
                    "summary": "Mimikatz detected",
                }
            ],
        }
        ingest_res = await client.post(
            "/api/v1/telemetry/ingest",
            json=payload,
            headers={"X-Host-Token": token},
        )
        assert ingest_res.status_code == 202
        assert ingest_res.json()["ingested"] == 1


@pytest.mark.asyncio
async def test_fleet_hosts_and_broker_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Query broker metrics
        metrics_res = await client.get("/api/v1/telemetry/broker/metrics")
        assert metrics_res.status_code == 200
        assert "broker_type" in metrics_res.json()

        # Query fleet hosts
        hosts_res = await client.get("/api/v1/telemetry/hosts")
        assert hosts_res.status_code == 200
        data = hosts_res.json()
        assert "total_hosts" in data
        assert "online_count" in data
        assert isinstance(data["hosts"], list)
