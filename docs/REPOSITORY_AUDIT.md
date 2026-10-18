# KAVACH — Comprehensive Repository Audit

**Date:** 2026-10-15  
**Version Audited:** KAVACH 2.1.0-Enterprise  
**Auditor:** Principal Software Architect & DevSecOps Engineer

---

## 1. Executive Summary

KAVACH is an AI-driven, sovereign cybersecurity platform integrating Endpoint Detection & Response (EDR/XDR), Security Orchestration, Automation and Response (SOAR), Machine Learning anomaly detection (Isolation Forest), hybrid risk scoring, and Raksha AI threat explanation.

This audit establishes the baseline of all components, entry points, dependencies, redundant artifacts, existing security posture, and identified defects before any structural consolidation or feature enhancement.

---

## 2. Repository Structure & Component Inventory

### 2.1 Root Directory (`c:\KAVACH`)
- **`backend/`**: Core Python ASGI server (FastAPI), telemetry collectors, ML engine, rules, database layer, Raksha AI, and SOAR execution engine.
- **`kavach-frontend/`**: Zero-dependency pure HTML5/CSS3/JavaScript web interface with modern crimson-accented design system, serving user security shield, SOC analyst console, and administrator portal.
- **`frontend/`**: React 18 + Vite + TypeScript web application with Three.js WebGL visualization capabilities.
- **`scripts/`**: Orchestration and runner scripts:
  - `start_backend.py`: Launches standalone FastAPI backend on port 8000.
  - `start_frontend.py`: Multi-threaded Python server hosting `kavach-frontend` on port 5173 with clean URLs and `/api/` reverse-proxying.
- **`data/`**: Runtime storage containing:
  - `database/kavach.db` (94MB SQLite database with active tables, WAL logs, telemetry records, and alerts).
  - `database/kavach.db.bak` (Verified safety backup).
  - `models/`: ML serialized models (`isolation_forest.joblib`, `feature_scaler.joblib`).
  - `logs/`: Application, collector, and pipeline audit logs.
- **`mobile/`**: Legacy Flutter codebase (deleted in working tree; mobile functionality is superseded by the Windows Companion Agent and responsive web UI).
- **`ref_repos/`**: External reference repositories (`NetworkFlows`, `SOC`) for algorithm reference.
- **`new/`**: Incomplete scratch folder containing partial React files (`new/frontend/src/pages/public/Home.tsx`, `new/frontend/src/theme/theme.ts`).
- **Root archives**: `Kavach-updated.zip`, `Kavach.zip`, `kavachf.zip` (legacy zip archives).
- **Root scratch scripts**: `test_posture_fn.py`, `test_posture_urls.py`.

---

## 3. Application Entry Points & Startup Commands

| Entry Point | Technology | Default Port | Command / Invocation | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Unified Launcher** | Windows Batch | Multi-port | `start_all_servers.bat` | Launches backend and frontend in separate consoles |
| **PowerShell Launcher** | PowerShell | Multi-port | `start_all_servers.ps1` | Launches FastAPI backend and clean-URL frontend runner |
| **Backend API Server** | FastAPI / Uvicorn | 8000 | `cd backend; python main.py` or `python -m uvicorn app.main:create_app --factory --port 8000` | REST API, WebSockets, Collectors, Detection Engine |
| **Clean-URL Frontend** | Python / HTTP | 5173 | `python scripts/start_frontend.py` | Hosts `kavach-frontend/` with clean URL rewrites and `/api/` proxy |
| **React/Vite Dev App** | React / Vite | 5173 | `cd frontend; npm run dev` | Alternate TypeScript React UI with Three.js |
| **Collector Agent** | Python / Windows | Background | `cd backend; python collector_agent.py --server http://127.0.0.1:8000` | Standalone endpoint sensor shipper with local SQLite spool |

---

## 4. Dependency Mapping

### Backend (`backend/requirements.txt`)
- **Web & API**: `fastapi>=0.110.0`, `uvicorn[standard]>=0.28.0`, `starlette>=0.36.0`, `pydantic>=2.6.0`, `pydantic-settings>=2.2.0`, `python-multipart>=0.0.9`.
- **Database & ORM**: `sqlalchemy>=2.0.28`, `aiosqlite>=0.20.0`, `asyncpg>=0.29.0` (ready for PostgreSQL).
- **Security & Auth**: `pyjwt>=2.8.0`, `passlib[bcrypt]>=1.7.4`, `bcrypt>=4.1.2`, `pyotp>=2.9.0`, `cryptography>=42.0.0`.
- **Telemetry & OS**: `psutil>=5.9.8`, `watchdog>=4.0.0`.
- **ML & Data Science**: `scikit-learn>=1.4.1.post1`, `numpy>=1.26.4`, `joblib>=1.3.2`.
- **Networking & Clients**: `httpx>=0.27.0`, `aiohttp>=3.9.3`, `requests>=2.31.0`.

### Frontend (`frontend/package.json`)
- React 18.2.0, Lucide-React, Three.js, React-Router-DOM 6.22, Axios, TailwindCSS.

### Standalone Portal (`kavach-frontend/`)
- Zero external package dependencies; relies on pure HTML5, CSS3 Custom Properties (Design System), Vanilla JavaScript ES6, and modern browser APIs (Fetch, WebSockets).

---

## 5. Architectural Duplications & Inconsistencies

1. **`backend/` vs `backend/app/` Module Duplication**:
   - `backend/database/` vs `backend/app/database/`: `backend/app/database/models.py` is the modern 20KB SQLAlchemy 2.0 implementation; `backend/database/` contains a 14KB earlier revision.
   - `backend/api/` vs `backend/app/api/`: `backend/app/api/v1/router.py` is the complete 111KB router; `backend/api/v1/router.py` is a 47KB legacy router.
   - `backend/collectors/` vs `backend/app/collectors/`: `backend/app/collectors/` has stubs importing from `collectors/`.
   - Resolution: Consolidate all canonical models, pipelines, and routers into `backend/app/` while maintaining shims in top-level `backend/` for backward compatibility with legacy test scripts.

2. **Frontend Dual-Stack**:
   - Both `kavach-frontend/` (pure HTML/CSS/JS) and `frontend/` (React/Vite) exist.
   - `scripts/start_frontend.py` actively serves `kavach-frontend/` and FastAPI mounts it at `/`.
   - Both must be kept fully functional, with `kavach-frontend/` serving as the zero-dependency cloud-ready portal.

---

## 6. Security & Credential Audit

1. **Exposed Credentials in `.env` and `backend/.env`**:
   - `NVIDIA_NIM_API_KEY` (present in both root `.env` and `backend/.env`).
   - `GEMINI_API_KEY` (present in `backend/.env`).
   - `VIRUSTOTAL_API_KEY`, `ABUSEIPDB_API_KEY`, `OTX_API_KEY`.
   - `RESEND_API_KEY`, `SMTP_PASSWORD` (`pbsugwsmyxvkhavw`).
   - *Verification*: Git history checked via `git log -S`; verified that secrets were not committed to public git history.
   - *Mitigation*: Ensure `.gitignore` explicitly prevents `.env` and all credential stores from being tracked; update `.env.example` with comprehensive dummy configurations; configure environment variable overrides.

2. **Default Secrets in Code**:
   - Default fallback `SECRET_KEY` and `JWT_SECRET` in `backend/app/core/config.py`.
   - Hardcoded `kavach_agent_default_secret` in `collector_agent.py`.
   - *Mitigation*: Implement dynamic cryptographically secure generation in DPAPI-protected store and require real tokens for enrollment.

---

## 7. Baseline Test Execution Results

- **Executed**: `pytest backend/tests -v`
- **Total Tests**: 46
- **Passed**: 45
- **Failed**: 1 (`test_pipeline_manager_json_logs_written` due to `CentralPipelineManager.process_event` attribute missing; resolved via alias to `process_priority_event`).
- **Pass Rate**: 97.8%

---

## 8. Checkpoint & Backup Verification

- Git Branch: `backup/pre-master-cleanup` created at commit `3edc62c`.
- Database Backup: `data/database/kavach.db.bak` created (94MB verified).
- Production database integrity verified intact.
