"""
KAVACH Database Models Compatibility Layer.

Re-exports canonical SQLAlchemy 2.0 ORM models from app.database.models to maintain
single-source-of-truth metadata, tables, and engine bindings across all components.
"""

from __future__ import annotations

from app.database.models import (
    Base,
    _utcnow,
    _uuid,
    KavachRole,
    AccountStatus,
    Organization,
    User,
    Device,
    SecurityEvent,
    Alert,
    Incident,
    ScannedURL,
    IOC,
    MitreTechnique,
    MLModelMeta,
    MLPrediction,
    PlaybookExecution,
    AuditLog,
    DashboardStats,
    SystemSetting,
    AccountRequest,
    AnalystAssignmentHistory,
    EnrollmentChallenge,
    DeviceCredential,
    Policy,
)

__all__ = [
    "Base",
    "_utcnow",
    "_uuid",
    "KavachRole",
    "AccountStatus",
    "Organization",
    "User",
    "Device",
    "SecurityEvent",
    "Alert",
    "Incident",
    "ScannedURL",
    "IOC",
    "MitreTechnique",
    "MLModelMeta",
    "MLPrediction",
    "PlaybookExecution",
    "AuditLog",
    "DashboardStats",
    "SystemSetting",
    "AccountRequest",
    "AnalystAssignmentHistory",
    "EnrollmentChallenge",
    "DeviceCredential",
    "Policy",
]
