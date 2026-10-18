"""
KAVACH Database Engine Compatibility Layer.

Re-exports canonical async SQLAlchemy 2.0 engine and session factory from
app.database.engine to ensure unified connection pooling, SQLite WAL pragmas,
and single-instance lifecycle management.
"""

from __future__ import annotations

from app.database.engine import (
    _set_sqlite_pragmas,
    get_engine,
    get_session_factory,
    get_session,
    init_database,
    close_database,
)

__all__ = [
    "_set_sqlite_pragmas",
    "get_engine",
    "get_session_factory",
    "get_session",
    "init_database",
    "close_database",
]
