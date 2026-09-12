"""
KAVACH Two-Factor Authentication Service.

Handles TOTP secret generation, URI mapping for authenticator apps,
base64 QR code rendering, verification, and cryptographically secure backup codes.
"""

from __future__ import annotations

import base64
import io
import secrets
import pyotp
import qrcode
from core.config import get_settings


def generate_totp_secret() -> str:
    """Generate a random 32-character base32 TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(username: str, secret: str) -> str:
    """Generate the provisioning URI for authenticator apps (Google Authenticator, Authy, etc.)."""
    settings = get_settings()
    issuer_name = "KAVACH-SOC"
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=username,
        issuer_name=issuer_name
    )


def generate_qr_code_data_uri(uri: str) -> str:
    """Generate a base64 encoded data URI for a QR code image representing the provisioning URI."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"


def verify_totp_code(secret: str, code: str) -> bool:
    """Verify a 6-digit TOTP code against the secret."""
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    # Allow 1 time-step window skew (30 seconds) for user convenience
    return totp.verify(code, valid_window=1)


def generate_backup_codes(count: int = 8) -> list[str]:
    """Generate cryptographically secure backup codes."""
    return [secrets.token_hex(4).upper() for _ in range(count)]
