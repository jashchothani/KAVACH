"""
KAVACH Enterprise Release Asset Management Script
Upload, replace, and synchronize release binaries to GitHub Releases automatically.
Supports automatic token detection from Git Credential Manager or GITHUB_TOKEN environment variable.

Usage examples:
  python scripts/upload_release_assets.py --list
  python scripts/upload_release_assets.py --upload-all
  python scripts/upload_release_assets.py --file release/kavach-extension.zip
  python scripts/upload_release_assets.py --tag v2.2.0 --create --upload-all
"""

import os
import sys
import json
import time
import argparse
import subprocess
import urllib.request
import urllib.error

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


def api_request(url, method="GET", data=None, token="", content_type="application/json"):
    headers = {
        "User-Agent": "KavachReleaseManager/2.1",
        "Accept": "application/vnd.github.v3+json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if content_type:
        headers["Content-Type"] = content_type

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = resp.read()
        return resp.status, body


def get_releases(token=""):
    url = f"{API_BASE}/releases"
    status, body = api_request(url, token=token)
    return json.loads(body.decode("utf-8"))


def get_release_by_tag(tag, token=""):
    url = f"{API_BASE}/releases/tags/{tag}"
    try:
        status, body = api_request(url, token=token)
        return json.loads(body.decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def create_release(tag, name, body_text="", token=""):
    url = f"{API_BASE}/releases"
    payload = json.dumps({
        "tag_name": tag,
        "name": name,
        "body": body_text or f"KAVACH Enterprise Release {tag}",
        "draft": False,
        "prerelease": False
    }).encode("utf-8")
    status, body = api_request(url, method="POST", data=payload, token=token)
    return json.loads(body.decode("utf-8"))


def delete_asset(asset_id, token=""):
    url = f"{API_BASE}/releases/assets/{asset_id}"
    try:
        status, _ = api_request(url, method="DELETE", token=token)
        return status in (204, 200)
    except Exception as e:
        print(f"  [!] Failed to delete asset {asset_id}: {e}")
        return False


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
    _, rel_body = api_request(rel_url, token=token)
    rel_info = json.loads(rel_body.decode("utf-8"))

    for a in rel_info.get("assets", []):
        if a.get("name") == filename:
            print(f"  [-] Asset '{filename}' already exists (ID: {a['id']}). Deleting old copy first...")
            delete_asset(a["id"], token=token)
            time.sleep(1)
            break

    # 2. Upload file bytes
    upload_url = f"{UPLOADS_BASE}/releases/{release_id}/assets?name={filename}"
    start_time = time.time()

    with open(file_path, "rb") as fp:
        file_bytes = fp.read()

    status, resp_body = api_request(
        upload_url,
        method="POST",
        data=file_bytes,
        token=token,
        content_type=content_type
    )

    elapsed = time.time() - start_time
    speed = size_mb / elapsed if elapsed > 0 else 0
    resp_json = json.loads(resp_body.decode("utf-8"))

    print(f"  [SUCCESS] {filename} uploaded in {elapsed:.1f}s ({speed:.2f} MB/s)!")
    print(f"  [Direct URL] {resp_json.get('browser_download_url')}")
    return resp_json


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
        releases = get_releases(token=token)
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
        candidate_paths = [
            os.path.join("release", "kavach-extension.zip"),
            os.path.join("release", "kavach-mobile-release.apk"),
            os.path.join("release", "KAVACH-Setup-2.1.0.exe"),
        ]
        # Also check for alternate versioned exe
        if os.path.exists("release"):
            for f in os.listdir("release"):
                if f.startswith("KAVACH-Setup") and f.endswith(".exe"):
                    p = os.path.join("release", f)
                    if p not in candidate_paths:
                        candidate_paths.append(p)

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

    print("\n[✔] All requested assets have been synchronized to GitHub Releases successfully!")


if __name__ == "__main__":
    main()
