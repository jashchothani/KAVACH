#!/usr/bin/env python3
"""
KAVACH — System Health & Diagnostics Utility.

Queries all five health endpoints and prints a structured console status table.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"

ENDPOINTS = [
    ("Overall Health", f"{BASE_URL}/health"),
    ("Database", f"{BASE_URL}/health/database"),
    ("Collectors", f"{BASE_URL}/health/collectors"),
    ("ML Engine", f"{BASE_URL}/health/ml"),
    ("Raksha AI", f"{BASE_URL}/health/ai"),
]

def check_endpoint(name: str, url: str) -> dict:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "KAVACH-HealthCheck/1.0"})
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {"name": name, "status": "ONLINE", "http_code": resp.status, "data": data}
    except urllib.error.HTTPError as e:
        return {"name": name, "status": "DEGRADED", "http_code": e.code, "error": str(e)}
    except urllib.error.URLError as e:
        return {"name": name, "status": "OFFLINE", "http_code": 0, "error": "Connection refused"}

def main():
    if sys.platform == "win32" and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

    print(r"""
    +-------------------------------------------------------------+
    |   K A V A C H -- Diagnostic Health Inspection               |
    +-------------------------------------------------------------+
    """)

    all_healthy = True
    print(f"{'SUBSYSTEM':<20} | {'STATUS':<10} | {'DETAILS'}")
    print("-" * 65)

    for name, url in ENDPOINTS:
        res = check_endpoint(name, url)
        status = res["status"]
        if status != "ONLINE":
            all_healthy = False

        details = ""
        if "data" in res:
            d = res["data"]
            if name == "Overall Health":
                details = f"DB: {d.get('database')}, Collectors: {d.get('collectors')}, ML: {d.get('ml')}"
            elif name == "Database":
                counts = d.get("counts", {})
                details = f"Events: {counts.get('events', 0)}, Alerts: {counts.get('alerts', 0)}"
            elif name == "ML Engine":
                details = f"Fitted: {d.get('is_fitted')}, Version: {d.get('version', 'None')}"
            elif name == "Raksha AI":
                details = f"Provider: {d.get('name')}, Fallback: {d.get('is_offline_fallback')}"
            else:
                details = d.get("status", "OK")
        else:
            details = res.get("error", "Error")

        print(f"{name:<20} | {status:<10} | {details}")

    print("-" * 65)
    if all_healthy:
        print("[+] All KAVACH core subsystems operational.\n")
        sys.exit(0)
    else:
        print("[!] One or more subsystems are offline or degraded.\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
