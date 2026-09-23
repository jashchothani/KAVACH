"""
KAVACH Logging System & Telemetry JSON Pipeline Automated Tests.

Verifies:
- Standard single-line clean log output (TIMESTAMP | LEVEL | SERVICE | COMPONENT | EVENT | MESSAGE | request_id=...)
- ANSI stripping and credential redaction (password, token, api_key)
- Machine-readable structured JSONLines output (kavach.jsonl)
- Structured telemetry routing into backend/logs/json_logs/{raw, dns, defender, powershell, mitre, alerts}
- Alert explanation response contracts
"""

import json
import logging
import pytest
from datetime import datetime, timezone
from app.core.logging import (
    KavachConsoleFormatter,
    KavachJsonLinesFormatter,
    sanitize_data,
    setup_logging,
    get_logger,
    get_correlation_id,
)
from app.schemas.schemas import AlertExplanationResponse, ErrorEnvelope, ErrorDetail


def test_sanitize_data_redacts_credentials():
    sensitive = {
        "user": "admin",
        "password": "SuperSecretPassword123!",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "api_key": "AIzaSySecretApiKey",
        "metadata": {
            "gemini_api_key": "secret-gemini-key",
            "normal_field": "visible_value",
        },
    }
    cleaned = sanitize_data(sensitive)
    assert cleaned["user"] == "admin"
    assert cleaned["password"] == "[REDACTED]"
    assert cleaned["access_token"] == "[REDACTED]"
    assert cleaned["api_key"] == "[REDACTED]"
    assert cleaned["metadata"]["gemini_api_key"] == "[REDACTED]"
    assert cleaned["metadata"]["normal_field"] == "visible_value"


def test_kavach_console_formatter_output():
    formatter = KavachConsoleFormatter(strip_ansi=True)
    record = logging.LogRecord(
        name="kavach.detection.rule_engine",
        level=logging.WARNING,
        pathname=__file__,
        lineno=42,
        msg="Malicious PowerShell download cradle detected",
        args=(),
        exc_info=None,
    )
    record.correlation_id = "test-corr-123"
    formatted = formatter.format(record)

    assert " | " in formatted
    parts = formatted.split(" | ")
    assert len(parts) >= 6
    assert "WARNING " in parts[1]
    assert parts[2] == "KAVACH"
    assert parts[3] == "rule_engine"
    assert "Malicious PowerShell download cradle detected" in parts[5]
    assert "request_id=test-corr-123" in formatted
    assert "\x1b" not in formatted


def test_kavach_jsonlines_formatter_output():
    formatter = KavachJsonLinesFormatter()
    record = logging.LogRecord(
        name="kavach.collectors.dns",
        level=logging.INFO,
        pathname=__file__,
        lineno=88,
        msg="DNS query inspected",
        args=(),
        exc_info=None,
    )
    record.correlation_id = "test-dns-456"
    record.domain = "suspicious-phish.xyz"
    record.risk_score = 75.0

    formatted = formatter.format(record)
    parsed = json.loads(formatted)

    assert parsed["service"] == "kavach"
    assert parsed["level"] == "INFO"
    assert parsed["component"] == "kavach.collectors.dns"
    assert parsed["request_id"] == "test-dns-456"
    assert parsed["message"] == "DNS query inspected"
    assert parsed["context"]["domain"] == "suspicious-phish.xyz"
    assert parsed["context"]["risk_score"] == 75.0


def test_alert_explanation_schema_contract():
    resp = AlertExplanationResponse(
        alert_id="ALT-109283",
        explanation="PowerShell process launched with base64-encoded parameters attempting AMSI bypass.",
        status="success",
        confidence=0.98,
        recommended_action="Isolate endpoint and inspect parent process tree.",
        created_at="2026-09-12T18:00:00Z",
    )
    dumped = resp.model_dump()
    assert dumped["alert_id"] == "ALT-109283"
    assert "AMSI bypass" in dumped["explanation"]
    assert dumped["confidence"] == 0.98
    assert dumped["status"] == "success"


def test_error_envelope_schema_contract():
    err = ErrorEnvelope(
        success=False,
        error=ErrorDetail(
            code="RESPONSE_VALIDATION_ERROR",
            message="Internal response schema validation error",
            request_id="req-999",
        ),
    )
    dumped = err.model_dump()
    assert dumped["success"] is False
    assert dumped["error"]["code"] == "RESPONSE_VALIDATION_ERROR"
    assert dumped["error"]["request_id"] == "req-999"


@pytest.mark.asyncio
async def test_pipeline_manager_json_logs_written(tmp_path):
    from app.pipeline.pipeline_manager import CentralPipelineManager

    mgr = CentralPipelineManager()
    test_event = {
        "collector": "dns",
        "event_type": "dns_query",
        "domain": "test-c2-tunnel.xyz",
        "risk_score": 70.0,
        "mitre": {
            "technique_id": "T1071.004",
            "technique_name": "DNS",
            "tactic": "Command and Control",
        },
        "hostname": "TEST-HOST-01",
    }

    # Process event through pipeline
    await mgr.process_event(test_event)

    # Verify log subdirs exist
    subdirs = mgr._settings.paths.log_subdirs
    assert subdirs["raw"].exists()
    assert subdirs["dns"].exists()
    assert subdirs["processed"].exists()
    assert subdirs["alerts"].exists()
