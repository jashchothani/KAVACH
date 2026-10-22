"""
KAVACH Repository Layer.

Generic async CRUD + domain-specific repositories for all KAVACH entities.
Encapsulates all SQLAlchemy queries and pagination.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Generic, Sequence, Type, TypeVar

from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.database.models import (
    AccountRequest,
    Alert,
    AnalystAssignmentHistory,
    AuditLog,
    Base,
    DashboardStats,
    Device,
    DeviceCredential,
    EnrollmentChallenge,
    IOC,
    Incident,
    MitreTechnique,
    MLModelMeta,
    MLPrediction,
    Organization,
    PlaybookExecution,
    Policy,
    ScannedURL,
    SecurityEvent,
    SystemSetting,
    User,
)

logger = get_logger(__name__)

ModelT = TypeVar("ModelT", bound=Base)


# ---------------------------------------------------------------------------
# Base Repository
# ---------------------------------------------------------------------------

class BaseRepository(Generic[ModelT]):
    """Generic async CRUD repository."""

    def __init__(self, session: AsyncSession, model: Type[ModelT]) -> None:
        self._session = session
        self._model = model

    async def get_by_id(self, record_id: str) -> ModelT | None:
        return await self._session.get(self._model, record_id)

    async def get_all(
        self, *, offset: int = 0, limit: int = 100, order_by: str | None = None
    ) -> Sequence[ModelT]:
        stmt = select(self._model)
        if order_by and hasattr(self._model, order_by):
            stmt = stmt.order_by(getattr(self._model, order_by).desc())
        stmt = stmt.offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def create(self, **kwargs: Any) -> ModelT:
        instance = self._model(**kwargs)
        self._session.add(instance)
        await self._session.flush()
        return instance

    async def update(self, record_id: str, **kwargs: Any) -> ModelT | None:
        instance = await self.get_by_id(record_id)
        if instance is None:
            return None
        for k, v in kwargs.items():
            if hasattr(instance, k):
                setattr(instance, k, v)
        await self._session.flush()
        return instance

    async def delete(self, record_id: str) -> bool:
        instance = await self.get_by_id(record_id)
        if instance is None:
            return False
        await self._session.delete(instance)
        await self._session.flush()
        return True

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self._model)
        result = await self._session.execute(stmt)
        return result.scalar_one()


# ---------------------------------------------------------------------------
# Domain Repositories
# ---------------------------------------------------------------------------

class SecurityEventRepository(BaseRepository[SecurityEvent]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, SecurityEvent)

    async def get_recent(self, limit: int = 50, offset: int = 0, event_type: str | None = None) -> Sequence[SecurityEvent]:
        stmt = select(SecurityEvent)
        if event_type:
            stmt = stmt.where(SecurityEvent.event_type == event_type)
        stmt = stmt.order_by(SecurityEvent.timestamp.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_anomalies(self, limit: int = 50) -> Sequence[SecurityEvent]:
        stmt = (
            select(SecurityEvent)
            .where(SecurityEvent.is_anomaly == True)  # noqa: E712
            .order_by(SecurityEvent.timestamp.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Alert)

    async def get_recent(self, limit: int = 50, severity: str | None = None, status: str | None = None) -> Sequence[Alert]:
        stmt = select(Alert)
        if severity:
            stmt = stmt.where(Alert.severity == severity)
        if status:
            stmt = stmt.where(Alert.status == status)
        stmt = stmt.order_by(Alert.created_at.desc()).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_for_devices(self, device_ids: Sequence[str], limit: int = 50) -> Sequence[Alert]:
        if not device_ids:
            return []
        stmt = select(Alert).where(Alert.device_id.in_(device_ids)).order_by(Alert.created_at.desc()).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def count_by_severity(self) -> dict[str, int]:
        stmt = select(Alert.severity, func.count(Alert.id)).group_by(Alert.severity)
        result = await self._session.execute(stmt)
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for sev, count in result.all():
            if sev:
                counts[str(sev).lower()] = int(count)
        return counts

    async def count_by_status(self) -> dict[str, int]:
        stmt = select(Alert.status, func.count(Alert.id)).group_by(Alert.status)
        result = await self._session.execute(stmt)
        counts = {"new": 0, "investigating": 0, "resolved": 0, "closed": 0}
        for st, count in result.all():
            if st:
                counts[str(st).lower()] = int(count)
        return counts

    async def get_mitre_heatmap(self) -> list[dict[str, Any]]:
        stmt = (
            select(
                Alert.mitre_technique_id,
                Alert.mitre_technique_name,
                Alert.mitre_tactic,
                func.count(Alert.id).label("count")
            )
            .where(Alert.mitre_technique_id.isnot(None))
            .group_by(Alert.mitre_technique_id, Alert.mitre_technique_name, Alert.mitre_tactic)
            .order_by(func.count(Alert.id).desc())
        )
        result = await self._session.execute(stmt)
        return [
            {
                "technique_id": row[0],
                "technique_name": row[1],
                "tactic": row[2],
                "count": row[3],
            }
            for row in result.all()
        ]



class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Incident)

    async def get_active(self, limit: int = 50) -> Sequence[Incident]:
        stmt = (
            select(Incident)
            .where(Incident.status != "resolved")
            .order_by(Incident.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_for_devices(self, device_ids: Sequence[str], limit: int = 50) -> Sequence[Incident]:
        if not device_ids:
            return []
        stmt = (
            select(Incident)
            .where((Incident.device_id.in_(device_ids)) & (Incident.status != "resolved"))
            .order_by(Incident.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()


class DeviceRepository(BaseRepository[Device]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Device)

    async def get_by_hostname(self, hostname: str) -> Device | None:
        stmt = select(Device).where(Device.hostname == hostname)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_for_user(self, user_id: str, limit: int = 50) -> Sequence[Device]:
        stmt = select(Device).where(Device.enrolled_user_id == user_id).order_by(Device.last_seen.desc()).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def upsert(
        self,
        hostname: str,
        ip_address: str | None = None,
        risk_score: float = 0.0,
        os_name: str | None = None,
        status: str = "active",
    ) -> Device:
        device = await self.get_by_hostname(hostname)
        if device:
            if ip_address:
                device.ip_address = ip_address
            if os_name:
                device.os_name = os_name
            if status:
                device.status = status
            device.risk_score = max(device.risk_score, risk_score)
            device.last_seen = datetime.now(timezone.utc)
            await self._session.flush()
            return device
        return await self.create(
            hostname=hostname,
            ip_address=ip_address,
            os_name=os_name,
            risk_score=risk_score,
            status=status,
        )


class ScannedURLRepository(BaseRepository[ScannedURL]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ScannedURL)

    async def get_recent_scans(self, limit: int = 50) -> Sequence[ScannedURL]:
        stmt = select(ScannedURL).order_by(ScannedURL.scanned_at.desc()).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()


class IOCRepository(BaseRepository[IOC]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, IOC)

    async def match_indicator(self, value: str) -> IOC | None:
        stmt = select(IOC).where(IOC.value == value, IOC.is_active == True)  # noqa: E712
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()


class MitreRepository(BaseRepository[MitreTechnique]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, MitreTechnique)

    async def get_by_technique_id(self, technique_id: str) -> MitreTechnique | None:
        stmt = select(MitreTechnique).where(MitreTechnique.technique_id == technique_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()


class MLModelMetaRepository(BaseRepository[MLModelMeta]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, MLModelMeta)

    async def get_active_model(self) -> MLModelMeta | None:
        stmt = select(MLModelMeta).where(MLModelMeta.is_active == True, MLModelMeta.validation_status == "ACTIVE")  # noqa: E712
        stmt = stmt.order_by(MLModelMeta.created_at.desc())
        result = await self._session.execute(stmt)
        return result.scalars().first()


class MLPredictionRepository(BaseRepository[MLPrediction]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, MLPrediction)


class PlaybookExecutionRepository(BaseRepository[PlaybookExecution]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, PlaybookExecution)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AuditLog)

    async def get_recent(self, limit: int = 50, offset: int = 0, action: str | None = None) -> Sequence[AuditLog]:
        stmt = select(AuditLog)
        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
        stmt = stmt.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()


class StatsRepository(BaseRepository[DashboardStats]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, DashboardStats)

DashboardStatsRepository = StatsRepository


class MitreRepository(BaseRepository[MitreTechnique]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, MitreTechnique)


class SystemSettingRepository(BaseRepository[SystemSetting]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, SystemSetting)


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, User)

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username_or_email(self, identifier: str) -> User | None:
        stmt = select(User).where((User.username == identifier) | (User.email == identifier))
        result = await self._session.execute(stmt)
        return result.scalars().first()

    async def update_last_login(self, user_id: str) -> None:
        stmt = update(User).where(User.id == user_id).values(last_login=datetime.now(timezone.utc))
        await self._session.execute(stmt)


    async def get_users_by_role(self, role: str, active_only: bool = True) -> list[User]:
        stmt = select(User).where(User.role.ilike(role))
        if active_only:
            stmt = stmt.where(User.is_active == True)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Organization)

    async def get_by_name(self, name: str) -> Organization | None:
        stmt = select(Organization).where(Organization.name == name)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()


class AccountRequestRepository(BaseRepository[AccountRequest]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AccountRequest)

    async def get_pending_admin_queue(self) -> list[AccountRequest]:
        stmt = select(AccountRequest).where(AccountRequest.status == "REQUESTED").order_by(AccountRequest.created_at.asc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_assigned_to_analyst(self, analyst_id: str) -> list[AccountRequest]:
        stmt = select(AccountRequest).where(
            (AccountRequest.assigned_analyst_id == analyst_id) &
            (AccountRequest.status.in_(["ANALYST_ASSIGNED", "PENDING_ACTIVATION"]))
        ).order_by(AccountRequest.created_at.asc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user_id(self, user_id: str) -> AccountRequest | None:
        stmt = select(AccountRequest).where(AccountRequest.user_id == user_id).order_by(AccountRequest.created_at.desc())
        result = await self._session.execute(stmt)
        return result.scalars().first()


class AnalystAssignmentHistoryRepository(BaseRepository[AnalystAssignmentHistory]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AnalystAssignmentHistory)

    async def get_history_for_request(self, request_id: str) -> list[AnalystAssignmentHistory]:
        stmt = select(AnalystAssignmentHistory).where(
            AnalystAssignmentHistory.account_request_id == request_id
        ).order_by(AnalystAssignmentHistory.assigned_at.desc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class EnrollmentChallengeRepository(BaseRepository[EnrollmentChallenge]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, EnrollmentChallenge)

    async def get_valid_challenge(self, nonce: str) -> EnrollmentChallenge | None:
        now = datetime.now(timezone.utc)
        stmt = select(EnrollmentChallenge).where(
            (EnrollmentChallenge.nonce == nonce) &
            (EnrollmentChallenge.is_used == False) &
            (EnrollmentChallenge.expires_at > now)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()


class DeviceCredentialRepository(BaseRepository[DeviceCredential]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, DeviceCredential)

    async def get_active_credentials(self, device_id: str) -> list[DeviceCredential]:
        stmt = select(DeviceCredential).where(
            (DeviceCredential.device_id == device_id) &
            (DeviceCredential.is_revoked == False)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class PolicyRepository(BaseRepository[Policy]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Policy)

    async def get_active_policies(self, policy_type: str | None = None) -> list[Policy]:
        stmt = select(Policy).where(Policy.is_active == True)
        if policy_type:
            stmt = stmt.where(Policy.policy_type == policy_type)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

