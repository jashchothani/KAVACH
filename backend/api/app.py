"""
KAVACH FastAPI Application Factory.

Creates the FastAPI app with:
- Lifespan events (startup/shutdown)
- CORS, rate limiting, JWT middleware
- Exception handlers
- Versioned API routing
- OpenAPI documentation
"""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import get_settings
from core.events import get_event_bus
from core.exceptions import KavachBaseException
from core.logging import get_logger, setup_logging, set_correlation_id
from core.security import decode_access_token

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown."""
    setup_logging()
    logger.info("kavach_starting")
    settings = get_settings()

    # Initialize database
    from database.engine import init_database
    await init_database()

    # Start event bus
    bus = get_event_bus()

    # Start pipeline
    from pipeline.pipeline_manager import PipelineManager
    pipeline = PipelineManager()
    await pipeline.start()
    app.state.pipeline = pipeline

    # Keep the web/API process light when collectors run as a separate service.
    collector_registry = None
    if settings.collector.enabled:
        from collectors.registry import create_default_registry
        collector_registry = create_default_registry()
    app.state.collector_registry = collector_registry

    # Start event bus consumer loops
    await bus.start()

    if collector_registry:
        await collector_registry.start_all()

    logger.info("kavach_started", port=settings.api.port)

    yield

    # Shutdown
    logger.info("kavach_shutting_down")
    if collector_registry:
        await collector_registry.stop_all()
    await bus.stop()
    from database.engine import close_database
    await close_database()
    logger.info("kavach_shutdown_complete")


# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="KAVACH — AI-Driven SOAR-XDR Platform",
        description=(
            "Production-grade Security Orchestration, Automation, and Response (SOAR) "
            "with Extended Detection and Response (XDR) capabilities. "
            "Real-time threat detection, MITRE ATT&CK mapping, AI-powered analysis, "
            "and automated incident response."
        ),
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # --- CORS ---
    cors_origins = settings.api.cors_origin_list
    allow_creds = True
    if "*" in cors_origins:
        allow_creds = False

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=allow_creds,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Rate Limiter State ---
    rate_limit_store: defaultdict[str, list[float]] = defaultdict(list)

    # --- Middleware ---
    @app.middleware("http")
    async def auth_and_rate_limit_middleware(request: Request, call_next: Any) -> Response:
        """JWT authentication + rate limiting middleware."""
        # Set correlation ID
        set_correlation_id()

        # Rate limiting
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        rate_limit_store[client_ip] = [
            t for t in rate_limit_store[client_ip] if now - t < 60
        ]
        if len(rate_limit_store[client_ip]) >= settings.api.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={"error_code": "RATE_LIMIT", "message": "Too many requests"},
            )
        rate_limit_store[client_ip].append(now)

        # Skip auth for public endpoints
        public_paths = {
            "/docs", "/redoc", "/openapi.json",
            "/api/v1/auth/login", "/api/v1/auth/register",
            "/api/v1/auth/request-otp", "/api/v1/auth/verify-otp",
            "/api/v1/auth/request-magic-link", "/api/v1/auth/verify-magic-link",
            "/api/v1/auth/verify-email", "/api/v1/auth/2fa/verify",
            "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password",
            "/api/v1/system/health", "/",
        }
        if (request.url.path in public_paths
                or request.url.path.startswith("/docs")
                or request.url.path.startswith("/static")
                or request.url.path.startswith("/reports")):
            response = await call_next(request)
            return response

        # JWT authentication
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = decode_access_token(token)
                request.state.user = payload
            except Exception:
                # Allow unauthenticated access to some endpoints
                request.state.user = None
        else:
            request.state.user = None

        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response

    # --- Exception Handlers ---
    @app.exception_handler(KavachBaseException)
    async def kavach_exception_handler(request: Request, exc: KavachBaseException) -> JSONResponse:
        logger.error("api_error", error_code=exc.error_code, message=exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_error")
        return JSONResponse(
            status_code=500,
            content={"error_code": "INTERNAL_ERROR", "message": "An internal error occurred"},
        )

    # --- Mount Static Frontend Web UI ---
    import os
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
    if os.path.isdir(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")

        # Mount Reports directory
        reports_dir = str(settings.paths.reports_dir)
        os.makedirs(reports_dir, exist_ok=True)
        app.mount("/reports", StaticFiles(directory=reports_dir), name="reports")

        @app.get("/", tags=["Root"])
        async def serve_web_ui() -> FileResponse:
            """Serve the Web UI dashboard."""
            return FileResponse(os.path.join(static_dir, "index.html"))
    else:
        @app.get("/", tags=["Root"])
        async def root() -> dict[str, str]:
            return {
                "name": "KAVACH SOAR-XDR Platform",
                "version": settings.app_version,
                "status": "operational",
            }

    # --- Register API v1 routes ---
    from api.v1.router import api_v1_router
    app.include_router(api_v1_router, prefix="/api/v1")

    return app
