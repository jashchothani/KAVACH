# KAVACH — Enterprise Installation, Upgrade & Recovery Guide

**Document Version:** 1.0.0  
**Classification:** Systems Administration & Deployment Guide  
**Target Platform:** Windows 10 / Windows 11 (64-bit Architecture)

---

## 1. System Prerequisites

Before installing KAVACH on a managed endpoint:
- **Operating System:** Windows 10 (Version 2004 or later) or Windows 11 (all versions), 64-bit architecture.
- **Hardware Resources:**
  - Minimum 4 GB RAM (8 GB recommended for heavy workstations).
  - Minimum 500 MB available storage space for binaries, assets, and the bounded offline spool database.
  - 1 GHz or faster 64-bit dual-core processor.
- **Network Connectivity:**
  - Outbound HTTPS (Port 443 / Port 8000 for local test servers) to the configured KAVACH server endpoint.
  - Endpoints operate autonomously when disconnected; network connectivity is required only for initial enrollment and telemetry synchronization.
- **Privileges:**
  - Standard User privileges are sufficient for running the interactive Flutter Desktop Companion.
  - Windows Administrator privileges (via UAC prompt) are required strictly once during installer setup to register the background service in the Windows Service Control Manager.

---

## 2. Standard Graphical Installation

1. **Obtain Setup Package:**
   Download the official release executable `release/KAVACH-Setup-<version>.exe`.
2. **Launch Setup:**
   Double-click the installer. When prompted by Windows User Account Control (UAC), review the publisher details and select **Yes** to authorize installation.
3. **Setup Wizard Pages:**
   - **Page 1 (Welcome):** Overview of KAVACH SOAR-XDR endpoint protection.
   - **Page 2 (License & Terms):** Review sovereign data privacy and telemetry retention policies.
   - **Page 3 (Destination Location):** Default directory is `C:\Program Files\KAVACH`.
   - **Page 4 (Component Selection):**
     - `[x] KAVACH Endpoint Background Service (Session 0)`
     - `[x] KAVACH Flutter Desktop Companion UI (User Session)`
     - `[x] Windows System Tray Integration & Quick Shield`
   - **Page 5 (Startup & Background Options):**
     - `[x] Start KAVACH background service automatically on Windows boot`
     - `[x] Launch KAVACH Desktop Companion upon user sign-in`
   - **Page 6 (Installation Execution):** Files extracted, service registered in Windows Service Control Manager.
   - **Page 7 (Completion):** Option to launch KAVACH Companion immediately.

---

## 3. Silent & Enterprise Unattended Deployment

For automated deployment via Microsoft Intune, SCCM, PDQ Deploy, or Active Directory Group Policy (GPO):

```cmd
KAVACH-Setup-1.0.0.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP- /LOG="C:\Windows\Temp\kavach_install.log"
```

### Supported Installer Command-Line Flags
| Flag | Description |
| :--- | :--- |
| `/VERYSILENT` | Suppresses all graphical windows and progress dialogs. |
| `/SUPPRESSMSGBOXES`| Prevents modal message boxes; defaults to safe affirmative responses. |
| `/NORESTART` | Prevents the system from rebooting automatically if a file is in use. |
| `/DIR="C:\Custom\Path"` | Overrides the default installation target directory. |
| `/LOG="path\to\log.txt"`| Records detailed installer execution events for enterprise auditing. |

---

## 4. First-Launch Setup Wizard (10-Step Sequence)

When the user launches KAVACH Companion for the first time:

- **Step 1 — Welcome to KAVACH:** Explains the unified SOAR-XDR cyber defense platform.
- **Step 2 — Permissions & Background Collection:** Transparently discloses which operating system telemetry events are observed (process, network, USB, security events). Confirms that personal files, photos, and browser history are **never** collected.
- **Step 3 — Service Preferences:** Allows the user to confirm background collection and automatic startup.
- **Step 4 — Sensor Availability Check:** Performs a local diagnostic audit across all 16 sensors (checking Defender status, firewall state, network interfaces).
- **Step 5 — Backend Connectivity:** Verifies reachability of the configured KAVACH server (`http://localhost:8000/api/v1` or enterprise cloud URL).
- **Step 6 — Account Sign-In / Request:** Prompts user to submit an account request or sign in with existing corporate credentials.
- **Step 7 — Email Verification:** Requires validation of single-use email verification code when configured.
- **Step 8 — Cryptographic Device Enrollment:** Generates local RSA-2048 keypair, encrypts private key with Windows DPAPI, requests a single-use challenge nonce from the backend, and registers device identity.
- **Step 9 — Approval & Activation State:** Informs the user of their current account state (`Awaiting Administrator Approval` or `Awaiting SOC Analyst Assignment`).
- **Step 10 — Open Dashboard:** Once authorized, launches the active protection center.

---

## 5. Non-Destructive Upgrade Procedure

When upgrading to a newer version of KAVACH:

1. Execute the new `KAVACH-Setup-<version>.exe`.
2. The installer automatically detects existing installations in `C:\Program Files\KAVACH`.
3. **State Preservation Guarantee:**
   - Existing RSA-2048 identity keys protected via Windows DPAPI in `%LOCALAPPDATA%\KAVACH\identity` are **never** overwritten or exposed.
   - Existing queued offline telemetry in `%PROGRAMDATA%\KAVACH\spool\agent_spool.db` is preserved intact.
   - User notification preferences and account tokens are migrated without requiring re-enrollment.
4. The background service is stopped, binary files are updated, and the service is restarted cleanly.

---

## 6. Service Management & CLI Troubleshooting

Administrators can inspect and manage the endpoint service via standard Windows commands:

### Query Service Status
```cmd
sc.exe query KavachAgentService
```

### Stop Service
```cmd
sc.exe stop KavachAgentService
```

### Start Service
```cmd
sc.exe start KavachAgentService
```

### View Live Operational Logs
```powershell
Get-Content -Path "$env:ProgramData\KAVACH\logs\agent_service.log" -Tail 50 -Wait
```

---

## 7. Clean Uninstallation Guide

To completely remove KAVACH from a workstation:

1. Open **Windows Settings** -> **Apps** -> **Installed Apps**.
2. Select **KAVACH Enterprise Cyber Defense Platform** and click **Uninstall**.
3. Alternatively, execute:
   ```cmd
   "C:\Program Files\KAVACH\unins000.exe" /SILENT
   ```
4. **Removal Actions Performed:**
   - Background service `KavachAgentService` is stopped and unregistered from Windows Service Control Manager.
   - Scheduled tasks and startup registry entries are removed.
   - Application binaries, shortcuts, and documentation files are removed.
   - **Audit Record Option:** Security audit logs in `%PROGRAMDATA%\KAVACH\logs` are preserved by default for enterprise compliance; administrators may delete them manually if no retention policy applies.
