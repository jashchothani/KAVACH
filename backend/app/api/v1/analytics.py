"""
KAVACH API - Analytics Routes
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from app.core.security import get_current_user
from app.schemas.schemas import DashboardStats
import random

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_stats(current_user: dict = Depends(get_current_user)):
    return DashboardStats(
        security_score=87.5,
        active_threats=23,
        protected_endpoints=156,
        open_incidents=8,
        ai_detections_today=42,
        soar_actions_today=15,
        critical_alerts=3,
        high_alerts=12,
        medium_alerts=28,
        low_alerts=45,
    )

@router.get("/trends")
async def get_trends(days: int = 30, current_user: dict = Depends(get_current_user)):
    threat_trends = []
    incident_trends = []
    score_trends = []
    base_date = datetime.now(timezone.utc) - timedelta(days=days)
    for i in range(days):
        date_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        threat_trends.append({"date": date_str, "value": random.randint(5, 35), "label": "Threats"})
        incident_trends.append({"date": date_str, "value": random.randint(1, 12), "label": "Incidents"})
        score_trends.append({"date": date_str, "value": round(random.uniform(78, 95), 1), "label": "Score"})
    return {
        "threat_trends": threat_trends,
        "incident_trends": incident_trends,
        "security_score_trend": score_trends,
        "threat_categories": {
            "Malware": 45, "Phishing": 32, "Brute Force": 28, "Ransomware": 15,
            "DDoS": 12, "SQL Injection": 8, "Data Exfiltration": 6, "Insider Threat": 4,
        },
        "endpoint_health": {
            "online": 142, "offline": 8, "isolated": 3, "compromised": 3,
        },
        "severity_distribution": {
            "critical": 8, "high": 22, "medium": 45, "low": 35,
        },
        "response_times": {
            "avg_detection": 2.3, "avg_response": 8.5, "avg_containment": 15.2, "avg_resolution": 48.7,
        },
    }

@router.get("/reports/export")
async def export_report(format: str = "pdf", current_user: dict = Depends(get_current_user)):
    return {"message": f"Report generated in {format} format", "download_url": f"/api/v1/analytics/reports/download/report.{format}"}
