"""
KAVACH API - Incident Management Routes
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.core.security import get_current_user
from app.schemas.schemas import IncidentResponse, IncidentCreate, IncidentUpdate
import random

router = APIRouter()

def _generate_incidents():
    titles = [
        "Ransomware outbreak on production servers",
        "Unauthorized access to financial database",
        "Phishing campaign targeting executive team",
        "Suspicious lateral movement in DMZ",
        "Data exfiltration attempt via DNS tunneling",
        "Compromised service account detected",
        "Malware infection on chemical plant SCADA",
        "Brute force attack on VPN gateway",
        "Insider threat - unauthorized data download",
        "Supply chain compromise via vendor portal",
        "Zero-day exploit on web application firewall",
        "Credential stuffing attack on customer portal",
        "APT group activity detected in R&D network",
        "Cryptominer deployed on cloud instances",
        "Social engineering attack on HR department",
    ]
    incidents = []
    for i, title in enumerate(titles):
        severity = random.choice(["critical", "high", "medium", "low"])
        status = random.choice(["open", "investigating", "contained", "resolved", "closed"])
        incidents.append({
            "id": i + 1,
            "title": title,
            "description": f"Detailed investigation of: {title}. Multiple indicators of compromise detected. Requires immediate response.",
            "severity": severity,
            "status": status,
            "assigned_to": random.randint(1, 5),
            "escalation_level": random.randint(0, 3),
            "threat_ids": [random.randint(1, 50) for _ in range(random.randint(1, 4))],
            "evidence": [{"type": "log", "description": "System event log"}, {"type": "pcap", "description": "Network capture"}],
            "timeline": [
                {"time": (datetime.now(timezone.utc) - timedelta(hours=random.randint(2, 48))).isoformat(), "action": "Incident created", "user": "System"},
                {"time": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24))).isoformat(), "action": "Assigned to analyst", "user": "Admin"},
            ],
            "investigation_notes": "Initial investigation shows indicators consistent with advanced persistent threat activity.",
            "resolution_summary": "Contained and remediated." if status in ["resolved", "closed"] else None,
            "priority": random.randint(1, 5),
            "assignee_name": random.choice(["Kavach Admin", "SOC Analyst", "Incident Responder", "Security Manager"]),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "resolved_at": datetime.now(timezone.utc).isoformat() if status in ["resolved", "closed"] else None,
        })
    return incidents

DEMO_INCIDENTS = _generate_incidents()

@router.get("/")
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    filtered = DEMO_INCIDENTS.copy()
    if status:
        filtered = [i for i in filtered if i["status"] == status]
    if severity:
        filtered = [i for i in filtered if i["severity"] == severity]
    total = len(filtered)
    start = (page - 1) * per_page
    return {"items": filtered[start:start + per_page], "total": total, "page": page, "per_page": per_page}

@router.get("/{incident_id}")
async def get_incident(incident_id: int, current_user: dict = Depends(get_current_user)):
    for i in DEMO_INCIDENTS:
        if i["id"] == incident_id:
            return i
    return {"error": "Not found"}

@router.post("/")
async def create_incident(data: IncidentCreate, current_user: dict = Depends(get_current_user)):
    new_id = len(DEMO_INCIDENTS) + 1
    return {"id": new_id, "message": "Incident created", "status": "open"}

@router.put("/{incident_id}")
async def update_incident(incident_id: int, data: IncidentUpdate, current_user: dict = Depends(get_current_user)):
    return {"id": incident_id, "message": "Incident updated"}

@router.post("/{incident_id}/escalate")
async def escalate_incident(incident_id: int, current_user: dict = Depends(get_current_user)):
    return {"id": incident_id, "message": "Incident escalated", "new_level": 2}

@router.get("/stats/summary")
async def incident_stats(current_user: dict = Depends(get_current_user)):
    return {
        "total": len(DEMO_INCIDENTS),
        "open": len([i for i in DEMO_INCIDENTS if i["status"] == "open"]),
        "investigating": len([i for i in DEMO_INCIDENTS if i["status"] == "investigating"]),
        "contained": len([i for i in DEMO_INCIDENTS if i["status"] == "contained"]),
        "resolved": len([i for i in DEMO_INCIDENTS if i["status"] == "resolved"]),
        "closed": len([i for i in DEMO_INCIDENTS if i["status"] == "closed"]),
    }
