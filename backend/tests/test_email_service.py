"""
KAVACH Email Notification Service Unit Tests.
"""

from __future__ import annotations

import asyncio
import json
import os
import shutil
from pathlib import Path
import pytest
from unittest.mock import patch, MagicMock

from core.config import get_settings
from email_notifications.service import get_email_service, EmailService


@pytest.fixture(autouse=True)
def clean_logs_and_mocks():
    """Ensure logs and mock email directories are clean before/after tests."""
    settings = get_settings()
    log_dir = Path(settings.paths.log_dir)
    mock_dir = log_dir / "mock_emails"
    dead_letter_file = log_dir / "dead_letter_emails.jsonl"
    
    # Remove existing files/dirs
    if mock_dir.exists():
        shutil.rmtree(mock_dir)
    if dead_letter_file.exists():
        dead_letter_file.unlink()
        
    yield
    
    # Cleanup after test
    if mock_dir.exists():
        shutil.rmtree(mock_dir)
    if dead_letter_file.exists():
        dead_letter_file.unlink()


def test_email_service_singleton():
    """Verify that get_email_service returns the same singleton instance."""
    svc1 = get_email_service()
    svc2 = get_email_service()
    assert svc1 is svc2
    assert isinstance(svc1, EmailService)


@pytest.mark.asyncio
async def test_mock_email_sending():
    """Verify mock email path when SMTP credentials are not configured."""
    settings = get_settings()
    
    # Temporarily clean SMTP settings to ensure mock mode
    smtp_settings = settings.notification
    original_server = smtp_settings.server
    smtp_settings.server = "" # Forces mock mode
    
    email_svc = EmailService()
    
    to_email = "test_user@example.com"
    template = "verify_email.html"
    subject = "Verification Code"
    context = {"username": "test_guy", "verification_code": "123456"}
    
    success = await email_svc.send_email(
        to=to_email,
        template_name=template,
        subject=subject,
        context=context
    )
    
    assert success is True
    
    # Check if mock email was written to logs/mock_emails/
    mock_file = Path(settings.paths.log_dir) / "mock_emails" / f"{to_email}_{template}.json"
    assert mock_file.exists()
    
    with open(mock_file, "r") as f:
        data = json.load(f)
        assert data["to"] == to_email
        assert data["subject"] == subject
        assert data["context"]["username"] == "test_guy"
        assert data["context"]["verification_code"] == "123456"
        
    # Restore settings
    smtp_settings.server = original_server


@pytest.mark.asyncio
async def test_template_rendering_error_dead_letter():
    """Verify template errors write records to dead-letter queue log."""
    settings = get_settings()
    email_svc = EmailService()
    
    to_email = "fail_user@example.com"
    subject = "Failed Render"
    
    # Trigger a template rendering error by passing a non-existent template
    success = await email_svc.send_email(
        to=to_email,
        template_name="non_existent_template_xyz.html",
        subject=subject,
        context={}
    )
    
    assert success is False
    
    # Check if entry was written to dead-letter file
    dead_letter_file = Path(settings.paths.log_dir) / "dead_letter_emails.jsonl"
    assert dead_letter_file.exists()
    
    with open(dead_letter_file, "r") as f:
        lines = f.readlines()
        assert len(lines) == 1
        record = json.loads(lines[0])
        assert record["to"] == to_email
        assert record["template"] == "non_existent_template_xyz.html"
        assert "Template error" in record["error"]


@pytest.mark.asyncio
async def test_smtp_send_retries_and_dead_letter():
    """Verify SMTP exceptions trigger retry loops and log to dead letter on exhaustion."""
    settings = get_settings()
    smtp_settings = settings.notification
    
    # Mock SMTP configuration to trigger real send code branch
    original_server = smtp_settings.server
    original_username = smtp_settings.username
    original_password = smtp_settings.password
    
    smtp_settings.server = "smtp.mockserver.com"
    smtp_settings.username = "test_sender@mock.com"
    smtp_settings.password = "mock_pass"
    
    email_svc = EmailService()
    
    # Patch asyncio.sleep to run immediately in tests
    # Patch smtplib.SMTP context manager to raise an exception
    with patch("asyncio.sleep", return_value=None), \
         patch("smtplib.SMTP") as mock_smtp:
         
        # Make the connection context manager throw connection error
        mock_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_instance
        mock_instance.login.side_effect = Exception("SMTP Connection Timeout")
        
        to_email = "retry_user@example.com"
        success = await email_svc.send_email(
            to=to_email,
            template_name="verify_email.html",
            subject="Verification Code",
            context={"username": "retry_guy", "verification_code": "654321"}
        )
        
        assert success is False
        
        # Verify SMTP class was instantiated for each retry attempt (max 3 times)
        assert mock_smtp.call_count == 3
        
        # Verify entry was written to dead-letter file
        dead_letter_file = Path(settings.paths.log_dir) / "dead_letter_emails.jsonl"
        assert dead_letter_file.exists()
        
        with open(dead_letter_file, "r") as f:
            lines = f.readlines()
            assert len(lines) == 1
            record = json.loads(lines[0])
            assert record["to"] == to_email
            assert "SMTP Connection Timeout" in record["error"]
            
    # Restore settings
    smtp_settings.server = original_server
    smtp_settings.username = original_username
    smtp_settings.password = original_password
