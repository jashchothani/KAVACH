"""
KAVACH Windows System Tray Application.

Native Windows notification area icon and background companion launcher.
Features:
- Windows Shell NotifyIcon integration via pywin32 with multi-resolution icon loading.
- Single-instance mutex enforcement.
- Left-click: High-DPI compact native status popup above taskbar.
- Double-click: Expandable detailed companion diagnostics window.
- Right-click tray menu:
  * Quick Status Panel
  * Open KAVACH App (Flutter Desktop)
  * Detailed Diagnostics (Companion)
  * One-Click Containment Shield toggle
  * Spool flush trigger
  * Balloon notification inspection
  * Clean tray exit
- Dynamic health monitor and tooltip updates.
- Zero duplicate collector processes.
"""

from __future__ import annotations

import json
import os
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

from app.agent.service import _DEFAULT_CMD_FILE, _DEFAULT_STATUS_FILE
from app.core.logging import get_logger
from app.core.windows_notifications import show_windows_toast, USBGuardianWatcher, scan_removable_drive

logger = get_logger("kavach_tray")

# Win32 Constants
WM_TRAY_CALLBACK = 0x0400 + 20  # WM_USER + 20
WM_LBUTTONDBLCLK = 0x0203
WM_RBUTTONUP = 0x0205
WM_LBUTTONUP = 0x0202

ID_TRAY_STATUS_POPUP = 1001
ID_TRAY_OPEN_APP = 1002
ID_TRAY_OPEN_DIAG = 1003
ID_TRAY_SHIELD = 1004
ID_TRAY_FLUSH = 1005
ID_TRAY_BALLOON = 1006
ID_TRAY_EXIT = 1007


class KavachSystemTray:
    """Windows Shell System Tray Icon manager."""

    MUTEX_NAME = "Global\\KAVACH_SYSTEM_TRAY_SINGLE_INSTANCE"

    def __init__(self) -> None:
        self.hwnd: int | None = None
        self.running = False
        self._mutex: Any = None
        self._compact_process: subprocess.Popen | None = None
        self._gui_process: subprocess.Popen | None = None
        self._app_process: subprocess.Popen | None = None
        self._last_shield_state = False
        self._usb_watcher: USBGuardianWatcher | None = None

    def start(self) -> None:
        """Create hidden window and register tray notification icon with single-instance mutex."""
        try:
            import win32api
            import win32con
            import win32event
            import win32gui
            import winerror
        except ImportError:
            logger.error("pywin32_not_installed", message="win32gui is required for system tray support.")
            print("[!] pywin32 is required for native system tray integration. Launching Companion GUI directly.")
            self._launch_companion_gui()
            return

        # Enforce single-instance for the tray guardian
        try:
            self._mutex = win32event.CreateMutex(None, False, self.MUTEX_NAME)
            if win32api.GetLastError() == winerror.ERROR_ALREADY_EXISTS:
                logger.warning("tray_already_running", message="Another instance of KAVACH System Tray is already active.")
                print("[*] KAVACH System Tray is already running in the notification area.")
                return
        except Exception as exc:
            logger.warning("mutex_init_failed", error=str(exc))

        self.running = True

        # Register Window Class
        wc = win32gui.WNDCLASS()
        hinst = wc.hInstance = win32api.GetModuleHandle(None)
        wc.lpszClassName = "KavachTrayWndClass"
        wc.lpfnWndProc = self._wnd_proc
        try:
            class_atom = win32gui.RegisterClass(wc)
        except Exception:
            class_atom = win32gui.GetClassInfo(hinst, "KavachTrayWndClass")

        # Create message-only window
        self.hwnd = win32gui.CreateWindow(
            class_atom,
            "KavachTrayHiddenWnd",
            0,
            0,
            0,
            win32con.CW_USEDEFAULT,
            win32con.CW_USEDEFAULT,
            0,
            0,
            hinst,
            None,
        )

        # Load official KAVACH shield icon, falling back to IDI_SHIELD
        self.hicon = 0
        icon_candidates = [
            _BACKEND_ROOT.parent / "assets" / "kavach.ico",
            Path(sys.executable).resolve().parents[2] / "assets" / "kavach.ico",
            Path("assets/kavach.ico"),
        ]
        for p in icon_candidates:
            if p.exists():
                try:
                    self.hicon = win32gui.LoadImage(
                        0,
                        str(p),
                        win32con.IMAGE_ICON,
                        16,
                        16,
                        win32con.LR_LOADFROMFILE | win32con.LR_DEFAULTCOLOR,
                    )
                    if self.hicon:
                        break
                except Exception:
                    pass
        if not self.hicon:
            try:
                self.hicon = win32gui.LoadIcon(0, win32con.IDI_SHIELD)
            except Exception:
                self.hicon = win32gui.LoadIcon(0, win32con.IDI_APPLICATION)

        # Add Notify Icon
        flags = win32gui.NIF_ICON | win32gui.NIF_MESSAGE | win32gui.NIF_TIP
        nid = (self.hwnd, 0, flags, WM_TRAY_CALLBACK, self.hicon, "KAVACH Cyber Defense — Active")
        win32gui.Shell_NotifyIcon(win32gui.NIM_ADD, nid)

        logger.info("kavach_system_tray_registered")

        # Start USB Guardian watcher for hardware storage events
        self._usb_watcher = USBGuardianWatcher(on_event=self._on_usb_event)
        self._usb_watcher.start()

        # Initial active notification
        show_windows_toast(
            title="🛡️ KAVACH System Tray Guardian",
            message="Active defense is running. Real-time endpoint, USB, and memory sentinel enabled.",
            attribution="KAVACH Cyber Defense",
        )

        # Start background monitor thread for balloon tips and dynamic tooltip
        threading.Thread(target=self._monitor_agent_status, daemon=True).start()

        # Run Windows message loop
        win32gui.PumpMessages()

    def _on_usb_event(self, event_type: str, details: dict[str, Any]) -> None:
        logger.info("tray_usb_event", event_type=event_type, details=details)

    def _check_usb_now(self) -> None:
        try:
            import psutil
            for part in psutil.disk_partitions(all=False):
                if "removable" in part.opts.lower() or (part.fstype.lower() in ("fat32", "fat", "exfat") and part.mountpoint.upper() != "C:\\"):
                    scan = scan_removable_drive(part.mountpoint)
                    if scan["clean"]:
                        show_windows_toast(
                            title="🔌 KAVACH USB Guard: Drive Connected",
                            message=f"Removable drive {part.mountpoint} verified safe. 0 autorun threats detected.",
                            attribution="KAVACH Hardware Sentinel",
                        )
                    else:
                        show_windows_toast(
                            title="🚨 KAVACH Alert: Suspicious USB Content",
                            message=f"Removable drive {part.mountpoint} contains suspicious files: {', '.join(scan['threats'][:3])}",
                            attribution="KAVACH Active Defense",
                        )
                    break
        except Exception:
            pass

    def _wnd_proc(self, hwnd: int, msg: int, wparam: int, lparam: int) -> int:
        import win32con
        import win32gui

        # Hardware device change event (USB insertion / removal)
        WM_DEVICECHANGE = 0x0219
        DBT_DEVICEARRIVAL = 0x8000
        DBT_DEVICEREMOVECOMPLETE = 0x8004
        if msg == WM_DEVICECHANGE:
            if wparam in (DBT_DEVICEARRIVAL, 0x0007):
                threading.Thread(target=self._check_usb_now, daemon=True).start()
            return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

        if msg == WM_TRAY_CALLBACK:
            if lparam == WM_LBUTTONUP:
                # Single click: show compact native status panel
                self._show_compact_popup()
            elif lparam == WM_LBUTTONDBLCLK:
                # Double click: open expandable detailed diagnostics window
                self._launch_companion_gui()
            elif lparam == WM_RBUTTONUP:
                # Right click: show full tray context menu
                self._show_context_menu()
            return 0
        elif msg == win32con.WM_COMMAND:
            cmd = win32gui.LOWORD(wparam)
            if cmd == ID_TRAY_STATUS_POPUP:
                self._show_compact_popup()
            elif cmd == ID_TRAY_OPEN_APP:
                self._launch_flutter_app()
            elif cmd == ID_TRAY_OPEN_DIAG:
                self._launch_companion_gui()
            elif cmd == ID_TRAY_SHIELD:
                self._toggle_shield()
            elif cmd == ID_TRAY_FLUSH:
                self._flush_spool()
            elif cmd == ID_TRAY_BALLOON:
                self._show_status_balloon()
            elif cmd == ID_TRAY_EXIT:
                self._exit_tray()
            return 0
        elif msg == win32con.WM_DESTROY:
            nid = (self.hwnd, 0)
            win32gui.Shell_NotifyIcon(win32gui.NIM_DELETE, nid)
            win32gui.PostQuitMessage(0)
            return 0

        return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

    def _show_context_menu(self) -> None:
        import win32con
        import win32gui

        menu = win32gui.CreatePopupMenu()
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_STATUS_POPUP, "⚡ Quick Status Panel")
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_OPEN_APP, "🛡️ Open KAVACH App")
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_OPEN_DIAG, "🔍 Detailed Diagnostics")
        win32gui.AppendMenu(menu, win32con.MF_SEPARATOR, 0, "")

        shield_txt = "🚨 Deactivate One-Click Shield" if self._last_shield_state else "🛡️ Engage One-Click Shield"
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_SHIELD, shield_txt)
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_FLUSH, "⚡ Flush Spool to Cloud")
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_BALLOON, "ℹ️ Quick Balloon Status")
        win32gui.AppendMenu(menu, win32con.MF_SEPARATOR, 0, "")
        win32gui.AppendMenu(menu, win32con.MF_STRING, ID_TRAY_EXIT, "❌ Exit Tray Guardian")

        pos = win32gui.GetCursorPos()
        win32gui.SetForegroundWindow(self.hwnd)
        win32gui.TrackPopupMenu(menu, win32con.TPM_LEFTALIGN, pos[0], pos[1], 0, self.hwnd, None)
        win32gui.PostMessage(self.hwnd, win32con.WM_NULL, 0, 0)

    def _show_compact_popup(self) -> None:
        """Launch or bring to foreground the compact native status popup without opening a CMD window."""
        if self._compact_process and self._compact_process.poll() is None:
            return  # Already open

        popup_script = _BACKEND_ROOT / "app" / "agent" / "compact_popup.py"
        python_exe = sys.executable.replace("python.exe", "pythonw.exe")
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000) if sys.platform == "win32" else 0
        self._compact_process = subprocess.Popen([python_exe, str(popup_script)], creationflags=flags)

    def _launch_companion_gui(self) -> None:
        """Launch or bring to foreground the detailed expandable Companion GUI silently."""
        if self._gui_process and self._gui_process.poll() is None:
            return  # Already running

        companion_script = _BACKEND_ROOT / "app" / "agent" / "companion.py"
        python_exe = sys.executable.replace("python.exe", "pythonw.exe")
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000) if sys.platform == "win32" else 0
        self._gui_process = subprocess.Popen([python_exe, str(companion_script)], creationflags=flags)

    def _launch_flutter_app(self) -> None:
        """Launch or bring to foreground the Flutter Desktop application."""
        if self._app_process and self._app_process.poll() is None:
            return

        exe_candidate = _BACKEND_ROOT.parent / "mobile" / "build" / "windows" / "x64" / "runner" / "Release" / "kavach.exe"
        if exe_candidate.exists():
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000) if sys.platform == "win32" else 0
            self._app_process = subprocess.Popen([str(exe_candidate)], creationflags=flags)
        else:
            mobile_dir = _BACKEND_ROOT.parent / "mobile"
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000) if sys.platform == "win32" else 0
            self._app_process = subprocess.Popen(["flutter", "run", "-d", "windows"], cwd=str(mobile_dir), shell=True, creationflags=flags)

    def _toggle_shield(self) -> None:
        action = "DISABLE_SHIELD" if self._last_shield_state else "ENABLE_SHIELD"
        _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
        _DEFAULT_CMD_FILE.write_text(json.dumps({"action": action}), encoding="utf-8")
        self._notify_balloon(
            "KAVACH Active Defense",
            f"Command queued: {action}. Updating endpoint containment posture.",
        )

    def _flush_spool(self) -> None:
        _DEFAULT_CMD_FILE.parent.mkdir(parents=True, exist_ok=True)
        _DEFAULT_CMD_FILE.write_text(json.dumps({"action": "FLUSH_SPOOL"}), encoding="utf-8")
        self._notify_balloon("KAVACH Telemetry", "Immediate spool flush signaled to Cloud Gateway.")

    def _show_status_balloon(self) -> None:
        if _DEFAULT_STATUS_FILE.exists():
            try:
                data = json.loads(_DEFAULT_STATUS_FILE.read_text(encoding="utf-8"))
                st = data.get("connection_status", "UNKNOWN")
                sensors = data.get("collectors_healthy", 16)
                spool = data.get("spool", {}).get("queued_events", 0)
                msg = f"Status: {st}\nActive Sensors: {sensors}/16\nSpool Queue: {spool} events"
                self._notify_balloon("KAVACH Health Posture", msg)
            except Exception:
                self._notify_balloon("KAVACH Health Posture", "Endpoint agent running.")
        else:
            self._notify_balloon("KAVACH Health Posture", "Agent is not currently running.")

    def _notify_balloon(self, title: str, text: str) -> None:
        """Display Windows Action Center toast notification."""
        show_windows_toast(title, text, attribution="KAVACH Cyber Defense")

    def _monitor_agent_status(self) -> None:
        """Poll status file and track changes to update tray tooltips and state."""
        import win32gui

        while self.running:
            try:
                if _DEFAULT_STATUS_FILE.exists():
                    data = json.loads(_DEFAULT_STATUS_FILE.read_text(encoding="utf-8"))
                    self._last_shield_state = data.get("shield_active", False)
                    conn_st = data.get("connection_status", "ONLINE")

                    tip = f"KAVACH: {conn_st} ({'SHIELDED' if self._last_shield_state else 'PROTECTED'})"
                    flags = win32gui.NIF_TIP
                    nid = (self.hwnd, 0, flags, 0, 0, tip[:63])
                    win32gui.Shell_NotifyIcon(win32gui.NIM_MODIFY, nid)
            except Exception:
                pass
            time.sleep(3.0)

    def _exit_tray(self) -> None:
        import win32gui

        self.running = False
        if self._usb_watcher:
            self._usb_watcher.stop()
        if self.hwnd:
            win32gui.DestroyWindow(self.hwnd)


def main() -> None:
    tray = KavachSystemTray()
    tray.start()


if __name__ == "__main__":
    main()
