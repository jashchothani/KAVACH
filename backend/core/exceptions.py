"""
KAVACH Exception Hierarchy.

Structured, typed exceptions for every module.
Each exception carries an error code for API responses.
"""

from __future__ import annotations


class KavachBaseException(Exception):
    """Base exception for all KAVACH errors."""

    error_code: str = "KAVACH_ERROR"
    status_code: int = 500

    def __init__(self, message: str, details: dict | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
        }


# ---------------------------------------------------------------------------
# Authentication / Authorisation
# ---------------------------------------------------------------------------

class AuthenticationError(KavachBaseException):
    error_code = "AUTH_FAILED"
    status_code = 401


class AuthorizationError(KavachBaseException):
    error_code = "FORBIDDEN"
    status_code = 403


class TokenExpiredError(AuthenticationError):
    error_code = "TOKEN_EXPIRED"


class InvalidTokenError(AuthenticationError):
    error_code = "INVALID_TOKEN"


# ---------------------------------------------------------------------------
# Collector
# ---------------------------------------------------------------------------

class CollectorError(KavachBaseException):
    error_code = "COLLECTOR_ERROR"


class CollectorStartError(CollectorError):
    error_code = "COLLECTOR_START_FAILED"


class CollectorNotFoundError(CollectorError):
    error_code = "COLLECTOR_NOT_FOUND"
    status_code = 404


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

class PipelineError(KavachBaseException):
    error_code = "PIPELINE_ERROR"


class NormalizationError(PipelineError):
    error_code = "NORMALIZATION_FAILED"


class EnrichmentError(PipelineError):
    error_code = "ENRICHMENT_FAILED"


class CorrelationError(PipelineError):
    error_code = "CORRELATION_FAILED"


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

class DatabaseError(KavachBaseException):
    error_code = "DATABASE_ERROR"


class RecordNotFoundError(DatabaseError):
    error_code = "RECORD_NOT_FOUND"
    status_code = 404


class DuplicateRecordError(DatabaseError):
    error_code = "DUPLICATE_RECORD"
    status_code = 409


# ---------------------------------------------------------------------------
# Playbook / SOAR
# ---------------------------------------------------------------------------

class PlaybookError(KavachBaseException):
    error_code = "PLAYBOOK_ERROR"


class PlaybookNotFoundError(PlaybookError):
    error_code = "PLAYBOOK_NOT_FOUND"
    status_code = 404


class PlaybookExecutionError(PlaybookError):
    error_code = "PLAYBOOK_EXECUTION_FAILED"


class RollbackError(PlaybookError):
    error_code = "ROLLBACK_FAILED"


# ---------------------------------------------------------------------------
# AI
# ---------------------------------------------------------------------------

class AIError(KavachBaseException):
    error_code = "AI_ERROR"


class AIProviderError(AIError):
    error_code = "AI_PROVIDER_ERROR"


class AIRateLimitError(AIError):
    error_code = "AI_RATE_LIMIT"
    status_code = 429


# ---------------------------------------------------------------------------
# Threat Intelligence
# ---------------------------------------------------------------------------

class ThreatIntelError(KavachBaseException):
    error_code = "THREAT_INTEL_ERROR"


class ThreatIntelAPIError(ThreatIntelError):
    error_code = "TI_API_ERROR"


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

class ValidationError(KavachBaseException):
    error_code = "VALIDATION_ERROR"
    status_code = 422


# ---------------------------------------------------------------------------
# Queue
# ---------------------------------------------------------------------------

class QueueError(KavachBaseException):
    error_code = "QUEUE_ERROR"


class QueueFullError(QueueError):
    error_code = "QUEUE_FULL"
    status_code = 429
