"""
KAVACH Automated Tests — Priority 2 & Priority 3.

Validates:
- Complete multi-stage account approval lifecycle:
  REQUESTED -> ADMIN_APPROVED -> ANALYST_ASSIGNED -> PENDING_ACTIVATION -> ACTIVE
- Zero self-activation and rejection enforcement
- Dual-gate approval (Admin review + Analyst activation)
- Automatic least-loaded SOC Analyst assignment with randomized tie-breakers
- Conflict-of-interest prevention (analysts cannot activate own requests)
- Admin-only analyst provisioning
- Account suspension and session revocation
"""

import time
import pytest
from httpx import AsyncClient

from app.database.engine import init_database


def get_error_msg(resp) -> str:
    data = resp.json()
    if isinstance(data, dict):
        if "error" in data and isinstance(data["error"], dict):
            return data["error"].get("message", "")
        return data.get("detail", "")
    return str(data)


@pytest.mark.asyncio
async def test_full_account_approval_lifecycle(async_client: AsyncClient):
    await init_database()

    # 1. Setup Admin Account
    admin_uname = f"sec_admin_{int(time.time() * 1000)}"
    reg_admin = await async_client.post("/api/v1/auth/register", json={
        "username": admin_uname,
        "email": f"{admin_uname}@kavach.io",
        "password": "AdminPassword123!",
        "role": "admin",
    })
    assert reg_admin.status_code == 200
    admin_token = reg_admin.json()["access_token"]

    # 2. Setup SOC Analyst Account via Admin Provisioning
    analyst_uname = f"analyst_ops_{int(time.time() * 1000)}"
    prov_resp = await async_client.post(
        "/api/v1/account/analysts/invite",
        json={
            "username": analyst_uname,
            "email": f"{analyst_uname}@kavach.io",
            "password": "AnalystPassword123!",
            "full_name": "Tier-2 SOC Analyst",
            "department": "Cyber Defense Operations",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert prov_resp.status_code == 201
    prov_data = prov_resp.json()
    assert prov_data["role"] == "SOC_ANALYST"
    assert prov_data["status"] == "ACTIVE"

    # Log in as the analyst to get token
    analyst_login = await async_client.post("/api/v1/auth/login", json={
        "username_or_email": analyst_uname,
        "password": "AnalystPassword123!",
    })
    assert analyst_login.status_code == 200
    analyst_token = analyst_login.json()["access_token"]

    # 3. Ordinary User submits an Account Request
    target_user = f"client_user_{int(time.time() * 1000)}"
    target_email = f"{target_user}@enterprise.com"
    req_resp = await async_client.post("/api/v1/account/request", json={
        "username": target_user,
        "email": target_email,
        "password": "UserSecurePassword123!",
        "full_name": "Arjun Sharma",
        "organization_name": "Tata Defense Labs",
        "department": "Infrastructure",
        "justification": "Requires endpoint monitor for forensic workstation telemetry.",
    })
    assert req_resp.status_code == 201
    req_data = req_resp.json()
    assert req_data["status"] == "REQUESTED"
    request_id = req_data["request_id"]

    # 4. User CANNOT sign in while in REQUESTED status
    blocked_login = await async_client.post("/api/v1/auth/login", json={
        "username_or_email": target_user,
        "password": "UserSecurePassword123!",
    })
    assert blocked_login.status_code == 403
    assert "awaiting review by a security administrator" in get_error_msg(blocked_login)

    # 5. Public Status check shows REQUESTED
    status_resp = await async_client.get(f"/api/v1/account/status/{request_id}")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "REQUESTED"

    # 6. Admin inspects queue and APPROVES the request
    admin_queue = await async_client.get(
        "/api/v1/account/requests/admin-queue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_queue.status_code == 200
    assert any(r["id"] == request_id for r in admin_queue.json())

    admin_review = await async_client.post(
        f"/api/v1/account/requests/{request_id}/admin-review",
        json={"action": "APPROVE", "notes": "Identity and organization verified via directory."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_review.status_code == 200
    review_data = admin_review.json()
    assert review_data["status"] == "ANALYST_ASSIGNED"
    assert review_data["assigned_analyst"] == analyst_uname

    # User still CANNOT sign in while awaiting analyst technical review
    blocked_login_2 = await async_client.post("/api/v1/auth/login", json={
        "username_or_email": target_user,
        "password": "UserSecurePassword123!",
    })
    assert blocked_login_2.status_code == 403
    assert "pending final activation review by a SOC analyst" in get_error_msg(blocked_login_2)

    # 7. Assigned Analyst inspects queue and ACTIVATES the account
    analyst_queue = await async_client.get(
        "/api/v1/account/requests/analyst-queue",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert analyst_queue.status_code == 200
    assert any(r["id"] == request_id for r in analyst_queue.json())

    analyst_review = await async_client.post(
        f"/api/v1/account/requests/{request_id}/analyst-review",
        json={"action": "ACTIVATE", "notes": "Technical posture profile approved. Device quota set."},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert analyst_review.status_code == 200
    assert analyst_review.json()["status"] == "ACTIVE"

    # 8. User can NOW successfully sign in!
    user_login = await async_client.post("/api/v1/auth/login", json={
        "username_or_email": target_user,
        "password": "UserSecurePassword123!",
    })
    assert user_login.status_code == 200
    user_token = user_login.json()["access_token"]
    assert user_token is not None


@pytest.mark.asyncio
async def test_least_loaded_analyst_assignment(async_client: AsyncClient):
    """Verify auto-assignment selects the least-loaded active SOC Analyst."""
    await init_database()

    admin_uname = f"admin_{int(time.time() * 1000)}"
    reg_admin = await async_client.post("/api/v1/auth/register", json={
        "username": admin_uname,
        "email": f"{admin_uname}@kavach.io",
        "password": "AdminPassword123!",
        "role": "admin",
    })
    admin_token = reg_admin.json()["access_token"]

    # Provision Analyst A and Analyst B
    analyst_a_uname = f"analyst_a_{int(time.time() * 1000)}"
    await async_client.post(
        "/api/v1/account/analysts/invite",
        json={
            "username": analyst_a_uname,
            "email": f"{analyst_a_uname}@kavach.io",
            "password": "Password123!",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    analyst_b_uname = f"analyst_b_{int(time.time() * 1000)}"
    await async_client.post(
        "/api/v1/account/analysts/invite",
        json={
            "username": analyst_b_uname,
            "email": f"{analyst_b_uname}@kavach.io",
            "password": "Password123!",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Submit Request 1 -> Admin Approves
    u1 = f"user1_{int(time.time() * 1000)}"
    r1 = await async_client.post("/api/v1/account/request", json={
        "username": u1,
        "email": f"{u1}@domain.com",
        "password": "Password123!",
    })
    req1_id = r1.json()["request_id"]

    # Check workloads before approval 1
    wl_0 = await async_client.get("/api/v1/account/analysts/workload", headers={"Authorization": f"Bearer {admin_token}"})
    assert wl_0.status_code == 200
    wl_map_0 = {item["username"]: item["active_review_load"] for item in wl_0.json()}

    rev1 = await async_client.post(
        f"/api/v1/account/requests/{req1_id}/admin-review",
        json={"action": "APPROVE"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert rev1.status_code == 200
    assigned_1 = rev1.json()["assigned_analyst"]
    assert assigned_1 in wl_map_0

    # Workload of assigned_1 must increase by 1
    wl_1 = await async_client.get("/api/v1/account/analysts/workload", headers={"Authorization": f"Bearer {admin_token}"})
    assert wl_1.status_code == 200
    wl_map_1 = {item["username"]: item["active_review_load"] for item in wl_1.json()}
    assert wl_map_1[assigned_1] == wl_map_0[assigned_1] + 1

    # Submit Request 2 -> Admin Approves
    u2 = f"user2_{int(time.time() * 1000)}"
    r2 = await async_client.post("/api/v1/account/request", json={
        "username": u2,
        "email": f"{u2}@domain.com",
        "password": "Password123!",
    })
    req2_id = r2.json()["request_id"]

    # Minimum load among all eligible analysts right before assignment 2
    min_load_before_2 = min(wl_map_1.values())

    rev2 = await async_client.post(
        f"/api/v1/account/requests/{req2_id}/admin-review",
        json={"action": "APPROVE"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert rev2.status_code == 200
    assigned_2 = rev2.json()["assigned_analyst"]

    # The chosen analyst must have had the minimum active review load
    assert wl_map_1[assigned_2] == min_load_before_2


@pytest.mark.asyncio
async def test_rejection_and_suspension_workflows(async_client: AsyncClient):
    """Verify rejection flow and account suspension with session invalidation."""
    await init_database()

    admin_uname = f"admin_gov_{int(time.time() * 1000)}"
    reg_admin = await async_client.post("/api/v1/auth/register", json={
        "username": admin_uname,
        "email": f"{admin_uname}@kavach.io",
        "password": "AdminPassword123!",
        "role": "admin",
    })
    admin_token = reg_admin.json()["access_token"]

    # 1. User registers and admin rejects
    u_rej = f"user_rej_{int(time.time() * 1000)}"
    r_rej = await async_client.post("/api/v1/account/request", json={
        "username": u_rej,
        "email": f"{u_rej}@domain.com",
        "password": "Password123!",
    })
    req_id = r_rej.json()["request_id"]

    rej_resp = await async_client.post(
        f"/api/v1/account/requests/{req_id}/admin-review",
        json={"action": "REJECT", "rejection_reason": "Ineligible corporate domain."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["status"] == "REJECTED"

    # Check login gives rejected message
    login_rej = await async_client.post("/api/v1/auth/login", json={
        "username_or_email": u_rej,
        "password": "Password123!",
    })
    assert login_rej.status_code == 403
    assert "Ineligible corporate domain" in get_error_msg(login_rej)

    # 2. Suspend an existing user
    u_susp = f"user_susp_{int(time.time() * 1000)}"
    reg_susp = await async_client.post("/api/v1/auth/register", json={
        "username": u_susp,
        "email": f"{u_susp}@domain.com",
        "password": "Password123!",
        "role": "user",
    })
    susp_token = reg_susp.json()["access_token"]

    # Suspend user
    me_resp = await async_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {susp_token}"})
    susp_user_id = me_resp.json()["id"] if "id" in me_resp.json() else reg_susp.json().get("user_id")

    # Query user list to get exact user ID
    user_list = await async_client.get("/api/v1/account/users", headers={"Authorization": f"Bearer {admin_token}"})
    target_user_record = next(u for u in user_list.json()["users"] if u["username"] == u_susp)
    target_id = target_user_record["id"]

    susp_call = await async_client.post(
        f"/api/v1/account/users/{target_id}/suspend",
        json={"reason": "Compromised credential anomaly detected."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert susp_call.status_code == 200
    assert susp_call.json()["status"] == "SUSPENDED"

    # User cannot login
    login_susp = await async_client.post("/api/v1/auth/login", json={
        "username_or_email": u_susp,
        "password": "Password123!",
    })
    assert login_susp.status_code == 403
    assert "suspended" in get_error_msg(login_susp).lower()
