"""
KAVACH Account & Identity REST Endpoints.

Provides complete API surface for the multi-stage account approval lifecycle:
1. User Registration Requests (REQUESTED)
2. Admin Queue & Approval with Auto-Assignment (ADMIN_APPROVED -> ANALYST_ASSIGNED)
3. Analyst Queue & Technical Activation (ACTIVE)
4. Analyst Provisioning by Admin
5. Account Suspension, Revocation & Session Invalidation
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    RecordNotFoundError,
    ValidationError,
)
from app.core.security import TokenPayload
from app.database.engine import get_session
from app.database.models import (
    AccountRequest,
    AccountStatus,
    AnalystAssignmentHistory,
    AuditLog,
    KavachRole,
    Organization,
    User,
)
from app.schemas.account_schemas import (
    AccountActionRequest,
    AccountRegistrationRequest,
    AdminReviewRequest,
    AnalystProvisionRequest,
    AnalystReviewRequest,
    ReassignRequest,
)
from app.services.account_service import AccountService, is_admin, is_analyst

router = APIRouter(prefix="/account", tags=["Account Lifecycle"])


# ---------------------------------------------------------------------------
# Auth Dependencies
# ---------------------------------------------------------------------------

def get_current_user_from_request(request: Request) -> TokenPayload:
    from app.core.security import decode_access_token
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.split(" ", 1)[1]
    try:
        return decode_access_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin_user(current_user: TokenPayload = Depends(get_current_user_from_request)) -> TokenPayload:
    if not is_admin(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this endpoint.",
        )
    return current_user


def require_analyst_user(current_user: TokenPayload = Depends(get_current_user_from_request)) -> TokenPayload:
    if not is_analyst(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SOC Analyst privileges required to access this endpoint.",
        )
    return current_user


# ---------------------------------------------------------------------------
# 1. Public Registration Request & Status Tracking
# ---------------------------------------------------------------------------

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def request_kavach_account(
    req: AccountRegistrationRequest,
    request: Request,
) -> dict[str, Any]:
    """
    Public entry point for new users (via Windows Companion Agent or Web Portal).
    Creates an account in REQUESTED status awaiting admin and analyst approval.
    """
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.request_account(
                session=session,
                username=req.username,
                email=str(req.email),
                password=req.password,
                full_name=req.full_name,
                organization_name=req.organization_name,
                department=req.department,
                justification=req.justification,
                phone_number=req.phone_number,
                actor_ip=client_ip,
            )
        except (ConflictError, ValidationError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/status")
async def check_account_request_status_query(
    email: str | None = None,
    identifier: str | None = None,
) -> dict[str, Any]:
    """Check status by query parameter (e.g. ?email=user@org.in or ?identifier=req-id)."""
    target = email or identifier
    if not target:
        raise HTTPException(status_code=400, detail="Query parameter 'email' or 'identifier' is required")
    async with get_session() as session:
        try:
            return await AccountService.get_request_status(session, target)
        except RecordNotFoundError as exc:
            raise HTTPException(status_code=404, detail=exc.message)


@router.get("/status/{identifier}")
async def check_account_request_status(identifier: str) -> dict[str, Any]:
    """Check the real-time approval status of an account request."""
    async with get_session() as session:
        try:
            return await AccountService.get_request_status(session, identifier)
        except RecordNotFoundError as exc:
            raise HTTPException(status_code=404, detail=exc.message)


@router.post("/request-access", status_code=status.HTTP_201_CREATED)
async def request_access_alias(
    req: AccountRegistrationRequest,
    request: Request,
) -> dict[str, Any]:
    """Alias for /account/request."""
    return await request_kavach_account(req, request)


# ---------------------------------------------------------------------------
# 2. Administrator Review Queue & Approval Workflows
# ---------------------------------------------------------------------------

@router.get("/requests/admin-queue")
async def get_admin_request_queue(
    admin_user: TokenPayload = Depends(require_admin_user),
) -> list[dict[str, Any]]:
    """Retrieve all pending account requests requiring administrator review."""
    async with get_session() as session:
        stmt = (
            select(AccountRequest)
            .where(AccountRequest.status == AccountStatus.REQUESTED)
            .order_by(AccountRequest.created_at.asc())
        )
        res = await session.execute(stmt)
        requests = res.scalars().all()

        return [
            {
                "id": r.id,
                "user_id": r.user_id,
                "username": r.username,
                "email": r.email,
                "full_name": r.full_name,
                "organization_name": r.organization_name,
                "department": r.department,
                "justification": r.justification,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests
        ]


@router.post("/requests/{request_id}/admin-review")
async def submit_admin_review(
    request_id: str,
    body: AdminReviewRequest,
    request: Request,
    admin_user: TokenPayload = Depends(require_admin_user),
) -> dict[str, Any]:
    """Admin approves or rejects an account request. Approval auto-assigns an eligible SOC Analyst."""
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.admin_review(
                session=session,
                request_id=request_id,
                admin_user=admin_user,
                action=body.action,
                rejection_reason=body.rejection_reason,
                notes=body.notes,
                actor_ip=client_ip,
            )
        except (AuthorizationError, RecordNotFoundError, ValidationError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/requests/{request_id}/reassign")
async def reassign_request_analyst(
    request_id: str,
    body: ReassignRequest,
    admin_user: TokenPayload = Depends(require_admin_user),
) -> dict[str, Any]:
    """Admin reassigns an account request to a specific or least-loaded analyst."""
    async with get_session() as session:
        stmt = select(AccountRequest).where(AccountRequest.id == request_id)
        res = await session.execute(stmt)
        req = res.scalars().first()
        if not req:
            raise HTTPException(status_code=404, detail="Account request not found.")

        if body.analyst_id:
            analyst_stmt = select(User).where(User.id == body.analyst_id)
            analyst = (await session.execute(analyst_stmt)).scalars().first()
            if not analyst or not is_analyst(analyst.role):
                raise HTTPException(status_code=400, detail="Target analyst not found or not eligible.")
            req.assigned_analyst_id = analyst.id
            req.assigned_at = datetime.now(timezone.utc)
            req.status = AccountStatus.ANALYST_ASSIGNED
            target_analyst = analyst
        else:
            target_analyst = await AccountService.auto_assign_analyst(session, req, assigned_by=admin_user.username)

        return {
            "request_id": req.id,
            "status": req.status,
            "assigned_analyst": target_analyst.username if target_analyst else None,
            "message": f"Request reassigned to '{target_analyst.username if target_analyst else 'None'}'.",
        }


# ---------------------------------------------------------------------------
# 3. SOC Analyst Activation Queue & Decisions
# ---------------------------------------------------------------------------

@router.get("/requests/analyst-queue")
async def get_analyst_request_queue(
    analyst_user: TokenPayload = Depends(require_analyst_user),
) -> list[dict[str, Any]]:
    """Retrieve account requests assigned to the logged-in analyst for activation review."""
    async with get_session() as session:
        # If admin, show all requests awaiting analyst activation; if analyst, show only assigned
        if is_admin(analyst_user.role):
            stmt = select(AccountRequest).where(
                AccountRequest.status.in_([AccountStatus.ANALYST_ASSIGNED, AccountStatus.PENDING_ACTIVATION, AccountStatus.ADMIN_APPROVED])
            ).order_by(AccountRequest.created_at.asc())
        else:
            stmt = select(AccountRequest).where(
                (AccountRequest.assigned_analyst_id == analyst_user.sub)
                & (AccountRequest.status.in_([AccountStatus.ANALYST_ASSIGNED, AccountStatus.PENDING_ACTIVATION]))
            ).order_by(AccountRequest.created_at.asc())

        res = await session.execute(stmt)
        requests = res.scalars().all()

        return [
            {
                "id": r.id,
                "user_id": r.user_id,
                "username": r.username,
                "email": r.email,
                "full_name": r.full_name,
                "organization_name": r.organization_name,
                "department": r.department,
                "justification": r.justification,
                "status": r.status,
                "assigned_analyst_id": r.assigned_analyst_id,
                "assigned_at": r.assigned_at.isoformat() if r.assigned_at else None,
                "admin_action_at": r.admin_action_at.isoformat() if r.admin_action_at else None,
                "admin_notes": r.admin_notes,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests
        ]


@router.post("/requests/{request_id}/analyst-review")
async def submit_analyst_review(
    request_id: str,
    body: AnalystReviewRequest,
    request: Request,
    analyst_user: TokenPayload = Depends(require_analyst_user),
) -> dict[str, Any]:
    """Assigned SOC Analyst activates or rejects the requested account."""
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.analyst_review(
                session=session,
                request_id=request_id,
                analyst_user=analyst_user,
                action=body.action,
                rejection_reason=body.rejection_reason,
                notes=body.notes,
                actor_ip=client_ip,
            )
        except (AuthorizationError, RecordNotFoundError, ValidationError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)


# ---------------------------------------------------------------------------
# 4. Administrator Governance & Analyst Management
# ---------------------------------------------------------------------------

@router.post("/analysts/invite", status_code=status.HTTP_201_CREATED)
async def invite_soc_analyst(
    body: AnalystProvisionRequest,
    request: Request,
    admin_user: TokenPayload = Depends(require_admin_user),
) -> dict[str, Any]:
    """Admin-only provisioning of SOC Analyst accounts."""
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.admin_provision_analyst(
                session=session,
                admin_user=admin_user,
                username=body.username,
                email=str(body.email),
                password=body.password,
                full_name=body.full_name,
                department=body.department,
                actor_ip=client_ip,
            )
        except (ConflictError, ValidationError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/analysts")
@router.get("/analysts/workload")
async def list_soc_analysts(
    admin_user: TokenPayload = Depends(require_admin_user),
) -> list[dict[str, Any]]:
    """List all SOC Analysts with their active approval workloads."""
    async with get_session() as session:
        stmt = select(User).where(
            User.role.in_([KavachRole.SOC_ANALYST, "soc_analyst", "security_analyst"])
        ).order_by(User.username.asc())
        res = await session.execute(stmt)
        analysts = res.scalars().all()

        output = []
        for a in analysts:
            load_stmt = select(func.count(AccountRequest.id)).where(
                (AccountRequest.assigned_analyst_id == a.id)
                & (AccountRequest.status.in_([AccountStatus.ANALYST_ASSIGNED, AccountStatus.PENDING_ACTIVATION]))
            )
            load = (await session.execute(load_stmt)).scalar_one()

            output.append({
                "id": a.id,
                "username": a.username,
                "email": a.email,
                "full_name": a.full_name,
                "department": a.department,
                "status": a.status,
                "is_active": a.is_active,
                "is_2fa_enabled": a.is_2fa_enabled,
                "active_review_load": load,
                "last_login": a.last_login.isoformat() if a.last_login else None,
            })
        return output


@router.get("/users")
async def list_all_users(
    role: str | None = None,
    status_filter: str | None = None,
    limit: int = 100,
    offset: int = 0,
    admin_user: TokenPayload = Depends(require_admin_user),
) -> dict[str, Any]:
    """Admin-only directory of all user accounts."""
    async with get_session() as session:
        stmt = select(User)
        if role:
            stmt = stmt.where(User.role.ilike(role))
        if status_filter:
            stmt = stmt.where(User.status == status_filter.upper())
        stmt = stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)
        res = await session.execute(stmt)
        users = res.scalars().all()

        count_stmt = select(func.count(User.id))
        total = (await session.execute(count_stmt)).scalar_one()

        return {
            "total": total,
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "full_name": u.full_name,
                    "role": u.role,
                    "status": u.status,
                    "is_active": u.is_active,
                    "department": u.department,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "last_login": u.last_login.isoformat() if u.last_login else None,
                }
                for u in users
            ],
        }


# ---------------------------------------------------------------------------
# 5. Account Suspension, Revocation & Session Termination
# ---------------------------------------------------------------------------

@router.post("/users/{user_id}/suspend")
async def suspend_user_account(
    user_id: str,
    body: AccountActionRequest,
    request: Request,
    actor: TokenPayload = Depends(require_analyst_user),
) -> dict[str, Any]:
    """Suspend an active account and immediately revoke all JWT sessions."""
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.suspend_account(session, user_id, actor, body.reason, client_ip)
        except (AuthorizationError, RecordNotFoundError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/users/{user_id}/reactivate")
async def reactivate_user_account(
    user_id: str,
    request: Request,
    admin_user: TokenPayload = Depends(require_admin_user),
) -> dict[str, Any]:
    """Admin-only reactivation of a suspended account."""
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.reactivate_account(session, user_id, admin_user, client_ip)
        except (AuthorizationError, RecordNotFoundError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/users/{user_id}/revoke")
async def revoke_user_account(
    user_id: str,
    body: AccountActionRequest,
    request: Request,
    admin_user: TokenPayload = Depends(require_admin_user),
) -> dict[str, Any]:
    """Admin permanently revokes user account and invalidates all device credentials."""
    client_ip = request.client.host if request.client else "unknown"
    async with get_session() as session:
        try:
            return await AccountService.revoke_account(session, user_id, admin_user, body.reason, client_ip)
        except (AuthorizationError, RecordNotFoundError) as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)
