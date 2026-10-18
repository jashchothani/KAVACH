"""
KAVACH Account Lifecycle & Approval Workflow Service.

Implements the multi-stage account approval lifecycle:
REQUESTED -> ADMIN_APPROVED -> ANALYST_ASSIGNED -> PENDING_ACTIVATION -> ACTIVE

Includes:
- Least-loaded automatic SOC Analyst assignment with randomized tie-breaking
- Server-side RBAC and dual-gate approval enforcement
- Concurrency-safe state transitions
- Session revocation and audit logging
"""

from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    RecordNotFoundError,
    ValidationError,
)
from app.core.logging import get_logger
from app.core.security import TokenPayload, hash_password, validate_password_strength
from app.database.models import (
    AccountRequest,
    AccountStatus,
    AnalystAssignmentHistory,
    AuditLog,
    Device,
    DeviceCredential,
    KavachRole,
    Organization,
    User,
)

logger = get_logger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def is_admin(role: str | UserRole) -> bool:
    r = role.value if isinstance(role, UserRole) else str(role).lower()
    return r in ("admin", "super_admin", "owner", KavachRole.ADMIN.lower())


def is_analyst(role: str | UserRole) -> bool:
    r = role.value if isinstance(role, UserRole) else str(role).lower()
    return r in (
        "soc_analyst",
        "security_analyst",
        "incident_responder",
        "admin",
        "super_admin",
        "owner",
        KavachRole.SOC_ANALYST.lower(),
        KavachRole.ADMIN.lower(),
    )


class AccountService:
    """Manages the full lifecycle of KAVACH user accounts and approval queues."""

    @staticmethod
    async def request_account(
        session: AsyncSession,
        username: str,
        email: str,
        password: str,
        full_name: str | None = None,
        organization_name: str | None = None,
        department: str | None = None,
        justification: str | None = None,
        phone_number: str | None = None,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """
        Step 1: Ordinary user requests a KAVACH account.
        Creates inactive User in REQUESTED state and an AccountRequest.
        """
        username = username.strip()
        email = email.strip().lower()

        # Check existing user
        stmt = select(User).where((User.username == username) | (User.email == email))
        res = await session.execute(stmt)
        existing = res.scalars().first()
        if existing:
            if existing.username == username:
                raise ConflictError("A user with this username already exists.")
            raise ConflictError("A user with this email address already exists.")

        # Validate password strength
        valid, msg = validate_password_strength(password)
        if not valid:
            raise ValidationError(msg)

        # Resolve or create organization
        org_id = None
        if organization_name:
            org_stmt = select(Organization).where(Organization.name == organization_name)
            org_res = await session.execute(org_stmt)
            org = org_res.scalars().first()
            if not org:
                org = Organization(
                    name=organization_name,
                    contact_email=email,
                    is_active=True,
                )
                session.add(org)
                await session.flush()
            org_id = org.id

        # Create inactive user in REQUESTED status
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=KavachRole.USER,
            status=AccountStatus.REQUESTED,
            is_active=False,
            full_name=full_name,
            organization_id=org_id,
            department=department,
            phone_number=phone_number,
        )
        session.add(user)
        await session.flush()

        # Create AccountRequest tracking record
        account_req = AccountRequest(
            user_id=user.id,
            organization_name=organization_name,
            organization_id=org_id,
            full_name=full_name,
            email=email,
            username=username,
            justification=justification,
            department=department,
            status=AccountStatus.REQUESTED,
        )
        session.add(account_req)
        await session.flush()

        # Audit log
        audit = AuditLog(
            action="account_request_created",
            actor=username,
            actor_role="USER_CANDIDATE",
            target_type="account_request",
            target_id=account_req.id,
            details={
                "username": username,
                "email": email,
                "organization": organization_name,
                "department": department,
            },
            ip_address=actor_ip,
        )
        session.add(audit)

        logger.info("account_requested", user_id=user.id, username=username, request_id=account_req.id)

        return {
            "status": AccountStatus.REQUESTED,
            "request_id": account_req.id,
            "username": username,
            "email": email,
            "message": "Account request submitted successfully. It is now awaiting security administrator review.",
            "created_at": account_req.created_at.isoformat(),
        }

    @staticmethod
    async def get_request_status(session: AsyncSession, identifier: str) -> dict[str, Any]:
        """Public status query by request_id, username, or email."""
        identifier = identifier.strip()
        stmt = select(AccountRequest).where(
            (AccountRequest.id == identifier)
            | (AccountRequest.username == identifier)
            | (AccountRequest.email == identifier.lower())
        ).order_by(AccountRequest.created_at.desc())
        res = await session.execute(stmt)
        req = res.scalars().first()

        if not req:
            raise RecordNotFoundError("No account request found matching the specified identifier.")

        return {
            "request_id": req.id,
            "username": req.username,
            "email": req.email,
            "organization": req.organization_name,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "admin_reviewed_at": req.admin_action_at.isoformat() if req.admin_action_at else None,
            "assigned_at": req.assigned_at.isoformat() if req.assigned_at else None,
            "analyst_reviewed_at": req.analyst_action_at.isoformat() if req.analyst_action_at else None,
            "rejection_reason": req.rejection_reason if req.status == AccountStatus.REJECTED else None,
        }

    @staticmethod
    async def admin_review(
        session: AsyncSession,
        request_id: str,
        admin_user: TokenPayload,
        action: str,  # "APPROVE" or "REJECT"
        rejection_reason: str | None = None,
        notes: str | None = None,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """
        Step 2: Administrator reviews pending registration.
        If APPROVED: transitions to ADMIN_APPROVED, then auto-assigns an eligible SOC Analyst.
        """
        if not is_admin(admin_user.role):
            raise AuthorizationError("Only administrators can perform administrative account reviews.")

        stmt = select(AccountRequest).where(AccountRequest.id == request_id)
        res = await session.execute(stmt)
        req = res.scalars().first()
        if not req:
            raise RecordNotFoundError("Account request not found.")

        if req.status != AccountStatus.REQUESTED:
            raise ValidationError(f"Cannot review request currently in '{req.status}' state.")

        action_upper = action.strip().upper()
        now = _utcnow()

        if action_upper == "REJECT":
            req.status = AccountStatus.REJECTED
            req.admin_id = admin_user.sub
            req.admin_action_at = now
            req.admin_notes = notes
            req.rejection_reason = rejection_reason or "Rejected by administrator."

            # Update User status
            user_stmt = select(User).where(User.id == req.user_id)
            user_res = await session.execute(user_stmt)
            user = user_res.scalars().first()
            if user:
                user.status = AccountStatus.REJECTED
                user.is_active = False
                user.revocation_reason = req.rejection_reason

            audit = AuditLog(
                action="account_request_admin_rejected",
                actor=admin_user.username,
                actor_role=str(admin_user.role),
                target_type="account_request",
                target_id=req.id,
                details={"reason": req.rejection_reason, "notes": notes},
                ip_address=actor_ip,
            )
            session.add(audit)
            logger.info("account_admin_rejected", request_id=req.id, user_id=req.user_id)

            return {
                "request_id": req.id,
                "status": AccountStatus.REJECTED,
                "message": "Account request has been rejected.",
            }

        elif action_upper == "APPROVE":
            req.status = AccountStatus.ADMIN_APPROVED
            req.admin_id = admin_user.sub
            req.admin_action_at = now
            req.admin_notes = notes

            # Automatically assign to least-loaded eligible SOC Analyst
            assigned_analyst = await AccountService.auto_assign_analyst(session, req, assigned_by=admin_user.username)

            # Update User status to reflect approval / analyst assignment
            user_stmt = select(User).where(User.id == req.user_id)
            user_res = await session.execute(user_stmt)
            user = user_res.scalars().first()
            if user:
                user.status = req.status

            audit = AuditLog(
                action="account_request_admin_approved",
                actor=admin_user.username,
                actor_role=str(admin_user.role),
                target_type="account_request",
                target_id=req.id,
                details={
                    "assigned_analyst_id": assigned_analyst.id if assigned_analyst else None,
                    "assigned_analyst_username": assigned_analyst.username if assigned_analyst else None,
                    "notes": notes,
                },
                ip_address=actor_ip,
            )
            session.add(audit)

            logger.info("account_admin_approved", request_id=req.id, assigned_to=req.assigned_analyst_id)

            return {
                "request_id": req.id,
                "status": req.status,
                "assigned_analyst": assigned_analyst.username if assigned_analyst else None,
                "message": (
                    f"Account request approved by admin and assigned to SOC Analyst "
                    f"'{assigned_analyst.username}' for technical activation review."
                    if assigned_analyst else
                    "Account request approved by admin. Awaiting eligible SOC Analyst assignment."
                ),
            }
        else:
            raise ValidationError(f"Invalid action '{action}'. Must be 'APPROVE' or 'REJECT'.")

    @staticmethod
    async def auto_assign_analyst(
        session: AsyncSession,
        req: AccountRequest,
        assigned_by: str = "SYSTEM_AUTO",
    ) -> User | None:
        """
        Assign an eligible SOC Analyst using least-loaded algorithm with randomized tie-breaker.
        """
        # Find all active analysts
        analyst_stmt = select(User).where(
            (User.role.in_([KavachRole.SOC_ANALYST, "soc_analyst", "security_analyst"]))
            & (User.is_active == True)
            & (User.status == AccountStatus.ACTIVE)
        )
        res = await session.execute(analyst_stmt)
        analysts = list(res.scalars().all())

        if not analysts:
            # Fall back to active administrators if no dedicated SOC analyst exists
            admin_stmt = select(User).where(
                (User.role.in_([KavachRole.ADMIN, "admin", "super_admin", "owner"]))
                & (User.is_active == True)
                & (User.status == AccountStatus.ACTIVE)
            )
            admin_res = await session.execute(admin_stmt)
            analysts = list(admin_res.scalars().all())

        if not analysts:
            logger.warning("no_eligible_analysts_available_for_assignment", request_id=req.id)
            return None

        # Exclude the requesting user themselves if they happen to be in the list
        eligible = [a for a in analysts if a.id != req.user_id]
        if not eligible:
            eligible = analysts

        # Calculate current load: pending reviews assigned
        loads: dict[str, int] = {}
        for a in eligible:
            load_stmt = select(func.count(AccountRequest.id)).where(
                (AccountRequest.assigned_analyst_id == a.id)
                & (AccountRequest.status.in_([AccountStatus.ANALYST_ASSIGNED, AccountStatus.PENDING_ACTIVATION]))
            )
            count = (await session.execute(load_stmt)).scalar_one()
            loads[a.id] = count

        # Find minimum load
        min_load = min(loads.values())
        least_loaded = [a for a in eligible if loads[a.id] == min_load]

        # Randomized tie-breaker among least loaded
        chosen_analyst = random.choice(least_loaded)

        now = _utcnow()
        req.assigned_analyst_id = chosen_analyst.id
        req.assigned_at = now
        req.status = AccountStatus.ANALYST_ASSIGNED

        # Record assignment history
        history = AnalystAssignmentHistory(
            account_request_id=req.id,
            analyst_id=chosen_analyst.id,
            assigned_by=assigned_by,
            assignment_strategy="LEAST_LOADED_RANDOM_TIEBREAKER",
            status="ASSIGNED",
            assigned_at=now,
        )
        session.add(history)

        return chosen_analyst

    @staticmethod
    async def analyst_review(
        session: AsyncSession,
        request_id: str,
        analyst_user: TokenPayload,
        action: str,  # "ACTIVATE" or "REJECT"
        rejection_reason: str | None = None,
        notes: str | None = None,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """
        Step 3: Assigned SOC Analyst reviews and activates (or rejects) the account.
        """
        if not is_analyst(analyst_user.role):
            raise AuthorizationError("Only assigned SOC Analysts or Administrators can activate accounts.")

        stmt = select(AccountRequest).where(AccountRequest.id == request_id)
        res = await session.execute(stmt)
        req = res.scalars().first()
        if not req:
            raise RecordNotFoundError("Account request not found.")

        # Analyst cannot activate their own request
        if req.user_id == analyst_user.sub:
            raise AuthorizationError("Conflict of interest: You cannot review or activate your own account request.")

        # Check permission: Must be the assigned analyst OR an administrator
        if req.assigned_analyst_id != analyst_user.sub and not is_admin(analyst_user.role):
            raise AuthorizationError("This account request is assigned to a different SOC analyst.")

        if req.status not in (AccountStatus.ANALYST_ASSIGNED, AccountStatus.PENDING_ACTIVATION, AccountStatus.ADMIN_APPROVED):
            raise ValidationError(f"Request cannot be reviewed in status '{req.status}'.")

        action_upper = action.strip().upper()
        now = _utcnow()

        if action_upper == "REJECT":
            req.status = AccountStatus.REJECTED
            req.analyst_action_at = now
            req.analyst_notes = notes
            req.rejection_reason = rejection_reason or "Activation rejected by SOC analyst."

            user_stmt = select(User).where(User.id == req.user_id)
            user_res = await session.execute(user_stmt)
            user = user_res.scalars().first()
            if user:
                user.status = AccountStatus.REJECTED
                user.is_active = False
                user.revocation_reason = req.rejection_reason

            audit = AuditLog(
                action="account_request_analyst_rejected",
                actor=analyst_user.username,
                actor_role=str(analyst_user.role),
                target_type="account_request",
                target_id=req.id,
                details={"reason": req.rejection_reason, "notes": notes},
                ip_address=actor_ip,
            )
            session.add(audit)
            logger.info("account_analyst_rejected", request_id=req.id, user_id=req.user_id)

            return {
                "request_id": req.id,
                "status": AccountStatus.REJECTED,
                "message": "Account request rejected by SOC analyst.",
            }

        elif action_upper == "ACTIVATE":
            req.status = AccountStatus.ACTIVE
            req.analyst_action_at = now
            req.analyst_notes = notes

            # Activate User
            user_stmt = select(User).where(User.id == req.user_id)
            user_res = await session.execute(user_stmt)
            user = user_res.scalars().first()
            if not user:
                raise RecordNotFoundError("Associated user record not found.")

            user.status = AccountStatus.ACTIVE
            user.is_active = True

            # Mark assignment history completed
            hist_stmt = select(AnalystAssignmentHistory).where(
                (AnalystAssignmentHistory.account_request_id == req.id)
                & (AnalystAssignmentHistory.analyst_id == req.assigned_analyst_id)
                & (AnalystAssignmentHistory.status == "ASSIGNED")
            )
            hist_res = await session.execute(hist_stmt)
            for h in hist_res.scalars().all():
                h.status = "COMPLETED"
                h.completed_at = now

            audit = AuditLog(
                action="account_activated",
                actor=analyst_user.username,
                actor_role=str(analyst_user.role),
                target_type="user",
                target_id=user.id,
                details={
                    "request_id": req.id,
                    "activated_username": user.username,
                    "activated_email": user.email,
                    "role": user.role,
                },
                ip_address=actor_ip,
            )
            session.add(audit)

            logger.info("account_activated_successfully", user_id=user.id, username=user.username)

            return {
                "request_id": req.id,
                "user_id": user.id,
                "username": user.username,
                "status": AccountStatus.ACTIVE,
                "message": f"User account '{user.username}' has been successfully activated. The user can now sign in.",
            }
        else:
            raise ValidationError(f"Invalid action '{action}'. Must be 'ACTIVATE' or 'REJECT'.")

    @staticmethod
    async def admin_provision_analyst(
        session: AsyncSession,
        admin_user: TokenPayload,
        username: str,
        email: str,
        password: str,
        full_name: str | None = None,
        department: str | None = "SOC Operations",
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """Admin-only provisioning of SOC Analyst accounts."""
        if not is_admin(admin_user.role):
            raise AuthorizationError("Only administrators can provision SOC Analyst accounts.")

        username = username.strip()
        email = email.strip().lower()

        stmt = select(User).where((User.username == username) | (User.email == email))
        res = await session.execute(stmt)
        if res.scalars().first():
            raise ConflictError("A user with this username or email already exists.")

        valid, msg = validate_password_strength(password)
        if not valid:
            raise ValidationError(msg)

        analyst = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=KavachRole.SOC_ANALYST,
            status=AccountStatus.ACTIVE,
            is_active=True,
            full_name=full_name,
            department=department,
            is_2fa_enabled=False,  # Require 2FA setup upon login
        )
        session.add(analyst)
        await session.flush()

        audit = AuditLog(
            action="soc_analyst_provisioned",
            actor=admin_user.username,
            actor_role=str(admin_user.role),
            target_type="user",
            target_id=analyst.id,
            details={"username": username, "email": email, "department": department},
            ip_address=actor_ip,
        )
        session.add(audit)
        logger.info("analyst_provisioned_by_admin", analyst_id=analyst.id, admin=admin_user.username)

        return {
            "analyst_id": analyst.id,
            "username": analyst.username,
            "email": analyst.email,
            "role": KavachRole.SOC_ANALYST,
            "status": AccountStatus.ACTIVE,
            "message": f"SOC Analyst account '{username}' created successfully.",
        }

    @staticmethod
    async def suspend_account(
        session: AsyncSession,
        user_id: str,
        actor: TokenPayload,
        reason: str,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """Suspend account and immediately revoke all active JWT sessions."""
        if not (is_admin(actor.role) or is_analyst(actor.role)):
            raise AuthorizationError("Insufficient permissions to suspend accounts.")

        stmt = select(User).where(User.id == user_id)
        res = await session.execute(stmt)
        user = res.scalars().first()
        if not user:
            raise RecordNotFoundError("User not found.")

        # Analysts cannot suspend administrators
        if is_admin(user.role) and not is_admin(actor.role):
            raise AuthorizationError("Analysts cannot suspend Administrator accounts.")

        now = _utcnow()
        user.status = AccountStatus.SUSPENDED
        user.is_active = False
        user.session_revoked_at = now
        user.revocation_reason = reason

        audit = AuditLog(
            action="user_account_suspended",
            actor=actor.username,
            actor_role=str(actor.role),
            target_type="user",
            target_id=user.id,
            details={"reason": reason},
            ip_address=actor_ip,
        )
        session.add(audit)
        logger.warning("user_suspended", user_id=user.id, actor=actor.username, reason=reason)

        return {
            "user_id": user.id,
            "status": AccountStatus.SUSPENDED,
            "message": f"Account '{user.username}' has been suspended and all sessions revoked.",
        }

    @staticmethod
    async def reactivate_account(
        session: AsyncSession,
        user_id: str,
        admin_user: TokenPayload,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """Admin-only reactivation of suspended accounts."""
        if not is_admin(admin_user.role):
            raise AuthorizationError("Only administrators can reactivate suspended accounts.")

        stmt = select(User).where(User.id == user_id)
        res = await session.execute(stmt)
        user = res.scalars().first()
        if not user:
            raise RecordNotFoundError("User not found.")

        user.status = AccountStatus.ACTIVE
        user.is_active = True
        user.revocation_reason = None

        audit = AuditLog(
            action="user_account_reactivated",
            actor=admin_user.username,
            actor_role=str(admin_user.role),
            target_type="user",
            target_id=user.id,
            details={"reactivated_by": admin_user.username},
            ip_address=actor_ip,
        )
        session.add(audit)

        return {
            "user_id": user.id,
            "status": AccountStatus.ACTIVE,
            "message": f"Account '{user.username}' has been successfully reactivated.",
        }

    @staticmethod
    async def revoke_account(
        session: AsyncSession,
        user_id: str,
        admin_user: TokenPayload,
        reason: str,
        actor_ip: str | None = None,
    ) -> dict[str, Any]:
        """Permanently revoke account, invalidate all sessions, and revoke all device credentials."""
        if not is_admin(admin_user.role):
            raise AuthorizationError("Only administrators can permanently revoke accounts.")

        stmt = select(User).where(User.id == user_id)
        res = await session.execute(stmt)
        user = res.scalars().first()
        if not user:
            raise RecordNotFoundError("User not found.")

        now = _utcnow()
        user.status = AccountStatus.REVOKED
        user.is_active = False
        user.session_revoked_at = now
        user.revocation_reason = reason

        # Revoke all device credentials bound to this user
        dev_cred_stmt = select(DeviceCredential).where(
            (DeviceCredential.user_id == user_id) & (DeviceCredential.is_revoked == False)
        )
        dev_cred_res = await session.execute(dev_cred_stmt)
        for cred in dev_cred_res.scalars().all():
            cred.is_revoked = True
            cred.revoked_at = now
            cred.revoked_by = admin_user.username
            cred.revocation_reason = f"User account revoked: {reason}"

        audit = AuditLog(
            action="user_account_permanently_revoked",
            actor=admin_user.username,
            actor_role=str(admin_user.role),
            target_type="user",
            target_id=user.id,
            details={"reason": reason},
            ip_address=actor_ip,
        )
        session.add(audit)

        return {
            "user_id": user.id,
            "status": AccountStatus.REVOKED,
            "message": f"Account '{user.username}' has been permanently revoked along with all device credentials.",
        }
