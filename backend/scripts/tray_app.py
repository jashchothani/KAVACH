"""
KAVACH Lightweight Native Notification System Tray Listener.

Listens to real-time events over the KAVACH live WebSocket and dispatches native Windows notifications.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
import tkinter as tk
from tkinter import messagebox
from threading import Thread

# Ensure websockets library is imported
try:
    import websockets
except ImportError:
    print("[!] websockets library not found. Please install: pip install websockets")
    sys.exit(1)


def show_native_notification(title: str, message: str, severity: str = "info") -> None:
    """Dispatches a native Windows notification balloon/toast via PowerShell."""
    print(f"[*] Dispatching Notification: [{severity.upper()}] {title} - {message}")
    
    # Escape single quotes in message and title for PowerShell compatibility
    safe_title = title.replace("'", "''")
    safe_message = message.replace("'", "''")
    
    # Map severity to system icons
    icon_map = {
        "critical": "Error",
        "high": "Warning",
        "medium": "Warning",
        "info": "Info",
        "low": "Info"
    }
    system_icon = icon_map.get(severity.lower(), "Info")
    
    # PowerShell command to show a notify icon balloon tip
    powershell_code = f"""
    [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms");
    $objNotification = New-Object System.Windows.Forms.NotifyIcon;
    $objNotification.Icon = [System.Drawing.SystemIcons]::Information;
    $objNotification.BalloonTipIcon = "{system_icon}";
    $objNotification.BalloonTipText = "{safe_message}";
    $objNotification.BalloonTipTitle = "{safe_title}";
    $objNotification.Visible = $True;
    $objNotification.ShowBalloonTip(10000);
    """
    
    try:
        subprocess.run(
            ["powershell", "-Command", powershell_code],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
    except Exception as exc:
        print(f"[!] Failed to show native notification: {exc}")


async def ws_listener_loop() -> None:
    """Listens to KAVACH alerts WebSocket and processes events."""
    ws_url = "ws://localhost:8000/api/v1/dashboard/live"
    print(f"[*] Connecting to live alert WebSocket: {ws_url}")
    
    while True:
        try:
            async with websockets.connect(ws_url) as ws:
                print("[+] Connected to KAVACH WebSocket stream successfully.")
                show_native_notification("KAVACH Protection Active", "Endpoint security monitor is listening for events.", "info")
                
                async for message in ws:
                    try:
                        data = json.loads(message)
                        event_type = data.get("event_type", "alert")
                        severity = data.get("severity", "info")
                        title = data.get("title", "Security Alert")
                        desc = data.get("description", "A telemetry anomaly was detected.")
                        
                        # Filter to interesting events: FIM, USB, ransomware, process alerts
                        is_fim = "fim" in title.lower() or "file" in event_type
                        is_usb = "usb" in title.lower() or "usb" in event_type
                        is_ransomware = "ransomware" in title.lower() or "ransomware" in event_type
                        is_high_risk = severity in ("critical", "high")
                        
                        if is_fim or is_usb or is_ransomware or is_high_risk:
                            show_native_notification(
                                title=f"🚨 KAVACH: {title}",
                                message=desc,
                                severity=severity
                            )
                    except Exception as e:
                        print(f"[!] Error parsing WebSocket message: {e}")
        except Exception as e:
            print(f"[!] WebSocket disconnected or connection failed: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)


def start_listener_thread() -> None:
    """Runs the asyncio WebSocket listener loop in a background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(ws_listener_loop())


def run_tray_ui() -> None:
    """Builds a simple Tkinter window serving as the System Tray Controller."""
    root = tk.Tk()
    root.title("KAVACH System Tray Guardian")
    root.geometry("300x120")
    root.resizable(False, False)
    
    # Hide window on minimize
    def on_closing():
        root.withdraw()
        show_native_notification("KAVACH Guardian Status", "KAVACH is still running actively in the background.", "info")

    root.protocol("WM_DELETE_WINDOW", on_closing)
    
    label = tk.Label(root, text="KAVACH Protection Active", font=("Helvetica", 12, "bold"), fg="#10b981")
    label.pack(pady=15)
    
    sub = tk.Label(root, text="Listening for USB, File, and Endpoint threats...", font=("Helvetica", 9))
    sub.pack()
    
    btn_close = tk.Button(root, text="Hide to Background", command=on_closing, bg="#30363d", fg="#ffffff", relief="flat", padx=10, pady=5)
    btn_close.pack(pady=10)
    
    # Start WebSocket listener in the background
    listener_thread = Thread(target=start_listener_thread, daemon=True)
    listener_thread.start()
    
    print("[*] Launching KAVACH System Tray GUI...")
    root.mainloop()


if __name__ == "__main__":
    # If run with --headless argument, bypass Tkinter UI
    if "--headless" in sys.argv:
        asyncio.run(ws_listener_loop())
    else:
        try:
            run_tray_ui()
        except Exception as e:
            print(f"[!] GUI failed to load, running in headless mode: {e}")
            asyncio.run(ws_listener_loop())
