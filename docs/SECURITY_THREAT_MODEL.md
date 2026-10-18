# KAVACH — Enterprise Threat Model & Security Architecture

**Document Version:** 1.0.0  
**Classification:** Defensive Security Architecture  
**Standard:** STRIDE & OWASP ASVS Level 2 / OWASP Top 10 API Security

---

## 1. System Assets & Trust Boundaries

```
[Untrusted World / Internet]
       │
═══════╪══════════════════════════════════════════════════════════════════════ [Boundary 1: Cloud Gateway]
       │ TLS 1.3 / Reverse Proxy / Rate Limiter
       ▼
[KAVACH FastAPI Backend] ─── RBAC Engine / Service Layer
       │
═══════╪══════════════════════════════════════════════════════════════════════ [Boundary 2: Storage & Secrets]
       │ SQLAlchemy ORM / Scoped Credentials
       ▼
[Database (SQLite/Postgres) & AWS SNS/SES]

-------------------------------------------------------------------------------
[Windows Monitored Endpoint]
       │
       ├─ [Session 0: Background Service `KavachAgentService`] (High Privilege)
       │         │
═══════╪═════════╪════════════════════════════════════════════════════════════ [Boundary 3: Local IPC / ACL]
       │         │ IPC Loopback / File Spool
       │         ▼
       ├─ [Session 1+: Desktop Companion (Flutter / GUI)] (Standard User Privilege)
       │         │
═══════╪═════════╪════════════════════════════════════════════════════════════ [Boundary 4: Hardware Cryptography]
       │         │ CryptProtectData / TPM
       │         ▼
       └─ [Windows DPAPI Keyring & RSA-2048 Keypair Store]
```

---

## 2. STRIDE Threat Analysis & Defensive Controls

### 2.1 Spoofing Identity

| Threat Scenario | Vector | Mitigation Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Agent Telemetry Spoofing** | Adversary submits falsified telemetry pretending to be a legit workstation. | Endpoints must enroll via RSA-2048 keypair. Server issues 64-char single-use cryptographic nonces. Ingest requires `X-Device-ID` and `X-Device-Token` hashed with SHA-256. | Tested in `test_device_enrollment.py` (replay attack & invalid token rejection). |
| **User Role Impersonation** | Attacker tampers with client-side JWT claims or payload to claim `admin` or `soc_analyst`. | Server issues digitally signed HMAC-SHA256 JWTs. Role, permissions, and status are validated on every endpoint via FastAPI dependencies (`require_admin`, `require_analyst`). | Tested in `test_account_lifecycle.py` (`test_admin_and_analyst_access_control`). |

### 2.2 Tampering with Data

| Threat Scenario | Vector | Mitigation Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Local Private Key Theft** | Malware extracts RSA private key from endpoint disk. | Private keys are never stored in plaintext. Keys are encrypted via Windows Data Protection API (`CryptProtectData`) bound to user/machine entropy. | Tested in `test_device_enrollment.py` (`test_dpapi_and_keypair_crypto`). |
| **Telemetry In-Transit Modification** | Man-in-the-Middle modifies event severity or removes IoCs. | TLS 1.3 mandatory for all remote traffic. Certificates verified against trusted root authorities. Ingest payloads validated against strict Pydantic schemas. | Enforced in `app/api/v1/telemetry.py` and `ShipperClient`. |

### 2.3 Repudiation

| Threat Scenario | Vector | Mitigation Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Analyst Denies Containment Action** | Disgruntled analyst isolates critical server and denies taking the action. | All privileged actions generate immutable `AuditLog` records containing actor ID, role, client IP, target host, timestamp, and action details. | Tested in `test_account_lifecycle.py` and `test_audit.py`. |

### 2.4 Information Disclosure

| Threat Scenario | Vector | Mitigation Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Credential Leakage in Logs** | AWS access keys, passwords, or device tokens printed to application logs. | Custom log formatter redacts sensitive tokens, passwords, and private keys. Environment secrets never exposed via API endpoints. | Verified in `app/core/logging.py` secret scrubbing filters. |
| **Cross-Tenant Telemetry Leak** | Standard user accesses fleet telemetry belonging to other users. | Fleet views and tenant queries strictly scoped by user ownership and organization ID. Regular users can only query their own enrolled devices. | Tested in `test_account_lifecycle.py` (`test_role_hierarchy_and_permissions`). |

### 2.5 Denial of Service (DoS)

| Threat Scenario | Vector | Mitigation Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Endpoint Spool Disk Exhaustion** | Network outage causes endless event buffering until endpoint disk fills. | Spooler uses a bounded SQLite circular buffer (max 200MB). When quota is reached, lowest priority events (P4/P5) are dropped FIFO to preserve critical P1/P2 events. | Tested in `test_windows_companion.py` (`test_spooler_prioritized_dequeue`). |
| **Ingestion Pipeline Overload** | Distributed flood of telemetry events overwhelms server workers. | Dual queue architecture: dedicated Priority Queue (10k items, 4 workers) and Background Queue (30k items, 6 workers). Deduplication window drops identical repeating events. | Tested in `test_phase3_analysis_pipeline.py`. |

### 2.6 Elevation of Privilege

| Threat Scenario | Vector | Mitigation Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Self-Approval of Accounts** | Regular user attempts to transition their account from `REQUESTED` to `ACTIVE`. | State machine transitions strictly validated on server. Only users with `ADMIN` role can approve; only assigned `SOC_ANALYST` can activate after admin approval. | Tested in `test_account_lifecycle.py` (`test_full_account_approval_lifecycle`). |
| **Interactive UI Privilege Escalation** | Companion UI runs as administrator and exposes unquoted service paths. | Companion GUI runs with standard user tokens in Session 1. Background service in Session 0 executes only strictly registered playbooks with zero shell expansion. | Architecture verified in `backend/app/agent/service.py`. |

---

## 3. Specialized AI & Web Security Defenses

### 3.1 Prompt Injection Protection (Raksha AI)
1. **Advisory-Only Architecture:** Raksha AI is an assistive analyst tool, never an autonomous decision-maker. It has zero capability to trigger destructive actions or override security policies.
2. **Context Sanitization:** Telemetry context is stripped of authentication credentials, private keys, and user PII before dispatch to the language model.
3. **Local Fallback Mode:** If the external LLM provider fails, times out, or returns invalid responses, the system gracefully falls back to deterministic local rule explanations.

### 3.2 Server-Side Request Forgery (SSRF) Defense (URL Scanner)
1. **Private Range Rejection:** Blocks RFC 1918 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`), and link-local (`169.254.0.0/16`).
2. **Cloud Metadata Protection:** Explicit block on AWS/GCP/Azure instance metadata endpoints (`http://169.254.169.254/`).
3. **Punycode & Homograph Detection:** Decodes IDN domains to detect deceptive Cyrillic/Greek character substitution designed to mimic legitimate enterprise domains.
