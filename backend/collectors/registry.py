"""
KAVACH Collector Registry.

Auto-discovers, registers, and manages the lifecycle of all telemetry collectors.
Provides a single interface for starting/stopping all collectors and querying health.
"""

from __future__ import annotations

import asyncio
from typing import Any

from collectors.base import BaseCollector
from core.constants import CollectorName, CollectorStatus
from core.logging import get_logger

logger = get_logger(__name__)


class CollectorRegistry:
    """Manages all collector instances."""

    def __init__(self) -> None:
        self._collectors: dict[str, BaseCollector] = {}

    def register(self, collector: BaseCollector) -> None:
        """Register a collector instance."""
        name = collector.name.value
        if name in self._collectors:
            logger.warning("collector_already_registered", collector=name)
            return
        self._collectors[name] = collector
        logger.info("collector_registered", collector=name)

    def get(self, name: str | CollectorName) -> BaseCollector | None:
        key = name.value if isinstance(name, CollectorName) else name
        return self._collectors.get(key)

    @property
    def all_collectors(self) -> dict[str, BaseCollector]:
        return dict(self._collectors)

    async def start_all(self) -> None:
        """Start all registered collectors concurrently."""
        logger.info("starting_all_collectors", count=len(self._collectors))
        tasks = [c.start() for c in self._collectors.values()]
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("all_collectors_started")

    async def stop_all(self) -> None:
        """Stop all running collectors."""
        logger.info("stopping_all_collectors")
        tasks = [c.stop() for c in self._collectors.values()]
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("all_collectors_stopped")

    def health_report(self) -> list[dict[str, Any]]:
        """Return health status of all collectors."""
        return [c.health for c in self._collectors.values()]

    def get_status_summary(self) -> dict[str, int]:
        """Count collectors by status."""
        summary: dict[str, int] = {}
        for c in self._collectors.values():
            status = c.status.value
            summary[status] = summary.get(status, 0) + 1
        return summary


def create_default_registry() -> CollectorRegistry:
    """
    Create a registry with all built-in collectors.

    Import here to avoid circular imports and allow each collector
    to be independently testable.
    """
    from collectors.process_collector import ProcessCollector
    from collectors.network_collector import NetworkCollector
    from collectors.file_monitor import FileMonitorCollector
    from collectors.login_collector import LoginCollector
    from collectors.powershell_collector import PowerShellCollector
    from collectors.supplementary_collectors import (
        ServiceCollector,
        USBCollector,
        DefenderCollector,
        DNSCollector,
        RegistryCollector,
        ScheduledTaskCollector,
        SoftwareCollector,
        SystemInfoCollector,
        CanaryCollector,
    )
    from collectors.sysmon_collector import SysmonCollector
    from collectors.windows_eventlog_collector import WindowsEventLogCollector

    registry = CollectorRegistry()

    collectors: list[BaseCollector] = [
        ProcessCollector(),
        NetworkCollector(),
        FileMonitorCollector(),
        LoginCollector(),
        PowerShellCollector(),
        ServiceCollector(),
        USBCollector(),
        DefenderCollector(),
        DNSCollector(),
        RegistryCollector(),
        ScheduledTaskCollector(),
        SoftwareCollector(),
        SystemInfoCollector(),
        SysmonCollector(),
        CanaryCollector(),
        WindowsEventLogCollector(),
    ]

    for collector in collectors:
        registry.register(collector)

    return registry
