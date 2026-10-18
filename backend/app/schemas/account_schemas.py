"""
KAVACH Account & Identity Pydantic Schemas.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class AccountRegistrationRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6)
    full_name: str | None = None
    organization_name: str | None = None
    department: str | None = None
    justification: str | None = None
    phone_number: str | None = None


class AdminReviewRequest(BaseModel):
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    rejection_reason: str | None = None
    notes: str | None = None


class AnalystReviewRequest(BaseModel):
    action: str = Field(..., description="'ACTIVATE' or 'REJECT'")
    rejection_reason: str | None = None
    notes: str | None = None


class AnalystProvisionRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6)
    full_name: str | None = None
    department: str | None = "SOC Operations"


class ReassignRequest(BaseModel):
    analyst_id: str | None = None


class AccountActionRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)
