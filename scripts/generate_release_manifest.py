"""
Generate release_manifest.json and SHA256SUMS.txt for KAVACH-Setup-2.1.0.exe.
"""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

EXE_PATH = Path("release/KAVACH-Setup-2.5.2.exe")
if not EXE_PATH.exists():
    raise FileNotFoundError(f"Setup file not found: {EXE_PATH}")

hasher = hashlib.sha256()
with open(EXE_PATH, "rb") as f:
    for chunk in iter(lambda: f.read(65536), b""):
        hasher.update(chunk)

file_hash = hasher.hexdigest()
file_size = EXE_PATH.stat().st_size
file_size_mb = f"{round(file_size / (1024 * 1024), 2)} MB"

manifest = {
    "product": "KAVACH Enterprise SOAR-XDR Cyber Defense Platform",
    "version": "2.5.2",
    "build_timestamp_utc": datetime.now(timezone.utc).isoformat(),
    "installer_file": EXE_PATH.name,
    "file_size_bytes": file_size,
    "file_size_mb": file_size_mb,
    "sha256": file_hash,
    "target_os": "Windows 10 / Windows 11 (64-bit)",
    "prerequisites": {
        "min_ram": "4 GB",
        "min_storage": "500 MB",
        "admin_elevation": "Required during installation for Windows Service registration"
    },
    "branding": {
        "product_name": "KAVACH Cyber Defense",
        "shield_icon": "assets/kavach.ico (32-bit RGBA 16x16 to 256x256 square multi-layer)",
        "embedded_wizard_banner": "assets/wizard_large.bmp (164x314)",
        "embedded_wizard_small": "assets/wizard_small.bmp (55x58)",
        "companion_title": "KAVACH — Windows Security Companion",
        "system_tray_tooltip": "KAVACH Cyber Defense — Active"
    },
    "components_included": [
        "KAVACH Windows Endpoint Background Service (Session 0)",
        "KAVACH Desktop Companion UI (Session 1+)",
        "KAVACH System Tray Guardian & Emergency One-Click Shield",
        "16 High-Precision Operating System Telemetry Sensors",
        "Encrypted SQLite Offline Spool Buffer & Exponential Shipper",
        "Hardware DPAPI Device Identity & Cryptographic Enrollment"
    ]
}

Path("release/release_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
Path("release/SHA256SUMS.txt").write_text(f"{file_hash}  {EXE_PATH.name}\n", encoding="utf-8")

print(f"File:   {EXE_PATH.name}")
print(f"Size:   {file_size_mb} ({file_size:,} bytes)")
print(f"SHA256: {file_hash}")
print("[SUCCESS] release_manifest.json and SHA256SUMS.txt updated.")
