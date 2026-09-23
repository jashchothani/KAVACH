"""
KAVACH SOAR Playbook Engine.

Defines and executes response playbooks with:
- Automatic / Manual / Approval-required modes
- Rollback support for every action
- Full audit trail
- Dry-run capability
"""

from __future__ import annotations

import asyncio
import os
import subprocess
from datetime import datetime, timezone
from typing import Any

from core.config import get_settings
from core.constants import PlaybookStatus, ResponseMode, Severity
from core.exceptions import PlaybookExecutionError, RollbackError
from core.logging import get_logger
from database.engine import get_session
from database.repositories import PlaybookExecutionRepository, AuditLogRepository, AlertRepository

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Playbook Action Base
# ---------------------------------------------------------------------------

class PlaybookAction:
    """Base class for a reversible playbook action."""

    name: str = "base_action"
    description: str = ""
    reversible: bool = True

    async def execute(self, params: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        """Execute the action. Returns result dict with rollback_data."""
        raise NotImplementedError

    async def rollback(self, rollback_data: dict[str, Any]) -> dict[str, Any]:
        """Reverse the action using stored rollback data."""
        raise NotImplementedError


class BlockIPAction(PlaybookAction):
    name = "block_ip"
    description = "Block an IP address via Windows Firewall"

    async def execute(self, params: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        ip = params.get("ip", "")
        rule_name = f"KAVACH_Block_{ip.replace('.', '_')}"
        if dry_run:
            return {"action": "block_ip", "ip": ip, "dry_run": True, "rule_name": rule_name}

        try:
            result = subprocess.run(
                ["netsh", "advfirewall", "firewall", "add", "rule",
                 f"name={rule_name}", "dir=in", "action=block", f"remoteip={ip}"],
                capture_output=True, text=True, timeout=30,
            )
            success = result.returncode == 0
            return {
                "action": "block_ip", "ip": ip, "success": success,
                "rule_name": rule_name, "output": result.stdout[:500],
                "rollback_data": {"rule_name": rule_name} if success else None,
            }
        except Exception as exc:
            raise PlaybookExecutionError(f"Failed to block IP {ip}: {exc}")

    async def rollback(self, rollback_data: dict[str, Any]) -> dict[str, Any]:
        rule_name = rollback_data.get("rule_name", "")
        try:
            result = subprocess.run(
                ["netsh", "advfirewall", "firewall", "delete", "rule", f"name={rule_name}"],
                capture_output=True, text=True, timeout=30,
            )
            return {"action": "unblock_ip", "rule_name": rule_name, "success": result.returncode == 0}
        except Exception as exc:
            raise RollbackError(f"Failed to remove firewall rule: {exc}")


class KillProcessAction(PlaybookAction):
    name = "kill_process"
    description = "Terminate a running process"
    reversible = False

    async def execute(self, params: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        pid = params.get("pid", 0)
        if dry_run:
            return {"action": "kill_process", "pid": pid, "dry_run": True}

        try:
            import psutil
            proc = psutil.Process(pid)
            proc_name = proc.name()
            proc.terminate()
            return {"action": "kill_process", "pid": pid, "name": proc_name, "success": True}
        except Exception as exc:
            raise PlaybookExecutionError(f"Failed to kill process {pid}: {exc}")


class QuarantineFileAction(PlaybookAction):
    name = "quarantine_file"
    description = "Move a suspicious file to quarantine"

    async def execute(self, params: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        filepath = params.get("filepath", "")
        settings = get_settings()
        quarantine_dir = str(settings.paths.quarantine_dir)

        if dry_run:
            return {"action": "quarantine_file", "filepath": filepath, "dry_run": True}

        if not os.path.isfile(filepath):
            raise PlaybookExecutionError(f"File not found: {filepath}")

        import shutil
        dest = os.path.join(quarantine_dir, os.path.basename(filepath) + f".{int(datetime.now().timestamp())}")
        os.makedirs(quarantine_dir, exist_ok=True)
        shutil.move(filepath, dest)
        return {
            "action": "quarantine_file", "original_path": filepath,
            "quarantine_path": dest, "success": True,
            "rollback_data": {"original_path": filepath, "quarantine_path": dest},
        }

    async def rollback(self, rollback_data: dict[str, Any]) -> dict[str, Any]:
        import shutil
        src = rollback_data["quarantine_path"]
        dest = rollback_data["original_path"]
        if os.path.isfile(src):
            shutil.move(src, dest)
            return {"action": "restore_file", "path": dest, "success": True}
        raise RollbackError(f"Quarantined file not found: {src}")


class DisableUserAction(PlaybookAction):
    name = "disable_user"
    description = "Disable a Windows user account"

    async def execute(self, params: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        username = params.get("username", "")
        if dry_run:
            return {"action": "disable_user", "username": username, "dry_run": True}

        try:
            result = subprocess.run(
                ["net", "user", username, "/active:no"],
                capture_output=True, text=True, timeout=30,
            )
            return {
                "action": "disable_user", "username": username,
                "success": result.returncode == 0,
                "rollback_data": {"username": username},
            }
        except Exception as exc:
            raise PlaybookExecutionError(f"Failed to disable user {username}: {exc}")

    async def rollback(self, rollback_data: dict[str, Any]) -> dict[str, Any]:
        username = rollback_data["username"]
        result = subprocess.run(
            ["net", "user", username, "/active:yes"],
            capture_output=True, text=True, timeout=30,
        )
        return {"action": "enable_user", "username": username, "success": result.returncode == 0}


class NotifySOCAction(PlaybookAction):
    name = "notify_soc"
    description = "Send notification to SOC team via Email"
    reversible = False

    async def execute(self, params: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        message = params.get("message", "Security alert triggered")
        severity = params.get("severity", "high")
        if dry_run:
            return {"action": "notify_soc", "message": message, "dry_run": True}

        # Log as notification
        logger.warning("soc_notification", message=message, severity=severity)

        # Dispatch real email via Gmail SMTP
        from services.email_service import get_email_service
        email_svc = get_email_service()
        email_sent = await email_svc.send_alert_email(
            subject=f"KAVACH Notification [{severity.upper()}]: {message[:50]}",
            body=f"Severity: {severity}\nMessage: {message}\nTimestamp: {datetime.now(timezone.utc).isoformat()}",
        )

        return {"action": "notify_soc", "message": message, "email_sent": email_sent, "success": True}


# ---------------------------------------------------------------------------
# Playbook Definitions
# ---------------------------------------------------------------------------

PLAYBOOK_DEFINITIONS: dict[str, dict[str, Any]] = {
    "ransomware_response": {
        "name": "Ransomware Response",
        "description": "Automated response to ransomware detection",
        "severity_trigger": "critical",
        "mode": ResponseMode.AUTOMATIC.value,
        "actions": [
            {"action": "kill_process", "description": "Kill malicious process"},
            {"action": "quarantine_file", "description": "Quarantine malicious file"},
            {"action": "block_ip", "description": "Block C2 IP address"},
            {"action": "notify_soc", "description": "Alert SOC team"},
        ],
    },
    "credential_theft_response": {
        "name": "Credential Theft Response",
        "description": "Response to credential access attempts (LSASS, mimikatz)",
        "severity_trigger": "critical",
        "mode": ResponseMode.APPROVAL_REQUIRED.value,
        "actions": [
            {"action": "kill_process", "description": "Kill offending process"},
            {"action": "disable_user", "description": "Disable compromised account"},
            {"action": "notify_soc", "description": "Alert SOC team"},
        ],
    },
    "lateral_movement_response": {
        "name": "Lateral Movement Response",
        "description": "Response to lateral movement detection",
        "severity_trigger": "high",
        "mode": ResponseMode.APPROVAL_REQUIRED.value,
        "actions": [
            {"action": "block_ip", "description": "Block source IP"},
            {"action": "notify_soc", "description": "Alert SOC team"},
        ],
    },
    "malware_containment": {
        "name": "Malware Containment",
        "description": "Contain detected malware",
        "severity_trigger": "high",
        "mode": ResponseMode.AUTOMATIC.value,
        "actions": [
            {"action": "quarantine_file", "description": "Quarantine malicious file"},
            {"action": "kill_process", "description": "Kill malicious process"},
            {"action": "notify_soc", "description": "Alert SOC team"},
        ],
    },
    "brute_force_response": {
        "name": "Brute Force Response",
        "description": "Response to brute force login attempts",
        "severity_trigger": "high",
        "mode": ResponseMode.AUTOMATIC.value,
        "actions": [
            {"action": "block_ip", "description": "Block source IP"},
            {"action": "notify_soc", "description": "Alert SOC team"},
        ],
    },
}

# Action registry
ACTION_REGISTRY: dict[str, PlaybookAction] = {
    "block_ip": BlockIPAction(),
    "kill_process": KillProcessAction(),
    "quarantine_file": QuarantineFileAction(),
    "disable_user": DisableUserAction(),
    "notify_soc": NotifySOCAction(),
}


# ---------------------------------------------------------------------------
# Playbook Engine
# ---------------------------------------------------------------------------

class PlaybookEngine:
    """Executes SOAR playbooks with audit trail and rollback support."""

    def __init__(self) -> None:
        self._definitions = PLAYBOOK_DEFINITIONS
        self._actions = ACTION_REGISTRY

    def list_playbooks(self) -> list[dict[str, Any]]:
        """Return all available playbook definitions."""
        return [
            {"id": pid, **{k: v for k, v in pdef.items() if k != "actions"},
             "action_count": len(pdef["actions"])}
            for pid, pdef in self._definitions.items()
        ]

    async def execute(
        self,
        playbook_id: str,
        params: dict[str, Any],
        executed_by: str = "system",
        dry_run: bool = False,
        alert_id: str | None = None,
    ) -> dict[str, Any]:
        """Execute a playbook."""
        definition = self._definitions.get(playbook_id)
        if not definition:
            raise PlaybookExecutionError(f"Playbook not found: {playbook_id}")

        results: list[dict[str, Any]] = []
        rollback_data: list[dict[str, Any]] = []
        overall_success = True

        logger.info(
            "playbook_executing",
            playbook=playbook_id, dry_run=dry_run, executed_by=executed_by,
        )

        for action_def in definition["actions"]:
            action_name = action_def["action"]
            action = self._actions.get(action_name)
            if not action:
                results.append({"action": action_name, "error": "Action not found"})
                continue

            try:
                result = await action.execute(params, dry_run=dry_run)
                results.append(result)
                if result.get("rollback_data"):
                    rollback_data.append({
                        "action": action_name,
                        "data": result["rollback_data"],
                    })
            except Exception as exc:
                overall_success = False
                results.append({"action": action_name, "error": str(exc)})
                logger.error("playbook_action_failed", action=action_name, error=str(exc))

        # Record execution in database
        if not dry_run:
            try:
                async with get_session() as session:
                    exec_repo = PlaybookExecutionRepository(session)
                    audit_repo = AuditLogRepository(session)

                    await exec_repo.create(
                        playbook_name=playbook_id,
                        trigger_type="manual" if executed_by != "system" else "automatic",
                        trigger_alert_id=alert_id,
                        actions_taken={"results": results},
                        status=PlaybookStatus.COMPLETED.value if overall_success else PlaybookStatus.FAILED.value,
                        executed_by=executed_by,
                        rollback_data={"actions": rollback_data} if rollback_data else None,
                        rollback_available=bool(rollback_data),
                        completed_at=datetime.now(timezone.utc),
                    )

                    await audit_repo.log_action(
                        action=f"playbook_executed:{playbook_id}",
                        actor=executed_by,
                        details={"results": results, "dry_run": dry_run},
                    )
            except Exception:
                logger.exception("playbook_db_record_error")

        return {
            "playbook_id": playbook_id,
            "name": definition["name"],
            "dry_run": dry_run,
            "success": overall_success,
            "results": results,
            "rollback_available": bool(rollback_data),
        }

    async def rollback_execution(self, execution_id: str, actor: str = "system") -> dict[str, Any]:
        """Rollback a previous playbook execution."""
        async with get_session() as session:
            exec_repo = PlaybookExecutionRepository(session)
            audit_repo = AuditLogRepository(session)

            execution = await exec_repo.get_by_id(execution_id)
            if not execution:
                raise RollbackError(f"Execution not found: {execution_id}")
            if not execution.rollback_available:
                raise RollbackError("No rollback data available for this execution")

            rollback_info = execution.rollback_data or {}
            results: list[dict[str, Any]] = []

            for action_entry in rollback_info.get("actions", []):
                action_name = action_entry["action"]
                action = self._actions.get(action_name)
                if action and action.reversible:
                    try:
                        result = await action.rollback(action_entry["data"])
                        results.append(result)
                    except Exception as exc:
                        results.append({"action": action_name, "error": str(exc)})

            # Update execution record
            await exec_repo.update_by_id(
                execution_id,
                status=PlaybookStatus.ROLLED_BACK.value,
                rollback_available=False,
            )

            await audit_repo.log_action(
                action=f"playbook_rollback:{execution.playbook_name}",
                actor=actor,
                target_id=execution_id,
                details={"results": results},
            )

            return {"execution_id": execution_id, "results": results}


# Singleton
_engine: PlaybookEngine | None = None


def get_playbook_engine() -> PlaybookEngine:
    global _engine
    if _engine is None:
        _engine = PlaybookEngine()
    return _engine
