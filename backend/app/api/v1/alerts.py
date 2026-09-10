"""
KAVACH API - Alert Routes
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.core.security import get_current_user
from app.schemas.schemas import AlertResponse, AlertBulkAction
import random

router = APIRouter()

def _generate_alerts():
    categories = ["threat", "incident", "ai", "soar", "system"]
    severities = ["critical", "high", "medium", "low"]
    alerts = []
    messages = [
        ("Critical Ransomware Detected", "Ransomware activity detected on PROD-WEB-01. Immediate action required.", "threat", "critical"),
        ("Phishing Campaign Active", "Multiple phishing emails detected targeting finance department.", "threat", "high"),
        ("Brute Force Attempt", "Failed login attempts exceeding threshold on VPN gateway.", "threat", "high"),
        ("Incident Escalated", "INC-007 has been escalated to Level 3. Security Manager review required.", "incident", "critical"),
        ("Incident Assigned", "INC-012 assigned to SOC Analyst for investigation.", "incident", "medium"),
        ("Deepfake Detected", "AI model detected deepfake content with 94.7% confidence.", "ai", "high"),
        ("Vishing Attempt", "Suspicious voice call pattern detected. Fraud probability: 87%.", "ai", "high"),
        ("Phishing URL Blocked", "Malicious URL blocked by AI phishing scanner.", "ai", "medium"),
        ("Host Isolated", "SOAR playbook executed: Host PROD-DB-02 isolated successfully.", "soar", "high"),
        ("Playbook Pending Approval", "Account Lockdown playbook requires manager approval.", "soar", "medium"),
        ("Process Terminated", "Malicious process terminated on DEV-APP-03.", "soar", "medium"),
        ("System Update Available", "KAVACH agent update v2.5.1 available for deployment.", "system", "low"),
        ("Database Backup Complete", "Scheduled PostgreSQL backup completed successfully.", "system", "low"),
        ("Lateral Movement Detected", "Suspicious lateral movement from HR-WS-04 to FIN-SRV-05.", "threat", "critical"),
        ("Data Exfiltration Alert", "Unusual data transfer volume detected on CHEM-IOT-07.", "threat", "critical"),
        ("New IOC Matched", "IP 203.0.113.42 matched known APT group infrastructure.", "threat", "high"),
        ("Incident Resolved", "INC-003 resolved. Root cause: compromised service account.", "incident", "medium"),
        ("AI Model Updated", "Deepfake detection model updated to v3.2.", "ai", "low"),
        ("Playbook Rollback", "File Quarantine playbook rolled back on FIN-SRV-05.", "soar", "medium"),
        ("Certificate Expiring", "SSL certificate for portal.swastikchem.com expires in 7 days.", "system", "medium"),
    ]
    for i, (title, message, category, severity) in enumerate(messages):
        alerts.append({
            "id": i + 1, "title": title, "message": message, "category": category,
            "severity": severity, "is_read": random.choice([True, False]),
            "threat_id": random.randint(1, 50) if category == "threat" else None,
            "source": random.choice(["EDR", "SIEM", "AI Engine", "SOAR", "System"]),
            "metadata": {}, "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48))).isoformat(),
        })
    return alerts

DEMO_ALERTS = _generate_alerts()

@router.get("/")
async def list_alerts(
    category: Optional[str] = None, severity: Optional[str] = None,
    is_read: Optional[bool] = None, search: Optional[str] = None,
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    filtered = DEMO_ALERTS.copy()
    if category: filtered = [a for a in filtered if a["category"] == category]
    if severity: filtered = [a for a in filtered if a["severity"] == severity]
    if is_read is not None: filtered = [a for a in filtered if a["is_read"] == is_read]
    if search: filtered = [a for a in filtered if search.lower() in a["title"].lower() or search.lower() in a["message"].lower()]
    total = len(filtered)
    start = (page - 1) * per_page
    return {"items": filtered[start:start + per_page], "total": total, "page": page, "per_page": per_page}

@router.put("/{alert_id}/read")
async def mark_read(alert_id: int, current_user: dict = Depends(get_current_user)):
    return {"id": alert_id, "is_read": True}

@router.post("/bulk-action")
async def bulk_action(action: AlertBulkAction, current_user: dict = Depends(get_current_user)):
    return {"message": f"Bulk action '{action.action}' applied to {len(action.alert_ids)} alerts"}

@router.get("/stats")
async def alert_stats(current_user: dict = Depends(get_current_user)):
    return {
        "total": len(DEMO_ALERTS), "unread": len([a for a in DEMO_ALERTS if not a["is_read"]]),
        "by_category": {cat: len([a for a in DEMO_ALERTS if a["category"] == cat]) for cat in ["threat", "incident", "ai", "soar", "system"]},
        "by_severity": {sev: len([a for a in DEMO_ALERTS if a["severity"] == sev]) for sev in ["critical", "high", "medium", "low"]},
    }
