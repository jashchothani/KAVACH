"""
KAVACH Threat Intelligence — VirusTotal API v3 Client.

Queries VirusTotal API v3 for IP, domain, URL, and file hash reputation.
"""

from __future__ import annotations

from typing import Any
import httpx

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class VirusTotalClient:
    """Client for VirusTotal API v3."""

    BASE_URL = "https://www.virustotal.com/api/v3"

    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def api_key(self) -> str:
        return self._settings.threat_intel.virustotal_api_key

    def _headers(self) -> dict[str, str]:
        return {"x-apikey": self.api_key, "Accept": "application/json"}

    async def get_ip_report(self, ip: str) -> dict[str, Any]:
        """Fetch IP report from VirusTotal."""
        if not self.api_key:
            return {"error": "VirusTotal API key not configured"}

        url = f"{self.BASE_URL}/ip_addresses/{ip}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json().get("data", {}).get("attributes", {})
                    stats = data.get("last_analysis_stats", {})
                    return {
                        "ip": ip,
                        "reputation": data.get("reputation", 0),
                        "harmless": stats.get("harmless", 0),
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "country": data.get("country", "Unknown"),
                        "asn": data.get("asn", "Unknown"),
                        "as_owner": data.get("as_owner", "Unknown"),
                        "source": "VirusTotal",
                    }
                return {"ip": ip, "status_code": resp.status_code, "error": resp.text[:200]}
        except Exception as exc:
            logger.error("virustotal_ip_lookup_error", ip=ip, error=str(exc))
            return {"ip": ip, "error": str(exc)}

    async def get_domain_report(self, domain: str) -> dict[str, Any]:
        """Fetch Domain report from VirusTotal."""
        if not self.api_key:
            return {"error": "VirusTotal API key not configured"}

        url = f"{self.BASE_URL}/domains/{domain}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json().get("data", {}).get("attributes", {})
                    stats = data.get("last_analysis_stats", {})
                    return {
                        "domain": domain,
                        "reputation": data.get("reputation", 0),
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "categories": data.get("categories", {}),
                        "source": "VirusTotal",
                    }
                return {"domain": domain, "status_code": resp.status_code, "error": resp.text[:200]}
        except Exception as exc:
            logger.error("virustotal_domain_lookup_error", domain=domain, error=str(exc))
            return {"domain": domain, "error": str(exc)}

    async def get_hash_report(self, file_hash: str) -> dict[str, Any]:
        """Fetch File Hash report from VirusTotal."""
        if not self.api_key:
            return {"error": "VirusTotal API key not configured"}

        url = f"{self.BASE_URL}/files/{file_hash}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json().get("data", {}).get("attributes", {})
                    stats = data.get("last_analysis_stats", {})
                    return {
                        "hash": file_hash,
                        "meaningful_name": data.get("meaningful_name", "Unknown"),
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "type_description": data.get("type_description", "Unknown"),
                        "trid": data.get("trid", []),
                        "source": "VirusTotal",
                    }
                return {"hash": file_hash, "status_code": resp.status_code, "error": resp.text[:200]}
        except Exception as exc:
            logger.error("virustotal_hash_lookup_error", hash=file_hash, error=str(exc))
            return {"hash": file_hash, "error": str(exc)}
