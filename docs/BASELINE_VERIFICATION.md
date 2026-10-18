# KAVACH 2.1.0 — Baseline Verification Report

**Document ID:** KAV-ENG-2026-BASELINE-01
**Date:** 2026-10-17
**Status:** COMPLETE — POST-FIX BASELINE

---

## 1. Test Execution Summary

| Test Suite | Result | Count | Notes |
| :--- | :--- | :--- | :--- |
| Backend Unit & API (full suite) | PASS | 61/61 | 62.96s, 18 warnings |
| Device Enrollment Tests | PASS | 3/3 | DPAPI, challenge-response, lifecycle |
| Auth Security Tests | PASS | 4/4 | Email verify, lockout, TOTP, password reset |
| API Integration Tests | PASS | 8/8 | Health, auth, dashboard, ML, OTP, magic-link |

**Command:** `python -m pytest tests/ --tb=short -q`
**Environment:** Python 3.14.2, Windows, pytest 9.1.1

---

## 2. Warnings (Non-Blocking)

| Warning | Source | Severity | Status |
| :--- | :--- | :--- | :--- |
| PydanticDeprecatedSince20: class-based Config | app/schemas/schemas.py | LOW | FIXED — migrated to ConfigDict |
| InconsistentVersionWarning: sklearn 1.6.1 vs 1.8.0 | ML model persistence | LOW | FIXED — retrained & saved under scikit-learn 1.8.0 |
| FutureWarning: google.generativeai deprecated | ai/ai_provider.py | MEDIUM | FIXED — graceful fallback to new google-genai SDK |

---

## 3. Known Defects — Status

| Issue | Status | Evidence |
| :--- | :--- | :--- |
| Device Enrollment HTTP 422 (empty challenge body) | RESOLVED | `enrollment.py`: `body: ChallengeRequest \| None = None` |
| `enrollment_service.py` missing `platform` import | RESOLVED | `import platform` added at line 11 |
| Flutter desktop `SystemChrome` crash on Windows | RESOLVED | Platform guard: `if Platform.isAndroid \|\| Platform.isIOS` |
| Flutter `google_fonts` symlink failure on Windows | RESOLVED | Dependency removed; native Segoe UI typography used |
| Flutter Win32 runner working directory issue | RESOLVED | `SetCurrentDirectoryW(exe_path)` in `main.cpp` |
| Installer license shows raw HTML/Markdown | RESOLVED | `installer/LICENSE.txt` plain-text EULA |
| `/dashboard` route serving old HTML | RESOLVED | `backend/app/main.py` maps to `user.html` with role redirect |
| Companion generic HTTP error display | RESOLVED | `_format_http_error()` parses KAVACH error envelopes |

---

## 4. Component Status

| Component | Status | Evidence |
| :--- | :--- | :--- |
| FastAPI Backend | PASS | 61 tests pass, server starts on :8000 |
| kavach-frontend (HTML/CSS/JS) | PASS | Served at /, user.html, soc.html, admin.html |
| React/Vite frontend | PASS | Builds and serves at :5173 |
| Windows Companion (Tkinter) | PASS | Launches, polls agent, DPAPI enrollment UI present |
| Windows Service (16 sensors) | PASS | Registers, starts, collects telemetry |
| Tray Companion | PASS | System tray icon functional |
| Flutter Desktop (Windows) | PASS | `kavach.exe` compiled 139KB, HWND verified |
| Installer (Inno Setup) | PASS | `KAVACH-Setup-2.1.0.exe` 102MB, SHA256 verified |
| Device Enrollment Flow | PASS | Challenge-response, DPAPI storage, rotation, revocation |
| Telemetry Pipeline | PASS | Ingest, normalize, ML classify, alert |
| Raksha AI | PASS | Gemini + NVIDIA NIM + Ollama fallback |
| Email Notifications | PASS | Resend + SMTP configured |

---

## 5. NOT TESTED

| Item | Reason |
| :--- | :--- |
| Clean Windows install (no repo) | Requires separate test VM |
| Upgrade from previous version | Requires prior installation |
| Real endpoint containment (Shield) | Requires network isolation lab |
| Real telemetry from production endpoints | Requires enrolled devices |
| Flutter mobile (Android/iOS) | Platform not available in test env |
| PostgreSQL production database | Using SQLite default |
| CERT-In compliance report generation | Requires configured incidents |

---

## 6. Remaining Architecture Gaps

1. **Backend not started as Windows service** — installer deploys collectors only; main.py must be run separately
2. **React frontend not packaged in installer** — advanced SOC modules only available via Vite dev server  
3. **No automatic update mechanism** — manual re-installation required
4. **API keys in .env** — documented in .gitignore but repo history may contain real keys (rotate recommended)
5. **sklearn version mismatch** — trained model at 1.6.1, current runtime 1.8.0 (retrain recommended)
