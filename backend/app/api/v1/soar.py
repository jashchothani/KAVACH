"""
KAVACH API - SOAR Orchestration Routes
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.core.security import get_current_user, require_permission
from app.schemas.schemas import PlaybookResponse, PlaybookExecuteRequest

router = APIRouter()

DEMO_PLAYBOOKS = [
    {"id": 1, "name": "Host Isolation", "playbook_type": "containment", "description": "Immediately isolate a compromised host from the network to prevent lateral movement.", "steps": [{"order": 1, "action": "Disable network interfaces"}, {"order": 2, "action": "Block firewall rules"}, {"order": 3, "action": "Notify SOC team"}, {"order": 4, "action": "Create incident ticket"}], "status": "ready", "approval_required": True, "last_executed": "2024-07-20T10:30:00Z", "execution_count": 23, "avg_execution_time": 4.2, "tags": ["containment", "network"], "created_at": "2024-01-15T00:00:00Z"},
    {"id": 2, "name": "Process Termination", "playbook_type": "response", "description": "Kill malicious processes and clean up related artifacts.", "steps": [{"order": 1, "action": "Identify malicious PID"}, {"order": 2, "action": "Terminate process tree"}, {"order": 3, "action": "Remove persistence mechanisms"}, {"order": 4, "action": "Scan for remaining artifacts"}], "status": "ready", "approval_required": False, "last_executed": "2024-07-22T14:00:00Z", "execution_count": 45, "avg_execution_time": 2.1, "tags": ["response", "endpoint"], "created_at": "2024-01-15T00:00:00Z"},
    {"id": 3, "name": "Account Lockdown", "playbook_type": "containment", "description": "Lock compromised user accounts and force credential reset.", "steps": [{"order": 1, "action": "Disable AD account"}, {"order": 2, "action": "Revoke active sessions"}, {"order": 3, "action": "Reset credentials"}, {"order": 4, "action": "Enable MFA"}, {"order": 5, "action": "Notify user"}], "status": "ready", "approval_required": True, "last_executed": "2024-07-19T08:00:00Z", "execution_count": 18, "avg_execution_time": 3.5, "tags": ["containment", "identity"], "created_at": "2024-02-01T00:00:00Z"},
    {"id": 4, "name": "File Quarantine", "playbook_type": "response", "description": "Quarantine suspicious files and submit for analysis.", "steps": [{"order": 1, "action": "Move file to quarantine"}, {"order": 2, "action": "Calculate file hashes"}, {"order": 3, "action": "Submit to sandbox"}, {"order": 4, "action": "Update threat intelligence"}], "status": "ready", "approval_required": False, "last_executed": "2024-07-21T16:30:00Z", "execution_count": 67, "avg_execution_time": 5.8, "tags": ["response", "malware"], "created_at": "2024-02-15T00:00:00Z"},
    {"id": 5, "name": "Phishing Response", "playbook_type": "investigation", "description": "Automated phishing email investigation and remediation.", "steps": [{"order": 1, "action": "Extract email headers & URLs"}, {"order": 2, "action": "Scan URLs in sandbox"}, {"order": 3, "action": "Check sender reputation"}, {"order": 4, "action": "Remove from all mailboxes"}, {"order": 5, "action": "Block sender domain"}, {"order": 6, "action": "Notify affected users"}], "status": "ready", "approval_required": True, "last_executed": "2024-07-23T09:00:00Z", "execution_count": 34, "avg_execution_time": 8.3, "tags": ["investigation", "phishing"], "created_at": "2024-03-01T00:00:00Z"},
    {"id": 6, "name": "Deepfake Response", "playbook_type": "investigation", "description": "Analyze and respond to suspected deepfake content.", "steps": [{"order": 1, "action": "Collect media samples"}, {"order": 2, "action": "Run AI deepfake detection"}, {"order": 3, "action": "Generate forensic report"}, {"order": 4, "action": "Notify legal team"}, {"order": 5, "action": "Block distribution channels"}], "status": "ready", "approval_required": True, "last_executed": "2024-07-18T12:00:00Z", "execution_count": 5, "avg_execution_time": 15.2, "tags": ["investigation", "ai", "deepfake"], "created_at": "2024-04-01T00:00:00Z"},
    {"id": 7, "name": "Vishing Response", "playbook_type": "investigation", "description": "Analyze voice phishing attempts and take protective action.", "steps": [{"order": 1, "action": "Record call metadata"}, {"order": 2, "action": "Run voice analysis"}, {"order": 3, "action": "Check caller reputation"}, {"order": 4, "action": "Block phone number"}, {"order": 5, "action": "Alert targeted employees"}], "status": "ready", "approval_required": True, "last_executed": "2024-07-17T15:30:00Z", "execution_count": 8, "avg_execution_time": 6.7, "tags": ["investigation", "ai", "vishing"], "created_at": "2024-04-15T00:00:00Z"},
]


@router.get("/playbooks")
async def list_playbooks(current_user: dict = Depends(get_current_user)):
    return {"items": DEMO_PLAYBOOKS, "total": len(DEMO_PLAYBOOKS)}

@router.get("/playbooks/{playbook_id}")
async def get_playbook(playbook_id: int, current_user: dict = Depends(get_current_user)):
    for p in DEMO_PLAYBOOKS:
        if p["id"] == playbook_id:
            return p
    return {"error": "Not found"}

@router.post("/playbooks/execute")
async def execute_playbook(req: PlaybookExecuteRequest, current_user: dict = Depends(require_permission("playbooks:execute"))):
    return {"message": "Playbook execution started", "playbook_id": req.playbook_id, "execution_id": "exec-001", "status": "running"}

@router.post("/playbooks/{playbook_id}/rollback")
async def rollback_playbook(playbook_id: int, current_user: dict = Depends(require_permission("playbooks:execute"))):
    return {"message": "Playbook rolled back", "playbook_id": playbook_id, "status": "rolled_back"}

@router.post("/playbooks/{playbook_id}/approve")
async def approve_playbook(playbook_id: int, current_user: dict = Depends(require_permission("playbooks:approve"))):
    return {"message": "Playbook approved", "playbook_id": playbook_id, "approved_by": current_user["name"]}

@router.get("/stats")
async def soar_stats(current_user: dict = Depends(get_current_user)):
    return {
        "total_playbooks": len(DEMO_PLAYBOOKS),
        "total_executions": sum(p["execution_count"] for p in DEMO_PLAYBOOKS),
        "avg_response_time": round(sum(p["avg_execution_time"] for p in DEMO_PLAYBOOKS) / len(DEMO_PLAYBOOKS), 1),
        "executions_today": 7,
        "successful_today": 6,
        "pending_approval": 2,
    }
