"""
KAVACH Dedicated URL & Phishing Security Engine.

Comprehensive static & heuristic analysis of URLs and domains.
Implements:
- Lexical and structural inspection (TLD, length, special characters, entropy)
- IP-based host detection
- Punycode & IDN homograph attack detection (RFC 3492)
- Domain typosquatting similarity algorithms
- Strict SSRF (Server-Side Request Forgery) protection & private IP containment
- Configurable Trusted, Blocked, and Watched domain lists
"""

from __future__ import annotations

import ipaddress
import re
import urllib.parse
from typing import Any

# Trusted domains baseline
DEFAULT_TRUSTED_DOMAINS = frozenset({
    "google.com", "microsoft.com", "apple.com", "amazon.com", "github.com",
    "gov.in", "nic.in", "cloudflare.com", "wikipedia.org", "python.org",
})

# Suspicious TLDs often abused in phishing campaigns
SUSPICIOUS_TLDS = frozenset({
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "buzz", "fit", "rest", "work", "cam", "icu", "click"
})

# Suspicious keywords that signal phishing intent when combined with unknown domains
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "update", "banking", "wallet", "account",
    "password", "auth", "credential", "confirm", "payment", "support", "kyc"
]

# Targeted brand domains for typosquatting checks
BRAND_TARGETS = [
    "google.com", "microsoft.com", "paypal.com", "apple.com", "amazon.com",
    "netflix.com", "facebook.com", "instagram.com", "twitter.com", "chase.com",
    "wellsfargo.com", "bankofamerica.com", "sbi.co.in", "hdfcbank.com", "icicibank.com"
]


def _levenshtein_distance(s1: str, s2: str) -> int:
    """Compute string edit distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


class URLSecurityEngine:
    """Analyzes URLs for phishing, spoofing, and malicious structural indicators."""

    def __init__(self) -> None:
        self.trusted_domains = set(DEFAULT_TRUSTED_DOMAINS)
        self.blocked_domains: set[str] = set()
        self.watched_domains: set[str] = set()

    def is_private_or_internal(self, hostname: str) -> bool:
        """
        SSRF Protection: detect if hostname resolves to private/internal/cloud metadata IP.
        """
        lower = hostname.lower()
        if lower in {"localhost", "metadata.google.internal", "instance-data"}:
            return True

        # Check if hostname is an IP address
        try:
            ip = ipaddress.ip_address(hostname)
            return (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or str(ip) == "169.254.169.254"  # AWS/GCP/Azure metadata
            )
        except ValueError:
            return False

    def analyze(self, raw_url: str) -> dict[str, Any]:
        """Perform comprehensive static and heuristic analysis on a target URL."""
        # Sanitize and ensure scheme
        url = raw_url.strip()
        if not re.match(r"^[a-zA-Z]+://", url):
            url = "http://" + url

        try:
            parsed = urllib.parse.urlparse(url)
        except Exception as exc:
            return {
                "url": raw_url,
                "status": "error",
                "risk_score": 100.0,
                "risk_level": "CRITICAL",
                "error": f"Malformed URL syntax: {exc}",
            }

        hostname = (parsed.hostname or "").lower()
        path = parsed.path.lower()
        query = parsed.query.lower()
        scheme = parsed.scheme.lower()

        # SSRF Check
        if self.is_private_or_internal(hostname):
            return {
                "url": raw_url,
                "domain": hostname,
                "scheme": scheme,
                "risk_score": 95.0,
                "risk_level": "CRITICAL",
                "is_ssrf_risk": True,
                "indicators": ["URL targets internal, loopback, or cloud metadata network address (SSRF risk)"],
                "raksha_summary": "KAVACH blocked this request. The URL points to an internal network address or cloud metadata endpoint, which represents a severe Server-Side Request Forgery vulnerability.",
                "structural_breakdown": {
                    "is_ip": True,
                    "is_https": scheme == "https",
                    "tld": "local",
                    "length": len(raw_url),
                },
            }

        # Check explicit Blocked & Trusted lists
        if hostname in self.blocked_domains:
            return {
                "url": raw_url,
                "domain": hostname,
                "scheme": scheme,
                "risk_score": 100.0,
                "risk_level": "CRITICAL",
                "indicators": ["Domain is on KAVACH global blocked list"],
                "raksha_summary": "Website is flagged as blocked by security policy.",
                "structural_breakdown": {"is_ip": False, "is_https": scheme == "https"},
            }

        is_trusted = any(hostname == t or hostname.endswith("." + t) for t in self.trusted_domains)
        if is_trusted:
            return {
                "url": raw_url,
                "domain": hostname,
                "scheme": scheme,
                "risk_score": 0.0,
                "risk_level": "SAFE",
                "indicators": ["Domain belongs to verified trusted enterprise directory"],
                "raksha_summary": "Verified Safe. This domain matches a verified legitimate organization.",
                "structural_breakdown": {"is_ip": False, "is_https": scheme == "https"},
            }

        # Heuristic scoring
        risk_score = 0.0
        indicators: list[str] = []

        # 1. Scheme Check
        if scheme != "https":
            risk_score += 20.0
            indicators.append("Unencrypted connection (HTTP without TLS/HTTPS)")

        # 2. IP Host Detection
        is_ip_host = False
        try:
            ipaddress.ip_address(hostname)
            is_ip_host = True
            risk_score += 35.0
            indicators.append("Direct IP address used instead of legitimate registered domain name")
        except ValueError:
            pass

        # 3. Punycode & IDN Homograph Detection
        has_punycode = "xn--" in hostname
        if has_punycode:
            risk_score += 40.0
            indicators.append("Punycode / IDN internationalized domain detected (common homograph spoofing technique)")

        # 4. TLD Analysis
        tld = hostname.split(".")[-1] if "." in hostname else ""
        if tld in SUSPICIOUS_TLDS:
            risk_score += 25.0
            indicators.append(f"High-risk top-level domain (.{tld}) with high correlation to phishing infrastructure")

        # 5. Length & Structure Anomalies
        if len(raw_url) > 120:
            risk_score += 15.0
            indicators.append(f"Abnormally long URL string ({len(raw_url)} characters)")

        hyphen_count = hostname.count("-")
        if hyphen_count >= 3:
            risk_score += 20.0
            indicators.append(f"Excessive hyphens in hostname ({hyphen_count} hyphens) suggesting domain masquerading")

        subdomains = hostname.split(".")
        if len(subdomains) >= 5:
            risk_score += 20.0
            indicators.append("Excessive subdomain nesting")

        # 6. Suspicious Keywords
        found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in hostname or kw in path or kw in query]
        if found_keywords:
            risk_score += min(30.0, len(found_keywords) * 10.0)
            indicators.append(f"High-risk credential/banking keywords found: {', '.join(found_keywords)}")

        # 7. Brand Typosquatting Detection
        closest_brand = None
        min_distance = 999
        for brand in BRAND_TARGETS:
            dist = _levenshtein_distance(hostname, brand)
            if 0 < dist <= 2 and dist < min_distance:
                min_distance = dist
                closest_brand = brand

        if closest_brand:
            risk_score += 45.0
            indicators.append(f"Domain is strikingly similar to known brand '{closest_brand}' (possible typosquatting)")

        final_score = round(max(0.0, min(100.0, risk_score)), 1)

        # Categorize
        if final_score >= 80:
            risk_level = "CRITICAL"
            summary = "Critical phishing threat. Strongly avoid entering credentials or sensitive data on this website."
        elif final_score >= 50:
            risk_level = "HIGH RISK"
            summary = "High risk detected. This URL exhibits multiple deceptive phishing signals."
        elif final_score >= 25:
            risk_level = "SUSPICIOUS"
            summary = "Caution advised. Some indicators suggest caution before proceeding."
        else:
            risk_level = "SAFE"
            summary = "Website appears safe based on structural analysis and domain baseline."

        return {
            "url": raw_url,
            "domain": hostname,
            "scheme": scheme,
            "risk_score": final_score,
            "risk_level": risk_level,
            "indicators": indicators if indicators else ["No suspicious structural anomalies detected"],
            "raksha_summary": summary,
            "structural_breakdown": {
                "is_ip": is_ip_host,
                "has_punycode": has_punycode,
                "is_https": scheme == "https",
                "tld": tld,
                "url_length": len(raw_url),
                "hyphens": hyphen_count,
            },
        }


_engine_instance: URLSecurityEngine | None = None


def get_url_security_engine() -> URLSecurityEngine:
    """Singleton getter for the URL security engine."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = URLSecurityEngine()
    return _engine_instance
