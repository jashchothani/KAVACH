"""
KAVACH Structured Logging.

Unified bridge that re-exports all logging utilities and log buffers from app.core.logging.
"""

from __future__ import annotations

from app.core.logging import (
    get_logger,
    setup_logging,
    get_correlation_id,
    set_correlation_id,
    get_log_buffer,
    record_system_log,
    LogStream,
    LogBuffer,
    SimpleLoggerAdapter,
)

__all__ = [
    "get_logger",
    "setup_logging",
    "get_correlation_id",
    "set_correlation_id",
    "get_log_buffer",
    "record_system_log",
    "LogStream",
    "LogBuffer",
    "SimpleLoggerAdapter",
]
