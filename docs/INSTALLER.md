# KAVACH Windows Installer & Endpoint Packaging Guide

## 1. Overview & Components

The KAVACH Windows Installer provides an enterprise-ready, signed MSI / EXE setup package for deploying KAVACH across Windows 10, Windows 11, and Windows Server 2019/2022 endpoints.

The installer provisions:
1. **Windows Background Service (`KavachEndpointAgent`)**:
   - Manages 16 background telemetry sensors, edge threat classification, and HTTPS batch shipping.
   - Configured with `Automatic` startup type and auto-recovery on failure.
2. **KAVACH System Tray Guardian (`tray_companion.py`)**:
   - Resides in the Windows notification area with live shield status icon.
   - Displays native Windows balloon alerts on critical detections.
   - Configured in `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` for auto-launch on user logon.
3. **KAVACH Companion Application (`companion.py`)**:
   - Dark crimson desktop user interface for One-Click Shield containment, sensor health monitoring, account access request, and DPAPI device enrollment.
   - Installed to Start Menu and Desktop shortcuts.
4. **Clean Uninstaller**:
   - Gracefully stops and unregisters the Windows Service.
   - Shuts down active tray instances.
   - Removes registry autostart keys and ephemeral cache without leaving dangling background threads.

---

## 2. Inno Setup Build Workflow

The installer definition is located in `installer/kavach_setup.iss`.

### 2.1 Prerequisites
- **Inno Setup 6.x** or higher ([jrsoftware.org](https://jrsoftware.org/isdl.php)).
- Ensure `ISCC.exe` is added to your system `PATH` or located in `C:\Program Files (x86)\Inno Setup 6\`.

### 2.2 Compilation Command
From the project root:

```cmd
# Automated batch script
installer\build_installer.bat

# Or direct Inno Setup CLI
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\kavach_setup.iss
```

The compiled installer will be saved to:
`dist\KAVACH-Setup-v2.1.0.exe`

---

## 3. Command-Line & Silent Enterprise Deployment

System administrators deploying via Microsoft Endpoint Manager (Intune), SCCM, or Group Policy (GPO) can install KAVACH silently:

```cmd
# Silent install without user prompts
KAVACH-Setup-v2.1.0.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /LOG="C:\Windows\Temp\kavach_install.log"

# Install with custom cloud server pre-configured
KAVACH-Setup-v2.1.0.exe /VERYSILENT /KAVACH_CLOUD_URL="https://cloud.kavach.io"
```

---

## 4. Alternative: Single-Binary Compilation via PyInstaller

For environments requiring single-file `.exe` executables without Python dependencies:

```bash
# 1. Install PyInstaller in virtual environment
pip install pyinstaller

# 2. Compile Companion GUI
pyinstaller --noconsole --onefile \
    --name "KavachCompanion" \
    --icon "assets/shield.ico" \
    --add-data "assets;assets" \
    backend/app/agent/companion.py

# 3. Compile Windows Service Runner
pyinstaller --noconsole --onefile \
    --name "KavachService" \
    backend/app/agent/service.py
```
Output binaries are generated in `dist/KavachCompanion.exe` and `dist/KavachService.exe`.

---

## 5. Uninstallation Verification

Uninstallation can be triggered from **Settings > Apps > Installed apps > KAVACH Cyber Defense** or via silent command line:

```cmd
"C:\Program Files\KAVACH\unins000.exe" /VERYSILENT /NORESTART
```

**Verification Checklist upon Uninstall:**
1. Background service `KavachEndpointAgent` is stopped and deleted from Windows Service Manager (`sc query KavachEndpointAgent` returns `1060: The specified service does not exist`).
2. Registry key `HKLM\Software\Microsoft\Windows\CurrentVersion\Run\KavachTrayCompanion` is deleted.
3. System tray icon is removed immediately.
4. Spool database and ephemeral cache in `{app}\data` are cleaned up.
