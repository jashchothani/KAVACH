"""
KAVACH Structured Logging.

JSON-structured logging via structlog with:
- Correlation IDs for request tracing
- Console + rotating file output
- Configurable log levels per module
- Async-safe logging
"""

from __future__ import annotations

import logging
import logging.handlers
import sys
import uuid
from contextvars import ContextVar
from pathlib import Path
from typing import Any

import structlog

from core.config import get_settings

# ---------------------------------------------------------------------------
# Context variable for request correlation
# ---------------------------------------------------------------------------
_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
    """Get the current correlation ID."""
    cid = _correlation_id.get()
    if not cid:
        cid = str(uuid.uuid4())[:12]
        _correlation_id.set(cid)
    return cid


def set_correlation_id(cid: str | None = None) -> str:
    """Set a correlation ID for the current context."""
    if cid is None:
        cid = str(uuid.uuid4())[:12]
    _correlation_id.set(cid)
    return cid


# ---------------------------------------------------------------------------
# Structlog processors
# ---------------------------------------------------------------------------

def _add_correlation_id(
    logger: Any, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """Inject correlation ID into every log entry."""
    cid = _correlation_id.get()
    if cid:
        event_dict["correlation_id"] = cid
    return event_dict


def _add_app_info(
    logger: Any, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """Add application metadata."""
    event_dict.setdefault("app", "kavach")
    return event_dict


# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

_configured = False


def setup_logging() -> None:
    """
    Configure structured logging for the entire application.

    Call once at startup (idempotent).
    """
    global _configured
    if _configured:
        return
    _configured = True

    settings = get_settings()
    log_level_str = settings.log_level.value
    log_level = getattr(logging, log_level_str, logging.INFO)

    # Ensure log directory exists
    log_dir = settings.paths.log_dir
    log_dir.mkdir(parents=True, exist_ok=True)

    # --- Standard library root logger ---
    root = logging.getLogger()
    root.setLevel(log_level)
    root.handlers.clear()

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(log_level)
    root.addHandler(console)

    # Rotating file handler (JSON)
    app_log = log_dir / "kavach.log"
    file_handler = logging.handlers.RotatingFileHandler(
        str(app_log),
        maxBytes=50 * 1024 * 1024,  # 50 MB
        backupCount=10,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)
    root.addHandler(file_handler)

    # Silence noisy third-party loggers
    for name in ("uvicorn.access", "watchdog", "httpx", "httpcore", "asyncio"):
        logging.getLogger(name).setLevel(logging.WARNING)

    # --- Structlog configuration ---
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        _add_correlation_id,
        _add_app_info,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Apply structlog formatter to stdlib handlers
    formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.dev.ConsoleRenderer(colors=sys.stdout.isatty()),
        foreign_pre_chain=shared_processors,
    )
    for handler in root.handlers:
        handler.setFormatter(formatter)


def get_logger(name: str = "kavach") -> structlog.stdlib.BoundLogger:
    """
    Get a structured logger bound to the given name.

    Usage::

        from core.logging import get_logger
        logger = get_logger(__name__)
        logger.info("collector_started", collector="sysmon")
    """
    if not _configured:
        setup_logging()
    return structlog.get_logger(name)
