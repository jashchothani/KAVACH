"""
KAVACH Backend - SQLAlchemy Database Models
Complete schema for all 12 tables
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float,
    ForeignKey, JSON, Enum as SAEnum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────
class SeverityLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ThreatStatus(str, enum.Enum):
    ACTIVE = "active"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"


class PlaybookStatus(str, enum.Enum):
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    PENDING_APPROVAL = "pending_approval"


class AlertCategory(str, enum.Enum):
    THREAT = "threat"
    INCIDENT = "incident"
    AI = "ai"
    SOAR = "soar"
    SYSTEM = "system"


class IOCType(str, enum.Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH = "hash"
    EMAIL = "email"


class AIAnalysisType(str, enum.Enum):
    DEEPFAKE = "deepfake"
    VISHING = "vishing"
    PHISHING = "phishing"


class EndpointStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ISOLATED = "isolated"
    COMPROMISED = "compromised"


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    permissions = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    department = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    role = relationship("Role", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    assigned_incidents = relationship("Incident", back_populates="assignee", foreign_keys="Incident.assigned_to")


class MitreTechnique(Base):
    __tablename__ = "mitre_techniques"

    id = Column(Integer, primary_key=True, index=True)
    technique_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g., T1059
    tactic = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sub_techniques = Column(JSON, default=[])
    detection_rule = Column(Text)
    severity = Column(SAEnum(SeverityLevel), default=SeverityLevel.MEDIUM)
    coverage_status = Column(String(20), default="partial")  # none, partial, full
    data_sources = Column(JSON, default=[])
    platforms = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    threats = relationship("Threat", back_populates="mitre_technique")


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=False)
    mac_address = Column(String(17), nullable=True)
    os_type = Column(String(50), nullable=False)
    os_version = Column(String(100), nullable=True)
    status = Column(SAEnum(EndpointStatus), default=EndpointStatus.ONLINE)
    agent_version = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    risk_score = Column(Float, default=0.0)
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    threats = relationship("Threat", back_populates="endpoint")


class Threat(Base):
    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    threat_type = Column(String(100), nullable=False)
    severity = Column(SAEnum(SeverityLevel), default=SeverityLevel.MEDIUM)
    status = Column(SAEnum(ThreatStatus), default=ThreatStatus.ACTIVE)
    description = Column(Text)
    source = Column(String(100))
    confidence_score = Column(Float, default=0.0)
    mitre_technique_id = Column(Integer, ForeignKey("mitre_techniques.id"), nullable=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id"), nullable=True)
    ai_analysis = Column(JSON, nullable=True)
    response_action = Column(String(255), nullable=True)
    ioc_data = Column(JSON, default={})
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    mitre_technique = relationship("MitreTechnique", back_populates="threats")
    endpoint = relationship("Endpoint", back_populates="threats")
    alerts = relationship("Alert", back_populates="threat")

    __table_args__ = (
        Index("idx_threat_severity", "severity"),
        Index("idx_threat_status", "status"),
        Index("idx_threat_detected", "detected_at"),
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(SAEnum(SeverityLevel), default=SeverityLevel.MEDIUM)
    status = Column(SAEnum(IncidentStatus), default=IncidentStatus.OPEN)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    escalation_level = Column(Integer, default=0)
    threat_ids = Column(JSON, default=[])
    evidence = Column(JSON, default=[])
    timeline = Column(JSON, default=[])
    investigation_notes = Column(Text, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    priority = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    assignee = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_to])

    __table_args__ = (
        Index("idx_incident_status", "status"),
        Index("idx_incident_severity", "severity"),
    )


class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    playbook_type = Column(String(100), nullable=False)
    description = Column(Text)
    steps = Column(JSON, default=[])
    status = Column(SAEnum(PlaybookStatus), default=PlaybookStatus.READY)
    approval_required = Column(Boolean, default=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_executed = Column(DateTime(timezone=True), nullable=True)
    execution_count = Column(Integer, default=0)
    avg_execution_time = Column(Float, default=0.0)
    rollback_steps = Column(JSON, default=[])
    schedule = Column(JSON, nullable=True)
    tags = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(SAEnum(AlertCategory), default=AlertCategory.THREAT)
    severity = Column(SAEnum(SeverityLevel), default=SeverityLevel.MEDIUM)
    is_read = Column(Boolean, default=False)
    threat_id = Column(Integer, ForeignKey("threats.id"), nullable=True)
    source = Column(String(100))
    metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    threat = relationship("Threat", back_populates="alerts")

    __table_args__ = (
        Index("idx_alert_category", "category"),
        Index("idx_alert_read", "is_read"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    resource_id = Column(String(50), nullable=True)
    details = Column(JSON, default={})
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(20), default="success")
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_action", "action"),
        Index("idx_audit_timestamp", "timestamp"),
    )


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_type = Column(SAEnum(AIAnalysisType), nullable=False)
    input_filename = Column(String(500), nullable=True)
    input_url = Column(String(2000), nullable=True)
    confidence_score = Column(Float, default=0.0)
    authenticity_score = Column(Float, default=0.0)
    risk_level = Column(SAEnum(SeverityLevel), default=SeverityLevel.LOW)
    result = Column(JSON, default={})
    analysis_details = Column(JSON, default={})
    is_threat = Column(Boolean, default=False)
    analyzed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    ioc_type = Column(SAEnum(IOCType), nullable=False)
    ioc_value = Column(String(2000), nullable=False, index=True)
    source = Column(String(100), nullable=False)
    reputation_score = Column(Float, default=0.0)
    tags = Column(JSON, default=[])
    context = Column(JSON, default={})
    is_malicious = Column(Boolean, default=False)
    first_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_ioc_type_value", "ioc_type", "ioc_value"),
    )
