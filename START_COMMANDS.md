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

### 2. ⚛️ Frontend Web Application (React / Vite / Three.js)

Open a second terminal and run:

```bash
# Navigate to frontend directory
cd c:\Kavach\frontend

# Start Vite Development Server
npm run dev
```

- **Frontend Web App URL:** `http://localhost:5173`
- **3D Showcase Experience:** `http://localhost:5173/showcase`
- **Public Brand Portal:** `http://localhost:5173/`
- **SOC Dashboard:** `http://localhost:5173/login`

> **Note:** To build the production bundle, run `npm run build`.

---

### 3. 📱 Mobile Application (Flutter - Optional)

If running the Flutter mobile application:

```bash
# Navigate to mobile directory
cd c:\Kavach\mobile

# Get Flutter dependencies
flutter pub get

# Run on connected device or emulator
flutter run
```

---

## 📋 Summary of Ports & URLs

| Service | Technology | Port / URL | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 18 + Vite | `http://localhost:5173` | Main Web Application & 3D Showcase |
| **3D Showcase** | Three.js WebGL | `http://localhost:5173/showcase` | 3D Interactive Cyber Threat Crystals |
| **Backend API** | FastAPI + Uvicorn | `http://localhost:8000` | REST API & Threat Telemetry |
| **API Documentation** | Swagger UI | `http://localhost:8000/docs` | Interactive API Testing |
| **WebSocket Stream** | FastAPI WebSockets | `ws://localhost:8000/ws` | Real-time Threat Broadcasts |

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
