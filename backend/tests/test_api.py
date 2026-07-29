"""
KAVACH API Tests.

Tests authentication, health, dashboard, alerts, playbooks, and awareness endpoints.
"""

from __future__ import annotations

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
async def test_health_check(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/system/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_auth_flow(async_client: AsyncClient):
    import time
    uname = f"test_analyst_{int(time.time())}"
    # Register
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": f"{uname}@test.com",
        "password": "securepassword123",
        "role": "soc_analyst",
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]

    # Profile check with token
    me_resp = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["username"] == uname
    assert me_data["role"] == "soc_analyst"


@pytest.mark.asyncio
async def test_dashboard_summary(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "overview" in data
    assert "system" in data


@pytest.mark.asyncio
async def test_playbook_list(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/playbooks")
    assert resp.status_code == 200
    data = resp.json()
    assert "playbooks" in data
    assert len(data["playbooks"]) >= 5


@pytest.mark.asyncio
async def test_awareness_tips(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/awareness/tips")
    assert resp.status_code == 200
    data = resp.json()
    assert "daily_tip" in data
    assert "all_tips" in data


@pytest.mark.asyncio
async def test_mfa_otp_flow(async_client: AsyncClient):
    import time
    uname = f"mfa_user_{int(time.time())}"
    # Register user
    reg = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": f"{uname}@soc.kavach",
        "password": "Password123!",
        "role": "soc_analyst",
    })
    assert reg.status_code == 200

    # Request OTP
    otp_req = await async_client.post("/api/v1/auth/request-otp", json={"username_or_email": uname})
    assert otp_req.status_code == 200
    otp_data = otp_req.json()
    assert "otp_code" in otp_data

    # Verify OTP
    otp_ver = await async_client.post("/api/v1/auth/verify-otp", json={
        "username_or_email": uname,
        "otp_code": otp_data["otp_code"],
    })
    assert otp_ver.status_code == 200
    assert "access_token" in otp_ver.json()


@pytest.mark.asyncio
async def test_mfa_magic_link_flow(async_client: AsyncClient):
    import time
    uname = f"magic_user_{int(time.time())}"
    # Register user
    reg = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": f"{uname}@soc.kavach",
        "password": "Password123!",
        "role": "soc_analyst",
    })
    assert reg.status_code == 200

    # Request Magic Link
    m_req = await async_client.post("/api/v1/auth/request-magic-link", json={"username_or_email": uname})
    assert m_req.status_code == 200
    m_data = m_req.json()
    assert "magic_token" in m_data

    # Verify Magic Link
    m_ver = await async_client.post("/api/v1/auth/verify-magic-link", json={"token": m_data["magic_token"]})
    assert m_ver.status_code == 200
    assert "access_token" in m_ver.json()

