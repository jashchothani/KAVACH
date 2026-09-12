"""
KAVACH Seed Script.

Creates default admin user (admin / Kavach@2026!Secure) and sample device.
"""

from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.constants import UserRole
from core.security import hash_password
from database.engine import get_session, init_database
from database.repositories import UserRepository, DeviceRepository, AlertRepository, IOCRepository


async def seed() -> None:
    print("Initializing database tables...")
    await init_database()

    async with get_session() as session:
        user_repo = UserRepository(session)
        device_repo = DeviceRepository(session)
        alert_repo = AlertRepository(session)
        ioc_repo = IOCRepository(session)

        # 1. Create default Admin user with strong password
        admin = await user_repo.get_by_username("admin")
        if not admin:
            admin = await user_repo.create(
                username="admin",
                email="admin@kavach.soc",
                password_hash=hash_password("Kavach@2026!Secure"),
                role=UserRole.SOC_ANALYST.value,
            )
            print("[+] Created admin user: admin / Kavach@2026!Secure (Role: soc_analyst)")

        # 2. Create default Device
        dev = await device_repo.get_by_hostname("DESKTOP-KAVACH")
        if not dev:
            dev = await device_repo.create(
                hostname="DESKTOP-KAVACH",
                ip_address="192.168.1.100",
                os_name="Windows 11 Pro",
                os_version="10.0.22631",
                risk_score=25.0,
                status="active",
            )
            print("[+] Created default monitored device: DESKTOP-KAVACH")

        print("\nSeed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
