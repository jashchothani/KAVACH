"""
KAVACH Telemetry Ingestion API & Cloud Broker Gateway.

Phase 2: Cloud Ingestion Gateway, Host Fleet Management, and Pluggable Broker.
Features:
- Host verification (`X-Host-Token`) and token generation
- Dynamic endpoint auto-registration, spec profiling, and heartbeat tracking
- Transparent gzip decompression for batched edge payloads
- Sliding window rate limiting and DDoS backpressure protection
- Decoupled priority dispatch into the Pluggable Message Broker (Redis Streams / Memory Priority Broker)
- Fleet health monitoring and broker queue inspection
"""

from __future__ import annotations

import gzip
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.broker import get_message_broker
from app.core.config import get_settings
from app.core.constants import Topic
from app.core.events import get_event_bus
from app.core.logging import get_logger
from app.database.engine import get_session
from app.database.models import Device
from app.database.repositories import DeviceRepository

logger = get_logger("telemetry_ingest")
router = APIRouter()

# In-memory metrics & rate limiter tracking
_INGEST_METRICS = {
    "total_events_ingested": 0,
    "total_batches_received": 0,
    "last_batch_timestamp": 0.0,
    "hosts_seen": set(),
}

_HOST_RATE_LIMITER: Dict[str, List[float]] = {}
MAX_BATCHES_PER_MINUTE = 600

# Enrollment tokens cache (in-memory with default secret)
_VALID_TOKENS = {
    "kavach_agent_default_secret": {"label": "Default Agent Token", "created_at": time.time(), "active": True}
}


class TelemetryPayload(BaseModel):
    events: List[dict[str, Any]] = Field(default_factory=list)
    host_id: str | None = None
    hostname: str | None = None
    os: str | None = None
    os_version: str | None = None
    architecture: str | None = None
    ip_address: str | None = None
    timestamp: float | None = None
    batch_count: int | None = None


class TokenCreateRequest(BaseModel):
    label: str = Field(default="Standard Host Token", description="Human-readable label for endpoint or fleet")
    expires_in_days: int = Field(default=365, description="Token validity in days")


def _check_rate_limit(client_id: str) -> bool:
    """Sliding-window rate limiter preventing endpoint spam."""
    now = time.time()
    window_start = now - 60.0
    timestamps = _HOST_RATE_LIMITER.get(client_id, [])
    # Keep only timestamps within last 60 seconds
    valid_stamps = [t for t in timestamps if t > window_start]
    if len(valid_stamps) >= MAX_BATCHES_PER_MINUTE:
        return False
    valid_stamps.append(now)
    _HOST_RATE_LIMITER[client_id] = valid_stamps
    return True


async def _register_host_and_publish(
    events: list[dict[str, Any]],
    host_id: str | None,
    hostname: str | None,
    ip_address: str | None,
    os_info: str | None,
    os_version: str | None,
) -> None:
    """Update device inventory and publish events through the message broker."""
    bus = get_event_bus()
    broker = get_message_broker()

    # 1. Update Device Inventory in Database
    if hostname:
        try:
            async with get_session() as session:
                dev_repo = DeviceRepository(session)
                await dev_repo.upsert(
                    hostname=hostname,
                    ip_address=ip_address or "127.0.0.1",
                    os_name=os_info,
                    os_version=os_version,
                    metadata_json={"host_id": host_id, "last_ingest": time.time()},
                    status="active",
                )
                await session.commit()
        except Exception as exc:
            logger.debug("device_upsert_ignored", error=str(exc))

    # 2. Dispatch events into priority streams
    for event in events:
        try:
            if host_id and not event.get("host_id"):
                event["host_id"] = host_id
            if hostname and not event.get("hostname"):
                event["hostname"] = hostname

            tier = str(event.get("edge_tier") or event.get("severity") or "low").lower()

            # Publish to decoupled broker
            await broker.publish_tier(tier, event)

            # Also publish to legacy event bus topic for backwards compatibility
            await bus.publish(Topic.RAW_EVENTS, event)
        except Exception as exc:
            logger.error("telemetry_ingest_publish_error", error=str(exc))


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_telemetry(
    request: Request,
    background_tasks: BackgroundTasks,
    x_host_token: str | None = Header(None, alias="X-Host-Token"),
    x_host_id: str | None = Header(None, alias="X-Host-ID"),
    x_hostname: str | None = Header(None, alias="X-Hostname"),
):
    """
    Ingest a batch of telemetry events from external standalone edge collectors.
    Supports JSON body and gzip-compressed JSON payload.
    """
    # 1. Verify Host Token
    settings = get_settings()
    configured_token = getattr(settings, "host_agent_token", "kavach_agent_default_secret")
    provided_token = x_host_token or ""

    is_valid = (
        provided_token == configured_token
        or provided_token in _VALID_TOKENS
        or not configured_token
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Host-Token header",
        )

    # 2. Rate Limiting Protection
    client_key = x_host_id or (request.client.host if request.client else "unknown_client")
    if not _check_rate_limit(client_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Ingestion rate limit exceeded for this host (max 600 batches/min)",
        )

    # 3. Handle Gzip or Raw JSON decompression
    content_encoding = request.headers.get("content-encoding", "").lower()
    raw_body = await request.body()

    if "gzip" in content_encoding:
        try:
            decompressed = gzip.decompress(raw_body)
            data = json.loads(decompressed.decode("utf-8"))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decompress gzip telemetry payload: {exc}",
            )
    else:
        try:
            data = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON payload: {exc}",
            )

    # 4. Extract payload and host identifiers
    events = data.get("events") or []
    if not isinstance(events, list) or not events:
        return {"status": "ok", "ingested": 0, "message": "No events in payload"}

    host_id = data.get("host_id") or x_host_id
    hostname = data.get("hostname") or x_hostname or (request.client.host if request.client else "unknown-host")
    ip_addr = data.get("ip_address") or (request.client.host if request.client else "127.0.0.1")
    os_info = data.get("os")
    os_version = data.get("os_version")

    # 5. Update Ingestion Telemetry Metrics
    _INGEST_METRICS["total_events_ingested"] += len(events)
    _INGEST_METRICS["total_batches_received"] += 1
    _INGEST_METRICS["last_batch_timestamp"] = time.time()
    if hostname:
        _INGEST_METRICS["hosts_seen"].add(hostname)

    # 6. Dispatch async processing
    background_tasks.add_task(
        _register_host_and_publish,
        events=events,
        host_id=host_id,
        hostname=hostname,
        ip_address=ip_addr,
        os_info=os_info,
        os_version=os_version,
    )

    return {
        "status": "accepted",
        "ingested": len(events),
        "host_id": host_id,
        "hostname": hostname,
    }


@router.get("/stats")
async def get_telemetry_stats():
    """Return live ingestion gateway throughput statistics."""
    broker_metrics = get_message_broker().get_metrics()
    return {
        "total_events_ingested": _INGEST_METRICS["total_events_ingested"],
        "total_batches_received": _INGEST_METRICS["total_batches_received"],
        "last_batch_timestamp": _INGEST_METRICS["last_batch_timestamp"],
        "active_hosts_count": len(_INGEST_METRICS["hosts_seen"]),
        "hosts": list(_INGEST_METRICS["hosts_seen"]),
        "broker": broker_metrics,
    }


@router.get("/hosts")
async def get_fleet_hosts():
    """Return fleet inventory of all connected endpoint agents with real-time health status."""
    now = datetime.now(timezone.utc)
    results = []

    try:
        async with get_session() as session:
            stmt = select(Device).order_by(Device.last_seen.desc())
            res = await session.execute(stmt)
            devices = res.scalars().all()

            for dev in devices:
                # Calculate online status based on last check-in
                if dev.last_seen:
                    dev_last_seen = dev.last_seen if dev.last_seen.tzinfo else dev.last_seen.replace(tzinfo=timezone.utc)
                    diff_sec = max(0.0, (now - dev_last_seen).total_seconds())
                else:
                    diff_sec = 999999.0

                if diff_sec <= 60:
                    health_status = "ONLINE"
                elif diff_sec <= 300:
                    health_status = "LAGGING"
                else:
                    health_status = "OFFLINE"

                meta = dev.metadata_json or {}
                results.append({
                    "id": dev.id,
                    "hostname": dev.hostname,
                    "host_id": meta.get("host_id") or dev.hostname,
                    "ip_address": dev.ip_address,
                    "os": dev.os_name or "Unknown OS",
                    "os_version": dev.os_version,
                    "risk_score": dev.risk_score,
                    "health_status": health_status,
                    "last_seen": dev.last_seen.isoformat() if dev.last_seen else None,
                    "last_seen_seconds_ago": round(diff_sec, 1),
                })
    except Exception as exc:
        logger.error("get_fleet_hosts_error", error=str(exc))

    return {
        "total_hosts": len(results),
        "online_count": sum(1 for h in results if h["health_status"] == "ONLINE"),
        "hosts": results,
    }


@router.post("/tokens", status_code=status.HTTP_201_CREATED)
async def generate_host_token(req: TokenCreateRequest):
    """Generate a secure enrollment token for onboarding a new endpoint agent."""
    new_token = f"kavach_live_{secrets.token_hex(16)}"
    _VALID_TOKENS[new_token] = {
        "label": req.label,
        "created_at": time.time(),
        "expires_at": time.time() + (req.expires_in_days * 86400),
        "active": True,
    }
    logger.info("new_host_token_generated", label=req.label)
    return {
        "token": new_token,
        "label": req.label,
        "expires_in_days": req.expires_in_days,
        "instructions": f"Run agent with: python collector_agent.py --server <CLOUD_URL> --token {new_token}",
    }


@router.get("/broker/metrics")
async def get_broker_metrics():
    """Return live message broker queue depths, worker status, and throughput."""
    return get_message_broker().get_metrics()
