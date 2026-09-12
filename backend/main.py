"""
KAVACH — AI-Driven SOAR-XDR Threat Intelligence & Response Platform.

Main entry point. Starts the FastAPI backend with Uvicorn.

Usage:
    python main.py                  # Start backend server on port 8000
    python main.py --no-collectors  # Run API without telemetry collectors
    python main.py --no-ml          # Run with ML anomaly detector disabled
    python main.py --port 8000      # Custom port
    uvicorn app.main:app --reload   # Direct ASGI runner
"""

from __future__ import annotations

import argparse
import sys
import os
from pathlib import Path

# Ensure backend/ and backend/app/ are on python path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.main import create_app

# Module-level ASGI app for uvicorn (e.g. `uvicorn main:app`)
app = create_app()


def main() -> None:
    """Parse arguments and start the KAVACH backend independently."""
    parser = argparse.ArgumentParser(
        description="KAVACH SOAR-XDR Backend Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument("--log-level", default="info", help="Log level (debug, info, warning, error)")
    parser.add_argument(
        "--no-collectors",
        action="store_true",
        help="Run without background telemetry collectors",
    )
    parser.add_argument(
        "--no-ml",
        action="store_true",
        help="Run with machine learning anomaly detection disabled",
    )
    args = parser.parse_args()

    if args.no_collectors:
        os.environ["COLLECTOR_ENABLED"] = "false"
    if args.no_ml:
        os.environ["ML_ENABLED"] = "false"

    import uvicorn

    banner = rf"""
    ╔═════════════════════════════════════════════════════════════╗
    ║                                                             ║
    ║   K A V A C H                                               ║
    ║   Intelligent Cybersecurity & Threat Response Platform      ║
    ║                                                             ║
    ║   Backend API:    http://{args.host}:{args.port}                     ║
    ║   API Docs:       http://{args.host}:{args.port}/docs                ║
    ║   Health Check:   http://{args.host}:{args.port}/api/v1/health       ║
    ║   AI Assistant:   Raksha AI                                 ║
    ║   ML Engine:      Isolation Forest                          ║
    ║                                                             ║
    ╚═════════════════════════════════════════════════════════════╝
    """
    print(banner)

    uvicorn.run(
        "app.main:create_app",
        factory=True,
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
