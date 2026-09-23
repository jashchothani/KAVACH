"""
KAVACH Email Notification Service.

Sends multi-factor verification codes, alerts, digests using
Jinja2 table-based HTML email templates with built-in retry backoff
and dead-letter log file output.
"""

from __future__ import annotations

import asyncio
import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any
from jinja2 import Environment, FileSystemLoader, select_autoescape

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    """Provider-agnostic email notification service with templating, retries, and dead-letter queue."""

    def __init__(self) -> None:
        self.settings = get_settings()
        # Initialize Jinja2 templates environment
        template_dir = Path(__file__).parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(["html", "xml"])
        )
        # Create dead letter path
        self.dead_letter_path = Path(self.settings.paths.log_dir) / "dead_letter_emails.jsonl"

    async def send_email(
        self,
        to: str,
        template_name: str,
        subject: str,
        context: dict[str, Any]
    ) -> bool:
        """
        Send an email utilizing a Jinja2 HTML template with retry backoff.
        
        Args:
            to: Recipient email address.
            template_name: Jinja2 template file (e.g. 'verify_email.html').
            subject: Email subject.
            context: Context dictionary passed to the template rendering engine.
        """
        smtp = self.settings.notification
        
        # Inject standard global context values if missing
        if "dashboard_url" not in context:
            base_url = getattr(self.settings, "api_base_url", "http://localhost:8000")
            context["dashboard_url"] = base_url
        if "soc_phone" not in context:
            context["soc_phone"] = smtp.soc_phone or "9004976777"
        
        # Render template
        try:
            template = self.env.get_template(template_name)
            html_content = template.render(**context)
        except Exception as exc:
            logger.error("email_template_rendering_failed", template=template_name, error=str(exc))
            self._write_to_dead_letter(to, template_name, subject, context, f"Template error: {exc}")
            return False

        # Check for Resend API key first
        resend_api_key = os.environ.get("RESEND_API_KEY") or getattr(self.settings.notification, "resend_api_key", None)
        if resend_api_key:
            try:
                import httpx
                from_email = os.environ.get("RESEND_FROM_EMAIL", "KAVACH Security <onboarding@resend.dev>")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {resend_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "from": from_email,
                            "to": [to],
                            "subject": subject,
                            "html": html_content,
                        },
                    )
                    if resp.status_code in (200, 201):
                        logger.info("email_sent_via_resend", recipient=to, subject=subject)
                        return True
                    else:
                        logger.warning("resend_api_returned_error", status_code=resp.status_code, body=resp.text)
            except Exception as exc:
                logger.warning("resend_send_failed", error=str(exc))

        # If in test/development and not testing SMTP error retries, or if SMTP is unconfigured, log as mock
        # Check if SMTP is configured with real credentials
        has_real_smtp = (
            bool(smtp.server)
            and bool(smtp.username)
            and bool(smtp.password)
            and "your_email" not in smtp.username
            and "your_app_password" not in smtp.password
        )
        is_placeholder = not has_real_smtp
        if is_placeholder:
            logger.info("mock_email_sent", recipient=to, subject=subject, template=template_name)
            # Create a mock notification file for testing
            mock_dir = Path(self.settings.paths.log_dir) / "mock_emails"
            mock_dir.mkdir(parents=True, exist_ok=True)
            mock_file = mock_dir / f"{to}_{template_name}.json"
            with open(mock_file, "w") as f:
                json.dump({"to": to, "subject": subject, "context": context}, f)
            return True

        # Plain text fallback
        plain_text = f"{subject}\n\nThis is a HTML formatted email. Please open in a client that supports HTML."

        # Send with retry-with-backoff
        max_retries = 3
        backoff = 2.0
        
        for attempt in range(1, max_retries + 1):
            try:
                def _send_sync():
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"] = f"KAVACH Security Platform <{smtp.username}>"
                    msg["To"] = to
                    
                    msg.attach(MIMEText(plain_text, "plain"))
                    msg.attach(MIMEText(html_content, "html"))
                    
                    with smtplib.SMTP(smtp.server, smtp.port, timeout=10) as server:
                        if smtp.use_tls:
                            server.starttls()
                        server.login(smtp.username, smtp.password)
                        server.sendmail(smtp.username, to, msg.as_string())
                
                # Execute SMTP connection in separate thread to prevent blocking event loop
                await asyncio.to_thread(_send_sync)
                logger.info("email_sent_successfully", recipient=to, subject=subject, attempt=attempt)
                return True
                
            except Exception as exc:
                logger.warning("email_send_attempt_failed", recipient=to, attempt=attempt, error=str(exc))
                if attempt < max_retries:
                    is_dev = os.environ.get("ENVIRONMENT") in ("development", "test")
                    await asyncio.sleep(0.01 if is_dev else (backoff ** attempt))
                else:
                    logger.error("email_send_exhausted_retries", recipient=to, error=str(exc))
                    self._write_to_dead_letter(to, template_name, subject, context, str(exc))
                    return False

        
        return False

    def _write_to_dead_letter(
        self,
        to: str,
        template_name: str,
        subject: str,
        context: dict[str, Any],
        error_msg: str
    ) -> None:
        """Log failed email parameters to dead_letter_emails.jsonl."""
        try:
            self.dead_letter_path.parent.mkdir(parents=True, exist_ok=True)
            record = {
                "timestamp": Path().stat().st_mtime, # Use system file timing or simply rely on time in log
                "to": to,
                "template": template_name,
                "subject": subject,
                "context": context,
                "error": error_msg
            }
            with open(self.dead_letter_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, default=str) + "\n")
            logger.info("dead_letter_written", path=str(self.dead_letter_path))
        except Exception as exc:
            logger.critical("dead_letter_write_failed", error=str(exc))


# Singleton
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
