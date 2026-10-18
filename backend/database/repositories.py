"""
KAVACH Repositories Compatibility Layer.

Re-exports canonical async repositories from app.database.repositories to ensure
consistent query logic, transaction semantics, and data operations across all layers.
"""

from __future__ import annotations

from app.database.repositories import (
    BaseRepository,
    UserRepository,
    DeviceRepository,
    SecurityEventRepository,
    AlertRepository,
    IncidentRepository,
    ScannedURLRepository,
    IOCRepository,
    PlaybookExecutionRepository,
    AuditLogRepository,
    DashboardStatsRepository,
    StatsRepository,
    MitreRepository,
    SystemSettingRepository,
    OrganizationRepository,
    AccountRequestRepository,
    AnalystAssignmentHistoryRepository,
    EnrollmentChallengeRepository,
    DeviceCredentialRepository,
    PolicyRepository,
)

__all__ = [
    "BaseRepository",
    "UserRepository",
    "DeviceRepository",
    "SecurityEventRepository",
    "AlertRepository",
    "IncidentRepository",
    "ScannedURLRepository",
    "IOCRepository",
    "PlaybookExecutionRepository",
    "AuditLogRepository",
    "DashboardStatsRepository",
    "StatsRepository",
    "MitreRepository",
    "SystemSettingRepository",
    "OrganizationRepository",
    "AccountRequestRepository",
    "AnalystAssignmentHistoryRepository",
    "EnrollmentChallengeRepository",
    "DeviceCredentialRepository",
    "PolicyRepository",
]
