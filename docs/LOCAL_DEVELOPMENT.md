# KAVACH Local Development & Engineering Guide

## 1. Environment Requirements

- **Operating System**: Windows 10/11 (Recommended for full DPAPI and Windows sensor testing) or Linux/macOS.
- **Python**: Version 3.12.x.
- **Node.js** (Optional, for web dev tooling): Version 18+.
- **SQLite 3**: Standard built-in library.

---

## 2. Quickstart Setup

### Step 2.1 Clone Repository & Setup Virtual Environment

```cmd
git clone https://github.com/your-org/KAVACH.git C:\KAVACH
cd C:\KAVACH

# Create virtual environment
python -m venv backend\.venv

# Activate virtual environment
.\backend\.venv\Scripts\activate

# Install dependencies
pip install -r backend\requirements.txt
```

### Step 2.2 Configure Local Environment Variables

```cmd
copy .env.example .env
```

Ensure the following local defaults in `.env`:
```ini
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
DB_URL=sqlite+aiosqlite:///data/database/kavach.db
API_HOST=127.0.0.1
API_PORT=8000
SECRET_KEY=kavach-development-secret-key-32-chars-min
JWT_SECRET=kavach-jwt-secret-key-development-32-chars
```

---

## 3. Starting Platform Services

You can start services individually or use the provided orchestration batch scripts:

### Option A: Complete Platform Launcher
```cmd
# Starts Backend API, Central Pipeline, and Web Dashboards
start_all_servers.bat
```

### Option B: Individual Components
```cmd
# 1. Start Backend API & Ingestion Gateway
.\backend\.venv\Scripts\python.exe backend\main.py --host 127.0.0.1 --port 8000

# 2. Start Frontend Web Server (Port 5173)
.\backend\.venv\Scripts\python.exe -m http.server 5173 --directory kavach-frontend

# 3. Start Windows Companion Desktop Interface
.\backend\.venv\Scripts\python.exe backend\app\agent\companion.py

# 4. Start Windows System Tray Guardian
.\backend\.venv\Scripts\python.exe backend\app\agent\tray_companion.py
```

---

## 4. Default Seed Accounts

When the database is initialized, test accounts can be accessed:

| Role | Username | Email | Password | Access Level |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@kavach.io` | `Admin123!` | Full Enterprise Governance & Queue Approval |
| **SOC Lead** | `analyst` | `analyst@kavach.io` | `Analyst123!` | Incident Response, Playbooks, Device Onboarding |
| **Standard User** | `user` | `user@kavach.io` | `User123!` | Host Posture, Device Enrollment, Link Scanner |

---

## 5. Running Automated Tests

```cmd
# Run complete test suite (54 tests)
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/ -v

# Run specific functional domains
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_account_lifecycle.py -v
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_device_enrollment.py -v
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_windows_companion.py -v
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_ml_pipeline.py -v
```
