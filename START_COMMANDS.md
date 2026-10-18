# 🚀 KAVACH Server Startup Guide

This document contains all the commands to start and run the **KAVACH** platform (Backend, Frontend, and Mobile).

---

## ⚡ Quick 1-Click Start (Windows)

You can double-click **`start_all_servers.bat`** in the root directory `c:\Kavach\start_all_servers.bat` to launch both the **Backend** and **Frontend** servers in separate terminal windows automatically.

---

## 🛠️ Manual Startup Instructions

### 1. 🐍 Backend API Server (FastAPI / Python)

Open a terminal (PowerShell or Command Prompt) and run:

```bash
# Navigate to backend directory
cd c:\Kavach\backend

# Option A: Run directly using the virtual environment python
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

# Option B: Activate venv first, then run
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

- **API Base URL:** `http://localhost:8000`
- **Swagger Interactive API Docs:** `http://localhost:8000/docs`
- **ReDoc API Documentation:** `http://localhost:8000/redoc`
- **WebSocket Endpoint:** `ws://localhost:8000/ws`

---

### 2. 🛡️ KAVACH Web Dashboards (HTML/CSS/JS)

```bash
# Option A: 1-click batch launcher
start_frontend.bat

# Option B: Run via Python HTTP server
.\backend\.venv\Scripts\python.exe -m http.server 5173 --directory kavach-frontend
```

- **User Dashboard:** `http://localhost:5173/dashboard.html`
- **SOC Analyst Console:** `http://localhost:5173/soc.html`
- **Admin Governance Console:** `http://localhost:5173/admin.html`
- **Brand Landing Portal:** `http://localhost:5173/index.html`

---

### 3. 🖥️ Windows Companion Desktop Application

```bash
# Option A: 1-click batch launcher
start_companion.bat

# Option B: Direct Python execution
.\backend\.venv\Scripts\python.exe backend\app\agent\companion.py
```

- **Features:** One-Click Shield toggle, DPAPI Device Enrollment wizard, Account Access Request form, live sensor health for all 16 telemetry collectors, and spool buffer telemetry.

---

### 4. 🔕 Windows System Tray Guardian

```bash
# Option A: 1-click batch launcher
start_tray.bat

# Option B: Direct Python execution
.\backend\.venv\Scripts\pythonw.exe backend\app\agent\tray_companion.py
```

- **Features:** Native Windows Shell NotifyIcon, dynamic shield status badge, balloon notifications for critical security events, and right-click context menu.

---

### 5. ⚙️ Endpoint Agent Telemetry Service

```bash
# Option A: 1-click batch launcher
start_agent_service.bat

# Option B: Direct Python execution
.\backend\.venv\Scripts\python.exe backend\app\agent\service.py
```

- **Features:** Background collector orchestrator, 5-tier edge severity classification, disk-backed SQLite resilient spooling, and HTTPS batch shipper with DPAPI credentials.

---

## 📋 Summary of Ports & URLs

| Service | Technology | Port / URL | Notes |
| :--- | :--- | :--- | :--- |
| **User Dashboard** | HTML5 / Vanilla CSS | `http://localhost:5173/dashboard.html` | End-user posture, alerts & link scanner |
| **SOC Analyst Console** | HTML5 / Vanilla CSS | `http://localhost:5173/soc.html` | SOC triage, playbooks & approval queue |
| **Admin Console** | HTML5 / Vanilla CSS | `http://localhost:5173/admin.html` | User governance, fleet & analyst allocation |
| **Backend API** | FastAPI + Uvicorn | `http://localhost:8000` | REST API, Ingestion Gateway & Models |
| **API Documentation** | Swagger UI | `http://localhost:8000/docs` | Interactive OpenAPI Testing |
| **WebSocket Stream** | FastAPI WebSockets | `ws://localhost:8000/ws` | Real-time Threat Broadcasts |
| **Windows Companion** | Python Tkinter (Native) | Desktop Application | One-Click Shield, DPAPI Enrollment & Health |
| **System Tray Guardian** | pywin32 Shell NotifyIcon | Notification Area | Balloon Alerts & Background Status |

---

## 🔧 Troubleshooting

- **Port 8000 already in use?**
  ```powershell
  # Check process using port 8000
  Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
  # Kill process if necessary
  Stop-Process -Id <PID> -Force
  ```
- **Port 5173 already in use?**
  Vite will automatically fall back to `http://localhost:5174`.
- **Node modules missing?**
  Run `npm install` inside `c:\Kavach\frontend`.
- **Python packages missing?**
  Run `c:\Kavach\backend\.venv\Scripts\pip.exe install -r requirements.txt`.
