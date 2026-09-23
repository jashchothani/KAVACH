"""
KAVACH Authentication & Security Service.

Manages password verification, TOTP validation, user lockouts,
email verification tokens, and JWT tokens.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
import json
from typing import Any
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import get_settings
from core.security import hash_password, verify_password, create_access_token
from core.constants import UserRole
from database.models import User
from auth.two_factor import (
    generate_totp_secret,
    get_totp_uri,
    generate_qr_code_data_uri,
    verify_totp_code,
    generate_backup_codes,
)
from email_notifications.service import get_email_service
from core.logging import get_logger

logger = get_logger(__name__)

LOCKOUT_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


class AuthService:
    """Authentication and security logic executor."""

    @staticmethod
    async def handle_failed_attempt(session: AsyncSession, user: User) -> None:
        """Increment login attempts and apply lockout if limit is reached."""
        user.login_attempts += 1
        if user.login_attempts >= LOCKOUT_ATTEMPTS:
            user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            logger.warning("user_locked_out", username=user.username, until=user.lockout_until.isoformat())
        await session.flush()

    @staticmethod
    async def reset_failed_attempts(session: AsyncSession, user: User) -> None:
        """Reset login attempts and lockout timestamps."""
        user.login_attempts = 0
        user.lockout_until = None
        await session.flush()

    @classmethod
    async def authenticate_user(
        cls, session: AsyncSession, username_or_email: str, password: str
    ) -> User:
        """
        Validate credentials, enforce lockout checks, and track attempts.
        
        Raises Exception/HTTPException if invalid.
        """
        stmt = select(User).where(
            (User.username == username_or_email) | (User.email == username_or_email)
        )
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            logger.warning("auth_failed_user_not_found", query=username_or_email)
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account is disabled")

        # Lockout check
        if user.lockout_until:
            lockout_time = user.lockout_until
            if lockout_time.tzinfo is None:
                lockout_time = lockout_time.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if now < lockout_time:
                diff = int((lockout_time - now).total_seconds() / 60) + 1
                raise PermissionError(f"Account locked. Try again in {diff} minutes.")
            else:
                # Lockout expired, reset attempts
                await cls.reset_failed_attempts(session, user)

        # Password verify
        if not verify_password(password, user.password_hash):
            await cls.handle_failed_attempt(session, user)
            raise ValueError("Invalid credentials")

        # Success: reset attempts
        await cls.reset_failed_attempts(session, user)
        return user

    @staticmethod
    def create_pending_2fa_token(user_id: str, username: str) -> str:
        """Create a short-lived token to sign in with after username/password check when 2FA is enabled."""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "username": username,
            "is_pending_2fa": True,
            "exp": now + timedelta(minutes=5),
            "iat": now,
        }
        return jwt.encode(payload, settings.security.jwt_secret, algorithm=settings.security.jwt_algorithm)

    @staticmethod
    def decode_pending_2fa_token(token: str) -> dict[str, Any]:
        """Decode and validate short-lived pending 2FA token."""
        settings = get_settings()
        try:
            payload = jwt.decode(token, settings.security.jwt_secret, algorithms=[settings.security.jwt_algorithm])
            if not payload.get("is_pending_2fa"):
                raise ValueError("Not a pending 2FA token")
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Pending 2FA token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid 2FA token")

    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create a longer-lived refresh token."""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "is_refresh": True,
            "exp": now + timedelta(days=7),
            "iat": now,
        }
        return jwt.encode(payload, settings.security.jwt_secret, algorithm=settings.security.jwt_algorithm)

    @staticmethod
    def decode_refresh_token(token: str) -> str:
        """Decode refresh token and return user ID."""
        settings = get_settings()
        try:
            payload = jwt.decode(token, settings.security.jwt_secret, algorithms=[settings.security.jwt_algorithm])
            if not payload.get("is_refresh"):
                raise ValueError("Not a refresh token")
            return payload["sub"]
        except Exception:
            raise ValueError("Invalid or expired refresh token")
