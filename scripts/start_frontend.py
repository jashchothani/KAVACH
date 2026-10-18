#!/usr/bin/env python3
"""
KAVACH — Pure HTML/CSS/JS Frontend Runner.

Serves kavach-frontend on port 5173 with clean URLs (no .html extensions in address bar),
301 redirects for any legacy .html paths, and reverse-proxying of /api/ to backend on port 8000.
"""

import http.server
import socketserver
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
HTML_FRONTEND_DIR = ROOT_DIR / "kavach-frontend"
BACKEND_API_URL = "http://127.0.0.1:8000"

CLEAN_ROUTES = {
    "": "index.html",
    "/": "index.html",
    "/index": "index.html",
    "/home": "index.html",
    "/dashboard": "user.html",
    "/user": "user.html",
    "/admin": "admin.html",
    "/soc": "soc.html",
    "/analyst": "soc.html",
    "/login": "login.html",
    "/user/login": "login.html",
    "/admin-login": "admin-login.html",
    "/admin/login": "admin-login.html",
    "/features": "features.html",
    "/how-it-works": "how-it-works.html",
    "/raksha": "raksha-ai.html",
    "/raksha-ai": "raksha-ai.html",
    "/about": "about.html",
    "/contact": "contact.html",
    "/download": "download.html",
    "/security": "security.html",
    "/privacy": "privacy.html",
    "/terms": "terms.html",
    "/get-started": "get-started.html",
}

# Module-level opener bypassing Windows WPAD / WinINet proxy detection for instant 127.0.0.1 forwarding
PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request Handler that rewrites clean URLs to HTML templates and proxies API calls."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HTML_FRONTEND_DIR), **kwargs)

    def proxy_to_backend(self, method: str):
        target_url = BACKEND_API_URL + self.path
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
        except Exception:
            body = None

        req_headers = {k: v for k, v in self.headers.items() if k.lower() not in ("host", "content-length")}
        req_headers["Host"] = "127.0.0.1:8000"

        req = urllib.request.Request(target_url, data=body, headers=req_headers, method=method)
        try:
            with PROXY_OPENER.open(req, timeout=45) as res:
                self.send_response(res.status)
                for k, v in res.getheaders():
                    if k.lower() not in ("transfer-encoding", "content-encoding", "access-control-allow-origin"):
                        self.send_header(k, v)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "*")
                self.end_headers()
                self.wfile.write(res.read())
        except urllib.error.HTTPError as e:
            try:
                self.send_response(e.code)
                for k, v in e.headers.items():
                    if k.lower() not in ("transfer-encoding", "content-encoding", "access-control-allow-origin"):
                        self.send_header(k, v)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(e.read())
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass
        except Exception as exc:
            try:
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b'{"detail":"Backend service unreachable on port 8000"}')
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass

    def do_GET(self):
        url_path = self.path.split('?')[0].split('#')[0]
        query = self.path[len(url_path):]

        # 0. Reverse proxy /api/ requests to FastAPI backend
        if url_path.startswith('/api/'):
            return self.proxy_to_backend('GET')

        # 0b. Serve verified release binaries with proper headers and zero HTML corruption
        if url_path.startswith('/releases/'):
            filename = os.path.basename(url_path)
            target_file = HTML_FRONTEND_DIR / "releases" / filename
            if not target_file.is_file():
                target_file = ROOT_DIR / "release" / filename

            if target_file.is_file():
                try:
                    file_size = target_file.stat().st_size
                    content_type = "application/octet-stream"
                    if filename.endswith(".exe"):
                        content_type = "application/x-msdownload"
                    elif filename.endswith(".apk"):
                        content_type = "application/vnd.android.package-archive"
                    elif filename.endswith(".zip"):
                        content_type = "application/zip"

                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Content-Length", str(file_size))
                    self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
                    self.send_header("Accept-Ranges", "bytes")
                    self.end_headers()

                    with open(target_file, "rb") as f:
                        while chunk := f.read(65536):
                            self.wfile.write(chunk)
                    return
                except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                    return
            else:
                self.send_response(404)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(b"404 Release artifact not found.")
                return

        # 1. 301 Redirect any legacy .html URL to clean URL (e.g., /dashboard.html -> /dashboard)
        if url_path.endswith('.html'):
            base = url_path[:-5]
            clean_target = "/" if base in ("/index", "/home") else base
            self.send_response(301)
            self.send_header('Location', clean_target + query)
            self.end_headers()
            return

        # 2. Check clean route mapping
        clean_norm = url_path.rstrip('/')
        if not clean_norm:
            clean_norm = "/"

        if clean_norm in CLEAN_ROUTES:
            self.path = "/" + CLEAN_ROUTES[clean_norm] + query
            return super().do_GET()

        # 3. Direct file check on disk (CSS, JS, SVG, etc.)
        rel_target = url_path.lstrip('/')
        fs_path = HTML_FRONTEND_DIR / rel_target
        if rel_target and fs_path.is_file():
            return super().do_GET()

        # 4. Check if appending .html matches a file on disk
        if rel_target and (HTML_FRONTEND_DIR / f"{rel_target}.html").is_file():
            self.path = f"/{rel_target}.html" + query
            return super().do_GET()

        # 5. Prevent returning HTML error pages for binary assets
        if any(url_path.endswith(ext) for ext in ('.exe', '.apk', '.zip', '.msi', '.bin', '.tar.gz')):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Binary file not found.")
            return

        # 6. Default 404 fallback for web pages
        p404 = HTML_FRONTEND_DIR / "404.html"
        if p404.is_file() and url_path not in ("/", ""):
            self.path = "/404.html"
            return super().do_GET()

        return super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            return self.proxy_to_backend('POST')
        self.send_response(405)
        self.end_headers()

    def do_PATCH(self):
        if self.path.startswith('/api/'):
            return self.proxy_to_backend('PATCH')
        self.send_response(405)
        self.end_headers()

    def do_DELETE(self):
        if self.path.startswith('/api/'):
            return self.proxy_to_backend('DELETE')
        self.send_response(405)
        self.end_headers()

    def do_OPTIONS(self):
        if self.path.startswith('/api/'):
            return self.proxy_to_backend('OPTIONS')
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()


def main():
    if not HTML_FRONTEND_DIR.exists():
        print(f"Error: Frontend directory not found at {HTML_FRONTEND_DIR}")
        sys.exit(1)

    port = 5173
    handler = CleanURLHandler
    socketserver.ThreadingTCPServer.allow_reuse_address = True

    with socketserver.ThreadingTCPServer(("0.0.0.0", port), handler) as httpd:
        print(rf"""
    +-------------------------------------------------------------+
    |   K A V A C H -- Pure HTML/CSS/JS Frontend (Clean URLs)     |
    |   User Portal:  http://localhost:{port}/dashboard             |
    |   Admin Portal: http://localhost:{port}/analyst               |
    |   Admin Login:  http://localhost:{port}/admin-login           |
    |   User Login:   http://localhost:{port}/login                 |
    +-------------------------------------------------------------+
        """)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nFrontend server stopped cleanly.")


if __name__ == "__main__":
    main()
