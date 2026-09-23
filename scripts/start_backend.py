#!/usr/bin/env python3
"""
KAVACH — Independent Backend Runner.

Starts FastAPI, collectors, telemetry pipeline, ML anomaly detector,
database, and WebSockets on port 8000 without requiring the React frontend.
"""

import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

def main():
    os.chdir(BACKEND_DIR)
    sys.path.insert(0, str(BACKEND_DIR))

    if sys.platform == "win32" and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

    from app.core.config import get_settings
    settings = get_settings()

    print(rf"""
    +-------------------------------------------------------------+
    |                                                             |
    |   K A V A C H                                               |
    |   Backend Security & Response Engine                        |
    |                                                             |
    |   API URL:       http://{settings.backend_host}:{settings.backend_port}                     |
    |   Documentation: http://{settings.backend_host}:{settings.backend_port}/docs                |
    |   Health:        http://{settings.backend_host}:{settings.backend_port}/api/v1/health       |
    |   Assistant:     Raksha AI                                  |
    |                                                             |
    |   Mode: Independent Standalone Backend (Frontend Optional)   |
    +-------------------------------------------------------------+
    """)

    import uvicorn
    uvicorn.run(
        "app.main:create_app",
        factory=True,
        host=settings.backend_host,
        port=settings.backend_port,
        reload=False,
        log_level="info",
    )

if __name__ == "__main__":
    main()
