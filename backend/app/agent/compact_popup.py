"""
KAVACH Windows System Tray Compact Popup.

Lightweight, high-DPI native status panel positioned above the Windows notification area.
Displays live protection status, DPAPI identity, sensor health, recent security events,
and quick containment actions. Closes automatically on focus loss.
"""

from __future__ import annotations

import ctypes
import json
import os
import platform
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any

# Ensure backend root is in sys.path
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

import tkinter as tk
from tkinter import ttk

from app.agent.service import _DEFAULT_CMD_FILE, _DEFAULT_STATUS_FILE
from app.core.logging import get_logger

logger = get_logger("kavach_compact_popup")

# High DPI awareness
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)  # Process_System_DPI_Aware
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

# Visual Design Palette (Matches Flutter & Web Obsidian-Crimson Theme)
BG_MAIN = "#06080e"
BG_CARD = "#0d1527"
BG_CARD_ALT = "#111c34"
BORDER_COLOR = "#1e2e4a"
BORDER_ACCENT = "#dc2626"

COLOR_RED = "#dc2626"
COLOR_RED_HOVER = "#ef4444"
COLOR_GREEN = "#10b981"
COLOR_AMBER = "#f59e0b"
COLOR_BLUE = "#38bdf8"
COLOR_MUTED = "#94a3b8"
COLOR_TEXT = "#f8fafc"
COLOR_TEXT_DIM = "#cbd5e1"

FONT_MAIN = "Segoe UI"


class KavachCompactPopup:
    """Compact Windows notification area status panel."""

    POPUP_WIDTH = 370
    POPUP_HEIGHT = 520

    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("KAVACH Status")
        self.root.configure(bg=BG_MAIN)
        self.root.overrideredirect(True)  # Frameless native window
        self.root.attributes("-topmost", True)

        self.last_status: dict[str, Any] = {}
        self.shield_active = False

        self._position_popup()
        self._build_ui()
        self._load_status()

        # Auto-dismiss on click outside
        self.root.bind("<FocusOut>", self._on_focus_out)
        self.root.bind("<Escape>", lambda _: self.root.destroy())

        # Poll status every 2 seconds while open
        self.root.after(2000, self._auto_refresh)

    def _position_popup(self) -> None:
        """Position window at bottom-right corner directly above taskbar."""
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()

        # Taskbar height estimation on Windows (typically 48px to 64px)
        taskbar_h = 48
        try:
            # Query work area excluding taskbar if possible
            rect = ctypes.wintypes.RECT()
            ctypes.windll.user32.SystemParametersInfoW(0x0030, 0, ctypes.byref(rect), 0)
            work_w = rect.right - rect.left
            work_h = rect.bottom - rect.top
            taskbar_h = screen_h - work_h
        except Exception:
            pass

        x = max(10, screen_w - self.POPUP_WIDTH - 16)
        y = max(10, screen_h - taskbar_h - self.POPUP_HEIGHT - 12)
        self.root.geometry(f"{self.POPUP_WIDTH}x{self.POPUP_HEIGHT}+{x}+{y}")

    def _build_ui(self) -> None:
        # Outer Border Container
        border_frame = tk.Frame(self.root, bg=BORDER_COLOR, bd=1, relief="solid")
        border_frame.pack(fill=tk.BOTH, expand=True)

        inner_frame = tk.Frame(border_frame, bg=BG_MAIN)
        inner_frame.pack(fill=tk.BOTH, expand=True, padx=1, pady=1)

        # ── 1. HEADER ────────────────────────────────────────────────────────
        header = tk.Frame(inner_frame, bg=BG_CARD, height=52)
        header.pack(fill=tk.X, side=tk.TOP)
        header.pack_propagate(False)

        brand_box = tk.Frame(header, bg=BG_CARD)
        brand_box.pack(side=tk.LEFT, padx=12, pady=8)

        tk.Label(
            brand_box,
            text="🛡️",
            font=(FONT_MAIN, 13),
            bg=BG_CARD,
        ).pack(side=tk.LEFT)

        name_box = tk.Frame(brand_box, bg=BG_CARD)
        name_box.pack(side=tk.LEFT, padx=8)

        tk.Label(
            name_box,
            text="KAVACH",
            font=(FONT_MAIN, 11, "bold"),
            fg=COLOR_RED,
            bg=BG_CARD,
        ).pack(anchor="w")

        tk.Label(
            name_box,
            text="SOVEREIGN DEFENDER",
            font=(FONT_MAIN, 7, "bold"),
            fg=COLOR_MUTED,
            bg=BG_CARD,
        ).pack(anchor="w")

        # Top-right controls: Live connection pill + close [x]
        ctrl_box = tk.Frame(header, bg=BG_CARD)
        ctrl_box.pack(side=tk.RIGHT, padx=10, pady=8)

        self.lbl_conn_pill = tk.Label(
            ctrl_box,
            text="● ONLINE",
            font=(FONT_MAIN, 8, "bold"),
            fg=COLOR_GREEN,
            bg="#064e3b",
            padx=8,
            pady=3,
        )
        self.lbl_conn_pill.pack(side=tk.LEFT, padx=6)

        btn_close = tk.Label(
            ctrl_box,
            text="✕",
            font=(FONT_MAIN, 10, "bold"),
            fg=COLOR_MUTED,
            bg=BG_CARD,
            cursor="hand2",
        )
        btn_close.pack(side=tk.LEFT, padx=4)
        btn_close.bind("<Button-1>", lambda _: self.root.destroy())

        # ── 2. PROTECTION STATUS CARD ────────────────────────────────────────
        self.card_protection = tk.Frame(inner_frame, bg=BG_CARD, relief="flat", bd=0)
        self.card_protection.pack(fill=tk.X, padx=12, pady=(10, 8))

        prot_inner = tk.Frame(self.card_protection, bg=BG_CARD, padx=12, pady=10)
        prot_inner.pack(fill=tk.X)

        self.lbl_status_icon = tk.Label(
            prot_inner,
            text="🛡️",
            font=(FONT_MAIN, 22),
            bg=BG_CARD,
        )
        self.lbl_status_icon.pack(side=tk.LEFT, padx=(0, 10))

        prot_text_box = tk.Frame(prot_inner, bg=BG_CARD)
        prot_text_box.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.lbl_protection_title = tk.Label(
            prot_text_box,
            text="PROTECTED",
            font=(FONT_MAIN, 12, "bold"),
            fg=COLOR_GREEN,
            bg=BG_CARD,
        )
        self.lbl_protection_title.pack(anchor="w")

        self.lbl_protection_desc = tk.Label(
            prot_text_box,
            text="All 16 kernel & OS sensors monitoring in real-time.",
            font=(FONT_MAIN, 8),
            fg=COLOR_TEXT_DIM,
            bg=BG_CARD,
            wraplength=230,
            justify="left",
        )
        self.lbl_protection_desc.pack(anchor="w", pady=(2, 0))

        self.lbl_last_sync = tk.Label(
            prot_inner,
            text="Just now",
            font=(FONT_MAIN, 7),
            fg=COLOR_MUTED,
            bg=BG_CARD,
        )
        self.lbl_last_sync.pack(side=tk.RIGHT, anchor="ne")

        # ── 3. DEVICE & TELEMETRY METRICS ────────────────────────────────────
        metrics_box = tk.Frame(inner_frame, bg=BG_CARD, padx=12, pady=8)
        metrics_box.pack(fill=tk.X, padx=12, pady=(0, 8))

        self.lbl_m_host = self._add_metric_row(metrics_box, "Endpoint:", socket.gethostname())
        self.lbl_m_enroll = self._add_metric_row(metrics_box, "Enrollment:", "DPAPI Cryptographic")
        self.lbl_m_sensors = self._add_metric_row(metrics_box, "Sensors:", "16 of 16 Active")
        self.lbl_m_spool = self._add_metric_row(metrics_box, "Spool Queue:", "0 Events (Synced)")
        self.lbl_m_gateway = self._add_metric_row(metrics_box, "Cloud Gateway:", "Connected (HTTPS)")

        # ── 4. RECENT SECURITY ACTIVITY ──────────────────────────────────────
        tk.Label(
            inner_frame,
            text="RECENT SECURITY ACTIVITY",
            font=(FONT_MAIN, 8, "bold"),
            fg=COLOR_MUTED,
            bg=BG_MAIN,
        ).pack(anchor="w", padx=14, pady=(2, 4))

        self.events_box = tk.Frame(inner_frame, bg=BG_CARD, padx=10, pady=8)
        self.events_box.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 8))

        self.event_labels: list[tk.Widget] = []

        # ── 5. QUICK ACTIONS FOOTER ──────────────────────────────────────────
        actions_bar = tk.Frame(inner_frame, bg=BG_MAIN)
        actions_bar.pack(fill=tk.X, side=tk.BOTTOM, padx=12, pady=(0, 10))

        # Row 1 of actions: App & Detailed Diagnostics
        row1 = tk.Frame(actions_bar, bg=BG_MAIN)
        row1.pack(fill=tk.X, pady=(0, 6))

        self.btn_open_app = tk.Button(
            row1,
            text="⚡ Open KAVACH App",
            command=self._launch_flutter_app,
            bg=COLOR_RED,
            fg="#ffffff",
            activebackground=COLOR_RED_HOVER,
            activeforeground="#ffffff",
            font=(FONT_MAIN, 9, "bold"),
            relief="flat",
            cursor="hand2",
            pady=4,
        )
        self.btn_open_app.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))

        self.btn_open_diag = tk.Button(
            row1,
            text="🔍 Diagnostics",
            command=self._launch_detailed_companion,
            bg="#1e2e4a",
            fg=COLOR_BLUE,
            activebackground="#2a3f65",
            activeforeground="#ffffff",
            font=(FONT_MAIN, 9, "bold"),
            relief="flat",
            cursor="hand2",
            pady=4,
        )
        self.btn_open_diag.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(4, 0))

        # Row 2 of actions: Shield Toggle, Flush, Refresh
        row2 = tk.Frame(actions_bar, bg=BG_MAIN)
        row2.pack(fill=tk.X)

        self.btn_shield = tk.Button(
            row2,
            text="🛡️ One-Click Shield",
            command=self._toggle_shield,
            bg="#27272a",
            fg=COLOR_TEXT,
            activebackground=COLOR_RED,
            activeforeground="#ffffff",
            font=(FONT_MAIN, 8, "bold"),
            relief="flat",
            cursor="hand2",
            pady=3,
        )
        self.btn_shield.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 3))

        self.btn_flush = tk.Button(
            row2,
            text="⚡ Flush Spool",
            command=self._flush_spool,
            bg="#1e2e4a",
            fg=COLOR_AMBER,
            activebackground="#2a3f65",
            activeforeground="#ffffff",
            font=(FONT_MAIN, 8, "bold"),
            relief="flat",
            cursor="hand2",
            pady=3,
        )
        self.btn_flush.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=3)

        self.btn_refresh = tk.Button(
            row2,
            text="⟳ Refresh",
            command=self._load_status,
            bg="#1e2e4a",
            fg=COLOR_TEXT_DIM,
            activebackground="#2a3f65",
            activeforeground="#ffffff",
            font=(FONT_MAIN, 8, "bold"),
            relief="flat",
            cursor="hand2",
            pady=3,
        )
        self.btn_refresh.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(3, 0))

    def _add_metric_row(self, parent: tk.Widget, label: str, default_val: str) -> tk.Label:
        row = tk.Frame(parent, bg=BG_CARD)
        row.pack(fill=tk.X, pady=2)

        tk.Label(
            row,
            text=label,
            font=(FONT_MAIN, 8),
            fg=COLOR_MUTED,
            bg=BG_CARD,
        ).pack(side=tk.LEFT)

        val_lbl = tk.Label(
            row,
            text=default_val,
            font=(FONT_MAIN, 8, "bold"),
            fg=COLOR_TEXT,
            bg=BG_CARD,
        )
        val_lbl.pack(side=tk.RIGHT)
        return val_lbl

    def _load_status(self) -> None:
        """Read latest status from JSON status file."""
        if _DEFAULT_STATUS_FILE.exists():
            try:
                data = json.loads(_DEFAULT_STATUS_FILE.read_text(encoding="utf-8"))
                self.last_status = data
                self._update_display(data)
                return
            except Exception as exc:
                logger.warning("status_read_failed", error=str(exc))

        # Fallback if service status file is missing
        self._update_display({
            "running": False,
            "connection_status": "AGENT OFFLINE",
            "shield_active": False,
            "collectors_healthy": 0,
            "spool": {"queued_events": 0},
            "recent_events": [],
        })

    def _update_display(self, data: dict[str, Any]) -> None:
        running = data.get("running", True)
        conn_st = data.get("connection_status", "ONLINE")
        self.shield_active = data.get("shield_active", False)

        # Connection pill
        if running and conn_st == "ONLINE":
            self.lbl_conn_pill.config(text="● ONLINE", fg=COLOR_GREEN, bg="#064e3b")
        elif conn_st == "OFFLINE_SPOOLING":
            self.lbl_conn_pill.config(text="● SPOOLING", fg=COLOR_AMBER, bg="#451a03")
        else:
            self.lbl_conn_pill.config(text=f"● {conn_st[:10]}", fg=COLOR_RED, bg="#450a0a")

        # Protection Card
        if self.shield_active:
            self.lbl_status_icon.config(text="🚨")
            self.lbl_protection_title.config(text="CONTAINMENT ACTIVE", fg=COLOR_RED)
            self.lbl_protection_desc.config(
                text="Host isolated from external networks. KAVACH telemetry tunnel maintained."
            )
            self.btn_shield.config(text="🚨 Deactivate Shield", bg=COLOR_RED, fg="#ffffff")
        elif running:
            self.lbl_status_icon.config(text="🛡️")
            self.lbl_protection_title.config(text="PROTECTED", fg=COLOR_GREEN)
            healthy = data.get("collectors_healthy", 16)
            self.lbl_protection_desc.config(
                text=f"{healthy} of 16 security sensors active. Telemetry pipeline operating normally."
            )
            self.btn_shield.config(text="🛡️ One-Click Shield", bg="#27272a", fg=COLOR_TEXT)
        else:
            self.lbl_status_icon.config(text="⚠️")
            self.lbl_protection_title.config(text="SERVICE STOPPED", fg=COLOR_AMBER)
            self.lbl_protection_desc.config(
                text="Telemetry service not responding. Click Diagnostics to inspect service."
            )

        self.lbl_last_sync.config(text=time.strftime("%H:%M:%S"))

        # Metrics
        host_name = data.get("host_id", socket.gethostname())
        self.lbl_m_host.config(text=host_name[:20])

        enrolled = data.get("enrolled", False)
        self.lbl_m_enroll.config(
            text="DPAPI Secured" if enrolled else "Unenrolled",
            fg=COLOR_GREEN if enrolled else COLOR_AMBER,
        )

        sensors_cnt = data.get("collectors_healthy", 16)
        self.lbl_m_sensors.config(text=f"{sensors_cnt}/16 Healthy")

        spool_cnt = data.get("spool", {}).get("queued_events", 0)
        self.lbl_m_spool.config(
            text=f"{spool_cnt} Queued" if spool_cnt > 0 else "0 (Synced)",
            fg=COLOR_AMBER if spool_cnt > 50 else COLOR_TEXT,
        )

        # Recent events
        for w in self.event_labels:
            w.destroy()
        self.event_labels.clear()

        recents = data.get("recent_events", [])
        if recents:
            for evt in recents[-3:]:
                row = tk.Frame(self.events_box, bg=BG_CARD)
                row.pack(fill=tk.X, pady=2)
                self.event_labels.append(row)

                tier = str(evt.get("tier", "INFO")).upper()
                tier_color = COLOR_RED if tier in ("CRITICAL", "HIGH") else COLOR_BLUE

                tk.Label(
                    row,
                    text=f"[{tier[:4]}]",
                    font=(FONT_MAIN, 7, "bold"),
                    fg=tier_color,
                    bg=BG_CARD,
                ).pack(side=tk.LEFT)

                col_name = evt.get("collector", "sys")
                summary = evt.get("summary", "Security event recorded")
                tk.Label(
                    row,
                    text=f" {col_name}: {summary[:34]}",
                    font=(FONT_MAIN, 8),
                    fg=COLOR_TEXT_DIM,
                    bg=BG_CARD,
                ).pack(side=tk.LEFT, fill=tk.X)
        else:
            no_evt = tk.Label(
                self.events_box,
                text="No recent critical alerts. Host operating within security baselines.",
                font=(FONT_MAIN, 8),
                fg=COLOR_MUTED,
                bg=BG_CARD,
                wraplength=310,
                justify="left",
            )
            no_evt.pack(anchor="w", pady=4)
            self.event_labels.append(no_evt)

    def _auto_refresh(self) -> None:
        try:
            self._load_status()
            self.root.after(2000, self._auto_refresh)
        except Exception:
            pass

    def _on_focus_out(self, event: Any) -> None:
        # Check if the active window is still within this popup
        try:
            focused = self.root.focus_get()
            if focused is None:
                self.root.destroy()
        except Exception:
            self.root.destroy()

    def _toggle_shield(self) -> None:
        action = "DISABLE_SHIELD" if self.shield_active else "ENABLE_SHIELD"
        _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
        _DEFAULT_CMD_FILE.write_text(json.dumps({"action": action}), encoding="utf-8")
        time.sleep(0.3)
        self._load_status()

    def _flush_spool(self) -> None:
        _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
        _DEFAULT_CMD_FILE.write_text(json.dumps({"action": "FLUSH_SPOOL"}), encoding="utf-8")
        self.lbl_m_spool.config(text="Flushing...", fg=COLOR_AMBER)

    def _launch_detailed_companion(self) -> None:
        """Launch the expandable detailed companion diagnostics window."""
        self.root.destroy()
        companion_script = _BACKEND_ROOT / "app" / "agent" / "companion.py"
        subprocess.Popen([sys.executable, str(companion_script)])

    def _launch_flutter_app(self) -> None:
        """Launch or bring to foreground the Flutter Windows application."""
        exe_candidate = _BACKEND_ROOT.parent / "mobile" / "build" / "windows" / "x64" / "runner" / "Release" / "kavach.exe"
        if exe_candidate.exists():
            subprocess.Popen([str(exe_candidate)])
        else:
            # Launch via flutter run if release build not yet generated
            mobile_dir = _BACKEND_ROOT.parent / "mobile"
            subprocess.Popen(["flutter", "run", "-d", "windows"], cwd=str(mobile_dir), shell=True)


def show_compact_popup() -> None:
    root = tk.Tk()
    app = KavachCompactPopup(root)
    root.focus_force()
    root.mainloop()


if __name__ == "__main__":
    show_compact_popup()
