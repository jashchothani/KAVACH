# KAVACH Browser Threat Sentinel — Feature Guide & Operation Manual

**Release:** KAVACH 2.1.0  
**Target:** Web Security & Enterprise Phishing Protection

---

## 1. Gmail Protection Sentinel

### Compulsory Branded Protection Toast
Whenever an authorized user navigates to `mail.google.com`:
- A branded glassmorphism toast animates smoothly into the lower-right corner displaying the official **KAVACH Shield Logo**.
- Headline: **"KAVACH is protecting you"**.
- Live Status Telemetry:
  - **Protection active** (glowing emerald dot): Backend ML engine is online and verifying communications.
  - **Partially available** (amber dot): Local heuristic engine is active, protecting the session even when the backend is offline.
  - **Checking protection status...** (pulsing cyan dot): Initial handshake in progress.
- **Session-Aware Cooldown:** The toast executes a 20-minute session cooldown stored in `sessionStorage` to prevent intrusive re-alerts during internal Gmail navigation, label switching, or drafting.

### Unfiltered Primary Inbox Threat Interception (Alert Once)
Most phishing breaches occur because modern spear-phishing messages slip past standard spam filters into the user's Primary Inbox:
- KAVACH monitors open email panes (`div.adn.ads`, `div.gE.iv.gt`).
- For any email residing in the Primary Inbox that has **not** been flagged by Gmail:
  - The content script sends sender metadata, subject, body text, and links to `POST /api/v1/ml/scan-email`.
  - If the threat score reaches or exceeds 55/100, KAVACH classifies it as an **Unfiltered Threat**.
  - **Single Alert Guarantee:** Using unique message ID hashes, KAVACH triggers the alert banner **once** per message ID. Stays non-repetitive while maintaining active protection.
  - **Sovereign Warning Screen:** The body content is hidden and replaced with an alert screen displaying threat signals, brand impersonation details, and model confidence scores.
  - **Two Actionable Options:**
    1. *Back to Safe Inbox (Recommended):* Navigates safely back to `#inbox`.
    2. *I Understand the Risk — View Blocked Content:* Renders the message content under a top alert banner while permanently disarming and striking through all hyperlinks to eliminate click-through risk.

### Gmail Spam Folder Quarantine Guard
When a user views an email already recognized by Gmail as spam or trash:
- Displays a calm advisory banner: **"Gmail Flagged Message — KAVACH Quarantine Guard Active"**.
- Neutralizes all embedded links automatically.

### Deceptive Hyperlink Interception
If an attacker embeds a link whose visible text reads `https://sbi.co.in/login` or `https://paypal.com`, but whose true target destination points to an unauthorized or high-risk domain:
- KAVACH intercepts the click event before any network navigation can take place.
- Renders a warning modal displaying the discrepancy between the visible label and true target destination.
- Allows the user to cancel or proceed at their own risk.

---

## 2. WhatsApp Web Scam Sentinel

Operating within `web.whatsapp.com`:
- **Scam Number Classifier:** Automatically flags chats originating from high-risk international prefixes (+92, +234, +880, +855) frequently linked to task-offer scams and investment fraud.
- **Task Scam Lure Detection:** Scans incoming chat snippets for keywords such as "YouTube like task", "part-time work", "daily ₹5,000", or unsolicited APK downloads.
- **Inline Alert Banners:** Injects high-visibility warning banners directly into the chat header with a one-click button to block or disarm links.

---

## 3. Search Engine Active Sentinel

- Injects verified shield badges directly adjacent to search result titles on Google, Bing, and DuckDuckGo:
  - **Safe (Emerald Shield with ✓):** Clean domain reputation, valid TLS, established trust history.
  - **Caution (Amber Shield with !):** Newly registered domains or unusual TLDs.
  - **Danger (Crimson Shield with ✗):** Confirmed phishing signatures, IP-based URLs, or deceptive typosquatting.
- Hovering over any shield badge displays the **KAVACH SiteAdvisor Popover Card** with exact risk score, certificate status, and plain-English Raksha AI security verdicts.

---

## 4. Extension Popup Dashboard & Diagnostics

The popup features a 5-tab interface:
1. **Web:** Inspects the active browser tab in real time with an animated risk gauge, security checklist, and Raksha AI breakdown.
2. **Comms:** Real-time status indicators and toggle switches for Gmail and WhatsApp protection.
3. **Scanner:** On-demand scanner to inspect any external URL, email address, or phone number before interacting with it.
4. **Events:** Persistent security event history displaying intercepted threats, risk levels, and an instant **Clear Log** button.
5. **Diagnostics:** Live system diagnostic panel displaying:
   - Manifest V3 version compliance
   - Background service worker status
   - Backend API round-trip latency (ms)
   - SQLite database status
   - Anomaly ML engine status
   - Raksha AI provider information
