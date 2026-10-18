"""
KAVACH Windows Companion Application.

High-Performance Desktop Companion & Telemetry Engine for Monitored Windows Endpoints.
Features:
- Integrated or Attached 16-Collector Telemetry Engine
- Instant One-Click Shield (Active Endpoint Containment)
- Real-Time Spool Buffer & HTTPS Cloud Shipper Monitoring
- Hardware DPAPI Cryptographic Device Identity & Zero-Trust Enrollment
- Enterprise Dual-Gate Account Access Lifecycle & Status Inspector
- Live Telemetry Event Stream with Tier Classification
- Restrained, Modern Obsidian & Crimson-Red Cybersecurity Aesthetic
"""

from __future__ import annotations

import asyncio
import json
import os
import platform
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

# Ensure backend root is in sys.path
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

import tkinter as tk
from tkinter import messagebox, ttk

from app.agent.identity import DeviceIdentityManager
from app.agent.service import (
    KavachAgentService,
    _DEFAULT_CMD_FILE,
    _DEFAULT_STATUS_FILE,
)
from app.core.logging import get_logger

logger = get_logger("kavach_companion")

# Visual Design Palette (KAVACH Obsidian & Crimson Cyber Theme)
BG_DARK = "#06080e"
PANEL_BG = "#0d1527"
PANEL_HEADER = "#131f38"
BORDER_COLOR = "#1e2e4a"
BORDER_GLOW = "#dc2626"

ACCENT_RED = "#dc2626"
ACCENT_RED_HOVER = "#ef4444"
ACCENT_GREEN = "#10b981"
ACCENT_GREEN_HOVER = "#059669"
ACCENT_AMBER = "#f59e0b"
ACCENT_BLUE = "#38bdf8"
ACCENT_PURPLE = "#a855f7"

TEXT_PRIMARY = "#f8fafc"
TEXT_SECONDARY = "#cbd5e1"
TEXT_MUTED = "#94a3b8"
FONT_FAMILY = "Segoe UI"


def _format_http_error(exc: urllib.error.HTTPError) -> str:
    """Extract actionable, sanitized error messages from HTTP responses."""
    try:
        body = exc.read().decode("utf-8", errors="replace")
        data = json.loads(body)
        if isinstance(data, dict):
            # Check for structured KAVACH error envelope: {"success": false, "error": {...}}
            err = data.get("error")
            if isinstance(err, dict):
                msg = err.get("message", "")
                details = err.get("details", [])
                if details and isinstance(details, list):
                    field_errs = []
                    for d in details:
                        if isinstance(d, dict):
                            loc = " -> ".join(str(x) for x in d.get("loc", []) if x != "body")
                            m = d.get("msg", "")
                            field_errs.append(f"{loc}: {m}" if loc else m)
                    if field_errs:
                        return f"{msg}\n• " + "\n• ".join(field_errs)
                if msg:
                    return msg
            # FastAPI standard detail envelope: {"detail": ...}
            detail = data.get("detail")
            if detail:
                if isinstance(detail, list):
                    errs = [
                        f"{' -> '.join(str(x) for x in d.get('loc', []) if x != 'body')}: {d.get('msg', '')}"
                        for d in detail
                        if isinstance(d, dict)
                    ]
                    return "Validation error:\n• " + "\n• ".join(errs)
                return str(detail)
    except Exception:
        pass
    if exc.code == 422:
        return "Validation Error (422): Request parameters or payload structure invalid."
    if exc.code == 401:
        return "Authentication Error (401): Session expired or invalid. Please sign in on Account Gate."
    if exc.code == 403:
        return "Authorization Error (403): Account clearance required (account must be ACTIVE)."
    if exc.code == 409:
        return "Conflict Error (409): Resource conflict or device quota exceeded."
    return f"HTTP Error {exc.code}: {exc.reason}"


class KavachCompanionApp:
    """Windows GUI Companion and Integrated Telemetry Agent for KAVACH."""

    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("KAVACH — Windows Security Companion")
        self.root.geometry("1000x720")
        self.root.minsize(880, 600)
        self.root.configure(bg=BG_DARK)

        # Set official KAVACH window and taskbar icon
        icon_candidates = [
            _BACKEND_ROOT.parent / "assets" / "kavach.ico",
            Path(sys.executable).resolve().parents[2] / "assets" / "kavach.ico",
            Path("assets/kavach.ico"),
        ]
        for p in icon_candidates:
            if p.exists():
                try:
                    self.root.iconbitmap(default=str(p))
                    break
                except Exception:
                    pass

        # Application state
        self.server_url = tk.StringVar(value=os.getenv("KAVACH_CLOUD_URL", "http://127.0.0.1:8000"))
        self.user_token: str | None = None
        self.user_info: dict[str, Any] = {}
        self.identity_mgr = DeviceIdentityManager()
        self.shield_active = False
        self.agent_online = False
        self.last_status_data: dict[str, Any] = {}

        # Embedded agent service runner state
        self.embedded_service: KavachAgentService | None = None
        self._embedded_loop: asyncio.AbstractEventLoop | None = None
        self._service_thread_obj: threading.Thread | None = None
        self._is_embedded = False

        self._setup_styles()
        self._build_header()
        self._build_notebook()
        self._build_footer()

        # Check if external service is already running; if not, auto-start embedded agent
        self._ensure_agent_running()

        # Start background polling thread for UI synchronization
        self._polling = True
        self.poll_thread = threading.Thread(target=self._status_polling_worker, daemon=True)
        self.poll_thread.start()

        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _setup_styles(self) -> None:
        style = ttk.Style(self.root)
        style.theme_use("clam")

        style.configure(".", background=BG_DARK, foreground=TEXT_PRIMARY, font=(FONT_FAMILY, 9))
        style.configure("TFrame", background=BG_DARK)
        style.configure("Panel.TFrame", background=PANEL_BG, relief="flat")

        # Notebook tab styling
        style.configure(
            "TNotebook",
            background=BG_DARK,
            tabmargins=[12, 10, 12, 0],
            borderwidth=0,
        )
        style.configure(
            "TNotebook.Tab",
            background=PANEL_BG,
            foreground=TEXT_SECONDARY,
            padding=[18, 9],
            font=(FONT_FAMILY, 10, "bold"),
            borderwidth=0,
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", ACCENT_RED), ("active", PANEL_HEADER)],
            foreground=[("selected", "#ffffff"), ("active", "#ffffff")],
        )

        # Treeview styling
        style.configure(
            "Treeview",
            background=PANEL_BG,
            foreground=TEXT_PRIMARY,
            fieldbackground=PANEL_BG,
            font=(FONT_FAMILY, 9),
            rowheight=28,
            borderwidth=0,
        )
        style.configure(
            "Treeview.Heading",
            background=PANEL_HEADER,
            foreground=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            borderwidth=0,
            relief="flat",
        )
        style.map("Treeview.Heading", background=[("active", BORDER_COLOR)])
        style.map("Treeview", background=[("selected", "#1e2e4a")], foreground=[("selected", "#38bdf8")])

    def _build_header(self) -> None:
        header = tk.Frame(self.root, bg=PANEL_HEADER, height=68)
        header.pack(fill=tk.X, side=tk.TOP)
        header.pack_propagate(False)

        # Left branding block
        brand_frame = tk.Frame(header, bg=PANEL_HEADER)
        brand_frame.pack(side=tk.LEFT, padx=16, pady=10)

        logo_lbl = tk.Label(
            brand_frame,
            text="🛡️ KAVACH",
            font=(FONT_FAMILY, 16, "bold"),
            fg=ACCENT_RED,
            bg=PANEL_HEADER,
        )
        logo_lbl.pack(side=tk.LEFT)

        sub_frame = tk.Frame(brand_frame, bg=PANEL_HEADER)
        sub_frame.pack(side=tk.LEFT, padx=10, pady=(2, 0))

        tk.Label(
            sub_frame,
            text="SOVEREIGN DEFENDER & TELEMETRY ENGINE",
            font=(FONT_FAMILY, 8, "bold"),
            fg=TEXT_PRIMARY,
            bg=PANEL_HEADER,
        ).pack(anchor="w")

        tk.Label(
            sub_frame,
            text="Real-time 16-Sensor Ingest · Windows DPAPI · SQLite Spooler",
            font=(FONT_FAMILY, 7),
            fg=TEXT_MUTED,
            bg=PANEL_HEADER,
        ).pack(anchor="w")

        # Right Controls: Status Badges, Service Switch & Containment Shield
        ctrl_frame = tk.Frame(header, bg=PANEL_HEADER)
        ctrl_frame.pack(side=tk.RIGHT, padx=16)

        # Connection status badge
        self.conn_badge = tk.Label(
            ctrl_frame,
            text="● INITIALIZING",
            font=(FONT_FAMILY, 8, "bold"),
            fg="#fbbf24",
            bg="#2a1f10",
            padx=10,
            pady=4,
            relief="flat",
        )
        self.conn_badge.pack(side=tk.LEFT, padx=5)

        # Agent Service Power Toggle Button
        self.btn_service_toggle = tk.Button(
            ctrl_frame,
            text="⚡ RESTART AGENT",
            command=self._restart_agent_service,
            bg="#1e2e4a",
            fg=TEXT_PRIMARY,
            activebackground=ACCENT_RED,
            activeforeground="#ffffff",
            font=(FONT_FAMILY, 8, "bold"),
            padx=10,
            pady=4,
            relief="flat",
            cursor="hand2",
        )
        self.btn_service_toggle.pack(side=tk.LEFT, padx=5)

        # One-Click Containment Shield Button
        self.btn_shield = tk.Button(
            ctrl_frame,
            text="🛡️ ONE-CLICK SHIELD: OFF",
            command=self._toggle_shield,
            bg="#27272a",
            fg=TEXT_PRIMARY,
            activebackground=ACCENT_RED_HOVER,
            activeforeground="#ffffff",
            font=(FONT_FAMILY, 9, "bold"),
            padx=14,
            pady=5,
            relief="flat",
            cursor="hand2",
        )
        self.btn_shield.pack(side=tk.LEFT, padx=6)

    def _build_notebook(self) -> None:
        self.nb = ttk.Notebook(self.root)
        self.nb.pack(fill=tk.BOTH, expand=True, padx=16, pady=10)

        # Tab 1: Live Overview & Shield
        self.tab_overview = ttk.Frame(self.nb)
        self.nb.add(self.tab_overview, text="📊 Live Posture")
        self._build_overview_tab(self.tab_overview)

        # Tab 2: Sensors Health (16 Collectors)
        self.tab_sensors = ttk.Frame(self.nb)
        self.nb.add(self.tab_sensors, text="🔍 16 Sensors")
        self._build_sensors_tab(self.tab_sensors)

        # Tab 3: Cryptographic Device Identity & DPAPI
        self.tab_device = ttk.Frame(self.nb)
        self.nb.add(self.tab_device, text="🔑 Device DPAPI")
        self._build_device_tab(self.tab_device)

        # Tab 4: Account Lifecycle & Approval Gate
        self.tab_account = ttk.Frame(self.nb)
        self.nb.add(self.tab_account, text="👤 Account Gate")
        self._build_account_tab(self.tab_account)

        # Tab 5: Live Security Events
        self.tab_events = ttk.Frame(self.nb)
        self.nb.add(self.tab_events, text="⚡ Live Events")
        self._build_events_tab(self.tab_events)

    def _build_overview_tab(self, parent: ttk.Frame) -> None:
        grid = tk.Frame(parent, bg=BG_DARK)
        grid.pack(fill=tk.BOTH, expand=True, padx=12, pady=12)

        # Top stat cards row
        card_row = tk.Frame(grid, bg=BG_DARK)
        card_row.pack(fill=tk.X, pady=(0, 12))

        self.card_defense = self._create_metric_card(
            card_row, "Active Protection", "MONITORING", ACCENT_GREEN, "Full 16-sensor telemetry active"
        )
        self.card_defense.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=4)

        self.card_spool = self._create_metric_card(
            card_row, "Spool Queue Depth", "0 Events", ACCENT_BLUE, "SQLite encrypted spool buffer"
        )
        self.card_spool.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=4)

        self.card_upload = self._create_metric_card(
            card_row, "Telemetry Upload", "Connecting...", ACCENT_AMBER, "HTTPS ingestion pipeline"
        )
        self.card_upload.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=4)

        self.card_identity = self._create_metric_card(
            card_row, "Device Identity", "Unenrolled", "#94a3b8", "DPAPI RSA-2048 identity"
        )
        self.card_identity.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=4)

        # Middle Section: System Details and Quick Actions
        mid_frame = tk.Frame(grid, bg=BG_DARK)
        mid_frame.pack(fill=tk.BOTH, expand=True)

        # Left Info Panel
        info_panel = tk.LabelFrame(
            mid_frame,
            text=" Monitored Workstation Telemetry ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        info_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(4, 6))

        self.lbl_host_id = self._add_info_row(info_panel, "Host ID:", socket.gethostname())
        self.lbl_host_ip = self._add_info_row(info_panel, "Local IP Address:", "127.0.0.1")
        self.lbl_host_os = self._add_info_row(info_panel, "Host OS:", f"{platform.system()} {platform.release()}")
        self.lbl_host_server = self._add_info_row(info_panel, "Cloud Gateway:", self.server_url.get())
        self.lbl_host_uptime = self._add_info_row(info_panel, "Agent Uptime:", "0s")
        self.lbl_host_spool = self._add_info_row(info_panel, "Spool Path:", "agent_spool.db")

        # Right Action Panel
        action_panel = tk.LabelFrame(
            mid_frame,
            text=" Active Endpoint Controls ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        action_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(6, 4))

        tk.Label(
            action_panel,
            text="Immediate Host Defense & Ingestion Actions:",
            bg=PANEL_BG,
            fg=TEXT_MUTED,
            font=(FONT_FAMILY, 8),
        ).pack(anchor="w", padx=14, pady=(12, 6))

        btn_big_shield = tk.Button(
            action_panel,
            text="🚨 Toggle One-Click Containment Shield",
            command=self._toggle_shield,
            bg="#7f1d1d",
            fg="#fee2e2",
            activebackground=ACCENT_RED,
            activeforeground="#ffffff",
            font=(FONT_FAMILY, 9, "bold"),
            pady=8,
            relief="flat",
            cursor="hand2",
        )
        btn_big_shield.pack(fill=tk.X, padx=14, pady=4)

        btn_flush = tk.Button(
            action_panel,
            text="⚡ Flush Offline Spool Immediately",
            command=self._flush_spool,
            bg=BORDER_COLOR,
            fg=TEXT_PRIMARY,
            activebackground=PANEL_HEADER,
            font=(FONT_FAMILY, 9),
            pady=6,
            relief="flat",
            cursor="hand2",
        )
        btn_flush.pack(fill=tk.X, padx=14, pady=4)

        btn_enroll_shortcut = tk.Button(
            action_panel,
            text="🔑 Open Device Enrollment Wizard",
            command=lambda: self.nb.select(self.tab_device),
            bg=BORDER_COLOR,
            fg=TEXT_PRIMARY,
            activebackground=PANEL_HEADER,
            font=(FONT_FAMILY, 9),
            pady=6,
            relief="flat",
            cursor="hand2",
        )
        btn_enroll_shortcut.pack(fill=tk.X, padx=14, pady=4)

        btn_poll_shortcut = tk.Button(
            action_panel,
            text="🔄 Trigger Instant Collector Polling Cycle",
            command=self._trigger_poll_cycle,
            bg="#1e2e4a",
            fg="#38bdf8",
            activebackground=PANEL_HEADER,
            font=(FONT_FAMILY, 9),
            pady=6,
            relief="flat",
            cursor="hand2",
        )
        btn_poll_shortcut.pack(fill=tk.X, padx=14, pady=4)

    def _create_metric_card(
        self, parent: tk.Widget, title: str, value: str, value_color: str, subtitle: str
    ) -> tk.Frame:
        card = tk.Frame(parent, bg=PANEL_BG, relief="solid", bd=1)
        tk.Label(card, text=title.upper(), font=(FONT_FAMILY, 7, "bold"), fg=TEXT_MUTED, bg=PANEL_BG).pack(
            anchor="w", padx=12, pady=(10, 2)
        )
        val_lbl = tk.Label(card, text=value, font=(FONT_FAMILY, 13, "bold"), fg=value_color, bg=PANEL_BG)
        val_lbl.pack(anchor="w", padx=12, pady=0)
        card.value_label = val_lbl  # type: ignore

        sub_lbl = tk.Label(card, text=subtitle, font=(FONT_FAMILY, 7), fg=TEXT_MUTED, bg=PANEL_BG)
        sub_lbl.pack(anchor="w", padx=12, pady=(2, 10))
        card.sub_label = sub_lbl  # type: ignore
        return card

    def _add_info_row(self, parent: tk.Widget, label: str, value: str) -> tk.Label:
        row = tk.Frame(parent, bg=PANEL_BG)
        row.pack(fill=tk.X, padx=14, pady=4)
        tk.Label(row, text=label, width=18, anchor="w", fg=TEXT_MUTED, bg=PANEL_BG, font=(FONT_FAMILY, 9)).pack(
            side=tk.LEFT
        )
        v_lbl = tk.Label(row, text=value, anchor="w", fg=TEXT_PRIMARY, bg=PANEL_BG, font=(FONT_FAMILY, 9, "bold"))
        v_lbl.pack(side=tk.LEFT, fill=tk.X, expand=True)
        return v_lbl

    def _build_sensors_tab(self, parent: ttk.Frame) -> None:
        container = tk.Frame(parent, bg=BG_DARK)
        container.pack(fill=tk.BOTH, expand=True, padx=12, pady=12)

        top_bar = tk.Frame(container, bg=BG_DARK)
        top_bar.pack(fill=tk.X, pady=(0, 8))

        self.lbl_sensors_summary = tk.Label(
            top_bar,
            text="16 Real-Time Telemetry Sensors Active (Process, Network, Sysmon, EventLog, FIM, Registry, Defender)",
            font=(FONT_FAMILY, 9, "bold"),
            fg=TEXT_SECONDARY,
            bg=BG_DARK,
        )
        self.lbl_sensors_summary.pack(side=tk.LEFT)

        btn_poll_all = tk.Button(
            top_bar,
            text="⚡ Poll All Sensors",
            command=self._trigger_poll_cycle,
            bg="#1e2e4a",
            fg="#38bdf8",
            font=(FONT_FAMILY, 8, "bold"),
            padx=10,
            pady=3,
            relief="flat",
            cursor="hand2",
        )
        btn_poll_all.pack(side=tk.RIGHT)

        cols = ("name", "status", "events", "errors", "interval", "desc")
        self.tree_sensors = ttk.Treeview(container, columns=cols, show="headings", height=14)
        self.tree_sensors.heading("name", text="Sensor Name")
        self.tree_sensors.heading("status", text="Health Status")
        self.tree_sensors.heading("events", text="Events Captured")
        self.tree_sensors.heading("errors", text="Errors")
        self.tree_sensors.heading("interval", text="Interval")
        self.tree_sensors.heading("desc", text="Telemetry Description")

        self.tree_sensors.column("name", width=180, anchor="w")
        self.tree_sensors.column("status", width=110, anchor="center")
        self.tree_sensors.column("events", width=110, anchor="e")
        self.tree_sensors.column("errors", width=80, anchor="e")
        self.tree_sensors.column("interval", width=80, anchor="center")
        self.tree_sensors.column("desc", width=340, anchor="w")

        # Configure color tags
        self.tree_sensors.tag_configure("running", foreground="#34d399")
        self.tree_sensors.tag_configure("stopped", foreground="#ef4444")
        self.tree_sensors.tag_configure("warn", foreground="#fbbf24")

        sb = ttk.Scrollbar(container, orient=tk.VERTICAL, command=self.tree_sensors.yview)
        self.tree_sensors.configure(yscrollcommand=sb.set)

        self.tree_sensors.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sb.pack(side=tk.RIGHT, fill=tk.Y)

    def _build_device_tab(self, parent: ttk.Frame) -> None:
        frame = tk.Frame(parent, bg=BG_DARK)
        frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=14)

        id_card = tk.LabelFrame(
            frame,
            text=" Hardware DPAPI Device Credential ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        id_card.pack(fill=tk.X, pady=(0, 14))

        self.lbl_dev_status = self._add_info_row(id_card, "Enrollment Posture:", "CHECKING...")
        self.lbl_dev_id = self._add_info_row(id_card, "Assigned Device ID:", "None")
        self.lbl_dev_token = self._add_info_row(id_card, "Device Token Hash:", "None")
        self.lbl_dev_key = self._add_info_row(id_card, "Private Key Storage:", "Windows DPAPI (CryptProtectData)")
        self.lbl_dev_expiry = self._add_info_row(id_card, "Certificate Expiry:", "None")

        ctrl_frame = tk.LabelFrame(
            frame,
            text=" Zero-Trust Device Enrollment Operations ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        ctrl_frame.pack(fill=tk.BOTH, expand=True)

        desc = tk.Label(
            ctrl_frame,
            text=(
                "Device Enrollment binds this Windows endpoint to the KAVACH platform using hardware-backed cryptography.\n"
                "The agent creates a local RSA-2048 keypair, solves a cryptographic challenge from the server,\n"
                "and stores authorization credentials encrypted with Windows DPAPI (CryptProtectData)."
            ),
            bg=PANEL_BG,
            fg=TEXT_MUTED,
            justify="left",
            font=(FONT_FAMILY, 8),
        )
        desc.pack(anchor="w", padx=16, pady=12)

        btn_row = tk.Frame(ctrl_frame, bg=PANEL_BG)
        btn_row.pack(fill=tk.X, padx=16, pady=6)

        btn_enroll = tk.Button(
            btn_row,
            text="🛡️ Enroll This Workstation",
            command=self._do_device_enrollment,
            bg=ACCENT_RED,
            fg="#ffffff",
            activebackground=ACCENT_RED_HOVER,
            font=(FONT_FAMILY, 9, "bold"),
            padx=14,
            pady=8,
            relief="flat",
            cursor="hand2",
        )
        btn_enroll.pack(side=tk.LEFT, padx=(0, 8))

        btn_rotate = tk.Button(
            btn_row,
            text="🔄 Rotate Device Token",
            command=self._do_token_rotation,
            bg=BORDER_COLOR,
            fg=TEXT_PRIMARY,
            activebackground=PANEL_HEADER,
            font=(FONT_FAMILY, 9),
            padx=12,
            pady=8,
            relief="flat",
            cursor="hand2",
        )
        btn_rotate.pack(side=tk.LEFT, padx=8)

        btn_revoke = tk.Button(
            btn_row,
            text="❌ Revoke Local Identity",
            command=self._do_revoke_identity,
            bg="#450a0a",
            fg="#f87171",
            activebackground="#7f1d1d",
            font=(FONT_FAMILY, 9),
            padx=12,
            pady=8,
            relief="flat",
            cursor="hand2",
        )
        btn_revoke.pack(side=tk.LEFT, padx=8)

    def _build_account_tab(self, parent: ttk.Frame) -> None:
        frame = tk.Frame(parent, bg=BG_DARK)
        frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=14)

        banner = tk.Frame(frame, bg=PANEL_HEADER, relief="solid", bd=1)
        banner.pack(fill=tk.X, pady=(0, 14))

        tk.Label(
            banner,
            text="🔐 ENTERPRISE DUAL-GATE ACCESS GOVERNANCE",
            font=(FONT_FAMILY, 9, "bold"),
            fg="#38bdf8",
            bg=PANEL_HEADER,
        ).pack(anchor="w", padx=14, pady=(8, 2))

        tk.Label(
            banner,
            text=(
                "Access to KAVACH requires dual approval under Section 70B: Administrator Review -> SOC Analyst Assignment -> User Activation.\n"
                "Self-activation is strictly prohibited. You can request access or check your real-time review status below."
            ),
            font=(FONT_FAMILY, 8),
            fg=TEXT_MUTED,
            bg=PANEL_HEADER,
            justify="left",
        ).pack(anchor="w", padx=14, pady=(0, 8))

        split = tk.Frame(frame, bg=BG_DARK)
        split.pack(fill=tk.BOTH, expand=True)

        # Left: Request Form
        req_frame = tk.LabelFrame(
            split,
            text=" Request KAVACH Platform Access ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        req_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))

        self.ent_username = self._add_form_entry(req_frame, "Desired Username:")
        self.ent_password = self._add_form_entry(req_frame, "Initial Password:", is_password=True)
        self.ent_full_name = self._add_form_entry(req_frame, "Full Name:")
        self.ent_email = self._add_form_entry(req_frame, "Work Email:")
        self.ent_org = self._add_form_entry(req_frame, "Organization / Enterprise:")
        self.ent_dept = self._add_form_entry(req_frame, "Department (e.g. SOC, IT, Security):")
        self.ent_reason = self._add_form_entry(req_frame, "Business Justification:")

        btn_submit_req = tk.Button(
            req_frame,
            text="✉️ Submit Access Request",
            command=self._submit_access_request,
            bg=ACCENT_RED,
            fg="#ffffff",
            activebackground=ACCENT_RED_HOVER,
            font=(FONT_FAMILY, 9, "bold"),
            pady=6,
            relief="flat",
            cursor="hand2",
        )
        btn_submit_req.pack(fill=tk.X, padx=14, pady=(8, 12))

        # Right: Status Inspector & Operator Sign In
        right_frame = tk.Frame(split, bg=BG_DARK)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(8, 0))

        insp_frame = tk.LabelFrame(
            right_frame,
            text=" Check Approval Gate Status ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        insp_frame.pack(fill=tk.X, pady=(0, 10))

        self.ent_check_email = self._add_form_entry(insp_frame, "Registered Work Email or Username:")
        btn_check = tk.Button(
            insp_frame,
            text="🔍 Query Approval Posture",
            command=self._check_account_status,
            bg=BORDER_COLOR,
            fg=TEXT_PRIMARY,
            font=(FONT_FAMILY, 9),
            pady=6,
            relief="flat",
            cursor="hand2",
        )
        btn_check.pack(fill=tk.X, padx=14, pady=(6, 8))

        self.lbl_gate_status = tk.Label(
            insp_frame,
            text="Status: Enter email to query",
            fg=TEXT_MUTED,
            bg=PANEL_BG,
            font=(FONT_FAMILY, 8, "italic"),
        )
        self.lbl_gate_status.pack(anchor="w", padx=14, pady=(0, 8))

        signin_frame = tk.LabelFrame(
            right_frame,
            text=" Operator Sign In ",
            bg=PANEL_BG,
            fg=TEXT_SECONDARY,
            font=(FONT_FAMILY, 9, "bold"),
            relief="solid",
            bd=1,
        )
        signin_frame.pack(fill=tk.BOTH, expand=True)

        self.ent_login_user = self._add_form_entry(signin_frame, "Username or Email:")
        self.ent_login_pass = self._add_form_entry(signin_frame, "Password:", is_password=True)

        btn_signin = tk.Button(
            signin_frame,
            text="🔑 Sign In to KAVACH",
            command=self._do_user_sign_in,
            bg="#1e2e4a",
            fg="#38bdf8",
            activebackground="#334155",
            font=(FONT_FAMILY, 9, "bold"),
            pady=6,
            relief="flat",
            cursor="hand2",
        )
        btn_signin.pack(fill=tk.X, padx=14, pady=(8, 8))

        self.lbl_signin_state = tk.Label(
            signin_frame,
            text="Session: Not Signed In",
            fg=TEXT_MUTED,
            bg=PANEL_BG,
            font=(FONT_FAMILY, 8),
        )
        self.lbl_signin_state.pack(anchor="w", padx=14, pady=(0, 6))

    def _add_form_entry(self, parent: tk.Widget, label: str, is_password: bool = False) -> tk.Entry:
        tk.Label(parent, text=label, fg=TEXT_MUTED, bg=PANEL_BG, font=(FONT_FAMILY, 8)).pack(
            anchor="w", padx=14, pady=(3, 1)
        )
        entry = tk.Entry(
            parent,
            bg="#131f38",
            fg=TEXT_PRIMARY,
            insertbackground=TEXT_PRIMARY,
            relief="flat",
            font=(FONT_FAMILY, 9),
            show="•" if is_password else "",
        )
        entry.pack(fill=tk.X, padx=14, pady=(0, 3), ipady=3)
        return entry

    def _build_events_tab(self, parent: ttk.Frame) -> None:
        container = tk.Frame(parent, bg=BG_DARK)
        container.pack(fill=tk.BOTH, expand=True, padx=12, pady=12)

        top_bar = tk.Frame(container, bg=BG_DARK)
        top_bar.pack(fill=tk.X, pady=(0, 8))

        tk.Label(
            top_bar,
            text="Live Security Events & Edge Telemetry Ring Buffer",
            font=(FONT_FAMILY, 9, "bold"),
            fg=TEXT_SECONDARY,
            bg=BG_DARK,
        ).pack(side=tk.LEFT)

        btn_clear = tk.Button(
            top_bar,
            text="🗑 Clear View",
            command=lambda: [self.tree_events.delete(i) for i in self.tree_events.get_children()],
            bg="#1e2e4a",
            fg=TEXT_MUTED,
            font=(FONT_FAMILY, 8),
            padx=8,
            pady=2,
            relief="flat",
            cursor="hand2",
        )
        btn_clear.pack(side=tk.RIGHT)

        cols = ("time", "tier", "collector", "summary")
        self.tree_events = ttk.Treeview(container, columns=cols, show="headings")
        self.tree_events.heading("time", text="Timestamp")
        self.tree_events.heading("tier", text="Edge Tier")
        self.tree_events.heading("collector", text="Collector")
        self.tree_events.heading("summary", text="Telemetry Event Summary")

        self.tree_events.column("time", width=130, anchor="center")
        self.tree_events.column("tier", width=110, anchor="center")
        self.tree_events.column("collector", width=140, anchor="w")
        self.tree_events.column("summary", width=540, anchor="w")

        # Color tags for event tiers
        self.tree_events.tag_configure("critical", foreground="#ef4444")
        self.tree_events.tag_configure("high", foreground="#f87171")
        self.tree_events.tag_configure("medium", foreground="#fbbf24")
        self.tree_events.tag_configure("low", foreground="#38bdf8")
        self.tree_events.tag_configure("statistical", foreground="#94a3b8")

        sb = ttk.Scrollbar(container, orient=tk.VERTICAL, command=self.tree_events.yview)
        self.tree_events.configure(yscrollcommand=sb.set)

        self.tree_events.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sb.pack(side=tk.RIGHT, fill=tk.Y)

    def _build_footer(self) -> None:
        footer = tk.Frame(self.root, bg=PANEL_HEADER, height=30)
        footer.pack(fill=tk.X, side=tk.BOTTOM)
        footer.pack_propagate(False)

        self.lbl_footer_status = tk.Label(
            footer,
            text="KAVACH Companion ready. 16 sensors monitoring host telemetry.",
            font=(FONT_FAMILY, 8),
            fg=TEXT_MUTED,
            bg=PANEL_HEADER,
        )
        self.lbl_footer_status.pack(side=tk.LEFT, padx=14)

        server_lbl = tk.Label(
            footer,
            textvariable=self.server_url,
            font=(FONT_FAMILY, 8),
            fg="#38bdf8",
            bg=PANEL_HEADER,
        )
        server_lbl.pack(side=tk.RIGHT, padx=14)

    # -----------------------------------------------------------------------
    # Embedded Agent Service Engine & Process Management
    # -----------------------------------------------------------------------
    def _ensure_agent_running(self) -> None:
        """Check if external service is writing fresh status; if not, start embedded agent."""
        is_fresh_external = False
        if _DEFAULT_STATUS_FILE.exists():
            try:
                mtime = os.path.getmtime(_DEFAULT_STATUS_FILE)
                if (time.time() - mtime) < 6.0:
                    data = json.loads(_DEFAULT_STATUS_FILE.read_text(encoding="utf-8"))
                    if data.get("running"):
                        is_fresh_external = True
            except Exception:
                pass

        if not is_fresh_external:
            self._start_embedded_agent()
        else:
            self._is_embedded = False
            self.lbl_footer_status.config(text="Attached to external KAVACH Windows Agent Service.")

    def _start_embedded_agent(self) -> None:
        """Run KavachAgentService in an asynchronous background thread."""
        if self.embedded_service is not None and self.embedded_service._running:
            return

        self._is_embedded = True
        self.lbl_footer_status.config(text="Starting integrated 16-sensor telemetry engine...")

        def _worker():
            self._embedded_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._embedded_loop)

            self.embedded_service = KavachAgentService(
                server_url=self.server_url.get(),
                identity_dir=self.identity_mgr.store_dir,
            )

            try:
                self._embedded_loop.run_until_complete(self.embedded_service.start())
                self._embedded_loop.run_forever()
            except Exception as exc:
                logger.error("embedded_service_terminated", error=str(exc))
            finally:
                if self.embedded_service and self.embedded_service._running:
                    self._embedded_loop.run_until_complete(self.embedded_service.stop())
                self._embedded_loop.close()

        self._service_thread_obj = threading.Thread(target=_worker, daemon=True)
        self._service_thread_obj.start()

    def _stop_embedded_agent(self) -> None:
        """Gracefully shut down the embedded agent service."""
        if self.embedded_service and self._embedded_loop and self._embedded_loop.is_running():
            asyncio.run_coroutine_threadsafe(self.embedded_service.stop(), self._embedded_loop)
            self._embedded_loop.call_soon_threadsafe(self._embedded_loop.stop())
        self.embedded_service = None

    def _restart_agent_service(self) -> None:
        """Restart either embedded or external agent service."""
        self.lbl_footer_status.config(text="Restarting agent telemetry service...")
        if self._is_embedded:
            self._stop_embedded_agent()
            time.sleep(1.0)
            self._start_embedded_agent()
        else:
            # Signal external service via command file
            _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
            _DEFAULT_CMD_FILE.write_text(json.dumps({"action": "FLUSH_SPOOL"}), encoding="utf-8")
            # If external service isn't answering, start embedded
            time.sleep(1.0)
            self._ensure_agent_running()

    # -----------------------------------------------------------------------
    # Background Status Polling Worker
    # -----------------------------------------------------------------------
    def _status_polling_worker(self) -> None:
        while self._polling:
            try:
                # 1. Prefer live in-process status if embedded
                if self.embedded_service and self.embedded_service._running:
                    data = self.embedded_service.get_full_status()
                    self.root.after(0, self._update_ui_from_status, data)
                # 2. Otherwise read the shared status file from disk
                elif _DEFAULT_STATUS_FILE.exists():
                    data = json.loads(_DEFAULT_STATUS_FILE.read_text(encoding="utf-8"))
                    # If status file is too old (>15s), agent is stopped
                    mtime = os.path.getmtime(_DEFAULT_STATUS_FILE)
                    if (time.time() - mtime) > 15.0:
                        data["running"] = False
                        data["connection_status"] = "STOPPED"
                    self.root.after(0, self._update_ui_from_status, data)
                else:
                    self.root.after(0, self._set_agent_offline)
            except Exception:
                pass
            time.sleep(1.5)

    def _update_ui_from_status(self, data: dict[str, Any]) -> None:
        self.last_status_data = data
        self.agent_online = data.get("running", False)

        # Update Connection Badge
        if self.agent_online:
            conn_st = data.get("connection_status", "ONLINE")
            if conn_st == "ONLINE":
                self.conn_badge.config(text="● CLOUD CONNECTED", fg="#34d399", bg="#064e3b")
            elif conn_st == "OFFLINE_SPOOLING":
                self.conn_badge.config(text="● OFFLINE SPOOLING", fg="#fbbf24", bg="#451a03")
            elif conn_st == "CONNECTING":
                self.conn_badge.config(text="● CONNECTING...", fg="#38bdf8", bg="#0c4a6e")
            else:
                self.conn_badge.config(text=f"● {conn_st}", fg="#38bdf8", bg="#0c4a6e")
            self.btn_service_toggle.config(text="⚡ RESTART AGENT", bg="#1e2e4a")
        else:
            self.conn_badge.config(text="● AGENT STOPPED", fg="#ef4444", bg="#450a0a")
            self.btn_service_toggle.config(text="▶ START AGENT", bg=ACCENT_RED)

        # Update Shield Status
        self.shield_active = data.get("shield_active", False)
        if self.shield_active:
            self.btn_shield.config(text="🚨 ONE-CLICK SHIELD: ACTIVE", bg=ACCENT_RED, fg="#ffffff")
            self.card_defense.value_label.config(text="CONTAINED", fg=ACCENT_RED)  # type: ignore
            self.card_defense.sub_label.config(text="Endpoint isolated from network")  # type: ignore
        else:
            self.btn_shield.config(text="🛡️ ONE-CLICK SHIELD: OFF", bg="#27272a", fg=TEXT_PRIMARY)
            collectors_healthy = data.get("collectors_healthy", 16)
            self.card_defense.value_label.config(text=f"MONITORING ({collectors_healthy}/16)", fg=ACCENT_GREEN)  # type: ignore
            self.card_defense.sub_label.config(text="Full telemetry collection active")  # type: ignore

        # Update Spool Queue
        spool = data.get("spool", {})
        count = spool.get("queued_events", 0)
        self.card_spool.value_label.config(text=f"{count} Events", fg=ACCENT_RED if count > 500 else ACCENT_BLUE)  # type: ignore
        self.card_spool.sub_label.config(text=f"{spool.get('total_enqueued', 0)} total enqueued")  # type: ignore

        # Update Upload Metrics
        last_up = data.get("last_successful_upload")
        total_shipped = data.get("total_events_shipped", 0)
        if last_up:
            sec_ago = max(0, int(time.time() - last_up))
            time_txt = f"{sec_ago}s ago" if sec_ago < 60 else f"{sec_ago // 60}m ago"
            self.card_upload.value_label.config(text=f"{total_shipped} Shipped", fg=ACCENT_GREEN)  # type: ignore
            self.card_upload.sub_label.config(text=f"Last upload {time_txt}")  # type: ignore
        else:
            self.card_upload.value_label.config(text="Connecting...", fg="#94a3b8")  # type: ignore
            self.card_upload.sub_label.config(text="Awaiting first transmission")  # type: ignore

        # Update Device Identity Card
        enrolled = data.get("enrolled", False)
        if enrolled:
            dev_id = data.get("device_id", "Unknown")
            self.card_identity.value_label.config(text="DPAPI Secured", fg=ACCENT_GREEN)  # type: ignore
            self.card_identity.sub_label.config(text=f"ID: {dev_id[:12]}...")  # type: ignore
            self.lbl_dev_status.config(text="ENROLLED (DPAPI Secured)", fg=ACCENT_GREEN)
            self.lbl_dev_id.config(text=dev_id)
            self.lbl_dev_token.config(text=data.get("token_preview", "kavach_dev_..."))
            self.lbl_dev_expiry.config(text=data.get("expires_at") or "90 Days")
        else:
            self.card_identity.value_label.config(text="Unenrolled", fg="#94a3b8")  # type: ignore
            self.card_identity.sub_label.config(text="Hardware credential unassigned")  # type: ignore
            self.lbl_dev_status.config(text="NOT ENROLLED", fg="#ef4444")

        # Update Host Metadata
        self.lbl_host_id.config(text=data.get("host_id", socket.gethostname()))
        self.lbl_host_os.config(text=data.get("os", f"{platform.system()} {platform.release()}"))
        uptime_sec = data.get("uptime_seconds", 0)
        uptime_fmt = f"{uptime_sec}s" if uptime_sec < 60 else f"{uptime_sec // 60}m {uptime_sec % 60}s"
        self.lbl_host_uptime.config(text=uptime_fmt)

        # Update 16 Sensors Table
        collectors = data.get("collectors", [])
        if collectors:
            existing_items = self.tree_sensors.get_children()
            # If number of rows matches, update in place; otherwise repopulate
            if len(existing_items) == len(collectors):
                for i, c in enumerate(collectors):
                    item_id = existing_items[i]
                    st = str(c.get("status", "running")).upper()
                    tag = "running" if st in ("RUNNING", "OK") else "stopped"
                    self.tree_sensors.item(
                        item_id,
                        values=(
                            c.get("name", "sensor"),
                            st,
                            c.get("events_collected", 0),
                            c.get("error_count", 0),
                            f"{c.get('interval_seconds', 30)}s",
                            c.get("description", "Telemetry collector"),
                        ),
                        tags=(tag,),
                    )
            else:
                for item in existing_items:
                    self.tree_sensors.delete(item)
                for c in collectors:
                    st = str(c.get("status", "running")).upper()
                    tag = "running" if st in ("RUNNING", "OK") else "stopped"
                    self.tree_sensors.insert(
                        "",
                        tk.END,
                        values=(
                            c.get("name", "sensor"),
                            st,
                            c.get("events_collected", 0),
                            c.get("error_count", 0),
                            f"{c.get('interval_seconds', 30)}s",
                            c.get("description", "Telemetry collector"),
                        ),
                        tags=(tag,),
                    )
            healthy = data.get("collectors_healthy", len(collectors))
            self.lbl_sensors_summary.config(
                text=f"{healthy} of {len(collectors)} Sensors Active & Collecting Telemetry."
            )

        # Update Live Events Stream
        recents = data.get("recent_events", [])
        if recents:
            # Re-render recent events
            for item in self.tree_events.get_children():
                self.tree_events.delete(item)
            for evt in reversed(recents):
                ts = evt.get("timestamp")
                if isinstance(ts, (int, float)):
                    t_str = time.strftime("%H:%M:%S", time.localtime(ts))
                else:
                    t_str = str(ts)[11:19] if ts else time.strftime("%H:%M:%S")

                tier = str(evt.get("tier", "LOW")).upper()
                tag = tier.lower() if tier.lower() in ("critical", "high", "medium", "low", "statistical") else "low"

                self.tree_events.insert(
                    "",
                    tk.END,
                    values=(
                        t_str,
                        tier,
                        evt.get("collector", ""),
                        evt.get("summary", ""),
                    ),
                    tags=(tag,),
                )

    def _set_agent_offline(self) -> None:
        self.agent_online = False
        self.conn_badge.config(text="● AGENT OFFLINE", fg="#ef4444", bg="#450a0a")
        self.btn_service_toggle.config(text="▶ START AGENT", bg=ACCENT_RED)

    # -----------------------------------------------------------------------
    # Active Defense & Ingestion Actions
    # -----------------------------------------------------------------------
    def _toggle_shield(self) -> None:
        """Activate or deactivate endpoint network containment with verified state acknowledgment."""
        target_shield = not self.shield_active
        action_name = "ENABLE_SHIELD" if target_shield else "DISABLE_SHIELD"

        # Explicit confirmation for disruptive action
        prompt = (
            "Activate One-Click Containment Shield?\n\n"
            "This will isolate the workstation from non-essential network communications\n"
            "while maintaining the secure KAVACH telemetry tunnel."
            if target_shield
            else "Deactivate One-Click Containment Shield?\n\nThis will restore standard network operations."
        )
        if not messagebox.askyesno("Confirm Containment Action", prompt):
            return

        self.lbl_footer_status.config(text=f"Action requested: {action_name} — notifying endpoint service...")

        try:
            confirmed = False
            if self.embedded_service and self.embedded_service._running:
                if target_shield:
                    res = self.embedded_service.enable_one_click_shield()
                    confirmed = (res.get("status") == "SHIELD_ENABLED")
                else:
                    res = self.embedded_service.disable_one_click_shield()
                    confirmed = (res.get("status") == "SHIELD_DISABLED")
                self.shield_active = target_shield if confirmed else self.shield_active
            else:
                # Queue action to service via command file
                _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
                cmd_payload = {
                    "action": action_name,
                    "requested_at": time.time(),
                    "requested_by": self.user_info.get("username", "local_user"),
                }
                _DEFAULT_CMD_FILE.write_text(json.dumps(cmd_payload), encoding="utf-8")
                self.lbl_footer_status.config(text=f"Action queued: {action_name} dispatched to background agent.")
                return

            if confirmed:
                status_label = "ACTIVE" if target_shield else "OFF"
                self.lbl_footer_status.config(text=f"Action confirmed: Containment shield is now {status_label}.")
            else:
                self.lbl_footer_status.config(text="Action pending: Awaiting service acknowledgment.")
        except Exception as exc:
            self.lbl_footer_status.config(text=f"Shield action failed: {exc}")
            messagebox.showerror("Shield Action Failed", f"Could not toggle containment: {exc}")

    def _flush_spool(self) -> None:
        """Flush SQLite spool queue immediately."""
        if self.embedded_service and self.embedded_service._running:
            self.embedded_service.shipper.notify_immediate()
        else:
            _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
            _DEFAULT_CMD_FILE.write_text(json.dumps({"action": "FLUSH_SPOOL"}), encoding="utf-8")

        self.lbl_footer_status.config(text="Flushing offline spool to Cloud Gateway...")

    def _trigger_poll_cycle(self) -> None:
        """Force an instant collection cycle on all sensors."""
        self.lbl_footer_status.config(text="Triggering instant collection cycle on all 16 sensors...")
        if self.embedded_service and self.embedded_service._running:
            for c in self.embedded_service.registry.all_collectors:
                if hasattr(c, "collect"):
                    asyncio.run_coroutine_threadsafe(c.collect(), self._embedded_loop)  # type: ignore

    # -----------------------------------------------------------------------
    # Zero-Trust Device DPAPI Enrollment
    # -----------------------------------------------------------------------
    def _do_device_enrollment(self) -> None:
        """Execute cryptographic device enrollment challenge-response."""
        if not self.user_token:
            messagebox.showinfo(
                "Sign In Required",
                "Please sign in on the 'Account Gate' tab with an active user account first,\n"
                "or submit an access request if your account is not yet active.",
            )
            self.nb.select(self.tab_account)
            return

        def _worker():
            try:
                base = self.server_url.get().rstrip("/")
                hostname = socket.gethostname()

                # Step 1: Request single-use nonce challenge
                chal_url = f"{base}/api/v1/enrollment/challenge"
                req = urllib.request.Request(
                    chal_url,
                    data=json.dumps({"hostname": hostname}).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.user_token}",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req) as resp:
                    chal_data = json.loads(resp.read().decode("utf-8"))

                nonce = chal_data["nonce"]

                # Step 2: Generate RSA-2048 keypair locally and sign challenge
                priv_pem, pub_pem = DeviceIdentityManager.generate_keypair()
                sig_b64 = DeviceIdentityManager.sign_nonce(priv_pem, nonce)

                # Step 3: Verify and enroll
                verify_url = f"{base}/api/v1/enrollment/verify"
                verify_body = {
                    "nonce": nonce,
                    "signature": sig_b64,
                    "public_key_pem": pub_pem,
                    "hostname": hostname,
                    "os_info": f"{platform.system()} {platform.release()}",
                }
                req2 = urllib.request.Request(
                    verify_url,
                    data=json.dumps(verify_body).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.user_token}",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req2) as resp2:
                    res_data = json.loads(resp2.read().decode("utf-8"))

                # Step 4: Persist credentials protected with Windows DPAPI
                self.identity_mgr.save_identity(
                    device_id=res_data["device_id"],
                    device_token=res_data["device_token"],
                    public_key_pem=pub_pem,
                    private_key_pem=priv_pem,
                    hostname=hostname,
                    expires_at=res_data.get("expires_at"),
                )

                # Step 5: Update active agent service with new identity
                if self.embedded_service and self.embedded_service._running:
                    self.embedded_service.host_meta["host_id"] = res_data["device_id"]
                else:
                    _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
                    _DEFAULT_CMD_FILE.write_text(json.dumps({"action": "REFRESH_IDENTITY"}), encoding="utf-8")

                self.root.after(
                    0,
                    lambda: messagebox.showinfo(
                        "Enrollment Complete",
                        f"Workstation Enrolled Successfully!\n\n"
                        f"Device ID: {res_data['device_id']}\n"
                        f"DPAPI Token: {res_data['device_token'][:18]}...\n\n"
                        "Telemetry is now authenticated with hardware-bound credentials.",
                    ),
                )
            except urllib.error.HTTPError as exc:
                msg = _format_http_error(exc)
                self.root.after(0, lambda: messagebox.showerror("Enrollment Error", msg))
            except Exception as exc:
                self.root.after(0, lambda: messagebox.showerror("Enrollment Error", f"Unexpected error: {exc}"))

        threading.Thread(target=_worker, daemon=True).start()

    def _do_token_rotation(self) -> None:
        """Rotate existing device token."""
        ident = self.identity_mgr.load_identity()
        if not ident:
            messagebox.showwarning("Not Enrolled", "No active device identity found to rotate.")
            return

        def _worker():
            try:
                base = self.server_url.get().rstrip("/")
                rot_url = f"{base}/api/v1/enrollment/rotate"
                body = {"device_id": ident.device_id, "current_token": ident.device_token}
                req = urllib.request.Request(
                    rot_url,
                    data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                self.identity_mgr.save_identity(
                    device_id=ident.device_id,
                    device_token=data["device_token"],
                    public_key_pem=ident.public_key_pem,
                    private_key_pem=ident.private_key_pem,
                    hostname=ident.hostname,
                    expires_at=data.get("expires_at"),
                )
                self.root.after(
                    0,
                    lambda: messagebox.showinfo(
                        "Rotation Complete", "Device token rotated and re-encrypted with Windows DPAPI."
                    ),
                )
            except urllib.error.HTTPError as exc:
                msg = _format_http_error(exc)
                self.root.after(0, lambda: messagebox.showerror("Rotation Error", msg))
            except Exception as exc:
                self.root.after(0, lambda: messagebox.showerror("Rotation Error", f"Unexpected error: {exc}"))

        threading.Thread(target=_worker, daemon=True).start()

    def _do_revoke_identity(self) -> None:
        """Revoke local DPAPI credentials."""
        if messagebox.askyesno("Confirm Revocation", "Delete local Windows DPAPI device credentials?"):
            self.identity_mgr.clear_identity()
            messagebox.showinfo("Identity Revoked", "Local device credentials cleared.")

    # -----------------------------------------------------------------------
    # Dual-Gate Account Governance
    # -----------------------------------------------------------------------
    def _submit_access_request(self) -> None:
        """Submit account access request to dual-gate pipeline."""
        username = self.ent_username.get().strip()
        password = self.ent_password.get().strip()
        full_name = self.ent_full_name.get().strip()
        email = self.ent_email.get().strip()
        org = self.ent_org.get().strip()
        dept = self.ent_dept.get().strip()
        reason = self.ent_reason.get().strip()

        if not (username and password and email and full_name):
            messagebox.showwarning(
                "Missing Fields",
                "Please provide Desired Username, Initial Password, Full Name, and Work Email.",
            )
            return

        def _worker():
            try:
                base = self.server_url.get().rstrip("/")
                url = f"{base}/api/v1/account/request"
                body = {
                    "username": username,
                    "password": password,
                    "full_name": full_name,
                    "email": email,
                    "organization_name": org or "Enterprise Node",
                    "department": dept or "Endpoint Operations",
                    "justification": reason or "Workstation telemetry and endpoint monitoring access.",
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                self.root.after(
                    0,
                    lambda: messagebox.showinfo(
                        "Request Submitted",
                        f"Access Request Submitted!\n\n"
                        f"Username: {username}\n"
                        f"Status: {data.get('status', 'REQUESTED')}\n"
                        f"Request ID: {data.get('request_id')}\n\n"
                        "Your request is in the Administrator Review Queue.\n"
                        "Once approved, a SOC Analyst will finalize activation.",
                    ),
                )
            except urllib.error.HTTPError as exc:
                msg = _format_http_error(exc)
                self.root.after(0, lambda: messagebox.showerror("Request Failed", msg))
            except Exception as exc:
                self.root.after(0, lambda: messagebox.showerror("Network Error", f"Unexpected error: {exc}"))

        threading.Thread(target=_worker, daemon=True).start()

    def _check_account_status(self) -> None:
        """Inspect dual-gate status by email or username."""
        ident = self.ent_check_email.get().strip()
        if not ident:
            messagebox.showwarning("Input Required", "Please enter your registered work email or username.")
            return

        def _worker():
            try:
                base = self.server_url.get().rstrip("/")
                url = f"{base}/api/v1/account/status?identifier={urllib.parse.quote(ident)}"
                req = urllib.request.Request(url, method="GET")
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                st = data.get("status", "UNKNOWN")
                analyst = data.get("assigned_analyst_name") or "Awaiting Assignment"
                text = f"Status: {st} | Analyst: {analyst}"
                color = "#34d399" if st == "ACTIVE" else "#38bdf8"
                self.root.after(0, lambda: self.lbl_gate_status.config(text=text, fg=color))
            except urllib.error.HTTPError as exc:
                self.root.after(
                    0,
                    lambda: self.lbl_gate_status.config(text=f"Status: Not Found ({exc.code})", fg="#ef4444"),
                )
            except Exception as exc:
                self.root.after(0, lambda: self.lbl_gate_status.config(text=f"Error: {exc}", fg="#ef4444"))

        threading.Thread(target=_worker, daemon=True).start()

    def _do_user_sign_in(self) -> None:
        """Authenticate user and obtain JWT for device enrollment."""
        identifier = self.ent_login_user.get().strip()
        password = self.ent_login_pass.get().strip()

        if not (identifier and password):
            messagebox.showwarning("Input Required", "Enter both username/email and password.")
            return

        def _worker():
            try:
                base = self.server_url.get().rstrip("/")
                url = f"{base}/api/v1/auth/login"
                body = {"username_or_email": identifier, "password": password}
                req = urllib.request.Request(
                    url,
                    data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                self.user_token = data.get("access_token")
                self.user_info = data
                role = data.get("role", "user")
                uname = data.get("username", identifier)

                self.root.after(
                    0,
                    lambda: self.lbl_signin_state.config(
                        text=f"Signed in as: {uname} ({role.upper()})",
                        fg=ACCENT_GREEN,
                    ),
                )
                self.root.after(
                    0,
                    lambda: messagebox.showinfo(
                        "Sign In Successful",
                        f"Authenticated as {uname}.\nYou can now proceed to 'Device DPAPI' to enroll this workstation.",
                    ),
                )
            except urllib.error.HTTPError as exc:
                msg = _format_http_error(exc)
                self.root.after(0, lambda: messagebox.showerror("Sign In Failed", msg))
            except Exception as exc:
                self.root.after(0, lambda: messagebox.showerror("Sign In Error", f"Unexpected error: {exc}"))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_close(self) -> None:
        """Handle window close event and clean up background tasks."""
        self._polling = False
        if self._is_embedded:
            self._stop_embedded_agent()
        self.root.destroy()


def launch_companion():
    """Application entrypoint."""
    root = tk.Tk()
    app = KavachCompanionApp(root)
    root.mainloop()


if __name__ == "__main__":
    launch_companion()
