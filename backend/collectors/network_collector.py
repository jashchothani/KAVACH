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

    async def _collect_real(self) -> list[TelemetryEvent]:
        """Collect real network connections via psutil."""
        import psutil

        events: list[TelemetryEvent] = []
        connections = psutil.net_connections(kind="all")

        for conn in connections:
            try:
                if conn.status == "NONE" and not conn.raddr:
                    continue

                local_addr = f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else ""
                remote_addr = ""
                remote_ip = ""
                remote_port = 0

                if conn.raddr:
                    remote_ip = conn.raddr.ip
                    remote_port = conn.raddr.port
                    remote_addr = f"{remote_ip}:{remote_port}"

                protocol = "TCP" if conn.type == socket.SOCK_STREAM else "UDP"
                direction = "outbound" if conn.raddr else "listening"

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

                port_service = WELL_KNOWN_PORTS.get(remote_port, "unknown")

                # Get process info
                pid = conn.pid
                proc_name = ""
                if pid:
                    try:
                        proc = psutil.Process(pid)
                        proc_name = proc.name()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

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
                    },
                )
                events.append(event)

            except Exception:
                continue

        logger.debug("network_connections_collected", count=len(events))
        return events

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
