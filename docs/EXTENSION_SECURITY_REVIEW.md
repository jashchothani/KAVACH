# KAVACH Browser Extension Security & Privacy Review

**Classification:** Application Security & Privacy Architecture Review  
**Target:** KAVACH Threat Sentinel (MV3 Extension)  
**Standard:** OWASP Browser Extension Security Guidelines & Zero-Trust Client Principles

---

## 1. Threat Model & Security Posture

Browser security extensions operate in an adversarial environment where malicious web pages can execute untrusted JavaScript. KAVACH employs defense-in-depth isolation to ensure that hostile web content cannot compromise the extension or manipulate user verdicts.

### Content Script Isolation
- The extension runs in an isolated JavaScript execution context as mandated by Manifest V3. Hostile web pages cannot overwrite KAVACH global variables, prototype methods, or intercept background messages.
- All DOM insertions utilize rigorous HTML escaping through `escapeHtml()` to neutralize Cross-Site Scripting (XSS) vectors.
- Event listeners for disarm, safe return, and modal actions are bound programmatically rather than via inline `onclick` attributes.

### Privacy-Preserving Telemetry
- **No Keystroke or Form Logging:** The extension contains zero listeners for password inputs, form fields, or keystroke events.
- **Privacy-Conscious Content Inspection:** Email scanning is restricted to structural phishing features (sender address, subject line, link destinations, and signature keywords). Full email archives are never uploaded or retained in cloud telemetry.
- **Local Storage Sanitation:** The Security Event Log (`recentThreats`) retains only sanitized domain names, high-level threat categories, and risk scores. Sensitive session tokens, URL query parameters, or personal data are stripped before storage.

---

## 2. Communication Security

### Localhost API Security
- Communication between the browser extension and the KAVACH FastAPI backend is strictly bound to `http://localhost:8000/*` and `http://127.0.0.1:8000/*`.
- External web pages cannot query KAVACH backend endpoints directly through the extension's background service worker due to origin checks.
- All cross-component messages (`SCAN_EMAIL_ML`, `CHECK_URL_SAFETY`, `SCAN_COMMS_ML`) validate payload types before dispatching.

### Graceful Offline Fallback (Zero Single-Point-of-Failure)
- If the KAVACH backend service is stopped or restarting, the extension immediately defaults to client-side heuristics.
- The user is notified via the status badge ("Partially available - Local Heuristics Active"), ensuring protection remains uninterrupted without throwing unhandled exceptions.

---

## 3. Phishing Interception Architecture

- **Click Hijacking Protection:** Deceptive links trigger `event.preventDefault()` and `event.stopPropagation()` at the capture phase, preventing malicious redirects before browser navigation begins.
- **Link Disarming Technique:** Unblocking content disarms hyperlinks by storing the original URL in `data-kavach-original-href`, rewriting `href` to `javascript:void(0)`, setting `pointer-events: none`, and applying visible strikethrough styling.
