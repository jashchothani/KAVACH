"""
KAVACH AI Engine — Gemini Provider.

Google Gemini integration with rate limiting (5 RPM / 250K TPM).
Provides: alert explanation, incident summarization, report generation,
false positive advice, and chatbot responses.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

from core.config import get_settings
from core.exceptions import AIProviderError, AIRateLimitError
from core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """Token-bucket rate limiter for Gemini API."""

    def __init__(self, rpm: int = 5, tpm: int = 250_000) -> None:
        self._rpm = rpm
        self._tpm = tpm
        self._request_times: list[float] = []
        self._token_usage: list[tuple[float, int]] = []
        self._lock = asyncio.Lock()

    async def acquire(self, estimated_tokens: int = 1000) -> None:
        """Wait until rate limits allow a request."""
        async with self._lock:
            now = time.time()

            # Clean old entries (older than 60s)
            self._request_times = [t for t in self._request_times if now - t < 60]
            self._token_usage = [(t, n) for t, n in self._token_usage if now - t < 60]

            # Check RPM
            if len(self._request_times) >= self._rpm:
                wait = 60 - (now - self._request_times[0])
                if wait > 0:
                    logger.info("rate_limit_waiting", wait_seconds=round(wait, 1))
                    await asyncio.sleep(wait)

            # Check TPM
            current_tokens = sum(n for _, n in self._token_usage)
            if current_tokens + estimated_tokens > self._tpm:
                wait = 60 - (now - self._token_usage[0][0]) if self._token_usage else 60
                if wait > 0:
                    logger.info("token_limit_waiting", wait_seconds=round(wait, 1))
                    await asyncio.sleep(wait)

            self._request_times.append(time.time())
            self._token_usage.append((time.time(), estimated_tokens))


class GeminiProvider:
    """Google Gemini LLM provider with rate limiting."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._rate_limiter = RateLimiter(
            rpm=self._settings.ai.gemini_rpm,
            tpm=self._settings.ai.gemini_tpm,
        )
        self._client: Any = None
        self._model: Any = None

    async def _ensure_client(self) -> None:
        """Lazy-initialize the Gemini client."""
        if self._client is not None:
            return

        api_key = self._settings.ai.gemini_api_key
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY not configured")

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self._client = genai
            self._model = genai.GenerativeModel(
                model_name=self._settings.ai.gemini_model,
                generation_config={
                    "temperature": self._settings.ai.temperature,
                    "max_output_tokens": self._settings.ai.max_tokens,
                },
            )
            logger.info("gemini_client_initialized", model=self._settings.ai.gemini_model)
        except Exception as exc:
            raise AIProviderError(f"Failed to initialize Gemini: {exc}")

    async def generate(
        self, prompt: str, system_prompt: str = "", estimated_tokens: int = 1000
    ) -> str:
        """Generate a response from Gemini with rate limiting."""
        await self._ensure_client()
        await self._rate_limiter.acquire(estimated_tokens)

        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = await asyncio.to_thread(
                self._model.generate_content, full_prompt
            )
            if response and response.text:
                return response.text
            return "No response generated."
        except Exception as exc:
            error_msg = str(exc)
            if "429" in error_msg or "quota" in error_msg.lower():
                raise AIRateLimitError(f"Gemini rate limit exceeded: {error_msg}")
            raise AIProviderError(f"Gemini generation failed: {error_msg}")

    async def explain_alert(self, alert_data: dict[str, Any]) -> str:
        """Generate AI explanation for a security alert."""
        prompt = f"""Analyze this security alert and provide a clear, actionable explanation:

Alert: {alert_data.get('title', 'Unknown')}
Severity: {alert_data.get('severity', 'unknown')}
Risk Score: {alert_data.get('risk_score', 0)}
Event Type: {alert_data.get('event_type', 'unknown')}
MITRE Technique: {alert_data.get('mitre_technique_id', 'N/A')} - {alert_data.get('mitre_technique_name', 'N/A')}
MITRE Tactic: {alert_data.get('mitre_tactic', 'N/A')}
Source: {alert_data.get('source_collector', 'unknown')}
Details: {alert_data.get('metadata_json', {})}

Provide:
1. What happened (in plain terms)
2. Why this is concerning
3. The MITRE ATT&CK context
4. Recommended investigation steps
5. Suggested remediation actions
6. False positive indicators to check"""

        system = "You are a senior SOC analyst. Provide concise, technically accurate security analysis."
        return await self.generate(prompt, system)

    async def summarize_incident(self, incident_data: dict[str, Any]) -> str:
        """Generate AI summary for a security incident."""
        prompt = f"""Summarize this security incident for a SOC report:

Incident: {incident_data.get('title', 'Unknown')}
Severity: {incident_data.get('severity', 'unknown')}
Status: {incident_data.get('status', 'unknown')}
Related Alerts: {len(incident_data.get('alerts', []))}
Timeline: {incident_data.get('timeline', 'N/A')}

Alert Details:
{incident_data.get('alert_summaries', 'No details available')}

Provide:
1. Executive summary (2-3 sentences)
2. Attack timeline
3. Impact assessment
4. Root cause analysis
5. Recommendations"""

        system = "You are a senior SOC analyst writing an incident report."
        return await self.generate(prompt, system)

    async def generate_report(self, report_type: str, data: dict[str, Any]) -> str:
        """Generate SOC or executive reports."""
        if report_type == "executive":
            prompt = f"""Generate an executive security report:

Period: {data.get('period', 'Last 24 hours')}
Total Alerts: {data.get('total_alerts', 0)}
Critical: {data.get('critical', 0)} | High: {data.get('high', 0)} | Medium: {data.get('medium', 0)} | Low: {data.get('low', 0)}
Top MITRE Techniques: {data.get('top_mitre', [])}
Incidents: {data.get('incidents', 0)}
Mean Time to Respond: {data.get('mttr', 'N/A')}
Top Threats: {data.get('top_threats', [])}

Write a professional executive summary suitable for C-suite. Focus on business impact, risk posture, and actionable recommendations. No technical jargon."""
            system = "You are a CISO preparing a board-level security briefing."
        else:
            prompt = f"""Generate a detailed SOC analyst report:

Period: {data.get('period', 'Last 24 hours')}
Total Events Processed: {data.get('total_events', 0)}
Alerts: {data.get('total_alerts', 0)} (Critical: {data.get('critical', 0)}, High: {data.get('high', 0)})
Top MITRE Techniques: {data.get('top_mitre', [])}
IOCs Found: {data.get('iocs', 0)}
Playbooks Executed: {data.get('playbooks', 0)}
False Positive Rate: {data.get('fp_rate', 'N/A')}

Include: threat landscape, detection effectiveness, recommended tuning, and threat hunting hypotheses."""
            system = "You are a senior SOC analyst writing a technical shift report."

        return await self.generate(prompt, system)

    async def chat_soc(self, message: str, context: str = "") -> str:
        """SOC analyst assistant chat."""
        system = """You are KAVACH SOC Assistant — a senior security operations center analyst AI.

You are highly technical and can discuss:
- MITRE ATT&CK techniques, tactics, and procedures
- Windows Event Log analysis (Security, Sysmon, PowerShell)
- IOC analysis (IP, domain, hash, URL)
- Sigma rules and KQL queries
- Threat hunting methodologies
- Incident response procedures
- Forensic analysis
- Malware analysis concepts
- SOAR playbook design
- Detection engineering
- Risk assessment

Always provide accurate, actionable technical advice.
Reference MITRE ATT&CK IDs when relevant.
Suggest investigation queries and response actions."""

        prompt = f"{context}\n\nAnalyst Question: {message}" if context else message
        return await self.generate(prompt, system)

    async def chat_layman(self, message: str) -> str:
        """Non-technical user assistant chat."""
        system = """You are KAVACH Security Buddy — a friendly, non-technical cybersecurity assistant.

Your audience is everyday users who are NOT cybersecurity experts.

You help with:
- Explaining what phishing is and how to spot it
- Understanding malware, ransomware, and viruses in simple terms
- Password hygiene and multi-factor authentication
- Safe browsing habits
- Recognizing suspicious emails, links, and attachments
- Understanding security alerts in plain language
- General cybersecurity awareness
- Explaining why a file or website might be dangerous

Rules:
- NO technical jargon — explain everything like talking to a friend
- Use analogies and real-world examples
- Be encouraging, not scary
- Provide actionable tips
- If asked about an alert, translate it to plain language"""

        return await self.generate(message, system)


# Singleton
_provider: GeminiProvider | None = None


def get_ai_provider() -> GeminiProvider:
    global _provider
    if _provider is None:
        _provider = GeminiProvider()
    return _provider
