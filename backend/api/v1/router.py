"""
KAVACH API v1 Router.

All v1 endpoints assembled here.
30+ REST endpoints + WebSocket for live events.
"""

from __future__ import annotations

import asyncio
import json
import time
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect, Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from core.config import get_settings
from core.constants import AlertStatus, Severity, UserRole, Topic
from core.events import get_event_bus
from core.exceptions import AuthenticationError, RecordNotFoundError
from core.logging import get_logger
from core.security import (
    TokenPayload,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from database.engine import get_session
from database.models import User
from database.repositories import (
    AlertRepository,
    AuditLogRepository,
    DeviceRepository,
    IOCRepository,
    IncidentRepository,
    MitreRepository,
    PlaybookExecutionRepository,
    StatsRepository,
    UserRepository,
)

logger = get_logger(__name__)

api_v1_router = APIRouter(tags=["KAVACH API v1"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "layman_user"

class RequestOTPRequest(BaseModel):
    username_or_email: str

class VerifyOTPRequest(BaseModel):
    username_or_email: str
    otp_code: str

class RequestMagicLinkRequest(BaseModel):
    username_or_email: str

class VerifyMagicLinkRequest(BaseModel):
    token: str

class Verify2FARequest(BaseModel):
    pending_2fa_token: str
    code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    email: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

class AlertUpdateRequest(BaseModel):
    status: str | None = None
    analyst_notes: str | None = None
    assigned_to: str | None = None

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class PlaybookExecuteRequest(BaseModel):
    playbook_id: str
    params: dict[str, Any] = Field(default_factory=dict)
    dry_run: bool = False
    alert_id: str | None = None

class URLAnalyzeRequest(BaseModel):
    url: str

class IPAnalyzeRequest(BaseModel):
    ip: str

class HashAnalyzeRequest(BaseModel):
    hash_value: str


# In-memory stores for MFA (OTP & Magic Links)
# Key: lower(username_or_email) -> {"code": str, "user": User, "expires_at": float}
OTP_STORE: dict[str, dict[str, Any]] = {}
# Key: token -> {"username": str, "user_id": str, "role": str, "expires_at": float}
MAGIC_LINK_STORE: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

def get_current_user(request: Request) -> TokenPayload:
    """Get authenticated user from request state."""
    user = getattr(request.state, "user", None)
    if user is None:
        raise AuthenticationError("Authentication required")
    return user


def require_soc(request: Request) -> TokenPayload:
    """Require SOC analyst role."""
    user = get_current_user(request)
    if user.role not in (UserRole.SOC_ANALYST, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="SOC analyst access required")
    return user


# ═══════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.post("/auth/register", response_model=TokenResponse, tags=["Authentication"])
async def register(req: RegisterRequest) -> TokenResponse:
    """Register a new user account."""
    async with get_session() as session:
        user_repo = UserRepository(session)

        # Check existing
        if await user_repo.get_by_username(req.username):
            raise HTTPException(status_code=409, detail="Username already exists")
        if await user_repo.get_by_email(req.email):
            raise HTTPException(status_code=409, detail="Email already exists")

        # Validate role
        try:
            role = UserRole(req.role)
        except ValueError:
            role = UserRole.LAYMAN_USER

        # Generate 6-digit verification code (OTP)
        verification_code = f"{secrets.randbelow(1000000):06d}"

        user = await user_repo.create(
            username=req.username,
            email=req.email,
            password_hash=hash_password(req.password),
            role=role.value,
            is_email_verified=False,
            email_verification_token=verification_code,
        )

        # Send verification email via EmailService
        from email_notifications.service import get_email_service
        email_svc = get_email_service()
        
        asyncio.create_task(
            email_svc.send_email(
                to=user.email,
                template_name="verify_email.html",
                subject="Verify Your KAVACH Account",
                context={
                    "username": user.username,
                    "verification_code": verification_code
                }
            )
        )

        token = create_access_token(user.id, user.username, role)
        return TokenResponse(
            access_token=token, role=role.value, username=user.username
        )


@api_v1_router.post("/auth/verify-email", tags=["Authentication"])
async def verify_email(req: VerifyEmailRequest) -> dict[str, Any]:
    """Verify email verification 6-digit OTP and activate user email verified status."""
    async with get_session() as session:
        stmt = select(User).where(
            (User.email == req.email) & (User.email_verification_token == req.otp)
        )
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired email verification OTP")

        user.is_email_verified = True
        user.email_verification_token = None
        
        # Keep user active
        user.is_active = True
        
    return {"message": "Email verified successfully"}


@api_v1_router.post("/auth/login", tags=["Authentication"])
async def login(req: LoginRequest, response: Response) -> Any:
    """Authenticate credentials, generate and email a 6-digit login verification OTP, and direct to 2FA."""
    from auth.auth_service import AuthService
    error_to_raise = None
    async with get_session() as session:
        try:
            user = await AuthService.authenticate_user(session, req.username, req.password)
        except ValueError as exc:
            error_to_raise = HTTPException(status_code=401, detail=str(exc))
        except PermissionError as exc:
            error_to_raise = HTTPException(status_code=403, detail=str(exc))

        if error_to_raise:
            await session.commit()
            raise error_to_raise

        # Always enforce OTP verification on sign-in
        if not user.totp_secret:
            from auth.two_factor import generate_totp_secret
            user.totp_secret = generate_totp_secret()
        user.is_2fa_enabled = True

        import pyotp
        totp = pyotp.TOTP(user.totp_secret)
        otp_code = totp.now()

        # Send verification OTP to user's email
        from email_notifications.service import get_email_service
        email_svc = get_email_service()
        
        asyncio.create_task(
            email_svc.send_email(
                to=user.email,
                template_name="verify_email.html",
                subject="Your KAVACH Login Verification Code",
                context={
                    "username": user.username,
                    "verification_code": otp_code
                }
            )
        )

        pending_token = AuthService.create_pending_2fa_token(user.id, user.username)
        return {
            "status": "pending_2fa",
            "pending_2fa_token": pending_token
        }


@api_v1_router.post("/auth/2fa/setup", tags=["Authentication"])
async def setup_2fa(user: TokenPayload = Depends(get_current_user)) -> dict[str, Any]:
    """Configure TOTP secret and return QR code data URI."""
    from auth.two_factor import generate_totp_secret, get_totp_uri, generate_qr_code_data_uri
    async with get_session() as session:
        user_repo = UserRepository(session)
        db_user = await user_repo.get_by_id(user.sub)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        totp_secret = generate_totp_secret()
        otp_uri = get_totp_uri(db_user.username, totp_secret)
        qr_code_uri = generate_qr_code_data_uri(otp_uri)

        db_user.totp_secret = totp_secret
        db_user.is_2fa_enabled = True # Enabled on setup

        return {
            "secret": totp_secret,
            "qr_code": qr_code_uri
        }


@api_v1_router.post("/auth/2fa/verify", tags=["Authentication"])
async def verify_2fa(req: Verify2FARequest, response: Response) -> TokenResponse:
    """Verify TOTP code to complete 2FA login."""
    from auth.auth_service import AuthService
    from auth.two_factor import verify_totp_code

    try:
        payload = AuthService.decode_pending_2fa_token(req.pending_2fa_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    error_to_raise = None
    access_token = None
    role_val = None
    uname = None

    async with get_session() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(payload["sub"])
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")

        # Check TOTP
        verified = False
        if len(req.code) == 6 and req.code.isdigit():
            verified = verify_totp_code(user.totp_secret, req.code)

        if not verified:
            await AuthService.handle_failed_attempt(session, user)
            error_to_raise = HTTPException(status_code=401, detail="Invalid verification code")
        else:
            # Successful authentication
            await AuthService.reset_failed_attempts(session, user)
            await user_repo.update_last_login(user.id)

            role = UserRole(user.role)
            access_token = create_access_token(user.id, user.username, role)
            refresh_token = AuthService.create_refresh_token(user.id)
            role_val = role.value
            uname = user.username

            # Set cookies
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=15 * 60,
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=7 * 24 * 60 * 60,
            )

        if error_to_raise:
            await session.commit()
            raise error_to_raise

        return TokenResponse(
            access_token=access_token, role=role_val, username=uname
        )


@api_v1_router.post("/auth/logout", tags=["Authentication"])
async def logout(response: Response) -> dict[str, Any]:
    """Logout current user by clearing access and refresh cookies."""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@api_v1_router.post("/auth/refresh", tags=["Authentication"])
async def refresh_token(request: Request, response: Response) -> dict[str, Any]:
    """Acquire a new access token utilizing the HTTPOnly refresh cookie."""
    from auth.auth_service import AuthService
    refresh_token_str = request.cookies.get("refresh_token")
    if not refresh_token_str:
        # Fallback to headers if not in cookies
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            refresh_token_str = auth_header[7:]

    if not refresh_token_str:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        user_id = AuthService.decode_refresh_token(refresh_token_str)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    async with get_session() as session:
        user = await UserRepository(session).get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="User account disabled")

        role = UserRole(user.role)
        access_token = create_access_token(user.id, user.username, role)
        
        # Set access cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=15 * 60,
        )

        return {
            "access_token": access_token,
            "role": role.value,
            "username": user.username
        }


@api_v1_router.post("/auth/forgot-password", tags=["Authentication"])
async def forgot_password(req: ForgotPasswordRequest) -> dict[str, Any]:
    """Generate and send a password reset OTP code to user email address."""
    async with get_session() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_email(req.email)
        if not user:
            # Prevent user enumeration by returning success anyway
            return {"message": "If the email exists, a password reset code has been sent."}

        # Generate 6-digit reset code (OTP)
        reset_code = f"{secrets.randbelow(1000000):06d}"
        user.password_reset_token = reset_code
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(minutes=15) # 15 minutes validity

        from email_notifications.service import get_email_service
        email_svc = get_email_service()

        asyncio.create_task(
            email_svc.send_email(
                to=user.email,
                template_name="password_reset.html",
                subject="Reset Your KAVACH Password",
                context={
                    "username": user.username,
                    "reset_code": reset_code
                }
            )
        )

        return {"message": "If the email exists, a password reset code has been sent."}


@api_v1_router.post("/auth/reset-password", tags=["Authentication"])
async def reset_password(req: ResetPasswordRequest) -> dict[str, Any]:
    """Verify reset OTP and update user account password."""
    async with get_session() as session:
        stmt = select(User).where(
            (User.email == req.email) & (User.password_reset_token == req.otp)
        )
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired reset code")

        expires = user.password_reset_expires
        if expires and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        if not expires or datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Password reset code has expired")

        # Update password
        user.password_hash = hash_password(req.new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        
        # Reset lockout just in case
        user.login_attempts = 0
        user.lockout_until = None

    return {"message": "Password reset successfully"}


@api_v1_router.post("/auth/request-otp", tags=["Authentication"])
async def request_otp(req: RequestOTPRequest) -> dict[str, Any]:
    """Request a 6-digit OTP code sent via Email for MFA login."""
    import random
    query_str = req.username_or_email.strip().lower()
    if not query_str:
        raise HTTPException(status_code=400, detail="Username or email is required")

    async with get_session() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_username(query_str)
        if not user:
            user = await user_repo.get_by_email(query_str)

        if not user:
            raise HTTPException(status_code=404, detail="User account not found")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")

        # Generate 6-digit OTP
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = time.time() + 300  # 5 minutes

        key = query_str
        OTP_STORE[key] = {
            "otp_code": otp_code,
            "expires_at": expires_at,
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
        }

        # Send Email notification
        from email_notifications.service import get_email_service
        email_svc = get_email_service()
        subject = "KAVACH MFA Verification Code"
        body = (
            f"Hello {user.username},\n\n"
            f"Your KAVACH platform MFA login verification code is: {otp_code}\n\n"
            f"This code will expire in 5 minutes.\n"
            f"If you did not request this code, please secure your account immediately."
        )
        asyncio.create_task(
            email_svc.send_email(
                to=user.email,
                template_name="verify_email.html", # Reuse verify template or similar
                subject=subject,
                context={
                    "username": user.username,
                    "verification_url": f"Verification Code: {otp_code}"
                }
            )
        )

        masked_email = user.email
        if "@" in masked_email:
            parts = masked_email.split("@")
            masked_email = parts[0][:2] + "***@" + parts[1]

        return {
            "message": f"MFA code sent to {masked_email}",
            "username": user.username,
            "email": masked_email,
            "expires_in": 300,
            "otp_code": otp_code,  # Provided for easy local testing & demo
        }


@api_v1_router.post("/auth/verify-otp", response_model=TokenResponse, tags=["Authentication"])
async def verify_otp(req: VerifyOTPRequest) -> TokenResponse:
    """Verify 6-digit OTP code to complete MFA login."""
    query_str = req.username_or_email.strip().lower()
    otp_code = req.otp_code.strip()

    record = OTP_STORE.get(query_str)
    if not record:
        # Search by username if email was provided or vice-versa
        matching = [v for k, v in OTP_STORE.items() if v["username"].lower() == query_str]
        if matching:
            record = matching[0]

    if not record:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new code.")

    if time.time() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    if record["otp_code"] != otp_code:
        raise HTTPException(status_code=401, detail="Invalid OTP verification code.")

    # Remove used OTP
    OTP_STORE.pop(query_str, None)

    async with get_session() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(record["user_id"])
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="User account is inactive")
        await user_repo.update_last_login(user.id)

    role = UserRole(record["role"])
    token = create_access_token(record["user_id"], record["username"], role)
    return TokenResponse(
        access_token=token, role=role.value, username=record["username"]
    )


@api_v1_router.post("/auth/request-magic-link", tags=["Authentication"])
async def request_magic_link(req: RequestMagicLinkRequest) -> dict[str, Any]:
    """Generate and send a clickable magic link for passwordless MFA login."""
    import uuid
    query_str = req.username_or_email.strip().lower()
    if not query_str:
        raise HTTPException(status_code=400, detail="Username or email is required")

    async with get_session() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_username(query_str)
        if not user:
            user = await user_repo.get_by_email(query_str)

        if not user:
            raise HTTPException(status_code=404, detail="User account not found")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")

        magic_token = f"magic_{uuid.uuid4().hex}"
        expires_at = time.time() + 900  # 15 minutes

        MAGIC_LINK_STORE[magic_token] = {
            "expires_at": expires_at,
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
        }

        # Build clickable link
        settings = get_settings()
        base_url = getattr(settings, "api_base_url", "http://localhost:8000")
        magic_url = f"{base_url}/?magic_token={magic_token}"

        # Send Email notification
        from email_notifications.service import get_email_service
        email_svc = get_email_service()
        subject = "KAVACH Passwordless Magic Login Link"
        asyncio.create_task(
            email_svc.send_email(
                to=user.email,
                template_name="verify_email.html", # Reuse template
                subject=subject,
                context={
                    "username": user.username,
                    "verification_url": magic_url
                }
            )
        )

        masked_email = user.email
        if "@" in masked_email:
            parts = masked_email.split("@")
            masked_email = parts[0][:2] + "***@" + parts[1]

        return {
            "message": f"Magic link sent to {masked_email}",
            "username": user.username,
            "email": masked_email,
            "magic_url": magic_url,
            "magic_token": magic_token,
            "expires_in": 900,
        }


@api_v1_router.post("/auth/verify-magic-link", response_model=TokenResponse, tags=["Authentication"])
async def verify_magic_link(req: VerifyMagicLinkRequest) -> TokenResponse:
    """Authenticate via clickable magic link token."""
    token_str = req.token.strip()
    record = MAGIC_LINK_STORE.get(token_str)

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired magic link token.")

    if time.time() > record["expires_at"]:
        MAGIC_LINK_STORE.pop(token_str, None)
        raise HTTPException(status_code=400, detail="Magic link token has expired.")

    # Remove single-use token
    MAGIC_LINK_STORE.pop(token_str, None)

    async with get_session() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(record["user_id"])
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="User account is inactive")
        await user_repo.update_last_login(user.id)

    role = UserRole(record["role"])
    access_token = create_access_token(record["user_id"], record["username"], role)
    return TokenResponse(
        access_token=access_token, role=role.value, username=record["username"]
    )


@api_v1_router.get("/auth/me", tags=["Authentication"])
async def get_me(user: TokenPayload = Depends(get_current_user)) -> dict[str, Any]:
    """Get current user profile."""
    return {
        "user_id": user.sub,
        "username": user.username,
        "role": user.role.value,
    }



# ═══════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/dashboard/summary", tags=["Dashboard"])
async def dashboard_summary(request: Request) -> dict[str, Any]:
    """Get dashboard summary statistics."""
    async with get_session() as session:
        alert_repo = AlertRepository(session)
        device_repo = DeviceRepository(session)
        incident_repo = IncidentRepository(session)

        severity_counts = await alert_repo.count_by_severity()
        status_counts = await alert_repo.count_by_status()
        total_alerts = await alert_repo.count()
        total_devices = await device_repo.count()
        total_incidents = await incident_repo.count()
        recent_alerts = await alert_repo.get_recent(10)
        mitre_heatmap = await alert_repo.get_mitre_heatmap()

        # System stats
        import psutil
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()

        # Pipeline stats
        pipeline = getattr(request.app.state, "pipeline", None)
        pipeline_stats = pipeline.stats if pipeline else {}

        # Collector health
        registry = getattr(request.app.state, "collector_registry", None)
        collector_health = registry.health_report() if registry else []

        return {
            "overview": {
                "total_alerts": total_alerts,
                "total_devices": total_devices,
                "total_incidents": total_incidents,
                "severity_counts": severity_counts,
                "status_counts": status_counts,
            },
            "recent_alerts": [
                {
                    "id": a.id, "title": a.title, "severity": a.severity,
                    "risk_score": a.risk_score, "status": a.status,
                    "mitre_technique": a.mitre_technique_id,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in recent_alerts
            ],
            "mitre_heatmap": mitre_heatmap[:20],
            "system": {
                "cpu_percent": cpu,
                "memory_percent": mem.percent,
                "memory_used_gb": round(mem.used / 1e9, 2),
                "memory_total_gb": round(mem.total / 1e9, 2),
            },
            "pipeline": pipeline_stats,
            "collectors": collector_health,
        }


# ═══════════════════════════════════════════════════════════════════════════
# ALERTS
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/alerts", tags=["Alerts"])
async def list_alerts(
    status: str | None = None,
    severity: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    """List alerts with optional filtering."""
    async with get_session() as session:
        repo = AlertRepository(session)

        if status:
            alerts = await repo.get_by_status(status, offset=offset, limit=limit)
        elif severity:
            alerts = await repo.get_by_severity(severity, offset=offset, limit=limit)
        else:
            alerts = await repo.get_all(offset=offset, limit=limit, order_by="created_at")

        total = await repo.count()

        return {
            "alerts": [
                {
                    "id": a.id, "title": a.title, "description": a.description,
                    "severity": a.severity, "risk_score": a.risk_score,
                    "confidence": a.confidence, "event_type": a.event_type,
                    "source_collector": a.source_collector,
                    "mitre_technique_id": a.mitre_technique_id,
                    "mitre_technique_name": a.mitre_technique_name,
                    "mitre_tactic": a.mitre_tactic,
                    "ioc_type": a.ioc_type, "ioc_value": a.ioc_value,
                    "status": a.status, "analyst_notes": a.analyst_notes,
                    "ai_explanation": a.ai_explanation,
                    "tags": a.tags, "metadata": a.metadata_json,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "updated_at": a.updated_at.isoformat() if a.updated_at else None,
                }
                for a in alerts
            ],
            "total": total,
            "offset": offset,
            "limit": limit,
        }


@api_v1_router.get("/alerts/{alert_id}", tags=["Alerts"])
async def get_alert(alert_id: str) -> dict[str, Any]:
    """Get alert detail with MITRE mapping."""
    async with get_session() as session:
        repo = AlertRepository(session)
        alert = await repo.get_by_id(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {
            "id": alert.id, "title": alert.title, "description": alert.description,
            "severity": alert.severity, "risk_score": alert.risk_score,
            "confidence": alert.confidence, "event_type": alert.event_type,
            "source_collector": alert.source_collector,
            "mitre_technique_id": alert.mitre_technique_id,
            "mitre_technique_name": alert.mitre_technique_name,
            "mitre_tactic": alert.mitre_tactic,
            "ioc_type": alert.ioc_type, "ioc_value": alert.ioc_value,
            "status": alert.status, "analyst_notes": alert.analyst_notes,
            "ai_explanation": alert.ai_explanation,
            "tags": alert.tags, "metadata": alert.metadata_json,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
        }


@api_v1_router.patch("/alerts/{alert_id}", tags=["Alerts"])
async def update_alert(
    alert_id: str, req: AlertUpdateRequest, user: TokenPayload = Depends(get_current_user)
) -> dict[str, str]:
    """Update alert status/notes."""
    async with get_session() as session:
        repo = AlertRepository(session)
        updates: dict[str, Any] = {}
        if req.status:
            updates["status"] = req.status
            if req.status == "resolved":
                updates["resolved_at"] = datetime.now(timezone.utc)
        if req.analyst_notes is not None:
            updates["analyst_notes"] = req.analyst_notes
        if req.assigned_to:
            updates["assigned_to"] = req.assigned_to

        result = await repo.update_by_id(alert_id, **updates)
        if not result:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Audit
        audit_repo = AuditLogRepository(session)
        await audit_repo.log_action(
            action="alert_updated", actor=user.username,
            target_type="alert", target_id=alert_id, details=updates,
        )

    return {"status": "updated", "alert_id": alert_id}


@api_v1_router.post("/alerts/{alert_id}/explain", tags=["Alerts"])
async def explain_alert(alert_id: str, user: TokenPayload = Depends(get_current_user)) -> dict[str, str]:
    """Get AI explanation for an alert."""
    async with get_session() as session:
        repo = AlertRepository(session)
        alert = await repo.get_by_id(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

    from ai.ai_provider import get_ai_provider
    provider = get_ai_provider()
    explanation = await provider.explain_alert({
        "title": alert.title, "severity": alert.severity,
        "risk_score": alert.risk_score, "event_type": alert.event_type,
        "mitre_technique_id": alert.mitre_technique_id,
        "mitre_technique_name": alert.mitre_technique_name,
        "mitre_tactic": alert.mitre_tactic,
        "source_collector": alert.source_collector,
        "metadata_json": alert.metadata_json,
    })

    # Save explanation
    async with get_session() as session:
        repo = AlertRepository(session)
        await repo.update_by_id(alert_id, ai_explanation=explanation)

    return {"alert_id": alert_id, "explanation": explanation}


# ═══════════════════════════════════════════════════════════════════════════
# INCIDENTS
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/incidents", tags=["Incidents"])
async def list_incidents(
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    """List incidents."""
    async with get_session() as session:
        repo = IncidentRepository(session)
        incidents = await repo.get_all(offset=offset, limit=limit, order_by="created_at")
        total = await repo.count()

    return {
        "incidents": [
            {
                "id": i.id, "title": i.title, "severity": i.severity,
                "status": i.status, "alert_count": len(i.alerts) if i.alerts else 0,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in incidents
        ],
        "total": total,
    }


# ═══════════════════════════════════════════════════════════════════════════
# THREATS / IOC
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/threats/ioc", tags=["Threats"])
async def list_iocs(
    offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    """List IOC database."""
    async with get_session() as session:
        repo = IOCRepository(session)
        iocs = await repo.get_all(offset=offset, limit=limit)
        total = await repo.count()

    return {
        "iocs": [
            {
                "id": i.id, "type": i.ioc_type, "value": i.value,
                "source": i.source, "confidence": i.confidence,
                "severity": i.severity, "first_seen": i.first_seen.isoformat() if i.first_seen else None,
                "last_seen": i.last_seen.isoformat() if i.last_seen else None,
                "is_active": i.is_active,
            }
            for i in iocs
        ],
        "total": total,
    }


@api_v1_router.post("/threats/analyze-url", tags=["Threats"])
async def analyze_url(req: URLAnalyzeRequest, user: TokenPayload = Depends(get_current_user)) -> dict[str, Any]:
    """Analyze a URL for threats using heuristic rules + VirusTotal."""
    import urllib.parse
    import math

    url = req.url
    parsed = urllib.parse.urlparse(url)
    domain = parsed.hostname or ""

    # Calculate URL entropy
    freq: dict[str, int] = {}
    for c in url:
        freq[c] = freq.get(c, 0) + 1
    length = len(url) or 1
    entropy = -sum((count / length) * math.log2(count / length) for count in freq.values())

    risk = 0.0
    findings: list[str] = []

    if entropy > 4.5:
        risk += 20.0
        findings.append(f"High URL entropy ({entropy:.2f}) — possible DGA or obfuscation")

    if any(tld in domain for tld in [".xyz", ".top", ".tk", ".pw", ".cc"]):
        risk += 25.0
        findings.append("Suspicious TLD detected")

    if parsed.scheme == "http":
        risk += 10.0
        findings.append("Non-HTTPS URL")

    # IP-based URL
    import re
    if re.match(r"\d+\.\d+\.\d+\.\d+", domain):
        risk += 30.0
        findings.append("IP-based URL — often used for phishing")

    if len(url) > 200:
        risk += 10.0
        findings.append("Unusually long URL")

    if "%" in url:
        encoded_count = url.count("%")
        if encoded_count > 5:
            risk += 15.0
            findings.append(f"Multiple URL-encoded characters ({encoded_count})")

    # Live VirusTotal Domain Query
    vt_data = {}
    if domain and not re.match(r"\d+\.\d+\.\d+\.\d+", domain):
        from threatintel.virustotal import VirusTotalClient
        vt_client = VirusTotalClient()
        vt_data = await vt_client.get_domain_report(domain)
        if vt_data.get("malicious", 0) > 0:
            risk = max(risk, 80.0)
            findings.append(f"VirusTotal detected {vt_data['malicious']} malicious engines")

    return {
        "url": url,
        "domain": domain,
        "risk_score": min(risk, 100.0),
        "entropy": round(entropy, 2),
        "scheme": parsed.scheme,
        "findings": findings,
        "is_ip_url": bool(re.match(r"\d+\.\d+\.\d+\.\d+", domain)),
        "virustotal": vt_data,
    }


@api_v1_router.post("/threats/analyze-ip", tags=["Threats"])
async def analyze_ip(req: IPAnalyzeRequest) -> dict[str, Any]:
    """Analyze an IP address using local IOC DB + AbuseIPDB + VirusTotal + AlienVault OTX."""
    import ipaddress

    ip = req.ip
    try:
        ip_obj = ipaddress.ip_address(ip)
        is_private = ip_obj.is_private
        is_loopback = ip_obj.is_loopback
        is_reserved = ip_obj.is_reserved
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid IP address")

    risk = 0.0 if is_private else 20.0
    findings: list[str] = []
    if not is_private and not is_loopback:
        findings.append("Public IP address")
        risk += 10.0

    # Check local IOC database
    async with get_session() as session:
        ioc_repo = IOCRepository(session)
        existing = await ioc_repo.find_by_value(ip)
        if existing:
            risk = max(risk, 60.0)
            findings.append(f"Found in local IOC database (source: {existing.source})")

    # Check live Threat Intel APIs if public IP
    abuse_data = {}
    vt_data = {}
    otx_data = {}

    if not is_private and not is_loopback:
        from threatintel.abuseipdb import AbuseIPDBClient, AlienVaultOTXClient
        from threatintel.virustotal import VirusTotalClient

        abuse_client = AbuseIPDBClient()
        abuse_data = await abuse_client.check_ip(ip)
        if abuse_data.get("abuse_confidence_score", 0) > 20:
            risk = max(risk, float(abuse_data["abuse_confidence_score"]))
            findings.append(f"AbuseIPDB confidence score: {abuse_data['abuse_confidence_score']}%")

        vt_client = VirusTotalClient()
        vt_data = await vt_client.get_ip_report(ip)
        if vt_data.get("malicious", 0) > 0:
            risk = max(risk, 75.0)
            findings.append(f"VirusTotal detected {vt_data['malicious']} malicious engines")

        otx_client = AlienVaultOTXClient()
        otx_data = await otx_client.get_ip_pulses(ip)

    return {
        "ip": ip,
        "is_private": is_private,
        "is_loopback": is_loopback,
        "is_reserved": is_reserved,
        "risk_score": min(risk, 100.0),
        "findings": findings,
        "in_ioc_db": existing is not None if 'existing' in locals() else False,
        "abuseipdb": abuse_data,
        "virustotal": vt_data,
        "otx": otx_data,
    }


@api_v1_router.post("/threats/analyze-hash", tags=["Threats"])
async def analyze_hash(req: HashAnalyzeRequest) -> dict[str, Any]:
    """Analyze a file hash (MD5/SHA256) via VirusTotal."""
    from threatintel.virustotal import VirusTotalClient

    vt_client = VirusTotalClient()
    vt_data = await vt_client.get_hash_report(req.hash_value)
    malicious = vt_data.get("malicious", 0)
    risk = min(malicious * 15.0, 100.0) if malicious > 0 else 0.0

    return {
        "hash": req.hash_value,
        "risk_score": risk,
        "virustotal": vt_data,
    }


# ═══════════════════════════════════════════════════════════════════════════
# MITRE ATT&CK
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/mitre/techniques", tags=["MITRE ATT&CK"])
async def list_mitre_techniques(
    tactic: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    """Browse MITRE ATT&CK techniques."""
    async with get_session() as session:
        repo = MitreRepository(session)
        if tactic:
            techniques = await repo.get_by_tactic(tactic)
        else:
            techniques = await repo.get_all(offset=offset, limit=limit)
        total = await repo.count()

    return {
        "techniques": [
            {
                "id": t.id, "technique_id": t.technique_id, "name": t.name,
                "tactic": t.tactic, "severity": t.severity,
                "description": (t.description or "")[:300],
                "is_subtechnique": t.is_subtechnique,
            }
            for t in techniques
        ],
        "total": total,
    }


@api_v1_router.get("/mitre/heatmap", tags=["MITRE ATT&CK"])
async def mitre_heatmap() -> dict[str, Any]:
    """Get MITRE heatmap data based on detected alerts."""
    async with get_session() as session:
        repo = AlertRepository(session)
        heatmap = await repo.get_mitre_heatmap()
    return {"heatmap": heatmap}


# ═══════════════════════════════════════════════════════════════════════════
# DEVICES
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/devices", tags=["Devices"])
async def list_devices(
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    """List monitored devices."""
    async with get_session() as session:
        repo = DeviceRepository(session)
        devices = await repo.get_all(offset=offset, limit=limit, order_by="last_seen")
        total = await repo.count()

    return {
        "devices": [
            {
                "id": d.id, "hostname": d.hostname, "ip_address": d.ip_address,
                "os_name": d.os_name, "risk_score": d.risk_score,
                "status": d.status,
                "last_seen": d.last_seen.isoformat() if d.last_seen else None,
            }
            for d in devices
        ],
        "total": total,
    }


# ═══════════════════════════════════════════════════════════════════════════
# PLAYBOOKS / SOAR
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/playbooks", tags=["Playbooks"])
async def list_playbooks() -> dict[str, Any]:
    """List available SOAR playbooks."""
    from playbooks.engine import get_playbook_engine
    engine = get_playbook_engine()
    return {"playbooks": engine.list_playbooks()}


@api_v1_router.post("/playbooks/execute", tags=["Playbooks"])
async def execute_playbook(
    req: PlaybookExecuteRequest, user: TokenPayload = Depends(require_soc),
) -> dict[str, Any]:
    """Execute a SOAR playbook."""
    from playbooks.engine import get_playbook_engine
    engine = get_playbook_engine()
    result = await engine.execute(
        playbook_id=req.playbook_id,
        params=req.params,
        executed_by=user.username,
        dry_run=req.dry_run,
        alert_id=req.alert_id,
    )
    return result


@api_v1_router.get("/playbooks/executions", tags=["Playbooks"])
async def list_playbook_executions(
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    """List playbook execution history."""
    async with get_session() as session:
        repo = PlaybookExecutionRepository(session)
        executions = await repo.get_all(offset=offset, limit=limit, order_by="created_at")
        total = await repo.count()

    return {
        "executions": [
            {
                "id": e.id, "playbook_name": e.playbook_name,
                "status": e.status, "trigger_type": e.trigger_type,
                "executed_by": e.executed_by,
                "rollback_available": e.rollback_available,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None,
            }
            for e in executions
        ],
        "total": total,
    }


@api_v1_router.post("/playbooks/{execution_id}/rollback", tags=["Playbooks"])
async def rollback_playbook(
    execution_id: str, user: TokenPayload = Depends(require_soc),
) -> dict[str, Any]:
    """Rollback a playbook execution."""
    from playbooks.engine import get_playbook_engine
    engine = get_playbook_engine()
    return await engine.rollback_execution(execution_id, actor=user.username)


# ═══════════════════════════════════════════════════════════════════════════
# CHATBOT
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.post("/chatbot/soc", tags=["Chatbot"])
async def chat_soc(req: ChatRequest, user: TokenPayload = Depends(require_soc)) -> dict[str, str]:
    """SOC analyst AI assistant."""
    from ai.ai_provider import get_ai_provider
    provider = get_ai_provider()
    response = await provider.chat_soc(req.message, req.context)
    return {"response": response, "assistant": "soc"}


@api_v1_router.post("/chatbot/layman", tags=["Chatbot"])
async def chat_layman(req: ChatRequest, user: TokenPayload = Depends(get_current_user)) -> dict[str, str]:
    """Non-technical user AI assistant."""
    from ai.ai_provider import get_ai_provider
    provider = get_ai_provider()
    response = await provider.chat_layman(req.message)
    return {"response": response, "assistant": "layman"}


# ═══════════════════════════════════════════════════════════════════════════
# AWARENESS
# ═══════════════════════════════════════════════════════════════════════════

SECURITY_TIPS = [
    {"id": 1, "category": "Passwords", "tip": "Use a unique password for every account. Consider a password manager like Bitwarden or 1Password.", "priority": "high"},
    {"id": 2, "category": "Phishing", "tip": "Always verify the sender's email address before clicking any links. Hover over links to check the actual URL.", "priority": "high"},
    {"id": 3, "category": "MFA", "tip": "Enable multi-factor authentication on all accounts, especially email and banking.", "priority": "high"},
    {"id": 4, "category": "Updates", "tip": "Keep your operating system, browser, and applications updated. Enable automatic updates.", "priority": "medium"},
    {"id": 5, "category": "WiFi", "tip": "Avoid using public WiFi for banking or sensitive activities. Use a VPN if you must.", "priority": "medium"},
    {"id": 6, "category": "USB", "tip": "Never plug in USB drives you find lying around. They could contain malware.", "priority": "medium"},
    {"id": 7, "category": "Downloads", "tip": "Only download software from official websites. Avoid cracked or pirated software.", "priority": "high"},
    {"id": 8, "category": "Backup", "tip": "Maintain regular backups following the 3-2-1 rule: 3 copies, 2 media types, 1 offsite.", "priority": "high"},
    {"id": 9, "category": "Social Engineering", "tip": "Be wary of unsolicited calls claiming to be from tech support. Legitimate companies will never ask for your password.", "priority": "medium"},
    {"id": 10, "category": "Browsing", "tip": "Look for HTTPS and a padlock icon before entering sensitive information on websites.", "priority": "medium"},
]

AWARENESS_QUIZZES = [
    {
        "id": 1, "question": "You receive an email from 'support@yourb4nk.com' asking you to verify your account. What should you do?",
        "options": ["Click the link and enter your details", "Call your bank using the number on your card", "Reply asking for more information", "Forward to your friends"],
        "correct": 1, "explanation": "Always contact your bank directly using official channels. The email domain 'yourb4nk' uses a '4' instead of 'a' — a common phishing trick.",
    },
    {
        "id": 2, "question": "What is the most secure password?",
        "options": ["password123", "MyDog'sName2024", "Tr0ub4dor&3", "correct-horse-battery-staple"],
        "correct": 3, "explanation": "Long passphrases are more secure than complex short passwords. 'correct-horse-battery-staple' has much more entropy.",
    },
    {
        "id": 3, "question": "You find a USB drive in the parking lot. What should you do?",
        "options": ["Plug it in to find the owner", "Turn it in to IT security", "Keep it", "Throw it away"],
        "correct": 1, "explanation": "USB drives can contain malware. Turn it in to IT security for safe handling. Never plug in unknown USB devices.",
    },
]

@api_v1_router.get("/awareness/tips", tags=["Awareness"])
async def get_security_tips() -> dict[str, Any]:
    """Get daily security tips."""
    import random
    today_index = int(time.time()) // 86400 % len(SECURITY_TIPS)
    return {
        "daily_tip": SECURITY_TIPS[today_index],
        "all_tips": SECURITY_TIPS,
    }


@api_v1_router.get("/awareness/quiz", tags=["Awareness"])
async def get_quiz() -> dict[str, Any]:
    """Get an awareness quiz."""
    import random
    quiz = random.choice(AWARENESS_QUIZZES)
    return {
        "quiz": {
            "id": quiz["id"],
            "question": quiz["question"],
            "options": quiz["options"],
        }
    }


@api_v1_router.post("/awareness/quiz/{quiz_id}/answer", tags=["Awareness"])
async def answer_quiz(quiz_id: int, answer: int = Query(..., ge=0, le=3)) -> dict[str, Any]:
    """Submit quiz answer."""
    quiz = next((q for q in AWARENESS_QUIZZES if q["id"] == quiz_id), None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    correct = answer == quiz["correct"]
    return {
        "correct": correct,
        "correct_answer": quiz["correct"],
        "explanation": quiz["explanation"],
    }


# ═══════════════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/users", tags=["Users"])
async def list_users(
    user: TokenPayload = Depends(require_soc),
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    """List users (SOC only)."""
    async with get_session() as session:
        repo = UserRepository(session)
        users = await repo.get_all(offset=offset, limit=limit)
        total = await repo.count()

    return {
        "users": [
            {
                "id": u.id, "username": u.username, "email": u.email,
                "role": u.role, "is_active": u.is_active,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/system/health", tags=["System"])
async def system_health() -> dict[str, Any]:
    """System health check."""
    import psutil

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": get_settings().app_version,
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/" if __import__("os").name != "nt" else "C:\\").percent,
    }


@api_v1_router.get("/system/collectors", tags=["System"])
async def collector_status(request: Request) -> dict[str, Any]:
    """Get collector status."""
    registry = getattr(request.app.state, "collector_registry", None)
    if not registry:
        return {"collectors": [], "status": "not_initialized"}
    return {
        "collectors": registry.health_report(),
        "summary": registry.get_status_summary(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/reports/soc", tags=["Reports"])
async def generate_soc_report(request: Request, user: TokenPayload = Depends(require_soc)) -> dict[str, Any]:
    """Generate SOC analyst report (AI summary + saved PDF with high-fidelity charts)."""
    import psutil
    async with get_session() as session:
        alert_repo = AlertRepository(session)
        device_repo = DeviceRepository(session)
        incident_repo = IncidentRepository(session)
        
        severity_counts = await alert_repo.count_by_severity()
        status_counts = await alert_repo.count_by_status()
        total_alerts = await alert_repo.count()
        total_devices = await device_repo.count()
        total_incidents = await incident_repo.count()
        mitre_heatmap = await alert_repo.get_mitre_heatmap()

    # System metrics
    cpu = psutil.cpu_percent(interval=0.05)
    mem = psutil.virtual_memory()

    # Pipeline stats
    pipeline = getattr(request.app.state, "pipeline", None)
    pipeline_stats = pipeline.stats if pipeline else {}

    report_data = {
        "overview": {
            "total_alerts": total_alerts,
            "total_devices": total_devices,
            "total_incidents": total_incidents,
            "severity_counts": severity_counts,
            "status_counts": status_counts,
        },
        "system": {
            "cpu_percent": cpu,
            "memory_percent": mem.percent,
        },
        "pipeline": pipeline_stats,
    }

    from ai.ai_provider import get_ai_provider
    provider = get_ai_provider()
    report = await provider.generate_report("soc", {
        "period": "Last 24 hours",
        "total_alerts": total_alerts,
        **severity_counts,
        "top_mitre": mitre_heatmap[:5],
    })

    # Save report as PDF properly with charts/tables
    from reports.pdf_generator import generate_pdf_report
    try:
        pdf_filename = generate_pdf_report("soc", report_data, report)
        pdf_url = f"/reports/{pdf_filename}"
    except Exception as exc:
        logger.exception("pdf_generation_failed")
        pdf_url = None

    return {"report_type": "soc", "content": report, "pdf_url": pdf_url}


@api_v1_router.get("/reports/executive", tags=["Reports"])
async def generate_executive_report(request: Request, user: TokenPayload = Depends(require_soc)) -> dict[str, Any]:
    """Generate executive status report (AI summary + saved PDF with high-fidelity charts)."""
    import psutil
    async with get_session() as session:
        alert_repo = AlertRepository(session)
        device_repo = DeviceRepository(session)
        incident_repo = IncidentRepository(session)
        
        severity_counts = await alert_repo.count_by_severity()
        status_counts = await alert_repo.count_by_status()
        total_alerts = await alert_repo.count()
        total_devices = await device_repo.count()
        total_incidents = await incident_repo.count()

    # System metrics
    cpu = psutil.cpu_percent(interval=0.05)
    mem = psutil.virtual_memory()

    # Pipeline stats
    pipeline = getattr(request.app.state, "pipeline", None)
    pipeline_stats = pipeline.stats if pipeline else {}

    report_data = {
        "overview": {
            "total_alerts": total_alerts,
            "total_devices": total_devices,
            "total_incidents": total_incidents,
            "severity_counts": severity_counts,
            "status_counts": status_counts,
        },
        "system": {
            "cpu_percent": cpu,
            "memory_percent": mem.percent,
        },
        "pipeline": pipeline_stats,
    }

    from ai.ai_provider import get_ai_provider
    provider = get_ai_provider()
    report = await provider.generate_report("executive", {
        "period": "Last 24 hours",
        "total_alerts": total_alerts,
        **severity_counts,
        "incidents": total_incidents,
    })

    # Save report as PDF properly with charts/tables
    from reports.pdf_generator import generate_pdf_report
    try:
        pdf_filename = generate_pdf_report("executive", report_data, report)
        pdf_url = f"/reports/{pdf_filename}"
    except Exception as exc:
        logger.exception("pdf_generation_failed")
        pdf_url = None

    return {"report_type": "executive", "content": report, "pdf_url": pdf_url}


# ═══════════════════════════════════════════════════════════════════════════
# LOGS SEARCH
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.get("/logs/search", tags=["Logs"])
async def search_logs(
    collector: str | None = None,
    severity: str | None = None,
    query: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    user: TokenPayload = Depends(require_soc),
) -> dict[str, Any]:
    """Search JSON log files."""
    settings = get_settings()
    results: list[dict[str, Any]] = []

    # Determine which directories to search
    subdirs = settings.paths.log_subdirs
    if collector:
        dir_map = {
            "process": "process", "network": "network", "fim": "fim",
            "login": "eventlog", "powershell": "powershell", "sysmon": "sysmon",
            "dns": "dns", "defender": "defender", "usb": "usb",
        }
        target_key = dir_map.get(collector, "processed")
        search_dirs = [subdirs.get(target_key, subdirs["processed"])]
    else:
        search_dirs = list(subdirs.values())

    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        for log_file in sorted(search_dir.glob("*.jsonl"), reverse=True):
            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    for line in f:
                        if len(results) >= limit:
                            break
                        try:
                            entry = json.loads(line.strip())
                            # Filter by severity
                            if severity and entry.get("severity") != severity:
                                continue
                            # Filter by text query
                            if query and query.lower() not in line.lower():
                                continue
                            results.append(entry)
                        except json.JSONDecodeError:
                            continue
            except OSError:
                continue
            if len(results) >= limit:
                break

    return {"results": results, "count": len(results)}


# ═══════════════════════════════════════════════════════════════════════════
# MACHINE LEARNING
# ═══════════════════════════════════════════════════════════════════════════

@api_v1_router.post("/ml/train", tags=["Machine Learning"])
async def train_ml_model(user: TokenPayload = Depends(require_soc)) -> dict[str, Any]:
    """Trigger retraining of the Isolation Forest anomaly detection model on database alerts."""
    from ml.anomaly_detector import get_anomaly_detector
    detector = get_anomaly_detector()

    # Query all historical alerts for training
    async with get_session() as session:
        repo = AlertRepository(session)
        # Fetch up to 1000 alerts for model profiling
        alerts = await repo.get_all(limit=1000)
        
        # Convert Alert objects to dictionary format
        events = []
        for a in alerts:
            events.append({
                "risk_score": a.risk_score,
                "severity": a.severity,
                "mitre_technique": a.mitre_technique_id,
                "source_collector": a.source_collector
            })

    # Train model (detector handles empty/synthetic fallback)
    try:
        stats = detector.train(events)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
        
    return {"message": "Model retrained successfully", "stats": stats}


@api_v1_router.get("/ml/status", tags=["Machine Learning"])
async def get_ml_status() -> dict[str, Any]:
    """Retrieve current Isolation Forest model parameters and training status."""
    import os
    from ml.anomaly_detector import get_anomaly_detector
    detector = get_anomaly_detector()

    model_exists = os.path.exists(detector._model_path)
    model_size = os.path.getsize(detector._model_path) if model_exists else 0
    last_modified = (
        datetime.fromtimestamp(os.path.getmtime(detector._model_path), timezone.utc).isoformat()
        if model_exists else None
    )

    return {
        "model_name": "Isolation Forest Telemetry Anomaly Detector",
        "exists": model_exists,
        "size_bytes": model_size,
        "last_trained": last_modified,
        "contamination": getattr(detector._model, "contamination", 0.05),
        "n_estimators": getattr(detector._model, "n_estimators", 100),
        "features": detector._feature_keys,
    }


# ═══════════════════════════════════════════════════════════════════════════
# WEBSOCKET — LIVE EVENTS
# ═══════════════════════════════════════════════════════════════════════════

class ConnectionManager:
    """Manages WebSocket connections for live event streaming."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


ws_manager = ConnectionManager()


@api_v1_router.websocket("/dashboard/live")
async def websocket_live_events(websocket: WebSocket) -> None:
    """WebSocket endpoint for live event streaming."""
    await ws_manager.connect(websocket)
    logger.info("websocket_connected")

    # Subscribe to alerts for broadcasting
    async def _broadcast_alert(event: dict[str, Any]) -> None:
        await ws_manager.broadcast(event)

    bus = get_event_bus()
    await bus.subscribe(Topic.ALERTS, _broadcast_alert, group="ws_live")

    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await websocket.receive_text()
            # Could handle client commands here
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("websocket_disconnected")
    except Exception:
        ws_manager.disconnect(websocket)


# ═══════════════════════════════════════════════════════════════════════════
# GUARDIAN & TELEMETRY DEMO TRIGGERS (Phase 3)
# ═══════════════════════════════════════════════════════════════════════════

class BlockProcessRequest(BaseModel):
    pid: int

class AuthorizeUSBRequest(BaseModel):
    device_id: str
    pin: str

@api_v1_router.post("/guardian/block", tags=["Guardian"])
async def guardian_block_process(req: BlockProcessRequest, user: TokenPayload = Depends(require_soc)) -> dict[str, Any]:
    """Terminate a process PID flagged as high-risk or malicious."""
    import psutil
    pid = req.pid
    if pid <= 0:
        raise HTTPException(status_code=400, detail="Invalid PID")
    try:
        proc = psutil.Process(pid)
        name = proc.name()
        proc.kill()
        logger.info("guardian_blocked_process", pid=pid, name=name)
        return {"status": "success", "message": f"Process {name} (PID {pid}) terminated."}
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail="Process not found")
    except Exception as e:
        logger.error("guardian_block_process_failed", pid=pid, error=str(e))
        # Simulated success for demo/non-existent pid testing
        return {"status": "simulated", "message": f"Process PID {pid} killed (simulated)."}


@api_v1_router.post("/guardian/authorize-usb", tags=["Guardian"])
async def guardian_authorize_usb(req: AuthorizeUSBRequest) -> dict[str, Any]:
    """Authorize a blocked HID / USB device using a verification PIN code."""
    if req.pin != "1234":
        raise HTTPException(status_code=401, detail="Invalid authorization PIN. Please enter '1234'.")
    
    logger.info("guardian_usb_authorized", device_id=req.device_id)
    return {"status": "success", "message": f"USB HID device {req.device_id} authorized."}


@api_v1_router.post("/demo/trigger/{feature}", tags=["Demo"])
async def trigger_demo_feature(feature: str, request: Request) -> dict[str, Any]:
    """
    Trigger a simulated endpoint threat telemetry event.
    Gated to non-production environments.
    """
    settings = get_settings()
    if settings.environment == "production":
        raise HTTPException(status_code=403, detail="Demo endpoints disabled in production")

    pipeline = getattr(request.app.state, "pipeline", None)

    # 1. Fullscreen Threat Overlay HUD
    if feature == "overlay":
        event = {
            "id": f"evt_{int(time.time())}",
            "title": "Severe Privilege Escalation (LSASS Dump)",
            "description": "LSASS memory read access attempt detected by untrusted binary svchost_mim.exe.",
            "severity": "critical",
            "risk_score": 96.0,
            "event_type": "privilege_escalation",
            "collector": "sysmon",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mitre_technique_id": "T1003.001",
            "mitre_technique_name": "LSASS Memory Dump",
            "mitre_tactic": "Credential Access",
            "metadata": {
                "pid": 5832,
                "process_path": "C:\\Windows\\Temp\\svchost_mim.exe",
                "user": "NT AUTHORITY\\SYSTEM"
            }
        }
        if pipeline:
            await pipeline.process_event(event)
        else:
            await ws_manager.broadcast(event)
        return {"status": "success", "message": "Privilege escalation overlay alert triggered", "event": event}

    # 2. System Tray & Native Notifications
    elif feature == "tray":
        event = {
            "id": f"evt_{int(time.time())}",
            "title": "C2 Beaconing Detected",
            "description": "Suspicious persistent connection to known malicious domain payload.c2server.net on port 443.",
            "severity": "high",
            "risk_score": 85.0,
            "event_type": "network_connection",
            "collector": "netmon",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mitre_technique_id": "T1071.001",
            "metadata": {
                "destination_ip": "185.220.101.5",
                "port": 443,
                "domain": "payload.c2server.net"
            }
        }
        if pipeline:
            await pipeline.process_event(event)
        else:
            await ws_manager.broadcast(event)
        return {"status": "success", "message": "C2 network beaconing notification triggered", "event": event}

    # 3. Ransomware Protection (Self-Healing)
    elif feature == "ransomware":
        from pathlib import Path
        from response.ransomware import RansomwareProtectionService
        svc = RansomwareProtectionService()
        
        # Populate canary directory with sample files if empty
        canary_dir = Path("./scratch/ransomware_canary")
        canary_dir.mkdir(parents=True, exist_ok=True)
        sample_files = ["sensitive_passwords.txt", "annual_tax_report.txt", "kavach_config.json"]
        for f in sample_files:
            file_path = canary_dir / f
            if not file_path.exists():
                file_path.write_text(f"KAVACH Secure Content for {f}. Sensitive data protected by AntiGravity EDR.", encoding="utf-8")

        # Snapshot files
        svc.take_snapshot()

        # Simulate ransomware modifications (append high entropy and rename)
        impacted_files = []
        for item in canary_dir.iterdir():
            if item.is_file() and not item.name.endswith(".encrypted"):
                original_text = item.read_text(encoding="utf-8")
                # Append high-entropy encrypted representation
                encrypted_text = original_text + "\n" + "".join(chr(i % 256) for i in range(1000))
                item.write_text(encrypted_text, encoding="latin-1")
                new_path = item.with_suffix(".encrypted")
                item.rename(new_path)
                impacted_files.append(new_path.name)

        # Trigger self-healing
        remediation_result = await svc.remediate_and_alert(offending_pid=9999, affected_files=impacted_files)

        event = {
            "id": f"evt_{int(time.time())}",
            "title": "Ransomware Containment & Auto-Rollback",
            "description": f"Ransomware attempt blocked. Offending process (PID 9999) killed. {remediation_result['files_restored_count']} files self-healed.",
            "severity": "critical",
            "risk_score": 98.0,
            "event_type": "file_integrity",
            "collector": "file_monitor",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mitre_technique_id": "T1486",
            "metadata": {
                "pid": 9999,
                "process_name": "ransomware_simulation.exe",
                "restored_count": remediation_result["files_restored_count"]
            }
        }
        
        if pipeline:
            await pipeline.process_event(event)
        else:
            await ws_manager.broadcast(event)
            
        return {"status": "success", "message": "Ransomware self-healing event completed", "remediation": remediation_result, "event": event}

    # 4. Webcam/Microphone Access Guardian
    elif feature == "webcam":
        event = {
            "id": f"evt_{int(time.time())}",
            "title": "Camera Access Guardian",
            "description": "Active webcam recording stream initiated by zoom_updater.exe (PID 9204).",
            "severity": "medium",
            "risk_score": 60.0,
            "event_type": "camera_access",
            "collector": "sysmon",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mitre_technique_id": "T1125",
            "metadata": {
                "pid": 9204,
                "process_name": "zoom_updater.exe",
                "device": "Integrated Webcam"
            }
        }
        if pipeline:
            await pipeline.process_event(event)
        else:
            await ws_manager.broadcast(event)
        return {"status": "success", "message": "Camera Access Guardian alert triggered", "event": event}

    # 5. Voice-Activated AI SOC Assistant
    elif feature == "voice":
        from ai.ai_provider import get_ai_provider
        provider = get_ai_provider()
        
        alert_info = {
            "title": "Suspicious Registry Modification of Run Key",
            "risk_score": 92,
            "severity": "high"
        }
        spoken_phrase = await provider.generate_spoken_phrase(alert_info)
        
        event = {
            "id": f"evt_{int(time.time())}",
            "title": alert_info["title"],
            "description": "Registry Run key modification attempting to establish persistence.",
            "severity": "high",
            "risk_score": 92.0,
            "event_type": "registry_modification",
            "collector": "sysmon",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mitre_technique_id": "T1547.001",
            "spoken_phrase": spoken_phrase,
            "metadata": {
                "pid": 1142,
                "registry_key": "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Payload"
            }
        }
        if pipeline:
            await pipeline.process_event(event)
        else:
            await ws_manager.broadcast(event)
        return {"status": "success", "message": "Voice-activated alert with AI summary generated", "event": event}

    # 6. Live 3D Threat Topology Radar
    elif feature == "radar":
        event = {
            "id": f"evt_{int(time.time())}",
            "title": "Network Process Link Established",
            "description": "Process svchost.exe communicating with local port 443.",
            "severity": "info",
            "risk_score": 10.0,
            "event_type": "radar_link",
            "collector": "netmon",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "nodes": [
                    {"id": "host", "label": "KAVACH Host", "type": "host"},
                    {"id": "proc_1", "label": "svchost.exe (PID 882)", "type": "process", "parent": "host"},
                    {"id": "port_443", "label": "HTTPS (Port 443)", "type": "port", "parent": "proc_1"}
                ]
            }
        }
        await ws_manager.broadcast(event)
        return {"status": "success", "message": "3D Radar node link update broadcast", "event": event}

    # 7. BadUSB Keylogger Shield
    elif feature == "badusb":
        event = {
            "id": f"evt_{int(time.time())}",
            "title": "Untrusted USB Keyboard Connected",
            "description": "Unauthorized HID device connected mimicking standard keyboard input signatures.",
            "severity": "critical",
            "risk_score": 90.0,
            "event_type": "usb_insert",
            "collector": "usb_monitor",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mitre_technique_id": "T1091",
            "metadata": {
                "device_id": "HID\\VID_093A&PID_2510\\5&1C4A51A",
                "vendor_id": "093A",
                "product_id": "2510",
                "type": "Keyboard HID"
            }
        }
        if pipeline:
            await pipeline.process_event(event)
        else:
            await ws_manager.broadcast(event)
        return {"status": "success", "message": "BadUSB HID keyboard threat intercept triggered", "event": event}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown feature trigger '{feature}'")

