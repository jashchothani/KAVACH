"""
KAVACH Sovereign Notification Service & Multi-Channel Delivery Engine.

Provides an enterprise notification abstraction supporting:
1. Multi-channel delivery: Email, In-App, Desktop, Mobile Push, SMS.
2. Provider abstraction:
   - MockNotificationProvider (Development & CI; zero network calls, zero AWS cost).
   - AwsSnsNotificationProvider (Security incident broadcasts, SMS alerts).
   - AwsSesNotificationProvider (Transactional HTML security emails).
   - ResendNotificationProvider / SmtpNotificationProvider (Alternative email adapters).
3. Enterprise reliability controls:
   - Idempotency key tracking (prevents duplicate delivery).
   - User notification preference filtering (mandatory vs optional events).
   - Bounded exponential backoff retries with jitter.
   - Dead-letter queue (DLQ) logging to data/logs/dead_letter_notifications.jsonl.
   - Operational log redaction (zero credentials or sensitive tokens in logs).
"""

from __future__ import annotations

import abc
import asyncio
import hashlib
import json
import os
import random
import re
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("kavach_notifications")


class NotificationChannel(str, Enum):
    EMAIL = "EMAIL"
    IN_APP = "IN_APP"
    DESKTOP = "DESKTOP"
    PUSH = "PUSH"
    SMS = "SMS"


class NotificationPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class DeliveryStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    DEAD_LETTER = "DEAD_LETTER"
    FILTERED = "FILTERED"


class NotificationType(str, Enum):
    # Account & Identity
    ACCOUNT_REGISTERED = "ACCOUNT_REGISTERED"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    ADMIN_APPROVED = "ADMIN_APPROVED"
    ADMIN_REJECTED = "ADMIN_REJECTED"
    ANALYST_ASSIGNED = "ANALYST_ASSIGNED"
    ACCOUNT_ACTIVATED = "ACCOUNT_ACTIVATED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    
    # Device
    DEVICE_ENROLLED = "DEVICE_ENROLLED"
    DEVICE_REVOKED = "DEVICE_REVOKED"
    
    # Security
    CRITICAL_INCIDENT = "CRITICAL_INCIDENT"
    CONTAINMENT_EXECUTED = "CONTAINMENT_EXECUTED"
    CONTAINMENT_RESTORED = "CONTAINMENT_RESTORED"
    POLICY_UPDATED = "POLICY_UPDATED"
    WEEKLY_DIGEST = "WEEKLY_DIGEST"


MANDATORY_NOTIFICATION_TYPES = {
    NotificationType.EMAIL_VERIFICATION,
    NotificationType.ADMIN_APPROVED,
    NotificationType.ADMIN_REJECTED,
    NotificationType.ACCOUNT_ACTIVATED,
    NotificationType.ACCOUNT_SUSPENDED,
    NotificationType.DEVICE_REVOKED,
    NotificationType.CRITICAL_INCIDENT,
    NotificationType.CONTAINMENT_EXECUTED,
}


def _redact_recipient(recipient: str) -> str:
    """Mask email or phone number in logs for privacy compliance."""
    if not recipient:
        return ""
    if "@" in recipient:
        user, domain = recipient.split("@", 1)
        masked_user = user[:2] + "***" if len(user) > 2 else "***"
        return f"{masked_user}@{domain}"
    if len(recipient) >= 8:
        return recipient[:3] + "****" + recipient[-3:]
    return "***"


class NotificationMessage:
    """Normalized notification data object."""

    def __init__(
        self,
        notification_type: NotificationType | str,
        recipient: str,
        subject: str,
        body_text: str,
        body_html: str | None = None,
        channel: NotificationChannel = NotificationChannel.EMAIL,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        idempotency_key: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.notification_type = (
            notification_type
            if isinstance(notification_type, NotificationType)
            else NotificationType(str(notification_type))
        )
        self.recipient = recipient.strip()
        self.subject = subject.strip()
        self.body_text = body_text.strip()
        self.body_html = body_html
        self.channel = channel
        self.priority = priority
        self.metadata = metadata or {}
        
        # Calculate or adopt idempotency key
        if idempotency_key:
            self.idempotency_key = idempotency_key
        else:
            seed = f"{self.notification_type.value}:{self.recipient}:{self.subject}:{datetime.now(timezone.utc).strftime('%Y-%m-%d-%H')}"
            self.idempotency_key = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:32]

        self.id = hashlib.sha256(f"{self.idempotency_key}:{random.random()}".encode()).hexdigest()[:16]
        self.status = DeliveryStatus.PENDING
        self.attempts = 0
        self.created_at = datetime.now(timezone.utc)
        self.sent_at: datetime | None = None
        self.error_message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "idempotency_key": self.idempotency_key,
            "type": self.notification_type.value,
            "recipient_redacted": _redact_recipient(self.recipient),
            "channel": self.channel.value,
            "priority": self.priority.value,
            "subject": self.subject,
            "status": self.status.value,
            "attempts": self.attempts,
            "created_at": self.created_at.isoformat(),
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "error_message": self.error_message,
        }


class NotificationProvider(abc.ABC):
    """Abstract interface for all notification dispatch providers."""

    @abc.abstractmethod
    async def send(self, message: NotificationMessage) -> bool:
        """Deliver the given notification message."""
        pass

    @abc.abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """Verify provider availability and configuration."""
        pass


class MockNotificationProvider(NotificationProvider):
    """
    Zero-cost local development and CI notification provider.
    Never transmits data over the external network.
    Records all dispatched notifications to an in-memory history and a local log file.
    """

    def __init__(self, log_path: Path | None = None) -> None:
        self.sent_messages: list[NotificationMessage] = []
        self._log_path = log_path or (Path("data/logs/notifications_dev.jsonl"))

    async def send(self, message: NotificationMessage) -> bool:
        message.attempts += 1
        message.status = DeliveryStatus.SENT
        message.sent_at = datetime.now(timezone.utc)
        self.sent_messages.append(message)

        # Write to dev log file
        try:
            self._log_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(message.to_dict()) + "\n")
        except Exception:
            pass

        logger.info(
            "notification_sent_mock",
            msg_id=message.id,
            type=message.notification_type.value,
            recipient=_redact_recipient(message.recipient),
            channel=message.channel.value,
        )
        return True

    async def health_check(self) -> dict[str, Any]:
        return {
            "provider": "MockNotificationProvider",
            "status": "healthy",
            "mode": "development",
            "messages_sent_count": len(self.sent_messages),
        }


class AwsSnsNotificationProvider(NotificationProvider):
    """
    AWS Simple Notification Service (SNS) provider for security broadcasts and SMS alerts.
    Operates only when AWS credentials and region are explicitly provided.
    """

    def __init__(
        self,
        topic_arn: str | None = None,
        region_name: str | None = None,
    ) -> None:
        self.topic_arn = topic_arn or os.environ.get("AWS_SNS_TOPIC_ARN", "")
        self.region_name = region_name or os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import boto3
                self._client = boto3.client("sns", region_name=self.region_name)
            except Exception as exc:
                logger.warning("aws_sns_client_init_failed", error=str(exc))
                raise RuntimeError(f"Failed to initialize AWS SNS client: {exc}")
        return self._client

    async def send(self, message: NotificationMessage) -> bool:
        message.attempts += 1
        try:
            client = self._get_client()
            loop = asyncio.get_running_loop()

            payload = {
                "Subject": message.subject[:100],
                "Message": message.body_text,
            }

            if message.channel == NotificationChannel.SMS and message.recipient.startswith("+"):
                payload["PhoneNumber"] = message.recipient
            elif self.topic_arn:
                payload["TopicArn"] = self.topic_arn
            else:
                raise ValueError("Neither a valid phone number nor AWS_SNS_TOPIC_ARN was provided.")

            resp = await loop.run_in_executor(None, lambda: client.publish(**payload))
            msg_id = resp.get("MessageId", "unknown")
            message.status = DeliveryStatus.SENT
            message.sent_at = datetime.now(timezone.utc)
            message.metadata["aws_sns_message_id"] = msg_id
            logger.info("aws_sns_published", msg_id=msg_id, type=message.notification_type.value)
            return True
        except Exception as exc:
            message.error_message = str(exc)
            logger.error("aws_sns_publish_error", error=str(exc), recipient=_redact_recipient(message.recipient))
            return False

    async def health_check(self) -> dict[str, Any]:
        return {
            "provider": "AwsSnsNotificationProvider",
            "region": self.region_name,
            "has_topic_arn": bool(self.topic_arn),
            "status": "configured" if self.topic_arn else "missing_topic_arn",
        }


class AwsSesNotificationProvider(NotificationProvider):
    """
    Amazon Simple Email Service (SES) provider for high-reputation transactional emails.
    """

    def __init__(
        self,
        from_email: str | None = None,
        region_name: str | None = None,
    ) -> None:
        self.from_email = from_email or os.environ.get("AWS_SES_FROM_EMAIL", "kavachcybertech@gmail.com")
        self.region_name = region_name or os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import boto3
                self._client = boto3.client("ses", region_name=self.region_name)
            except Exception as exc:
                logger.warning("aws_ses_client_init_failed", error=str(exc))
                raise RuntimeError(f"Failed to initialize AWS SES client: {exc}")
        return self._client

    async def send(self, message: NotificationMessage) -> bool:
        message.attempts += 1
        try:
            client = self._get_client()
            loop = asyncio.get_running_loop()

            body_dict: dict[str, Any] = {
                "Text": {"Data": message.body_text, "Charset": "UTF-8"}
            }
            if message.body_html:
                body_dict["Html"] = {"Data": message.body_html, "Charset": "UTF-8"}

            ses_payload = {
                "Source": self.from_email,
                "Destination": {"ToAddresses": [message.recipient]},
                "Message": {
                    "Subject": {"Data": message.subject, "Charset": "UTF-8"},
                    "Body": body_dict,
                },
            }

            resp = await loop.run_in_executor(None, lambda: client.send_email(**ses_payload))
            msg_id = resp.get("MessageId", "unknown")
            message.status = DeliveryStatus.SENT
            message.sent_at = datetime.now(timezone.utc)
            message.metadata["aws_ses_message_id"] = msg_id
            logger.info("aws_ses_email_sent", msg_id=msg_id, recipient=_redact_recipient(message.recipient))
            return True
        except Exception as exc:
            message.error_message = str(exc)
            logger.error("aws_ses_send_error", error=str(exc), recipient=_redact_recipient(message.recipient))
            return False

    async def health_check(self) -> dict[str, Any]:
        return {
            "provider": "AwsSesNotificationProvider",
            "region": self.region_name,
            "from_email": self.from_email,
            "status": "configured",
        }


class NotificationService:
    """
    Central notification orchestrator with retry backoff, idempotency, preference filtering,
    and dead-letter queue preservation.
    """

    MAX_RETRIES = 3
    BASE_BACKOFF_SECONDS = 0.5

    def __init__(
        self,
        provider: NotificationProvider | None = None,
        dead_letter_path: Path | None = None,
    ) -> None:
        self.settings = get_settings()
        self._provider = provider or self._resolve_default_provider()
        self._idempotency_cache: dict[str, float] = {}  # key -> timestamp
        self._dead_letter_path = dead_letter_path or Path("data/logs/dead_letter_notifications.jsonl")

    def _resolve_default_provider(self) -> NotificationProvider:
        """Select appropriate provider based on active environment flags."""
        use_aws_ses = os.environ.get("AWS_SES_ENABLED", "").lower() in ("true", "1", "yes")
        use_aws_sns = os.environ.get("AWS_SNS_ENABLED", "").lower() in ("true", "1", "yes")

        if use_aws_ses:
            return AwsSesNotificationProvider()
        if use_aws_sns:
            return AwsSnsNotificationProvider()

        # Default: Local mock provider (Zero AWS cost, safe for local development & CI)
        return MockNotificationProvider()

    def set_provider(self, provider: NotificationProvider) -> None:
        """Hot-swap provider (e.g. for testing)."""
        self._provider = provider

    def _is_idempotent_duplicate(self, key: str) -> bool:
        """Check if message was already sent within the last 1 hour."""
        now = datetime.now(timezone.utc).timestamp()
        if key in self._idempotency_cache:
            if now - self._idempotency_cache[key] < 3600:
                return True
        self._idempotency_cache[key] = now
        # Prune old cache entries if it grows too large
        if len(self._idempotency_cache) > 5000:
            cutoff = now - 3600
            self._idempotency_cache = {k: v for k, v in self._idempotency_cache.items() if v > cutoff}
        return False

    def _allows_notification(self, user_prefs: dict[str, bool] | None, notif_type: NotificationType) -> bool:
        """Verify user preferences; mandatory security notifications cannot be disabled."""
        if notif_type in MANDATORY_NOTIFICATION_TYPES:
            return True
        if not user_prefs:
            return True
        return user_prefs.get(notif_type.value, True)

    def _write_to_dead_letter(self, message: NotificationMessage, reason: str) -> None:
        """Append failed notification to immutable dead-letter log."""
        try:
            self._dead_letter_path.parent.mkdir(parents=True, exist_ok=True)
            record = message.to_dict()
            record["dead_letter_reason"] = reason
            record["failed_at"] = datetime.now(timezone.utc).isoformat()
            with open(self._dead_letter_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
            logger.warning("notification_routed_to_dead_letter", msg_id=message.id, reason=reason)
        except Exception as exc:
            logger.error("failed_to_write_dead_letter", error=str(exc))

    async def dispatch(
        self,
        notification_type: NotificationType | str,
        recipient: str,
        subject: str,
        body_text: str,
        body_html: str | None = None,
        channel: NotificationChannel = NotificationChannel.EMAIL,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        idempotency_key: str | None = None,
        user_preferences: dict[str, bool] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> NotificationMessage:
        """
        Validate, filter, and dispatch a notification with retry backoff.
        """
        msg = NotificationMessage(
            notification_type=notification_type,
            recipient=recipient,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            channel=channel,
            priority=priority,
            idempotency_key=idempotency_key,
            metadata=metadata,
        )

        # 1. Idempotency Check
        if self._is_idempotent_duplicate(msg.idempotency_key):
            msg.status = DeliveryStatus.FILTERED
            msg.error_message = "Suppressed as duplicate by idempotency key"
            logger.info("notification_suppressed_duplicate", idempotency_key=msg.idempotency_key)
            return msg

        # 2. Preference Check
        if not self._allows_notification(user_preferences, msg.notification_type):
            msg.status = DeliveryStatus.FILTERED
            msg.error_message = "User preferences opted out of non-critical notification"
            logger.info("notification_suppressed_by_preference", type=msg.notification_type.value)
            return msg

        # 3. Delivery with Bounded Exponential Backoff Retry
        for attempt in range(1, self.MAX_RETRIES + 1):
            success = await self._provider.send(msg)
            if success:
                msg.status = DeliveryStatus.SENT
                return msg

            if attempt < self.MAX_RETRIES:
                backoff = (self.BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))) + (random.random() * 0.2)
                logger.warning(
                    "notification_retry_scheduled",
                    attempt=attempt,
                    next_delay=round(backoff, 2),
                    msg_id=msg.id,
                )
                await asyncio.sleep(backoff)

        # 4. Route to Dead-Letter Queue if all retries exhausted
        msg.status = DeliveryStatus.DEAD_LETTER
        self._write_to_dead_letter(msg, f"Exhausted {self.MAX_RETRIES} delivery attempts")
        return msg

    async def get_health(self) -> dict[str, Any]:
        """Return provider health and dead-letter statistics."""
        provider_health = await self._provider.health_check()
        dead_letter_count = 0
        if self._dead_letter_path.exists():
            try:
                with open(self._dead_letter_path, "r", encoding="utf-8") as f:
                    dead_letter_count = sum(1 for line in f if line.strip())
            except Exception:
                pass

        return {
            "status": "operational",
            "provider": provider_health,
            "dead_letter_queue_count": dead_letter_count,
        }


# Singleton accessor
_global_notification_service: NotificationService | None = None


def get_notification_service() -> NotificationService:
    global _global_notification_service
    if _global_notification_service is None:
        _global_notification_service = NotificationService()
    return _global_notification_service
