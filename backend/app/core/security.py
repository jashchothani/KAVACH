"""
KAVACH Backend - Security Utilities
JWT token generation, password hashing, RBAC
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# Role hierarchy and permissions
ROLE_PERMISSIONS = {
    "super_admin": [
        "dashboard:view", "users:manage", "threats:view", "threats:manage",
        "incidents:view", "incidents:manage", "playbooks:execute", "playbooks:approve",
        "analytics:view", "reports:export", "audit:view", "ai_security:use",
        "threat_intel:view", "settings:manage"
    ],
    "soc_analyst": [
        "dashboard:view", "threats:view", "threats:manage",
        "incidents:view", "incidents:manage", "analytics:view",
        "ai_security:use", "threat_intel:view"
    ],
    "incident_responder": [
        "dashboard:view", "threats:view", "incidents:view", "incidents:manage",
        "playbooks:execute", "analytics:view", "ai_security:use", "threat_intel:view"
    ],
    "security_manager": [
        "dashboard:view", "users:manage", "threats:view", "threats:manage",
        "incidents:view", "incidents:manage", "playbooks:execute", "playbooks:approve",
        "analytics:view", "reports:export", "audit:view", "ai_security:use",
        "threat_intel:view"
    ],
    "auditor": [
        "dashboard:view", "threats:view", "incidents:view",
        "analytics:view", "reports:export", "audit:view"
    ],
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


def require_permission(permission: str):
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        role = current_user.get("role", "")
        permissions = ROLE_PERMISSIONS.get(role, [])
        if permission not in permissions and role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required"
            )
        return current_user
    return permission_checker
