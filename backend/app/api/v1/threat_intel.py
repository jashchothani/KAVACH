"""
KAVACH API - Threat Intelligence Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from app.core.security import get_current_user
from app.schemas.schemas import IOCSearchRequest, ThreatIntelResponse
import random

router = APIRouter()

DEMO_IOCS = [
    {"id": 1, "ioc_type": "ip", "ioc_value": "185.220.101.5", "source": "VirusTotal", "reputation_score": 85.0, "tags": ["tor", "exit-node", "scanner"], "context": {"asn": "AS20001", "country": "Germany", "carrier": "Tor Exit Node Provider"}, "is_malicious": True, "first_seen": "2024-01-10T12:00:00Z", "last_seen": "2024-07-24T08:00:00Z"},
    {"id": 2, "ioc_type": "ip", "ioc_value": "45.143.203.14", "source": "MISP", "reputation_score": 92.5, "tags": ["apt29", "c2", "brute-force"], "context": {"asn": "AS48003", "country": "Russia", "carrier": "Hosting Provider"}, "is_malicious": True, "first_seen": "2024-03-15T09:30:00Z", "last_seen": "2024-07-24T06:15:00Z"},
    {"id": 3, "ioc_type": "domain", "ioc_value": "update.microsoft-security-portal.com", "source": "Internal Intelligence", "reputation_score": 98.0, "tags": ["phishing", "impersonation", "apt"], "context": {"registrar": "NameCheap", "creation_date": "2024-07-01", "ip_resolved": "193.109.112.5"}, "is_malicious": True, "first_seen": "2024-07-02T10:00:00Z", "last_seen": "2024-07-23T22:30:00Z"},
    {"id": 4, "ioc_type": "url", "ioc_value": "http://secure-login-swastikchem.co/auth/login.php", "source": "VirusTotal", "reputation_score": 96.2, "tags": ["phishing", "swastik-credential-harvesting"], "context": {"ip": "103.224.212.42", "response_code": 200}, "is_malicious": True, "first_seen": "2024-07-20T11:00:00Z", "last_seen": "2024-07-24T04:10:00Z"},
    {"id": 5, "ioc_type": "hash", "ioc_value": "d2e4f58c7391bcf892e850b100913801f464010372df03d7b8ac0f64c6bc9c6e", "source": "MISP", "reputation_score": 100.0, "tags": ["lockbit3", "ransomware", "pe32"], "context": {"file_type": "Win32 EXE", "file_size": 245312, "signature": "LockBit 3.0 Ransomware"}, "is_malicious": True, "first_seen": "2024-05-18T14:20:00Z", "last_seen": "2024-07-22T19:40:00Z"},
    {"id": 6, "ioc_type": "ip", "ioc_value": "8.8.8.8", "source": "VirusTotal", "reputation_score": 0.0, "tags": ["dns", "google-public-dns"], "context": {"asn": "AS15169", "country": "United States", "owner": "Google LLC"}, "is_malicious": False, "first_seen": "2010-01-01T00:00:00Z", "last_seen": "2024-07-24T09:00:00Z"},
]

@router.post("/ioc/search", response_model=ThreatIntelResponse)
async def search_ioc(request: IOCSearchRequest, current_user: dict = Depends(get_current_user)):
    # Search in our demo dataset
    for ioc in DEMO_IOCS:
        if ioc["ioc_type"] == request.ioc_type and ioc["ioc_value"].lower() == request.ioc_value.strip().lower():
            return ThreatIntelResponse(
                id=ioc["id"],
                ioc_type=ioc["ioc_type"],
                ioc_value=ioc["ioc_value"],
                source=ioc["source"],
                reputation_score=ioc["reputation_score"],
                tags=ioc["tags"],
                context=ioc["context"],
                is_malicious=ioc["is_malicious"],
                first_seen=datetime.fromisoformat(ioc["first_seen"].replace("Z", "+00:00")),
                last_seen=datetime.fromisoformat(ioc["last_seen"].replace("Z", "+00:00")),
            )
            
    # Mock dynamic search if not found in list (e.g. VirusTotal integration fallback)
    is_mal = random.choice([True, False])
    rep = round(random.uniform(60, 99), 1) if is_mal else 0.0
    new_ioc = {
        "id": len(DEMO_IOCS) + 1,
        "ioc_type": request.ioc_type,
        "ioc_value": request.ioc_value,
        "source": "VirusTotal/MISP Integration",
        "reputation_score": rep,
        "tags": ["dynamically-queried", "unknown-threat"] if is_mal else ["clean"],
        "context": {"queried_at": datetime.now(timezone.utc).isoformat(), "info": "Queried dynamically from integrated open-source intelligence sources."},
        "is_malicious": is_mal,
        "first_seen": datetime.now(timezone.utc) - timedelta(days=7),
        "last_seen": datetime.now(timezone.utc)
    }
    return ThreatIntelResponse(**new_ioc)

@router.get("/iocs")
async def list_iocs(
    ioc_type: Optional[str] = None,
    is_malicious: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    filtered = DEMO_IOCS.copy()
    if ioc_type:
        filtered = [i for i in filtered if i["ioc_type"] == ioc_type]
    if is_malicious is not None:
        filtered = [i for i in filtered if i["is_malicious"] == is_malicious]
        
    total = len(filtered)
    start = (page - 1) * per_page
    items = filtered[start:start+per_page]
    return {"items": items, "total": total}

@router.post("/ioc/correlate")
async def correlate_ioc(request: IOCSearchRequest, current_user: dict = Depends(get_current_user)):
    # Returns correlated logs, endpoints, or alerts
    return {
        "ioc": request.ioc_value,
        "type": request.ioc_type,
        "correlation_count": random.randint(0, 5),
        "correlated_events": [
            {
                "event_id": f"event-{random.randint(1000, 9999)}",
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24))).isoformat(),
                "endpoint": f"PROD-WS-{random.randint(1,10)}",
                "action": "Outbound Connection Blocked",
                "details": f"Attempted connection to malicious IOC {request.ioc_value} detected and terminated."
            } for _ in range(random.randint(1, 3))
        ] if random.choice([True, False]) else []
    }
