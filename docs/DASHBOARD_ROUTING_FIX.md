# KAVACH 2.1.0 — Stale Dashboard Routing Architecture & Fix Report

**Document ID:** KAV-ENG-2026-P0-03  
**Target Release:** KAVACH 2.1.0  
**Classification:** Sovereign Engineering Technical Report  
**Author:** Principal Full-Stack Architect  
**Status:** RESOLVED & VERIFIED  

---

## 1. Executive Summary

A critical user experience defect was reported where navigating to `/dashboard` displayed an outdated legacy website rather than the modern sovereign cybersecurity user dashboard available at `/user.html`.

This report documents the architectural root cause, the unified canonical route mapping implemented in FastAPI and client-side HTML, and verification evidence confirming that all user, SOC, and administrative routes resolve to their authoritative interfaces without cache collision or redirect loops.

---

## 2. Root Cause Analysis

### 2.1 Backend Alias Map Shadowing Modern Interface
In `backend/app/main.py`, the static file router `serve_frontend()` contained a static file alias dictionary:
```python
alias_map = {
    "dashboard": "dashboard.html",
    "user": "dashboard.html",
    "admin": "admin.html",
    "soc": "soc.html",
    ...
}
```
In `kavach-frontend/`:
- `user.html` was the active, upgraded cybersecurity dashboard with 16 sensors, DPAPI badges, Raksha AI integration, and the modern glassmorphism design system.
- `dashboard.html` was an older duplicate snapshot.
Because `alias_map["dashboard"]` and `alias_map["user"]` were explicitly mapped to `dashboard.html`, any user visiting `/dashboard` or `/user` was served the older file.

### 2.2 Direct File Serving Precedence
Direct file serving in FastAPI evaluated `os.path.isfile(target)` before checking alias mappings. When an HTTP client requested `/dashboard.html`, the backend served the legacy file directly from the filesystem, bypassing any intended application logic.

---

## 3. Canonical Architecture & Fix Implementation

### 3.1 Role-Aware Server-Side Redirection
In `backend/app/main.py`, updated `serve_frontend()` to intercept `/dashboard`, `/dashboard.html`, and `/user` requests before direct file serving:
1. Inspects the `Authorization` header (`Bearer <token>`) or session cookies (`kavach_token`).
2. If authenticated:
   - Role `admin` / `superadmin`: Performs a clean `302 Found` redirect to `/admin.html`.
   - Role `soc_analyst` / `security_analyst`: Performs a clean `302 Found` redirect to `/soc.html`.
   - Role `user`: Serves the authoritative modern `user.html` directly with `Cache-Control: no-cache, must-revalidate`.
3. If unauthenticated:
   - Serves the modern `user.html` directly, allowing the client-side session guard (`K.session.require('user')`) to prompt login or onboarding.

### 3.2 Canonical Route Map Update
Updated `alias_map` in `backend/app/main.py`:
```python
alias_map = {
    "dashboard": "user.html",
    "user": "user.html",
    "admin": "admin.html",
    "soc": "soc.html",
    "analyst": "soc.html",
    ...
}
```

### 3.3 Client-Side Redirection Fallback
Replaced the legacy `kavach-frontend/dashboard.html` with an instantaneous canonical redirect to `/user.html`:
```html
<meta http-equiv="refresh" content="0; url=/user.html">
<script>
  window.location.replace('/user.html' + (window.location.hash || ''));
</script>
```
Even if a cached reverse-proxy or static file server serves `dashboard.html`, the browser instantly transitions to `/user.html` while preserving URL hash anchors (e.g. `#protection`, `#raksha-ai`).

---

## 4. Verification Evidence

- Requesting `GET /dashboard` → Resolves directly to `user.html` with HTTP 200 OK.
- Requesting `GET /dashboard` with Admin token → Redirects to `/admin.html` with HTTP 302 Found.
- Requesting `GET /dashboard` with Analyst token → Redirects to `/soc.html` with HTTP 302 Found.
- Requesting `GET /dashboard.html` → Redirects cleanly to `/user.html`.
- No redirect loops, zero stale assets overriding current interfaces.
