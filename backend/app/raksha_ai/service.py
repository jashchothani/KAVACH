"""
KAVACH Raksha AI Service.

High-level security intelligence workflows:
- Explaining security scores
- Interpreting ML anomalies and alerts
- Summarizing incidents and evidence
- Answering user cybersecurity inquiries with context
"""

from __future__ import annotations

import json
from typing import Any

from app.core.logging import get_logger
from app.raksha_ai.provider import get_llm_provider, LocalFallbackProvider
from app.raksha_ai.sanitizer import sanitize_telemetry, sanitize_text

logger = get_logger(__name__)


class RakshaAIService:
    """Orchestrates intelligent assistant workflows for KAVACH."""

    def __init__(self) -> None:
        self._provider = get_llm_provider()

    @property
    def provider_info(self) -> dict[str, Any]:
        return {
            "name": self._provider.provider_name,
            "is_offline_fallback": isinstance(self._provider, LocalFallbackProvider),
        }

    async def chat(self, user_message: str, context: str = "") -> dict[str, Any]:
        """Interactive security advisory chat."""
        clean_msg = sanitize_text(user_message)
        clean_ctx = sanitize_text(context)

        prompt = f"User Question: {clean_msg}\n"
        if clean_ctx:
            prompt += f"\nCurrent System Context:\n{clean_ctx}\n"

        prompt += "\nPlease provide a clear, professional cybersecurity assessment with concrete next actions."

        try:
            content = await self._provider.generate_response(prompt)
        except Exception as exc:
            logger.warning("primary_llm_failed_falling_back", error=str(exc))
            fallback = LocalFallbackProvider()
            content = await fallback.generate_response(prompt)

        return {
            "response": content,
            "provider": self._provider.provider_name,
            "is_ai_generated": not isinstance(self._provider, LocalFallbackProvider),
        }

    async def explain_alert(self, alert_dict: dict[str, Any]) -> str:
        """Explain a specific security alert in plain English."""
        sanitized = sanitize_telemetry(alert_dict)
        prompt = (
            f"Please explain this security detection for both a normal user and SOC analyst:\n"
            f"{json.dumps(sanitized, indent=2)}\n"
            f"Explain why this was detected, what threat it indicates, and what action to take."
        )
        try:
            return await self._provider.generate_response(prompt)
        except Exception:
            return await LocalFallbackProvider().generate_response(prompt)

    async def explain_anomaly(self, anomaly_dict: dict[str, Any]) -> str:
        """Explain an Isolation Forest anomaly detection."""
        sanitized = sanitize_telemetry(anomaly_dict)
        prompt = (
            f"Explain this telemetry anomaly flagged by KAVACH Isolation Forest:\n"
            f"{json.dumps(sanitized, indent=2)}\n"
            f"Explain the statistical deviation, possible attack vectors, and investigation steps."
        )
        try:
            return await self._provider.generate_response(prompt)
        except Exception:
            return await LocalFallbackProvider().generate_response(prompt)

    async def explain_url(self, url_scan_result: dict[str, Any]) -> str:
        """Explain a URL security scan."""
        prompt = (
            f"Explain the security scan results for this website URL:\n"
            f"URL: {url_scan_result.get('url')}\n"
            f"Risk Score: {url_scan_result.get('risk_score')}/100 ({url_scan_result.get('risk_level')})\n"
            f"Indicators: {url_scan_result.get('indicators')}\n"
            f"Structural Breakdown: {url_scan_result.get('structural_breakdown')}\n"
            f"Provide advice on whether it is safe to interact with this page."
        )
        try:
            return await self._provider.generate_response(prompt)
        except Exception:
            return await LocalFallbackProvider().generate_response(prompt)

    async def explain_security_score(self, score_breakdown: dict[str, Any]) -> str:
        """Explain the overall KAVACH security score."""
        prompt = (
            f"Explain the system security health and score breakdown:\n"
            f"{json.dumps(score_breakdown, indent=2)}\n"
            f"Advise on how to improve overall protection."
        )
        try:
            return await self._provider.generate_response(prompt)
        except Exception:
            return await LocalFallbackProvider().generate_response(prompt)


_raksha_instance: RakshaAIService | None = None


def get_raksha_ai_service() -> RakshaAIService:
    """Singleton getter for Raksha AI service."""
    global _raksha_instance
    if _raksha_instance is None:
        _raksha_instance = RakshaAIService()
    return _raksha_instance
