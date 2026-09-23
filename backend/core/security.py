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

from core.config import get_settings
from core.constants import UserRole
from core.exceptions import (
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
    settings = get_settings()
    salt = bcrypt.gensalt(rounds=settings.security.bcrypt_rounds)
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
    role: UserRole,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role.value,
        "iat": now,
        "exp": now + timedelta(minutes=settings.security.jwt_expiry_minutes),
        "jti": secrets.token_hex(16),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.security.jwt_secret,
        algorithm=settings.security.jwt_algorithm,
    )


def decode_access_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT token.

    Raises:
        TokenExpiredError: If the token has expired.
        InvalidTokenError: If the token is malformed.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.security.jwt_secret,
            algorithms=[settings.security.jwt_algorithm],
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


# ---------------------------------------------------------------------------
# RBAC helpers
# ---------------------------------------------------------------------------

def require_role(required: UserRole | list[UserRole]) -> Any:
    """
    FastAPI dependency that enforces role-based access.

    Usage in a route::

        @router.get("/admin", dependencies=[Depends(require_role(UserRole.SOC_ANALYST))])
        async def admin_endpoint(): ...
    """
    if isinstance(required, UserRole):
        required = [required]

    from fastapi import Depends, Request

    async def _check_role(request: Request) -> TokenPayload:
        token_payload: TokenPayload | None = getattr(request.state, "user", None)
        if token_payload is None:
            raise AuthenticationError("Authentication required")
        if token_payload.role not in required:
            raise AuthorizationError(
                f"Role '{token_payload.role.value}' does not have access. "
                f"Required: {[r.value for r in required]}"
            )
        return token_payload

    return Depends(_check_role)


def check_role(user_role: UserRole, required: UserRole | list[UserRole]) -> bool:
    """Check if a user role satisfies the requirement."""
    if isinstance(required, UserRole):
        required = [required]
    return user_role in required


# ---------------------------------------------------------------------------
# Hashing utilities
# ---------------------------------------------------------------------------

def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 hash of bytes."""
    return hashlib.sha256(data).hexdigest()


def compute_md5(data: bytes) -> str:
    """Compute MD5 hash of bytes."""
    return hashlib.md5(data).hexdigest()


def compute_file_hash(filepath: str, algorithm: str = "sha256") -> str:
    """Compute hash of a file."""
    h = hashlib.new(algorithm)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()
