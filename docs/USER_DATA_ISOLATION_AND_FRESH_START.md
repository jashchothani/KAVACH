# KAVACH 2.1.0 — User Data Isolation, Tenant Scoping & Fresh-Start Specification

**Document ID:** KAV-ENG-2026-P0-04  
**Target Release:** KAVACH 2.1.0  
**Classification:** Sovereign Security & Data Protection Specification  
**Author:** Cybersecurity & DevSecOps Lead  
**Status:** IMPLEMENTED & ENFORCED  

---

## 1. Objective

Every KAVACH deployment, installation, and user session must be strictly isolated. A newly registered user or fresh workstation installation must never observe another account's historical security telemetry, incidents, alerts, device credentials, AI conversations, or configuration.

Multi-tenant data isolation is enforced at the backend REST router, ORM repository, and database query layers—not solely in UI client filters.

---

## 2. Server-Enforced Isolation Architecture

### 2.1 Dashboard Summary & Score Scoping
In `backend/app/api/v1/router.py` (`get_dashboard_summary`):
- Decodes the caller's JWT token payload via `decode_access_token`.
- Evaluates the user's role:
  - If the user is an **ordinary user** (not `admin` and not `analyst`):
    1. Queries devices explicitly enrolled under `Device.enrolled_user_id == user.sub`.
    2. Limits `alert_count`, `critical_alerts`, and `active_threats` to those matching the user's enrolled device IDs.
    3. Scopes `open_incidents` exclusively to incidents tied to their devices.
    4. Fetches `recent_alerts` strictly through `AlertRepository.get_for_devices(user_dev_ids)`.
    5. A new account with zero enrolled devices sees: 0 devices, 0 alerts, 0 active threats, and 0 incidents.
  - If the user is an **administrator** or **SOC analyst**:
    Accesses organization-wide fleet metrics with administrative audit tracking.

### 2.2 Incident & Telemetry Scoping
In `backend/app/api/v1/router.py` (`get_incidents`):
- Non-elevated accounts retrieve incidents through `IncidentRepository.get_for_devices(user_dev_ids)`.
- Direct ID manipulation in URL parameters cannot return another user's incident records; unauthorized queries return empty or HTTP 403 Forbidden.

### 2.3 Device Credential & Identity Ownership
- `DeviceCredential` records store `user_id` and `device_id`.
- Revocation (`POST /api/v1/enrollment/revoke/{device_id}`) verifies that the requesting user owns the device credential or possesses administrative clearance.
- Token rotation requires knowledge of the active hardware token hash and device ID.

### 2.4 Embedded Raksha AI Privacy & Context Isolation
- Context building for AI queries (`POST /raksha/chat`, `POST /raksha/explain-alert`) is scoped strictly to the authenticated user's active session.
- Prompts never ingest another user's telemetry, logs, or unowned incidents.
- All secrets, tokens, and DPAPI keys are redacted before context assembly.

---

## 3. Fresh-Start & Installation Behavior

| Lifecycle Event | State Management Behavior |
| :--- | :--- |
| **Fresh Clean Install** | Database initialized with system schemas; no demo data populated; onboarding wizard displayed. |
| **New User Registration** | Account enters `PENDING_EMAIL_VERIFICATION` → `REQUESTED` → `ADMIN_APPROVED`. Zero historical telemetry visible. |
| **User Sign Out** | In-memory tokens, session state, unread notifications, and active WebSocket subscriptions terminated and cleared. |
| **Account Switching** | Client-side `localStorage` cleared of prior user tokens; fresh JWT issued; dashboard fully re-rendered for new identity. |
| **Upgrade / Reinstall** | Existing valid user credentials and DPAPI keys preserved; database migrations applied cleanly without resetting legitimate history. |

---

## 4. Verification

- Integration tests confirm that registering a secondary user account and querying `/dashboard/summary` and `/incidents` returns zero records from primary user workstations.
- Tampered request headers or device IDs fail authorization checks.
