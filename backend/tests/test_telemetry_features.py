"""
KAVACH Telemetry, Guardian, and Demo Triggers Integration Tests.
"""

from __future__ import annotations

import time
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from api.app import create_app
from database.engine import init_database, close_database


@pytest_asyncio.fixture
async def async_client():
    await init_database()
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await close_database()


@pytest.mark.asyncio
async def test_guardian_block_process_simulated(async_client: AsyncClient):
    """Verify that the process block guardian endpoint returns simulated success for non-existent PIDs."""
    # Register/login is skipped since it uses a mock payload or public check depending on auth middleware.
    # Wait, the endpoint uses require_soc/get_current_user dependencies.
    # To bypass auth validation in test environment for simplicity, we mock decode_access_token or pass a dummy token.
    # Let's see: the auth middleware allows unauthenticated access or maps request.state.user = None.
    # But Depends(require_soc) throws an exception if no valid user token is provided!
    # Let's first register and log in to get a valid token.
    
    uname = f"guard_user_{int(time.time())}"
    email = f"{uname}@example.com"
    
    # Register as admin/soc
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": "sec_password123",
        "role": "soc_analyst"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    
    # Block process (should return 404 for non-existent PID)
    block_resp = await async_client.post(
        "/api/v1/guardian/block",
        json={"pid": 99999},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert block_resp.status_code == 404
    assert "not found" in block_resp.json()["detail"]


@pytest.mark.asyncio
async def test_guardian_authorize_usb(async_client: AsyncClient):
    """Verify that the USB authorization endpoint validates the security PIN."""
    uname = f"usb_user_{int(time.time())}"
    email = f"{uname}@example.com"
    
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": "sec_password123",
        "role": "layman_user"
    })
    token = reg_resp.json()["access_token"]
    
    # Invalid PIN
    auth_resp = await async_client.post(
        "/api/v1/guardian/authorize-usb",
        json={"device_id": "test_device_123", "pin": "9999"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert auth_resp.status_code == 401
    
    # Valid PIN
    auth_resp = await async_client.post(
        "/api/v1/guardian/authorize-usb",
        json={"device_id": "test_device_123", "pin": "1234"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert auth_resp.status_code == 200
    assert "authorized" in auth_resp.json()["message"]


@pytest.mark.asyncio
async def test_demo_triggers(async_client: AsyncClient):
    """Verify that all demo triggers execute successfully in non-production environment."""
    uname = f"demo_user_{int(time.time())}"
    email = f"{uname}@example.com"
    
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": "sec_password123",
        "role": "soc_analyst"
    })
    token = reg_resp.json()["access_token"]
    
    features = ["overlay", "tray", "webcam", "voice", "radar", "badusb", "ransomware"]
    for feat in features:
        resp = await async_client.post(
            f"/api/v1/demo/trigger/{feat}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"
