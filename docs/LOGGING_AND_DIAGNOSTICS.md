# KAVACH 2.1.0 — Logging, Structured JSON & Diagnostics Architecture

**Document ID:** KAV-ENG-2026-P1-03  
**Target Release:** KAVACH 2.1.0  
**Classification:** Operational Security & Observability Specification  
**Author:** Principal Platform & Security Operations Engineer  
**Status:** IMPLEMENTED & AUDITED  

---

## 1. Executive Summary

This document specifies the logging and diagnostic architecture across the KAVACH platform. All logs are emitted as strict JSONL (one valid JSON object per line) or bounded structured streams, protecting sensitive credentials, preventing unbounded disk consumption, and ensuring compliance with CERT-In Section 70B logging mandates.

---

## 2. Structured Log Schema

Every log entry conforms to the following standardized JSON schema:
```json
{
  "timestamp": "2026-10-16T17:02:28.047985Z",
  "level": "INFO | WARNING | ERROR | CRITICAL",
  "service": "kavach_api | kavach_agent | kavach_enrollment_service | pipeline_manager",
  "environment": "production | development",
  "event": "device_enrolled_successfully",
  "message": "Human-readable diagnostic description",
  "request_id": "c67f5683-add",
  "correlation_id": "93a021f0-43b",
  "host_id": "e9678293-7e57-4065-8cf0-da35d97ff348",
  "details": {
    "hostname": "hanuman",
    "ip_address": "127.0.0.1"
  }
}
```

---

## 3. Strict Secret Redaction Policy

To prevent accidental credential leaks during debugging or production logging, the logging pipeline automatically scrubs the following tokens before persistence:
1. `password`, `old_password`, `new_password`
2. `device_token`, `access_token`, `refresh_token`, `kavach_dev_*`
3. `private_key_pem`, `CryptProtectData` ciphertexts
4. `otp_code`, `magic_link_token`, `mfa_secret`
5. `aws_secret_access_key`, `gemini_api_key`

---

## 4. Log Storage & Rotation Policy

1. **Local File Spool Directory:** `data/logs/` and `backend/logs/json_logs/`
2. **Rotation Trigger:** Maximum file size of 25 MB per log segment.
3. **Retention Limit:** 14 rotated segments retained locally; older segments archived into the 180-Day Encrypted Telemetry Vault.
4. **Ring Buffer:** A thread-safe circular ring buffer (capacity: 500 events) resides in backend memory for real-time dashboard live streaming (`/api/v1/logs/live`).
