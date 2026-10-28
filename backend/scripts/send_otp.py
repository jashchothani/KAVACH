"""
KAVACH One-Click OTP Dispatch Tool.

Dispatches a 6-digit verification / password-reset OTP to any email address
using KAVACH's high-speed SMTP & AWS notification engine.

Usage:
    python backend/scripts/send_otp.py --email user@example.com
    python backend/scripts/send_otp.py --email user@example.com --code 123456
    python backend/scripts/send_otp.py --email user@example.com --type reset
"""

import argparse
import asyncio
import os
import random
import sys
from pathlib import Path

# Ensure backend root is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from email_notifications.service import get_email_service


async def send_otp(to_email: str, code: str | None = None, name: str | None = None, otp_type: str = "login") -> bool:
    if not code:
        code = f"{random.randint(100000, 999999)}"
    if not name:
        name = to_email.split("@")[0].capitalize()

    print(f"[*] Preparing OTP dispatch...")
    print(f"    Recipient: {to_email}")
    print(f"    OTP Code:  {code}")
    print(f"    Type:      {otp_type.upper()}")

    template_name = "password_reset.html" if otp_type == "reset" else "verify_email.html"
    subject = f"Your KAVACH Security OTP: {code}"

    svc = get_email_service()
    success = await svc.send_email(
        to=to_email,
        template_name=template_name,
        subject=subject,
        context={
            "username": name,
            "verification_code": code,
            "reset_code": code,
            "otp": code,
            "verification_url": f"Verification Code: {code}",
            "expires_in_minutes": 15,
        },
    )

    if success:
        print(f"\n[+] SUCCESS! OTP {code} was dispatched to {to_email}")
    else:
        print(f"\n[-] FAILED to send email to {to_email}. Check logs in data/logs/kavach.log")
    return success


def main():
    parser = argparse.ArgumentParser(description="KAVACH One-Click OTP Dispatch Tool")
    parser.add_argument("--email", "-e", required=True, help="Recipient email address")
    parser.add_argument("--code", "-c", default=None, help="6-digit OTP code (default: auto-generated)")
    parser.add_argument("--name", "-n", default=None, help="User's display name")
    parser.add_argument("--type", "-t", choices=["login", "verify", "reset"], default="login", help="OTP type")
    args = parser.parse_args()

    asyncio.run(send_otp(args.email, args.code, args.name, args.type))


if __name__ == "__main__":
    main()

