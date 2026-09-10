"""
KAVACH — AI-Driven SOAR-XDR Threat Intelligence & Response Platform
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.v1 import auth, threats, incidents, mitre, soar, analytics, alerts, audit, ai_security, threat_intel
from app.websocket.manager import websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"[KAVACH] Backend v{settings.APP_VERSION} starting...")
    print(f"[API] Docs at: http://localhost:8000/docs")
    yield
    # Shutdown
    print("[KAVACH] Backend shutting down...")


app = FastAPI(
    title="KAVACH API",
    description="AI-Driven SOAR-XDR Threat Intelligence & Response Platform",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(threats.router, prefix=f"{settings.API_V1_PREFIX}/threats", tags=["Threats"])
app.include_router(incidents.router, prefix=f"{settings.API_V1_PREFIX}/incidents", tags=["Incidents"])
app.include_router(mitre.router, prefix=f"{settings.API_V1_PREFIX}/mitre", tags=["MITRE ATT&CK"])
app.include_router(soar.router, prefix=f"{settings.API_V1_PREFIX}/soar", tags=["SOAR"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["Analytics"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_PREFIX}/alerts", tags=["Alerts"])
app.include_router(audit.router, prefix=f"{settings.API_V1_PREFIX}/audit", tags=["Audit"])
app.include_router(ai_security.router, prefix=f"{settings.API_V1_PREFIX}/ai-security", tags=["AI Security"])
app.include_router(threat_intel.router, prefix=f"{settings.API_V1_PREFIX}/threat-intel", tags=["Threat Intelligence"])
app.include_router(websocket_router, tags=["WebSocket"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "KAVACH API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "description": "AI-Driven SOAR-XDR Threat Intelligence & Response Platform"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
