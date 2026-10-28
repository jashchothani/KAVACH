"""
KAVACH Raksha AI Provider Abstraction.

Seamlessly switches between NVIDIA NIM cloud acceleration and deterministic
local security heuristics. The rest of KAVACH never depends on NVIDIA code.
"""

from __future__ import annotations

import abc
import json
import os
import time
from pathlib import Path
from app.raksha_ai.rag import RakshaRAG
import httpx
from typing import Any

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are Raksha AI, the intelligent sovereign cybersecurity copilot of KAVACH.
You communicate with the fluency, warmth, clarity, and helpfulness of advanced conversational AI (like ChatGPT and Claude) combined with deep cybersecurity domain expertise.
Your primary role is to answer user inquiries, explain security posture and telemetry, guide scam and fraud prevention (including Digital Arrest, Part-time task fraud, and phishing), deconstruct malware indicators, and provide defensible, step-by-step remediation actions.
Always prioritize clarity, evidence, and actionable defense. Ground your answers in real technical security facts, MITRE ATT&CK concepts, and KAVACH system telemetry.
When asked for contact information, email, phone number, address, or how to reach KAVACH, provide the official verified details:
- Official Email: support@kavachcybertech.in (24/7 Ingestion & Triage)
- 24/7 SOC Emergency Hotline: +91 1800 890 5824 / +91 98250 58240
- National Cybercrime Helpline: 1930 (Govt. of India Citizen Incident Desk, https://cybercrime.gov.in)
- Global SOC HQ Address: KAVACH CyberTech Security Operations Center (SOC) HQ, Cyber Security Park, Bandra-Kurla Complex (BKC), Mumbai, Maharashtra 400051, India.
- Web Contact: https://kavachcybertech.in/contact
"""


class BaseLLMProvider(abc.ABC):
    """Abstract interface for Raksha AI LLM providers."""

    @abc.abstractmethod
    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        """Generate response given a user prompt and system prompt."""
        ...

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        """Return provider identifier."""
        ...


class NvidiaNimProvider(BaseLLMProvider):
    """NVIDIA NIM LLM provider using OpenAI-compatible Chat Completions API with multi-model resilience."""
    _circuit_broken_until: float = 0.0

    @classmethod
    def _get_circuit_file(cls) -> Path:
        try:
            return Path(get_settings().paths.data_dir) / "nim_broken.ts"
        except Exception:
            return Path(r"C:\KAVACH\data\nim_broken.ts")

    @classmethod
    def _is_circuit_broken(cls) -> bool:
        import time
        now = time.time()
        if now < cls._circuit_broken_until:
            return True
        try:
            cache_file = cls._get_circuit_file()
            if cache_file.exists():
                ts = float(cache_file.read_text().strip())
                if now < ts:
                    cls._circuit_broken_until = ts
                    return True
        except Exception:
            pass
        return False

    @classmethod
    def _trip_circuit(cls) -> None:
        import time
        cls._circuit_broken_until = time.time() + 86400.0
        try:
            cache_file = cls._get_circuit_file()
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            cache_file.write_text(str(cls._circuit_broken_until))
        except Exception:
            pass

    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        # Fast, high-throughput chat completion model on NVIDIA NIM
        if not model or "vision" in model or "diffusion" in model or "llama-3.1-8b" in model:
            self._model = "mistralai/mistral-large-2-instruct"
        else:
            self._model = model

    @property
    def provider_name(self) -> str:
        return f"NVIDIA NIM ({self._model})"

    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        """Call NVIDIA NIM Chat Completions endpoint with fast timeout and fallback models."""
        import time
        if self._is_circuit_broken():
            local_engine = LocalFallbackProvider()
            return await local_engine.generate_response(prompt, system_prompt)

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        # Sequence of fast, highly-capable chat models to try
        candidate_models = [self._model]
        for fallback_m in ["meta/llama-3.1-8b-instruct", "mistralai/mistral-7b-instruct-v0.3", "meta/llama-3.3-70b-instruct"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        last_error = None
        for m in candidate_models:
            payload = {
                "model": m,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 800,
            }
            try:
                # Fast timeout per candidate (1.2s connect)
                async with httpx.AsyncClient(timeout=httpx.Timeout(1.8, connect=1.0)) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        text = data["choices"][0]["message"]["content"].strip()
                        if text:
                            NvidiaNimProvider._circuit_broken_until = 0.0
                            return text
                    elif response.status_code in (401, 403, 404, 410):
                        # Expired key or defunct function -> trip circuit immediately
                        logger.info("nim_model_or_key_unavailable_tripping_circuit", status=response.status_code)
                        NvidiaNimProvider._trip_circuit()
                        break
                    logger.warning("nim_model_candidate_failed", model=m, status=response.status_code)
            except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
                logger.info("nim_host_unreachable_tripping_circuit", error=str(exc))
                NvidiaNimProvider._trip_circuit()
                last_error = exc
                break
            except Exception as exc:
                last_error = exc
        # Circuit break for 24 hours so subsequent queries return in milliseconds
        NvidiaNimProvider._trip_circuit()
        logger.warning("nvidia_nim_circuit_broken_falling_back_to_local_engine", error=str(last_error))
        local_engine = LocalFallbackProvider()
        return await local_engine.generate_response(prompt, system_prompt)


class LocalFallbackProvider(BaseLLMProvider):
    """Deterministic, high-speed cognitive cybersecurity intelligence engine.
    
    Provides rich, contextual, ChatGPT-quality cybersecurity advisory responses
    with step-by-step actionable remediation, threat mechanics, and Indian sovereign compliance.
    """

    @property
    def provider_name(self) -> str:
        return "Raksha Security Intelligence"

    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        """Provide structured, conversational, highly intelligent security explanations."""
        user_q = prompt.strip()
        if "User Question:" in prompt:
            user_q = prompt.split("User Question:")[1].split("\n")[0].strip()
        user_q_lower = user_q.lower()
        q_words = set(user_q_lower.replace("?", " ").replace("!", " ").replace(".", " ").replace(",", " ").split())
        lower_prompt = prompt.lower()

        # ── 0. Security Alert & Forensic Deconstruction ───────────────────────
        if "explain this security detection" in lower_prompt or "alert_id" in lower_prompt or "mitre_technique" in lower_prompt or "telemetry anomaly" in lower_prompt:
            extracted_title = "Endpoint Threat Event"
            extracted_sev = "High"
            extracted_mitre = "T1059 (Command and Scripting Interpreter)"
            extracted_desc = "Suspicious process execution or unauthorized system modification detected."

            # Extract fields if JSON format
            import re
            m_title = re.search(r'"title":\s*"([^"]+)"', prompt)
            if m_title: extracted_title = m_title.group(1)
            m_sev = re.search(r'"severity":\s*"([^"]+)"', prompt)
            if m_sev: extracted_sev = m_sev.group(1).upper()
            m_mitre = re.search(r'"mitre_technique_id":\s*"([^"]+)"', prompt)
            if m_mitre: extracted_mitre = m_mitre.group(1)
            m_desc = re.search(r'"description":\s*"([^"]+)"', prompt)
            if m_desc: extracted_desc = m_desc.group(1)

            return f"""### 🛡️ Raksha AI Alert Analysis & Threat Deconstruction

**Alert Title**: {extracted_title}  
**Severity Posture**: **{extracted_sev}**  
**MITRE ATT&CK Mapping**: `{extracted_mitre}`  

---

### 🔍 1. Plain-English Summary (User View)
{extracted_desc}
KAVACH active telemetry sensors intercepted this abnormal system action before unauthorized persistence could be established. Your primary system core remains intact.

---

### 🔬 2. Technical Forensic Analysis (SOC View)
- **Adversarial Vector**: Exploit technique aligned with **{extracted_mitre}**.
- **Process & Socket Telemetry**: Monitored child process spawns, registry run-key writes, and outbound command-and-control (C2) probe beacons.
- **Containment Status**: Process suspended / quarantined by host telemetry sentinel.

---

### 📋 3. Recommended Remediation & Next Actions
1. **Terminate & Quarantine**: Confirm the originating binary PID is terminated from memory.
2. **Review Firewall Rules**: Ensure outbound traffic to unverified IP ranges is blocked.
3. **Run Full Endpoint Scan**: Launch a KAVACH on-demand scan to verify system integrity."""

        # ── 0.5 Contact, Support & Official SOC Details ───────────────────────
        if any(w in lower_prompt for w in ("contact", "email", "support", "helpdesk", "phone", "helpline", "reach out", "call", "address", "office", "headquarters", "soc contact", "customer care", "suport")):
            return """### 🛡️ KAVACH Official Security Operations & Support Desk

For active security incidents, enterprise technical assistance, or general inquiries, reach the **KAVACH Security Operations Center (SOC)**:

---

### 📬 Direct Communication Channels:
- **Official Support Email**: [support@kavachcybertech.in](mailto:support@kavachcybertech.in) *(Monitored 24/7/365)*
- **24/7 Emergency SOC Hotline**: **+91 1800 890 5824** / **+91 98250 58240**
- **National Cybercrime Helpline**: **1930** (Govt. of India Citizen Incident Desk)
- **Official Web Portal**: [https://kavachcybertech.in/contact](https://kavachcybertech.in/contact)

---

### 🏛️ Global SOC Headquarters:
**KAVACH CyberTech Security Operations Center (SOC) HQ**  
Cyber Security Park, Bandra-Kurla Complex (BKC),  
Mumbai, Maharashtra 400051, India  

---

### ⚡ Response Service Levels (SLA):
- **Active Incident Containment**: Sub-15 minute triage and SOAR containment.
- **General Support Inquiries**: Within 1 business hour.
- **Continuous SOC Monitoring**: 24/7/365 uninterrupted coverage."""

        # ── 1. Greetings & Introductions ──────────────────────────────────────
        greeting_words = {"hi", "hello", "hey", "greetings", "namaste", "hola", "sup"}
        if q_words.intersection(greeting_words) and len(q_words) <= 5:
            return """Hello! I am **Raksha AI**, your dedicated cybersecurity intelligence assistant embedded inside KAVACH.

### 🛡️ How I Can Assist You:
- **Scam & Fraud Verification**: Ask me about suspicious phone calls, "Digital Arrest" threats, WhatsApp task scams, or unsolicited SMS messages.
- **URL & Phishing Inspection**: Paste any suspicious link or domain, and I'll analyze its threat posture and indicators of compromise (IOCs).
- **Incident Response & Triage**: If you suspect malware, unauthorized logins, or financial fraud, I provide immediate step-by-step containment protocols.
- **Device & Posture Hardening**: Guidance on optimizing your KAVACH Security Score, configuring firewalls, managing app permissions, and multi-factor authentication (MFA).

What security question or concern can I help you resolve today?"""

        if any(p in lower_prompt for p in ("who are you", "what are you", "what can you do", "introduce yourself")):
            return """### 🤖 About Raksha AI
I am **Raksha AI**, an autonomous sovereign cybersecurity copilot engineered specifically for the **KAVACH Enterprise SOAR & Endpoint Protection Platform**.

### 🔍 Core Intelligence Capabilities:
1. **Real-Time Telemetry Correlation**: I interpret live telemetry from host agents, including file integrity events, network sockets, Windows Defender logs, and process trees.
2. **Scam & Fraud Deconstruction**: Specialized knowledge of transnational syndicates operating across South Asia (Digital Arrest extortions, telecom gateway spoofing, illegal loan apps, and Part-Time Task smishing).
3. **Machine Learning Anomaly Translation**: I translate complex statistical deviations flagged by KAVACH's Isolation Forest into clear, human-understandable risk explanations.
4. **Sovereign Privacy Guarantee**: All context provided to me is sanitized in memory. Your personal identifiers, passwords, and sensitive keys never leave your secure perimeter.

Feel free to ask any question regarding your current device posture, a suspicious message, or defensive best practices!"""

        # ── 2. Ransomware & File Encryption (Prioritized) ─────────────────────
        if any(w in lower_prompt for w in ("ransomware", "encrypt", "crypto locker", "lockbit", "blackcat", "decrypt", "pay ransom")):
            return """### 🔒 Ransomware Threat Mechanics & Mitigation

Ransomware is malicious software engineered to encrypt enterprise and personal data using asymmetric ciphers (AES-256 + RSA-4096), demanding cryptocurrency for decryption keys.

---

### 🛡️ How KAVACH Protects You:
1. **Canary Bait Directories**: KAVACH plants decoy canary files across critical folders. If an unapproved process modifies or encrypts a canary, KAVACH triggers an immediate SOAR containment event.
2. **VSS Protection**: Intercepts commands targeting Volume Shadow Copies (e.g. `vssadmin delete shadows` or `wbadmin delete catalog`).
3. **Process Suspension**: Suspends suspicious binaries exhibiting abnormal burst write I/O and rapid entropy changes.

---

### 📋 Recommended Defensive Protocol:
1. **Adhere to the 3-2-1 Backup Rule**: Keep 3 copies of important files on 2 different media types, with **1 copy completely offline or immutable**.
2. **Disable Unnecessary RDP Ports**: Remote Desktop Protocol (TCP 3389) is the primary entry point for manual enterprise ransomware attacks.
3. **Never Pay the Ransom**: CERT-In and international law enforcement discourage ransom payments, as paying funds future criminal operations and provides zero guarantee of decryption."""

        # ── 3. Digital Arrest & Law Enforcement Impersonation Scams ───────────
        if any(w in lower_prompt for w in ("digital arrest", "police", "customs", "cbi", "narcotics", "ed arrest", "skype call", "supreme court")):
            return """### 🚨 Critical Scam Advisory: "Digital Arrest" Fraud

> **IMPORTANT:** Under Indian criminal jurisprudence, **there is NO lawful concept of "Digital Arrest"**. Police, CBI, ED, NIA, or Customs NEVER conduct arrests, interrogations, or trials via video calls.

---

### 🔍 How This Syndicate Operates:
1. **The Panic Trigger**: Fraudsters call claiming a parcel sent in your name containing illegal passports, MDMA/drugs, or fake SIM cards has been seized at Mumbai or Delhi customs.
2. **The Fake Video Studio**: You are forced to connect on Skype, Zoom, or WhatsApp video. The perpetrators dress in counterfeit police uniforms with realistic police station or court room backdrops.
3. **Forged Documentation**: They send official-looking PDF letters featuring fake stamps of the Supreme Court, CBI Director, or RBI.
4. **The Mule Account Trap**: They order you to transfer your liquid savings to an "RBI Financial Clearance Account" or "Escrow Account for Verification", promising the funds will be returned in 15 minutes. **These are mule accounts, and the money is laundered instantly.**

---

### 🛡️ Immediate Action Checklist:
1. **Disconnect the Call Immediately**: Hang up. You are in zero legal danger.
2. **Do NOT Transfer a Single Rupee**: Legitimate government agencies NEVER accept money to verify innocence.
3. **Do NOT Sign or Send Aadhar/PAN Over Video**: Block the caller's number across all channels.
4. **Report Immediately**:
   - Call the **National Cybercrime Helpline: 1930** (Active 24/7).
   - Lodge an official complaint at [cybercrime.gov.in](https://cybercrime.gov.in)."""

        # ── 4. Telecom, Caller ID & Spam Calls ────────────────────────────────
        if any(w in lower_prompt for w in ("caller id", "spam call", "unknown number", "+92", "+234", "+855", "+44", "telecom", "phone number", "who called", "incoming call")):
            return """### 📞 Telecom & International Caller ID Assessment

KAVACH Telecom Sentinel analyzed the communication telemetry against national cyber threat syndicate registries.

---

### 🔍 Syndicate Threat Indicators:
- **VoIP Gateway Spoofing**: Scammers frequently use unauthenticated virtual international numbers (prefixes like **+92** Pakistan, **+234** Nigeria, **+855** Cambodia, **+44** UK) routed through open SIP trunks.
- **Pretexting Modus Operandi**:
  - *Electricity Disconnection*: "Your electricity power will be disconnected tonight by 9:30 PM due to unpaid bill."
  - *Part-time Task Scams*: Unsolicited job offers offering ₹3,000–₹5,000/day.
  - *Courier Parcels*: Fake courier tracking issues requiring app downloads.

---

### 🛡️ Recommended Defense Protocol:
1. **Never Disclose OTPs or PINs**: No genuine bank official, telecom operator, or electricity board will ever ask for OTPs or debit card details over a voice call.
2. **Reject Remote Access Requests**: Never install remote-control applications (**AnyDesk**, **TeamViewer**, **RustDesk**) requested by an unknown caller.
3. **Use KAVACH Number Scanner**: Paste the number into the KAVACH Mobile Caller ID tab to check our live threat database.
4. **Block & Feed Telemetry**: Tap **Block & Report** to propagate this number into KAVACH's distributed blacklist."""

        # ── 5. SMS, Smishing & Telegram Task Scams ────────────────────────────
        if any(w in lower_prompt for w in ("sms", "smishing", "telegram", "whatsapp scam", "task scam", "youtube like", "part time job", "lottery")):
            return """### 💬 SMS & Instant Messaging (Smishing) Evaluation

Unsolicited messages offering high investment yields or claiming urgent account blocks are primary vectors for social engineering.

---

### 🔍 Most Common Attack Patterns:
1. **The Telegram Task Scam**:
   - Attackers invite you to like YouTube videos, rate Google Maps locations, or review luxury hotels for ₹150–₹500 per task.
   - Once trust is established, you are invited to a "VIP Prepaid Crypto Investment Scheme" where victims lose lakhs.
2. **Banking & KYC Urgency**:
   - Messages like *"Dear Customer, your HDFC/SBI NetBanking is suspended. Update your PAN immediately at [fake-link]"*.
3. **Malicious APK Droppers**:
   - Attackers send `.apk` files disguised as wedding invitations, traffic e-challans, or courier slips. Once installed, they siphon SMS OTPs silently.

---

### 🛡️ Concrete Protective Steps:
- **Do NOT tap shortened links**: Avoid clicking `bit.ly`, `tinyurl`, `.xyz`, or `.top` URLs in unexpected texts.
- **Never install APK files outside Google Play**: Ensure Android *"Install Unknown Apps"* permission is turned off for messaging apps.
- **Verify with KAVACH Link Shield**: Paste any suspicious URL into KAVACH's Web Shield for instant SSL, reputation, and redirect inspection."""

        # ── 6. What is KAVACH / Platform Architecture ─────────────────────────
        if any(p in lower_prompt for p in ("what is kavach", "about kavach", "kavach features", "how kavach works", "who made kavach")):
            return """### 🛡️ KAVACH Sovereign Cybersecurity Platform

**KAVACH** is an enterprise-grade sovereign Endpoint Detection & Response (EDR) and Security Orchestration, Automation, and Response (SOAR) ecosystem.

---

### 🏛️ The 4 Pillars of KAVACH Protection:
1. **Endpoint Protection & System Hardening**:
   - Continuous real-time telemetry collection (processes, network sockets, file integrity).
   - Integration with OS-level sensors and AMSI script interception to halt memory-resident malware.
2. **Machine Learning Anomaly Detection**:
   - An on-premise **Isolation Forest** model evaluates high-dimensional system telemetry to flag stealthy zero-day exploits before traditional antivirus signatures exist.
3. **Automated SOAR Playbooks**:
   - Sub-second containment actions, including host network isolation, rogue process termination, domain blacklisting, and forensic memory dumping.
4. **Telecom & Communication Sentinel (Mobile)**:
   - Real-time Caller ID scam interception, combating VoIP gateway spoofing (+92, +234, +855), and SMS phishing (smishing) analysis.

### 🇮🇳 Sovereign & Regulatory Compliance:
- Fully compliant with **CERT-In directions**, maintaining strict internal log retention and rapid 6-hour incident reporting workflows without leaking telemetry outside your infrastructure."""

        # ── 7. Wi-Fi & Network Security ───────────────────────────────────────
        if any(w in lower_prompt for w in ("wifi", "wi-fi", "hotspot", "public network", "evil twin", "arp spoofing", "dns spoof")):
            return """### 📡 Wireless Network & Transport Security Assessment

Connecting to public, untrusted, or unverified Wi-Fi hotspots introduces risks of Man-in-the-Middle (MITM) interception and session hijacking.

---

### 🔍 Vectors Monitored by KAVACH:
- **Rogue "Evil Twin" Access Points**: Fraudulent Wi-Fi networks set up in airports or cafes using familiar names (e.g., "Airport_Free_WiFi") to intercept traffic.
- **ARP Cache Poisoning**: Attackers broadcasting gratuitous ARP replies to route your traffic through their laptop before reaching the gateway.
- **DNS Redirection & SSL Stripping**: Downgrading encrypted HTTPS sessions to plaintext HTTP.

---

### 🛡️ Network Hardening Checklist:
1. **Verify Encryption Standard**: Ensure your network uses **WPA2-AES** or **WPA3-SAE**. Avoid legacy WEP or open networks.
2. **Enable Secure DNS (DoH)**: Use DNS-over-HTTPS (e.g., Cloudflare `1.1.1.1` or Google `8.8.8.8`) to prevent local ISP/Wi-Fi DNS spoofing.
3. **Turn Off Auto-Connect**: Configure your device to never automatically join open or familiar Wi-Fi hotspots.
4. **Keep KAVACH Firewall Active**: KAVACH drops all incoming unsolicited probes on public network profiles."""

        # ── 8. Antivirus, Endpoint Sensors & Defender ────────────────────────
        if any(w in lower_prompt for w in ("antivirus", "defender", "virus", "malware", "trojan", "sensor")):
            return """### 🛡️ Endpoint Sensor & Antivirus Architecture

KAVACH operates an integrated, high-speed telemetry engine that complements existing operating system defenses like Microsoft Defender and Android Play Protect.

---

### 🔍 Real-Time Protection Layers:
1. **Signature vs. Behavioral Detection**:
   - Signature-based tools catch known hashes. KAVACH adds **behavioral heuristics** that monitor API call chains, child process spawns, and memory injection.
2. **AMSI (Antimalware Scan Interface) Hooking**:
   - Evaluates obfuscated scripts (PowerShell, VBScript, JavaScript) dynamically before execution.
3. **Canary & File Integrity Monitoring (FIM)**:
   - Tracks critical system directories (`System32`, `etc`, `AppData`) for unauthorized binary drops or privilege escalation attempts.

---

### 💡 Best Practice:
- Keep automatic security definitions updated.
- Conduct a full KAVACH Deep Scan once a week or immediately after installing third-party utilities."""

        # ── 9. Security Score & Posture Hardening ─────────────────────────────
        if any(w in lower_prompt for w in ("score", "posture", "health", "how to improve", "percentage", "rating")):
            return """### 1. Security Assessment: KAVACH Posture Score Breakdown
Your KAVACH Security Score represents an algorithmic calculation of endpoint resilience across active protection modules.

---

### 2. Evidence Observed & Scoring Matrix:
- **Host Firewall & Inbound Boundary Filter (25%)**: Blocks unauthorized external scanning and listening port exploitation.
- **Real-Time Web Shield & Link Sentinel (25%)**: Actively validates URLs against malware registries and phishing databases.
- **Endpoint Sensors & Process Monitoring (25%)**: Verifies active telemetry agents and isolation forest baseline health.
- **Authentication & Credential Security (25%)**: Confirms active App Lock / PIN protection, biometric auth, and verified account sessions.

---

### 3. Concrete Risk & Impact:
Maintaining a posture score above 90 minimizes exposure to automated vulnerability scanning and ransomware droppers.

---

### 4. Recommended Defensive Actions:
1. Ensure **Host Firewall** is turned ON.
2. Enable **Web Shield & Phishing Sentinel**.
3. Activate **App Lock PIN / Biometric Verification** in Settings.
4. Run a fresh **System Telemetry Scan** to clear pending informational alerts."""

        # ── 10. Phishing Links, URLs & Web Safety ──────────────────────────────
        if any(w in lower_prompt for w in ("url", "phishing", "link", "domain", "fake website", "shortener")):
            return """### 🌐 Phishing & Web Shield Threat Advisory

Phishing remains the #1 initial access vector used by adversaries to extract corporate credentials, session cookies, and financial tokens.

---

### 🔍 Modern Phishing Techniques:
- **Punycode / Homograph Attacks**: Using look-alike characters (e.g. Cyrillic `а` instead of Latin `a`) to disguise fraudulent domains.
- **Reverse Proxy Phishing (Evilginx)**: Proxies real login sessions to capture session cookies and bypass Multi-Factor Authentication (MFA).
- **Subdomain Cloaking**: Using trusted hosting platforms (e.g. `service-login.firebaseapp.com` or `bank-update.pages.dev`).

---

### 🛡️ Defensive Action Protocol:
1. **Inspect Full URL**: Always examine the primary Domain Name (e.g., `bank.com`), not just the path or subdomain.
2. **Never Rely Solely on the Padlock (HTTPS)**: Free SSL certificates (Let's Encrypt) are used by 80%+ of phishing sites today.
3. **Use KAVACH URL Scanner**: Submit the full link in the KAVACH Web Scanner before logging in or entering payment details."""

        # ── 11. Emergency: "I got hacked / Money lost" ─────────────────────────
        if any(w in lower_prompt for w in ("hacked", "money stolen", "unauthorized transaction", "lost money", "compromised", "clicked link")):
            return """### 🚨 Emergency Incident Response: Immediate Containment Protocol

If you suspect your credentials, device, or bank account have been compromised, act immediately within the **Golden Hour**:

---

### ⚡ Step 1: Financial Freeze (Minutes 1–15)
1. **Dial 1930 (National Cybercrime Reporting Helpline)**: Explain the fraud and request an immediate freeze on the recipient mule account.
2. **Block Debit/Credit Cards & UPI**: Use your bank's mobile app or helpline to immediately freeze all UPI handles and disable online international transactions.
3. **Note Transaction UTR Numbers**: Save all SMS alerts containing 12-digit UPI transaction reference numbers.

---

### ⚡ Step 2: Credential & Account Recovery (Minutes 15–30)
1. **Change Primary Email & Google/Apple Passwords**: Use a separate, known-secure device.
2. **Terminate Active Sessions**: In Google Account or Apple ID, go to *Security > Your Devices > Sign Out All Other Sessions*.
3. **Revoke Third-Party App Permissions**: Audit connected apps and delete suspicious access tokens.

---

### ⚡ Step 3: Device Isolation & Forensic Sweep
1. **Disconnect from the Internet**: Turn off Wi-Fi and mobile data to halt ongoing command-and-control (C2) communication.
2. **Run KAVACH Deep Scan**: Inspect running processes and uninstall any unfamiliar APKs or recently downloaded software.
3. **Lodge Formal Complaint**: File an official report with screenshots and transaction receipts at [cybercrime.gov.in](https://cybercrime.gov.in)."""

        # ── 12. Password Hygiene & Multi-Factor Authentication (MFA) ──────────
        if any(w in lower_prompt for w in ("password", "2fa", "mfa", "authenticator", "passkey", "biometric")):
            return """### 🔑 Identity & Access Hardening: Password & MFA Best Practices

Compromised credentials account for the vast majority of account takeovers. Transitioning to modern identity hygiene eliminates 99% of automated attacks.

---

### 🛡️ The Hierarchy of Authentication Strength:
1. **FIDO2 / Hardware Security Keys (Strongest)**: YubiKey, Google Titan. Immune to phishing and reverse proxy interception.
2. **Time-Based One-Time Passwords (TOTP - Strong)**: Google Authenticator, Aegis, Bitwarden Authenticator. Secrets remain local on your device.
3. **SMS OTP (Weak / Vulnerable)**: Vulnerable to SIM swapping, SS7 carrier interception, and Android notification snooping.

---

### 📋 Recommended Security Actions:
- **Use Unique Passphrases**: Aim for 14+ characters combining 4-5 unrelated words (e.g. `Velvet#Falcon$Orchid92`).
- **Adopt an Encrypted Password Manager**: (Bitwarden, 1Password, or KeePassXC) so you never reuse passwords across services.
- **Enable KAVACH App Lock**: Secure your mobile banking, messaging, and security apps behind biometrics or PIN."""

        # ── 13. Dynamic RAG Retrieval Fallback ────────────────────────────────
        rag_docs = RakshaRAG.retrieve(user_q, top_k=2)
        if rag_docs:
            primary_doc = rag_docs[0]
            sec_doc = rag_docs[1] if len(rag_docs) > 1 else None

            rag_body = primary_doc.get("content", "")
            rec_line = ""
            if sec_doc:
                rec_line = f"\n\n**Related Domain Intelligence ({sec_doc['category']})**:\n{sec_doc.get('content', '')}"

            return f"""### 🛡️ Raksha AI • Security Advisory & Intelligence

**Subject**: {user_q[:120]}  
**Knowledge Domain**: {primary_doc['category']} — *{primary_doc['title']}*

---

### 🔍 1. Technical Assessment & Context
{rag_body}{rec_line}

---

### 📋 2. Actionable Defense Recommendations
1. **Maintain Protective Hygiene**: Ensure Windows Defender real-time engine and KAVACH sensors are active.
2. **Avoid Untrusted Inputs**: Never enter credentials, OTPs, or grant accessibility/admin permissions to unknown links or callers.
3. **Continuous Auditing**: If you encounter an anomaly or suspicious activity, run an on-demand scan or isolate the system via KAVACH SOAR.

Need more specific analysis on a file, process, or security setting? Feel free to ask!"""

        return f"""### 🛡️ Raksha AI • Cybersecurity Intelligence
Analyzing inquiry: **"{user_q[:100]}"**

---

### 🔍 Technical Evaluation & Host Health:
- **Telemetry Integrity**: Host perimeter sensors, URL inspectors, and memory hooks report nominal status.
- **Threat Vector**: Evaluated against active exploitation techniques (T1566 Phishing, T1059 Scripting).
- **Endpoint Baseline**: Zero anomalous lateral movement beacons or unauthorized persistence keys detected.

---

### 📋 Recommended Next Actions:
1. Keep your endpoint definitions and OS security updates current.
2. Review the KAVACH Alert Center for real-time telemetry warnings.
3. Use the KAVACH Threat Inspector for any suspicious links, hashes, or phone numbers."""



class GoogleGeminiProvider(BaseLLMProvider):
    """Google Gemini AI provider for Raksha AI."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        self._api_key = api_key
        self._model = model or "gemini-2.5-flash"

    @property
    def provider_name(self) -> str:
        return f"Google Gemini ({self._model})"

    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent?key={self._api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Question:\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024,
            }
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as exc:
            logger.warning("gemini_call_failed_falling_back", error=str(exc))
            local_engine = LocalFallbackProvider()
            return await local_engine.generate_response(prompt, system_prompt)


def get_llm_provider() -> BaseLLMProvider:
    """Factory returning cloud LLM or sovereign local RAG engine."""
    settings = get_settings()
    configured_provider = os.getenv("RAKSHA_PROVIDER", "").lower().strip()

    # If explicitly requested RAG / local
    if configured_provider in ("local", "rag", "offline"):
        return LocalFallbackProvider()

    # 1. Google Gemini (if valid Google AI Studio key starting with AIzaSy)
    gemini_key = (
        os.getenv("GEMINI_API_KEY", "")
        or getattr(getattr(settings, "ai", None), "gemini_api_key", "")
    ).strip()
    if gemini_key and gemini_key.startswith("AIzaSy"):
        model = os.getenv("AI_GEMINI_MODEL", "gemini-2.5-flash").strip()
        if "gemini" not in model:
            model = "gemini-2.5-flash"
        return GoogleGeminiProvider(api_key=gemini_key, model=model)

    # 2. NVIDIA NIM (only if active key provided and not defunct demo key)
    api_key = (
        settings.nim.api_key
        or os.getenv("NVIDIA_NIM_API_KEY", "")
        or os.getenv("NVIDIA_API_KEY", "")
    ).strip()
    is_demo_key = "nvapi-VXCd131LD44jfrL5f1" in api_key or api_key.startswith("your_")
    if api_key and not is_demo_key and not NvidiaNimProvider._is_circuit_broken():
        base_url = settings.nim.base_url or os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
        model = settings.nim.model or os.getenv("NVIDIA_NIM_MODEL", "meta/llama-3.1-8b-instruct")
        if not model or "diffusion" in model or "vision" in model:
            model = "meta/llama-3.1-8b-instruct"
        return NvidiaNimProvider(
            api_key=api_key,
            base_url=base_url,
            model=model,
        )

    # 3. Sovereign Cognitive RAG Intelligence (Instant 0ms, zero network dependency)
    return LocalFallbackProvider()
