"""
KAVACH Test Configuration.

Forces all tests to use an isolated, temporary SQLite database so that
test-generated users (guard_user_*, demo_user_*, etc.) never pollute
the production kavach.db.
"""

from __future__ import annotations

import os

# Override environment variables BEFORE any KAVACH module is imported.
# This ensures the engine is created with the test database and running in development mode.
os.environ["DB_URL"] = "sqlite+aiosqlite:///kavach_test.db"
os.environ["ENVIRONMENT"] = "development"

import pytest
from core.config import reload_settings


@pytest.fixture(autouse=True, scope="session")
def _force_test_database():
    """
    Session-scoped fixture that guarantees the settings singleton
    and database engine use the test database URL, not production.
    """
    # Force-reload settings so the DB_URL env var takes effect
    reload_settings()

    # Reset the engine singleton so it picks up the new URL
    import database.engine as eng
    eng._engine = None
    eng._session_factory = None

    yield

    # Cleanup: remove test database files after all tests
    import pathlib
    for suffix in ("", "-wal", "-shm"):
        p = pathlib.Path("kavach_test.db" + suffix)
        if p.exists():
            try:
                p.unlink()
            except OSError:
                pass
