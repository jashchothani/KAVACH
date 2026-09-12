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
    Alert,
    AuditLog,
    Base,
    DashboardStats,
    Device,
    IOC,
    Incident,
    MitreTechnique,
    MLModelMeta,
    MLPrediction,
    PlaybookExecution,
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


class DeviceRepository(BaseRepository[Device]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Device)

    async def get_by_hostname(self, hostname: str) -> Device | None:
        stmt = select(Device).where(Device.hostname == hostname)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, hostname: str, ip_address: str | None = None, risk_score: float = 0.0) -> Device:
        device = await self.get_by_hostname(hostname)
        if device:
            if ip_address:
                device.ip_address = ip_address
            device.risk_score = max(device.risk_score, risk_score)
            device.last_seen = datetime.now(timezone.utc)
            await self._session.flush()
            return device
        return await self.create(
            hostname=hostname,
            ip_address=ip_address,
            risk_score=risk_score,
            status="active",
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


class StatsRepository(BaseRepository[DashboardStats]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, DashboardStats)


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
