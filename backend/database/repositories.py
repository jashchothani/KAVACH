"""
KAVACH Repository Layer.

Generic async CRUD + domain-specific repositories.
Repository pattern keeps SQL out of service/API layers.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Generic, Sequence, Type, TypeVar

from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from database.models import (
    Alert,
    AuditLog,
    Base,
    DashboardStats,
    Device,
    IOC,
    Incident,
    MitreTechnique,
    PlaybookExecution,
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

    async def update_by_id(self, record_id: str, **kwargs: Any) -> ModelT | None:
        instance = await self.get_by_id(record_id)
        if instance is None:
            return None
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self._session.flush()
        return instance

    async def delete_by_id(self, record_id: str) -> bool:
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
# User Repository
# ---------------------------------------------------------------------------

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

    async def update_last_login(self, user_id: str) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(last_login=datetime.now(timezone.utc))
        )
        await self._session.execute(stmt)


# ---------------------------------------------------------------------------
# Alert Repository
# ---------------------------------------------------------------------------

class AlertRepository(BaseRepository[Alert]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Alert)

    async def get_by_status(
        self, status: str, *, offset: int = 0, limit: int = 50
    ) -> Sequence[Alert]:
        stmt = (
            select(Alert)
            .where(Alert.status == status)
            .order_by(Alert.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_severity(
        self, severity: str, *, offset: int = 0, limit: int = 50
    ) -> Sequence[Alert]:
        stmt = (
            select(Alert)
            .where(Alert.severity == severity)
            .order_by(Alert.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_recent(self, limit: int = 20) -> Sequence[Alert]:
        stmt = (
            select(Alert)
            .order_by(Alert.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def count_by_severity(self) -> dict[str, int]:
        stmt = (
            select(Alert.severity, func.count(Alert.id))
            .group_by(Alert.severity)
        )
        result = await self._session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def count_by_status(self) -> dict[str, int]:
        stmt = (
            select(Alert.status, func.count(Alert.id))
            .group_by(Alert.status)
        )
        result = await self._session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def get_mitre_heatmap(self) -> list[dict[str, Any]]:
        stmt = (
            select(
                Alert.mitre_technique_id,
                Alert.mitre_technique_name,
                Alert.mitre_tactic,
                func.count(Alert.id).label("count"),
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


# ---------------------------------------------------------------------------
# Incident Repository
# ---------------------------------------------------------------------------

class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Incident)

    async def get_open(self, *, offset: int = 0, limit: int = 50) -> Sequence[Incident]:
        stmt = (
            select(Incident)
            .where(Incident.status.in_(["open", "investigating", "contained"]))
            .order_by(Incident.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()


# ---------------------------------------------------------------------------
# IOC Repository
# ---------------------------------------------------------------------------

class IOCRepository(BaseRepository[IOC]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, IOC)

    async def find_by_value(self, value: str) -> IOC | None:
        stmt = select(IOC).where(IOC.value == value)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, ioc_type: str, value: str, source: str, **kwargs: Any) -> IOC:
        existing = await self.find_by_value(value)
        if existing:
            existing.last_seen = datetime.now(timezone.utc)
            for k, v in kwargs.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
            await self._session.flush()
            return existing
        return await self.create(ioc_type=ioc_type, value=value, source=source, **kwargs)


# ---------------------------------------------------------------------------
# Device Repository
# ---------------------------------------------------------------------------

class DeviceRepository(BaseRepository[Device]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Device)

    async def get_by_hostname(self, hostname: str) -> Device | None:
        stmt = select(Device).where(Device.hostname == hostname)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, hostname: str, **kwargs: Any) -> Device:
        existing = await self.get_by_hostname(hostname)
        if existing:
            existing.last_seen = datetime.now(timezone.utc)
            for k, v in kwargs.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
            await self._session.flush()
            return existing
        return await self.create(hostname=hostname, **kwargs)


# ---------------------------------------------------------------------------
# MITRE Repository
# ---------------------------------------------------------------------------

class MitreRepository(BaseRepository[MitreTechnique]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, MitreTechnique)

    async def get_by_technique_id(self, technique_id: str) -> MitreTechnique | None:
        stmt = select(MitreTechnique).where(MitreTechnique.technique_id == technique_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_tactic(self, tactic: str) -> Sequence[MitreTechnique]:
        stmt = select(MitreTechnique).where(MitreTechnique.tactic == tactic)
        result = await self._session.execute(stmt)
        return result.scalars().all()


# ---------------------------------------------------------------------------
# Playbook Execution Repository
# ---------------------------------------------------------------------------

class PlaybookExecutionRepository(BaseRepository[PlaybookExecution]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, PlaybookExecution)

    async def get_rollbackable(self) -> Sequence[PlaybookExecution]:
        stmt = (
            select(PlaybookExecution)
            .where(
                PlaybookExecution.rollback_available == True,  # noqa: E712
                PlaybookExecution.status == "completed",
            )
            .order_by(PlaybookExecution.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()


# ---------------------------------------------------------------------------
# Audit Log Repository
# ---------------------------------------------------------------------------

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AuditLog)

    async def log_action(
        self,
        action: str,
        actor: str | None = None,
        actor_role: str | None = None,
        target_type: str | None = None,
        target_id: str | None = None,
        details: dict | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        return await self.create(
            action=action,
            actor=actor,
            actor_role=actor_role,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
        )


# ---------------------------------------------------------------------------
# Dashboard Stats Repository
# ---------------------------------------------------------------------------

class StatsRepository(BaseRepository[DashboardStats]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, DashboardStats)

    async def record_stat(
        self, stat_type: str, stat_key: str, stat_value: float, period: str = "hourly"
    ) -> DashboardStats:
        return await self.create(
            stat_type=stat_type,
            stat_key=stat_key,
            stat_value=stat_value,
            period=period,
        )
