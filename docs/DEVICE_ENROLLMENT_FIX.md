# KAVACH 2.1.0 — Device Enrollment HTTP 422 Root Cause & Resolution Report

**Document ID:** KAV-ENG-2026-P0-02  
**Target Release:** KAVACH 2.1.0  
**Classification:** Sovereign Engineering Technical Report  
**Author:** Senior Backend & Security Architect  
**Status:** RESOLVED & VERIFIED  

---

## 1. Executive Summary

During endpoint provisioning, the Windows Security Companion displayed:
```
Enrollment Error — HTTP Error 422: Unprocessable Entity
```
A technical audit traced the complete request pipeline from the desktop UI to FastAPI, Pydantic validation schemas, and database transactions. The failure was successfully reproduced, root-caused to a schema enforcement mismatch for empty request bodies on the challenge endpoint and generic error handling in the desktop companion, securely repaired, and verified with automated test executions.

---

## 2. Root Cause Analysis

### 2.1 Challenge Request Schema Mismatch
- **Endpoint:** `POST /api/v1/enrollment/challenge`
- **Root Cause:** In `backend/app/api/v1/enrollment.py`, the endpoint definition was:
  ```python
  class ChallengeRequest(BaseModel):
      hostname: str | None = None

  @router.post("/challenge", status_code=status.HTTP_201_CREATED)
  async def request_enrollment_challenge(
      body: ChallengeRequest,  # << REQUIRED BODY
      current_user: TokenPayload = Depends(get_current_user_token),
  )
  ```
  FastAPI treated `body: ChallengeRequest` as mandatory. When an HTTP client invoked the challenge endpoint with an empty body, omitted payload, or missing `Content-Type: application/json`, FastAPI rejected the request before handler execution with:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request parameters",
      "details": [{"type": "missing", "loc": ["body"], "msg": "Field required", "input": null}]
    }
  }
  ```
  Status Code: `422 Unprocessable Entity`.

### 2.2 Lack of Field Normalization in `VerifyEnrollmentRequest`
- **Endpoint:** `POST /api/v1/enrollment/verify`
- **Root Cause:** In `backend/app/api/v1/enrollment.py`, `VerifyEnrollmentRequest` required exact field names `public_key_pem`, `signature`, `hostname`. Variations across endpoint collectors (e.g. `public_key`, `device_name`, `signature_b64`) or unstripped whitespace in PEM blocks caused Pydantic schema validation failures with HTTP 422.

### 2.3 Companion Generic Exception Catching
- **Component:** `backend/app/agent/companion.py`
- **Root Cause:** In `_do_device_enrollment()`, exceptions were caught generically:
  ```python
  except Exception as exc:
      self.root.after(0, lambda: messagebox.showerror("Enrollment Error", str(exc)))
  ```
  When Python's `urllib.error.HTTPError` is converted to `str(exc)`, it produces literally `"HTTP Error 422: Unprocessable Entity"`. The error response body (`exc.read()`) was never parsed or rendered, concealing the actual validation reason from the user.

---

## 3. Implemented Fixes

### 3.1 Backend Schema Resilience
1. Made `ChallengeRequest` body optional with safe default fallback in `backend/app/api/v1/enrollment.py`:
   ```python
   @router.post("/challenge", status_code=status.HTTP_201_CREATED)
   async def request_enrollment_challenge(
       body: ChallengeRequest | None = None,
       current_user: TokenPayload = Depends(get_current_user_token),
   ) -> dict[str, Any]:
       req_body = body or ChallengeRequest()
       ...
   ```
2. Added pre-validation field normalization in `VerifyEnrollmentRequest`:
   - Automatically maps `public_key` → `public_key_pem`.
   - Automatically maps `device_name` / `computer_name` → `hostname`.
   - Automatically maps `signature_b64` → `signature`.
   - Strips leading and trailing whitespace on cryptographic PEMs and nonces.

### 3.2 Actionable Desktop Error Handling
Created `_format_http_error(exc: urllib.error.HTTPError)` in `companion.py` to parse structured KAVACH error envelopes and FastAPI validation arrays into human-readable field errors:
- `422`: Formats specific missing fields (`hostname`, `signature`, etc.).
- `401`: Explains session expiration and prompts sign-in on Account Gate.
- `403`: Explains account clearance requirements (account must be `ACTIVE`).
- `409`: Explains device quota limits (maximum 5 devices per account).

---

## 4. Verification Evidence

### 4.1 Live Challenge & Verify Test Execution
Automated test script `scripts/reproduce_enrollment.py` verified:
```
Challenge with body: 201 Created -> Nonce: 8d89ab82fdffb68e942a016c645e0970d4b9f43556fd53ebeff7662dc25ca202
Step 2 - RSA Keypair generated and nonce signed.
Step 3 - Verify status: 201 Created -> Device ID: e9678293-7e57-4065-8cf0-da35d97ff348, Status: ENROLLED
Challenge with empty body: 201 Created -> Succeeded without 422!
```

### 4.2 Security Integrity Preserved
- Cryptographic challenge-response verification is strictly maintained.
- DPAPI hardware encryption remains active.
- Device quotas and user session clearance remain server-enforced.
