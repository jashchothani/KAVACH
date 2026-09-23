#!/usr/bin/env python3
"""
KAVACH — Frontend Dev Runner.

Starts the Vite React application on port 5173.
"""

import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    if not FRONTEND_DIR.exists():
        print(f"Error: Frontend directory not found at {FRONTEND_DIR}")
        sys.exit(1)

    os.chdir(FRONTEND_DIR)
    if sys.platform == "win32" and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

    print(r"""
    +-------------------------------------------------------------+
    |   K A V A C H -- SOC Web Frontend                           |
    |   Dashboard: http://localhost:5173                          |
    +-------------------------------------------------------------+
    """)

    cmd = "npm run dev" if os.name != "nt" else "npm.cmd run dev"
    try:
        subprocess.run(cmd, shell=True, check=True)
    except KeyboardInterrupt:
        print("\nFrontend stopped cleanly.")

if __name__ == "__main__":
    main()
