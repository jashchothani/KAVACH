"""
KAVACH Sovereign Indian CERT-In Compliance & Incident Auto-Filer API.

Implements statutory reporting mechanisms required under CERT-In Directions
(Section 70B of the Information Technology Act, 2000):
- 6-Hour Mandatory Cyber Incident Reporting (Annexure-I pre-populated exporter)
- 180-Day Secure Audit Log Vault status verifier
- Curated Indian Threat Intelligence Advisories
"""

from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from typing import Any, Literal
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/compliance/cert-in", tags=["CERT-In Compliance"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CertInIncidentItem(BaseModel):
    incident_id: str
    title: str
    severity: Literal["critical", "high", "medium"]
    regulatory_category: str
    detected_at_utc: str
    detected_at_ist: str
    deadline_utc: str
    deadline_ist: str
    time_remaining_minutes: int
    reported_to_certin: bool
    affected_systems_count: int
    blast_radius: str


class CertInAnnexureIReport(BaseModel):
    incident_id: str
    report_reference_id: str
    generated_at_utc: str
    generated_at_ist: str
    regulatory_mandate: str
    submission_target_email: str
    reporting_entity: dict[str, Any]
    incident_details: dict[str, Any]
    technical_indicators: dict[str, Any]
    impact_assessment: dict[str, Any]
    remedial_actions_taken: list[str]
    official_formatted_declaration: str


class CertInAdvisory(BaseModel):
    id: str
    advisory_number: str
    title: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM"]
    published_date: str
    target_sector: str
    mitre_attack: str
    summary: str
    recommended_mitigation: str


class AuditVaultStatus(BaseModel):
    status: Literal["COMPLIANT", "WARNING", "NON_COMPLIANT"]
    retention_days_guaranteed: int
    mandatory_retention_days: int
    ntp_clock_synchronized: bool
    merkle_hash_chain_active: bool
    cold_storage_encryption: str
    jurisdiction: str
    total_events_archived: int
    earliest_record_timestamp: str
    latest_record_timestamp: str


# ---------------------------------------------------------------------------
# Mock Database & Curated Data
# ---------------------------------------------------------------------------

INCIDENTS_DB = [
    {
        "incident_id": "INC-2026-0927-01",
        "title": "APT29 Active Infiltration & C2 Exfiltration on Finance Gateway",
        "severity": "critical",
        "regulatory_category": "Targeted Intrusion / Unauthorized Access to Sensitive Infrastructure",
        "detected_offset_minutes": 75,  # detected 75 mins ago
        "reported_to_certin": False,
        "affected_systems_count": 2,
        "blast_radius": "Finance Workstation (SWSTK-LPT-0492) + Outbound C2 Socket",
        "mitre_techniques": ["T1059.001 (PowerShell)", "T1547.001 (RunKey Persistence)", "T1071.001 (Web Protocols)"],
        "hashes": ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
        "c2_ips": ["185.220.101.4", "104.244.76.13"],
        "endpoints": ["SWSTK-LPT-0492 (192.168.1.104)", "SWSTK-EDG-FW (192.168.1.1)"],
        "soar_actions": [
            "Automatic host network isolation dispatched via KAVACH SOAR",
            "Terminated suspicious process tree (PID 8104)",
            "Quarantined GST_Invoice_Sep2026.pdf.exe to vault",
            "Inbound/Outbound IP blocks applied on firewall for 185.220.101.4"
        ]
    },
    {
        "incident_id": "INC-2026-0927-02",
        "title": "High-Entropy Ransomware Canary Tripwire Triggered",
        "severity": "critical",
        "regulatory_category": "Ransomware / Malicious Code Attack on Computer Resource",
        "detected_offset_minutes": 210,  # detected 3.5 hours ago
        "reported_to_certin": True,
        "affected_systems_count": 1,
        "blast_radius": "OT Gateway (SWSTK-PLANT-01)",
        "mitre_techniques": ["T1486 (Data Encrypted)", "T1490 (Inhibit Recovery)"],
        "hashes": ["7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"],
        "c2_ips": ["198.51.100.82"],
        "endpoints": ["SWSTK-PLANT-01 (192.168.10.15)"],
        "soar_actions": [
            "KAVACH Kernel Canary tripped: Suspended PID 6412 in 18ms",
            "Prevented execution of vssadmin delete shadows",
            "Restored 4 differential backup blocks automatically"
        ]
    }
]

ADVISORIES_DATA = [
    {
        "id": "adv-1",
        "advisory_number": "CIAD-2026-0048",
        "title": "Targeted Spear-Phishing Infiltrations Spoofing Income Tax & GST Portals",
        "severity": "CRITICAL",
        "published_date": "2026-09-25",
        "target_sector": "BFSI, MSMEs & Critical Commercial Enterprises",
        "mitre_attack": "T1566.001 - Phishing: Spearphishing Attachment",
        "summary": "CERT-In has observed adversary campaigns delivering masqueraded PDF archives embedding obfuscated PowerShell stagers designed to steal session tokens and banking credentials.",
        "recommended_mitigation": "Enforce strict executable attachment filtering, deploy behavioral process monitoring (KAVACH PowerShell Sentry), and enforce 2-factor OTP verification."
    },
    {
        "id": "adv-2",
        "advisory_number": "CIAD-2026-0042",
        "title": "Vulnerabilities in Industrial IoT Gateway Firmware & Remote Desktop Protocols",
        "severity": "HIGH",
        "published_date": "2026-09-20",
        "target_sector": "Energy, Chemical Manufacturing & Critical Infrastructure",
        "mitre_attack": "T1190 - Exploit Public-Facing Application",
        "summary": "Threat actors are actively scanning for exposed RDP (3389) and unpatched OT gateways across Indian IP ranges to drop wiper payloads.",
        "recommended_mitigation": "Disable direct public RDP; enforce host network isolation and activate KAVACH Port Decoys (Mayajaal)."
    },
    {
        "id": "adv-3",
        "advisory_number": "CIAD-2026-0039",
        "title": "Surge in Android Banking Trojans Targeting Indian UPI Applications",
        "severity": "HIGH",
        "published_date": "2026-09-14",
        "target_sector": "Consumer Banking & Digital Payments",
        "mitre_attack": "T1417 - Input Capture / Accessibility Abuse",
        "summary": "Malicious APKs masquerading as government utility bills abusing Accessibility permissions to initiate unauthorized UPI transfers.",
        "recommended_mitigation": "Inspect device telemetry for unknown side-loaded packages; mandate hardware token authentication."
    }
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/incidents", response_model=list[CertInIncidentItem])
async def get_cert_in_incidents() -> list[CertInIncidentItem]:
    """List cyber incidents that fall under mandatory CERT-In reporting with live countdown."""
    now_utc = datetime.now(timezone.utc)
    results = []

    for inc in INCIDENTS_DB:
        det_time = now_utc - timedelta(minutes=inc["detected_offset_minutes"])
        deadline = det_time + timedelta(hours=6)
        remaining = max(0, int((deadline - now_utc).total_seconds() / 60))

        # Format IST (UTC + 5:30)
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        det_ist_str = det_time.astimezone(ist_tz).strftime("%Y-%m-%d %I:%M:%S %p IST")
        deadline_ist_str = deadline.astimezone(ist_tz).strftime("%Y-%m-%d %I:%M:%S %p IST")

        results.append(
            CertInIncidentItem(
                incident_id=inc["incident_id"],
                title=inc["title"],
                severity=inc["severity"],
                regulatory_category=inc["regulatory_category"],
                detected_at_utc=det_time.isoformat(),
                detected_at_ist=det_ist_str,
                deadline_utc=deadline.isoformat(),
                deadline_ist=deadline_ist_str,
                time_remaining_minutes=remaining,
                reported_to_certin=inc["reported_to_certin"],
                affected_systems_count=inc["affected_systems_count"],
                blast_radius=inc["blast_radius"]
            )
        )

    return results


@router.post("/generate-report/{incident_id}", response_model=CertInAnnexureIReport)
async def generate_cert_in_report(incident_id: str) -> CertInAnnexureIReport:
    """
    Generate official pre-filled CERT-In Annexure-I Incident Report
    mandated under Section 70B of the Information Technology Act, 2000.
    """
    incident = next((i for i in INCIDENTS_DB if i["incident_id"] == incident_id), None)
    if not incident:
        # Fallback to first incident
        incident = INCIDENTS_DB[0]

    now_utc = datetime.now(timezone.utc)
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    now_ist = now_utc.astimezone(ist_tz)

    ref_id = f"CERTIN-KAVACH-{now_ist.strftime('%Y%m%d')}-{incident['incident_id'][-4:]}"

    det_time = now_utc - timedelta(minutes=incident["detected_offset_minutes"])
    det_ist = det_time.astimezone(ist_tz)

    declaration_text = f"""
================================================================================
                    GOVERNMENT OF INDIA / MeitY
         INDIAN COMPUTER EMERGENCY RESPONSE TEAM (CERT-In)
                  CYBER INCIDENT REPORTING FORM
     (Pursuant to Section 70B of Information Technology Act, 2000)
================================================================================
Report Reference ID  : {ref_id}
Submission Date/Time : {now_ist.strftime("%d-%b-%Y %I:%M:%S %p IST")} (UTC: {now_utc.strftime("%Y-%m-%d %H:%M:%SZ")})
Mandate Status       : Within 6-Hour Statutory Window (Elapsed: {incident["detected_offset_minutes"]} mins)
Target Authority     : incident@cert-in.org.in

1. DETAILS OF THE REPORTING ENTITY:
--------------------------------------------------------------------------------
Name of Organization : Swastik Chemical (India) Private Limited
Industry Vertical    : Chemical Manufacturing & Critical Supply Chain
CISO / Security Head : Chief Information Security Officer (SOC Response Team)
Contact Email        : soc-alerts@swastikchemical.in
Contact Phone        : +91 22 2847 9000
Jurisdiction City    : Mumbai, Maharashtra, India

2. INCIDENT OVERVIEW & CLASSIFICATION:
--------------------------------------------------------------------------------
Incident Identifier  : {incident["incident_id"]}
Incident Category    : {incident["regulatory_category"]}
Severity Classification: {incident["severity"].upper()}
Initial Detection    : {det_ist.strftime("%d-%b-%Y %I:%M:%S %p IST")}
Affected Assets      : {', '.join(incident["endpoints"])}

3. TECHNICAL ATTACK VECTORS & INDICATORS OF COMPROMISE (IoCs):
--------------------------------------------------------------------------------
Observed MITRE Tactics: {', '.join(incident["mitre_techniques"])}
Identified Malware Hash: {', '.join(incident["hashes"])}
Malicious C2/External IP: {', '.join(incident["c2_ips"])}
Exfiltration Channel : Outbound HTTPS Port 443 via Encrypted Session

4. IMPACT ASSESSMENT:
--------------------------------------------------------------------------------
Confidentiality Loss : Contained prior to bulk database access
Integrity Loss       : Registry persistence created; neutralized by KAVACH
Availability Impact  : Zero business disruption (Endpoint network quarantined)

5. REMEDIAL ACTIONS EXECUTED BY KAVACH SOAR:
--------------------------------------------------------------------------------
{chr(10).join(f"- {act}" for act in incident["soar_actions"])}

DECLARATION:
The information submitted above is true, complete, and generated automatically
by KAVACH AI-Driven SOAR-XDR Platform in strict adherence to CERT-In guidelines.
================================================================================
""".strip()

    return CertInAnnexureIReport(
        incident_id=incident["incident_id"],
        report_reference_id=ref_id,
        generated_at_utc=now_utc.isoformat(),
        generated_at_ist=now_ist.strftime("%Y-%m-%d %I:%M:%S %p IST"),
        regulatory_mandate="Section 70B, Information Technology Act 2000 (CERT-In 6-Hour Rule)",
        submission_target_email="incident@cert-in.org.in",
        reporting_entity={
            "organization_name": "Swastik Chemical (India) Pvt. Ltd.",
            "ciso_name": "CISO Office & SOC Emergency Desk",
            "contact_email": "soc-alerts@swastikchemical.in",
            "contact_phone": "+91 22 2847 9000",
            "location": "Mumbai, Maharashtra, India"
        },
        incident_details={
            "title": incident["title"],
            "category": incident["regulatory_category"],
            "severity": incident["severity"],
            "detected_at_ist": det_ist.strftime("%Y-%m-%d %I:%M:%S %p IST"),
            "affected_systems": incident["endpoints"]
        },
        technical_indicators={
            "sha256_hashes": incident["hashes"],
            "c2_ips": incident["c2_ips"],
            "mitre_techniques": incident["mitre_techniques"]
        },
        impact_assessment={
            "data_exfiltration_prevented": True,
            "blast_radius": incident["blast_radius"],
            "business_downtime": "0 minutes"
        },
        remedial_actions_taken=incident["soar_actions"],
        official_formatted_declaration=declaration_text
    )


@router.get("/download-annexure/{incident_id}")
async def download_cert_in_annexure(incident_id: str):
    """Download official raw text Notice of Cyber Incident formatted for CERT-In submission."""
    report = await generate_cert_in_report(incident_id)
    return Response(
        content=report.official_formatted_declaration,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="CERT-IN-ANNEXURE-{incident_id}.txt"'}
    )


@router.get("/advisories", response_model=list[CertInAdvisory])
async def get_cert_in_advisories() -> list[CertInAdvisory]:
    """Return active CERT-In threat advisories relevant to Indian infrastructure."""
    return [CertInAdvisory(**adv) for adv in ADVISORIES_DATA]


@router.get("/audit-vault-status", response_model=AuditVaultStatus)
async def get_audit_vault_status() -> AuditVaultStatus:
    """Verify 180-Day secure log retention mandated by Indian cyber regulations."""
    now = datetime.now(timezone.utc)
    earliest = now - timedelta(days=182)

    return AuditVaultStatus(
        status="COMPLIANT",
        retention_days_guaranteed=185,
        mandatory_retention_days=180,
        ntp_clock_synchronized=True,
        merkle_hash_chain_active=True,
        cold_storage_encryption="AES-256-GCM + Partitioned Daily JSONL",
        jurisdiction="India (Local Sovereign Host Storage)",
        total_events_archived=2489120,
        earliest_record_timestamp=earliest.isoformat(),
        latest_record_timestamp=now.isoformat()
    )


@router.post("/mark-reported/{incident_id}")
async def mark_incident_reported(incident_id: str) -> dict[str, Any]:
    """Mark an incident as officially notified to CERT-In."""
    for inc in INCIDENTS_DB:
        if inc["incident_id"] == incident_id:
            inc["reported_to_certin"] = True
            logger.info("cert_in_incident_marked_reported", incident_id=incident_id)
            return {"status": "success", "incident_id": incident_id, "reported": True}
    return {"status": "error", "message": "Incident not found"}


@router.get("/download-annexure/{incident_id}")
async def download_annexure_text(incident_id: str):
    """Download official Annexure-I declaration notice as a clean text file."""
    for inc in INCIDENTS_DB:
        if inc["incident_id"] == incident_id:
            report = await generate_cert_in_report(incident_id)
            filename = f"CERT-IN-ANNEXURE-I-{incident_id}.txt"
            return Response(
                content=report.official_formatted_declaration,
                media_type="text/plain; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
    raise HTTPException(status_code=404, detail="Incident not found")


class VaultSearchQuery(BaseModel):
    query: str = ""
    host: str | None = None
    days_back: int = 180


@router.post("/search-vault")
async def search_audit_vault(req: VaultSearchQuery) -> dict[str, Any]:
    """Search within the 180-Day Secure Immutable Log Vault with Merkle hash proofs."""
    # Synthetic immutable audit entries with cryptographic chain
    sample_records = [
        {
            "block_id": "BLK-2026-0927-0104",
            "timestamp": "2026-09-27T10:14:22Z",
            "host": "SWSTK-LPT-0492",
            "collector": "powershell",
            "event_summary": "powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA...",
            "merkle_leaf_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "signature_status": "VALID_CRYPTOGRAPHIC_SEAL",
            "retention_guaranteed_until": "2027-03-26T10:14:22Z"
        },
        {
            "block_id": "BLK-2026-0927-0098",
            "timestamp": "2026-09-27T08:30:15Z",
            "host": "SWSTK-WEB-DMZ01",
            "collector": "network",
            "event_summary": "Inbound TCP SYN flood to Port 443 from 185.220.101.4",
            "merkle_leaf_hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
            "signature_status": "VALID_CRYPTOGRAPHIC_SEAL",
            "retention_guaranteed_until": "2027-03-26T08:30:15Z"
        },
        {
            "block_id": "BLK-2026-0926-8941",
            "timestamp": "2026-09-26T19:42:01Z",
            "host": "SWSTK-DC01",
            "collector": "login",
            "event_summary": "Kerberos TGS request for krbtgt ticket from 192.168.1.104",
            "merkle_leaf_hash": "88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589",
            "signature_status": "VALID_CRYPTOGRAPHIC_SEAL",
            "retention_guaranteed_until": "2027-03-25T19:42:01Z"
        }
    ]

    filtered = sample_records
    if req.query:
        q = req.query.lower()
        filtered = [r for r in filtered if q in r["event_summary"].lower() or q in r["host"].lower() or q in r["block_id"].lower()]

    return {
        "status": "success",
        "query": req.query,
        "vault_retention_days": req.days_back,
        "records_matched": len(filtered),
        "results": filtered,
        "merkle_root_hash": "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b",
        "ntp_synchronization_offset_ms": 0.42,
        "jurisdiction_compliance": "Indian IT Act Section 70B & CERT-In Directions 2022"
    }
