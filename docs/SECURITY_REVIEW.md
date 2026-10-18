# KAVACH — Security Review & Threat Model

**Document Version:** 1.0.0  
**Classification:** Internal Security Review  
**Date:** 2026-10-15  
**Reviewer:** Lead Cybersecurity & DevSecOps Engineer

---

## 1. Threat Modeling (STRIDE Analysis)

| Threat Category | Potential Attack Vector | KAVACH Countermeasure & Defense Architecture |
| :--- | :--- | :--- |
| **Spoofing** | Rogue endpoint submitting false telemetry or spoofing legitimate host ID | Cryptographic device enrollment; host fingerprint hashing; private keys sealed in Windows DPAPI; single-use nonces; signed request tokens. |
| **Tampering** | Telemetry payload modification in transit or offline queue alteration | TLS 1.3 encryption on transport; SHA-256 event fingerprinting; SQLite WAL integrity checksums; read-only token permissions. |
| **Repudiation** | User or Analyst denying authorized actions or approval decisions | Strict immutable `AuditLog` records storing actor ID, role, action, target, timestamp, and IP address for all account lifecycle and SOAR operations. |
| **Information Disclosure** | Leakage of corporate credentials, PII, or monitored file contents in telemetry | Strict sanitization layer redacting passwords, tokens, API keys, and Authorization headers before ingestion; FIM hashes only without shipping bulk file contents. |
| **Denial of Service** | Telemetry flooding from noisy sensors or malicious loops | Multi-level rate limiting (SlowAPI 60 req/min/IP); MD5 time-windowed deduplication; bounded in-memory ring buffers; bounded SQLite spooling (200MB max). |
| **Elevation of Privilege** | Self-assignment of `ADMIN` or `SOC_ANALYST` role; unauthorized approval bypass | Server-side RBAC dependencies (`require_admin`, `require_analyst`); strict state transition validation (`REQUESTED` cannot jump to `ACTIVE` without admin and analyst steps). |

---

## 2. Secrets Management & Credential Security

### 2.1 Findings & Remediation

1. **Local `.env` and `backend/.env` Credential Storage**:
   - *Status*: Validated that `.env` files are not tracked in Git.
   - *Risk*: Risk of accidental inclusion in public repositories or installer builds.
   - *Remediation*:
     - Root and backend `.gitignore` updated to strictly exclude `.env`, `.env.*` (except `.env.example`), `*.key`, `*.pem`, `*.db`.
     - Documented secret rotation guidelines in `docs/SECURITY_REVIEW.md`.
     - AWS Deployment utilizes AWS Secrets Manager and IAM Task Roles, avoiding hardcoded environmental secrets.

2. **Default Cryptographic Keys in Development**:
   - Development settings use fallback keys for rapid local onboarding.
   - *Production Guard*: System enforces a startup check in production environments (`ENVIRONMENT=production`) that terminates the application if `SECRET_KEY` or `JWT_SECRET` matches development defaults or is shorter than 32 characters.

3. **Device Secrets**:
   - Device keys are generated locally on the endpoint using Python's `cryptography` library.
   - Private keys are encrypted using Windows Data Protection API (DPAPI) tied to the current machine and user context (`CryptProtectData`).
   - Server stores only the public key.

---

## 3. Account Lifecycle & Approval Security

1. **Zero Self-Activation**:
   - No public endpoint allows setting `is_active=True` or `role="admin"`.
   - Registration creates an account in `REQUESTED` status with zero system permissions.
2. **Dual-Gate Approval**:
   - Step 1: Admin verifies organizational identity and assigns `USER` role (`ADMIN_APPROVED`).
   - Step 2: Eligible SOC Analyst verifies technical profile and authorizes activation (`ACTIVE`).
   - Analysts cannot activate their own accounts.
3. **MFA Enforcement**:
   - Time-based One-Time Password (TOTP, RFC 6238) supported with QR code provisioning and single-use recovery codes.
   - Failed login attempts trigger automatic lockout after 5 consecutive failures.

---

## 4. Privacy & Data Minimization

- Telemetry collection is focused strictly on cybersecurity observables (processes, connections, hashes, event logs).
- No personal documents, browser browsing histories, or sensitive keystrokes are harvested.
- Directory monitoring is bounded to configured critical directories (`monitored/`, `canary/`).
- Retention policies allow automated purging of resolved telemetry events older than 90 days.
