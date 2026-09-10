"""
KAVACH API - Audit Log Routes
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.core.security import get_current_user, require_permission
import random

router = APIRouter()

def _generate_audit_logs():
    actions = ["login", "logout", "threat_detected", "incident_created", "playbook_executed", "playbook_rollback",
               "user_created", "settings_changed", "alert_acknowledged", "report_exported", "ioc_searched"]
    resources = ["auth", "threats", "incidents", "playbooks", "users", "settings", "alerts", "reports", "threat_intel"]
    users = [("admin@kavach.io", "Kavach Admin"), ("analyst@kavach.io", "SOC Analyst"), ("responder@kavach.io", "Incident Responder")]
    logs = []
    for i in range(50):
        action = random.choice(actions)
        user = random.choice(users)
        logs.append({
            "id": i + 1, "user_id": random.randint(1, 5), "username": user[1],
            "action": action, "resource": random.choice(resources),
            "resource_id": str(random.randint(1, 100)),
            "details": {"description": f"User performed {action.replace('_', ' ')}"},
            "ip_address": f"192.168.{random.randint(1,10)}.{random.randint(1,254)}",
            "status": random.choices(["success", "failure"], weights=[90, 10])[0],
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 168))).isoformat(),
        })
    return sorted(logs, key=lambda x: x["timestamp"], reverse=True)

DEMO_AUDIT_LOGS = _generate_audit_logs()

@router.get("/")
async def list_audit_logs(
    action: Optional[str] = None, user_id: Optional[int] = None,
    resource: Optional[str] = None, search: Optional[str] = None,
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_permission("audit:view")),
):
    filtered = DEMO_AUDIT_LOGS.copy()
    if action: filtered = [l for l in filtered if l["action"] == action]
    if user_id: filtered = [l for l in filtered if l["user_id"] == user_id]
    if resource: filtered = [l for l in filtered if l["resource"] == resource]
    if search: filtered = [l for l in filtered if search.lower() in str(l).lower()]
    total = len(filtered)
    start = (page - 1) * per_page
    return {"items": filtered[start:start + per_page], "total": total, "page": page, "per_page": per_page}

@router.get("/actions")
async def list_action_types(current_user: dict = Depends(require_permission("audit:view"))):
    return {"actions": list(set(l["action"] for l in DEMO_AUDIT_LOGS))}

@router.get("/export")
async def export_audit_logs(format: str = "csv", current_user: dict = Depends(require_permission("reports:export"))):
    return {"message": f"Audit logs exported as {format}", "download_url": f"/api/v1/audit/download/audit_logs.{format}"}
