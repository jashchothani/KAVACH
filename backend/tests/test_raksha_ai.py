"""
Tests for Raksha AI Context Sanitizer and Assistant Service.
"""

import pytest
from app.raksha_ai.sanitizer import sanitize_text, sanitize_telemetry
from app.raksha_ai.provider import LocalFallbackProvider


def test_raksha_ai_context_sanitization():
    raw_text = "Connect with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.secret and apikey=nvapi-1234567890abcdef123456"
    cleaned = sanitize_text(raw_text)
    assert "nvapi-" not in cleaned
    assert "[REDACTED" in cleaned

    event = {
        "event_type": "login_failure",
        "severity": "high",
        "risk_score": 75.0,
        "password": "supersecretpassword123",
        "api_key": "secret_key_abc",
        "tags": ["brute_force"],
    }
    sanitized = sanitize_telemetry(event)
    assert "password" not in sanitized
    assert "api_key" not in sanitized
    assert sanitized["event_type"] == "login_failure"


@pytest.mark.asyncio
async def test_raksha_ai_local_fallback():
    provider = LocalFallbackProvider()
    response = await provider.generate_response("Explain my security score")
    assert "Security Assessment" in response
    assert "Evidence Observed" in response
    assert "Recommended Defensive Actions" in response
