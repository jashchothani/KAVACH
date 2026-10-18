# KAVACH Browser Extension & ML Endpoint Test Results

**Test Date:** October 2026  
**Test Suite:** Unit, Integration, Machine Learning Heuristics & DOM Injection  
**Overall Status:** PASSED (All 67 backend test cases passing, DOM injection verified)

---

## 1. Backend ML Spam & Phishing Engine Tests

The FastAPI backend endpoints supporting the browser extension were tested against diverse attack vectors.

### Test Matrix: `POST /api/v1/ml/scan-email`
| Scenario | Input Vector | Expected Threat Level | Result | Threat Indicators Flagged |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Spoofing** | Sender: `security@service-update-sbi.xyz`<br>Subject: `URGENT: SBI Account Suspended` | CRITICAL (Risk ≥ 85) | PASS | Critical Brand Impersonation (Claims SBI, domain is .xyz), Urgent Account Suspension Threat |
| **KYC Harvesting** | Sender: `support@verify-kyc-bank.com`<br>Subject: `Update PAN card within 24 hours` | HIGH RISK (Risk ≥ 70) | PASS | Urgent Identity/KYC Harvesting Lure, Phishing keywords |
| **Fake Invoice** | Sender: `billing@quickinvoice.net`<br>Subject: `Invoice #892182 Direct Transfer` | SUSPICIOUS (Risk ≥ 50) | PASS | Fake Invoice / Phishing Attachment signature |
| **Authentic Sender** | Sender: `notifications@google.com`<br>Subject: `Security alert for your linked Google account` | SAFE (Risk < 20) | PASS | Clean sender profile, Authentic brand domain match |

### Test Matrix: `POST /api/v1/ml/scan-comms`
| Scenario | Phone Number | Message Snippet | Expected Result | Flagged Status |
| :--- | :--- | :--- | :--- | :--- |
| **Task Scam Lure** | `+92 300 1234567` | "Part time work, like YouTube videos to earn ₹5,000 daily" | HIGH-RISK SCAM | PASS (Origin prefix +92, Part-Time Job Scam) |
| **Lottery Fraud** | `+234 801 2345678` | "Congratulations! You won ₹25,00,000 in KAVACH Lucky Draw" | HIGH-RISK SCAM | PASS (Origin prefix +234, Lottery / Prize Bait) |
| **Normal Domestic** | `+91 98765 43210` | "Meeting rescheduled to 3 PM at the main branch" | SAFE / NORMAL | PASS (Domestic verified format, no scam lures) |

---

## 2. Client-Side Content Script Verification

### Gmail DOM Sentinel
- **Compulsory Branded Toast:** Verified that visiting `https://mail.google.com` displays `#kavach-gmail-toast` with official KAVACH logo. Verified that reloading the page or switching tabs honors the 20-minute session cooldown without repetitive popups.
- **Unfiltered Threat Single Alert:** Verified that when a phishing email is detected in `#inbox`, the alert modal triggers **once** per unique message ID hash. Switching between read and unread states does not trigger duplicate modals.
- **Sovereign Warning Screen:** Verified that the dangerous email body is hidden by `.kavach-blocked-body-hidden`. Verified that clicking "Back to Safe Inbox" navigates back, and clicking "I Understand the Risk" reveals text while setting all `a` tags to `pointer-events: none` with strikethrough styling.
- **Gmail Spam Folder Banner:** Verified that opening an email under `#spam` or bearing Gmail's native spam banner displays `.kavach-gmail-spam-quarantine-banner` and neutralizes links.
- **Deceptive Link Interception:** Verified that clicking an anchor displaying `sbi.co.in` but pointing to `http://sbi-login.xyz` blocks the navigation and renders `.kavach-modal-backdrop`.

### Search Engine Active Sentinel
- **Google Search:** Tested search queries for popular and suspicious domains. Verified that SVG shield ticks attach cleanly inside the primary `h3` heading without overlapping search breadcrumbs or menus.
- **Popover Card:** Verified that hovering over emerald, amber, and crimson shields opens `#kavach-site-card` with accurate score metrics and Raksha AI explanations.

### Extension Popup
- **5-Tab Navigation:** Verified tab transitions between Web, Comms, Scanner, Events, and Diagnostics.
- **System Diagnostics:** Verified that clicking Tab 5 performs a live ping to `/api/v1/health`, measuring round-trip latency and displaying database, ML, and Raksha AI operational readiness.
- **Security Event Log:** Verified that scanned threats populate the log and clicking "Clear Log" purges local storage cleanly.
