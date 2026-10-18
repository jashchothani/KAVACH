# KAVACH 2.1.0 — FastAPI ClientDisconnect & Telemetry Ingestion Fix

**Document ID:** KAV-ENG-2026-TELEMETRY-DISCONNECT-01  
**Target Release:** KAVACH 2.1.0  
**Classification:** Backend Reliability, Transport Layer & ASGI Diagnostics  
**Author:** Principal Backend Platform Engineer & Security Lead  
**Status:** RESOLVED & VERIFIED VIA REGRESSION SUITE  

---

## 1. Defect Description & Observed Symptoms

During high-load edge event shipping, network drops, or agent shutdowns, backend logs previously recorded:
```text
starlette.requests.ClientDisconnect
File "backend/app/api/v1/telemetry.py", line 189, in ingest_telemetry
  raw_body = await request.body()
```
The unhandled `ClientDisconnect` bubbled up into FastAPI's `generic_exception_handler`, which:
1. Logged an unexpected 500 error (`unhandled_internal_error`).
2. Attempted to transmit a `JSONResponse(status_code=500)` down a severed ASGI socket, causing cascading broken-pipe warnings.
3. Obscured genuine server errors under high volumes of expected network disconnect noise.

---

## 2. Root Cause Analysis

1. **Client-Side Timeout Contraction (`shipper.py`):**
   The edge agent shipper was initialized with `httpx.AsyncClient(timeout=10.0)`. In environments with database sync or network latency spikes, the client's total HTTP socket timeout elapsed before the server could finish reading the streamed payload, causing the client to terminate the TCP connection mid-stream.
2. **Unguarded Stream Consumption (`telemetry.py`):**
   `await request.body()` was invoked without an explicit `ClientDisconnect` catch block. In Starlette, an interrupted HTTP stream immediately raises `ClientDisconnect`.
3. **Missing Dedicated ASGI Exception Handler (`main.py`):**
   FastAPI lacked a designated handler for `ClientDisconnect`, defaulting to the catch-all `Exception` handler which attempted to respond with HTTP 500 over an already closed TCP socket.
4. **Ungraceful Agent Task Cancellation (`shipper.py`):**
   Upon service shutdown or restart, `self._flush_task.cancel()` terminated immediately without allowing an in-flight HTTP request to finish.

---

## 3. Implemented Fixes

### 3.1 Telemetry Endpoint Disconnect Guard (`backend/app/api/v1/telemetry.py`)
```python
# Content-length inspection to reject oversized uploads early
content_length = request.headers.get("content-length")
if content_length:
    try:
        if int(content_length) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Telemetry payload exceeds 10MB batch limit",
            )
    except ValueError:
        pass

try:
    raw_body = await request.body()
except ClientDisconnect:
    req_id = request.headers.get("X-Request-ID")
    logger.info(
        "telemetry_client_disconnected",
        client=client_key,
        path=str(request.url.path),
        request_id=req_id,
    )
    return Response(
        status_code=499,
        content=b'{"success":false,"error":{"code":"CLIENT_DISCONNECTED","message":"Client closed connection before telemetry body was fully received"}}',
        media_type="application/json",
    )
```

### 3.2 Global ClientDisconnect Exception Handler (`backend/app/main.py`)
```python
@app.exception_handler(ClientDisconnect)
async def client_disconnect_handler(request: Request, exc: ClientDisconnect):
    req_id = request.headers.get("X-Request-ID") or get_correlation_id()
    logger.info(
        "client_disconnected_early",
        path=str(request.url.path),
        method=request.method,
        request_id=req_id,
    )
    return Response(
        status_code=499,
        content=b'{"success":false,"error":{"code":"CLIENT_DISCONNECTED","message":"Client disconnected before response completed"}}',
        media_type="application/json",
    )
```

### 3.3 Enhanced Edge Shipper Client (`backend/app/agent/shipper.py`)
1. **Granular Timeouts:**
   ```python
   self._client = httpx.AsyncClient(
       timeout=httpx.Timeout(connect=5.0, read=25.0, write=15.0, pool=10.0),
       headers=headers,
   )
   ```
2. **Exponential Backoff with Jitter:**
   ```python
   # On failure:
   self.spooler.nack_batch(event_ids)
   jitter = random.uniform(0.75, 1.25)
   self._backoff_sec = min(30.0, self._backoff_sec * 2.0)
   await asyncio.sleep(self._backoff_sec * jitter)
   ```
3. **Graceful Task Drain on Shutdown:**
   Allows in-flight batch uploads to conclude cleanly (up to 2.5 seconds) prior to task cancellation.

---

## 4. Verification Evidence (`backend/tests/test_telemetry_disconnect.py`)

All 6 test cases passed cleanly with 0 warnings:
```
tests/test_telemetry_disconnect.py::test_telemetry_normal_valid_json PASSED              [16%]
tests/test_telemetry_disconnect.py::test_telemetry_valid_gzip_payload PASSED             [33%]
tests/test_telemetry_disconnect.py::test_telemetry_client_disconnect_during_body PASSED  [50%]
tests/test_telemetry_disconnect.py::test_telemetry_malformed_json PASSED                 [66%]
tests/test_telemetry_disconnect.py::test_telemetry_oversized_payload_content_length PASSED [83%]
tests/test_telemetry_disconnect.py::test_telemetry_empty_events PASSED                  [100%]
============================== 6 passed in 0.22s ==============================
```

### Security & Operational Invariants Guaranteed:
- An interrupted upload is **never** reported as successfully ingested (`status: 499`).
- Partial or truncated JSON streams are **never** persisted to the SQLite database.
- Disconnected clients produce concise `INFO` level events instead of 500 error tracebacks.
