"""
KAVACH API - MITRE ATT&CK Routes
"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter()

MITRE_TACTICS = [
    "Reconnaissance", "Resource Development", "Initial Access", "Execution",
    "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access",
    "Discovery", "Lateral Movement", "Collection", "Command and Control",
    "Exfiltration", "Impact"
]

MITRE_TECHNIQUES = [
    {"id": 1, "technique_id": "T1595", "tactic": "Reconnaissance", "name": "Active Scanning", "description": "Adversaries may execute active reconnaissance scans to gather information.", "sub_techniques": ["T1595.001", "T1595.002"], "detection_rule": "Monitor for abnormal scanning activity", "severity": "medium", "coverage_status": "full", "data_sources": ["Network Traffic"], "platforms": ["PRE"], "threat_count": 3},
    {"id": 2, "technique_id": "T1566", "tactic": "Initial Access", "name": "Phishing", "description": "Adversaries may send phishing messages to gain access.", "sub_techniques": ["T1566.001", "T1566.002", "T1566.003"], "detection_rule": "Email gateway analysis + URL detonation", "severity": "high", "coverage_status": "full", "data_sources": ["Email", "Network Traffic"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 12},
    {"id": 3, "technique_id": "T1059", "tactic": "Execution", "name": "Command and Scripting Interpreter", "description": "Adversaries may abuse command and script interpreters.", "sub_techniques": ["T1059.001", "T1059.003", "T1059.005"], "detection_rule": "Process monitoring + script block logging", "severity": "high", "coverage_status": "full", "data_sources": ["Process", "Command"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 8},
    {"id": 4, "technique_id": "T1053", "tactic": "Persistence", "name": "Scheduled Task/Job", "description": "Adversaries may abuse task scheduling functionality.", "sub_techniques": ["T1053.002", "T1053.005"], "detection_rule": "Task scheduler monitoring", "severity": "medium", "coverage_status": "partial", "data_sources": ["Process", "Scheduled Job"], "platforms": ["Windows", "Linux"], "threat_count": 5},
    {"id": 5, "technique_id": "T1548", "tactic": "Privilege Escalation", "name": "Abuse Elevation Control Mechanism", "description": "Adversaries may circumvent mechanisms designed to control elevate privileges.", "sub_techniques": ["T1548.001", "T1548.002"], "detection_rule": "UAC bypass detection + sudo abuse monitoring", "severity": "critical", "coverage_status": "partial", "data_sources": ["Process", "Command"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 4},
    {"id": 6, "technique_id": "T1070", "tactic": "Defense Evasion", "name": "Indicator Removal", "description": "Adversaries may delete or modify artifacts generated.", "sub_techniques": ["T1070.001", "T1070.004"], "detection_rule": "Log deletion monitoring + file system auditing", "severity": "high", "coverage_status": "full", "data_sources": ["File", "Process"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 6},
    {"id": 7, "technique_id": "T1003", "tactic": "Credential Access", "name": "OS Credential Dumping", "description": "Adversaries may attempt to dump credentials.", "sub_techniques": ["T1003.001", "T1003.002", "T1003.003"], "detection_rule": "LSASS access monitoring + registry hive detection", "severity": "critical", "coverage_status": "full", "data_sources": ["Process", "Windows Registry"], "platforms": ["Windows", "Linux"], "threat_count": 9},
    {"id": 8, "technique_id": "T1083", "tactic": "Discovery", "name": "File and Directory Discovery", "description": "Adversaries may enumerate files and directories.", "sub_techniques": [], "detection_rule": "Abnormal file enumeration patterns", "severity": "low", "coverage_status": "partial", "data_sources": ["Process", "Command"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 2},
    {"id": 9, "technique_id": "T1021", "tactic": "Lateral Movement", "name": "Remote Services", "description": "Adversaries may use valid accounts to log into a service for lateral movement.", "sub_techniques": ["T1021.001", "T1021.002", "T1021.004"], "detection_rule": "Remote login monitoring + anomalous RDP/SSH sessions", "severity": "high", "coverage_status": "full", "data_sources": ["Logon Session", "Network Traffic"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 7},
    {"id": 10, "technique_id": "T1071", "tactic": "Command and Control", "name": "Application Layer Protocol", "description": "Adversaries may communicate using application layer protocols.", "sub_techniques": ["T1071.001", "T1071.004"], "detection_rule": "DNS/HTTP anomaly detection + beaconing analysis", "severity": "high", "coverage_status": "partial", "data_sources": ["Network Traffic"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 5},
    {"id": 11, "technique_id": "T1041", "tactic": "Exfiltration", "name": "Exfiltration Over C2 Channel", "description": "Adversaries may steal data by exfiltrating it over an existing C2 channel.", "sub_techniques": [], "detection_rule": "Data volume anomaly detection on C2 channels", "severity": "critical", "coverage_status": "full", "data_sources": ["Network Traffic", "Command"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 3},
    {"id": 12, "technique_id": "T1486", "tactic": "Impact", "name": "Data Encrypted for Impact", "description": "Adversaries may encrypt data on target systems to interrupt availability.", "sub_techniques": [], "detection_rule": "Mass file encryption detection + canary file monitoring", "severity": "critical", "coverage_status": "full", "data_sources": ["File", "Process"], "platforms": ["Windows", "macOS", "Linux"], "threat_count": 6},
    {"id": 13, "technique_id": "T1190", "tactic": "Initial Access", "name": "Exploit Public-Facing Application", "description": "Adversaries may attempt to take advantage of a weakness in an Internet-facing application.", "sub_techniques": [], "detection_rule": "WAF log analysis + exploit signature detection", "severity": "critical", "coverage_status": "full", "data_sources": ["Application Log", "Network Traffic"], "platforms": ["Windows", "Linux"], "threat_count": 8},
    {"id": 14, "technique_id": "T1110", "tactic": "Credential Access", "name": "Brute Force", "description": "Adversaries may use brute force techniques to gain access.", "sub_techniques": ["T1110.001", "T1110.003", "T1110.004"], "detection_rule": "Failed login threshold + account lockout monitoring", "severity": "high", "coverage_status": "full", "data_sources": ["User Account", "Logon Session"], "platforms": ["Windows", "macOS", "Linux", "Cloud"], "threat_count": 11},
]


@router.get("/techniques")
async def list_techniques(current_user: dict = Depends(get_current_user)):
    return {"items": MITRE_TECHNIQUES, "total": len(MITRE_TECHNIQUES)}

@router.get("/tactics")
async def list_tactics(current_user: dict = Depends(get_current_user)):
    return {"tactics": MITRE_TACTICS}

@router.get("/techniques/{technique_id}")
async def get_technique(technique_id: int, current_user: dict = Depends(get_current_user)):
    for t in MITRE_TECHNIQUES:
        if t["id"] == technique_id:
            return t
    return {"error": "Not found"}

@router.get("/coverage")
async def get_coverage(current_user: dict = Depends(get_current_user)):
    total = len(MITRE_TECHNIQUES)
    full = len([t for t in MITRE_TECHNIQUES if t["coverage_status"] == "full"])
    partial = len([t for t in MITRE_TECHNIQUES if t["coverage_status"] == "partial"])
    none_cov = total - full - partial
    return {
        "total_techniques": total,
        "full_coverage": full,
        "partial_coverage": partial,
        "no_coverage": none_cov,
        "coverage_percentage": round((full + partial * 0.5) / total * 100, 1),
        "by_tactic": {t: {"total": len([x for x in MITRE_TECHNIQUES if x["tactic"] == t]),
                          "covered": len([x for x in MITRE_TECHNIQUES if x["tactic"] == t and x["coverage_status"] != "none"])}
                      for t in MITRE_TACTICS}
    }

@router.get("/matrix")
async def get_matrix(current_user: dict = Depends(get_current_user)):
    matrix = {}
    for tactic in MITRE_TACTICS:
        matrix[tactic] = [t for t in MITRE_TECHNIQUES if t["tactic"] == tactic]
    return {"matrix": matrix, "tactics": MITRE_TACTICS}
