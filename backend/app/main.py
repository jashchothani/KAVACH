"""
KAVACH FastAPI Application Main.

Production application factory with:
- Lifespan startup/shutdown orchestrator
- CORS, correlation ID, rate limiting, and security middleware
- Router registration for all v1 security APIs
- WebSocket live event dispatch
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.events import get_event_bus
from app.core.exceptions import KavachBaseException
from app.core.logging import get_logger, setup_logging, set_correlation_id
from app.database.engine import init_database, close_database
from app.pipeline.pipeline_manager import CentralPipelineManager

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Lifespan Lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown orchestration."""
    setup_logging()
    settings = get_settings()
    settings.paths.ensure_directories()
    logger.info("kavach_starting", version=settings.app_version)

    # 1. Initialize database tables
    await init_database()

    # 2. Start event bus
    bus = get_event_bus()

    # 3. Start central telemetry pipeline
    pipeline = CentralPipelineManager()
    await pipeline.start()
    app.state.pipeline = pipeline

    # 4. Initialize collectors if enabled
    collector_registry = None
    if settings.collector.enabled:
        from app.collectors.registry import create_default_registry
        collector_registry = create_default_registry()
        await collector_registry.start_all()
    app.state.collector_registry = collector_registry

    # 5. Start event bus consumers
    await bus.start()

    logger.info("kavach_started", port=settings.backend_port)

    yield

    # Shutdown sequence
    logger.info("kavach_shutting_down")
    if collector_registry:
        await collector_registry.stop_all()
    await pipeline.stop()
    await bus.stop()
    await close_database()
    logger.info("kavach_shutdown_complete")


# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    """Create and configure the production FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="KAVACH — AI-Driven SOAR-XDR Platform",
        description=(
            "Production-grade Security Orchestration, Automation, and Response (SOAR) "
            "with Extended Detection and Response (XDR) capabilities. "
            "Real-time threat telemetry, Isolation Forest ML, deterministic rules, "
            "and Raksha AI cybersecurity assistant."
        ),
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request ID and Timing Middleware
    @app.middleware("http")
    async def request_middleware(request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or set_correlation_id()
        start_time = time.perf_counter()

        response: Response = await call_next(request)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Process-Time-Ms"] = str(duration_ms)
        return response

    # Exception Handlers
    @app.exception_handler(KavachBaseException)
    async def kavach_exception_handler(request: Request, exc: KavachBaseException):
        logger.warning("handled_exception", error_code=exc.error_code, message=exc.message)
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict())

    # Include Versioned API Routes
    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    # Root redirect / status
    @app.get("/", tags=["System"])
    async def root_status():
        return {
            "product": "KAVACH",
            "version": settings.app_version,
            "status": "operational",
            "docs": f"http://{settings.backend_host}:{settings.backend_port}/docs",
            "dashboard": f"http://{settings.frontend_host}:{settings.frontend_port}",
            "assistant": "Raksha AI",
        }

    return app


# Module-level ASGI instance
app = create_app()
