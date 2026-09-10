"""
KAVACH API - Authentication Routes
JWT login, register, refresh, RBAC
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse, RefreshRequest

router = APIRouter()

# Demo users for development (replace with DB queries in production)
DEMO_USERS = {
    "admin@kavach.io": {
        "id": 1, "email": "admin@kavach.io", "username": "admin",
        "full_name": "Kavach Admin", "role": "super_admin", "role_id": 1,
        "password_hash": get_password_hash("admin123"),
        "is_active": True, "mfa_enabled": False, "department": "Security Operations",
        "avatar_url": None, "created_at": "2024-01-01T00:00:00Z"
    },
    "analyst@kavach.io": {
        "id": 2, "email": "analyst@kavach.io", "username": "analyst",
        "full_name": "SOC Analyst", "role": "soc_analyst", "role_id": 2,
        "password_hash": get_password_hash("analyst123"),
        "is_active": True, "mfa_enabled": False, "department": "SOC Team",
        "avatar_url": None, "created_at": "2024-01-01T00:00:00Z"
    },
    "responder@kavach.io": {
        "id": 3, "email": "responder@kavach.io", "username": "responder",
        "full_name": "Incident Responder", "role": "incident_responder", "role_id": 3,
        "password_hash": get_password_hash("responder123"),
        "is_active": True, "mfa_enabled": False, "department": "IR Team",
        "avatar_url": None, "created_at": "2024-01-01T00:00:00Z"
    },
    "manager@kavach.io": {
        "id": 4, "email": "manager@kavach.io", "username": "manager",
        "full_name": "Security Manager", "role": "security_manager", "role_id": 4,
        "password_hash": get_password_hash("manager123"),
        "is_active": True, "mfa_enabled": False, "department": "Management",
        "avatar_url": None, "created_at": "2024-01-01T00:00:00Z"
    },
    "auditor@kavach.io": {
        "id": 5, "email": "auditor@kavach.io", "username": "auditor",
        "full_name": "Security Auditor", "role": "auditor", "role_id": 5,
        "password_hash": get_password_hash("auditor123"),
        "is_active": True, "mfa_enabled": False, "department": "Compliance",
        "avatar_url": None, "created_at": "2024-01-01T00:00:00Z"
    },
}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = DEMO_USERS.get(request.email)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    token_data = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user["full_name"]
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user["full_name"],
            role_id=user["role_id"],
            role_name=user["role"],
            is_active=user["is_active"],
            mfa_enabled=user["mfa_enabled"],
            department=user["department"],
            created_at=datetime.now(timezone.utc)
        )
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest):
    payload = decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    token_data = {
        "sub": payload["sub"],
        "email": payload["email"],
        "role": payload["role"],
        "name": payload["name"]
    }
    
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)
    
    user = DEMO_USERS.get(payload["email"], {})
    
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=UserResponse(
            id=int(payload["sub"]),
            email=payload["email"],
            username=user.get("username", ""),
            full_name=payload["name"],
            role_id=user.get("role_id", 1),
            role_name=payload["role"],
            is_active=True,
            mfa_enabled=False,
            created_at=datetime.now(timezone.utc)
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = DEMO_USERS.get(current_user["email"], {})
    return UserResponse(
        id=int(current_user["sub"]),
        email=current_user["email"],
        username=user.get("username", ""),
        full_name=current_user["name"],
        role_id=user.get("role_id", 1),
        role_name=current_user["role"],
        is_active=True,
        mfa_enabled=user.get("mfa_enabled", False),
        department=user.get("department"),
        created_at=datetime.now(timezone.utc)
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # In production, invalidate the token via Redis blacklist
    return {"message": "Successfully logged out"}
