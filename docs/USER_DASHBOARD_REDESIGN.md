# KAVACH 2.1.0 — User Dashboard Modernization & Traditional Sidebar Architecture

**Document ID:** KAV-ENG-2026-P1-01  
**Target Release:** KAVACH 2.1.0  
**Classification:** Sovereign Engineering Design & Implementation Report  
**Author:** Lead Frontend & Design Systems Engineer  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Executive Summary

In accordance with Section 10 of the KAVACH Master Engineering Specification, the User Security Dashboard (`user.html`) was redesigned to replace the top-heavy horizontal navigation with a modern, familiar, traditional persistent left sidebar. The visual language maintains KAVACH's sovereign identity: deep-navy background (`#05080e`), restrained crimson-red highlights (`#dc2626`), subtle glassmorphism, accessible contrast ratios exceeding WCAG AAA, and clean Segoe UI / JetBrains Mono typography.

---

## 2. Layout & Architectural Specifications

### 2.1 Persistent Traditional Left Sidebar
The left sidebar (`.sidebar`) provides persistent, one-click access across three operational categories:

1. **MONITORING Group:**
   - **Overview (`#overview`):** Hero security score ring (0-100), dynamic status pill, real-time diagnostic scan trigger.
   - **Protection Status (`#protection`):** Antivirus, Windows Defender state, Firewall profiles, Wi-Fi security, Collector status.
   - **Devices & Sensors (`#device-health`):** Host hardware metrics, CPU/RAM/Disk utilization, and OS details.
   - **Security Events (`#activity`):** Chronological real-time audit trail and event stream.
   - **Threat Center (`#threat-center`):** Active threat counts, correlated anomaly alerts, and containment posture.

2. **INTELLIGENCE & AI Group:**
   - **URL Security (`#link-scanner`):** On-demand heuristic URL inspection, homograph detection, and SSRF prevention.
   - **Raksha AI Copilot (`#raksha-ai`):** Embedded security copilot with contextual chips, plain-language explanations, and incident queries.
   - **Score Breakdown (`#score-breakdown`):** Quantitative point breakdown across network, device, threat, application, and identity vectors.

3. **SYSTEM & COMPLIANCE Group:**
   - **Privacy Matrix (`#privacy`):** CERT-In Section 70B compliance matrix, data minimization guarantees, and 180-day cryptographic vault status.
   - **Device Diagnostics (`#device-overview`):** Hardware DPAPI certificate metadata, endpoint IP/hostname, and 16 Windows collector daemons registry.

### 2.2 Collapsible Sidebar & Mobile Drawer Mode
- **Desktop (>1024px):** Fixed left navigation (width: `260px`). Users can collapse the sidebar to an icon-only strip (`72px`) via `#sidebar-toggle`. The collapse preference is automatically saved to `localStorage`.
- **Mobile & Tablet (≤1024px):** Automatically transforms into an off-canvas drawer (`transform: translateX(-100%)`). Toggled via the top bar hamburger button (`#mobile-toggle-btn`), with an accessible backdrop overlay (`#sidebar-backdrop`).

### 2.3 Top Sticky Navigation Bar
The persistent header (`.top-nav-bar`) provides essential platform context:
- Dynamic section title updating in real-time as users scroll (`#page-title`).
- Live system timestamp with IST time zone indicator.
- Multi-state badges: Connection status (`Live Connected`, `Connecting`, `Offline`) and Device Posture (`DPAPI Secured`, `Unenrolled`).
- Theme toggle (`Dark` / `Light`), Notifications drawer bell with unread indicator, user avatar, and sign out button.

---

## 3. Clear Distinction of System States

Per Section 10.3, the modernized interface strictly separates:
- **Local Collector Health:** 16 live daemons verified via `collectors-summary-pill`.
- **Hardware DPAPI Credential:** Windows hardware keypair existence (`#dev-dpapi`).
- **Server Enrollment:** Authoritative verification confirmation by the backend (`#u-device-pill`).
- **Cloud Gateway Connectivity:** Live WebSocket & REST latency status (`#conn-status`).
- **Active Containment Shield:** Explicit status distinguishing monitoring from network isolation.

Zero mock data or fabricated security scores are used. All metrics originate from the live telemetry pipeline.
