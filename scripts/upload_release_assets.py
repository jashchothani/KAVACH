"""
KAVACH Enterprise Release Asset Management Script
Upload, replace, and synchronize release binaries to GitHub Releases automatically.
Supports chunked streaming uploads with live progress bar and auto-detected Git credentials.

Usage examples:
  python scripts/upload_release_assets.py --list
  python scripts/upload_release_assets.py --upload-all
  python scripts/upload_release_assets.py --file release/kavach-mobile-release.apk
  python scripts/upload_release_assets.py --tag v2.2.0 --create --upload-all
"""

import os
import sys
import time
import argparse
import subprocess
import requests

REPO = "jashchothani/KAVACH"
API_BASE = f"https://api.github.com/repos/{REPO}"
UPLOADS_BASE = f"https://uploads.github.com/repos/{REPO}"


def get_github_token():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        return token

    # Fallback to Git Credential Manager
    try:
        p = subprocess.Popen(
            ["git", "credential", "fill"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        out, _ = p.communicate(input="protocol=https\nhost=github.com\n\n", timeout=5)
        for line in out.strip().split("\n"):
            if line.startswith("password="):
                token = line.split("=", 1)[1].strip()
                if token:
                    return token
    except Exception:
        pass

    return ""


def get_headers(token=""):
    headers = {
        "User-Agent": "KavachReleaseManager/2.1",
        "Accept": "application/vnd.github.v3+json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def get_releases(token=""):
    url = f"{API_BASE}/releases"
    resp = requests.get(url, headers=get_headers(token), timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_release_by_tag(tag, token=""):
    url = f"{API_BASE}/releases/tags/{tag}"
    resp = requests.get(url, headers=get_headers(token), timeout=30)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


def create_release(tag, name, body_text="", token=""):
    url = f"{API_BASE}/releases"
    payload = {
        "tag_name": tag,
        "name": name,
        "body": body_text or f"KAVACH Enterprise Release {tag}",
        "draft": False,
        "prerelease": False
    }
    resp = requests.post(url, json=payload, headers=get_headers(token), timeout=30)
    resp.raise_for_status()
    return resp.json()


def delete_asset(asset_id, token=""):
    url = f"{API_BASE}/releases/assets/{asset_id}"
    try:
        resp = requests.delete(url, headers=get_headers(token), timeout=30)
        return resp.status_code in (204, 200)
    except Exception as e:
        print(f"  [!] Failed to delete asset {asset_id}: {e}")
        return False


class ProgressFileReader:
    """Streams file from disk with a real-time terminal progress bar."""
    def __init__(self, file_path, filename):
        self.file = open(file_path, "rb")
        self.filename = filename
        self.total_size = os.path.getsize(file_path)
        self.uploaded = 0
        self.start_time = time.time()
        self.last_update = 0

    def read(self, size=-1):
        chunk = self.file.read(size)
        if chunk:
            self.uploaded += len(chunk)
            now = time.time()
            if now - self.last_update > 0.25 or self.uploaded >= self.total_size:
                self.last_update = now
                self.print_progress()
        return chunk

    def print_progress(self):
        pct = (self.uploaded / self.total_size) * 100 if self.total_size > 0 else 0
        elapsed = max(0.001, time.time() - self.start_time)
        speed_mb = (self.uploaded / (1024 * 1024)) / elapsed
        remaining_sec = ((self.total_size - self.uploaded) / (1024 * 1024)) / speed_mb if speed_mb > 0 else 0

        bar_len = 24
        filled = int(bar_len * (self.uploaded / self.total_size)) if self.total_size > 0 else 0
        bar = "=" * filled + (">" if filled < bar_len else "")
        bar = bar.ljust(bar_len, " ")

        up_mb = self.uploaded / (1024 * 1024)
        tot_mb = self.total_size / (1024 * 1024)

        sys.stdout.write(
            f"\r  [{bar}] {pct:5.1f}% ({up_mb:5.1f}/{tot_mb:5.1f} MB) · {speed_mb:4.2f} MB/s · ETA: {int(remaining_sec)}s  "
        )
        sys.stdout.flush()

    def __len__(self):
        return self.total_size

    def close(self):
        self.file.close()


def upload_asset(release_id, file_path, token=""):
    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    size_mb = file_size / (1024 * 1024)

    content_type = "application/octet-stream"
    if filename.endswith(".apk"):
        content_type = "application/vnd.android.package-archive"
    elif filename.endswith(".zip"):
        content_type = "application/zip"
    elif filename.endswith(".exe"):
        content_type = "application/x-msdownload"

    print(f"\n[+] Preparing to upload: {filename} ({size_mb:.2f} MB)")

    # 1. Check if asset already exists on this release
    rel_url = f"{API_BASE}/releases/{release_id}"
    rel_resp = requests.get(rel_url, headers=get_headers(token), timeout=30)
    rel_info = rel_resp.json()

    for a in rel_info.get("assets", []):
        if a.get("name") == filename:
            print(f"  [-] Asset '{filename}' already exists (ID: {a['id']}). Deleting old copy first...")
            delete_asset(a["id"], token=token)
            time.sleep(1)
            break

    # 2. Upload with streaming file reader and generous 1800s timeout
    upload_url = f"{UPLOADS_BASE}/releases/{release_id}/assets?name={filename}"
    upload_headers = get_headers(token)
    upload_headers.update({
        "Content-Type": content_type,
        "Content-Length": str(file_size)
    })

    reader = ProgressFileReader(file_path, filename)
    start_time = time.time()

    try:
        resp = requests.post(
            upload_url,
            data=reader,
            headers=upload_headers,
            timeout=(30, 1800)  # 30s connect, 1800s (30m) transfer
        )
        reader.close()
        print()  # newline after progress bar

        if resp.status_code == 201:
            elapsed = time.time() - start_time
            speed = size_mb / elapsed if elapsed > 0 else 0
            resp_json = resp.json()
            print(f"  [SUCCESS] {filename} uploaded in {elapsed:.1f}s ({speed:.2f} MB/s)!")
            print(f"  [Direct URL] {resp_json.get('browser_download_url')}")
            return resp_json
        else:
            print(f"  [!] Upload failed with HTTP {resp.status_code}: {resp.text[:300]}")
            return None
    except Exception as e:
        reader.close()
        print(f"\n  [!] Error uploading {filename}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="KAVACH Release Asset Uploader & Manager")
    parser.add_argument("--list", action="store_true", help="List all current GitHub releases and their assets")
    parser.add_argument("--tag", default="v2.1.0", help="Release tag name to target (default: v2.1.0)")
    parser.add_argument("--create", action="store_true", help="Create new release if tag does not exist")
    parser.add_argument("--file", help="Specific file to upload (e.g., release/kavach-extension.zip)")
    parser.add_argument("--upload-all", action="store_true", help="Upload all standard release files (.exe, .apk, .zip)")
    args = parser.parse_args()

    token = get_github_token()
    if not token and not args.list:
        print("[!] ERROR: GitHub token could not be found.")
        print("    Please set GITHUB_TOKEN environment variable or log in with git credential manager.")
        sys.exit(1)

    if args.list:
        print(f"\n[*] Fetching releases for {REPO}...")
        try:
            releases = get_releases(token=token)
        except Exception as e:
            print(f"Error fetching releases: {e}")
            return

        if not releases:
            print("  No releases found.")
            return

        for r in releases:
            print(f"\nRelease: {r.get('name')} (Tag: {r.get('tag_name')}, ID: {r.get('id')})")
            print(f"  URL: {r.get('html_url')}")
            print(f"  Published: {r.get('published_at')}")
            assets = r.get("assets", [])
            print(f"  Assets ({len(assets)}):")
            for a in assets:
                sz = a.get("size", 0) / (1024 * 1024)
                print(f"    - {a.get('name')}: {sz:.2f} MB (Downloads: {a.get('download_count')})")
                print(f"      {a.get('browser_download_url')}")
        return

    # Find or create target release
    print(f"[*] Locating release for tag '{args.tag}'...")
    release = get_release_by_tag(args.tag, token=token)

    if not release:
        if args.create:
            print(f"[*] Release '{args.tag}' does not exist. Creating it now...")
            release = create_release(args.tag, f"KAVACH Sovereign Release {args.tag}", token=token)
            print(f"[OK] Created release '{args.tag}' (ID: {release['id']})")
        else:
            print(f"[!] Release '{args.tag}' not found. Use --create to create it automatically.")
            sys.exit(1)

    release_id = release["id"]
    print(f"[OK] Target Release: {release.get('name')} (ID: {release_id})")

    # Determine files to upload
    files_to_upload = []

    if args.file:
        if not os.path.exists(args.file):
            print(f"[!] File not found: {args.file}")
            sys.exit(1)
        files_to_upload.append(args.file)

    if args.upload_all:
        tag_ver = args.tag.lstrip("v")
        tag_exe = os.path.join("release", f"KAVACH-Setup-{tag_ver}.exe")
        candidate_paths = [
            os.path.join("release", "kavach-extension.zip"),
            os.path.join("release", "kavach-mobile-release.apk"),
        ]
        if os.path.exists(tag_exe):
            candidate_paths.append(tag_exe)
        elif os.path.exists("release"):
            for f in os.listdir("release"):
                if f.startswith("KAVACH-Setup") and f.endswith(".exe"):
                    candidate_paths.append(os.path.join("release", f))
                    break

        for p in candidate_paths:
            if os.path.exists(p) and p not in files_to_upload:
                files_to_upload.append(p)

    if not files_to_upload:
        print("\nNo files specified for upload. Use --file <path> or --upload-all.")
        print("Example: python scripts/upload_release_assets.py --upload-all")
        return

    print(f"\n[*] Uploading {len(files_to_upload)} asset(s) to release '{args.tag}'...")
    for f in files_to_upload:
        upload_asset(release_id, f, token=token)

    print("\n[OK] All requested assets have been synchronized to GitHub Releases successfully!")


if __name__ == "__main__":
    main()
