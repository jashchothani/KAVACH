"""
KAVACH Backend - Pydantic Schemas
Request/Response models for all API endpoints
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────────
# Auth Schemas
# ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


# ──────────────────────────────────────────────
# User Schemas
# ──────────────────────────────────────────────
class UserBase(BaseModel):
    email: str
    username: str
    full_name: str
    role_id: int
    department: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role_id: int
    role_name: Optional[str] = None
    is_active: bool
    mfa_enabled: bool
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Threat Schemas
# ──────────────────────────────────────────────
class ThreatBase(BaseModel):
    name: str
    threat_type: str
    severity: str = "medium"
    description: Optional[str] = None
    source: Optional[str] = None
    confidence_score: float = 0.0
    mitre_technique_id: Optional[int] = None
    endpoint_id: Optional[int] = None


class ThreatCreate(ThreatBase):
    pass


class ThreatResponse(ThreatBase):
    id: int
    status: str
    ai_analysis: Optional[dict] = None
    response_action: Optional[str] = None
    ioc_data: Optional[dict] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    mitre_technique_name: Optional[str] = None
    endpoint_hostname: Optional[str] = None

    class Config:
        from_attributes = True


class ThreatListResponse(BaseModel):
    items: List[ThreatResponse]
    total: int
    page: int
    per_page: int


# ──────────────────────────────────────────────
# Incident Schemas
# ──────────────────────────────────────────────
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "medium"
    assigned_to: Optional[int] = None
    threat_ids: List[int] = []


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    escalation_level: Optional[int] = None
    investigation_notes: Optional[str] = None
    resolution_summary: Optional[str] = None


class IncidentResponse(IncidentBase):
    id: int
    status: str
    escalation_level: int
    evidence: list = []
    timeline: list = []
    investigation_notes: Optional[str] = None
    resolution_summary: Optional[str] = None
    priority: int
    assignee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# MITRE Schemas
# ──────────────────────────────────────────────
class MitreTechniqueResponse(BaseModel):
    id: int
    technique_id: str
    tactic: str
    name: str
    description: Optional[str] = None
    sub_techniques: list = []
    detection_rule: Optional[str] = None
    severity: str
    coverage_status: str
    data_sources: list = []
    platforms: list = []
    threat_count: int = 0

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Playbook Schemas
# ──────────────────────────────────────────────
class PlaybookBase(BaseModel):
    name: str
    playbook_type: str
    description: Optional[str] = None
    steps: list = []
    approval_required: bool = True
    tags: list = []


class PlaybookCreate(PlaybookBase):
    pass


class PlaybookResponse(PlaybookBase):
    id: int
    status: str
    last_executed: Optional[datetime] = None
    execution_count: int
    avg_execution_time: float
    created_at: datetime

    class Config:
        from_attributes = True


class PlaybookExecuteRequest(BaseModel):
    playbook_id: int
    target_endpoint_id: Optional[int] = None
    parameters: dict = {}


# ──────────────────────────────────────────────
# Alert Schemas
# ──────────────────────────────────────────────
class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    severity: str
    is_read: bool
    threat_id: Optional[int] = None
    source: Optional[str] = None
    metadata: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True


class AlertBulkAction(BaseModel):
    alert_ids: List[int]
    action: str  # "mark_read", "mark_unread", "delete"


# ──────────────────────────────────────────────
# Analytics Schemas
# ──────────────────────────────────────────────
class DashboardStats(BaseModel):
    security_score: float
    active_threats: int
    protected_endpoints: int
    open_incidents: int
    ai_detections_today: int
    soar_actions_today: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int


class TrendDataPoint(BaseModel):
    date: str
    value: float
    label: Optional[str] = None


class AnalyticsResponse(BaseModel):
    threat_trends: List[TrendDataPoint]
    incident_trends: List[TrendDataPoint]
    security_score_trend: List[TrendDataPoint]
    threat_categories: dict
    endpoint_health: dict


# ──────────────────────────────────────────────
# AI Security Schemas
# ──────────────────────────────────────────────
class AIAnalysisResponse(BaseModel):
    id: int
    analysis_type: str
    confidence_score: float
    authenticity_score: float
    risk_level: str
    result: dict
    analysis_details: dict
    is_threat: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PhishingCheckRequest(BaseModel):
    url: Optional[str] = None
    email_content: Optional[str] = None


# ──────────────────────────────────────────────
# Threat Intelligence Schemas
# ──────────────────────────────────────────────
class IOCSearchRequest(BaseModel):
    ioc_type: str
    ioc_value: str


class ThreatIntelResponse(BaseModel):
    id: int
    ioc_type: str
    ioc_value: str
    source: str
    reputation_score: float
    tags: list = []
    context: dict = {}
    is_malicious: bool
    first_seen: datetime
    last_seen: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Audit Schemas
# ──────────────────────────────────────────────
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource: str
    resource_id: Optional[str] = None
    details: dict = {}
    ip_address: Optional[str] = None
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Endpoint Schemas
# ──────────────────────────────────────────────
class EndpointResponse(BaseModel):
    id: int
    hostname: str
    ip_address: str
    os_type: str
    os_version: Optional[str] = None
    status: str
    agent_version: Optional[str] = None
    department: Optional[str] = None
    risk_score: float
    last_seen: datetime

    class Config:
        from_attributes = True
