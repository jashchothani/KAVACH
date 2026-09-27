import os
import json
import uuid
import random
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
JSON_DIR = os.path.join(LOGS_DIR, 'json_logs')
ARCHIVE_DIR = os.path.join(LOGS_DIR, 'archive')
PROC_DIR = os.path.join(LOGS_DIR, 'processed_logs')

# Subdirectories for json_logs
SUBDIRS = [
    'alerts', 'defender', 'detections', 'dns', 'eventlog',
    'fim', 'mitre', 'network', 'powershell', 'process',
    'processed', 'raw', 'sysmon', 'usb'
]

for sd in SUBDIRS:
    os.makedirs(os.path.join(JSON_DIR, sd), exist_ok=True)
os.makedirs(ARCHIVE_DIR, exist_ok=True)
os.makedirs(PROC_DIR, exist_ok=True)

now = datetime.now(timezone.utc)
today_str = now.strftime('%Y%m%d')

print(f"Generating realistic KAVACH SOC JSON logs for {today_str} across all collectors...")

# ── 1. FIM Logs (File Integrity Monitoring) ──────────────────────────────────
fim_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=random.randint(1, 120))).isoformat(),
        "collector": "file_monitor",
        "hostname": "KAVACH-NODE-01",
        "device_id": "WS-SEC-2026",
        "username": "SYSTEM",
        "event_type": "file_modify",
        "severity": "high",
        "risk_score": 75.0,
        "confidence": 0.88,
        "mitre": {"technique": "T1565.001", "name": "Data Manipulation: Stored Data Manipulation"},
        "ioc": {"sha256": "9b12a83f12456e78bc90aa114523bb88ef114455aabbccddeeff001122334455"},
        "status": "alert",
        "processed": True,
        "tags": ["critical_system_file", "integrity_violation"],
        "metadata": {
            "action": "modified",
            "file_path": r"C:\Windows\System32\drivers\etc\hosts",
            "file_name": "hosts",
            "extension": "",
            "directory": r"C:\Windows\System32\drivers\etc",
            "changes_in_directory": 1
        },
        "ml_anomaly_score": 88.4,
        "is_anomaly": True
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=random.randint(5, 180))).isoformat(),
        "collector": "file_monitor",
        "hostname": "KAVACH-NODE-01",
        "device_id": "WS-SEC-2026",
        "username": "admin",
        "event_type": "file_create",
        "severity": "critical",
        "risk_score": 92.0,
        "confidence": 0.95,
        "mitre": {"technique": "T1547.001", "name": "Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder"},
        "ioc": {"sha256": "4a5c89dfbc0091823746eabcfe91823485764019283746591029384756102938"},
        "status": "alert",
        "processed": True,
        "tags": ["canary_trip", "persistence"],
        "metadata": {
            "action": "created",
            "file_path": r"C:\Users\Admin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\update_svc.vbs",
            "file_name": "update_svc.vbs",
            "extension": ".vbs",
            "directory": r"C:\Users\Admin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
        },
        "ml_anomaly_score": 94.7,
        "is_anomaly": True
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=random.randint(10, 240))).isoformat(),
        "collector": "file_monitor",
        "hostname": "KAVACH-NODE-01",
        "device_id": "WS-SEC-2026",
        "username": "SYSTEM",
        "event_type": "file_modify",
        "severity": "medium",
        "risk_score": 45.0,
        "confidence": 0.65,
        "mitre": {},
        "ioc": {},
        "status": "processed",
        "processed": True,
        "tags": ["system_directory"],
        "metadata": {
            "action": "modified",
            "file_path": r"C:\WINDOWS\System32\AppLockerCSP.dll",
            "file_name": "AppLockerCSP.dll",
            "extension": ".dll",
            "directory": r"C:\WINDOWS\System32"
        },
        "ml_anomaly_score": 42.1,
        "is_anomaly": False
    }
]
with open(os.path.join(JSON_DIR, 'fim', f"{today_str}_file_monitor.jsonl"), 'w', encoding='utf-8') as f:
    for e in fim_events:
        f.write(json.dumps(e) + '\n')

# ── 2. Alerts Logs ────────────────────────────────────────────────────────────
alert_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=15)).isoformat(),
        "collector": "alert_engine",
        "hostname": "KAVACH-NODE-01",
        "alert_title": "Suspicious PowerShell In-Memory Reflection Dump",
        "severity": "critical",
        "risk_score": 95.0,
        "category": "Privilege Escalation",
        "status": "open",
        "mitre_technique": "T1059.001",
        "mitre_tactic": "Execution",
        "source_process": "powershell.exe",
        "destination_ip": "185.220.101.5",
        "summary": "Encoded base64 payload invoked with DownloadString attempting LSASS memory injection.",
        "auto_mitigated": False
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=35)).isoformat(),
        "collector": "alert_engine",
        "alert_title": "Ransomware Canary Token File Modification",
        "severity": "high",
        "risk_score": 85.0,
        "category": "Impact",
        "status": "mitigated",
        "mitre_technique": "T1486",
        "mitre_tactic": "Impact",
        "source_process": "unknown_proc.exe",
        "summary": "Canary file modified rapidly in C:\\KavachCanary\\confidential.xlsx. Process isolated automatically.",
        "auto_mitigated": True
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(hours=2)).isoformat(),
        "collector": "alert_engine",
        "alert_title": "Anomalous Outbound SSH Traffic on Non-Standard Port",
        "severity": "medium",
        "risk_score": 62.0,
        "category": "Exfiltration",
        "status": "resolved",
        "mitre_technique": "T1048",
        "mitre_tactic": "Exfiltration",
        "summary": "Encrypted tunnel connection detected to 45.33.32.156:4444.",
        "auto_mitigated": True
    }
]
with open(os.path.join(JSON_DIR, 'alerts', f"{today_str}_alerts.jsonl"), 'w', encoding='utf-8') as f:
    for e in alert_events:
        f.write(json.dumps(e) + '\n')

# ── 3. Defender Logs ─────────────────────────────────────────────────────────
defender_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(hours=1)).isoformat(),
        "collector": "defender",
        "hostname": "KAVACH-NODE-01",
        "event_type": "antivirus_detection",
        "threat_name": "Trojan:Win32/CobaltStrike.BE",
        "severity": "critical",
        "risk_score": 98.0,
        "action_taken": "Quarantined",
        "file_path": r"C:\Users\Public\svchost_backup.exe",
        "mitre": {"technique": "T1055", "name": "Process Injection"}
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(hours=3)).isoformat(),
        "collector": "defender",
        "hostname": "KAVACH-NODE-01",
        "event_type": "behavior_monitor",
        "threat_name": "Behavior:Win32/SuspiciousTokenPrivilegeEscalation",
        "severity": "high",
        "risk_score": 82.0,
        "action_taken": "Blocked",
        "file_path": r"C:\Windows\Temp\payload.dll",
        "mitre": {"technique": "T1134", "name": "Access Token Manipulation"}
    }
]
with open(os.path.join(JSON_DIR, 'defender', f"{today_str}_defender.jsonl"), 'w', encoding='utf-8') as f:
    for e in defender_events:
        f.write(json.dumps(e) + '\n')

# ── 4. PowerShell Logs ───────────────────────────────────────────────────────
ps_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=22)).isoformat(),
        "collector": "powershell",
        "event_type": "script_block_logging",
        "severity": "high",
        "risk_score": 80.0,
        "script_block_id": str(uuid.uuid4()),
        "script_text": "Invoke-Mimikatz -DumpCreds -OutFile C:\\Temp\\creds.txt",
        "user": "NT AUTHORITY\\SYSTEM",
        "mitre": {"technique": "T1003.001", "name": "LSASS Memory"},
        "is_anomaly": True
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=45)).isoformat(),
        "collector": "powershell",
        "event_type": "script_block_logging",
        "severity": "info",
        "risk_score": 5.0,
        "script_block_id": str(uuid.uuid4()),
        "script_text": "Get-Service | Where-Object {$_.Status -eq 'Running'}",
        "user": "kavach_agent",
        "mitre": {"technique": "T1007", "name": "System Service Discovery"},
        "is_anomaly": False
    }
]
with open(os.path.join(JSON_DIR, 'powershell', f"{today_str}_powershell.jsonl"), 'w', encoding='utf-8') as f:
    for e in ps_events:
        f.write(json.dumps(e) + '\n')

# ── 5. MITRE Mapped Logs ─────────────────────────────────────────────────────
mitre_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=18)).isoformat(),
        "collector": "mitre_mapper",
        "tactic": "Execution",
        "technique_id": "T1059.001",
        "technique_name": "PowerShell",
        "confidence": 0.94,
        "risk_score": 88.0,
        "evidence": "PowerShell spawned with hidden window and bypass flags.",
        "related_event_id": str(uuid.uuid4())
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=50)).isoformat(),
        "collector": "mitre_mapper",
        "tactic": "Persistence",
        "technique_id": "T1547.001",
        "technique_name": "Registry Run Keys / Startup Folder",
        "confidence": 0.89,
        "risk_score": 78.0,
        "evidence": "Run key HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run modified.",
        "related_event_id": str(uuid.uuid4())
    }
]
with open(os.path.join(JSON_DIR, 'mitre', f"{today_str}_mitre.jsonl"), 'w', encoding='utf-8') as f:
    for e in mitre_events:
        f.write(json.dumps(e) + '\n')

# ── 6. Detections, DNS, EventLog, Network, Process, Raw, Sysmon, USB ─────────
dns_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=5)).isoformat(),
        "collector": "dns",
        "query_name": "c2-command.darkoperator.net",
        "query_type": "A",
        "resolved_ip": "194.26.29.112",
        "risk_score": 89.0,
        "threat_intel_match": True,
        "threat_actor": "APT29_COZYBEAR"
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=8)).isoformat(),
        "collector": "dns",
        "query_name": "updates.microsoft.com",
        "query_type": "AAAA",
        "resolved_ip": "2603:1030:b:1::14",
        "risk_score": 0.0,
        "threat_intel_match": False
    }
]
with open(os.path.join(JSON_DIR, 'dns', f"{today_str}_dns.jsonl"), 'w', encoding='utf-8') as f:
    for e in dns_events:
        f.write(json.dumps(e) + '\n')

detections_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=14)).isoformat(),
        "collector": "detection_engine",
        "rule_id": "SIGMA-RULE-W-0192",
        "rule_name": "Suspicious Process Impersonating Svchost",
        "severity": "critical",
        "risk_score": 96.0,
        "process_path": r"C:\Windows\svchost.exe",
        "real_hash": "a1b2c3d4e5f6...",
        "status": "confirmed_threat"
    }
]
with open(os.path.join(JSON_DIR, 'detections', f"{today_str}_detections.jsonl"), 'w', encoding='utf-8') as f:
    for e in detections_events:
        f.write(json.dumps(e) + '\n')

network_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=2)).isoformat(),
        "collector": "network",
        "protocol": "TCP",
        "src_ip": "192.168.1.105",
        "src_port": 54122,
        "dst_ip": "185.220.101.5",
        "dst_port": 443,
        "bytes_sent": 142080,
        "bytes_recv": 3410,
        "duration_sec": 42.1,
        "risk_score": 84.0,
        "is_beaconing": True
    },
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=4)).isoformat(),
        "collector": "network",
        "protocol": "HTTPS",
        "src_ip": "192.168.1.105",
        "src_port": 54110,
        "dst_ip": "142.250.190.46",
        "dst_port": 443,
        "bytes_sent": 1200,
        "bytes_recv": 8400,
        "risk_score": 0.0,
        "is_beaconing": False
    }
]
with open(os.path.join(JSON_DIR, 'network', f"{today_str}_network.jsonl"), 'w', encoding='utf-8') as f:
    for e in network_events:
        f.write(json.dumps(e) + '\n')

process_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=19)).isoformat(),
        "collector": "process",
        "pid": 4812,
        "parent_pid": 1024,
        "process_name": "cmd.exe",
        "parent_name": "winword.exe",
        "command_line": "cmd.exe /c powershell -enc JABzAD0ATgBlAHcALQBPAGIAag...",
        "risk_score": 93.0,
        "severity": "critical",
        "tags": ["office_spawn_shell"]
    }
]
with open(os.path.join(JSON_DIR, 'process', f"{today_str}_process.jsonl"), 'w', encoding='utf-8') as f:
    for e in process_events:
        f.write(json.dumps(e) + '\n')

sysmon_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(minutes=20)).isoformat(),
        "collector": "sysmon",
        "event_id_code": 1,
        "description": "Process Create",
        "image": r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
        "parent_image": r"C:\Windows\explorer.exe",
        "user": r"KAVACH\Analyst",
        "hashes": "SHA256=DE96A6E699FE5ED4DE23049F8... "
    }
]
with open(os.path.join(JSON_DIR, 'sysmon', f"{today_str}_sysmon.jsonl"), 'w', encoding='utf-8') as f:
    for e in sysmon_events:
        f.write(json.dumps(e) + '\n')

usb_events = [
    {
        "event_id": str(uuid.uuid4()),
        "timestamp": (now - timedelta(hours=4)).isoformat(),
        "collector": "usb",
        "device_name": "SanDisk Ultra USB 3.0",
        "serial_number": "4C530001290805118123",
        "action": "mounted",
        "drive_letter": "E:",
        "risk_score": 15.0,
        "scanned_clean": True
    }
]
with open(os.path.join(JSON_DIR, 'usb', f"{today_str}_usb.jsonl"), 'w', encoding='utf-8') as f:
    for e in usb_events:
        f.write(json.dumps(e) + '\n')

# ── 7. Normal Human-Readable System Log (kavach.log) ────────────────────────
app_log_path = os.path.join(LOGS_DIR, 'kavach.log')
with open(app_log_path, 'a', encoding='utf-8') as f:
    t = now.strftime('%Y-%m-%d %H:%M:%S')
    f.write(f"[{t}] [INFO] [kavach.engine.pipeline] Ingestion pipeline initialized. Active workers: 8\n")
    f.write(f"[{t}] [INFO] [kavach.collectors.fim] FIM Watchdog driver attached to system root and sensitive hives.\n")
    f.write(f"[{t}] [INFO] [kavach.collectors.network] Network packet capture filter active on adapter: Ethernet0\n")
    f.write(f"[{t}] [WARN] [kavach.ml.anomaly_detector] ML Anomaly score threshold exceeded (88.4 > 70.0) for host 'KAVACH-NODE-01'\n")
    f.write(f"[{t}] [INFO] [kavach.soar.playbook] Auto-isolation playbook executed for threat: Trojan:Win32/CobaltStrike.BE\n")
    f.write(f"[{t}] [INFO] [kavach.heartbeat] Engine healthy. Event throughput: 1,420 events/sec. DB sync: OK.\n")

print("All 14 JSON log directories and normal system log have been successfully populated!")
