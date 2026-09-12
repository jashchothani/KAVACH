# 🛡️ KAVACH — AI-Powered SOAR-XDR Threat Intelligence & Defense Platform

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React / Vite](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B.svg?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000.svg?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE-ATT%26CK%20v14-red.svg?style=for-the-badge)](https://attack.mitre.org/)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey.svg?style=for-the-badge)](#license)

> **KAVACH** (कवच — *Armor/Shield*) is a production-grade **Extended Detection and Response (XDR)** and **Security Orchestration, Automation, and Response (SOAR)** platform. Designed for modern enterprise SOCs, incident response teams, and cyber defense operations, KAVACH brings together 16 native Windows telemetry collectors, machine learning behavioral anomaly detection, MITRE ATT&CK correlation, autonomous containment playbooks, an interactive 3D Web SOC Cockpit, and cross-platform mobile security clients.

---

## 📑 Table of Contents

- [Key Capabilities](#-key-capabilities)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Component Deep Dive](#-component-deep-dive)
  - [1. Telemetry Collectors (16 Windows Engines)](#1-telemetry-collectors-16-windows-engines)
  - [2. AI Threat Analysis & Copilot](#2-ai-threat-analysis--copilot)
  - [3. Machine Learning & Behavioral Anomaly Detection](#3-machine-learning--behavioral-anomaly-detection)
  - [4. SOAR Playbooks & Remediation](#4-soar-playbooks--remediation)
  - [5. Glassmorphic Web SOC Cockpit & 3D Visualizer](#5-glassmorphic-web-soc-cockpit--3d-visualizer)
  - [6. Cross-Platform Flutter Mobile Client](#6-cross-platform-flutter-mobile-client)
- [Quick Start](#-quick-start)
  - [Backend Setup](#backend-setup)
  - [Frontend Web App Setup](#frontend-web-app-setup)
  - [Flutter Mobile Client Setup](#flutter-mobile-client-setup)
- [API Endpoints](#-api-endpoints)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [License](#-license)

---

## 🚀 Key Capabilities

- **Real-Time Endpoint Telemetry**: 16 native Windows collectors capturing process hierarchies, Sysmon telemetry, PowerShell script block logs, network connections, file integrity (FIM), USB devices, and persistence mechanisms.
- **Autonomous SOAR Remediation**: Pre-packaged and customizable playbooks that isolate compromised hosts, kill malicious LOLBins, quarantine zero-day payloads, revoke rogue accounts, and block malicious IPs with instant rollback support.
- **Dual-Tier AI Copilot**: Server-side Google Gemini 2.0/3.7 for in-depth threat intelligence reports and incident summarization, complemented by client-side browser Puter.js AI with automatic fallback for zero-overhead interactive SOC guidance.
- **Behavioral ML Anomaly Detection**: Integrated scikit-learn Isolation Forest engine detecting baseline deviations and suspicious anomalies without relying purely on static signatures.
- **Interactive 3D SOC Cockpit**: Responsive glassmorphic command center featuring a real-time 3D Three.js cyber shield, dynamic MITRE ATT&CK matrix heatmaps, live telemetry charts, and unified alert triage.
- **Cross-Platform Mobile Security App**: Full Flutter client (Android, iOS, Windows, macOS, Linux, Web) providing secure MFA OTP authentication, executive security alerts, and system health status.

---

## 🏗️ System Architecture

```
                                 ┌──────────────────────────────────────────────────────────┐
                                 │              16 Native Windows Telemetry Collectors      │
                                 │ (Process, Network, Sysmon, Event Log, FIM, USB, Registry) │
                                 └────────────────────────────┬─────────────────────────────┘
                                                              │
                                                              ▼
                                                 ┌──────────────────────────┐
                                                 │ Async Internal Event Bus │
                                                 └────────────┬─────────────┘
                                                              │
                                                              ▼
                                                 ┌──────────────────────────┐
                                                 │ Multi-Stage Pipeline     │
                                                 │ - Deduplication & Normalization
                                                 │ - MITRE ATT&CK Mapping   │
                                                 │ - ML Anomaly Detection   │
                                                 │ - Risk Scoring Engine    │
                                                 └────────────┬─────────────┘
                                                              │
                                     ┌────────────────────────┴────────────────────────┐
                                     ▼                                                 ▼
                        ┌────────────────────────┐                        ┌─────────────────────────┐
                        │ SQLite / Engine DB     │                        │ Autonomous SOAR Engine  │
                        │ + JSON Audit Logs      │                        │ - Quarantine Payloads   │
                        └────────────┬───────────┘                        │ - Terminate Processes   │
                                     │                                    │ - Firewall / IP Blocks  │
                                     │                                    │ - Rollback / Dry-Run    │
                                     │                                    └─────────────────────────┘
                                     ▼
                        ┌────────────────────────┐
                        │ FastAPI Async API Core │
                        │ WebSockets + REST Auth │
                        └────────────┬───────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌──────────────────────────┐           ┌──────────────────────────┐
    │ Modern Web SOC Cockpit   │           │ Flutter Mobile Client    │
    │ - Three.js 3D Cyber Token│           │ - iOS, Android & Desktop │
    │ - Chart.js Telemetry     │           │ - Biometric / MFA Login  │
    │ - Puter / Gemini Copilot │           │ - Push Security Alerts   │
    └──────────────────────────┘           └──────────────────────────┘
```

---

## 📁 Repository Structure

```
KAVACH/
├── backend/                       # Core FastAPI & SOAR-XDR Backend
│   ├── ai/                        # Gemini & Multi-tier AI integration providers
│   ├── api/                       # FastAPI application & v1 REST/WebSocket routers
│   ├── auth/                      # JWT authentication, MFA OTP & password resets
│   ├── collectors/                # 16 Windows telemetry collector engines
│   ├── core/                      # Configuration, logging, event models & security
│   ├── database/                  # SQLAlchemy models, repositories & database engine
│   ├── email_notifications/       # Responsive transactional email templates & service
│   ├── mitre/                     # MITRE ATT&CK enterprise technique mapping
│   ├── ml/                        # Machine learning anomaly detection & trained models
│   ├── pipeline/                  # Asynchronous event processing & correlation pipeline
│   ├── playbooks/                 # SOAR automated response playbooks & rollback logic
│   ├── reports/                   # Automated executive & analyst PDF report generator
│   ├── response/                  # Ransomware containment & host remediation actions
│   ├── static/                    # Glassmorphic Web SOC Cockpit, Three.js 3D UI & styles
│   ├── tests/                     # Comprehensive test suites (API, auth, ML, telemetry)
│   ├── threatintel/               # Threat intelligence integrations (AbuseIPDB, VirusTotal)
│   ├── main.py                    # Backend server entry point (supports uvicorn & CLI)
│   ├── requirements.txt           # Unified Python backend dependencies
│   └── tui.py                     # Terminal-based SOC dashboard
├── frontend/                      # React / TypeScript / Vite Web Application
│   ├── src/                       # React components, pages & state management
│   └── package.json               # Node frontend dependencies
├── mobile/                        # Cross-Platform Flutter Client
│   ├── lib/                       # Flutter core architecture, themes, widgets & screens
│   │   ├── core/                  # Design tokens, routing, validation & services
│   │   └── screens/               # Auth, splash, login, MFA OTP & password workflows
│   ├── android/                   # Native Android configuration
│   ├── ios/                       # Native iOS configuration
│   ├── linux/ / macos/ / windows/ # Native desktop runner configurations
│   ├── web/                       # Flutter web runner & PWA assets
│   └── pubspec.yaml               # Flutter package configuration & dependencies
├── Documents/                     # Project diaries, specifications & engineering logs
├── .gitignore                     # Repository git ignore rules (archives, secrets, caches)
├── start_all_servers.bat          # One-click startup script for Windows
├── start_all_servers.ps1          # One-click PowerShell server launcher
└── README.md                      # Master repository documentation
```

---

## 🔍 Component Deep Dive

### 1. Telemetry Collectors (16 Windows Engines)

KAVACH integrates 16 native telemetry collectors designed for low CPU overhead and high fidelity:

| # | Collector | Primary Source | Core Detections |
|---|-----------|----------------|-----------------|
| 1 | **Process Collector** | `psutil` / Windows API | LOLBins (`certutil`, `mshta`), encoded PowerShell, suspicious process parenting |
| 2 | **Network Collector** | `psutil` | C2 beaconing, port scanning, lateral SMB connections, unusual outbound traffic |
| 3 | **File Monitor (FIM)** | `watchdog` | Ransomware encryption spikes, canary file modifications, critical system paths |
| 4 | **Login / Auth** | Event Logs 4624 / 4625 | Brute-force spikes, Pass-the-Hash, unexpected RDP logins, privilege escalation |
| 5 | **PowerShell Scripting** | Event Log 4104 | Obfuscated script blocks, AMSI bypass attempts, memory injection |
| 6 | **Sysmon Collector** | Sysmon Channels 1–26 | Process creation (EID 1), LSASS memory dumping (EID 10), raw disk access |
| 7 | **Windows EventLog** | Security & System | Service creation, audit log clearing, firewall rule modifications |
| 8 | **DNS Collector** | Sysmon EID 22 | DNS tunneling, DGA domains, queries to suspicious Top-Level Domains (TLDs) |
| 9 | **Registry Monitor** | `winreg` | Persistence mechanisms (Run keys, Winlogon, Image File Execution Options) |
| 10 | **USB Device Collector** | WMI Eventing | Rogue USB insertion, Rubber Ducky detection, removable storage access |
| 11 | **Windows Defender** | Defender Operational Log | Quarantined threats, tamper attempts, signature definitions |
| 12 | **Scheduled Tasks** | `schtasks` / XML | Malicious scheduled tasks, cron-like persistence, hidden tasks |
| 13 | **Software Inventory** | Windows Registry | Vulnerable software installations, unauthorized packages |
| 14 | **System Telemetry** | `psutil` | Host baseline metrics (CPU, RAM, disk utilization, uptime) |
| 15 | **Canary Honeypot** | File System Traps | Early-warning tripwires for active ransomware directory traversal |
| 16 | **Service Collector** | Windows Service Control | Unauthorized service creation, daemon persistence, driver loading |

### 2. AI Threat Analysis & Copilot

- **Server-Side Engine**: Deep analysis powered by Google Gemini (Gemini 2.0 / 3.7 Flash) featuring token-bucket rate limiting (5 RPM / 250K TPM) to generate analyst-grade incident summaries, false-positive justification, and MITRE mapping.
- **Browser-Side Copilot**: Embedded Puter.js integration that runs interactive conversational security assistance directly in the browser with zero server configuration or API keys required.
- **Dual Fallback Strategy**: Seamless fallback from browser AI to server-side AI, and down to heuristic rule engines when offline.

### 3. Machine Learning & Behavioral Anomaly Detection

- **Unsupervised Anomaly Detection**: Uses scikit-learn's `IsolationForest` pipeline trained on normal baseline operational patterns.
- **Risk Scoring**: Evaluates alert frequency, severity, asset criticality, and MITRE ATT&CK tactic weights to compute composite incident scores.

### 4. SOAR Playbooks & Remediation

Automated playbooks allow instant, programmatic threat containment:
- **Ransomware Response**: Terminate suspicious process tree → Quarantine modified files → Sever network connectivity → Dispatch high-priority SOC alert.
- **Credential Dumping Containment**: Kill memory dumping tools (`mimikatz`, `procdump`) → Force user session termination → Invalidate active tokens.
- **Brute Force Defense**: Automated firewall rule injection blocking offending remote IPs across network adapters.
- **Safety First**: Every playbook supports `--dry-run` execution mode and persistent audit logs with atomic rollback capabilities.

### 5. Glassmorphic Web SOC Cockpit & 3D Visualizer

- **3D Cyber Shield Token**: Interactive Three.js particle shield and cyber token dynamically responding to user mouse interaction and real-time threat levels.
- **Lazy Loaded Analytics**: Chart.js charts load on-demand when the dashboard opens to keep initial page render instant and lightweight.
- **Dark & Light Mode**: Curated high-contrast cybersecurity theme with glassmorphic cards, vibrant indicators, and responsive layouts.

### 6. Cross-Platform Flutter Mobile Client

Located in [`mobile/`](mobile/), the Flutter mobile client brings enterprise security notifications to mobile devices:
- Multi-factor authentication (MFA OTP) and secure token storage.
- Real-time mobile alert feeds with severity categorization.
- Executive summary dashboards for security managers on the go.

---

## ⚡ Quick Start

### Backend Setup

#### 1. Prerequisites
- **Python 3.10+** (64-bit recommended for Windows Event Log / Sysmon integrations)
- **Git**

#### 2. Install Dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Configure Environment
```bash
copy .env.example .env
# Edit .env to adjust JWT secret, SMTP settings, or optional GEMINI_API_KEY
```

#### 4. Run KAVACH

**Full SOAR-XDR Mode (API + 16 Live Collectors)**:
```bash
python main.py
```

**Lightweight Web & API Server Only (Fast dev / demo mode)**:
```bash
python main.py --no-collectors
```

#### 5. Access Dashboards
- **Web SOC Cockpit**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Terminal TUI**: `python tui.py`

---

### Frontend Web App Setup

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Flutter Mobile Client Setup

#### 1. Prerequisites
- **Flutter SDK 3.x**
- Android Studio / Xcode / VS Code with Flutter extension

#### 2. Run the Mobile App
```bash
cd mobile
flutter pub get
flutter run
```

---

## 📡 API Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user account |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate & retrieve JWT tokens |
| **Auth** | `POST` | `/api/v1/auth/verify-otp` | Verify 2FA / email OTP code |
| **Dashboard** | `GET` | `/api/v1/dashboard/summary` | Global telemetry and incident overview |
| **Dashboard** | `WS` | `/api/v1/dashboard/live` | WebSocket stream of real-time security events |
| **Alerts** | `GET` | `/api/v1/alerts` | Query and filter security alerts |
| **Alerts** | `POST` | `/api/v1/alerts/{id}/explain` | Generate AI explanation & triage suggestions |
| **Incidents** | `GET` | `/api/v1/incidents` | List correlated security incidents |
| **Threat Intel** | `POST` | `/api/v1/threats/analyze-url` | Query VirusTotal & AbuseIPDB for IOCs |
| **MITRE** | `GET` | `/api/v1/mitre/techniques` | Browse mapped MITRE ATT&CK techniques |
| **MITRE** | `GET` | `/api/v1/mitre/heatmap` | Retrieve detection coverage matrix |
| **Playbooks** | `POST` | `/api/v1/playbooks/execute` | Execute or dry-run automated response action |
| **AI Copilot** | `POST` | `/api/v1/chatbot/soc` | Specialized SOC analyst AI consultation |
| **Reports** | `GET` | `/api/v1/reports/soc` | Generate executive PDF security report |
| **System** | `GET` | `/api/v1/system/health` | Health check for collectors and event pipeline |

---

## 👥 Role-Based Access Control (RBAC)

KAVACH strictly enforces role-based boundaries:

| Permission / Capability | 🛡️ SOC Analyst | 👤 Layman User |
|-------------------------|:-------------:|:-------------:|
| View Live Threat Telemetry | ✅ | ❌ |
| Run Remediation Playbooks | ✅ | ❌ |
| MITRE ATT&CK Matrix & Heatmap | ✅ | ❌ |
| Manage Collectors & Pipeline | ✅ | ❌ |
| Trigger Quarantine & Isolation | ✅ | ❌ |
| Personal Security Alerts & Tips | ✅ | ✅ |
| System Health Status | ✅ | ✅ |
| Conversational AI Assistance | ✅ (SOC Mode) | ✅ (Advisory Mode) |

---

## 📄 License

Proprietary — All rights reserved by **KAVACH Security Platform**.
