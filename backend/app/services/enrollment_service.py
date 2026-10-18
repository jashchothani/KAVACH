"""
KAVACH Server-Side Device Enrollment & Identity Service.
Enforces zero-trust cryptographic device enrollment:
1. Issue short-lived, single-use enrollment challenge nonces.
2. Validate user identity and quota (devices cannot self-authorize without active user clearance).
3. Verify RSA-2048 cryptographic challenge signatures.
4. Issue scoped device tokens with SHA-256 storage.
5. Provide rotation, expiry enforcement, and immediate revocation.
"""
from __future__ import annotations
import hashlib
import platform
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.identity import DeviceIdentityManager
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    RecordNotFoundError,
    ValidationError,
)
from app.core.logging import get_logger
from app.core.security import TokenPayload, is_admin
from app.database.models import (
    AccountStatus,
    AuditLog,
    Device,
    DeviceCredential,
    EnrollmentChallenge,
    User,
)
logger = get_logger("kavach_enrollment_service")
def _utcnow() -> datetime:
    return datetime.now(timezone.utc)
def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
class EnrollmentService:
    """Manages secure device onboarding, challenge verification, and credential lifecycle."""

    MAX_DEVICES_PER_USER = 5
    CHALLENGE_TTL_SECONDS = 300  # 5 minutes

    @staticmethod
    async def request_challenge(
        session: AsyncSession,
        user_payload: TokenPayload,
        hostname: str | None = None,
    ) -> dict[str, Any]:
        """
        Step 1 of Enrollment: Authenticated user requests a single-use challenge nonce.
        """
        user_stmt = select(User).where(User.id == user_payload.sub)
        user_res = await session.execute(user_stmt)
        user = user_res.scalars().first()
        if not user:
            raise AuthenticationError("Authenticated user record not found.")

        # Check account status
        user_status = getattr(user, "status", "ACTIVE")
        if user_status != AccountStatus.ACTIVE or not user.is_active:
            raise AuthorizationError(
                f"Account is in '{user_status}' status. Device enrollment requires an ACTIVE account."
            )

        # Check device quota for non-admins
        if not is_admin(user.role):
            active_dev_stmt = select(func.count(Device.id)).where(
                (Device.enrolled_user_id == user.id) & (Device.status != "REVOKED")
            )
            dev_count = (await session.execute(active_dev_stmt)).scalar_one()
            if dev_count >= EnrollmentService.MAX_DEVICES_PER_USER:
                raise ConflictError(
                    f"Device quota exceeded. Maximum {EnrollmentService.MAX_DEVICES_PER_USER} active devices allowed per account."
                )

        now = _utcnow()
        nonce = secrets.token_hex(32)  # 64-char hex nonce
        expires_at = now + timedelta(seconds=EnrollmentService.CHALLENGE_TTL_SECONDS)

        challenge = EnrollmentChallenge(
            nonce=nonce,
            user_id=user.id,
            hostname=hostname,
            expires_at=expires_at,
            is_used=False,
            created_at=now,
        )
        session.add(challenge)
        await session.flush()

        logger.info("enrollment_challenge_issued", user_id=user.id, hostname=hostname)
        return {
            "nonce": nonce,
            "expires_at": expires_at.isoformat(),
            "ttl_seconds": EnrollmentService.CHALLENGE_TTL_SECONDS,
        }

    @staticmethod
    async def verify_and_enroll(
        session: AsyncSession,
        user_payload: TokenPayload,
        nonce: str,
        signature_b64: str,
        public_key_pem: str,
        hostname: str,
        os_info: str | None = None,
        ip_address: str | None = None,
    ) -> dict[str, Any]:
        """
        Step 2 of Enrollment: Verify nonce signature and issue device-scoped credential.
        """
        now = _utcnow()
        stmt = select(EnrollmentChallenge).where(EnrollmentChallenge.nonce == nonce.strip())
        res = await session.execute(stmt)
        challenge = res.scalars().first()

        if not challenge:
            raise ValidationError("Invalid or unknown enrollment challenge.")
        if challenge.is_used:
            raise ValidationError("Enrollment challenge has already been used.")
        if _ensure_utc(challenge.expires_at) < now:
            raise ValidationError("Enrollment challenge has expired. Please request a new nonce.")
        if challenge.user_id != user_payload.sub:
            raise AuthorizationError("Challenge does not match authenticated user session.")

        # Cryptographic verification of nonce signature
        is_valid = DeviceIdentityManager.verify_nonce_signature(
            public_key_pem=public_key_pem.strip(),
            nonce=nonce.strip(),
            signature_b64=signature_b64.strip(),
        )
        if not is_valid:
            logger.warning("enrollment_signature_invalid", user_id=challenge.user_id, hostname=hostname)
            raise AuthenticationError("Cryptographic signature verification failed. Private key mismatch.")

        # Mark challenge used
        challenge.is_used = True

        # Check existing device or create
        clean_host = hostname.strip().lower()
        dev_stmt = select(Device).where(Device.hostname == clean_host)
        dev_res = await session.execute(dev_stmt)
        device = dev_res.scalars().first()

        if not device:
            device = Device(
                hostname=clean_host,
                enrolled_user_id=challenge.user_id,
                public_key=public_key_pem.strip(),
                ip_address=ip_address or "127.0.0.1",
                os_name=os_info or platform.system(),
                status="active",
                enrollment_status="ENROLLED",
                risk_score=0.0,
                last_seen=now,
            )
            session.add(device)
            await session.flush()
        else:
            device.enrolled_user_id = challenge.user_id
            device.public_key = public_key_pem.strip()
            device.status = "active"
            device.enrollment_status = "ENROLLED"
            device.last_seen = now
            if ip_address:
                device.ip_address = ip_address
            if os_info:
                device.os_name = os_info

        # Revoke any prior active credentials for this device
        old_creds_stmt = select(DeviceCredential).where(
            (DeviceCredential.device_id == device.id) & (DeviceCredential.is_revoked == False)
        )
        old_creds = (await session.execute(old_creds_stmt)).scalars().all()
        for oc in old_creds:
            oc.is_revoked = True
            oc.revoked_at = now
            oc.revoked_by = "SYSTEM_REENROLLMENT"

        # Generate new device-scoped token
        raw_token = f"kavach_dev_{secrets.token_urlsafe(36)}"
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        cred_expiry = now + timedelta(days=90)  # 90-day device rotation

        cred = DeviceCredential(
            device_id=device.id,
            user_id=challenge.user_id,
            public_key_pem=public_key_pem.strip(),
            key_algorithm="RSA-2048",
            device_token_hash=token_hash,
            is_revoked=False,
            created_at=now,
            expires_at=cred_expiry,
            last_used_at=now,
        )
        session.add(cred)

        # Audit log
        audit = AuditLog(
            action="device_enrolled",
            actor=user_payload.username,
            actor_role=str(user_payload.role),
            target_type="device",
            target_id=device.id,
            details={
                "hostname": device.hostname,
                "os": device.os_name,
                "ip_address": device.ip_address,
                "key_algorithm": "RSA-2048",
            },
            ip_address=ip_address,
        )
        session.add(audit)

        logger.info("device_enrolled_successfully", device_id=device.id, hostname=device.hostname)

        return {
            "device_id": device.id,
            "device_token": raw_token,
            "hostname": device.hostname,
            "status": "ENROLLED",
            "expires_at": cred_expiry.isoformat(),
            "message": "Device successfully enrolled and authenticated.",
        }

    @staticmethod
    async def authenticate_device(
        session: AsyncSession,
        device_id: str,
        device_token: str,
    ) -> Device:
        """
        Validate incoming device token against stored hash and revocation status.
        """
        token_hash = hashlib.sha256(device_token.strip().encode("utf-8")).hexdigest()
        now = _utcnow()

        stmt = select(DeviceCredential).where(
            (DeviceCredential.device_id == device_id)
            & (DeviceCredential.device_token_hash == token_hash)
            & (DeviceCredential.is_revoked == False)
        )
        res = await session.execute(stmt)
        cred = res.scalars().first()

        if not cred:
            raise AuthenticationError("Invalid device credentials or device token revoked.")

        if cred.expires_at and _ensure_utc(cred.expires_at) < now:
            raise AuthenticationError("Device credentials have expired. Re-enrollment required.")

        # Update last used
        cred.last_used_at = now

        # Fetch device
        dev_stmt = select(Device).where(Device.id == device_id)
        dev_res = await session.execute(dev_stmt)
        device = dev_res.scalars().first()
        if not device or device.status == "REVOKED":
            raise AuthenticationError("Device access has been revoked.")

        device.last_seen = now
        return device

    @staticmethod
    async def rotate_device_token(
        session: AsyncSession,
        device_id: str,
        current_token: str,
    ) -> dict[str, Any]:
        """Rotate device token for an already authenticated active device."""
        device = await EnrollmentService.authenticate_device(session, device_id, current_token)
        now = _utcnow()

        # Invalidate old credentials
        old_stmt = select(DeviceCredential).where(
            (DeviceCredential.device_id == device.id) & (DeviceCredential.is_revoked == False)
        )
        active_creds = (await session.execute(old_stmt)).scalars().all()
        for c in active_creds:
            c.is_revoked = True
            c.revoked_at = now
            c.revoked_by = "DEVICE_ROTATION"

        # Issue new token
        new_token = f"kavach_dev_{secrets.token_urlsafe(36)}"
        new_hash = hashlib.sha256(new_token.encode("utf-8")).hexdigest()
        new_expiry = now + timedelta(days=90)

        pub_key = active_creds[0].public_key_pem if active_creds else ""
        new_cred = DeviceCredential(
            device_id=device.id,
            user_id=device.enrolled_user_id,
            public_key_pem=pub_key,
            device_token_hash=new_hash,
            is_revoked=False,
            created_at=now,
            expires_at=new_expiry,
            last_used_at=now,
        )
        session.add(new_cred)

        logger.info("device_token_rotated", device_id=device.id)
        return {
            "device_id": device.id,
            "device_token": new_token,
            "expires_at": new_expiry.isoformat(),
            "status": "ROTATED",
        }

    @staticmethod
    async def revoke_device(
        session: AsyncSession,
        device_id: str,
        actor: TokenPayload,
        reason: str | None = None,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """Revoke device credentials and isolate or revoke device access."""
        now = _utcnow()
        dev_stmt = select(Device).where(Device.id == device_id)
        dev_res = await session.execute(dev_stmt)
        device = dev_res.scalars().first()

        if not device:
            raise RecordNotFoundError("Device not found.")

        # Permission check: must be owner or admin
        if device.enrolled_user_id != actor.sub and not is_admin(actor.role):
            raise AuthorizationError("You do not have permission to revoke this device.")

        device.status = "REVOKED"

        # Revoke all credentials
        creds_stmt = select(DeviceCredential).where(
            (DeviceCredential.device_id == device_id) & (DeviceCredential.is_revoked == False)
        )
        creds = (await session.execute(creds_stmt)).scalars().all()
        for c in creds:
            c.is_revoked = True
            c.revoked_at = now
            c.revoked_by = actor.username
            c.revocation_reason = reason or "Revoked by user/administrator."

        audit = AuditLog(
            action="device_revoked",
            actor=actor.username,
            actor_role=str(actor.role),
            target_type="device",
            target_id=device.id,
            details={"hostname": device.hostname, "reason": reason},
            ip_address=actor_ip,
        )
        session.add(audit)

        logger.info("device_revoked", device_id=device.id, actor=actor.username)
        return {
            "device_id": device.id,
            "status": "REVOKED",
            "message": "Device credential revoked. Endpoint telemetry authorization cancelled.",
        }
