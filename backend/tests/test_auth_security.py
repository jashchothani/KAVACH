"""
KAVACH Account Security & 2FA Integration Tests.
"""

from __future__ import annotations

import asyncio
import time
import pytest
import pytest_asyncio
import pyotp
import json
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from api.app import create_app
from database.engine import init_database, close_database, get_session
from database.models import User
from database.repositories import UserRepository
from core.security import hash_password, verify_password

@pytest_asyncio.fixture
async def async_client():
    await init_database()
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await close_database()


@pytest.mark.asyncio
async def test_email_verification_flow(async_client: AsyncClient):
    uname = f"verify_user_{int(time.time())}"
    email = f"{uname}@example.com"
    password = "password123"

    # Register
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": password,
        "role": "layman_user"
    })
    assert reg_resp.status_code == 200

    # Retrieve verification token from DB
    async with get_session() as session:
        stmt = select(User).where(User.username == uname)
        res = await session.execute(stmt)
        user = res.scalar_one()
        assert not user.is_email_verified
        assert user.email_verification_token is not None
        token = user.email_verification_token

    # Verify email via endpoint
    verify_resp = await async_client.post("/api/v1/auth/verify-email", json={
        "email": email,
        "otp": token
    })
    assert verify_resp.status_code == 200
    assert verify_resp.json()["message"] == "Email verified successfully"

    # Verify state in DB
    async with get_session() as session:
        stmt = select(User).where(User.username == uname)
        res = await session.execute(stmt)
        user = res.scalar_one()
        assert user.is_email_verified
        assert user.email_verification_token is None


@pytest.mark.asyncio
async def test_login_lockout_mechanism(async_client: AsyncClient):
    uname = f"lockout_user_{int(time.time())}"
    email = f"{uname}@example.com"
    password = "correct_password"

    # Register
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": password,
        "role": "layman_user"
    })
    assert reg_resp.status_code == 200

    # Verify email so user is active
    async with get_session() as session:
        stmt = select(User).where(User.username == uname)
        res = await session.execute(stmt)
        user = res.scalar_one()
        user.is_email_verified = True
        user.is_active = True

    # Attempt failed logins (5 attempts allowed)
    for _ in range(5):
        login_resp = await async_client.post("/api/v1/auth/login", json={
            "username": uname,
            "password": "wrong_password"
        })
        assert login_resp.status_code == 401
        assert "Invalid credentials" in login_resp.json()["detail"]

    # 6th attempt should trigger lockout (HTTP 403)
    lockout_resp = await async_client.post("/api/v1/auth/login", json={
        "username": uname,
        "password": "wrong_password"
    })
    assert lockout_resp.status_code == 403
    assert "locked" in lockout_resp.json()["detail"]

    # Correct credentials should also fail during lockout
    lockout_resp_correct = await async_client.post("/api/v1/auth/login", json={
        "username": uname,
        "password": password
    })
    assert lockout_resp_correct.status_code == 403


@pytest.mark.asyncio
async def test_totp_2fa_setup_and_verify(async_client: AsyncClient):
    uname = f"2fa_user_{int(time.time())}"
    email = f"{uname}@example.com"
    password = "password123"

    # Register and verify email
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": password,
        "role": "layman_user"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]

    async with get_session() as session:
        stmt = select(User).where(User.username == uname)
        res = await session.execute(stmt)
        user = res.scalar_one()
        user.is_email_verified = True
        user.is_active = True

    # Setup 2FA
    setup_resp = await async_client.post(
        "/api/v1/auth/2fa/setup",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert setup_resp.status_code == 200
    setup_data = setup_resp.json()
    assert "secret" in setup_data
    assert "qr_code" in setup_data

    totp_secret = setup_data["secret"]

    # Now login should return status pending_2fa
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "username": uname,
        "password": password
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["status"] == "pending_2fa"
    assert "pending_2fa_token" in login_data
    pending_token = login_data["pending_2fa_token"]

    # Verify with incorrect TOTP
    verify_resp = await async_client.post("/api/v1/auth/2fa/verify", json={
        "pending_2fa_token": pending_token,
        "code": "111111"
    })
    assert verify_resp.status_code == 401

    # Verify with correct TOTP
    totp = pyotp.TOTP(totp_secret)
    correct_code = totp.now()
    
    verify_resp = await async_client.post("/api/v1/auth/2fa/verify", json={
        "pending_2fa_token": pending_token,
        "code": correct_code
    })
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert "access_token" in verify_data
    assert verify_data["username"] == uname


@pytest.mark.asyncio
async def test_forgot_and_reset_password(async_client: AsyncClient):
    uname = f"reset_user_{int(time.time())}"
    email = f"{uname}@example.com"
    password = "old_password"

    # Register & verify email
    reg_resp = await async_client.post("/api/v1/auth/register", json={
        "username": uname,
        "email": email,
        "password": password,
        "role": "layman_user"
    })
    assert reg_resp.status_code == 200

    async with get_session() as session:
        stmt = select(User).where(User.username == uname)
        res = await session.execute(stmt)
        user = res.scalar_one()
        user.is_email_verified = True
        user.is_active = True

    # Forgot password request
    forgot_resp = await async_client.post("/api/v1/auth/forgot-password", json={
        "email": email
    })
    assert forgot_resp.status_code == 200

    # Retrieve reset token from DB
    async with get_session() as session:
        stmt = select(User).where(User.username == uname)
        res = await session.execute(stmt)
        user = res.scalar_one()
        assert user.password_reset_token is not None
        reset_token = user.password_reset_token

    # Reset password
    reset_resp = await async_client.post("/api/v1/auth/reset-password", json={
        "email": email,
        "otp": reset_token,
        "new_password": "new_secure_password"
    })
    assert reset_resp.status_code == 200

    # Try to login with new password
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "username": uname,
        "password": "new_secure_password"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["status"] == "pending_2fa"
    assert "pending_2fa_token" in login_data
