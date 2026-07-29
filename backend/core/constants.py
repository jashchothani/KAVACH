"""
KAVACH Constants and Enumerations.

Centralised enums and constants used across all modules.
No magic strings — everything referenced through these definitions.
"""

from __future__ import annotations

from enum import Enum, IntEnum


# ---------------------------------------------------------------------------
# Severity
# ---------------------------------------------------------------------------

class Severity(str, Enum):
    """Alert / event severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

    @property
    def weight(self) -> int:
        """Numeric weight for scoring calculations."""
        return {
            Severity.CRITICAL: 100,
            Severity.HIGH: 80,
            Severity.MEDIUM: 50,
            Severity.LOW: 20,
            Severity.INFO: 5,
        }[self]


# ---------------------------------------------------------------------------
# Event Types
# ---------------------------------------------------------------------------

class EventType(str, Enum):
    """Canonical event type taxonomy."""
    PROCESS_CREATE = "process_create"
    PROCESS_TERMINATE = "process_terminate"
    NETWORK_CONNECTION = "network_connection"
    DNS_QUERY = "dns_query"
    FILE_CREATE = "file_create"
    FILE_MODIFY = "file_modify"
    FILE_DELETE = "file_delete"
    FILE_RENAME = "file_rename"
    FILE_PERMISSION_CHANGE = "file_permission_change"
    REGISTRY_MODIFY = "registry_modify"
    REGISTRY_CREATE = "registry_create"
    REGISTRY_DELETE = "registry_delete"
    SERVICE_INSTALL = "service_install"
    SERVICE_CHANGE = "service_change"
    DRIVER_LOAD = "driver_load"
    DLL_LOAD = "dll_load"
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGIN_RDP = "login_rdp"
    ACCOUNT_CREATE = "account_create"
    ACCOUNT_DELETE = "account_delete"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    POWERSHELL_EXECUTION = "powershell_execution"
    SCHEDULED_TASK = "scheduled_task"
    USB_INSERT = "usb_insert"
    USB_REMOVE = "usb_remove"
    DEFENDER_ALERT = "defender_alert"
    DEFENDER_ACTION = "defender_action"
    FIREWALL_EVENT = "firewall_event"
    CANARY_ACCESS = "canary_access"
    MASS_ENCRYPTION = "mass_encryption"
    SUSPICIOUS_EXTENSION = "suspicious_extension"
    LSASS_ACCESS = "lsass_access"
    MEMORY_ACCESS = "memory_access"
    SMB_CONNECTION = "smb_connection"
    EXECUTABLE_LAUNCH = "executable_launch"
    SYSTEM_INFO = "system_info"
    SOFTWARE_INSTALL = "software_install"
    BEACONING = "beaconing"
    PORT_SCAN = "port_scan"
    LATERAL_MOVEMENT = "lateral_movement"
    ENCODED_COMMAND = "encoded_command"
    SUSPICIOUS_DOWNLOAD = "suspicious_download"


# ---------------------------------------------------------------------------
# Collector identifiers
# ---------------------------------------------------------------------------

class CollectorName(str, Enum):
    """Registered collector identifiers."""
    WINDOWS_EVENTLOG = "windows_eventlog"
    SYSMON = "sysmon"
    PROCESS = "process"
    NETWORK = "network"
    FILE_MONITOR = "file_monitor"
    REGISTRY = "registry"
    SERVICE = "service"
    USB = "usb"
    POWERSHELL = "powershell"
    DEFENDER = "defender"
    LOGIN = "login"
    SCHEDULED_TASK = "scheduled_task"
    SOFTWARE = "software"
    SYSTEM_INFO = "system_info"
    CANARY = "canary"
    DNS = "dns"


# ---------------------------------------------------------------------------
# Collector status
# ---------------------------------------------------------------------------

class CollectorStatus(str, Enum):
    """Collector lifecycle states."""
    STARTING = "starting"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
    DISABLED = "disabled"


# ---------------------------------------------------------------------------
# Alert / incident status
# ---------------------------------------------------------------------------

class AlertStatus(str, Enum):
    """Alert workflow states."""
    NEW = "new"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class IncidentStatus(str, Enum):
    """Incident workflow states."""
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    ERADICATED = "eradicated"
    RECOVERED = "recovered"
    CLOSED = "closed"


# ---------------------------------------------------------------------------
# Playbook / response
# ---------------------------------------------------------------------------

class PlaybookStatus(str, Enum):
    """Playbook execution states."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    AWAITING_APPROVAL = "awaiting_approval"


class ResponseMode(str, Enum):
    """Response execution modes."""
    AUTOMATIC = "automatic"
    MANUAL = "manual"
    APPROVAL_REQUIRED = "approval_required"


# ---------------------------------------------------------------------------
# User roles
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    """User roles for RBAC."""
    SOC_ANALYST = "soc_analyst"
    LAYMAN_USER = "layman_user"
    ADMIN = "admin"


# ---------------------------------------------------------------------------
# IOC types
# ---------------------------------------------------------------------------

class IOCType(str, Enum):
    """Indicator of Compromise types."""
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH_MD5 = "hash_md5"
    HASH_SHA256 = "hash_sha256"
    EMAIL = "email"
    FILE_NAME = "file_name"
    REGISTRY_KEY = "registry_key"
    MUTEX = "mutex"
    USER_AGENT = "user_agent"


# ---------------------------------------------------------------------------
# Message bus topics
# ---------------------------------------------------------------------------

class Topic(str, Enum):
    """Message bus topic names."""
    RAW_EVENTS = "kavach.events.raw"
    NORMALIZED_EVENTS = "kavach.events.normalized"
    ENRICHED_EVENTS = "kavach.events.enriched"
    ALERTS = "kavach.alerts"
    INCIDENTS = "kavach.incidents"
    PLAYBOOK_TRIGGER = "kavach.playbook.trigger"
    PLAYBOOK_RESULT = "kavach.playbook.result"
    SYSTEM_HEALTH = "kavach.system.health"
    AI_REQUEST = "kavach.ai.request"
    AI_RESPONSE = "kavach.ai.response"


# ---------------------------------------------------------------------------
# MITRE tactic IDs
# ---------------------------------------------------------------------------

class MitreTactic(str, Enum):
    """MITRE ATT&CK tactic identifiers."""
    RECONNAISSANCE = "TA0043"
    RESOURCE_DEVELOPMENT = "TA0042"
    INITIAL_ACCESS = "TA0001"
    EXECUTION = "TA0002"
    PERSISTENCE = "TA0003"
    PRIVILEGE_ESCALATION = "TA0004"
    DEFENSE_EVASION = "TA0005"
    CREDENTIAL_ACCESS = "TA0006"
    DISCOVERY = "TA0007"
    LATERAL_MOVEMENT = "TA0008"
    COLLECTION = "TA0009"
    COMMAND_AND_CONTROL = "TA0011"
    EXFILTRATION = "TA0010"
    IMPACT = "TA0040"


# ---------------------------------------------------------------------------
# Windows Event IDs (commonly monitored)
# ---------------------------------------------------------------------------

class WinEventID(IntEnum):
    """Key Windows Security Event IDs."""
    # Logon events
    LOGON_SUCCESS = 4624
    LOGON_FAILURE = 4625
    LOGON_EXPLICIT_CREDS = 4648
    SPECIAL_LOGON = 4672

    # Account management
    ACCOUNT_CREATED = 4720
    ACCOUNT_DELETED = 4726
    ACCOUNT_ENABLED = 4722
    ACCOUNT_DISABLED = 4725
    PASSWORD_CHANGE = 4723
    GROUP_MEMBER_ADDED = 4728
    GROUP_MEMBER_REMOVED = 4729

    # Process
    PROCESS_CREATED = 4688
    PROCESS_TERMINATED = 4689

    # Object access
    OBJECT_ACCESS = 4663
    OBJECT_HANDLE_CLOSED = 4658

    # Policy
    AUDIT_POLICY_CHANGE = 4719
    SYSTEM_AUDIT_CHANGE = 4902

    # Firewall
    FIREWALL_RULE_ADD = 4946
    FIREWALL_RULE_MODIFY = 4947
    FIREWALL_RULE_DELETE = 4948

    # Service
    SERVICE_INSTALLED = 7045

    # Scheduled task
    TASK_CREATED = 4698
    TASK_DELETED = 4699
    TASK_ENABLED = 4700
    TASK_DISABLED = 4701


# ---------------------------------------------------------------------------
# Sysmon Event IDs
# ---------------------------------------------------------------------------

class SysmonEventID(IntEnum):
    """Sysmon event type IDs."""
    PROCESS_CREATE = 1
    FILE_CREATE_TIME = 2
    NETWORK_CONNECT = 3
    SYSMON_STATE_CHANGED = 4
    PROCESS_TERMINATE = 5
    DRIVER_LOAD = 6
    IMAGE_LOAD = 7
    CREATE_REMOTE_THREAD = 8
    RAW_ACCESS_READ = 9
    PROCESS_ACCESS = 10
    FILE_CREATE = 11
    REGISTRY_EVENT_ADD_DEL = 12
    REGISTRY_EVENT_SET = 13
    REGISTRY_EVENT_RENAME = 14
    FILE_CREATE_STREAM_HASH = 15
    SYSMON_CONFIG_CHANGE = 16
    PIPE_CREATED = 17
    PIPE_CONNECTED = 18
    WMI_FILTER = 19
    WMI_CONSUMER = 20
    WMI_BINDING = 21
    DNS_QUERY = 22
    FILE_DELETE = 23
    CLIPBOARD_CHANGE = 24
    PROCESS_TAMPERING = 25
    FILE_DELETE_LOGGED = 26


# ---------------------------------------------------------------------------
# Living-off-the-land binaries (LOLBins)
# ---------------------------------------------------------------------------

LOLBINS: frozenset[str] = frozenset({
    "certutil.exe", "mshta.exe", "msiexec.exe", "regsvr32.exe",
    "rundll32.exe", "wmic.exe", "cscript.exe", "wscript.exe",
    "powershell.exe", "pwsh.exe", "cmd.exe", "bitsadmin.exe",
    "certreq.exe", "desktopimgdownldr.exe", "esentutl.exe",
    "expand.exe", "extrac32.exe", "findstr.exe", "hh.exe",
    "ie4uinit.exe", "ieexec.exe", "infdefaultinstall.exe",
    "installutil.exe", "makecab.exe", "mavinject.exe",
    "microsoft.workflow.compiler.exe", "mmc.exe", "msconfig.exe",
    "msdt.exe", "msiexec.exe", "netsh.exe", "odbcconf.exe",
    "pcalua.exe", "pcwrun.exe", "presentationhost.exe",
    "rasautou.exe", "reg.exe", "regasm.exe", "regedit.exe",
    "regsvcs.exe", "replace.exe", "rpcping.exe",
    "schtasks.exe", "scriptrunner.exe", "syncappvpublishingserver.exe",
    "verclsid.exe", "xwizard.exe", "forfiles.exe",
    "te.exe", "tracker.exe",
})

# ---------------------------------------------------------------------------
# Suspicious file extensions
# ---------------------------------------------------------------------------

SUSPICIOUS_EXTENSIONS: frozenset[str] = frozenset({
    ".exe", ".dll", ".scr", ".bat", ".cmd", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".wsh", ".ps1", ".psm1", ".psd1",
    ".msi", ".msp", ".mst", ".cpl", ".hta", ".inf", ".ins",
    ".isp", ".lnk", ".reg", ".rgs", ".sct", ".shb", ".shs",
    ".ws", ".wsc", ".com", ".pif", ".gadget", ".application",
    ".appref-ms", ".ade", ".adp", ".crt", ".url",
})

RANSOMWARE_EXTENSIONS: frozenset[str] = frozenset({
    ".encrypted", ".locked", ".crypto", ".crypt", ".enc",
    ".locky", ".cerber", ".zepto", ".thor", ".aaa",
    ".abc", ".zzz", ".micro", ".crinf", ".r5a",
    ".xrtn", ".xtbl", ".crypz", ".crypted",
})
