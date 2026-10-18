# KAVACH — System Architecture and Authoritative Product Flow

**Document ID:** KAV-ENG-2026-SYSFLOW-01
**Version:** 2.1.0
**Date:** 2026-10-17
**Status:** AUTHORITATIVE — BASED ON LIVE CODE INSPECTION

---

## 1. Overview

KAVACH is an AI-Driven SOAR-XDR Threat Intelligence and Response Platform.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| FastAPI Backend | Python 3.12, SQLAlchemy 2.0, SQLite | REST API, WebSocket, ML pipeline |
| kavach-frontend (Web) | HTML/CSS/JS (Zero-build) | Public site, user/SOC/admin dashboards |
| frontend/ (React/Vite) | React 18, TypeScript, Vite | Secondary React SOC dashboard |
| Windows Companion | Python 3.12, Tkinter | Desktop GUI with DPAPI device identity |
| Windows Service | Python 3.12 | Background 16-sensor telemetry collector |
| Tray Companion | Python 3.12, pystray | Windows system-tray status indicator |
| Flutter Desktop | Flutter 3.x, Dart | Cross-platform Windows/Mobile app |
| Collector Agent | Python 3.12 | Standalone background telemetry shipper |
| Installer | Inno Setup 6 | Windows installer |

---

## 2. Authoritative Backend Entry Points

- **Production:** `backend/main.py` -> `backend/app/main.py:create_app()`
- **ASGI:** `uvicorn app.main:app` (module-level `app = create_app()`)
- **Database:** SQLite at `data/database/kavach.db` (default)
- **Frontend served:** `kavach-frontend/` directory at `/`

---

## 3. End-to-End Flows

### Flow A — Installation

1. User runs KAVACH-Setup-2.1.0.exe (requires UAC/Admin)
2. Inno Setup extracts: backend/, kavach-frontend/, assets/, desktop/ (Flutter exe)
3. Registers Windows Service: `service.py --startup auto install`
4. Starts service, launches tray companion, opens companion GUI
5. First-run: companion defaults to `http://127.0.0.1:8000`

**Gap:** Backend (main.py) is NOT started as a service — user must run it separately.

### Flow B — New User Onboarding

1. User visits index.html -> clicks Login/Register
2. POST /api/v1/auth/register -> JWT token + email verification OTP sent
3. POST /api/v1/auth/verify-email (OTP) -> email verified
4. POST /api/v1/auth/login-init -> 2FA OTP sent
5. POST /api/v1/auth/2fa/verify -> JWT access token
6. Role dispatch: layman_user -> user.html, soc_analyst -> soc.html, admin -> admin.html

### Flow C — Device Enrollment

1. Companion: DeviceIdentityManager.is_enrolled() -> false -> show enrollment UI
2. User clicks enroll -> RSA-2048 keypair generated locally
3. POST /api/v1/enrollment/challenge (JWT auth) -> nonce (5 min TTL)
4. Companion: sign nonce with RSA-PSS-SHA256 private key
5. POST /api/v1/enrollment/verify (nonce + signature + public_key_pem + hostname)
6. Backend: verify RSA signature, create Device + DeviceCredential records
7. Response: device_id + device_token (90-day validity)
8. Companion: save to %LOCALAPPDATA%\kavach\device_identity.enc (DPAPI-encrypted)

**Status:** Previously broken (HTTP 422 on empty challenge body). Fixed by making ChallengeRequest body optional and adding field normalization in VerifyEnrollmentRequest.

### Flow D — Telemetry and Detection

1. KavachAgentService: 16 collectors (process, network, DNS, filesystem, registry, auth...)
2. EdgeClassifier: tier classification (Critical/High/Medium/Low/Statistical)
3. ResilientSpooler: write to SQLite WAL spool
4. ShipperClient: POST /api/v1/telemetry/ingest (X-Device-ID + X-Device-Token)
5. Backend: authenticate device -> CentralPipelineManager.ingest
6. Normalization -> IsolationForest ML scoring -> Alert creation
7. WebSocket broadcast -> soc.html / user.html

### Flow E — Security Response

1. SOC Analyst: POST /api/v1/soar/execute (requires SOC_ANALYST or ADMIN role)
2. Backend: dry_run check, PlaybookExecutionRepository log
3. Playbook steps: PENDING -> RUNNING -> SUCCESS/FAILED
4. AuditLog entry created
5. SOC UI shows real playbook state (not optimistic)

### Flow F — UI Authentication

1. Backend routes: /dashboard -> user.html (with role redirect for admin/SOC)
2. JWT stored in localStorage, sent as Authorization: Bearer header
3. Logout: clear localStorage, redirect to /login

### Flow G — Offline Operation

1. ShipperClient: connection refused -> spooler continues writing locally
2. Companion UI: shows offline status
3. Reconnection: flush spool in batches -> ACK -> delete from spool

---

## 4. Two Frontend Architectures

### kavach-frontend/ (PRIMARY — Production)
- Pure HTML/CSS/JS, served by FastAPI at port 8000
- Pages: index.html, login.html, user.html, soc.html, admin.html
- Packaged in installer

### frontend/ (SECONDARY — Development only)
- React 18 + TypeScript, served by Vite at port 5173
- Contains advanced SOC modules not in kavach-frontend
- NOT packaged in installer

---

## 5. Database Models

Source: backend/app/database/models.py

- User: id, username, email, role, status, totp_secret
- Device: id, hostname, enrolled_user_id, enrollment_status, public_key
- EnrollmentChallenge: nonce, user_id, expires_at, is_used
- DeviceCredential: device_id, device_token_hash, is_revoked, expires_at
- SecurityEvent, Alert, Incident, AuditLog, MLModelMeta, PlaybookExecution

---

## 6. Known Issues (As-Found)

| Issue | Location | Severity |
| :--- | :--- | :--- |
| Real API keys in .env committed to repo | backend/.env | CRITICAL |
| enrollment_service.py references platform.system() without import | enrollment_service.py L158 | HIGH |
| Backend not auto-started as service in installer | installer.iss | HIGH |
| JWT secrets are weak dev defaults | backend/.env | HIGH |
| Two conflicting frontend architectures | kavach-frontend/ vs frontend/ | HIGH |
| Companion hardcodes localhost:8000 default | companion.py L141 | MEDIUM |
| In-memory rate limit not multi-worker safe | api/app.py | MEDIUM |

---

## 7. Startup Sequence

### Development
```
python backend/main.py          # API on :8000
npm run dev (in frontend/)      # React on :5173 (optional)
python backend/app/agent/companion.py   # Windows companion
```

### Installed
```
Windows Service (service.py) auto-starts on boot (telemetry collectors only)
Tray companion (tray_companion.py) auto-starts on login
User opens companion shortcut (companion.py)
Backend (main.py) must be started separately
```
