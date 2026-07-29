# KAVACH — AI-Driven SOAR-XDR Threat Intelligence & Response Platform

## Overview

KAVACH is a production-grade **Security Orchestration, Automation, and Response (SOAR)** platform with **Extended Detection and Response (XDR)** capabilities, built entirely in Python.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy and configure environment
copy .env.example .env
# Edit .env with your GEMINI_API_KEY

# 3. Start the backend
python main.py

# 4. Open API documentation
# http://localhost:8000/docs

# 5. (Optional) Start the TUI dashboard
python tui.py
```

## Architecture

```
Collectors (16) → Event Bus → Pipeline → Database + JSON Logs → FastAPI → Frontend
                                ↓
                    MITRE ATT&CK Mapping
                    Risk Scoring
                    Correlation Engine
                    SOAR Playbooks
                    AI Analysis (Gemini)
```

## API Endpoints (30+)

| Category | Endpoint | Description |
|----------|----------|-------------|
| Auth | `POST /api/v1/auth/register` | Register user |
| Auth | `POST /api/v1/auth/login` | Login (JWT) |
| Dashboard | `GET /api/v1/dashboard/summary` | Full dashboard |
| Dashboard | `WS /api/v1/dashboard/live` | Live events |
| Alerts | `GET /api/v1/alerts` | List alerts |
| Alerts | `POST /api/v1/alerts/{id}/explain` | AI explanation |
| Incidents | `GET /api/v1/incidents` | List incidents |
| Threats | `POST /api/v1/threats/analyze-url` | URL analysis |
| MITRE | `GET /api/v1/mitre/techniques` | MITRE browser |
| MITRE | `GET /api/v1/mitre/heatmap` | Detection heatmap |
| Playbooks | `POST /api/v1/playbooks/execute` | Run playbook |
| Chatbot | `POST /api/v1/chatbot/soc` | SOC AI assistant |
| Chatbot | `POST /api/v1/chatbot/layman` | Simple AI assistant |
| Awareness | `GET /api/v1/awareness/tips` | Security tips |
| System | `GET /api/v1/system/health` | Health check |
| Reports | `GET /api/v1/reports/soc` | SOC report |

## Collectors (16)

| Collector | Source | Key Detections |
|-----------|--------|---------------|
| Process | psutil | LOLBins, encoded PS, parent/child |
| Network | psutil | Suspicious ports, beaconing, SMB |
| File Monitor | watchdog | Ransomware, suspicious extensions |
| Login | Event Log 4624/4625 | Brute force, RDP, privilege escalation |
| PowerShell | Event Log 4104 | Encoded commands, AMSI bypass |
| Sysmon | Sysmon 1-26 | LSASS access, DNS queries |
| Windows EventLog | Security/System | Service installs, firewall changes |
| DNS | Sysmon 22 | DNS tunneling, suspicious TLDs |
| Registry | winreg | Persistence keys (Run, Services) |
| USB | WMI | USB device insertion |
| Defender | Event Log | Malware detections |
| Scheduled Task | schtasks | Suspicious scheduled tasks |
| Software | Registry | Installed software inventory |
| System Info | psutil | Hardware and OS information |
| Canary | File system | Honeypot file access |
| Service | psutil | Service changes |

## SOAR Playbooks

- **Ransomware Response** — Kill process → Quarantine file → Block IP → Notify SOC
- **Credential Theft** — Kill process → Disable user → Notify SOC
- **Lateral Movement** — Block IP → Notify SOC
- **Malware Containment** — Quarantine → Kill process → Notify SOC
- **Brute Force** — Block IP → Notify SOC

All playbooks support **dry-run mode** and **rollback**.

## RBAC Roles

| Role | Access |
|------|--------|
| SOC Analyst | Full access — investigate, respond, manage |
| Layman User | View health, personal alerts, tips, awareness |

## License

Proprietary — KAVACH Security Platform
