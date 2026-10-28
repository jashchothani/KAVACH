"""
KAVACH Email Notification Service.

Sends security alerts and notifications via Gmail SMTP with modern, clean, 
light-themed HTML email templates and dynamic radial gradient styling.
"""

from __future__ import annotations

import asyncio
import os
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    """Async email notification service."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._base_url = getattr(self._settings, "api_base_url", "http://localhost:8000")
        # Locate local KAVACH logo for embedded email attachments
        self._logo_path = self._find_logo_path()

    def _find_logo_path(self) -> Path | None:
        candidates = [
            Path(__file__).parent / "kavach-logo.png",
            Path(__file__).parent.parent / "static" / "kavach-logo.png",
            Path(__file__).parent.parent / "email_notifications" / "templates" / "kavach-logo.png",
            Path("assets/kavach_logo.png"),
            Path("kavach-frontend/assets/logo.png"),
        ]
        for c in candidates:
            if c.exists():
                return c
        return None

    async def send_notification(
        self,
        subject: str,
        body: str,
        recipient: str | None = None,
        recipient_name: str = "User",
        is_alert: bool = False,
        action_url: str | None = None,
        action_text: str | None = None,
        attachment_path: Path | str | None = None,
    ) -> bool:
        """Send a formatted email notification via SMTP, applying gradient header styling."""
        settings = self._settings.notification
        target_email = recipient or settings.soc_email or settings.username

        # Check AWS SNS Topic configuration (Primary delivery channel)
        sns_topic_arn = os.environ.get("AWS_SNS_TOPIC_ARN") or getattr(settings, "sns_topic_arn", None)
        region = os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")
        try:
            import boto3
            sns_client = boto3.client("sns", region_name=region)
            if not sns_topic_arn:
                try:
                    topics_resp = sns_client.list_topics()
                    for t in topics_resp.get("Topics", []):
                        if "kavach" in t.get("TopicArn", "").lower():
                            sns_topic_arn = t.get("TopicArn")
                            break
                    if not sns_topic_arn and topics_resp.get("Topics"):
                        sns_topic_arn = topics_resp["Topics"][0].get("TopicArn")
                    if not sns_topic_arn:
                        created = sns_client.create_topic(Name="kavach-security-alerts")
                        sns_topic_arn = created.get("TopicArn")
                except Exception:
                    pass

            if sns_topic_arn:
                clean_subj = f"{'[KAVACH ALERT] ' if is_alert else '[KAVACH] '}{subject}"
                clean_subj = clean_subj[:97] + "..." if len(clean_subj) > 100 else clean_subj
                sns_msg = (
                    f"==================================================\n"
                    f"🛡️  KAVACH SOAR-XDR SECURITY PLATFORM\n"
                    f"==================================================\n"
                    f"Recipient: {recipient_name} <{target_email}>\n"
                    f"Subject: {clean_subj}\n\n"
                    f"{body}\n\n"
                    f"Portal Link: {action_url or self._base_url}\n"
                    f"SOC Hotline: {settings.soc_phone or '+91 1800-KAVACH-SOC'}\n"
                    f"=================================================="
                )
                await asyncio.to_thread(
                    sns_client.publish,
                    TopicArn=sns_topic_arn,
                    Subject=clean_subj,
                    Message=sns_msg,
                    MessageAttributes={
                        "Recipient": {"DataType": "String", "StringValue": target_email or "security-team"},
                        "IsAlert": {"DataType": "String", "StringValue": str(is_alert)},
                    }
                )
                logger.info("email_notification_sent_via_sns", topic=sns_topic_arn, subject=clean_subj)
                return True
        except Exception as sns_err:
            logger.warning("sns_publish_error_in_email_service", error=str(sns_err))

        if not settings.server or not settings.username or not settings.password:
            logger.warning("email_service_not_configured")
            return False

        def _send() -> bool:
            try:
                # Main container using 'related' to embed inline images + alternative text
                msg = MIMEMultipart("related")

                # Prefix subject based on is_alert
                subject_prefix = "[KAVACH ALERT] " if is_alert else "[KAVACH] "
                msg["Subject"] = f"{subject_prefix}{subject}"
                msg["From"] = f"KAVACH Security Platform <{settings.username or 'support@kavachcybertech.in'}>"
                msg["To"] = target_email

                # Alternative container for plain text and HTML
                alt_part = MIMEMultipart("alternative")

                # --- Design Palette & Dynamic Options based on is_alert ---
                if is_alert:
                    # Deep Red / Crimson Radial Gradient Theme for Security Alerts
                    bg_grad_1 = "#8b0000"
                    bg_grad_2 = "#b22222"
                    bg_grad_3 = "#dc143c"
                    badge_color = "#e94560"
                    badge_icon = "🛡️"
                    accent_color = "#dc143c"
                    btn_bg = "#dc143c"
                    header_title = "Security Alert Detected!"
                else:
                    # Navy / Electric Blue Radial Gradient Theme for Normal Notifications/OTP
                    bg_grad_1 = "#0f172a"
                    bg_grad_2 = "#1e293b"
                    bg_grad_3 = "#2563eb"
                    badge_color = "#3b82f6"
                    badge_icon = "🔒"
                    accent_color = "#2563eb"
                    btn_bg = "#2563eb"
                    header_title = "Account Notification"

                # Action button HTML block (if action link provided)
                button_html = ""
                if action_url and action_text:
                    button_html = f"""
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="{action_url}" style="background-color: {btn_bg}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                            {action_text.upper()}
                        </a>
                    </div>
                    """

                # Standard footer text
                footer_text = f"""
                    Generated automatically by KAVACH SOAR-XDR Platform | SOC Phone: {settings.soc_phone} | Email: <a href="mailto:support@kavachcybertech.in" style="color: #ffffff; text-decoration: underline;">support@kavachcybertech.in</a><br>
                    © 2026 Swastik Chemical (India). All rights reserved.
                """

                # HTML Template referencing inline CID attachment
                html_content = f"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; width: 100% !important; background-color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #e2e8f0; padding: 30px 10px;">
                        <tr>
                            <td align="center">
                                <!-- Main Card Outer Frame -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                    
                                    <!-- 1. Top Section: Concentric Gradient Header -->
                                    <tr>
                                        <td align="center" style="background: radial-gradient(circle at top, {bg_grad_3} 0%, {bg_grad_2} 45%, {bg_grad_1} 100%); padding: 35px 25px 60px 25px; text-align: center;">
                                            <!-- Brand Logo Header embedded via CID attachment -->
                                            <div style="margin-bottom: 20px;">
                                                <img src="cid:kavach_logo" alt="KAVACH Logo" width="140" style="max-width: 140px; height: auto; display: inline-block; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));">
                                            </div>

                                            <!-- Headline Text -->
                                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                                                {header_title}
                                            </h1>
                                            <p style="color: rgba(255, 255, 255, 0.85); font-size: 15px; margin: 0; line-height: 1.4;">
                                                {subject}
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- 2. Overlapping Floating Badge Icon -->
                                    <tr>
                                        <td align="center" style="height: 0px; background-color: #ffffff;">
                                            <div style="display: inline-block; width: 68px; height: 68px; background-color: {badge_color}; border-radius: 50%; box-shadow: 0 8px 20px rgba(0,0,0,0.18); line-height: 68px; text-align: center; font-size: 30px; border: 4px solid #ffffff; margin-top: -38px; position: relative;">
                                                {badge_icon}
                                            </div>
                                        </td>
                                    </tr>

                                    <!-- 3. Main White Card Content -->
                                    <tr>
                                        <td style="padding: 40px 35px 30px 35px; background-color: #ffffff;">
                                            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">
                                                Hi <strong>{recipient_name}</strong> 👋,
                                            </p>

                                            <!-- Message Body Container -->
                                            <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap; background-color: #f8fafc; padding: 18px; border-radius: 8px; border-left: 4px solid {accent_color}; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                                                {body}
                                            </div>

                                            {button_html}

                                            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 25px;">
                                                If you did not initiate this request or notice any suspicious activity, please notify your system administrator or support team immediately.
                                            </p>

                                            <p style="font-size: 14px; color: #1e293b; margin-top: 20px; font-weight: 600;">
                                                Stay secure,<br>
                                                <span style="color: {accent_color};">KAVACH Platform Team</span>
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- 4. Footer Section -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 25px 35px; border-top: 1px solid #e2e8f0; text-align: center;">
                                            <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0; line-height: 1.5;">
                                                {footer_text}
                                            </p>
                                            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                                                Want to change notification settings? Update your preferences in the portal.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>

                </body>
                </html>
                """

                # Attach plaintext and HTML fallbacks to alt_part
                alt_part.attach(MIMEText(body, "plain"))
                alt_part.attach(MIMEText(html_content, "html"))
                msg.attach(alt_part)

                # Attach KAVACH logo as an embedded MIMEImage with Content-ID
                if self._logo_path and self._logo_path.exists():
                    try:
                        with open(self._logo_path, "rb") as f:
                            logo_img = MIMEImage(f.read(), _subtype="png")
                        logo_img.add_header("Content-ID", "<kavach_logo>")
                        logo_img.add_header("Content-Disposition", "inline", filename="kavach_logo.png")
                        msg.attach(logo_img)
                    except Exception as img_err:
                        logger.warning("failed_to_attach_logo_image", error=str(img_err))

                # Attach PDF document or report if provided
                if attachment_path:
                    try:
                        from email.mime.application import MIMEApplication
                        ap = Path(attachment_path)
                        if ap.exists():
                            with open(ap, "rb") as af:
                                doc_attachment = MIMEApplication(af.read(), _subtype="pdf")
                                doc_attachment.add_header("Content-Disposition", "attachment", filename=ap.name)
                                msg.attach(doc_attachment)
                                logger.info("email_attachment_added", filename=ap.name)
                    except Exception as att_err:
                        logger.warning("failed_to_attach_document", error=str(att_err))

                # SMTP Logic
                with smtplib.SMTP(settings.server, settings.port, timeout=10) as server:
                    if settings.use_tls:
                        server.starttls()
                    server.login(settings.username, settings.password)
                    server.sendmail(settings.username, target_email, msg.as_string())

                logger.info("email_sent", recipient=target_email, subject=subject, is_alert=is_alert)
                return True

            except Exception as exc:
                logger.error("send_email_failed", error=str(exc))
                return False

        return await asyncio.to_thread(_send)

    async def send_alert_email(
        self,
        subject: str,
        body: str,
        recipient: str | None = None,
        recipient_name: str = "User",
        action_url: str | None = None,
        action_text: str | None = None,
    ) -> bool:
        """Convenience method to send a security alert (with red accents and alert header)."""
        return await self.send_notification(
            subject=subject,
            body=body,
            recipient=recipient,
            recipient_name=recipient_name,
            is_alert=True,
            action_url=action_url,
            action_text=action_text or "VIEW INCIDENT",
        )

    async def send_normal_email(
        self,
        subject: str,
        body: str,
        recipient: str | None = None,
        recipient_name: str = "User",
        action_url: str | None = None,
        action_text: str | None = None,
    ) -> bool:
        """Convenience method to send a normal notification / OTP (with default blue accents)."""
        return await self.send_notification(
            subject=subject,
            body=body,
            recipient=recipient,
            recipient_name=recipient_name,
            is_alert=False,
            action_url=action_url,
            action_text=action_text,
        )

    async def send_report_email(
        self,
        subject: str,
        body: str,
        recipient: str | None = None,
        recipient_name: str = "User",
        attachment_path: Path | str | None = None,
        action_url: str | None = None,
        action_text: str | None = None,
    ) -> bool:
        """Convenience method to send a weekly security report with attached PDF document."""
        return await self.send_notification(
            subject=subject,
            body=body,
            recipient=recipient,
            recipient_name=recipient_name,
            is_alert=False,
            action_url=action_url or "https://kavachcybertech.in/user.html",
            action_text=action_text or "VIEW REPORT IN PORTAL",
            attachment_path=attachment_path,
        )


# Singleton
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service