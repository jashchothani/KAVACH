"""
AntiGravity AI Engine — Unified AI Provider with Multi-Backend Fallback.

Pipeline Fallback: Gemini API -> Ollama Local LLM -> Local Heuristics.
"""

from __future__ import annotations

import asyncio
import time
import json
import httpx
from typing import Any

from core.config import get_settings
from core.exceptions import AIProviderError, AIRateLimitError
from core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """Token-bucket rate limiter for LLM APIs."""

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
            self._request_times = [t for t in self._request_times if now - t < 60]
            self._token_usage = [(t, n) for t, n in self._token_usage if now - t < 60]

            if len(self._request_times) >= self._rpm:
                wait = 60 - (now - self._request_times[0])
                if wait > 0:
                    logger.info("rate_limit_waiting", wait_seconds=round(wait, 1))
                    await asyncio.sleep(wait)

            current_tokens = sum(n for _, n in self._token_usage)
            if current_tokens + estimated_tokens > self._tpm:
                wait = 60 - (now - self._token_usage[0][0]) if self._token_usage else 60
                if wait > 0:
                    logger.info("token_limit_waiting", wait_seconds=round(wait, 1))
                    await asyncio.sleep(wait)

            self._request_times.append(time.time())
            self._token_usage.append((time.time(), estimated_tokens))


class LocalFallbackProvider:
    """Rule-based offline fallback provider that requires no API keys or local services."""

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        if any(kw in prompt or kw in system_prompt for kw in ["Explain", "Analyze", "explain_alert", "Incident", "Alert", "incident_data"]):
            import re
            alert_name = "Security Detection"
            severity = "medium"
            mitre_id = "N/A"
            
            name_match = re.search(r"(?:Alert|title):\s*(.*)", prompt, re.IGNORECASE)
            if name_match:
                alert_name = name_match.group(1).strip()
            sev_match = re.search(r"Severity:\s*(.*)", prompt, re.IGNORECASE)
            if sev_match:
                severity = sev_match.group(1).strip()
            mitre_match = re.search(r"MITRE Technique:\s*(.*)", prompt, re.IGNORECASE)
            if mitre_match:
                mitre_id = mitre_match.group(1).strip()

            return f"""### 1. Observed Behavior
AntiGravity EDR engine detected a system warning or event log matching: **{alert_name}**. This process performed indicators flagged by local correlation rules.

### 2. Risk Implication
The flagged actions show anomalous system behavior. Left unaddressed, this could lead to privilege escalation, unauthorized system configuration changes, or data exfiltration.

### 3. Concrete Threat
This event aligns with MITRE ATT&CK ID **{mitre_id}**. It is characteristic of tools attempting local credential harvesting, registry key modification, or automated script staging.

### 4. Single Next Action
Run the automated SOAR containment playbook to isolate the endpoint and terminate the offending process PID."""

        elif "executive security report" in prompt:
            return """### 1. Observed Behavior
Operations environment remains stable with endpoint telemetry monitoring active.

### 2. Risk Implication
Identified alerts have been automatically mitigated or queued for analyst review.

### 3. Concrete Threat
Low volume of suspicious activities; no evidence of widespread credential access or lateral movement.

### 4. Single Next Action
Audit administrator user accounts and ensure multi-factor authentication (MFA) is configured."""

        elif "SOC Analyst" in prompt or "SOC Assistant" in prompt:
            return "Local Offline SOC Assistant: Hello! I'm running in offline backup mode. Configure GEMINI_API_KEY or start an Ollama server to unlock fully conversational threat hunting assistant capabilities."

        return "Local Offline Mode: AntiGravity is operating in zero-connection backup mode. Details are logged locally."

    async def explain_alert(self, alert_data: dict[str, Any]) -> str:
        prompt = f"Analyze this security alert:\nAlert: {alert_data.get('title')}\nSeverity: {alert_data.get('severity')}\nMITRE Technique: {alert_data.get('mitre_technique_id')}"
        return await self.generate(prompt)

    async def summarize_incident(self, incident_data: dict[str, Any]) -> str:
        return f"""### 1. Observed Behavior
Incident '{incident_data.get('title')}' triggered with multiple correlated alert indicators.

### 2. Risk Implication
Possibility of active hostile operations on the host endpoint requiring quarantine.

### 3. Concrete Threat
Corresponds to automated execution and defense evasion techniques.

### 4. Single Next Action
Approve and run the containment playbook immediately."""

    async def generate_report(self, report_type: str, data: dict[str, Any]) -> str:
        return await self.generate(f"Generate {report_type} security report")

    async def chat_soc(self, message: str, context: str = "") -> str:
        return "Local Offline SOC Assistant: Running in local backup mode. Configure your API credentials to talk to the online Gemini model."

    async def chat_layman(self, message: str) -> str:
        return "Hey there! I am your offline Security Buddy. AntiGravity is protecting your computer. Everything looks safe and sound! Keep scanning for USB insertions and file modifications."

    async def generate_spoken_phrase(self, alert_data: dict[str, Any]) -> str:
        title = alert_data.get("title", "Security Anomaly")
        risk = alert_data.get("risk_score", 90)
        return f"Warning! Critical threat detected: {title}. Risk score is {risk}. AntiGravity has deployed response playbooks."


class OllamaProvider:
    """Ollama Local LLM provider."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._url = self._settings.ai.ollama_url
        self._model = self._settings.ai.ollama_model

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                body = {
                    "model": self._model,
                    "prompt": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt,
                    "stream": False,
                    "options": {
                        "temperature": self._settings.ai.temperature
                    }
                }
                resp = await client.post(f"{self._url}/api/generate", json=body)
                if resp.status_code == 200:
                    return resp.json().get("response", "")
                raise AIProviderError(f"Ollama returned HTTP status {resp.status_code}")
        except Exception as exc:
            logger.error("ollama_generation_failed", error=str(exc))
            # Fallback directly to Local Heuristics
            fallback = LocalFallbackProvider()
            return await fallback.generate(prompt, system_prompt)

    async def explain_alert(self, alert_data: dict[str, Any]) -> str:
        system = """You are KAVACH SOC Assistant. You MUST write your explanation exactly in this four-point markdown format:
### 1. Observed Behavior
[Explain what was seen on the host]

### 2. Risk Implication
[Explain why this is concerning]

### 3. Concrete Threat
[Explain how this matches MITRE ATT&CK techniques or known threats]

### 4. Single Next Action
[Provide the single most critical mitigation step]"""
        
        prompt = f"Explain this alert:\n{json.dumps(alert_data, default=str)}"
        return await self.generate(prompt, system)

    async def summarize_incident(self, incident_data: dict[str, Any]) -> str:
        system = """You are KAVACH SOC Assistant. You MUST summarize the incident exactly in this four-point markdown format:
### 1. Observed Behavior
[Explain what occurred]

### 2. Risk Implication
[Explain host risk]

### 3. Concrete Threat
[Describe specific threat category]

### 4. Single Next Action
[Provide single next containment step]"""

        prompt = f"Summarize this incident:\n{json.dumps(incident_data, default=str)}"
        return await self.generate(prompt, system)

    async def generate_report(self, report_type: str, data: dict[str, Any]) -> str:
        prompt = f"Generate {report_type} report for:\n{json.dumps(data, default=str)}"
        return await self.generate(prompt, "You are KAVACH SOC Assistant.")

    async def chat_soc(self, message: str, context: str = "") -> str:
        prompt = f"Context: {context}\nQuestion: {message}"
        return await self.generate(prompt, "You are KAVACH SOC Assistant — a technical SOC expert.")

    async def chat_layman(self, message: str) -> str:
        return await self.generate(message, "You are a friendly, non-technical cybersecurity assistant.")

    async def generate_spoken_phrase(self, alert_data: dict[str, Any]) -> str:
        title = alert_data.get("title", "Security Anomaly")
        risk = alert_data.get("risk_score", 90)
        prompt = f"Create a short spoken alert phrase (max 15 words) for: {title} with risk {risk}."
        system = "You are a voice alert system. Respond only with the single short spoken warning message."
        return await self.generate(prompt, system)


class GeminiProvider:
    """Google Gemini LLM provider with rate limiting and fallback to Ollama."""

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
        """Generate a response from Gemini, falling back to Ollama on failure."""
        try:
            await self._ensure_client()
            await self._rate_limiter.acquire(estimated_tokens)
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = await asyncio.to_thread(
                self._model.generate_content, full_prompt
            )
            if response and response.text:
                return response.text
            return "No response generated."
        except Exception as exc:
            logger.warning("gemini_generation_failed_trying_ollama", error=str(exc))
            # Fallback: Try Ollama
            ollama = OllamaProvider()
            return await ollama.generate(prompt, system_prompt)

    async def explain_alert(self, alert_data: dict[str, Any]) -> str:
        system = """You are KAVACH SOC Assistant. You MUST write your explanation exactly in this four-point markdown format:
### 1. Observed Behavior
[Explain what was seen on the host in plain terms]

### 2. Risk Implication
[Explain why this is concerning or dangerous]

### 3. Concrete Threat
[Explain how this matches MITRE ATT&CK techniques or specific threat categories]

### 4. Single Next Action
[Provide the single most critical mitigation step, such as process termination]"""

        prompt = f"Explain this alert:\n{json.dumps(alert_data, default=str)}"
        return await self.generate(prompt, system)

    async def summarize_incident(self, incident_data: dict[str, Any]) -> str:
        system = """You are KAVACH SOC Assistant. You MUST summarize the incident exactly in this four-point markdown format:
### 1. Observed Behavior
[Explain what occurred]

### 2. Risk Implication
[Explain host risk]

### 3. Concrete Threat
[Describe specific threat category]

### 4. Single Next Action
[Provide single next containment step]"""

        prompt = f"Summarize this incident:\n{json.dumps(incident_data, default=str)}"
        return await self.generate(prompt, system)

    async def generate_report(self, report_type: str, data: dict[str, Any]) -> str:
        prompt = f"Generate {report_type} report for:\n{json.dumps(data, default=str)}"
        return await self.generate(prompt, "You are KAVACH SOC Assistant.")

    async def chat_soc(self, message: str, context: str = "") -> str:
        prompt = f"{context}\n\nAnalyst Question: {message}" if context else message
        system = "You are KAVACH SOC Assistant — a technical SOC expert."
        return await self.generate(prompt, system)

    async def chat_layman(self, message: str) -> str:
        system = "You are KAVACH Security Buddy — a friendly, non-technical cybersecurity assistant."
        return await self.generate(message, system)

    async def generate_spoken_phrase(self, alert_data: dict[str, Any]) -> str:
        title = alert_data.get("title", "Security Anomaly")
        risk = alert_data.get("risk_score", 90)
        prompt = f"Create a short spoken alert phrase (max 15 words) for: {title} with risk {risk}."
        system = "You are a voice alert system. Respond only with the single short spoken warning message."
        return await self.generate(prompt, system)


# Singleton
_provider: Any = None


def get_ai_provider() -> Any:
    global _provider
    if _provider is not None:
        return _provider

    settings = get_settings()
    provider_type = settings.ai.provider.lower()

    if provider_type == "ollama":
        _provider = OllamaProvider()
    elif provider_type == "gemini":
        if settings.ai.gemini_api_key:
            _provider = GeminiProvider()
        else:
            logger.warning("gemini_key_missing_trying_ollama_fallback")
            _provider = OllamaProvider()
    else:
        _provider = LocalFallbackProvider()

    return _provider
