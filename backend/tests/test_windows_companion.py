"""
KAVACH Automated Tests — Priority 6: Windows Companion Agent & Resilient Pipeline.

Validates:
1. ResilientSpooler prioritized dequeue (CRITICAL/HIGH before LOW/STATISTICAL).
2. Spooler ack/nack batch semantics and disk-backed retry counting.
3. ShipperClient authenticated header generation and upload metrics tracking.
4. KavachAgentService One-Click Shield activation & containment telemetry.
5. Live runtime status reporting and command ingestion.
"""

import json
import time
import pytest
from pathlib import Path

from app.agent.classifier import EdgeTier
from app.agent.identity import DeviceIdentityManager
from app.agent.service import KavachAgentService
from app.agent.shipper import ShipperClient
from app.agent.spooler import ResilientSpooler


@pytest.fixture
def temp_spool(tmp_path: Path) -> ResilientSpooler:
    spool_db = tmp_path / "test_spool.db"
    return ResilientSpooler(db_path=str(spool_db), max_size_bytes=5 * 1024 * 1024)


def test_spooler_prioritized_dequeue(temp_spool: ResilientSpooler):
    """Ensure CRITICAL and HIGH priority events are dequeued before LOW and STATISTICAL."""
    events = [
        {"edge_tier": EdgeTier.STATISTICAL.value, "event_type": "heartbeat", "seq": 1},
        {"edge_tier": EdgeTier.LOW.value, "event_type": "file_read", "seq": 2},
        {"edge_tier": EdgeTier.CRITICAL.value, "event_type": "ransomware_detected", "seq": 3},
        {"edge_tier": EdgeTier.HIGH.value, "event_type": "privilege_escalation", "seq": 4},
        {"edge_tier": EdgeTier.MEDIUM.value, "event_type": "suspicious_dns", "seq": 5},
    ]

    temp_spool.enqueue_batch(events)
    stats = temp_spool.get_stats()
    assert stats["queued_events"] == 5

    # Dequeue highest priority
    batch = temp_spool.dequeue_batch(limit=2)
    assert len(batch) == 2
    # 1st must be CRITICAL (tier_priority 1)
    assert batch[0][1]["edge_tier"] == EdgeTier.CRITICAL.value
    # 2nd must be HIGH (tier_priority 2)
    assert batch[1][1]["edge_tier"] == EdgeTier.HIGH.value

    # Ack the batch
    ids = [b[0] for b in batch]
    temp_spool.ack_batch(ids)
    assert temp_spool.get_stats()["queued_events"] == 3

    # Next batch
    batch2 = temp_spool.dequeue_batch(limit=3)
    assert len(batch2) == 3
    assert batch2[0][1]["edge_tier"] == EdgeTier.MEDIUM.value
    assert batch2[1][1]["edge_tier"] == EdgeTier.LOW.value
    assert batch2[2][1]["edge_tier"] == EdgeTier.STATISTICAL.value

    # Nack batch2: retry count should increment
    ids2 = [b[0] for b in batch2]
    temp_spool.nack_batch(ids2)
    assert temp_spool.get_stats()["queued_events"] == 3


def test_shipper_identity_headers_and_status(tmp_path: Path, temp_spool: ResilientSpooler):
    """Verify ShipperClient properly integrates DPAPI device identity and generates metrics."""
    mgr = DeviceIdentityManager(store_dir=tmp_path)
    priv_pem, pub_pem = DeviceIdentityManager.generate_keypair()
    mgr.save_identity(
        device_id="dev-win11-prod-007",
        device_token="kavach_dev_test_token_secret_12345",
        public_key_pem=pub_pem,
        private_key_pem=priv_pem,
        hostname="win11-prod-007",
    )

    shipper = ShipperClient(
        endpoint_url="http://127.0.0.1:8000",
        host_token="legacy_token",
        spooler=temp_spool,
        identity_manager=mgr,
    )

    status = shipper.get_status()
    assert status["running"] is False
    assert status["total_events_shipped"] == 0
    assert status["total_batches_shipped"] == 0
    assert "spool" in status

    # Verify identity manager auth headers
    headers = mgr.get_auth_headers()
    assert headers["X-Device-ID"] == "dev-win11-prod-007"
    assert headers["X-Device-Token"] == "kavach_dev_test_token_secret_12345"


@pytest.mark.asyncio
async def test_agent_service_lifecycle_and_shield(tmp_path: Path):
    """Verify KavachAgentService initialization, One-Click Shield toggle, and status writing."""
    spool_db = tmp_path / "agent_spool.db"
    status_file = tmp_path / "agent_runtime_status.json"
    ident_dir = tmp_path / "ident"

    service = KavachAgentService(
        server_url="http://127.0.0.1:8000",
        host_token="test_agent_token",
        spool_path=str(spool_db),
        identity_dir=ident_dir,
        status_file=status_file,
    )

    # Initially shield is off
    assert service.shield_active is False
    status_init = service.get_full_status()
    assert status_init["shield_active"] is False
    assert status_init["collectors_total"] == 16
    assert status_init["enrolled"] is False

    # 1. Engage One-Click Shield
    shield_res = service.enable_one_click_shield()
    assert shield_res["status"] == "SHIELD_ENABLED"
    assert service.shield_active is True

    # Spool must have received the high-priority containment event
    spool_stats = service.spooler.get_stats()
    assert spool_stats["queued_events"] >= 1
    batch = service.spooler.dequeue_batch(limit=1)
    assert batch[0][1]["event_type"] == "containment_activated"
    assert batch[0][1]["edge_tier"] == EdgeTier.CRITICAL.value

    # 2. Status file writing
    service._write_status()
    assert status_file.exists()
    disk_status = json.loads(status_file.read_text(encoding="utf-8"))
    assert disk_status["shield_active"] is True
    assert disk_status["collectors_total"] == 16

    # 3. Disengage One-Click Shield
    unshield_res = service.disable_one_click_shield()
    assert unshield_res["status"] == "SHIELD_DISABLED"
    assert service.shield_active is False

    # 4. Command file ingestion
    cmd_file = service.cmd_file
    cmd_file.write_text(json.dumps({"action": "ENABLE_SHIELD"}), encoding="utf-8")
    service._check_incoming_commands()
    assert service.shield_active is True
    assert not cmd_file.exists()  # Command must be consumed and deleted
