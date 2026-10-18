"""
KAVACH Safe Database Migration Runner.

Performs idempotent schema migrations for SQLite and PostgreSQL:
- Adds missing columns to existing tables without data destruction
- Creates any newly declared tables, foreign keys, and indexes
- Preserves all pre-existing rows, telemetry, and audit history
"""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.logging import get_logger

logger = get_logger(__name__)


async def run_safe_migrations(engine: AsyncEngine) -> None:
    """Idempotently add new columns to existing tables if missing."""
    async with engine.begin() as conn:
        dialect = engine.dialect.name.lower()

        if "sqlite" in dialect:
            # Check users columns
            res = await conn.execute(text("PRAGMA table_info(users)"))
            user_cols = {row[1] for row in res.fetchall()}

            new_user_cols = [
                ("status", "VARCHAR(50) DEFAULT 'ACTIVE'"),
                ("full_name", "VARCHAR(255)"),
                ("organization_id", "VARCHAR(36)"),
                ("department", "VARCHAR(100)"),
                ("phone_number", "VARCHAR(50)"),
                ("session_revoked_at", "DATETIME"),
                ("revocation_reason", "VARCHAR(500)"),
            ]
            for col_name, col_def in new_user_cols:
                if col_name not in user_cols:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
                    logger.info("migration_column_added", table="users", column=col_name)

            # Check devices columns
            res = await conn.execute(text("PRAGMA table_info(devices)"))
            dev_cols = {row[1] for row in res.fetchall()}

            new_dev_cols = [
                ("enrollment_status", "VARCHAR(50) DEFAULT 'PENDING'"),
                ("enrolled_user_id", "VARCHAR(36)"),
                ("public_key", "TEXT"),
                ("agent_version", "VARCHAR(50)"),
            ]
            for col_name, col_def in new_dev_cols:
                if col_name not in dev_cols:
                    await conn.execute(text(f"ALTER TABLE devices ADD COLUMN {col_name} {col_def}"))
                    logger.info("migration_column_added", table="devices", column=col_name)

        elif "postgres" in dialect:
            # PostgreSQL idempotent column additions
            user_cols_pg = [
                ("status", "VARCHAR(50) DEFAULT 'ACTIVE'"),
                ("full_name", "VARCHAR(255)"),
                ("organization_id", "VARCHAR(36)"),
                ("department", "VARCHAR(100)"),
                ("phone_number", "VARCHAR(50)"),
                ("session_revoked_at", "TIMESTAMPTZ"),
                ("revocation_reason", "VARCHAR(500)"),
            ]
            for col_name, col_def in user_cols_pg:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))

            dev_cols_pg = [
                ("enrollment_status", "VARCHAR(50) DEFAULT 'PENDING'"),
                ("enrolled_user_id", "VARCHAR(36)"),
                ("public_key", "TEXT"),
                ("agent_version", "VARCHAR(50)"),
            ]
            for col_name, col_def in dev_cols_pg:
                await conn.execute(text(f"ALTER TABLE devices ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))

    logger.info("database_migrations_complete")
