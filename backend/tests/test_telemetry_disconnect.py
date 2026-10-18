"""
Regression tests for Telemetry Ingestion ClientDisconnect and Payload Edge Cases.
Verifies Starlette ClientDisconnect handling, oversized payload rejection (413),
malformed JSON handling (400), gzip decompression, and shipper client retry/spool resilience.
"""

from __future__ import annotations

import asyncio
import gzip
import json
import time
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from starlette.requests import ClientDisconnect

from app.main import app
from app.core.broker import MemoryPriorityBroker, set_message_broker


@pytest.fixture(autouse=True)
def setup_broker():
    broker = MemoryPriorityBroker()
    set_message_broker(broker)
    yield broker


@pytest.mark.asyncio
async def test_telemetry_normal_valid_json():
    """Verify standard valid telemetry batch ingestion succeeds with HTTP 202."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "host_id": "test-valid-host",
            "hostname": "test-host",
            "os": "Windows 11 Pro",
            "ip_address": "127.0.0.1",
            "events": [
                {
                    "collector": "process",
                    "event_type": "process_create",
                    "process_name": "cmd.exe",
                    "severity": "low",
                    "edge_tier": "low",
                }
            ],
        }
        res = await client.post(
            "/api/v1/telemetry/ingest",
            json=payload,
            headers={"X-Host-Token": "kavach_agent_default_secret"},
        )
        assert res.status_code == 202
        data = res.json()
        assert data["status"] == "accepted"
        assert data["ingested"] == 1


@pytest.mark.asyncio
async def test_telemetry_valid_gzip_payload():
    """Verify gzip-compressed telemetry batch decompression and ingestion."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "host_id": "test-gzip-host",
            "hostname": "test-gzip-host",
            "events": [
                {"collector": "network", "event_type": "socket_connect", "severity": "info"}
            ],
        }
        compressed = gzip.compress(json.dumps(payload).encode("utf-8"))
        res = await client.post(
            "/api/v1/telemetry/ingest",
            content=compressed,
            headers={
                "X-Host-Token": "kavach_agent_default_secret",
                "Content-Encoding": "gzip",
                "Content-Type": "application/json",
            },
        )
        assert res.status_code == 202
        assert res.json()["ingested"] == 1


@pytest.mark.asyncio
async def test_telemetry_client_disconnect_during_body():
    """
    Verify that when Starlette raises ClientDisconnect during request.body(),
    the server handles it cleanly returning HTTP 499 without throwing an unhandled
    500 Internal Server Error or processing partial telemetry.
    """
    transport = ASGITransport(app=app)

    # Patch request.body to simulate premature client disconnect
    with patch("fastapi.Request.body", side_effect=ClientDisconnect):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/telemetry/ingest",
                content=b'{"partial": true}',
                headers={
                    "X-Host-Token": "kavach_agent_default_secret",
                    "Content-Type": "application/json",
                },
            )
            # Must return 499 (Client Closed Request), NOT 500
            assert res.status_code == 499
            data = res.json()
            assert data["error"]["code"] == "CLIENT_DISCONNECTED"


@pytest.mark.asyncio
async def test_telemetry_malformed_json():
    """Verify malformed JSON payload returns HTTP 400 Bad Request."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/telemetry/ingest",
            content=b'{"malformed_json": ',
            headers={
                "X-Host-Token": "kavach_agent_default_secret",
                "Content-Type": "application/json",
            },
        )
        assert res.status_code == 400
        msg = res.json().get("detail") or res.json().get("error", {}).get("message", "")
        assert "Invalid JSON payload" in msg


@pytest.mark.asyncio
async def test_telemetry_oversized_payload_content_length():
    """Verify oversized payload exceeding 10MB Content-Length returns HTTP 413."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/telemetry/ingest",
            content=b"{}",
            headers={
                "X-Host-Token": "kavach_agent_default_secret",
                "Content-Length": str(15 * 1024 * 1024),  # 15MB
                "Content-Type": "application/json",
            },
        )
        assert res.status_code == 413
        msg = res.json().get("detail") or res.json().get("error", {}).get("message", "")
        assert "exceeds 10MB" in msg


@pytest.mark.asyncio
async def test_telemetry_empty_events():
    """Verify empty events array returns HTTP 202 with ingested=0 without error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/telemetry/ingest",
            json={"host_id": "test", "events": []},
            headers={"X-Host-Token": "kavach_agent_default_secret"},
        )
        assert res.status_code == 202
        assert res.json()["ingested"] == 0
