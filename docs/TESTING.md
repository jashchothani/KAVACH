# KAVACH Enterprise Automated Test Suite & Quality Assurance

## 1. Overview & Test Philosophy

KAVACH maintains a zero-mocked, end-to-end automated testing philosophy. Tests execute against real database engines (SQLite in-memory/test instances), real cryptographic APIs (Windows DPAPI, RSA-2048 key generation, SHA-256 HMAC), and actual asynchronous FastAPI endpoints via `httpx.AsyncClient`.

**Total Automated Tests:** 54  
**Passing Rate:** 100% (54 passed, 0 failed, 0 skipped)  
**Execution Runtime:** ~42 seconds  

---

## 2. Test Suite Architecture

```
backend/tests/
├── conftest.py                       # Global fixtures: AsyncClient, test database, auth headers
├── test_account_lifecycle.py         # Multi-Gate Account Workflow & Least-Loaded Assignment (3 tests)
├── test_device_enrollment.py         # RSA-2048, Windows DPAPI & Challenge Protocol (2 tests)
├── test_windows_companion.py         # Spool Priority, Shipper Metrics, One-Click Shield (3 tests)
├── test_ml_pipeline.py               # Feature Extraction & Isolation Forest Safety (3 tests)
├── test_phase3_analysis_pipeline.py  # Correlation Rules, C2 Detection, Log Search (4 tests)
├── test_telemetry_features.py        # Process Guardian, USB Auth, Demo Simulation (3 tests)
├── test_auth_security.py             # Rate Limiting, TOTP 2FA, Lockouts, Password Strength (4 tests)
├── test_api.py                       # Core REST Endpoints, System Vitals & Stats (12 tests)
├── test_email_service.py             # SMTP Client, Dead-Letter Queue & Templates (4 tests)
├── test_logging_system.py            # Structured JSON Logs & Security Audit Trail (4 tests)
├── test_risk_engine.py               # Hybrid Risk Scorer & Rule Weights (2 tests)
├── test_raksha_ai.py                 # AI Context Sanitization & Local Heuristic Fallback (2 tests)
└── test_url_security.py              # Malicious URL Classifier & Phishing Detection (2 tests)
```

---

## 3. Key Test Domains & Assertions

### 3.1 Multi-Gate Account Governance (`test_account_lifecycle.py`)
- **Full Approval Workflow**: Validates `REQUESTED` -> `ADMIN_APPROVED` -> `ANALYST_ASSIGNED` -> `ACTIVE`.
- **Zero Self-Activation**: Confirms that non-activated accounts are blocked from receiving JWT tokens.
- **Least-Loaded Analyst Assignment**: Tests dynamic distribution among 3 SOC analysts with randomized tie-breakers.
- **Session Revocation**: Confirms that setting an account to `SUSPENDED` immediately invalidates active tokens.

### 3.2 Device Identity & DPAPI (`test_device_enrollment.py`)
- **DPAPI Roundtrip**: Validates Windows `CryptProtectData` and `CryptUnprotectData` byte preservation.
- **Challenge Nonce Expiry**: Verifies that 64-character nonces expire after 300 seconds.
- **Tampered Signatures**: Asserts that forged signatures or mismatched public keys return `401 Unauthorized`.
- **Replay Protection**: Confirms that submitting the same nonce twice returns `422 Unprocessable Entity`.
- **Token Rotation & Revocation**: Tests rotation to `kavach_dev_...` tokens and rejection of revoked credentials.

### 3.3 Windows Companion & Resilient Pipeline (`test_windows_companion.py`)
- **Prioritized Dequeue**: Proves that CRITICAL and HIGH priority events are dequeued before LOW or STATISTICAL events.
- **Spool Ack / Nack**: Verifies that successful transmissions remove events, while failed transmissions increment retry counts.
- **One-Click Shield**: Verifies that engaging the shield queues containment telemetry and updates the status file.

### 3.4 ML Anomaly Detector (`test_ml_pipeline.py`)
- **Insufficient Data Safety**: Strictly verifies that when the Isolation Forest is untrained, it returns `"status": "insufficient_data"` and **never** emits false positive alerts.
- **Baseline Training**: Verifies training on 15+ events and statistical anomaly inference.

---

## 4. Execution Commands

```bash
# Run all tests with verbose output
python -m pytest backend/tests/ -v

# Run with test coverage report
python -m pytest backend/tests/ --cov=app --cov-report=term-missing
```
