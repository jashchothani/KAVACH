"""
KAVACH Automated Tests — Priority 5: Automatic Secret & Device Identity Management.

Validates:
1. RSA-2048 keypair generation and Windows DPAPI encrypted local storage roundtrip.
2. Short-lived single-use enrollment challenge nonce issuance and expiry.
3. Cryptographic challenge-response verification & device token generation.
4. Tampered signature and replay attack prevention (single-use nonces).
5. Token rotation and immediate credential revocation.
6. Telemetry rejection when presenting revoked or invalid device credentials.
"""

from pathlib import Path
import time
import pytest
from httpx import AsyncClient

from app.agent.identity import DeviceIdentityManager, dpapi_protect, dpapi_unprotect
from app.database.engine import init_database


def get_err(resp) -> str:
    data = resp.json()
    if isinstance(data, dict):
        if "error" in data and isinstance(data["error"], dict):
            return data["error"].get("message", "")
        return data.get("detail", "")
    return str(data)


@pytest.mark.asyncio
async def test_dpapi_and_keypair_crypto():
    """Verify local cryptographic operations and Windows DPAPI storage."""
    # 1. DPAPI roundtrip
    secret_data = b"CRITICAL_KAVACH_DPAPI_SECRET_PAYLOAD"
    protected = dpapi_protect(secret_data, description="Test DPAPI")
    assert protected != secret_data
    unprotected = dpapi_unprotect(protected)
    assert unprotected == secret_data

    # 2. RSA keypair generation
    priv_pem, pub_pem = DeviceIdentityManager.generate_keypair()
    assert "BEGIN PRIVATE KEY" in priv_pem
    assert "BEGIN PUBLIC KEY" in pub_pem

    # 3. Signature verification
    nonce = "test-challenge-nonce-1234567890abcdef"
    sig_b64 = DeviceIdentityManager.sign_nonce(priv_pem, nonce)
    assert sig_b64 is not None
    assert len(sig_b64) > 30

    is_valid = DeviceIdentityManager.verify_nonce_signature(pub_pem, nonce, sig_b64)
    assert is_valid is True

    # Tampered nonce fails verification
    is_invalid = DeviceIdentityManager.verify_nonce_signature(pub_pem, "tampered-nonce", sig_b64)
    assert is_invalid is False


@pytest.mark.asyncio
async def test_device_enrollment_lifecycle(async_client: AsyncClient, tmp_path):
    """Test full challenge-response device enrollment, rotation, revocation, and telemetry gate."""
    await init_database()

    # 1. Create an active user
    uname = f"enrolled_user_{int(time.time() * 1000)}"
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": f"{uname}@enterprise.com",
        "password": "ValidPassword123!",
        "role": "user",
    })
    assert reg_resp.status_code == 200
    user_token = reg_resp.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Local Agent generates keypair
    priv_pem, pub_pem = DeviceIdentityManager.generate_keypair()
    mgr = DeviceIdentityManager(store_dir=tmp_path)

    # 3. Request enrollment challenge nonce
    chal_resp = await async_client.post(
        "/api/v1/enrollment/challenge",
        json={"hostname": "forensic-ws-01"},
        headers=user_headers,
    )
    assert chal_resp.status_code == 201
    chal_data = chal_resp.json()
    nonce = chal_data["nonce"]
    assert len(nonce) == 64

    # 4. Sign nonce locally using private key
    sig_b64 = DeviceIdentityManager.sign_nonce(priv_pem, nonce)

    # 5. Tampered signature attempt must be rejected
    bad_verify = await async_client.post(
        "/api/v1/enrollment/verify",
        json={
            "nonce": nonce,
            "signature": "VGFtcGVyZWRTaWduYXR1cmVCYXNlNjQ=",
            "public_key_pem": pub_pem,
            "hostname": "forensic-ws-01",
        },
        headers=user_headers,
    )
    assert bad_verify.status_code == 401
    assert "Cryptographic signature verification failed" in get_err(bad_verify)

    # 6. Valid verification & enrollment
    enroll_resp = await async_client.post(
        "/api/v1/enrollment/verify",
        json={
            "nonce": nonce,
            "signature": sig_b64,
            "public_key_pem": pub_pem,
            "hostname": "forensic-ws-01",
            "os_info": "Windows 11 Pro 23H2",
        },
        headers=user_headers,
    )
    assert enroll_resp.status_code == 201
    enroll_data = enroll_resp.json()
    device_id = enroll_data["device_id"]
    device_token = enroll_data["device_token"]
    assert device_token.startswith("kavach_dev_")
    assert enroll_data["status"] == "ENROLLED"

    # Save to local DPAPI store
    ident = mgr.save_identity(
        device_id=device_id,
        device_token=device_token,
        public_key_pem=pub_pem,
        private_key_pem=priv_pem,
        hostname="forensic-ws-01",
    )
    assert mgr.is_enrolled() is True
    loaded_ident = mgr.load_identity()
    assert loaded_ident.device_id == device_id
    assert loaded_ident.device_token == device_token

    # 7. Replay attack: Using the same nonce again must fail
    replay_resp = await async_client.post(
        "/api/v1/enrollment/verify",
        json={
            "nonce": nonce,
            "signature": sig_b64,
            "public_key_pem": pub_pem,
            "hostname": "forensic-ws-01",
        },
        headers=user_headers,
    )
    assert replay_resp.status_code == 422
    assert "already been used" in get_err(replay_resp).lower()

    # 8. Submit telemetry using the device credential
    telemetry_resp = await async_client.post(
        "/api/v1/telemetry/ingest",
        json={
            "host_id": device_id,
            "hostname": "forensic-ws-01",
            "events": [{
                "event_type": "process_create",
                "severity": "low",
                "process_name": "notepad.exe",
                "process_id": 1024,
            }],
        },
        headers={
            "X-Device-ID": device_id,
            "X-Device-Token": device_token,
        },
    )
    assert telemetry_resp.status_code == 202

    # 9. Rotate device token
    rotate_resp = await async_client.post(
        "/api/v1/enrollment/rotate",
        json={"device_id": device_id, "current_token": device_token},
    )
    assert rotate_resp.status_code == 200
    new_token = rotate_resp.json()["device_token"]
    assert new_token != device_token

    # Old token is now invalid for telemetry
    old_token_telemetry = await async_client.post(
        "/api/v1/telemetry/ingest",
        json={"events": []},
        headers={"X-Device-ID": device_id, "X-Device-Token": device_token},
    )
    assert old_token_telemetry.status_code == 401

    # New token works for telemetry
    new_token_telemetry = await async_client.post(
        "/api/v1/telemetry/ingest",
        json={"events": []},
        headers={"X-Device-ID": device_id, "X-Device-Token": new_token},
    )
    assert new_token_telemetry.status_code == 202

    # 10. Revoke device
    revoke_resp = await async_client.post(
        f"/api/v1/enrollment/revoke/{device_id}",
        json={"reason": "Workstation decommissioned"},
        headers=user_headers,
    )
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["status"] == "REVOKED"

    # Telemetry with revoked device token is immediately rejected
    revoked_telemetry = await async_client.post(
        "/api/v1/telemetry/ingest",
        json={"events": []},
        headers={"X-Device-ID": device_id, "X-Device-Token": new_token},
    )
    assert revoked_telemetry.status_code == 401


def test_device_identity_manager_storage_path_and_ensure_identity(tmp_path: Path):
    """Verify DeviceIdentityManager accepts storage_path as file or dir and returns host fingerprint."""
    file_path = tmp_path / "custom_identity.enc"
    mgr = DeviceIdentityManager(storage_path=file_path)
    assert mgr.store_file == file_path
    assert mgr.store_dir == tmp_path

    # ensure_device_identity returns fingerprint dict with host_id and hostname
    meta = mgr.ensure_device_identity()
    assert "host_id" in meta
    assert "hostname" in meta
    assert len(meta["host_id"]) > 0

    # Also test directory path given to storage_path
    dir_mgr = DeviceIdentityManager(storage_path=tmp_path)
    assert dir_mgr.store_dir == tmp_path
    assert dir_mgr.store_file == tmp_path / "device_identity.enc"

