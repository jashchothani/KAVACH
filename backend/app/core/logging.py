"""
KAVACH Structured Logging.

JSON-structured logging via structlog with:
- Correlation IDs for request tracing
- Console + rotating file output in data/logs/kavach.log
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

try:
    import structlog
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False

from app.core.config import get_settings

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
# Setup
# ---------------------------------------------------------------------------

_configured = False


def setup_logging() -> None:
    """Configure structured logging for the entire application."""
    global _configured
    if _configured:
        return
    _configured = True

    settings = get_settings()
    log_level_str = settings.log_level.value
    log_level = getattr(logging, log_level_str, logging.INFO)

    log_dir = settings.paths.log_dir
    log_dir.mkdir(parents=True, exist_ok=True)

    root = logging.getLogger()
    root.setLevel(log_level)
    root.handlers.clear()

    console = logging.StreamHandler(sys.stdout)
    console.setLevel(log_level)
    root.addHandler(console)

    app_log = log_dir / "kavach.log"
    file_handler = logging.handlers.RotatingFileHandler(
        str(app_log),
        maxBytes=20 * 1024 * 1024,  # 20 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)
    root.addHandler(file_handler)

    for name in ("uvicorn.access", "watchdog", "httpx", "httpcore", "asyncio"):
        logging.getLogger(name).setLevel(logging.WARNING)

    if HAS_STRUCTLOG:
        def _add_correlation_id(logger: Any, method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
            cid = _correlation_id.get()
            if cid:
                event_dict["correlation_id"] = cid
            return event_dict

        def _add_app_info(logger: Any, method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
            event_dict.setdefault("app", "kavach")
            return event_dict

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

        formatter = structlog.stdlib.ProcessorFormatter(
            processor=structlog.dev.ConsoleRenderer(colors=sys.stdout.isatty()),
            foreign_pre_chain=shared_processors,
        )
        for handler in root.handlers:
            handler.setFormatter(formatter)


class SimpleLoggerAdapter:
    """Fallback adapter when structlog is not present."""
    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def info(self, event: str, **kwargs: Any) -> None:
        self._logger.info(f"{event} {kwargs}" if kwargs else event)

    def warning(self, event: str, **kwargs: Any) -> None:
        self._logger.warning(f"{event} {kwargs}" if kwargs else event)

    def error(self, event: str, **kwargs: Any) -> None:
        self._logger.error(f"{event} {kwargs}" if kwargs else event)

    def exception(self, event: str, **kwargs: Any) -> None:
        self._logger.exception(f"{event} {kwargs}" if kwargs else event)

    def debug(self, event: str, **kwargs: Any) -> None:
        self._logger.debug(f"{event} {kwargs}" if kwargs else event)


def get_logger(name: str = "kavach") -> Any:
    """Get a structured logger bound to the given name."""
    if not _configured:
        setup_logging()
    if HAS_STRUCTLOG:
        return structlog.get_logger(name)
    return SimpleLoggerAdapter(logging.getLogger(name))
