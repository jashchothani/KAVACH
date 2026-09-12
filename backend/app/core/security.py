"""
KAVACH Security Module.

JWT token management, password hashing, and RBAC enforcement.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.constants import UserRole
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    InvalidTokenError,
    TokenExpiredError,
)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str  # user ID
    username: str
    role: UserRole
    exp: datetime
    iat: datetime
    jti: str  # unique token ID


def create_access_token(
    user_id: str,
    username: str,
    role: UserRole | str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    role_val = role.value if isinstance(role, UserRole) else str(role)

    payload = {
        "sub": user_id,
        "username": username,
        "role": role_val,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": secrets.token_hex(16),
        "iss": "kavach",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> TokenPayload:
    """Decode and validate a JWT access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer="kavach",
        )
        return TokenPayload(
            sub=payload["sub"],
            username=payload["username"],
            role=UserRole(payload["role"]),
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
            jti=payload["jti"],
        )
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError("Access token has expired")
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise InvalidTokenError(f"Invalid access token: {exc}")
