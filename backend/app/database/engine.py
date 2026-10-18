"""
KAVACH Database Engine.

Async SQLAlchemy 2.0 engine with SQLite WAL optimizations and PostgreSQL support.
Manages connection lifecycle, session factory, and table creation.
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

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _set_sqlite_pragmas(dbapi_conn, connection_record):
    """
    Set SQLite PRAGMAs for concurrency and performance:
    - journal_mode=WAL: non-blocking concurrent reads + writes.
    - busy_timeout=30000: wait up to 30s instead of locking immediately.
    - synchronous=NORMAL: fast, safe durability with WAL.
    - foreign_keys=ON: referential integrity.
    """
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def _build_engine(url: str, settings) -> AsyncEngine:
    """Build an AsyncEngine configured for SQLite or PostgreSQL."""
    is_sqlite = "sqlite" in url
    connect_args = {}
    pool_kwargs = {}
    if is_sqlite:
        connect_args["check_same_thread"] = False
        pool_kwargs["poolclass"] = StaticPool

    engine = create_async_engine(
        url,
        echo=settings.database.echo,
        pool_pre_ping=True,
        connect_args=connect_args,
        **pool_kwargs,
    )
    if is_sqlite:
        sa_event.listen(engine.sync_engine, "connect", _set_sqlite_pragmas)
    return engine


def get_engine() -> AsyncEngine:
    """Get or create the async SQLAlchemy engine with automatic fallback."""
    global _engine
    if _engine is None:
        settings = get_settings()
        target_url = settings.database.url

        try:
            _engine = _build_engine(target_url, settings)
            logger.info("database_engine_created", url=target_url.split("@")[-1])
        except Exception as exc:
            logger.warning("primary_database_failed_falling_back_to_sqlite", error=str(exc))
            sqlite_url = f"sqlite+aiosqlite:///{settings.paths.data_dir / 'kavach.db'}"
            _engine = _build_engine(sqlite_url, settings)
            logger.info("sqlite_fallback_database_engine_created", url=sqlite_url)
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
    """Transactional async session context manager."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_database() -> None:
    """Create all tables and run safe migrations on application startup with fallback."""
    from app.database.models import Base
    from app.database.migration import run_safe_migrations

    global _engine, _session_factory
    engine = get_engine()

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await run_safe_migrations(engine)
        logger.info("database_tables_initialized")
    except Exception as exc:
        logger.warning("database_init_error_switching_to_sqlite_fallback", error=str(exc))
        try:
            await engine.dispose()
        except Exception:
            pass
        settings = get_settings()
        sqlite_url = f"sqlite+aiosqlite:///{settings.paths.data_dir / 'kavach.db'}"
        _engine = _build_engine(sqlite_url, settings)
        _session_factory = None

        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await run_safe_migrations(_engine)
        logger.info("sqlite_fallback_tables_initialized")


async def close_database() -> None:
    """Dispose the engine cleanly on shutdown."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("database_engine_disposed")
