# KAVACH Windows Installer Failure Audit & Root Cause Analysis

**Document Version:** 2.1.0  
**Classification:** Engineering Incident & Architecture Remediation Audit  
**Target:** `KAVACH-Setup-2.1.0.exe` Windows Distribution

---

## Executive Summary

During release verification, the Windows installation and execution pipeline encountered two separate, critical failure modes:
1. **Defect A (Delivery & Corrupted Executable):** Web server delivered an HTML error document instead of the binary executable when users clicked download on the website.
2. **Defect B (Runtime Trampoline Failure):** When executing setup or companion processes on clean Windows environments, an OS Error modal appeared:
   ```text
   error: uv trampoline failed to spawn Python child process
   Caused by: entity not found (os error 2)
   ```

Both defects have been isolated to their root mechanical causes and resolved in the v2.1.0 sovereign release.

---

## Incident Analysis & Failure Mechanisms

### Defect A: HTTP Delivery Serving 404 HTML Page as Binary

#### Root Cause
The lightweight Python development server (`scripts/start_frontend.py`) was mapped strictly to serve files from `kavach-frontend/`. When requested routes did not exist within that directory, the server intercepted the request and rendered `kavach-frontend/404.html` with status 200/404.

Because `KAVACH-Setup-2.1.0.exe` resided exclusively inside the repository's root `release/` directory and had not been synchronized into `kavach-frontend/releases/`, incoming HTTP GET requests for `/releases/KAVACH-Setup-2.1.0.exe` were fed the UTF-8 HTML error page. The browser saved this file with an `.exe` extension. When Windows attempted to parse the PE headers of the file, it threw:
```text
The version of this file is not compatible with the version of Windows you're running.
```

#### Remediation
1. Implemented a dedicated binary streaming request handler in [`scripts/start_frontend.py`](file:///c:/KAVACH/scripts/start_frontend.py).
2. The handler checks both `kavach-frontend/releases/` and the root `release/` directory.
3. Automatically sets strict binary headers:
   - `Content-Type: application/x-msdownload` (or `application/vnd.android.package-archive` for APKs)
   - `Content-Disposition: attachment; filename="<name>"`
   - `Content-Length: <exact byte count>`
   - `Accept-Ranges: bytes`
4. Formally bans the 404 HTML fallback from intercepting requests targeting `/releases/` paths.
5. Synchronized all release assets directly to both directories.

---

### Defect B: Astral `uv` Trampoline Failure (`os error 2`)

#### Root Cause
When dependencies were initialized in the development environment using Astral `uv`, `backend/.venv/Scripts/python.exe` and `pythonw.exe` were created not as true standalone CPython interpreters, but as 45 KB **trampoline launcher stubs**.

These stubs embed hardcoded absolute paths pointing to the developer's local AppData directory:
```text
C:\Users\jasht\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe
```

When Inno Setup compiled the installer using `Source: "..\backend\*"; DestDir: "{app}\backend"`, it bundled these trampoline launchers. When the installer attempted to register the background Windows Service or launch the Tray Guardian:
1. Inno Setup invoked `{app}\backend\.venv\Scripts\python.exe` or `pythonw.exe`.
2. The uv trampoline executed and attempted to spawn the parent Python child process at the hardcoded path.
3. Because Windows Services execute in `Session 0` (under the `LocalSystem` account), or because the software was deployed on a clean end-user machine where `C:\Users\jasht\` does not exist, the Win32 API returned `ERROR_FILE_NOT_FOUND` (`os error 2`).
4. The trampoline surfaced the unhandled modal:
   ```text
   Error: uv trampoline failed to spawn Python child process
   Caused by: entity not found (os error 2)
   ```

#### Remediation
1. **Isolated Standalone CPython Runtime:**
   - Assembled a full standalone CPython 3.12 64-bit runtime environment under [`c:\KAVACH\runtime`](file:///c:/KAVACH/runtime).
   - Bundles the genuine 91.6 KB `python.exe`, 90.1 KB `pythonw.exe`, `python312.dll`, `vcruntime140.dll`, `vcruntime140_1.dll`, `DLLs/`, and `Lib/`.
2. **Relative Path Bridging (`kavach.pth`):**
   - Configured `runtime/Lib/site-packages/kavach.pth` with relative paths:
     ```text
     ..\..\backend\.venv\Lib\site-packages
     ..\..\backend
     ```
   - When `{app}\runtime\python.exe` boots, Python automatically discovers all installed backend dependencies (FastAPI, PyWin32, Uvicorn, Scikit-learn, Cryptography) without any external dependency or path trampolines.
3. **Inno Setup Script Overhaul ([`installer/kavach_setup.iss`](file:///c:/KAVACH/installer/kavach_setup.iss)):**
   - Excluded `backend\.venv\Scripts\python*.exe` from the installer payload.
   - Bundled the standalone runtime:
     ```iss
     Source: "..\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
     ```
   - Re-routed all Start Menu shortcuts, Registry auto-start keys, Windows Service registration commands, and Post-Install launchers to `{app}\runtime\python.exe` and `{app}\runtime\pythonw.exe`.
4. **Recompilation & Checksum Validation:**
   - Successfully compiled `release/KAVACH-Setup-2.1.0.exe` with Inno Setup 6.
   - Verified that the generated binary contains valid PE32+ headers and executes with zero external dependencies.

---

## Prevention & Build Gate Controls

To ensure neither issue re-emerges:
- Automated release verification script (`scratch/package_release.py`) checks that binary files match their exact SHA-256 hash.
- Unit and integration tests verify that all CLI and Windows Service launchers operate through `{app}\runtime\python.exe` without calling virtual environment trampolines.
- The web server enforces binary streaming with Content-Length headers for all release endpoints.
