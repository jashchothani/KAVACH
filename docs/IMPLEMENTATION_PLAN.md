# KAVACH — Enterprise Cyber Defense Platform
## Master Implementation Plan & Execution Checklist

**Document Version:** 3.0.0  
**Classification:** Enterprise Engineering Plan  
**Target Platform:** Windows 10/11 (x64) Endpoint Agent, Flutter Desktop & Mobile, FastAPI Cloud/On-Prem Backend, Web SOC/Admin Console, AWS Integration

---

## 1. Executive Summary & Architecture Strategy

KAVACH is a unified, defense-grade SOAR-XDR Threat Intelligence & Response Platform engineered to operate across hybrid cloud and air-gapped or disconnected Windows endpoints.

The platform consists of:
1. **Windows Endpoint Agent (`backend/app/agent/`)**:
   - 16 native Windows telemetry collectors (Process, Network, Sysmon, Event Log, FIM, USB, PowerShell, Registry, Defender, DNS, etc.).
   - Prioritized SQLite spool buffer with bounded storage and offline resilience.
   - HTTPS shipper client presenting DPAPI-protected, RSA-signed device tokens.
   - Windows Service Control Manager background worker (`KavachAgentService`).
2. **Flutter Desktop & Mobile Suite (`mobile/`)**:
   - Modern light interface with restrained crimson/red accents (`#dc2626`) and optional dark mode.
   - Real-time protection dashboard, live sensor health, URL security checker, Raksha AI assistant.
   - One-Click Shield containment controls with backend authorization verification.
   - Shared API client targeting the canonical FastAPI backend.
3. **FastAPI Sovereign Backend (`backend/`)**:
   - Server-enforced account lifecycle (`PENDING_EMAIL_VERIFICATION` -> `REQUESTED` -> `ADMIN_APPROVED` -> `ANALYST_ASSIGNED` -> `ACTIVE`).
   - Independent zero-trust device enrollment state machine (`NOT_ENROLLED` -> `ENROLLMENT_PENDING` -> `ENROLLED` -> `ACTIVE` -> `REVOKED`).
   - Pluggable 5-tier message broker (Critical, High, Medium, Low, Statistical) and Central Pipeline Manager.
   - Hybrid risk scoring (Rule engine, Isolation Forest ML anomaly detector, Threat intelligence feeds).
   - Enterprise RBAC, audit logging, and automated SOAR response playbooks.
4. **Notification Service Abstraction (`backend/app/services/notification_service.py`)**:
   - Pluggable `NotificationProvider` interface.
   - Local mock/logging provider for zero-cost offline development.
   - AWS SNS & Amazon SES production adapters with bounded exponential backoff retry and secret redaction.
5. **Windows Installer Package (`installer/`)**:
   - Inno Setup compiler (`ISCC.exe`) script producing `release/KAVACH-Setup-<version>.exe`.
   - Windows Service registration, UAC elevation prompt, desktop/start menu shortcuts.
   - Safe upgrade, credential preservation, and clean uninstaller.

---

## 2. Phase-by-Phase Implementation Matrix

| Phase | Description | Key Modules | Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | Repo Discovery, Backup, Baseline | `docs/`, `.env.bak`, `kavach_phase0_backup.db` | **DONE** | 54 pytest tests passed, Flutter 3.44.8 / Dart 3.12.2 / Inno Setup 6.7.3 verified, baseline DBs backed up |
| **Phase 1** | Target Architecture Blueprint | `docs/ARCHITECTURE.md`, `backend/` | **DONE** | Unified data flows, edge-to-cloud schemas, broker QoS design |
| **Phase 2** | Windows Installer Package | `installer/kavach_setup.iss`, `installer/build_installer.bat` | **IN PROGRESS** | Inno Setup 6 compiler integrated, build script verified |
| **Phase 3** | Flutter Desktop Companion | `mobile/`, `mobile/lib/`, `mobile/windows/` | **IN PROGRESS** | Flutter project restored, analyzer passing 0 issues, full screen suite implementation |
| **Phase 4** | Account, Admin & SOC Lifecycle | `backend/app/services/account_service.py`, `backend/app/api/v1/account.py` | **DONE** | Dual-gate approval, least-loaded analyst assignment, tested in `test_account_lifecycle.py` |
| **Phase 5** | Unified Web, Desktop & Mobile UI | `kavach-frontend/`, `mobile/lib/` | **IN PROGRESS** | Modern light/crimson theme, real backend endpoints, live telemetry cards |
| **Phase 6** | Notification Abstraction & AWS | `backend/app/services/notification_service.py`, `backend/tests/` | **IN PROGRESS** | Provider interface, Local Mock, AWS SNS/SES adapters, retry & idempotency |
| **Phase 7** | Endpoint Security & Telemetry | `backend/app/agent/`, `backend/app/collectors/`, `backend/app/pipeline/` | **DONE** | 16 sensors operational, spooler ring buffer, sub-100ms pipeline QoS |
| **Phase 8** | Backend, DPAPI & App Security | `backend/app/agent/identity.py`, `backend/app/services/enrollment_service.py` | **DONE** | DPAPI key encryption, single-use challenge nonces, SSRF homograph filters |
| **Phase 9** | Database & Environment Automation | `backend/app/database/`, `scripts/` | **DONE** | SQLite WAL / PostgreSQL migrations, safe startup scripts, zero secret leakage |
| **Phase 10**| Testing Matrix & Acceptance Gates| `backend/tests/`, `mobile/test/` | **IN PROGRESS** | 54/54 backend tests passed; Flutter widget & unit test suite |
| **Phase 11**| Release Packaging & Manifests | `release/`, `installer/` | **IN PROGRESS** | Installer compilation, checksum generation, release manifest |
| **Phase 12**| Release Documentation & Readiness| `docs/*.md` | **IN PROGRESS** | 6 master documents detailing setup, threat model, operations, and recovery |

---

## 3. Strict Operating Principles
- **No Mock or Fabricated Data:** Telemetry metrics, sensor statuses, and security scores must reflect real operating system observations or explicitly report unavailable.
- **Server-Side Enforcement:** Frontend controls are UI conveniences; all authorization, state transitions, and device quotas are strictly verified on the backend.
- **Zero Incurred AWS Costs:** Default to local mock notification provider; require explicit configuration before activating AWS SNS/SES.
- **Preservation of Working Features:** Maintain backwards compatibility for existing CLI tools, web endpoints, and batch launch scripts.
