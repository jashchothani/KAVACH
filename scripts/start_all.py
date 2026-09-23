#!/usr/bin/env python3
"""
KAVACH — Master Orchestrator.

Starts both Backend (:8000) and Frontend (:5173) in unison with
process monitoring, unified logging, and graceful shutdown handling.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    if sys.platform == "win32" and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

    print(r"""
    +-------------------------------------------------------------+
    |                                                             |
    |   K A V A C H                                               |
    |   Intelligent Cybersecurity & Threat Response Platform      |
    |                                                             |
    |   Backend API:    http://localhost:8000                     |
    |   Frontend SOC:   http://localhost:5173                     |
    |   API Docs:       http://localhost:8000/docs                |
    |   ML Engine:      Isolation Forest                          |
    |   AI Assistant:   Raksha AI                                 |
    |                                                             |
    |   KAVACH is starting...                                     |
    +-------------------------------------------------------------+
    """)

    backend_cmd = [sys.executable, str(ROOT_DIR / "scripts" / "start_backend.py")]
    frontend_cmd = "npm run dev" if os.name != "nt" else "npm.cmd run dev"

    backend_proc = None
    frontend_proc = None

    try:
        # 1. Start Backend
        print("[+] Launching KAVACH Backend (:8000)...")
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=BACKEND_DIR,
        )

        time.sleep(2.0)

        # 2. Start Frontend
        print("[+] Launching KAVACH Frontend (:5173)...")
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=FRONTEND_DIR,
            shell=True,
        )

        print("\n[+] Both KAVACH services running. Press Ctrl+C to terminate all services.\n")

        while True:
            time.sleep(1.0)
            if backend_proc.poll() is not None:
                print("[-] Backend process terminated.")
                break
            if frontend_proc.poll() is not None:
                print("[-] Frontend process terminated.")
                break

    except KeyboardInterrupt:
        print("\n[!] Shutting down all KAVACH services...")
    finally:
        if backend_proc and backend_proc.poll() is None:
            backend_proc.terminate()
        if frontend_proc and frontend_proc.poll() is None:
            frontend_proc.terminate()
        print("[+] All services stopped cleanly.")

if __name__ == "__main__":
    main()
