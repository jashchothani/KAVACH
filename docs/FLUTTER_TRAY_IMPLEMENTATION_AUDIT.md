# KAVACH 2.1.0 — Flutter, Windows Tray & Telemetry Architecture Audit

**Document ID:** KAV-ENG-2026-FLUTTER-TRAY-AUDIT-01  
**Target Release:** KAVACH 2.1.0  
**Classification:** Systems Architecture, Telemetry Ingestion & Desktop Audit  
**Author:** Principal Platform Architect & Desktop Lead  
**Status:** COMPLETE & AUDITED  

---

## 1. Executive Summary & Component Topology

This audit establishes the end-to-end topology, data flow contracts, component boundaries, and known failure modes across the KAVACH platform.

The system is composed of four distinct operational execution units:
1. **FastAPI Sovereign Backend (`backend/`)**: Port `8000`. Houses versioned REST endpoints (`/api/v1`), real-time WebSocket (`/api/v1/dashboard/live`), Priority Message Broker, Hybrid Risk Engine, Isolation Forest ML anomaly detector, and SQLite/PostgreSQL persistence.
2. **Flutter Native Desktop & Mobile Client (`mobile/`)**: Entry point `mobile/lib/main.dart` compiled via Win32 runner `mobile/windows/runner/main.cpp` into `kavach.exe`. Provides two distinct, server-enforced role experiences: **User Mode** (for ordinary users) and **SOC Analyst Mode** (for security analysts).
3. **Windows System Tray Guardian (`backend/app/agent/tray_companion.py`)**: Launched via `start_tray.bat` (using `pythonw.exe`). Integrates with Windows Shell Notification Area (`Shell_NotifyIcon`) via `pywin32`. Displays compact live posture popup, alerts, and one-click shield status.
4. **Windows Endpoint Collector & Shipper Service (`backend/app/agent/`)**:
   - `service.py`: Windows Service Control Manager daemon running Session 0 / background collector polling 16 native telemetry sensors.
   - `spooler.py`: Prioritized SQLite local spool ring buffer (`agent_spool.db`).
   - `shipper.py`: Asynchronous HTTPS shipper client transmitting batches to `/api/v1/telemetry/ingest` with DPAPI hardware-bound token authentication.
   - `companion.py`: Desktop Tkinter diagnostics companion for manual sensor inspection and key generation.

---

## 2. Process Separation & Executable Inventory

Crucially, **the Flutter Desktop Application, the Windows System Tray Guardian, and the Windows Collector Service are separate processes that communicate through standardized, authorized interfaces**:

| Component | Executable / Entry Point | Runtime Context | Responsibilities | Communication Link |
| :--- | :--- | :--- | :--- | :--- |
| **Flutter App** | `mobile/windows/runner/Release/kavach.exe` | User Desktop (Session 1+) | User Mode & SOC Analyst Mode UI, URL scanner, incident war room | HTTPS REST / WSS to FastAPI (`127.0.0.1:8000`) |
| **System Tray** | `pythonw.exe app/agent/tray_companion.py` | User Desktop (Session 1+) | Shell notification area icon, quick status popup, one-click shield toggle | IPC status file (`data/agent_status.json`) + REST API |
| **Collector Service**| `python.exe app/agent/service.py` | LocalSystem (Session 0) | 16 OS telemetry sensors, spool buffer, background batch shipper | SQLite spool (`agent_spool.db`) -> HTTPS shipper |
| **Companion GUI** | `python.exe app/agent/companion.py` | User Desktop (Session 1+) | Tkinter diagnostic UI, DPAPI key generation, manual token rotation | Direct backend REST + local DPAPI (`identity.py`) |

*Anti-Pattern Guard:* The system tray and Flutter application do **not** run duplicate background collector threads. Only `service.py` / `shipper.py` reads system sensors and ships events to avoid duplicate telemetry or port exhaustion.

---

## 3. End-to-End Data Flow

### 3.1 Telemetry Ingestion Flow (Edge to Cloud/SOC)
```
[16 OS Collectors] (Process, Network, Sysmon, Registry, USB, DNS...)
       │
       ▼ (Event Normalization & Priority Classification)
[Priority Ring Spooler: agent_spool.db] (Offline resilient, bounded)
       │
       ▼ (Asynchronous Batch Upload with DPAPI X-Device-Token)
[ShipperClient] ──HTTPS POST──► [/api/v1/telemetry/ingest]
                                          │
                        (GZip Decompress & Token Auth)
                                          ▼
                      [Pluggable Priority Message Broker]
                                          │
                      ┌───────────────────┴───────────────────┐
                      ▼                                       ▼
        [Hybrid Risk Engine & ML]                [Persistent Storage: kavach.db]
         (Isolation Forest Anomaly)               (SecurityEvent & Incident tables)
                      │                                       │
                      └───────────────────┬───────────────────┘
                                          ▼
                         [WebSocket: /api/v1/dashboard/live]
                                          │
                      ┌───────────────────┴───────────────────┐
                      ▼                                       ▼
       [Flutter User / SOC Dashboard]            [Windows System Tray Status]
```

### 3.2 Command & Response Flow (UI to Action Execution)
```
[User / SOC Analyst Action] (e.g. One-Click Shield / Isolate Device / Detonate URL)
       │
       ▼ (Validated against Authenticated Role & Permissions)
[ApiService (Flutter) / Tray Controller]
       │
       ▼ (Bearer JWT / Session Header)
[FastAPI Backend Endpoint] (e.g. /devices/{id}/isolate or /soar/execute)
       │
       ▼ (Role Authorization Verified via RBAC Middleware)
[Playbook Engine / Agent Command IPC] (Write to data/agent_cmd.json)
       │
       ▼
[Collector Service Agent Execution] (Windows Firewall rule modification)
       │
       ▼
[Audit Log & Incident State Updated] (Hash-chained record in AuditLog table)
       │
       ▼
[Authoritative Response Emitted to UI] (WebSocket event + HTTP 200 payload)
```

---

## 4. Known Failure Modes & Root Cause Diagnoses

### 4.1 FastAPI `starlette.requests.ClientDisconnect` at `/api/v1/telemetry/ingest`
- **Observed Traceback:** `raw_body = await request.body()` throws `ClientDisconnect`.
- **Root Cause:**
  1. `shipper.py` instantiated `httpx.AsyncClient(timeout=10.0)`. A flat 10-second timeout caused client-side timeouts during heavy database sync or network latency spikes, terminating the TCP socket mid-request.
  2. `ingest_telemetry` lacked a `try...except ClientDisconnect` guard around `await request.body()`.
  3. `main.py` lacked a dedicated exception handler for `ClientDisconnect`, causing the exception to fall into `generic_exception_handler` which logged a 500 error and attempted to write a `JSONResponse` to an already-disconnected socket.
- **Remediation Strategy:**
  - Add explicit `try...except ClientDisconnect` in `telemetry.py` returning HTTP 499 (Client Closed Request) without persisting incomplete data.
  - Add `@app.exception_handler(ClientDisconnect)` in `main.py` logging at INFO level without stacktrace.
  - Reconfigure `shipper.py` timeouts with decoupled granular settings (`connect=5.0, read=25.0, write=15.0, pool=10.0`).
  - Implement graceful cancellation during agent shutdown.

### 4.2 Flutter Single Dashboard Lacking Role Separation
- **Observed State:** Flutter desktop had only one `ProtectionDashboardScreen` displaying mixed, simplified cards without distinguishing between an ordinary user and a SOC security analyst.
- **Remediation Strategy:**
  - Rebuild Flutter into two distinct primary experiences:
    - **KAVACH User Mode:** Approachable, plain-English posture, device health, sensor indicators, recent activity, URL scanner, Raksha AI copilot.
    - **KAVACH SOC Analyst Mode:** High-density incident triage, 16-sensor live stream, MITRE ATT&CK mapping, SOAR playbook dispatch, threat intelligence.
  - Role resolution derived strictly from backend JWT (`layman_user` -> User Mode; `soc_analyst` / `analyst` -> SOC Analyst Mode).

### 4.3 Windows System Tray Limitations
- **Observed State:** Clicking the tray icon immediately launched the Tkinter companion window rather than displaying a native compact popup panel.
- **Remediation Strategy:**
  - Modernize `tray_companion.py` with a two-tier interaction model:
    1. **Compact Tray Popup Panel:** Fast, lightweight summary showing connection status, protection health, device ID, spool status, and quick actions.
    2. **Detailed Diagnostic Window:** Detailed view showing sensor health, DPAPI enrollment, and event logs.
  - Ensure single-instance process tracking to prevent duplicate GUI spawns.

---

## 5. Architectural Contracts & Execution Plan

| Phase | Milestone | Primary Files | Verification Target |
| :--- | :--- | :--- | :--- |
| **Phase 2** | Fix `ClientDisconnect` & Telemetry | `telemetry.py`, `main.py`, `shipper.py` | 0 unhandled disconnect exceptions, disconnect regression tests pass |
| **Phase 3** | Reliable Shared Live-Data Layer | `mobile/lib/core/services/api_service.dart` | Real backend integration, auth session, error handling, WebSocket |
| **Phase 4** | Dual Role Experience Architecture | `mobile/lib/core/models/`, `app_router.dart` | Server-enforced role switching between User Mode & SOC Mode |
| **Phase 5** | KAVACH User Mode Implementation | `mobile/lib/screens/user_mode/` | 10 accessible navigation sections, plain-English evidence |
| **Phase 6** | KAVACH SOC Analyst Mode Implementation | `mobile/lib/screens/soc_mode/` | Incident triage, MITRE matrix, SOAR playbooks, live telemetry |
| **Phase 7** | Windows Tray Companion Redesign | `backend/app/agent/tray_companion.py` | Compact status popup + detailed window, zero duplicate collectors |
| **Phase 8** | Motion & Animation System | `mobile/lib/core/theme/`, widgets | Restrained micro-interactions, skeleton loading |
| **Phase 9** | Session Isolation & Fresh Start | `api_service.dart`, state management | Zero cross-account data leakage upon logout |
| **Phase 10**| Performance & Latency Benchmarks | All desktop & backend components | Sub-second shell rendering, bounded query latency |
| **Phase 11**| Regression Testing & Compilation | `pytest`, `flutter test`, `flutter build` | 100% test pass, verified release executable |
| **Phase 12**| Release Certification | `docs/FLUTTER_TRAY_FINAL_VERIFICATION.md` | Complete verified evidence report |
