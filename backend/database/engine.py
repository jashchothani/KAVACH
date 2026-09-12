"""
KAVACH Database Engine.

Async SQLAlchemy 2.0 engine with aiosqlite.
Manages connection lifecycle, session factory, and table creation.

SQLite Concurrency Fixes:
- WAL journal mode for concurrent reads + writes.
- 30-second busy_timeout to wait instead of raising 'database is locked'.
- PRAGMA optimizations for faster event ingestion throughput.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import event as sa_event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _set_sqlite_pragmas(dbapi_conn, connection_record):
    """
    Set SQLite PRAGMAs on every new raw connection.

    - journal_mode=WAL  — Write-Ahead Logging allows concurrent reads
      while a write is in progress, eliminating most 'database is locked' errors.
    - busy_timeout=30000 — Wait up to 30 seconds for a write lock instead
      of failing immediately.
    - synchronous=NORMAL — Slightly faster writes; safe with WAL mode.
    - cache_size=-64000  — Use ~64 MB of page cache (negative = KB).
    - foreign_keys=ON    — Enforce FK constraints.
    """
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_engine() -> AsyncEngine:
    """Get or create the async SQLAlchemy engine."""
    global _engine
    if _engine is None:
        settings = get_settings()
        is_sqlite = "sqlite" in settings.db.url

        connect_args = {}
        pool_kwargs = {}
        if is_sqlite:
            connect_args["check_same_thread"] = False
            # StaticPool reuses one connection — combined with WAL mode
            # this prevents file-lock contention on the SQLite db file.
            pool_kwargs["poolclass"] = StaticPool

        _engine = create_async_engine(
            settings.db.url,
            echo=settings.db.echo,
            pool_pre_ping=True,
            connect_args=connect_args,
            **pool_kwargs,
        )

        # Attach PRAGMA listener to the synchronous engine layer
        if is_sqlite:
            sa_event.listen(
                _engine.sync_engine, "connect", _set_sqlite_pragmas
            )

        logger.info("database_engine_created", url=settings.db.url.split("@")[-1])
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get or create the async session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a transactional async session scope.

    Usage::

        async with get_session() as session:
            result = await session.execute(select(User))
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_database() -> None:
    """Create all tables (call once at startup)."""
    from database.models import Base  # noqa: F811

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_tables_created")


async def close_database() -> None:
    """Dispose the engine (call at shutdown)."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("database_engine_disposed")

