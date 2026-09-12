"""
KAVACH Exception Hierarchy.

Structured, typed exceptions for every module.
Each exception carries an error code and HTTP status code for API responses.
"""

from __future__ import annotations
from typing import Any


class KavachBaseException(Exception):
    """Base exception for all KAVACH errors."""
    error_code: str = "KAVACH_ERROR"
    status_code: int = 500

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
        }


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


class RecordNotFoundError(KavachBaseException):
    error_code = "NOT_FOUND"
    status_code = 404


class ValidationError(KavachBaseException):
    error_code = "VALIDATION_ERROR"
    status_code = 422


class CollectorError(KavachBaseException):
    error_code = "COLLECTOR_ERROR"
    status_code = 500


class PipelineError(KavachBaseException):
    error_code = "PIPELINE_ERROR"
    status_code = 500


class AIProviderError(KavachBaseException):
    error_code = "AI_PROVIDER_ERROR"
    status_code = 502


class AIRateLimitError(KavachBaseException):
    error_code = "AI_RATE_LIMIT"
    status_code = 429


class MLModelError(KavachBaseException):
    error_code = "ML_MODEL_ERROR"
    status_code = 500


class PlaybookExecutionError(KavachBaseException):
    error_code = "PLAYBOOK_FAILED"
    status_code = 500


class URLSecurityError(KavachBaseException):
    error_code = "URL_SECURITY_ERROR"
    status_code = 400
