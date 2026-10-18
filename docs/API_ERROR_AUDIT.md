# KAVACH 2.1.0 — API Error Handling & Endpoint Audit Report

**Document ID:** KAV-ENG-2026-P0-05  
**Target Release:** KAVACH 2.1.0  
**Classification:** Technical Audit Report  
**Author:** Senior Backend & QA Engineer  
**Status:** COMPLETED & AUDITED  

---

## 1. Executive Summary

This audit catalogs all primary REST and WebSocket endpoints in KAVACH 2.1.0 across authentication, device enrollment, telemetry, analytics, incidents, URL security, Raksha AI, and administrative controls. It documents the standard HTTP error envelopes, status codes, and centralized client-side error handling policies.

---

## 2. Centralized Error Envelope Standard

All KAVACH API endpoints conform to the structured JSON error envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | AUTHENTICATION_ERROR | CONFLICT_ERROR | NOT_FOUND | RATE_LIMITED",
    "message": "Human-readable sanitized error description",
    "details": [
      {
        "type": "missing | value_error",
        "loc": ["body", "field_name"],
        "msg": "Detailed field constraint description"
      }
    ],
    "request_id": "c399b132-a05"
  }
}
```

---

## 3. Comprehensive Endpoint Inventory

| Method | Path | Required Role | Expected Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public | 200, 400, 409 | User registration with password strength validation |
| **POST** | `/api/v1/auth/login` | Public | 200, 401, 429 | JWT credential exchange with rate limiting |
| **GET** | `/api/v1/auth/me` | Authenticated | 200, 401 | Current user identity and role payload |
| **POST** | `/api/v1/enrollment/challenge` | Authenticated | 201, 401, 403, 409 | Request single-use 64-char nonce (body optional) |
| **POST** | `/api/v1/enrollment/verify` | Authenticated | 201, 401, 422 | Cryptographic challenge verification & DPAPI token issuance |
| **POST** | `/api/v1/enrollment/rotate` | Device Token | 200, 401, 403 | Rotate active hardware device credential |
| **POST** | `/api/v1/enrollment/revoke/{id}` | Admin / Owner | 200, 401, 403, 404 | Revoke endpoint authorization |
| **GET** | `/api/v1/dashboard/summary` | Authenticated | 200, 401 | Scoped security score, device counts, and threat summary |
| **POST** | `/api/v1/dashboard/scan` | Authenticated | 200, 401 | On-demand host diagnostic scan |
| **GET** | `/api/v1/incidents` | Authenticated | 200, 401 | Correlated incidents (scoped to user's enrolled devices) |
| **PATCH**| `/api/v1/incidents/{id}` | Analyst / Admin | 200, 401, 403, 404 | Incident lifecycle status transition |
| **POST** | `/api/v1/url/scan` | Authenticated | 200, 400, 422 | URL security analysis with SSRF prevention |
| **POST** | `/api/v1/raksha/chat` | Authenticated | 200, 401, 503 | Raksha AI conversational security assistant |
| **POST** | `/api/v1/raksha/explain-alert` | Authenticated | 200, 401, 503 | Plain-language alert remediation explanation |
| **GET** | `/api/v1/soar/playbooks` | Authenticated | 200, 401 | Registered containment and response playbooks |
| **POST** | `/api/v1/soar/execute` | Analyst / Admin | 200, 401, 403, 404 | Execute authorized response playbook with audit log |
| **WS** | `/api/v1/dashboard/live` | Authenticated | 101 Switching | Real-time WebSocket event streaming |

---

## 4. Client-Side Error Handling Guidelines

Across the Windows Security Companion, Web Dashboard (`js/api.js`), and Flutter client:
- **`401 Unauthorized`:** Token has expired. Displays clean prompt to re-authenticate without crash.
- **`403 Forbidden`:** Account requires admin approval or analyst assignment. Shows pending access state.
- **`422 Unprocessable Entity`:** Parses field-level details rather than generic `HTTP 422` banner.
- **`429 Too Many Requests`:** Enforces bounded exponential backoff; disables spamming retry buttons.
- **`500 Server Error`:** Logs sanitized correlation ID and provides safe retry without exposing stack traces.
