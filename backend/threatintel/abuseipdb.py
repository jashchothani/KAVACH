"""
KAVACH Threat Intelligence — AbuseIPDB & AlienVault OTX Clients.
"""

from __future__ import annotations

from typing import Any
import httpx

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class AbuseIPDBClient:
    """Client for AbuseIPDB v2 API."""

    BASE_URL = "https://api.abuseipdb.com/api/v2"

    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def api_key(self) -> str:
        return self._settings.threat_intel.abuseipdb_api_key

    async def check_ip(self, ip: str, max_age_in_days: int = 90) -> dict[str, Any]:
        """Check IP confidence score on AbuseIPDB."""
        if not self.api_key:
            return {"error": "AbuseIPDB API key not configured"}

        url = f"{self.BASE_URL}/check"
        headers = {"Key": self.api_key, "Accept": "application/json"}
        params = {"ipAddress": ip, "maxAgeInDays": max_age_in_days}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return {
                        "ip": ip,
                        "abuse_confidence_score": data.get("abuseConfidenceScore", 0),
                        "country_code": data.get("countryCode", "Unknown"),
                        "domain": data.get("domain", "Unknown"),
                        "isp": data.get("isp", "Unknown"),
                        "total_reports": data.get("totalReports", 0),
                        "is_whitelisted": data.get("isWhitelisted", False),
                        "source": "AbuseIPDB",
                    }
                return {"ip": ip, "status_code": resp.status_code, "error": resp.text[:200]}
        except Exception as exc:
            logger.error("abuseipdb_check_error", ip=ip, error=str(exc))
            return {"ip": ip, "error": str(exc)}


class AlienVaultOTXClient:
    """Client for AlienVault OTX v1 API."""

    BASE_URL = "https://otx.alienvault.com/api/v1"

    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def api_key(self) -> str:
        return self._settings.threat_intel.otx_api_key

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-OTX-API-KEY"] = self.api_key
        return headers

    async def get_ip_pulses(self, ip: str) -> dict[str, Any]:
        """Check AlienVault OTX pulses for an IP address."""
        url = f"{self.BASE_URL}/indicators/IPv4/{ip}/general"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json()
                    pulse_info = data.get("pulse_info", {})
                    return {
                        "ip": ip,
                        "pulse_count": pulse_info.get("count", 0),
                        "country": data.get("country_name", "Unknown"),
                        "asn": data.get("asn", "Unknown"),
                        "source": "AlienVault OTX",
                    }
                return {"ip": ip, "status_code": resp.status_code, "error": resp.text[:200]}
        except Exception as exc:
            logger.error("otx_ip_check_error", ip=ip, error=str(exc))
            return {"ip": ip, "error": str(exc)}
