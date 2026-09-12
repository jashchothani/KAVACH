"""
KAVACH — AI-Driven SOAR-XDR Threat Intelligence & Response Platform.

Main entry point. Starts the FastAPI backend with Uvicorn.

Usage:
    python main.py                  # Start backend server
    python main.py --no-collectors  # Run API & Web UI without telemetry collectors
    python main.py --port 8000      # Custom port
    uvicorn main:app --reload       # Direct ASGI runner
"""

from __future__ import annotations

import argparse
import sys
import os

# Ensure backend/ is on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from api.app import create_app

# Module-level ASGI app for uvicorn (e.g. `uvicorn main:app`)
app = create_app()


def main() -> None:
    """Parse arguments and start the KAVACH backend."""
    parser = argparse.ArgumentParser(
        description="KAVACH SOAR-XDR Backend Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--workers", type=int, default=1, help="Number of workers")
    parser.add_argument("--log-level", default="info", help="Log level")
    parser.add_argument(
        "--no-collectors",
        action="store_true",
        help="Run only the API and HTML server; keep telemetry collectors in a separate process",
    )
    args = parser.parse_args()

    if args.no_collectors:
        os.environ["COLLECTORS_ENABLED"] = "false"

    import uvicorn

    print(r"""
    +-----------------------------------------------------------+
    |                                                           |
    |   K A V A C H                                             |
    |   AI-Driven SOAR-XDR Threat Intelligence & Response       |
    |   Platform v1.0.0                                         |
    |                                                           |
    |   Docs:  http://localhost:{port}/docs                      |
    |   API:   http://localhost:{port}/api/v1                    |
    |   Cockpit: http://localhost:{port}/                        |
    |                                                           |
    +-----------------------------------------------------------+
    """.format(port=args.port))

    uvicorn.run(
        "api.app:create_app",
        factory=True,
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
