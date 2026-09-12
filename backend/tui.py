"""
KAVACH Terminal UI — Premium SOC Dashboard.

Rich/Textual-based terminal interface for live operational monitoring.
Connects to the KAVACH backend via REST API.

Features:
    - Live stat cards with color-coded severity
    - ASCII sparkline gauges for CPU/RAM
    - Recent alerts table with severity coloring
    - MITRE ATT&CK heatmap table
    - Full alerts browser
    - Live event log with USB/FIM highlighting
    - Collector status monitor

Usage:
    python tui.py
    python tui.py --api-url http://localhost:8000
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import os
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import (
    Header, Footer, Static, DataTable, RichLog, TabbedContent, TabPane,
)
from rich.text import Text

import httpx


SEVERITY_COLORS = {
    "critical": "bold white on red",
    "high": "bold red",
    "medium": "yellow",
    "low": "cyan",
    "info": "green",
}


class StatCard(Static):
    """A statistics card widget with value + label."""

    def __init__(self, title: str, value: str = "0", color: str = "white", icon: str = "", **kwargs: Any) -> None:
        self._title = title
        self._value = value
        self._color = color
        self._icon = icon
        super().__init__(**kwargs)

    def render(self) -> Text:
        icon_str = f"{self._icon} " if self._icon else ""
        markup = f"[bold {self._color}]{icon_str}{self._value}[/]\n[dim]{self._title}[/]"
        return Text.from_markup(markup)

    def update_value(self, value: str, color: str | None = None) -> None:
        self._value = value
        if color:
            self._color = color
        self.refresh()


class GaugeBar(Static):
    """A simple ASCII gauge bar for CPU/RAM."""

    def __init__(self, title: str = "", **kwargs: Any) -> None:
        self._title = title
        self._data: list[float] = []
        self._max_points = 25
        super().__init__(**kwargs)

    def render(self) -> Text:
        if not self._data:
            return Text.from_markup(f"[dim]{self._title}: waiting for data...[/]")

        bars = " ▁▂▃▄▅▆▇█"
        max_val = max(self._data) if max(self._data) > 0 else 1
        sparkline = ""
        for val in self._data[-self._max_points:]:
            idx = int((val / max_val) * (len(bars) - 1))
            sparkline += bars[idx]

        current = self._data[-1] if self._data else 0
        color = "red" if current > 80 else "yellow" if current > 50 else "green"
        return Text.from_markup(f"[dim]{self._title}:[/] [{color}]{current:.1f}%[/] [{color}]{sparkline}[/{color}]")

    def push_value(self, value: float) -> None:
        self._data.append(value)
        if len(self._data) > self._max_points:
            self._data = self._data[-self._max_points:]
        self.refresh()


class KavachTUI(App):
    """KAVACH Terminal UI Application."""

    TITLE = "KAVACH SOAR-XDR -- SOC Dashboard"
    CSS = """
    Screen {
        background: $surface;
    }
    #stats-bar {
        height: 5;
        layout: horizontal;
        padding: 0 1;
    }
    #stats-bar StatCard {
        width: 1fr;
        height: 3;
        border: round $primary;
        text-align: center;
        padding: 0;
    }
    #gauges {
        height: 3;
        padding: 0 2;
    }
    #gauges GaugeBar {
        height: 1;
    }
    #main-content {
        height: 1fr;
    }
    DataTable {
        height: 1fr;
    }
    RichLog {
        height: 1fr;
        border: round $primary;
    }
    .panel {
        border: round $primary;
        padding: 1;
    }
    .half-panel {
        width: 1fr;
        border: round $primary;
        padding: 1;
    }
    """

    BINDINGS = [
        ("q", "quit", "Quit"),
        ("r", "refresh", "Refresh"),
        ("d", "switch_tab('dashboard')", "Dashboard"),
        ("a", "switch_tab('alerts')", "Alerts"),
        ("e", "switch_tab('events')", "Events"),
        ("c", "switch_tab('collectors-tab')", "Collectors"),
    ]

    def __init__(self, api_url: str = "http://localhost:8000", **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.api_url = api_url
        self.client = httpx.AsyncClient(base_url=api_url, timeout=10.0)
        self._last_alert_ids: set[str] = set()

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)

        with Container(id="stats-bar"):
            yield StatCard("Total Alerts", "---", "red", icon="!", id="stat-alerts")
            yield StatCard("Critical", "---", "bold red", icon="!!", id="stat-critical")
            yield StatCard("High", "---", "red", icon="*", id="stat-high")
            yield StatCard("Medium", "---", "yellow", icon="~", id="stat-medium")
            yield StatCard("Devices", "---", "cyan", icon="#", id="stat-devices")
            yield StatCard("Pipeline", "---", "blue", icon=">", id="stat-pipeline")

        with Vertical(id="gauges"):
            yield GaugeBar("CPU", id="gauge-cpu")
            yield GaugeBar("RAM", id="gauge-ram")

        with TabbedContent(id="main-content"):
            with TabPane("Dashboard", id="dashboard"):
                with Horizontal():
                    with Vertical(classes="half-panel"):
                        yield Static(Text.from_markup("[bold]Recent Alerts[/]"))
                        yield DataTable(id="recent-alerts")
                    with Vertical(classes="half-panel"):
                        yield Static(Text.from_markup("[bold]Top MITRE Techniques[/]"))
                        yield DataTable(id="mitre-table")
            with TabPane("Alerts", id="alerts"):
                yield DataTable(id="all-alerts")
            with TabPane("Live Events", id="events"):
                yield RichLog(id="event-log", highlight=True, markup=True, max_lines=500)
            with TabPane("Collectors", id="collectors-tab"):
                yield DataTable(id="collector-table")

        yield Footer()

    async def on_mount(self) -> None:
        """Initialize tables and start polling."""
        # Recent alerts
        t = self.query_one("#recent-alerts", DataTable)
        t.add_columns("Sev", "Title", "MITRE", "Risk", "Time")

        # MITRE table
        m = self.query_one("#mitre-table", DataTable)
        m.add_columns("ID", "Name", "Tactic", "Count")

        # All alerts
        a = self.query_one("#all-alerts", DataTable)
        a.add_columns("ID", "Sev", "Title", "Collector", "MITRE", "Risk", "Status", "Time")

        # Collectors
        c = self.query_one("#collector-table", DataTable)
        c.add_columns("Collector", "Status", "Events", "Errors", "Last Collection", "Sim")

        # Start polling
        self.set_interval(5, self._poll_dashboard)
        await self._poll_dashboard()

    async def _poll_dashboard(self) -> None:
        """Fetch dashboard data from API."""
        event_log = self.query_one("#event-log", RichLog)

        try:
            resp = await self.client.get("/api/v1/dashboard/summary")
            if resp.status_code != 200:
                event_log.write(Text.from_markup(f"[bold red]BACKEND ERROR -- HTTP {resp.status_code}[/bold red]"))
                return

            data = resp.json()
            overview = data.get("overview", {})
            severity = overview.get("severity_counts", {})
            system = data.get("system", {})
            pipeline = data.get("pipeline", {})

            # Update stat cards
            total = overview.get("total_alerts", 0)
            crit = severity.get("critical", 0)
            high = severity.get("high", 0)
            med = severity.get("medium", 0)
            devices = overview.get("total_devices", 0)
            processed = pipeline.get("processed", 0)

            self.query_one("#stat-alerts", StatCard).update_value(str(total), "bold red" if total > 0 else "dim")
            self.query_one("#stat-critical", StatCard).update_value(str(crit), "bold white on red" if crit > 0 else "dim")
            self.query_one("#stat-high", StatCard).update_value(str(high), "red" if high > 0 else "dim")
            self.query_one("#stat-medium", StatCard).update_value(str(med), "yellow" if med > 0 else "dim")
            self.query_one("#stat-devices", StatCard).update_value(str(devices), "cyan")
            self.query_one("#stat-pipeline", StatCard).update_value(str(processed), "blue")

            # Gauges
            cpu = system.get("cpu_percent", 0.0)
            ram = system.get("memory_percent", 0.0)
            self.query_one("#gauge-cpu", GaugeBar).push_value(cpu)
            self.query_one("#gauge-ram", GaugeBar).push_value(ram)

            # Recent alerts table
            recent_table = self.query_one("#recent-alerts", DataTable)
            recent_table.clear()
            for alert in data.get("recent_alerts", [])[:12]:
                sev = alert.get("severity", "info")
                color = SEVERITY_COLORS.get(sev, "white")
                title = alert.get("title", "")
                if len(title) > 45:
                    title = title[:42] + "..."
                recent_table.add_row(
                    Text(sev.upper(), style=color),
                    title,
                    alert.get("mitre_technique", "") or "-",
                    str(alert.get("risk_score", 0)),
                    (alert.get("created_at", "") or "")[:19],
                )

            # MITRE heatmap
            mitre_table = self.query_one("#mitre-table", DataTable)
            mitre_table.clear()
            for entry in data.get("mitre_heatmap", [])[:10]:
                name = entry.get("technique_name", "")
                if len(name) > 25:
                    name = name[:22] + "..."
                mitre_table.add_row(
                    Text(entry.get("technique_id", ""), style="bold cyan"),
                    name,
                    entry.get("tactic", ""),
                    Text(str(entry.get("count", 0)), style="bold"),
                )

            # Collectors
            collector_table = self.query_one("#collector-table", DataTable)
            collector_table.clear()
            for col in data.get("collectors", []):
                status = col.get("status", "unknown")
                status_color = "green" if status == "running" else "red" if status == "error" else "yellow"
                collector_table.add_row(
                    col.get("name", ""),
                    Text(status.upper(), style=status_color),
                    str(col.get("events_collected", 0)),
                    str(col.get("errors", 0)),
                    (col.get("last_collection", "") or "-")[:19],
                    "Yes" if col.get("simulation_mode") else "No",
                )

            # Live event log — only log NEW alerts (avoid duplicates)
            current_ids = set()
            for alert in data.get("recent_alerts", [])[:5]:
                aid = alert.get("id", "")
                current_ids.add(aid)
                if aid and aid not in self._last_alert_ids:
                    sev = alert.get("severity", "info")
                    color = SEVERITY_COLORS.get(sev, "white")
                    title = alert.get("title", "Unknown")
                    mitre = alert.get("mitre_technique", "-")
                    risk = alert.get("risk_score", 0)

                    # Highlight USB and FIM events
                    if "USB" in title or "usb" in title.lower():
                        event_log.write(Text.from_markup(f"[bold yellow on black] USB DETECTED [/] {title}"))
                    elif "File" in title or "Ransomware" in title or "file" in title.lower():
                        event_log.write(Text.from_markup(f"[bold red] FILE/FIM [/] {title} | Risk: {risk}"))
                    else:
                        event_log.write(Text.from_markup(
                            f"[{color}][{sev.upper()}][/{color}] "
                            f"{title} | Risk: {risk} | MITRE: {mitre}"
                        ))

            self._last_alert_ids = current_ids

        except httpx.ConnectError:
            event_log.write(Text.from_markup(f"[bold red]CONNECTION LOST:[/] Cannot reach {self.api_url}"))
        except Exception as exc:
            event_log.write(Text.from_markup(f"[bold red]ERROR:[/] {type(exc).__name__}: {exc}"))

    async def _fetch_all_alerts(self) -> None:
        """Fetch all alerts for the alerts tab."""
        try:
            resp = await self.client.get("/api/v1/alerts?limit=100")
            if resp.status_code == 200:
                data = resp.json()
                table = self.query_one("#all-alerts", DataTable)
                table.clear()
                for a in data.get("alerts", []):
                    sev = a.get("severity", "info")
                    color = SEVERITY_COLORS.get(sev, "white")
                    title = a.get("title", "")
                    if len(title) > 35:
                        title = title[:32] + "..."
                    table.add_row(
                        a.get("id", "")[:8],
                        Text(sev.upper(), style=color),
                        title,
                        a.get("source_collector", "") or "-",
                        a.get("mitre_technique_id", "") or "-",
                        str(a.get("risk_score", 0)),
                        a.get("status", ""),
                        (a.get("created_at", "") or "")[:19],
                    )
        except Exception:
            pass

    def action_refresh(self) -> None:
        """Manual refresh."""
        asyncio.create_task(self._poll_dashboard())
        asyncio.create_task(self._fetch_all_alerts())

    async def on_unmount(self) -> None:
        await self.client.aclose()


def main() -> None:
    parser = argparse.ArgumentParser(description="KAVACH SOC Terminal Dashboard")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Backend API URL")
    args = parser.parse_args()

    print(r"""
    +=====================================================+
    |  KAVACH TUI -- SOC Terminal Dashboard                |
    |  Connecting to: {url:<36s}   |
    |  Press 'q' to quit, 'r' to refresh                  |
    +=====================================================+
    """.format(url=args.api_url))

    app = KavachTUI(api_url=args.api_url)
    app.run()


if __name__ == "__main__":
    main()
