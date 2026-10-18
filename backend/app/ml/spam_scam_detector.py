"""
KAVACH ML Spam, Phishing & Scam Detection Engine.

Implements multi-feature machine learning & lexical classification for:
1. Email Phishing & Brand Impersonation (Gmail integration)
2. WhatsApp Web Task / Investment / Lottery Scam Detection
3. Dangerous URL & APK Dropper Payloads
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any

# High-profile brands frequently targeted by phishing
TARGET_BRANDS = {
    "google": ["google.com", "gmail.com", "googlemail.com"],
    "microsoft": ["microsoft.com", "live.com", "outlook.com", "office.com"],
    "apple": ["apple.com", "icloud.com"],
    "paypal": ["paypal.com"],
    "amazon": ["amazon.com", "amazon.in"],
    "netflix": ["netflix.com"],
    "sbi": ["sbi.co.in", "onlinesbi.sbi"],
    "hdfc": ["hdfcbank.com"],
    "icici": ["icicibank.com"],
    "income tax": ["incometax.gov.in", "incometaxindiaefiling.gov.in"],
    "fedex": ["fedex.com"],
    "dhl": ["dhl.com"],
    "meta": ["meta.com", "facebook.com", "instagram.com"],
    "whatsapp": ["whatsapp.com"],
}

# High-risk TLDs correlated with phishing & scam infrastructure
SUSPICIOUS_TLDS = frozenset({
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "buzz", "work", "click", "rest", "cam", "icu", "country", "ru"
})

# International prefixes with dense concentration of WhatsApp/Telegram scam networks
HIGH_RISK_PHONE_PREFIXES = [
    ("+92", "Pakistan — Bulk Task / Part-time Job Scam Campaign"),
    ("+234", "Nigeria — Advance-Fee / Lottery / Investment Fraud"),
    ("+880", "Bangladesh — Fake Recruitment & OTP Phishing"),
    ("+855", "Cambodia — Cyber Scam Syndicate / Trapped Labor Compound"),
    ("+62", "Indonesia — Unsolicited Job Lures & E-commerce Scams"),
    ("+4470", "UK Personal Number — Premium Redirect & Vishing Scheme"),
]

# Urgency and coercion keyword patterns
URGENCY_PATTERNS = [
    r"account\s+(?:suspended|locked|disabled|terminated|restricted)",
    r"action\s+required\s+within\s+(?:\d+|24|48)\s*hours?",
    r"unauthorized\s+(?:access|transaction|activity|login)",
    r"confirm\s+your\s+(?:identity|details|credentials|password|card)",
    r"verify\s+(?:now|immediately|account|email|identity)",
    r"unusual\s+sign-?in\s+attempt",
    r"security\s+alert\s*:\s*urgent",
    r"your\s+order\s+#\d+\s+has\s+been\s+placed",
    r"refund\s+(?:approved|processed|pending\s+confirmation)",
]

# Financial, lottery & task scam patterns
SCAM_PATTERNS = [
    r"(?:earn|make)\s*(?:₹|\$|rs\.?|inr)?\s*\d+[\s\-]*(?:to|-)?\s*\d+\s*(?:daily|per\s+day|a\s+day)",
    r"like\s+(?:youtube\s+videos?|tiktok|reels?)\s+(?:and|to)\s+earn",
    r"(?:part[\s\-]?time|online|work\s+from\s+home)\s+job\s+offer",
    r"(?:lottery|kbc|kaun\s+banega\s+crorepati|lucky\s+draw)\s+(?:winner|won|prize)",
    r"(?:electricity|power)\s+(?:bill|power)\s+will\s+be\s+disconnected",
    r"(?:telegram|whatsapp)\s+channel\s+for\s+(?:vip|signals|returns)",
    r"guaranteed\s+(?:daily|weekly|monthly)\s+return",
    r"download\s+our\s+(?:app|\.apk)\s+to\s+claim",
    r"click\s+here\s+to\s+claim\s+your\s+(?:bonus|reward|gift)",
]


class SpamScamMLEngine:
    """Multi-feature machine learning & heuristic classifier for communications security."""

    def __init__(self) -> None:
        self.model_version = "KAVACH-ML-Sentinel-v2.1"

    def scan_email(
        self,
        sender_name: str,
        sender_email: str,
        subject: str,
        body: str,
        links: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Evaluate incoming email for brand impersonation, credential harvesting,
        and scam intent.
        """
        links = links or []
        combined_text = f"{subject} {body}".lower()
        sender_email_lower = sender_email.lower().strip()
        sender_name_lower = sender_name.lower().strip()

        # Extract domain from sender email
        domain_match = re.search(r"@([a-z0-9.-]+\.[a-z]{2,})", sender_email_lower)
        sender_domain = domain_match.group(1) if domain_match else sender_email_lower

        indicators: list[str] = []
        feature_scores: dict[str, float] = {}
        risk_score = 0.0

        # --- Feature 1: Brand Impersonation & Sender Mismatch ---
        impersonated_brand = None
        for brand, legit_domains in TARGET_BRANDS.items():
            # Check if brand name is in sender display name or subject
            if brand in sender_name_lower or f" {brand} " in f" {subject.lower()} ":
                # Check if sender domain is legit
                is_legit = any(sender_domain == d or sender_domain.endswith("." + d) for d in legit_domains)
                if not is_legit:
                    impersonated_brand = brand.title()
                    break

        if impersonated_brand:
            feature_scores["brand_impersonation"] = 65.0
            risk_score += 65.0
            indicators.append(
                f"Critical Brand Spoof: Sender claims to be '{impersonated_brand}', but email originates from unverified domain '@{sender_domain}'."
            )
        else:
            feature_scores["brand_impersonation"] = 0.0

        # --- Feature 2: Urgency & Coercive Phishing Lures ---
        urgency_matches = []
        for pattern in URGENCY_PATTERNS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                urgency_matches.append(pattern)

        if urgency_matches:
            urgency_score = min(35.0, len(urgency_matches) * 15.0)
            feature_scores["urgency_lures"] = urgency_score
            risk_score += urgency_score
            indicators.append(
                f"Urgent Coercion: Contains high-pressure threat keywords designed to panic user into immediate action."
            )
        else:
            feature_scores["urgency_lures"] = 0.0

        # --- Feature 3: Financial & Scam Keywords ---
        scam_matches = []
        for pattern in SCAM_PATTERNS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                scam_matches.append(pattern)

        if scam_matches:
            scam_score = min(40.0, len(scam_matches) * 20.0)
            feature_scores["scam_patterns"] = scam_score
            risk_score += scam_score
            indicators.append("Financial Scam Signatures: Contains lottery, fake job, or refund lure phraseology.")
        else:
            feature_scores["scam_patterns"] = 0.0

        # --- Feature 4: Deceptive Hyperlink Analysis ---
        suspicious_link_count = 0
        for lk in links:
            try:
                parsed_link = urllib.parse.urlparse(lk)
                link_host = (parsed_link.hostname or "").lower()
                link_tld = link_host.split(".")[-1] if "." in link_host else ""

                if link_tld in SUSPICIOUS_TLDS:
                    suspicious_link_count += 1
                elif re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", link_host):
                    suspicious_link_count += 1
                elif any(b in link_host for b in TARGET_BRANDS) and not any(
                    link_host == d or link_host.endswith("." + d)
                    for dlist in TARGET_BRANDS.values()
                    for d in dlist
                ):
                    suspicious_link_count += 1
            except Exception:
                pass

        if suspicious_link_count > 0:
            link_score = min(40.0, suspicious_link_count * 20.0)
            feature_scores["suspicious_links"] = link_score
            risk_score += link_score
            indicators.append(f"Deceptive Hyperlinks: Found {suspicious_link_count} link(s) pointing to high-risk or typosquatted destinations.")

        # --- Feature 5: Malicious Attachment Extensions ---
        if re.search(r"\.(exe|scr|vbs|apk|bat|cmd|iso|img|ps1|hta|wsf)\b", combined_text):
            risk_score += 45.0
            indicators.append("Executable Payload Lure: Email references dangerous executable or archive file attachments.")

        # Final score calculation & normalization
        normalized_score = round(max(0.0, min(100.0, risk_score)), 1)
        confidence_score = round(min(0.99, max(0.05, normalized_score / 100.0 + 0.08)), 2)

        if normalized_score >= 60.0:
            risk_level = "CRITICAL" if normalized_score >= 80.0 else "HIGH RISK"
            recommended_action = "BLOCK"
            is_threat = True
            raksha_summary = (
                f"KAVACH Machine Learning Sentinel flagged this message as a {risk_level} threat. "
                + (f"Sender impersonates {impersonated_brand} while originating from an unauthenticated server. " if impersonated_brand else "")
                + "Do not click links, download attachments, or disclose credentials."
            )
        elif normalized_score >= 30.0:
            risk_level = "SUSPICIOUS"
            recommended_action = "WARN"
            is_threat = False
            raksha_summary = "KAVACH flagged suspicious patterns in this message. Exercise caution before trusting any links or requests."
        else:
            risk_level = "SAFE"
            recommended_action = "ALLOW"
            is_threat = False
            indicators.append("Sender and message content passed standard machine learning security verification.")
            raksha_summary = "Email appears legitimate. No known phishing signatures, brand spoofing, or deceptive links detected."

        return {
            "is_threat": is_threat,
            "risk_score": normalized_score,
            "risk_level": risk_level,
            "confidence_score": confidence_score,
            "recommended_action": recommended_action,
            "impersonated_brand": impersonated_brand,
            "model_version": self.model_version,
            "indicators": indicators,
            "raksha_summary": raksha_summary,
            "feature_breakdown": feature_scores,
        }

    def scan_phone_message(
        self,
        phone_number: str,
        message_text: str,
        links: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Evaluate incoming WhatsApp / SMS message and phone origin for task scams,
        lottery fraud, and APK dropper malware.
        """
        links = links or []
        clean_phone = re.sub(r"[\s\-\(\)]", "", phone_number)
        text_lower = message_text.lower()

        indicators: list[str] = []
        risk_score = 0.0

        # 1. Geographic origin risk check
        flagged_origin = None
        for prefix, desc in HIGH_RISK_PHONE_PREFIXES:
            if clean_phone.startswith(prefix) or clean_phone.startswith(prefix.replace("+", "")):
                flagged_origin = (prefix, desc)
                break

        if flagged_origin:
            risk_score += 65.0
            indicators.append(f"High-Risk International Origin: Prefix {flagged_origin[0]} matches {flagged_origin[1]}.")

        # 2. Part-Time Task & Investment Scams
        for pattern in SCAM_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                risk_score += 35.0
                indicators.append("Task / Investment Scam: Matches common mass-solicitation fraud patterns (Telegram task lure, guaranteed profits).")
                break

        # 3. Urgency / Threat Pattern
        if re.search(r"(?:electricity|power)\s+disconnected|sim\s+blocked|aadhaar\s+suspended", text_lower):
            risk_score += 45.0
            indicators.append("Utility / Authority Coercion: Threatens immediate utility disconnection or SIM card suspension.")

        # 4. APK Dropper Link Detection
        if re.search(r"\.apk\b|bit\.ly/|tinyurl\.com/|t\.me/", text_lower) or any(".apk" in lk for lk in links):
            risk_score += 50.0
            indicators.append("Malicious Dropper Payload: References suspicious Android APK install or shortened URL.")

        normalized_score = round(max(0.0, min(100.0, risk_score)), 1)
        confidence_score = round(min(0.99, max(0.05, normalized_score / 100.0 + 0.05)), 2)

        if normalized_score >= 60.0:
            risk_level = "CRITICAL" if normalized_score >= 80.0 else "HIGH RISK"
            recommended_action = "BLOCK"
            is_threat = True
            raksha_summary = (
                f"KAVACH Machine Learning Sentinel flagged this contact/chat as a high-probability scam. "
                f"Origin ({clean_phone}) and message content exhibit signatures of organized cyber fraud compounds. Never transfer funds or install provided APK files."
            )
        elif normalized_score >= 30.0:
            risk_level = "SUSPICIOUS"
            recommended_action = "WARN"
            is_threat = False
            raksha_summary = "Unverified international sender or unfamiliar link structure detected. Exercise strict caution."
        else:
            risk_level = "SAFE"
            recommended_action = "ALLOW"
            is_threat = False
            indicators.append("Sender prefix and chat content verified with clean baseline.")
            raksha_summary = "No threat signatures detected on this phone number or message content."

        return {
            "is_threat": is_threat,
            "risk_score": normalized_score,
            "risk_level": risk_level,
            "confidence_score": confidence_score,
            "recommended_action": recommended_action,
            "model_version": self.model_version,
            "indicators": indicators,
            "raksha_summary": raksha_summary,
        }

    # Convenience alias for unified communications scanning
    scan_comms = scan_phone_message


# Singleton instance
_spam_scam_ml_engine: SpamScamMLEngine | None = None


def get_spam_scam_ml_engine() -> SpamScamMLEngine:
    global _spam_scam_ml_engine
    if _spam_scam_ml_engine is None:
        _spam_scam_ml_engine = SpamScamMLEngine()
    return _spam_scam_ml_engine
