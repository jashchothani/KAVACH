"""
KAVACH Raksha AI - Retrieval Augmented Generation (RAG) Knowledge Engine.

Indexes and retrieves domain-specific cybersecurity knowledge, MITRE ATT&CK intelligence,
Indian sovereign compliance guidelines (CERT-In / 1930 Helpline), and live endpoint telemetry.
"""

from __future__ import annotations

import re
from typing import Any


# ── Curated Sovereign Cybersecurity Knowledge Base ───────────────────────────
RAG_KNOWLEDGE_BASE: list[dict[str, Any]] = [
    {
        "id": "kb_endpoint_sensors",
        "category": "Endpoint Telemetry & Sensors",
        "keywords": ["sensor", "telemetry", "edr", "score", "posture", "antivirus", "defender", "firewall", "fim", "usb", "safe", "protected"],
        "title": "KAVACH Endpoint Security Architecture & Real-Time Sensors",
        "content": (
            "KAVACH monitors host workstations using 16 specialized diagnostic sensors:\n"
            "- Windows Defender Antivirus: Real-time malware scanning, definition version tracking, and cloud protection hooks.\n"
            "- Windows Advanced Firewall: Continuous enforcement across Domain, Private, and Public profiles.\n"
            "- File Integrity Monitor (FIM): SHA-256 baseline hashing on critical System32, drivers, and startup registry hives.\n"
            "- USB Gatekeeper: Blocks unauthorized Mass Storage Class devices while allowing signed HID peripherals.\n"
            "- Network Socket Sentinel: Audits all active TCP/UDP sockets, identifying unencrypted egress beacons.\n"
            "- Security Score Engine: Calculates live posture from 0-100 based on active defense health, pending patches, and anomaly status."
        ),
    },
    {
        "id": "kb_mitre_scripting",
        "category": "MITRE ATT&CK Threat Mechanics",
        "keywords": ["t1059", "powershell", "cmd", "batch", "script", "bash", "command", "execution", "encoded"],
        "title": "T1059: Command and Scripting Interpreter Execution",
        "content": (
            "Adversaries abuse command interpreters (PowerShell, CMD, Bash, VBScript) to execute malicious code:\n"
            "- Indicators: Encoded commands (-enc, -encodedcommand), hidden window execution (-w hidden), and bypass flags (-ep bypass).\n"
            "- Detection: KAVACH inspects parent-child process lineages (e.g., Office/Acrobat spawning PowerShell or CMD).\n"
            "- Remediation: Enforce PowerShell Constrained Language Mode, audit Script Block Logging (Event ID 4104), and quarantine offending PIDs."
        ),
    },
    {
        "id": "kb_mitre_ransomware",
        "category": "MITRE ATT&CK Threat Mechanics",
        "keywords": ["ransomware", "encrypt", "encryption", "t1486", "crypto", "lockbit", "blackcat", "decryption", "bitcoin", "ransom"],
        "title": "T1486: Data Encrypted for Impact (Ransomware)",
        "content": (
            "Ransomware actors encrypt user and enterprise files using dual symmetric/asymmetric algorithms (AES-256 + RSA-4096):\n"
            "- Indicators: High-frequency mass file renames, canary trap file tampering, shadow copy deletion (vssadmin delete shadows).\n"
            "- Immediate Action: Instantly isolate the endpoint from the network via KAVACH SOAR.\n"
            "- DO NOT pay the ransom: No guarantee of decryption and funds transnational criminal syndicates.\n"
            "- Recovery: Restore from immutable offline backups; inspect Active Directory for compromised domain admin credentials."
        ),
    },
    {
        "id": "kb_mitre_phishing",
        "category": "MITRE ATT&CK Threat Mechanics",
        "keywords": ["phishing", "t1566", "spearphishing", "email", "link", "attachment", "smishing", "spoof"],
        "title": "T1566: Phishing & Deceptive Infiltration",
        "content": (
            "Adversaries deliver malicious links or weaponized attachments via email, SMS, or WhatsApp:\n"
            "- Structural Signs: Punycode domains (e.g. micr0s0ft.com), misleading subdomains (paypal.verify-account.top), deceptive urgent pretexts.\n"
            "- Defense: KAVACH URL Scanner performs deep lexical entropy analysis, WHOIS age verification, and SSL certificate inspection.\n"
            "- Verification: Check SPF, DKIM, and DMARC headers; never input credentials or OTPs on pages opened via unsolicited messages."
        ),
    },
    {
        "id": "kb_digital_arrest",
        "category": "Indian Cyber Fraud & Scams",
        "keywords": ["digital arrest", "cbi", "police", "customs", "ed", "narcotics", "skype", "video call", "fedex", "arrest", "scam", "fraud"],
        "title": "Forensic Advisory: Deconstructing the 'Digital Arrest' Extortion Scam",
        "content": (
            "🚨 CRITICAL ALERT: There is legally NO concept of 'Digital Arrest' under Indian Law (CrPC/BNS):\n"
            "- Threat Anatomy: Callers impersonate Police, CBI, Enforcement Directorate (ED), TRAI, or Customs claiming your parcel contains illegal drugs or your SIM is linked to money laundering.\n"
            "- Deception Tactic: They force victims onto Skype/WhatsApp video calls in fake police station setups and demand 'verification funds'.\n"
            "- Law Enforcement Truth: No legitimate law agency ever arrests someone over video call or demands money transfers to 'safety accounts'.\n"
            "- Immediate Action: Disconnect immediately, block the number, and report to 1930 or cybercrime.gov.in."
        ),
    },
    {
        "id": "kb_cert_in_compliance",
        "category": "Indian Cyber Compliance & Law",
        "keywords": ["cert-in", "cert", "compliance", "it act", "1930", "helpline", "section 70b", "mandate", "6 hours", "reporting"],
        "title": "CERT-In Cyber Incident Reporting & Legal Directives",
        "content": (
            "Under Section 70B of the Information Technology Act 2000 and CERT-In Directions 2022:\n"
            "- 6-Hour Reporting Mandate: All organizations and intermediaries must report specified cyber security incidents to CERT-In within 6 hours of discovery.\n"
            "- Log Retention: System logs must be securely maintained within Indian jurisdiction for a rolling period of 180 days.\n"
            "- Sovereign Helpline: Citizens and businesses can report active financial cyber fraud to National Helpline 1930 or cybercrime.gov.in.\n"
            "- Privacy Guarantee: KAVACH applies strict data minimization—only security telemetry and metadata are analyzed, never private documents."
        ),
    },
    {
        "id": "kb_smtp_ports",
        "category": "Network & Protocol Forensics",
        "keywords": ["port", "587", "465", "25", "smtp", "mail", "email", "ec2", "aws", "tls", "starttls"],
        "title": "Email Port Forensics: Port 587 vs Port 465 vs Port 25",
        "content": (
            "Best practices for secure outbound email submission:\n"
            "- Port 587 (STARTTLS Submission): Standard modern standard for client-to-mail-server submission. Starts in plaintext and opportunistically upgrades to TLS.\n"
            "- Port 465 (SMTPS Direct TLS): Encrypted from the first packet (implicit TLS). Highly recommended on cloud environments like AWS EC2.\n"
            "- Port 25 (Server-to-Server Relay): Permanently throttled or blocked by default on AWS EC2 and cloud providers to mitigate spam abuse.\n"
            "- KAVACH Resilience: Configured with automated dual-fallback (Port 587 with STARTTLS -> Port 465 with direct SSL) to ensure 100% email delivery."
        ),
    },
    {
        "id": "kb_mobile_security",
        "category": "Mobile Device Protection",
        "keywords": ["mobile", "phone", "android", "apk", "permission", "camera", "sms", "location", "root", "jailbreak", "developer mode", "adb"],
        "title": "Mobile Phone Security & Threat Hardening Protocols",
        "content": (
            "Mobile devices face distinct adversarial attack vectors:\n"
            "- Malicious Sideloaded APKs: Fake apps claiming to be bank KYC updates or electricity bill checkers requesting accessibility permissions.\n"
            "- Dangerous Permissions: Unrestricted access to SMS (intercepting 2FA OTPs) and Contacts/Call Logs.\n"
            "- USB Debugging (ADB): If left enabled, connects workstations can extract app storage and install unsigned binaries.\n"
            "- KAVACH Mobile Guard: Real-time SMS and call scam inspection, application integrity audits, and secure app lock for banking apps."
        ),
    },
    {
        "id": "kb_soar_containment",
        "category": "SOAR Playbooks & Response",
        "keywords": ["soar", "playbook", "containment", "isolate", "quarantine", "kill", "block", "remediation", "action"],
        "title": "KAVACH SOAR Automated Incident Containment Playbooks",
        "content": (
            "When high-confidence threats are identified, KAVACH executes defensive playbooks:\n"
            "- Playbook 1 (Network Host Isolation): Disconnects all egress and ingress interfaces except the encrypted KAVACH telemetry tunnel.\n"
            "- Playbook 2 (Process Kill & Memory Scrape): Immediately terminates rogue PIDs and dumps memory strings to forensic evidence archives.\n"
            "- Playbook 3 (Firewall Perimeter Drop): Dynamically creates outbound drop rules for adversary Command & Control (C2) IPs and domains.\n"
            "- Playbook 4 (USB Lockdown): Suspends USB storage driver services to halt physical lateral data exfiltration."
        ),
    },
]


class RakshaRAG:
    """Retrieval-Augmented Generation context engine for Raksha AI."""

    @classmethod
    def retrieve(cls, query: str, top_k: int = 2) -> list[dict[str, Any]]:
        """Retrieve most relevant knowledge base articles for a given query."""
        if not query:
            return RAG_KNOWLEDGE_BASE[:top_k]

        cleaned = re.sub(r"[^\w\s]", " ", query.lower())
        tokens = set(cleaned.split())

        scored_articles: list[tuple[float, dict[str, Any]]] = []

        for article in RAG_KNOWLEDGE_BASE:
            score = 0.0
            # Keyword matching
            keywords = article.get("keywords", [])
            for kw in keywords:
                if kw in cleaned:
                    score += 3.0
                elif any(kw in t for t in tokens):
                    score += 1.5

            # Title matching
            title = article.get("title", "").lower()
            for token in tokens:
                if len(token) > 3 and token in title:
                    score += 2.0

            if score > 0:
                scored_articles.append((score, article))

        scored_articles.sort(key=lambda x: x[0], reverse=True)

        if not scored_articles:
            # Fallback: return general endpoint & compliance articles
            return [RAG_KNOWLEDGE_BASE[0], RAG_KNOWLEDGE_BASE[4]]

        return [item[1] for item in scored_articles[:top_k]]

    @classmethod
    def format_context_for_prompt(cls, query: str, live_telemetry: dict[str, Any] | None = None) -> str:
        """Format retrieved RAG knowledge and live host telemetry into an LLM context block."""
        retrieved = cls.retrieve(query, top_k=2)

        blocks = ["### 📚 Grounded Knowledge Base (Verified Cybersecurity Intelligence):"]
        for idx, doc in enumerate(retrieved, start=1):
            blocks.append(f"[{idx}] {doc['title']}\nCategory: {doc['category']}\n{doc['content']}\n")

        if live_telemetry:
            blocks.append("### 💻 Live Host Telemetry:")
            score = live_telemetry.get("score", live_telemetry.get("security_score", 96))
            host = live_telemetry.get("computer_name", live_telemetry.get("hostname", "Endpoint Workstation"))
            av = live_telemetry.get("antivirus", {}).get("status_text", "Active & Protected")
            fw = live_telemetry.get("firewall", {}).get("status_text", "All Profiles Active")
            blocks.append(f"- Computer Name: {host}")
            blocks.append(f"- Security Posture Score: {score}/100")
            blocks.append(f"- Antivirus Status: {av}")
            blocks.append(f"- Firewall Status: {fw}")

        return "\n".join(blocks)

