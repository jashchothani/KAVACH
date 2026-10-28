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
        context: dict[str, Any],
        attachment_path: str | Path | None = None,
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
        
        # Route mock domains (.soc, localhost, etc.) to genuine SOC email for reliable inbox delivery
        to_clean = str(to).strip()
        if to_clean.endswith(".soc") or "@" not in to_clean or "localhost" in to_clean:
            to_clean = getattr(smtp, "soc_email", None) or "kavachcybertech@gmail.com"
        to = to_clean

        # Inject standard global context values if missing
        if "dashboard_url" not in context:
            base_url = getattr(self.settings, "api_base_url", "http://localhost:8000")
            context["dashboard_url"] = base_url
        if "soc_phone" not in context:
            context["soc_phone"] = smtp.soc_phone or "9004976777"
        if "soc_email" not in context:
            context["soc_email"] = getattr(smtp, "soc_email", None) or "kavachcybertech@gmail.com"
        
        # Render template
        try:
            template = self.env.get_template(template_name)
            html_content = template.render(**context)
        except Exception as exc:
            logger.error("email_template_rendering_failed", template=template_name, error=str(exc))
            self._write_to_dead_letter(to, template_name, subject, context, f"Template error: {exc}")
            return False

        # Prepare logo attachment for Resend and SMTP
        logo_path = Path(__file__).parent / "templates" / "kavach-logo.png"
        if not logo_path.exists():
            logo_path = Path("backend/static/kavach-logo.png")
        if not logo_path.exists():
            logo_path = Path("assets/kavach_logo.png")

        logo_b64: str | None = None
        logo_bytes: bytes | None = None
        if logo_path.exists():
            try:
                import base64
                with open(logo_path, "rb") as f:
                    logo_bytes = f.read()
                logo_b64 = base64.b64encode(logo_bytes).decode("ascii")
            except Exception as e:
                logger.warning("could_not_read_logo_attachment", error=str(e))

        # 1. PRIMARY: Direct High-Speed SMTP (Zoho Pro Mail / Configured SMTP)
        # Guarantees instant delivery directly into recipient inbox without prior subscription confirmation.
        smtp_server = getattr(smtp, "server", None)
        if smtp_server is None:
            smtp_server = os.environ.get("SMTP_SERVER") or os.environ.get("NOTIFICATION_SERVER") or "smtppro.zoho.in"
            
        smtp_port = int(
            getattr(smtp, "port", None)
            or os.environ.get("SMTP_PORT")
            or os.environ.get("NOTIFICATION_PORT")
            or 587
        )
        smtp_username = getattr(smtp, "username", None)
        if smtp_username is None:
            smtp_username = (
                os.environ.get("SMTP_USERNAME")
                or os.environ.get("NOTIFICATION_USERNAME")
                or "no-reply@kavachcybertech.in"
            )
            
        smtp_password = getattr(smtp, "password", None)
        if smtp_password is None:
            smtp_password = (
                os.environ.get("SMTP_PASSWORD")
                or os.environ.get("NOTIFICATION_PASSWORD")
                or "HQrTsqrNmu7f"
            )
        smtp_use_tls = getattr(smtp, "use_tls", True)

        has_real_smtp = (
            bool(smtp_server)
            and bool(smtp_username)
            and bool(smtp_password)
            and "your_email" not in smtp_username
            and "your_app_password" not in smtp_password
        )

        if has_real_smtp:
            plain_text = f"{subject}\n\nThis is an HTML formatted security notification from KAVACH SOAR-XDR."
            max_retries = 3
            backoff = 2.0
            for attempt in range(1, max_retries + 1):
                try:
                    def _send_sync():
                        msg = MIMEMultipart("related")
                        msg["Subject"] = subject
                        msg["From"] = f"KAVACH Security Platform <{smtp_username}>"
                        msg["To"] = to

                        alt_part = MIMEMultipart("alternative")
                        alt_part.attach(MIMEText(plain_text, "plain"))
                        alt_part.attach(MIMEText(html_content, "html"))
                        msg.attach(alt_part)

                        if logo_bytes:
                            from email.mime.image import MIMEImage
                            logo_part = MIMEImage(logo_bytes, _subtype="png")
                            logo_part.add_header("Content-ID", "<kavach_logo>")
                            logo_part.add_header("Content-Disposition", "inline", filename="kavach_logo.png")
                            msg.attach(logo_part)

                        if attachment_path and Path(attachment_path).exists():
                            try:
                                from email.mime.application import MIMEApplication
                                with open(attachment_path, "rb") as f:
                                    att_data = f.read()
                                att_part = MIMEApplication(att_data, _subtype="pdf")
                                att_part.add_header("Content-Disposition", "attachment", filename=Path(attachment_path).name)
                                msg.attach(att_part)
                            except Exception as att_err:
                                logger.warning("email_attachment_attach_failed", error=str(att_err))

                        # Support both STARTTLS (port 587) and Direct SSL/TLS (port 465)
                        if smtp_port == 465:
                            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=12) as server:
                                server.login(smtp_username, smtp_password)
                                server.sendmail(smtp_username, to, msg.as_string())
                        else:
                            try:
                                with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                                    if smtp_use_tls:
                                        server.starttls()
                                    server.login(smtp_username, smtp_password)
                                    server.sendmail(smtp_username, to, msg.as_string())
                            except Exception as port_err:
                                # On cloud EC2 instances where 587 might be throttled or blocked, auto-fallback to 465 (SSL)
                                logger.warning("smtp_port_587_failed_attempting_465_ssl_fallback", error=str(port_err))
                                with smtplib.SMTP_SSL(smtp_server, 465, timeout=12) as server:
                                    server.login(smtp_username, smtp_password)
                                    server.sendmail(smtp_username, to, msg.as_string())

                    await asyncio.to_thread(_send_sync)
                    logger.info("email_sent_successfully_via_smtp", recipient=to, subject=subject, attempt=attempt)
                    return True
                except Exception as exc:
                    logger.warning("smtp_send_attempt_failed", recipient=to, attempt=attempt, error=str(exc))
                    if attempt < max_retries:
                        is_dev = os.environ.get("ENVIRONMENT") in ("development", "test")
                        await asyncio.sleep(0.01 if is_dev else (backoff ** attempt))
                    else:
                        logger.error("smtp_retries_exhausted_trying_fallback", recipient=to, error=str(exc))

        # 2. FALLBACK: AWS SNS (Secondary delivery & topic alert notification)
        aws_sns_topic_arn = (
            os.environ.get("AWS_SNS_TOPIC_ARN")
            or getattr(self.settings.notification, "sns_topic_arn", None)
        )
        region = (
            os.environ.get("AWS_DEFAULT_REGION")
            or getattr(self.settings.notification, "aws_region", None)
            or "ap-south-1"
        )
        try:
            import boto3
            sns_client = boto3.client("sns", region_name=region)

            if aws_sns_topic_arn:
                otp_code = context.get("verification_code") or context.get("otp") or context.get("reset_code")
                clean_subject = (subject if len(subject) <= 100 else subject[:97] + "...")
                if otp_code:
                    if "password" in template_name.lower() or "reset" in template_name.lower():
                        clean_subject = f"[KAVACH] Password Reset Code: {otp_code} - Action Required"
                    elif "verify" in template_name.lower() or "otp" in template_name.lower():
                        clean_subject = f"[KAVACH] OTP: {otp_code} - Security Verification"

                plain_summary = self._build_plaintext_summary(clean_subject, template_name, context)
                publish_payload: dict[str, Any] = {
                    "TopicArn": aws_sns_topic_arn,
                    "Subject": clean_subject[:100],
                    "Message": plain_summary,
                    "MessageAttributes": {
                        "Recipient": {"DataType": "String", "StringValue": to},
                        "Template": {"DataType": "String", "StringValue": template_name},
                        "Platform": {"DataType": "String", "StringValue": "KAVACH"},
                    },
                }
                if otp_code:
                    publish_payload["MessageAttributes"]["OtpCode"] = {
                        "DataType": "String",
                        "StringValue": str(otp_code),
                    }
                resp = await asyncio.to_thread(sns_client.publish, **publish_payload)
                msg_id = resp.get("MessageId", "unknown")
                logger.info("email_sent_via_aws_sns", msg_id=msg_id, recipient=to, topic=aws_sns_topic_arn)
                return True
        except Exception as sns_exc:
            logger.warning("aws_sns_dispatch_unavailable", error=str(sns_exc))

        # 2. Resend (Disabled by default per explicit user mandate: "emails should come from sns not resend")
        enable_resend = os.environ.get("ENABLE_RESEND", "false").lower() in ("true", "1", "yes")
        if enable_resend:
            resend_api_key = os.environ.get("RESEND_API_KEY") or getattr(self.settings.notification, "resend_api_key", None)
            if resend_api_key:
                try:
                    import httpx
                    from_email = os.environ.get("RESEND_FROM_EMAIL", "KAVACH Security <onboarding@resend.dev>")
                    if "@gmail.com" in from_email.lower():
                        from_email = "KAVACH Security <onboarding@resend.dev>"
                    resend_payload: dict[str, Any] = {
                        "from": from_email,
                        "to": [to],
                        "subject": subject,
                        "html": html_content,
                    }
                    if logo_b64:
                        resend_payload["attachments"] = [
                            {
                                "filename": "kavach_logo.png",
                                "content": logo_b64,
                                "content_type": "image/png",
                            }
                        ]
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            "https://api.resend.com/emails",
                            headers={
                                "Authorization": f"Bearer {resend_api_key}",
                                "Content-Type": "application/json",
                            },
                            json=resend_payload,
                        )
                        if resp.status_code in (200, 201):
                            logger.info("email_sent_via_resend", recipient=to, subject=subject)
                            return True
                        else:
                            logger.warning("resend_api_returned_error", status_code=resp.status_code, body=resp.text)
                except Exception as exc:
                    logger.warning("resend_send_failed", error=str(exc))

        # 3. If all delivery methods fail or are unconfigured, record dead letter
        self._write_to_dead_letter(to, template_name, subject, context, "All email transports (SMTP, AWS SNS, Resend) failed or unavailable")
        return False

    def _build_plaintext_summary(self, subject: str, template_name: str, context: dict[str, Any]) -> str:
        """Construct a formatted text representation from template variables for SNS email subscribers."""
        lines = [
            "==================================================",
            "🛡️  KAVACH SOAR-XDR SECURITY PLATFORM",
            "==================================================",
            f"SUBJECT: {subject}",
            ""
        ]
        t_lower = template_name.lower()
        if "verify" in t_lower or "otp" in t_lower:
            code = context.get("verification_code") or context.get("otp", "N/A")
            mins = context.get("expires_in_minutes", 5)
            lines.extend([
                "**************************************************",
                f"   SECURITY VERIFICATION CODE: {code}",
                "**************************************************",
                "",
                f"Hello {context.get('username', 'User')},",
                "",
                f"Your single-use KAVACH MFA verification code is: {code}",
                f"This code will expire in {mins} minutes.",
                "",
                "Enter this 6-digit code in the KAVACH application to complete your authentication.",
                "",
                "SECURITY WARNING: Never share this OTP with anyone. KAVACH Security will never ask for your code.",
            ])
        elif "alert" in t_lower:
            lines.extend([
                f"🚨 SECURITY INCIDENT ALERT: {context.get('title', subject)}",
                f"Severity: {context.get('severity', 'HIGH')}",
                f"Device: {context.get('device_name', 'Endpoint Host')} ({context.get('device_ip', '127.0.0.1')})",
                f"Time: {context.get('detection_time', 'Just now')}",
                "",
                f"Detection Summary: {context.get('what_happened', 'An endpoint telemetry anomaly was flagged.')}",
                "",
                f"Recommended Action: {context.get('recommended_action', 'Review host telemetry and isolate process.')}",
            ])
        elif "password" in t_lower or "reset" in t_lower:
            code = context.get('reset_code') or context.get('verification_code') or context.get('otp', '------')
            lines.extend([
                f"Hello {context.get('username', 'User')},",
                "",
                "A password reset request was received for your KAVACH security account.",
                f"Your 6-Digit Password Reset OTP is: {code}",
                f"This code will expire in {context.get('expires_in_minutes', 15)} minutes.",
                "",
                "Enter this code in the KAVACH app or portal to reset your password.",
                "If you did not request this, please contact KAVACH SOC immediately.",
            ])
        elif "digest" in t_lower:
            lines.extend([
                f"KAVACH Weekly Threat Digest for {context.get('user_name', 'User')}:",
                f"• Security Score: {context.get('security_score', '88')}/100",
                f"• Threats Blocked: {context.get('threats_prevented', 0)}",
                f"• Active Monitored Devices: {context.get('active_devices', 1)}",
            ])
        else:
            for k, v in context.items():
                if isinstance(v, (str, int, float, bool)):
                    lines.append(f"• {k.replace('_', ' ').capitalize()}: {v}")

        dash_url = context.get("dashboard_url", "http://localhost:8000")
        soc_phone = context.get("soc_phone", "+91 1800-KAVACH-SOC")
        lines.extend([
            "",
            "--------------------------------------------------",
            f"Operations Portal: {dash_url}",
            "SOC Contact Email: kavachcybertech@gmail.com",
            f"SOC Hotline: {soc_phone}",
            "© 2026 KAVACH · Swastik Chemical (India) Sovereign Cyber Defense",
            "=================================================="
        ])
        return "\n".join(lines)

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
