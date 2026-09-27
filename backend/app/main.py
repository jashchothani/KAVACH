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
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.events import get_event_bus
from app.core.exceptions import KavachBaseException
from app.core.logging import get_logger, setup_logging, set_correlation_id, get_correlation_id
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

    # 4. Telemetry Collectors Lifecycle (In-Process Auto-Start if enabled)
    if settings.collector.enabled:
        try:
            from app.collectors.registry import create_default_registry
            registry = create_default_registry()
            await registry.start_all()
            app.state.collector_registry = registry
            logger.info("collectors_started", count=len(registry.all_collectors))
        except Exception as exc:
            logger.warning("collectors_autostart_failed", error=str(exc))
            app.state.collector_registry = None
    else:
        app.state.collector_registry = None

    # 5. Start event bus consumers
    await bus.start()

    logger.info("kavach_started", port=settings.backend_port)

    yield

    # Shutdown sequence
    logger.info("kavach_shutting_down")
    if getattr(app.state, "collector_registry", None):
        try:
            await app.state.collector_registry.stop_all()
        except Exception:
            pass
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
        req_id = request.headers.get("X-Request-ID") or get_correlation_id()
        logger.warning("handled_kavach_exception", error_code=exc.error_code, message=exc.message, request_id=req_id)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(request: Request, exc: RequestValidationError):
        req_id = request.headers.get("X-Request-ID") or get_correlation_id()
        logger.warning("request_validation_failed", path=str(request.url), errors=str(exc.errors()), request_id=req_id)
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request parameters",
                    "details": exc.errors(),
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(ResponseValidationError)
    async def response_validation_handler(request: Request, exc: ResponseValidationError):
        req_id = request.headers.get("X-Request-ID") or get_correlation_id()
        logger.error("response_validation_failed", path=str(request.url), errors=str(exc.errors()), request_id=req_id)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "RESPONSE_VALIDATION_ERROR",
                    "message": "Internal response schema validation error",
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = request.headers.get("X-Request-ID") or get_correlation_id()
        if exc.status_code >= 500:
            logger.error("http_server_error", status_code=exc.status_code, detail=str(exc.detail), request_id=req_id)
        else:
            logger.info("http_client_error", status_code=exc.status_code, detail=str(exc.detail), request_id=req_id)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": str(exc.detail),
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        req_id = request.headers.get("X-Request-ID") or get_correlation_id()
        logger.error("database_error", error=str(exc), request_id=req_id)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Database transaction error occurred",
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        req_id = request.headers.get("X-Request-ID") or get_correlation_id()
        logger.error("unhandled_internal_error", error=str(exc), path=str(request.url), request_id=req_id)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "request_id": req_id,
                },
            },
        )

    # Include Versioned API Routes
    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    # Serve React Frontend (Single Unified Deployment)
    import os
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
    if os.path.isdir(frontend_dist):
        app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_react_app(full_path: str):
            if full_path.startswith("api/"):
                raise StarletteHTTPException(status_code=404, detail="API route not found")
            
            target_path = os.path.join(frontend_dist, full_path)
            if os.path.isfile(target_path):
                return FileResponse(target_path)
            return FileResponse(os.path.join(frontend_dist, "index.html"))
    else:
        @app.get("/", tags=["System"])
        async def root_status():
            return {
                "product": "KAVACH",
                "version": settings.app_version,
                "status": "operational",
                "frontend": "Not built. Run 'npm run build' in frontend directory.",
            }

    return app


# Module-level ASGI instance
app = create_app()
