"""
KAVACH Email Notification Service.

Sends security alerts and notifications via Gmail SMTP with modern, clean, 
light-themed HTML email templates and dynamic radial gradient styling.
"""

from __future__ import annotations

import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    """Async email notification service."""

    def __init__(self) -> None:
        self._settings = get_settings()
        # Define base URL for the logo, e.g., from a CDN or static assets server.
        self._base_url = getattr(self._settings, "api_base_url", "http://localhost:8000")

    async def send_notification(
        self,
        subject: str,
        body: str,
        recipient: str | None = None,
        recipient_name: str = "User",
        is_alert: bool = False,
        action_url: str | None = None,
        action_text: str | None = None,
    ) -> bool:
        """Send a formatted email notification via SMTP, applying gradient header styling."""
        settings = self._settings.notification
        target_email = recipient or settings.soc_email or settings.username

        if not settings.server or not settings.username or not settings.password:
            logger.warning("email_service_not_configured")
            return False

        def _send() -> bool:
            try:
                msg = MIMEMultipart("alternative")

                # Prefix subject based on is_alert
                subject_prefix = "[KAVACH ALERT] " if is_alert else "[KAVACH] "
                msg["Subject"] = f"{subject_prefix}{subject}"
                msg["From"] = f"KAVACH Security Platform <{settings.username}>"
                msg["To"] = target_email

                # Logo URL
                logo_url = f"{self._base_url}/static/kavach-logo.png"

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
                    Generated automatically by KAVACH SOAR-XDR Platform | SOC Phone: {settings.soc_phone}<br>
                    © 2026 Swastik Chemical (India). All rights reserved.
                """

                # HTML Template recreating the reference layout exactly
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
                                            <!-- Brand Logo Header -->
                                            <div style="margin-bottom: 20px;">
                                                <img src="{logo_url}" alt="KAVACH Logo" width="130" style="max-width: 130px; height: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
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

                # Attach plaintext and HTML fallbacks
                msg.attach(MIMEText(body, "plain"))
                msg.attach(MIMEText(html_content, "html"))

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


# Singleton
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service