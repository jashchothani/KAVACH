"""
KAVACH AI & ML Engine Integration and Fallback Tests.
"""

from __future__ import annotations

import pytest
from unittest.mock import patch, MagicMock

from core.config import get_settings
from ai.ai_provider import (
    get_ai_provider,
    LocalFallbackProvider,
    OllamaProvider,
    GeminiProvider,
)


@pytest.mark.asyncio
async def test_local_fallback_four_points():
    """Verify that the rule-based local offline helper output complies with the four-point format."""
    provider = LocalFallbackProvider()
    
    alert_data = {
        "title": "Unauthorized LSASS Access Attempt",
        "severity": "critical",
        "mitre_technique_id": "T1003",
    }
    
    explanation = await provider.explain_alert(alert_data)
    
    # Assert existence of the 4-point structure headers
    assert "### 1. Observed Behavior" in explanation
    assert "### 2. Risk Implication" in explanation
    assert "### 3. Concrete Threat" in explanation
    assert "### 4. Single Next Action" in explanation
    
    # Assert context mapping is correct
    assert "Unauthorized LSASS Access Attempt" in explanation
    assert "T1003" in explanation


@pytest.mark.asyncio
async def test_ollama_fallback_to_local():
    """Verify that Ollama provider falls back to local provider when the service is unreachable."""
    provider = OllamaProvider()
    
    # Mock invalid URL or offline service
    with patch("httpx.AsyncClient.post", side_effect=Exception("Connection refused")):
        alert_data = {
            "title": "Suspicious PowerShell Spawned",
            "severity": "high",
            "mitre_technique_id": "T1059.001",
        }
        
        explanation = await provider.explain_alert(alert_data)
        
        # Verify fallback response formats to the 4 points
        assert "### 1. Observed Behavior" in explanation
        assert "Suspicious PowerShell Spawned" in explanation


@pytest.mark.asyncio
async def test_gemini_fallback_pipeline():
    """Verify Gemini fallback pipeline: Gemini failure -> Ollama failure -> Local heuristics."""
    provider = GeminiProvider()
    
    # Patch ensure_client to raise exception so Gemini fails immediately
    with patch.object(provider, "_ensure_client", side_effect=Exception("Gemini Key Invalid")), \
         patch("httpx.AsyncClient.post", side_effect=Exception("Ollama Service Offline")):
         
        alert_data = {
            "title": "External C2 Beaconing Activity",
            "severity": "critical",
            "mitre_technique_id": "T1071",
        }
        
        explanation = await provider.explain_alert(alert_data)
        
        # Should gracefully drop down to Local Heuristics
        assert "### 1. Observed Behavior" in explanation
        assert "External C2 Beaconing Activity" in explanation
        assert "T1071" in explanation
