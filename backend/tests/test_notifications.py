"""
KAVACH Automated Tests — Phase 6: Enterprise Notification Subsystem.

Validates:
1. MockNotificationProvider delivery, tracking, and log redaction.
2. Idempotency key duplicate suppression.
3. User preference enforcement (mandatory vs optional notifications).
4. Exponential backoff retry and Dead-Letter Queue (DLQ) routing.
5. AWS SNS and Amazon SES provider adapters with mocked AWS SDK calls.
"""

import asyncio
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from app.services.notification_service import (
    DeliveryStatus,
    MockNotificationProvider,
    NotificationChannel,
    NotificationMessage,
    NotificationPriority,
    NotificationService,
    NotificationType,
    AwsSnsNotificationProvider,
    AwsSesNotificationProvider,
    _redact_recipient,
)


def test_recipient_redaction():
    """Verify that email addresses and phone numbers are safely redacted in logs."""
    assert _redact_recipient("admin@enterprise.com") == "ad***@enterprise.com"
    assert _redact_recipient("ab@defense.in") == "***@defense.in"
    assert _redact_recipient("+919876543210") == "+91****210"
    assert _redact_recipient("") == ""


@pytest.mark.asyncio
async def test_mock_notification_delivery(tmp_path: Path):
    """Test standard notification dispatch using the zero-cost mock provider."""
    log_file = tmp_path / "test_notif.jsonl"
    provider = MockNotificationProvider(log_path=log_file)
    svc = NotificationService(provider=provider, dead_letter_path=tmp_path / "dlq.jsonl")

    msg = await svc.dispatch(
        notification_type=NotificationType.ADMIN_APPROVED,
        recipient="analyst@kavach.org",
        subject="Account Clearance Granted",
        body_text="Your KAVACH administrator has approved your clearance request.",
        channel=NotificationChannel.EMAIL,
        priority=NotificationPriority.HIGH,
    )

    assert msg.status == DeliveryStatus.SENT
    assert len(provider.sent_messages) == 1
    assert provider.sent_messages[0].recipient == "analyst@kavach.org"
    assert provider.sent_messages[0].subject == "Account Clearance Granted"
    assert log_file.exists()


@pytest.mark.asyncio
async def test_idempotency_duplicate_suppression(tmp_path: Path):
    """Verify identical idempotency keys are suppressed to prevent spam/duplicate delivery."""
    provider = MockNotificationProvider(log_path=tmp_path / "notif.jsonl")
    svc = NotificationService(provider=provider, dead_letter_path=tmp_path / "dlq.jsonl")

    key = "idem-key-test-account-12345"

    # First dispatch succeeds
    msg1 = await svc.dispatch(
        notification_type=NotificationType.ACCOUNT_ACTIVATED,
        recipient="user1@defense.org",
        subject="Account Active",
        body_text="Welcome to KAVACH.",
        idempotency_key=key,
    )
    assert msg1.status == DeliveryStatus.SENT
    assert len(provider.sent_messages) == 1

    # Second dispatch with identical idempotency key is suppressed
    msg2 = await svc.dispatch(
        notification_type=NotificationType.ACCOUNT_ACTIVATED,
        recipient="user1@defense.org",
        subject="Account Active",
        body_text="Welcome to KAVACH.",
        idempotency_key=key,
    )
    assert msg2.status == DeliveryStatus.FILTERED
    assert "duplicate" in (msg2.error_message or "").lower()
    assert len(provider.sent_messages) == 1  # No duplicate sent


@pytest.mark.asyncio
async def test_user_preference_enforcement(tmp_path: Path):
    """Verify mandatory security notifications cannot be disabled, but non-critical ones can."""
    provider = MockNotificationProvider(log_path=tmp_path / "notif.jsonl")
    svc = NotificationService(provider=provider, dead_letter_path=tmp_path / "dlq.jsonl")

    # User opted out of all optional notifications
    opt_out_prefs = {
        NotificationType.WEEKLY_DIGEST.value: False,
        NotificationType.POLICY_UPDATED.value: False,
        NotificationType.CRITICAL_INCIDENT.value: False,  # Attempting to opt out of critical alert
    }

    # 1. Non-critical digest is filtered out
    digest_msg = await svc.dispatch(
        notification_type=NotificationType.WEEKLY_DIGEST,
        recipient="user2@enterprise.com",
        subject="Weekly Threat Digest",
        body_text="Summary of fleet incidents.",
        user_preferences=opt_out_prefs,
    )
    assert digest_msg.status == DeliveryStatus.FILTERED
    assert len(provider.sent_messages) == 0

    # 2. Critical incident is ALWAYS delivered even if user preferences attempted opt-out
    incident_msg = await svc.dispatch(
        notification_type=NotificationType.CRITICAL_INCIDENT,
        recipient="user2@enterprise.com",
        subject="CRITICAL: Ransomware Detected",
        body_text="Ransomware activity detected on host-01.",
        user_preferences=opt_out_prefs,
    )
    assert incident_msg.status == DeliveryStatus.SENT
    assert len(provider.sent_messages) == 1


@pytest.mark.asyncio
async def test_retry_and_dead_letter_queue(tmp_path: Path):
    """Verify failed deliveries retry with backoff and route to dead-letter queue."""
    dlq_file = tmp_path / "dlq.jsonl"

    class FailingProvider(MockNotificationProvider):
        async def send(self, message: NotificationMessage) -> bool:
            message.attempts += 1
            return False  # Simulate permanent external delivery failure

    failing_provider = FailingProvider()
    svc = NotificationService(provider=failing_provider, dead_letter_path=dlq_file)
    svc.BASE_BACKOFF_SECONDS = 0.05  # Fast test backoff

    msg = await svc.dispatch(
        notification_type=NotificationType.CONTAINMENT_EXECUTED,
        recipient="soc@defense.org",
        subject="Endpoint Contained",
        body_text="Workstation has been isolated from the network.",
    )

    assert msg.status == DeliveryStatus.DEAD_LETTER
    assert msg.attempts == svc.MAX_RETRIES
    assert dlq_file.exists()

    # Verify dead-letter record was written
    content = dlq_file.read_text(encoding="utf-8")
    assert "CONTAINMENT_EXECUTED" in content
    assert "Exhausted" in content


@pytest.mark.asyncio
async def test_aws_sns_provider_mocked():
    """Verify AWS SNS provider publishes message with mocked boto3 client."""
    provider = AwsSnsNotificationProvider(topic_arn="arn:aws:sns:ap-south-1:123456789012:kavach-alerts")
    mock_boto_client = MagicMock()
    mock_boto_client.publish.return_value = {"MessageId": "sns-msg-987654321"}

    with patch.object(provider, "_get_client", return_value=mock_boto_client):
        msg = NotificationMessage(
            notification_type=NotificationType.CRITICAL_INCIDENT,
            recipient="arn:aws:sns:ap-south-1:123456789012:kavach-alerts",
            subject="High Severity Incident",
            body_text="Suspicious LOLBin executed on host.",
            channel=NotificationChannel.EMAIL,
        )
        success = await provider.send(msg)
        assert success is True
        assert msg.status == DeliveryStatus.SENT
        assert msg.metadata.get("aws_sns_message_id") == "sns-msg-987654321"
        mock_boto_client.publish.assert_called_once()


@pytest.mark.asyncio
async def test_aws_ses_provider_mocked():
    """Verify Amazon SES provider sends transactional HTML email with mocked boto3 client."""
    provider = AwsSesNotificationProvider(from_email="security@kavach.defense")
    mock_boto_client = MagicMock()
    mock_boto_client.send_email.return_value = {"MessageId": "ses-msg-123456789"}

    with patch.object(provider, "_get_client", return_value=mock_boto_client):
        msg = NotificationMessage(
            notification_type=NotificationType.EMAIL_VERIFICATION,
            recipient="target_user@enterprise.com",
            subject="Verify Your KAVACH Account",
            body_text="Please enter code 948201.",
            body_html="<h1>Verify Your KAVACH Account</h1><p>Code: <b>948201</b></p>",
            channel=NotificationChannel.EMAIL,
        )
        success = await provider.send(msg)
        assert success is True
        assert msg.status == DeliveryStatus.SENT
        assert msg.metadata.get("aws_ses_message_id") == "ses-msg-123456789"
        mock_boto_client.send_email.assert_called_once()
