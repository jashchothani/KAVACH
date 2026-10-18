# KAVACH 2.1.0 — UI/UX Architecture & Design System Specification

**Document ID:** KAV-ENG-2026-UIUX-01  
**Target Release:** KAVACH 2.1.0  
**Classification:** Product Experience, Design System & Accessibility Specification  
**Author:** Principal UI/UX Architect & Frontend Lead  
**Status:** IMPLEMENTED & AUDITED  

---

## 1. Executive Summary & Design Vision

KAVACH is an enterprise, defense-grade **AI-Driven SOAR-XDR Threat Intelligence & Response Platform**. Its embedded assistant is **Raksha AI — Security Copilot**.

The user experience across KAVACH is engineered around four core tenets:
1. **Truth in Telemetry:** Interfaces display only genuine, evidence-backed security observations. If an agent or collector is disconnected, the UI explicitly reflects offline status rather than fabricating normal health.
2. **Confidence & Restraint:** The visual language rejects gratuitous neon glows, spinning 3D toys, and noisy animations in favor of a clean, confident cybersecurity environment: deep midnight backgrounds (`#05080E`), crisp white/ivory surfaces, and restrained crimson/red accents (`#C8272D` / `#E5484D`).
3. **Role-Tailored Workflows:** Non-technical endpoint users receive plain-English security guidance and hardware metrics; SOC analysts operate in a high-density, multi-pane triage command center; administrators manage zero-trust account approvals and fleet governance.
4. **Universal Cohesion:** The Public Web Portal, User Dashboard, SOC Command Center, Admin Console, Windows Security Companion, and Flutter Desktop/Mobile applications share an identical design token hierarchy, typography scale, icon conventions, and severity semantics.

---

## 2. Official Brand System & Asset Hierarchy

### 2.1 Product Identity
- **Platform Name:** `KAVACH — AI-Driven SOAR-XDR Threat Intelligence & Response Platform`
- **Embedded Assistant:** `Raksha AI — Security Copilot` (strictly integrated as an assistant, never a disconnected brand)
- **Engine Tagline:** `Sub-Second Telemetry Correlation · Sovereign Defense · Zero Data Leakage`

### 2.2 Approved Asset Family
| Asset File | Purpose | Specifications |
| :--- | :--- | :--- |
| `assets/logo.png` | Primary light/dark header brand | Transparent PNG, 512×512, high-DPI shield insignia |
| `assets/logo-dark.png` | Contrast mark for light themes | Neutral charcoal variant with crimson emblem |
| `assets/kavach-shield-logo.png` | High-contrast SOC command badge | Red gradient shield with golden Indian emblem accents |
| `assets/kavach.ico` | Windows Desktop & Installer icon | Multi-resolution ICO (16x16, 32x32, 48x48, 64x64, 128x128, 256x256) |
| `assets/shield.ico` | System tray companion status icon | High-visibility tray icon for Windows taskbar |
| `assets/wizard_large.bmp` | Inno Setup Welcome/Finish banner | 164×314 24-bit bitmap, official branded artwork |
| `assets/wizard_small.bmp` | Inno Setup top-right header icon | 55×58 24-bit bitmap, clean KAVACH crest |
| `kavach-frontend/favicon.svg` | Modern browser scalable favicon | Vector SVG shield with vector path scaling |

---

## 3. Design System Tokens & Typography Scale

### 3.1 Color Palette & Semantic Tokens
```css
:root {
  /* Brand Accents */
  --accent: #C8272D;              /* Restrained Crimson Primary Accent */
  --accent-hover: #E5484D;        /* Interactive Hover State */
  --accent-muted: rgba(200, 39, 45, 0.15); /* Tinted Chip / Active Pill */

  /* Neutral Dark Canvas (Default Security Mode) */
  --bg-primary: #05080E;          /* Deep Midnight Canvas */
  --bg-secondary: #090D15;        /* Secondary Surface Card */
  --bg-tertiary: #0C111A;         /* Elevated Dialog / Sidebar Surface */
  --border-subtle: rgba(255, 255, 255, 0.08); /* Card & Table Border */
  --border-strong: rgba(255, 255, 255, 0.18); /* Hover & Active Border */

  /* High-Contrast Typography */
  --text-primary: #F2F3F6;        /* Primary Body & Headings */
  --text-secondary: #A3A9B8;      /* Captions, Timestamps, Labels */
  --text-muted: #6C7384;          /* Inactive Badges, Placeholders */

  /* Standardized Severity Scales */
  --severity-critical: #DC2626;   /* Immediate Containment Required */
  --severity-high: #EA580C;       /* Suspicious Execution / Anomaly */
  --severity-medium: #CA8A04;     /* Policy Warning / Configuration Gap */
  --severity-low: #2563EB;        /* Informational Observation */
  --severity-info: #16A34A;       /* Normal / Healthy State */
}

/* Light Mode Overrides (Optional / Accessibility) */
[data-theme="light"] {
  --bg-primary: #F4F5F8;          /* Light Ivory Neutral Canvas */
  --bg-secondary: #FFFFFF;        /* Pure White Card Surface */
  --bg-tertiary: #F8F9FA;         /* Sidebar / Inset Surfaces */
  --border-subtle: rgba(17, 20, 27, 0.09);
  --border-strong: rgba(17, 20, 27, 0.20);
  --text-primary: #11141B;
  --text-secondary: #505768;
  --text-muted: #8A90A0;
}
```

### 3.2 Typography Stack
- **Headings & Brand Title:** `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (Weights: 500, 600, 700)
- **Body & Controls:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (Weights: 400, 500, 600)
- **Telemetry, Hashes, IP & Code:** `JetBrains Mono, "Cascadia Code", Consolas, monospace` (Weights: 400, 500, 600)

---

## 4. Web Application Architectures (`kavach-frontend/`)

### 4.1 Public Marketing & Information Website (`index.html`, `features.html`, `how-it-works.html`, `about.html`, `download.html`)
- **Hero Section:** Clear value proposition: *\"Sovereign AI-Driven SOAR-XDR Defense for Hybrid Endpoints\"*. Features an interactive, performant canvas depicting the 16-sensor mesh feeding into Raksha AI without layout shift.
- **Collector-to-Response Pipeline Walkthrough:** Step-by-step visual animation demonstrating telemetry ingestion, SQLite offline spooling, Isolation Forest scoring, and automated SOAR containment.
- **Genuine Transparency:** Zero fabricated corporate testimonials or unverified compliance claims. Highlights genuine architecture: DPAPI credential protection, CERT-In Section 70B logging conformance, and local offline durability.
- **Direct Installer Download:** Clean download card offering `KAVACH-Setup-2.1.0.exe` alongside SHA-256 verification hash and system requirements.

### 4.2 Endpoint User Dashboard (`user.html` / Traditional Sidebar Layout)
- **Persistent Left Navigation:**
  - `Overview` (Hero score ring, system connection status pill, live workstation posture)
  - `Protection Status` (Windows Defender Antivirus, Windows Firewall 3 profiles, Wi-Fi WPA3 encryption, 16 Collectors active)
  - `Devices & Sensors` (Real hardware meters: CPU cores, RAM utilization, Disk space, OS build info)
  - `Security Events` (Tamper-evident host event log with live timestamping)
  - `Threat Center` (Active detections, sandbox findings, and quarantined items)
  - `URL Security` (Real-time zero-trust domain & link analysis tool)
  - `Raksha AI Copilot` (Context-aware conversational advisor explaining endpoint posture in plain language)
  - `Score Breakdown` (Algorithmic point contributions from Antivirus, Firewall, Network, and Sensor health)
  - `Privacy & Compliance` (CERT-In data minimization verification: zero personal files or web history ingested)
  - `Device Diagnostics` (One-Click Shield isolation, Spooler flush, DPAPI token rotation, Log export)
- **App Shell Performance:** Renders the shell and navigation immediately in `< 640ms`, hydrating secondary metrics via async background tasks.

### 4.3 SOC Analyst Operations Center (`soc.html` / Command Deck)
- **Layout Architecture:** High-density, multi-pane widescreen workspace designed for rapid triage:
  1. *Executive Command Bar:* Live socket status, global IOC search (`topbar-global-search`), timeframe filters, and incident counter pills.
  2. *16-Sensor Live Stream:* Real-time filterable log viewer streaming process, network, sysmon, registry, and USB events.
  3. *Triage & Incidents War Room:* Severity-ranked queue (Critical, High, Medium, Low), MITRE ATT&CK technique mapping, and correlation timeline.
  4. *Rapid URL Inspector & Deception Forensics:* Mayajaal honeypot monitoring and automated URL reputation detoner.
  5. *Raksha AI Investigation Copilot:* Automated evidence summarizer generating structured incident response recommendations.

### 4.4 Administrator Governance Console (`admin.html`)
- **Dual-Gate Registration Workflow:**
  - *Gate 1 (Admin Approval):* Evaluates incoming account requests (`/api/v1/accounts/requests/pending`). Admin approval automatically triggers the least-loaded algorithm.
  - *Gate 2 (Analyst Assignment):* Selects the active SOC analyst with the lowest review load to conduct final activation.
- **Fleet & Policy Governance:** Endpoint directory with IP, OS, score, and connection heartbeat; policy switchboard; hash-chained tamper-evident audit trail verification (`/api/v1/audit/verify-chain`).

---

## 5. Windows Security Companion UI (`companion.py` / Tkinter GUI)

The native Windows Security Companion provides a local endpoint management window accessible from the desktop shortcut or system tray:
1. **Design System:** Dark obsidian aesthetic (`#0C111A`), high-contrast typography, and native Win32 window integration.
2. **Tabbed Architecture:**
   - *Live Posture:* Real-time endpoint security status, Defender state, and one-click workstation shielding.
   - *16 Sensors Health:* Real-time polling of all 16 collector threads with heartbeat indicators.
   - *Device DPAPI:* Device identity generator, RSA-2048 keypair management, challenge-response enrollment, and CryptProtectData credential storage.
   - *Account Gate:* Status of user registration, verification code submission, and approval states.
   - *Live Events:* Bounded spooler ring buffer displaying live serialized event payloads.
3. **Honest Error Handling:** Uses `_format_http_error()` to translate HTTP 401, 403, 404, 422, and 500 envelopes into helpful, actionable remediation guidance without raw stack traces.

---

## 6. Flutter Desktop & Mobile Suite (`mobile/`)

### 6.1 Unified Platform Experience
- **Theme Engine:** `AppTheme.lightTheme` with `#DC2626` crimson accent, crisp card surfaces, and subtle elevation.
- **Native Typography:** Standardized on native platform fonts (Segoe UI on Windows, Roboto on Android, SF Pro on iOS), eliminating Google Fonts network loading delays.
- **Navigation Flow:**
  - `Splash` (`/`) -> Session validator checking saved DPAPI/SecureStorage tokens.
  - `Login` (`/login`) -> Username/password authentication with server-side error feedback.
  - `SignUp` (`/sign-up`) -> Full registration initiating the dual-gate approval lifecycle.
  - `ProtectionDashboard` (`/protection-dashboard`) -> Live sensor status, security score gauge, one-click shield, and URL scanner.
- **Zero-Crash Windows Initialization:** Platform-specific window configuration guards (`Platform.isAndroid || Platform.isIOS`) ensure the Flutter Windows runner launches natively without crashing on `SystemChrome`.

---

## 7. Accessibility & Responsive Verification

1. **Contrast Compliance:** All primary text-to-background combinations meet or exceed WCAG 2.1 AA (minimum contrast ratio `4.5:1` for normal text, `7.1:1` for high-contrast headers).
2. **Keyboard Navigation & Focus Management:** All interactive elements (`<button>`, `<a href>`, `<input>`) feature explicit `:focus-visible` styling (`outline: 2px solid var(--accent); outline-offset: 2px`).
3. **Screen Reader Landmarks:** Semantic HTML5 elements (`<aside>`, `<header>`, `<main>`, `<nav>`, `<section>`, `role="alert"`, `aria-live="polite"`) ensure assistive screen reader accessibility.
4. **Responsive Breakpoints:**
   - Mobile: `< 768px` (Sidebar transforms into collapsible drawer with backdrop)
   - Tablet: `768px - 1024px` (Compact navigation, 2-column grid reflow)
   - Desktop: `1024px - 1440px` (Full persistent sidebar, 4-column metrics)
   - Widescreen SOC: `> 1440px` (Expanded multi-pane command deck with real-time log terminal)
