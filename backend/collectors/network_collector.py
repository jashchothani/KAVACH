"""
KAVACH Network Collector.

Monitors active network connections including:
- TCP/UDP connections, ports, destinations
- Connection frequency analysis
- Outbound/inbound classification
- GeoIP-ready metadata
- Beaconing and port scan detection patterns
"""

from __future__ import annotations

import asyncio
import socket
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from collectors.base import BaseCollector, TelemetryEvent
from core.constants import CollectorName, EventType, Severity
from core.logging import get_logger

logger = get_logger(__name__)

# Well-known ports for context
WELL_KNOWN_PORTS: dict[int, str] = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
    993: "IMAPS", 995: "POP3S", 1433: "MSSQL", 1434: "MSSQL-UDP",
    3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL", 5900: "VNC",
    5985: "WinRM", 5986: "WinRM-HTTPS", 6379: "Redis",
    8080: "HTTP-Alt", 8443: "HTTPS-Alt", 9200: "Elasticsearch",
}

SUSPICIOUS_PORTS: frozenset[int] = frozenset({
    4444, 5555, 6666, 7777, 8888, 9999,  # Common reverse shell ports
    1234, 31337, 12345,  # Known backdoor ports
    4443, 8443,  # Alternative HTTPS (C2)
})


class NetworkCollector(BaseCollector):
    """Monitors TCP/UDP connections, detects suspicious network patterns."""

    name = CollectorName.NETWORK
    description = "Active network connection monitoring with pattern detection"

    def __init__(self) -> None:
        super().__init__()
        self._connection_history: Counter[str] = Counter()
        self._seen_connections: set[tuple[str, int, str, int, str]] = set()

    def _collect_connections_sync(self) -> list[TelemetryEvent]:
        """Synchronous network socket monitor running in worker thread with pre-cached PIDs."""
        import psutil

        events: list[TelemetryEvent] = []

        # Pre-cache PID to Process Name map (adopted from SOC module) to avoid slow lookups inside loop
        pid_name_cache: dict[int, str] = {}
        for proc in psutil.process_iter(["pid", "name"]):
            try:
                pid_name_cache[proc.info["pid"]] = proc.info["name"]
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        try:
            connections = psutil.net_connections(kind="inet")
        except Exception as exc:
            logger.debug("net_connections_read_failed", error=str(exc))
            return []

        current_seen: set[tuple[str, int, str, int, str]] = set()

        for conn in connections:
            try:
                # Filter for active connections: established TCP or UDP with remote endpoints or listening
                if conn.status == "NONE" and not conn.raddr:
                    continue

                local_ip = conn.laddr.ip if conn.laddr else ""
                local_port = conn.laddr.port if conn.laddr else 0
                remote_ip = conn.raddr.ip if conn.raddr else ""
                remote_port = conn.raddr.port if conn.raddr else 0
                protocol = "TCP" if conn.type == socket.SOCK_STREAM else "UDP"
                direction = "outbound" if conn.raddr else "listening"

                local_addr = f"{local_ip}:{local_port}" if local_ip else ""
                remote_addr = f"{remote_ip}:{remote_port}" if remote_ip else ""

                conn_key = (local_ip, local_port, remote_ip, remote_port, protocol)
                current_seen.add(conn_key)

                # Severity / risk assessment
                severity = Severity.INFO
                risk = 0.0
                tags: list[str] = []

                if remote_port in SUSPICIOUS_PORTS:
                    severity = Severity.HIGH
                    risk = 70.0
                    tags.append("suspicious_port")

                if remote_port == 445 and direction == "outbound":
                    severity = Severity.MEDIUM
                    risk = 50.0
                    tags.append("smb_outbound")

                if remote_port == 3389 and direction == "outbound":
                    severity = Severity.MEDIUM
                    risk = 40.0
                    tags.append("rdp_outbound")

                # Track connection frequency for beaconing detection
                if remote_addr:
                    self._connection_history[remote_addr] += 1
                    freq = self._connection_history[remote_addr]
                    if freq > 50:
                        severity = Severity.HIGH
                        risk = max(risk, 65.0)
                        tags.append("potential_beaconing")

                # If connection has been seen before and is routine INFO, skip re-emitting
                is_new = conn_key not in self._seen_connections
                if not is_new and severity == Severity.INFO and risk == 0.0:
                    continue

                port_service = WELL_KNOWN_PORTS.get(remote_port, "unknown")
                pid = conn.pid or 0
                proc_name = pid_name_cache.get(pid, "unknown")

                event = self._create_event(
                    EventType.NETWORK_CONNECTION,
                    severity=severity.value,
                    risk_score=risk,
                    tags=tags,
                    metadata={
                        "protocol": protocol,
                        "local_address": local_addr,
                        "remote_address": remote_addr,
                        "remote_ip": remote_ip,
                        "remote_port": remote_port,
                        "port_service": port_service,
                        "status": conn.status,
                        "direction": direction,
                        "pid": pid,
                        "process_name": proc_name,
                        "connection_count": self._connection_history.get(remote_addr, 0),
                        "is_new_connection": is_new,
                    },
                )
                events.append(event)

            except Exception:
                continue

        # Keep state cache updated
        self._seen_connections = current_seen
        return events

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Collect real network connections off-thread to ensure 100% responsive event loop."""
        return await asyncio.to_thread(self._collect_connections_sync)

    async def _collect_simulated(self) -> list[TelemetryEvent]:
        """Generate simulated network connections."""
        simulated = [
            {
                "protocol": "TCP", "local": "192.168.1.100:49752",
                "remote_ip": "13.107.42.14", "remote_port": 443,
                "status": "ESTABLISHED", "direction": "outbound",
                "pid": 1024, "process": "svchost.exe",
            },
            {
                "protocol": "TCP", "local": "192.168.1.100:50123",
                "remote_ip": "185.199.108.153", "remote_port": 443,
                "status": "ESTABLISHED", "direction": "outbound",
                "pid": 3456, "process": "chrome.exe",
            },
            {
                "protocol": "TCP", "local": "192.168.1.100:51001",
                "remote_ip": "45.33.32.156", "remote_port": 4444,
                "status": "ESTABLISHED", "direction": "outbound",
                "pid": 7890, "process": "powershell.exe",
            },
            {
                "protocol": "TCP", "local": "192.168.1.100:52000",
                "remote_ip": "10.0.0.50", "remote_port": 445,
                "status": "ESTABLISHED", "direction": "outbound",
                "pid": 5678, "process": "explorer.exe",
            },
            {
                "protocol": "UDP", "local": "192.168.1.100:53",
                "remote_ip": "8.8.8.8", "remote_port": 53,
                "status": "NONE", "direction": "outbound",
                "pid": 1200, "process": "svchost.exe",
            },
        ]

        events: list[TelemetryEvent] = []
        for conn in simulated:
            severity = Severity.INFO
            risk = 0.0
            tags: list[str] = ["simulated"]

            rp = conn["remote_port"]
            if rp in SUSPICIOUS_PORTS:
                severity = Severity.HIGH
                risk = 70.0
                tags.append("suspicious_port")
            if rp == 445:
                severity = Severity.MEDIUM
                risk = 50.0
                tags.append("smb_outbound")

            event = self._create_event(
                EventType.NETWORK_CONNECTION,
                severity=severity.value,
                risk_score=risk,
                tags=tags,
                metadata={
                    "protocol": conn["protocol"],
                    "local_address": conn["local"],
                    "remote_ip": conn["remote_ip"],
                    "remote_port": rp,
                    "port_service": WELL_KNOWN_PORTS.get(rp, "unknown"),
                    "status": conn["status"],
                    "direction": conn["direction"],
                    "pid": conn["pid"],
                    "process_name": conn["process"],
                },
            )
            events.append(event)

        return events
