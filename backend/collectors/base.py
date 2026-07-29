"""
KAVACH Collector Base Class.

Every collector inherits from BaseCollector, providing:
- Consistent lifecycle (start / stop / collect)
- Structured JSON output schema
- Heartbeat / health monitoring
- Simulation mode fallback for non-Windows dev
- Error isolation per collector
"""

from __future__ import annotations

import abc
import asyncio
import platform
import socket
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from core.config import get_settings
from core.constants import CollectorName, CollectorStatus, EventType, Severity
from core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Canonical event schema — every collector MUST output this
# ---------------------------------------------------------------------------

class TelemetryEvent(BaseModel):
    """
    Standardised telemetry event structure.

    Every field is typed and documented. This is the contract between
    collectors and the processing pipeline.
    """
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    collector: str = Field(..., description="Collector that produced this event")
    hostname: str = Field(
        default_factory=lambda: socket.gethostname(),
        description="Source hostname",
    )
    device_id: str = Field(
        default_factory=lambda: socket.gethostname(),
        description="Unique device identifier",
    )
    username: str | None = Field(default=None, description="Associated user")
    event_type: str = Field(..., description="Canonical event type")
    severity: str = Field(default=Severity.INFO.value, description="Event severity")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Risk score 0-100")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0, description="Confidence 0-1")
    mitre: dict[str, Any] = Field(default_factory=dict, description="MITRE ATT&CK mapping")
    ioc: dict[str, Any] = Field(default_factory=dict, description="IOC data if applicable")
    status: str = Field(default="raw", description="Processing status")
    raw_reference: str | None = Field(default=None, description="Path to raw log file")
    processed: bool = Field(default=False, description="Whether fully processed")
    tags: list[str] = Field(default_factory=list, description="Classification tags")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    simulation: bool = Field(default=False, description="Whether this is simulated data")

    model_config = {"extra": "allow"}


# ---------------------------------------------------------------------------
# Base collector
# ---------------------------------------------------------------------------

class BaseCollector(abc.ABC):
    """
    Abstract base class for all telemetry collectors.

    Subclasses MUST implement:
    - ``_collect_real()`` — real system telemetry collection
    - ``_collect_simulated()`` — simulated data for non-Windows dev

    Subclasses SHOULD override:
    - ``name`` — unique collector identifier
    - ``description`` — human-readable description
    """

    name: CollectorName = CollectorName.SYSTEM_INFO
    description: str = "Base collector"

    def __init__(self) -> None:
        self._status = CollectorStatus.STOPPED
        self._task: asyncio.Task | None = None
        self._event_count: int = 0
        self._error_count: int = 0
        self._last_collection: datetime | None = None
        self._settings = get_settings()
        self._is_windows = platform.system().lower().startswith("win")
        self._simulation_mode = self._settings.collector.simulation_mode

    # --- Lifecycle ---

    async def start(self) -> None:
        """Start periodic collection."""
        if self._status == CollectorStatus.RUNNING:
            return
        self._status = CollectorStatus.RUNNING
        interval = self._settings.collector.collection_interval
        self._task = asyncio.create_task(
            self._collection_loop(interval),
            name=f"collector:{self.name.value}",
        )
        logger.info(
            "collector_started",
            collector=self.name.value,
            interval=interval,
            simulation=self._simulation_mode,
        )

    async def stop(self) -> None:
        """Stop periodic collection."""
        self._status = CollectorStatus.STOPPED
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        logger.info("collector_stopped", collector=self.name.value)

    @property
    def status(self) -> CollectorStatus:
        return self._status

    @property
    def health(self) -> dict[str, Any]:
        """Return health/stats for this collector."""
        return {
            "name": self.name.value,
            "status": self._status.value,
            "description": self.description,
            "events_collected": self._event_count,
            "errors": self._error_count,
            "last_collection": (
                self._last_collection.isoformat() if self._last_collection else None
            ),
            "simulation_mode": self._simulation_mode,
        }

    # --- Collection ---

    async def collect(self) -> list[TelemetryEvent]:
        """
        Collect telemetry events.

        Routes to real or simulated collection based on platform and config.
        """
        try:
            if self._is_windows and not self._simulation_mode:
                events = await self._collect_real()
            else:
                events = await self._collect_simulated()

            self._event_count += len(events)
            self._last_collection = datetime.now(timezone.utc)
            return events

        except Exception as exc:
            self._error_count += 1
            logger.error(
                "collection_error",
                collector=self.name.value,
                error=str(exc),
            )
            return []

    @abc.abstractmethod
    async def _collect_real(self) -> list[TelemetryEvent]:
        """Collect real system telemetry (Windows only)."""
        ...

    @abc.abstractmethod
    async def _collect_simulated(self) -> list[TelemetryEvent]:
        """Generate simulated telemetry for development."""
        ...

    # --- Helpers ---

    def _create_event(self, event_type: str | EventType, **kwargs: Any) -> TelemetryEvent:
        """Factory method for creating events with collector metadata."""
        if isinstance(event_type, EventType):
            event_type = event_type.value
        return TelemetryEvent(
            collector=self.name.value,
            event_type=event_type,
            simulation=self._simulation_mode or not self._is_windows,
            **kwargs,
        )

    async def _collection_loop(self, interval: int) -> None:
        """Internal periodic collection loop."""
        while self._status == CollectorStatus.RUNNING:
            try:
                events = await self.collect()
                if events:
                    from core.events import get_event_bus
                    from core.constants import Topic

                    bus = get_event_bus()
                    for event in events:
                        await bus.publish(Topic.RAW_EVENTS, event.model_dump())
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("collection_loop_error", collector=self.name.value)

            try:
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
