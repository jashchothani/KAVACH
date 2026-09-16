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


import re
import json

REDACTED_KEYS = {
    "password", "secret", "token", "access_token", "refresh_token",
    "jwt_secret", "authorization", "api_key", "gemini_api_key", "openai_api_key", "virustotal_api_key"
}

def sanitize_data(data: Any) -> Any:
    """Recursively redact sensitive credential keys."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if any(rk in str(k).lower() for rk in REDACTED_KEYS):
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = sanitize_data(v)
        return cleaned
    elif isinstance(data, (list, tuple)):
        return [sanitize_data(x) for x in data]
    return data


class KavachConsoleFormatter(logging.Formatter):
    """
    Standard single-line production formatter:
    TIMESTAMP | LEVEL | SERVICE | COMPONENT | EVENT | MESSAGE | request_id=...
    """
    ANSI_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")

    def __init__(self, strip_ansi: bool = False) -> None:
        super().__init__()
        self.strip_ansi = strip_ansi

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        lvl = record.levelname.upper().ljust(8)
        service = "KAVACH"
        comp = record.name.split(".")[-1] if record.name else "core"
        event = getattr(record, "event", record.funcName or "telemetry")
        msg = record.getMessage()

        req_id = getattr(record, "correlation_id", None) or get_correlation_id()
        line = f"{ts} | {lvl} | {service} | {comp} | {event} | {msg} | request_id={req_id}"

        if record.exc_info and not record.exc_text:
            record.exc_text = self.formatException(record.exc_info)
        if record.exc_text:
            line += f"\n{record.exc_text}"

        if self.strip_ansi:
            line = self.ANSI_RE.sub("", line)
        return line


class KavachJsonLinesFormatter(logging.Formatter):
    """
    Machine-readable structured JSONL output for SIEM and threat auditing.
    """
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname.upper(),
            "service": "kavach",
            "component": record.name or "system",
            "event": getattr(record, "event", record.funcName or "log"),
            "message": record.getMessage(),
            "request_id": getattr(record, "correlation_id", None) or get_correlation_id(),
            "process": record.process,
            "thread": record.threadName,
        }
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        extra = {
            k: sanitize_data(v)
            for k, v in record.__dict__.items()
            if k not in (
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "module", "msecs",
                "message", "msg", "name", "pathname", "process", "processName",
                "relativeCreated", "stack_info", "thread", "threadName", "correlation_id", "event"
            )
        }
        if extra:
            data["context"] = extra
        return json.dumps(data, default=str)


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

    # 1. Console Handler (clean format)
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(log_level)
    console.setFormatter(KavachConsoleFormatter(strip_ansi=False))
    root.addHandler(console)

    # 2. Text log file (kavach.log) with ANSI stripped
    app_log = log_dir / "kavach.log"
    file_handler = logging.handlers.RotatingFileHandler(
        str(app_log),
        maxBytes=20 * 1024 * 1024,  # 20 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(KavachConsoleFormatter(strip_ansi=True))
    root.addHandler(file_handler)

    # 3. Machine-readable JSONLines log file (kavach.jsonl)
    json_log = log_dir / "kavach.jsonl"
    json_handler = logging.handlers.RotatingFileHandler(
        str(json_log),
        maxBytes=20 * 1024 * 1024,  # 20 MB
        backupCount=5,
        encoding="utf-8",
    )
    json_handler.setLevel(log_level)
    json_handler.setFormatter(KavachJsonLinesFormatter())
    root.addHandler(json_handler)

    # 4. In-memory dashboard ring buffer handler
    buf_handler = BufferLogHandler()
    buf_handler.setLevel(log_level)
    root.addHandler(buf_handler)

    if HAS_STRUCTLOG:
        def _add_correlation_id(logger: Any, method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
            cid = _correlation_id.get()
            if cid:
                event_dict["correlation_id"] = cid
            return event_dict

        def _add_app_info(logger: Any, method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
            event_dict.setdefault("app", "kavach")
            return event_dict

        def kavach_console_processor(strip_ansi: bool = False):
            ansi_re = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
            def _proc(logger: Any, method_name: str, event_dict: dict[str, Any]) -> str:
                ts = event_dict.get("timestamp") or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                lvl = (event_dict.get("level") or method_name or "INFO").upper().ljust(8)
                comp = str(event_dict.get("logger") or "core").split(".")[-1]
                event = event_dict.get("event") or ""
                req_id = event_dict.get("correlation_id") or get_correlation_id()
                extras = {
                    k: sanitize_data(v) for k, v in event_dict.items()
                    if k not in ("timestamp", "level", "logger", "event", "correlation_id", "app", "exc_info")
                }
                extras_str = f" {extras}" if extras else ""
                msg = f"{event}{extras_str}"
                line = f"{ts} | {lvl} | KAVACH | {comp} | {event} | {msg} | request_id={req_id}"
                if "exc_info" in event_dict:
                    line += f"\n{event_dict['exc_info']}"
                if strip_ansi:
                    line = ansi_re.sub("", line)
                return line
            return _proc

        def kavach_jsonl_processor():
            def _proc(logger: Any, method_name: str, event_dict: dict[str, Any]) -> str:
                clean_dict = sanitize_data(dict(event_dict))
                clean_dict["service"] = "kavach"
                if "correlation_id" not in clean_dict:
                    clean_dict["correlation_id"] = get_correlation_id()
                return json.dumps(clean_dict, default=str)
            return _proc

        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                _add_correlation_id,
                _add_app_info,
                structlog.stdlib.add_log_level,
                structlog.stdlib.add_logger_name,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

        foreign_pre_chain = [
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            _add_correlation_id,
            _add_app_info,
        ]

        for handler in root.handlers:
            if isinstance(handler.formatter, KavachJsonLinesFormatter):
                handler.setFormatter(
                    structlog.stdlib.ProcessorFormatter(
                        processor=kavach_jsonl_processor(),
                        foreign_pre_chain=foreign_pre_chain,
                    )
                )
            elif isinstance(handler.formatter, KavachConsoleFormatter):
                strip = handler.formatter.strip_ansi
                handler.setFormatter(
                    structlog.stdlib.ProcessorFormatter(
                        processor=kavach_console_processor(strip_ansi=strip),
                        foreign_pre_chain=foreign_pre_chain,
                    )
                )


from collections import deque
from datetime import datetime, timezone
import uuid

# ---------------------------------------------------------------------------
# In-Memory Real-Time Log Buffer (Section 5)
# ---------------------------------------------------------------------------

class LogStream:
    APPLICATION = "application"
    SECURITY = "security"
    DETECTION = "detection"
    AUDIT = "audit"
    AUTH = "auth"
    COLLECTOR = "collector"


class LogBuffer:
    """Thread-safe circular ring buffer for real-time dashboard log display."""

    def __init__(self, maxlen: int = 5000):
        self._buffer: deque[dict[str, Any]] = deque(maxlen=maxlen)

    def append(
        self,
        stream: str,
        level: str,
        component: str,
        message: str,
        details: dict[str, Any] | None = None,
        user: str | None = None,
        ip_address: str | None = None,
    ) -> dict[str, Any]:
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stream": stream.lower(),
            "level": level.upper(),
            "component": component,
            "message": message,
            "details": details or {},
            "user": user,
            "ip_address": ip_address,
            "correlation_id": get_correlation_id(),
        }
        self._buffer.appendleft(entry)
        return entry

    def query(
        self,
        stream: str | None = None,
        level: str | None = None,
        component: str | None = None,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        filtered = []
        search_lower = search.lower() if search else None
        stream_lower = stream.lower() if stream and stream != "all" else None
        level_upper = level.upper() if level and level != "ALL" else None

        for item in self._buffer:
            if stream_lower and item["stream"] != stream_lower:
                continue
            if level_upper and item["level"] != level_upper:
                continue
            if component and item["component"] != component:
                continue
            if search_lower:
                match = (
                    search_lower in item["message"].lower()
                    or search_lower in item["component"].lower()
                    or (item["user"] and search_lower in item["user"].lower())
                    or (item["ip_address"] and search_lower in item["ip_address"].lower())
                )
                if not match:
                    continue
            filtered.append(item)

        total = len(filtered)
        paged = filtered[offset : offset + limit]
        return paged, total


_log_buffer = LogBuffer(maxlen=5000)


def get_log_buffer() -> LogBuffer:
    return _log_buffer


def record_system_log(
    stream: str,
    level: str,
    component: str,
    message: str,
    details: dict[str, Any] | None = None,
    user: str | None = None,
    ip_address: str | None = None,
) -> dict[str, Any]:
    """Record a structured event into the live system log buffer for the dashboard."""
    return _log_buffer.append(
        stream=stream,
        level=level,
        component=component,
        message=message,
        details=details,
        user=user,
        ip_address=ip_address,
    )


class BufferLogHandler(logging.Handler):
    """Captures standard Python log records into the application stream buffer."""
    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            # Skip very noisy internal polling
            if record.name in ("uvicorn.access", "watchdog", "asyncio"):
                return
            record_system_log(
                stream=LogStream.APPLICATION,
                level=record.levelname,
                component=record.name,
                message=msg,
            )
        except Exception:
            pass


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

