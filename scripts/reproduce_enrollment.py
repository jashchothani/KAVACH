import asyncio
import json
import os
import platform
import socket
import sys
import urllib.error
import urllib.request

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath('backend'))

from app.agent.identity import DeviceIdentityManager
from app.database.engine import init_database
from app.main import create_app
from httpx import ASGITransport, AsyncClient

async def reproduce():
    await init_database()
    app = create_app()
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:8000") as ac:
        # Register a test user
        uname = "enroll_repro_user"
        reg = await ac.post("/api/v1/auth/register", json={
            "username": uname,
            "email": f"{uname}@enterprise.com",
            "password": "ValidPassword123!",
            "role": "user",
        })
        print(f"Register status: {reg.status_code}")
        if reg.status_code == 200:
            token = reg.json()["access_token"]
        else:
            # Login if user already exists
            login = await ac.post("/api/v1/auth/login", json={
                "username_or_email": uname,
                "password": "ValidPassword123!",
            })
            print(f"Login status: {login.status_code}")
            token = login.json()["access_token"]
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        
        hostname = socket.gethostname()
        print(f"Current Hostname: {hostname!r}")
        
        # Test Step 1: Challenge
        chal = await ac.post("/api/v1/enrollment/challenge", json={"hostname": hostname}, headers=headers)
        print(f"Step 1 - Challenge status: {chal.status_code}, body: {chal.text}")
        if chal.status_code != 201:
            return
            
        chal_data = chal.json()
        nonce = chal_data["nonce"]
        
        # Test Step 2: Sign
        priv_pem, pub_pem = DeviceIdentityManager.generate_keypair()
        sig_b64 = DeviceIdentityManager.sign_nonce(priv_pem, nonce)
        
        # Test Step 3: Verify with exact body from companion.py
        verify_body = {
            "nonce": nonce,
            "signature": sig_b64,
            "public_key_pem": pub_pem,
            "hostname": hostname,
            "os_info": f"{platform.system()} {platform.release()}",
        }
        v = await ac.post("/api/v1/enrollment/verify", json=verify_body, headers=headers)
        print(f"Step 3 - Verify status: {v.status_code}, body: {v.text}")

        # Now test invalid payloads that could cause 422:
        print("\n--- Testing Edge Cases that Cause HTTP 422 ---")
        
        # Edge case A: Empty body / None
        e1 = await ac.post("/api/v1/enrollment/challenge", content=b"", headers=headers)
        print(f"Challenge with empty body: {e1.status_code}, detail: {e1.text}")
        
        # Edge case B: Verify with missing fields
        e2 = await ac.post("/api/v1/enrollment/verify", json={"nonce": nonce}, headers=headers)
        print(f"Verify with missing fields: {e2.status_code}, detail: {e2.text}")
        
        # Edge case C: What if companion is NOT signed in or token is wrong or empty?
        e3 = await ac.post("/api/v1/enrollment/challenge", json={"hostname": hostname})
        print(f"Challenge with no auth header: {e3.status_code}, detail: {e3.text}")
        
        # Edge case D: What if the endpoint called is /api/v1/devices/enroll or /enrollment?
        e4 = await ac.post("/api/v1/devices/enroll", json={}, headers=headers)
        print(f"/api/v1/devices/enroll: {e4.status_code}, detail: {e4.text}")

if __name__ == "__main__":
    asyncio.run(reproduce())
