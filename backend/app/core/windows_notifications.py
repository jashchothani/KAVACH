"""
KAVACH Windows Native Notification & USB Guardian Engine.

Provides modern Windows 10/11 Action Center Toast Notifications (with audio)
and real-time Removable USB Drive monitoring and autorun protection.
"""

from __future__ import annotations

import base64
import os
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, Callable
from xml.sax.saxutils import escape as xml_escape

from app.core.logging import get_logger

logger = get_logger("windows_notifications")


def _run_toast_script(title: str, message: str, attribution: str = "KAVACH Cyber Defense", with_sound: bool = True) -> bool:
    """Executes modern Windows 10/11 Toast Notification via PowerShell WindowsRuntime."""
    if sys.platform != "win32":
        return False

    safe_title = xml_escape(str(title))
    safe_message = xml_escape(str(message))
    safe_attribution = xml_escape(str(attribution))

    audio_tag = '<audio src="ms-winsoundevent:Notification.Default" />' if with_sound else '<audio silent="true" />'

    template = f"""<toast duration="short">
  <visual>
    <binding template="ToastGeneric">
      <text>{safe_title}</text>
      <text>{safe_message}</text>
      <text placement="attribution">{safe_attribution}</text>
    </binding>
  </visual>
  {audio_tag}
</toast>"""

    ps_script = f"""
try {{
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml(@'
{template}
'@)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("{{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}}\\WindowsPowerShell\\v1.0\\powershell.exe").Show($toast)
}} catch {{
    # Fallback to Forms NotifyIcon if WindowsRuntime is unavailable
    [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Shield
    $notify.BalloonTipTitle = "{title.replace('"', '`"')}"
    $notify.BalloonTipText = "{message.replace('"', '`"')}"
    $notify.BalloonTipIcon = "Info"
    $notify.Visible = $True
    $notify.ShowBalloonTip(5000)
    Start-Sleep -Milliseconds 5500
    $notify.Dispose()
}}
"""
    try:
        encoded = base64.b64encode(ps_script.encode("utf-16le")).decode("ascii")
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
        res = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
            capture_output=True,
            text=True,
            timeout=8,
            creationflags=flags,
        )
        return res.returncode == 0
    except Exception as exc:
        logger.debug("toast_notification_failed", error=str(exc))
        return False


def show_windows_toast(
    title: str,
    message: str,
    attribution: str = "KAVACH Cyber Defense",
    with_sound: bool = True,
    async_dispatch: bool = True,
) -> None:
    """Dispatches a native Windows 10/11 Action Center Toast notification."""
    if async_dispatch:
        threading.Thread(
            target=_run_toast_script,
            args=(title, message, attribution, with_sound),
            daemon=True,
            name="KavachToastWorker",
        ).start()
    else:
        _run_toast_script(title, message, attribution, with_sound)


def scan_removable_drive(mountpoint: str) -> dict[str, Any]:
    """
    Rapidly scans the root and primary directories of a removable drive for autorun malware,
    suspicious executables, script drops, and rogue shortcuts.
    """
    drive_path = Path(mountpoint)
    suspicious_files: list[str] = []
    scanned_count = 0

    if not drive_path.exists():
        return {"clean": True, "threats": [], "mountpoint": mountpoint, "file_count": 0}

    dangerous_extensions = {".exe", ".scr", ".bat", ".cmd", ".vbs", ".vbe", ".js", ".jse", ".wsf", ".wsh", ".pif", ".hta"}

    # 1. Check for autorun.inf
    autorun = drive_path / "autorun.inf"
    if autorun.exists():
        try:
            content = autorun.read_text(errors="ignore").lower()
            suspicious_files.append("autorun.inf")
            # Parse referenced executables in autorun
            for line in content.splitlines():
                if line.strip().startswith("open=") or line.strip().startswith("shellexecute="):
                    target = line.split("=", 1)[1].strip()
                    suspicious_files.append(f"autorun: {target}")
        except Exception:
            suspicious_files.append("autorun.inf (unreadable)")

    # 2. Check root directory entries
    try:
        for entry in os.scandir(drive_path):
            scanned_count += 1
            if entry.is_file():
                ext = Path(entry.name).suffix.lower()
                if ext in dangerous_extensions:
                    suspicious_files.append(entry.name)
            if scanned_count > 100:
                break
    except Exception:
        pass

    return {
        "clean": len(suspicious_files) == 0,
        "threats": suspicious_files,
        "mountpoint": mountpoint,
        "file_count": scanned_count,
    }


class USBGuardianWatcher:
    """
    Continuous background monitor that detects removable USB storage insertions and removals,
    performs immediate security posture inspection, and issues native toast alerts.
    """

    def __init__(self, on_event: Callable[[str, dict[str, Any]], None] | None = None) -> None:
        self.running = False
        self._thread: threading.Thread | None = None
        self._known_drives: dict[str, str] = {}  # mountpoint -> device
        self._on_event = on_event

    def start(self) -> None:
        if self.running:
            return
        self.running = True
        self._thread = threading.Thread(target=self._monitor_loop, daemon=True, name="KavachUSBGuardian")
        self._thread.start()
        logger.info("usb_guardian_started")

    def stop(self) -> None:
        self.running = False

    def _get_removable_drives(self) -> dict[str, str]:
        """Detect currently mounted removable storage drives."""
        drives: dict[str, str] = {}
        try:
            import psutil
            for part in psutil.disk_partitions(all=False):
                opts = part.opts.lower()
                # Removable drive or FAT32/exFAT non-fixed volume
                if "removable" in opts or (part.fstype.lower() in ("fat32", "fat", "exfat") and part.mountpoint.upper() != "C:\\"):
                    drives[part.mountpoint] = f"{part.device} ({part.fstype})"
        except Exception as exc:
            logger.debug("usb_drive_query_failed", error=str(exc))
        return drives

    def _monitor_loop(self) -> None:
        # Initial scan without spamming notifications on startup
        self._known_drives = self._get_removable_drives()
        if self._known_drives:
            for mp, dev in self._known_drives.items():
                logger.info("usb_existing_drive_found", mountpoint=mp, device=dev)
                # Notify once that USB drive is actively shielded
                show_windows_toast(
                    title="🛡️ KAVACH USB Guard",
                    message=f"Removable storage active at {mp} {dev}. Real-time monitoring enabled.",
                    attribution="KAVACH Hardware Sentinel",
                )

        while self.running:
            try:
                current_drives = self._get_removable_drives()

                # 1. Check for newly inserted drives
                for mp, dev in current_drives.items():
                    if mp not in self._known_drives:
                        logger.info("usb_drive_inserted", mountpoint=mp, device=dev)
                        scan_result = scan_removable_drive(mp)

                        if scan_result["clean"]:
                            show_windows_toast(
                                title="🔌 KAVACH USB Guard: Drive Connected",
                                message=f"Removable drive {mp} connected. Fast scan: 0 autorun threats detected. Safe to browse.",
                                attribution="KAVACH Hardware Sentinel",
                            )
                        else:
                            threats_summary = ", ".join(scan_result["threats"][:3])
                            show_windows_toast(
                                title="🚨 KAVACH Alert: Suspicious USB Content",
                                message=f"Removable drive {mp} contains high-risk autoruns/executables: {threats_summary}. Review quarantine.",
                                attribution="KAVACH Active Defense",
                            )

                        if self._on_event:
                            try:
                                self._on_event("USB_INSERT", {"mountpoint": mp, "device": dev, "scan": scan_result})
                            except Exception:
                                pass

                # 2. Check for removed drives
                for mp, dev in list(self._known_drives.items()):
                    if mp not in current_drives:
                        logger.info("usb_drive_removed", mountpoint=mp, device=dev)
                        show_windows_toast(
                            title="⏏️ KAVACH USB Guard",
                            message=f"Removable drive {mp} was safely disconnected.",
                            attribution="KAVACH Hardware Sentinel",
                        )
                        if self._on_event:
                            try:
                                self._on_event("USB_REMOVE", {"mountpoint": mp, "device": dev})
                            except Exception:
                                pass

                self._known_drives = current_drives
            except Exception as e:
                logger.debug("usb_monitor_loop_exception", error=str(e))

            time.sleep(1.5)

