# KAVACH Windows Installer Binary Integrity & Distribution Specification

**Release Version:** 2.1.0  
**Compiler:** Inno Setup Compiler 6.3.3 (u)  
**Binary Output:** `release/KAVACH-Setup-2.1.0.exe`  
**Target Platform:** Windows 10 & 11 (x64)

---

## 1. Cryptographic Manifest & File Hashes

The following hashes represent the exact, authoritative builds generated for the v2.1.0 release:

| Release Artifact | Size (Bytes) | Size (Human) | SHA-256 Digest |
| :--- | :--- | :--- | :--- |
| **`KAVACH-Setup-2.1.0.exe`** | 269,690,361 | 257.2 MB | `7e9885c696e770a50d8b3165781ce8132cac82aed8128d53e51da7bef42ba7f0` |
| **`kavach-mobile-release.apk`** | 81,093,328 | 77.34 MB | `d8aeadbd04c30d1a4fd7ea4f90c400065729d09cebf3fb8b6417b75be0cdc709` |
| **`kavach-extension.zip`** | 131,916 | 128.8 KB | `9fbf1ee8b4670e1e4ea59f223100cecf4dc2987b6bc83c26e820924517c0b08f` |

---

## 2. Windows PE Binary Verification

The installer binary `KAVACH-Setup-2.1.0.exe` has been inspected and verified for PE header compliance:

- **Format:** Portable Executable 32-bit wrapper (PE32) with 64-bit payload extraction capabilities.
- **Magic Bytes:** `4D 5A` (`MZ` header present at offset `0x00000000`).
- **PE Signature:** `50 45 00 00` (`PE\0\0` at header offset).
- **Subsystem:** Windows GUI (Subsystem 2).
- **Compression Scheme:** LZMA2/Normal Solid Compression.
- **Privilege Level:** `requireAdministrator` (required for installing Session 0 Windows Services and registry startup keys).

---

## 3. Standalone Embedded Runtime Topology

To eliminate dependencies on developer workstations and Astral `uv` trampoline shims, KAVACH bundles an embedded CPython 3.12 64-bit runtime:

```
{app}/
├── runtime/
│   ├── python.exe              # Standalone CPython interpreter (91.6 KB)
│   ├── pythonw.exe             # Windowless interpreter for Tray & Background (90.1 KB)
│   ├── python3.dll             # Standard CPython ABI forwarder (56.3 KB)
│   ├── python312.dll           # Core CPython runtime (6.96 MB)
│   ├── vcruntime140.dll        # Microsoft Visual C++ CRT (124.5 KB)
│   ├── vcruntime140_1.dll      # Microsoft Visual C++ Extended CRT (49.7 KB)
│   ├── DLLs/                   # Native binary C extensions (_ssl, _sqlite3, _socket, etc.)
│   ├── Lib/
│   │   ├── (Standard Python 3.12 Library)
│   │   └── site-packages/
│   │       └── kavach.pth      # Relative linker pointing to backend dependencies
├── backend/
│   ├── .venv/
│   │   └── Lib/site-packages/  # Bundled third-party dependencies (FastAPI, Scikit-learn, etc.)
│   └── app/                    # KAVACH Agent, Collectors, ML Engines, and Services
├── desktop/                    # Native Flutter Windows 64-bit binary (kavach.exe)
├── kavach-frontend/            # Sovereign Web Console static assets
├── data/                       # Local persistent threat intelligence cache (SQLite)
└── assets/                     # Branding, icons, and tray artwork
```

---

## 4. Verification Instructions for Users & Administrators

Users can independently verify the authenticity of the installer before execution:

### Via Windows PowerShell
```powershell
Get-FileHash -Algorithm SHA256 .\KAVACH-Setup-2.1.0.exe
```
**Expected Output:**
```text
Algorithm       Hash                                                                Path
---------       ----                                                                ----
SHA256          7E9885C696E770A50D8B3165781CE8132CAC82AED8128D53E51DA7BEF42BA7F0     ...\KAVACH-Setup-2.1.0.exe
```

### Via Windows Command Prompt
```cmd
certutil -hashfile KAVACH-Setup-2.1.0.exe SHA256
```
