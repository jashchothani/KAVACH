# KAVACH Browser Extension Architecture & Capability Audit

**Module:** KAVACH Web, Gmail & WhatsApp Threat Sentinel  
**Specification:** Manifest V3 (MV3)  
**Version:** 1.0.0  
**Target Browsers:** Google Chrome, Microsoft Edge, Brave, Chromium (v109+)

---

## 1. Extension Component Structure

```
extension/
├── manifest.json                  # Manifest V3 declarative schema
├── assets/                        # Brand artwork & multi-resolution icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon256.png
├── background/
│   └── service_worker.js         # Non-persistent event-driven background coordinator
├── content/
│   ├── content.js                # Search engine link annotator & site advisor cards
│   ├── gmail_shield.js           # Native Gmail DOM scraper, ML classifier & blocking screen
│   ├── whatsapp_shield.js        # WhatsApp Web scam number detector & link neutralizer
│   └── content.css               # Shared sovereign dark-mode stylesheet & alert injection styles
└── popup/
    ├── popup.html                # 5-tab unified threat dashboard & telemetry inspector
    ├── popup.js                  # Asynchronous telemetry polling & diagnostic controller
    └── popup.css                 # Premium Obsidian & Crimson design system
```

---

## 2. Permissions & Least Privilege Audit

KAVACH strictly adheres to the principle of least privilege required for endpoint browser protection:

| Manifest Key | Declared Scope | Technical Justification |
| :--- | :--- | :--- |
| `permissions` | `activeTab` | Inspects currently focused tab URL upon popup open without requesting persistent broad browsing history access. |
| `permissions` | `storage` | Persists user security preferences (strict shield toggles, toast frequency, recent threats feed). |
| `host_permissions` | `http://localhost:8000/*` | Communicates with the local KAVACH FastAPI threat intelligence backend. |
| `host_permissions` | `http://127.0.0.1:8000/*` | Loopback fallback communication with the local backend. |
| `host_permissions` | `<all_urls>` | Enables content scripts to annotate search links and defend communication platforms (Gmail and WhatsApp Web). |
| `web_accessible_resources` | `assets/*` | Allows content scripts to securely inject the official KAVACH shield logo into Gmail DOM toasts. |

---

## 3. Threat Defense Modules

### A. Gmail Phishing Sentinel (`gmail_shield.js`)
- **Compulsory Branded Toast:** Displays "KAVACH is protecting you" with official logo upon entering Gmail, featuring real-time health checks (`Protection active`, `Partially available`) and a 20-minute session cooldown.
- **Dual Spam Handling:**
  - *Gmail Spam Folder:* Automatically neutralizes all hyperlinks and displays a calm advisory banner indicating message quarantine.
  - *Unfiltered Primary Inbox Threats:* Detects threats that bypassed Gmail filters. Triggers an alert notification **once per message ID** and injects the Sovereign Warning Blocking Screen over malicious bodies.
- **Deceptive Link Interception:** Intercepts anchor text discrepancies (e.g. text says `sbi.co.in` but link leads to `.xyz`) and displays a confirmation warning modal before navigation.

### B. WhatsApp Web Scam Sentinel (`whatsapp_shield.js`)
- **Scam Number Heuristic:** Detects high-risk international prefixes (+92, +234, +880, +855) frequently linked to task fraud and lottery scams.
- **Message Intent Scanning:** Evaluates chat messages for part-time work lures, Telegram invite redirections, and malicious APK droppers.
- **Inline Safety Indicators:** Injects visual scam tags into chat lists and provides one-click link disarming.

### C. Search Engine Active Sentinel (`content.js`)
- **Visual Shield Ticks:** Injects SVG shield badges (emerald green checkmark for Safe; crimson shield with cross for Danger; amber shield for Warning) into Google, Bing, and DuckDuckGo search results.
- **SiteAdvisor Popover Cards:** Hovering on any badge reveals domain reputation, TLS status, threat score, and plain-English Raksha AI summaries.

### D. Universal Threat Scanner & System Diagnostics (`popup/`)
- Allows manual scanning of URLs, email addresses, and phone numbers before interacting with them.
- Features a **Diagnostic Mode View** showing live backend health, SQLite database readiness, ML engine status, and round-trip API latency.
