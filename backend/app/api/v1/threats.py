"""
KAVACH API - Threat Detection Routes
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from app.core.security import get_current_user, require_permission
from app.schemas.schemas import ThreatResponse, ThreatCreate, ThreatListResponse
import random

router = APIRouter()

# Demo threat data
THREAT_TYPES = ["Malware", "Ransomware", "Phishing", "Brute Force", "DDoS", "SQL Injection", 
                "XSS", "Credential Theft", "Lateral Movement", "Data Exfiltration",
                "Zero-Day Exploit", "Supply Chain Attack", "Insider Threat", "APT"]

MITRE_MAPPINGS = {
    "Malware": "T1059 - Command and Scripting Interpreter",
    "Ransomware": "T1486 - Data Encrypted for Impact",
    "Phishing": "T1566 - Phishing",
    "Brute Force": "T1110 - Brute Force",
    "DDoS": "T1498 - Network Denial of Service",
    "SQL Injection": "T1190 - Exploit Public-Facing Application",
    "XSS": "T1189 - Drive-by Compromise",
    "Credential Theft": "T1003 - OS Credential Dumping",
    "Lateral Movement": "T1021 - Remote Services",
    "Data Exfiltration": "T1041 - Exfiltration Over C2 Channel",
    "Zero-Day Exploit": "T1203 - Exploitation for Client Execution",
    "Supply Chain Attack": "T1195 - Supply Chain Compromise",
    "Insider Threat": "T1078 - Valid Accounts",
    "APT": "T1071 - Application Layer Protocol",
}

def _generate_threats(count: int = 50) -> list:
    threats = []
    severities = ["critical", "high", "medium", "low"]
    statuses = ["active", "investigating", "contained", "resolved"]
    endpoints = [
        ("PROD-WEB-01", "192.168.1.10"), ("PROD-DB-02", "192.168.1.20"),
        ("DEV-APP-03", "192.168.2.15"), ("HR-WS-04", "10.0.1.50"),
        ("FIN-SRV-05", "10.0.2.30"), ("MFG-PLC-06", "172.16.0.100"),
        ("CHEM-IOT-07", "172.16.1.25"), ("ADMIN-WS-08", "10.0.1.100"),
    ]
    for i in range(count):
        t_type = random.choice(THREAT_TYPES)
        severity = random.choices(severities, weights=[10, 25, 40, 25])[0]
        ep = random.choice(endpoints)
        threats.append({
            "id": i + 1,
            "name": f"{t_type} detected on {ep[0]}",
            "threat_type": t_type,
            "severity": severity,
            "status": random.choice(statuses),
            "description": f"Automated detection of {t_type.lower()} activity on endpoint {ep[0]} ({ep[1]}). AI confidence analysis indicates potential threat requiring investigation.",
            "source": random.choice(["EDR Agent", "Network IDS", "SIEM", "AI Engine", "User Report"]),
            "confidence_score": round(random.uniform(0.6, 0.99), 2),
            "mitre_technique_id": i % 14 + 1,
            "endpoint_id": (i % 8) + 1,
            "ai_analysis": {
                "classification": t_type,
                "confidence": round(random.uniform(0.7, 0.99), 2),
                "indicators": random.randint(2, 8),
                "recommendation": random.choice(["Isolate host", "Block IP", "Alert SOC", "Auto-remediate"]),
            },
            "response_action": random.choice(["Isolate Host", "Block Source IP", "Kill Process", "Quarantine File", "Alert Only"]),
            "ioc_data": {"type": random.choice(["ip", "hash", "domain"]), "value": f"indicator_{i}"},
            "detected_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 72))).isoformat(),
            "resolved_at": None,
            "mitre_technique_name": MITRE_MAPPINGS.get(t_type, "T1059 - Command Line"),
            "endpoint_hostname": ep[0],
        })
    return threats

DEMO_THREATS = _generate_threats(50)


@router.get("/", response_model=ThreatListResponse)
async def list_threats(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    threat_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    filtered = DEMO_THREATS.copy()
    if severity:
        filtered = [t for t in filtered if t["severity"] == severity]
    if status:
        filtered = [t for t in filtered if t["status"] == status]
    if threat_type:
        filtered = [t for t in filtered if t["threat_type"] == threat_type]
    if search:
        filtered = [t for t in filtered if search.lower() in t["name"].lower()]
    
    total = len(filtered)
    start = (page - 1) * per_page
    items = filtered[start:start + per_page]
    
    return ThreatListResponse(
        items=[ThreatResponse(**t) for t in items],
        total=total, page=page, per_page=per_page
    )


@router.get("/{threat_id}", response_model=ThreatResponse)
async def get_threat(threat_id: int, current_user: dict = Depends(get_current_user)):
    for t in DEMO_THREATS:
        if t["id"] == threat_id:
            return ThreatResponse(**t)
    return {"error": "Threat not found"}


@router.get("/stats/summary")
async def threat_stats(current_user: dict = Depends(get_current_user)):
    return {
        "total": len(DEMO_THREATS),
        "critical": len([t for t in DEMO_THREATS if t["severity"] == "critical"]),
        "high": len([t for t in DEMO_THREATS if t["severity"] == "high"]),
        "medium": len([t for t in DEMO_THREATS if t["severity"] == "medium"]),
        "low": len([t for t in DEMO_THREATS if t["severity"] == "low"]),
        "active": len([t for t in DEMO_THREATS if t["status"] == "active"]),
        "investigating": len([t for t in DEMO_THREATS if t["status"] == "investigating"]),
        "contained": len([t for t in DEMO_THREATS if t["status"] == "contained"]),
        "resolved": len([t for t in DEMO_THREATS if t["status"] == "resolved"]),
    }
