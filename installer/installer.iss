; =====================================================================
; KAVACH Enterprise Endpoint Defense — Inno Setup Script
; Generates: KAVACH-Setup-v2.1.0.exe
; =====================================================================

#define MyAppName "KAVACH Cyber Defense"
#define MyAppVersion "2.1.0"
#define MyAppPublisher "KAVACH Cybersecurity Technologies"
#define MyAppURL "https://kavach.cybersecurity"
#define MyAppExeName "KavachCompanion.exe"

[Setup]
; Basic Application Info
AppId={{E29B124F-86B3-4A63-9D12-9F02A45C3370}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/support
AppUpdatesURL={#MyAppURL}/updates
DefaultDirName={autopf}\KAVACH
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=..\installer\LICENSE.txt

; Security and Privileges (Requires Administrator to install Windows Services)
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Visual Aesthetics
OutputDir=..\release
OutputBaseFilename=KAVACH-Setup-{#MyAppVersion}
Compression=lzma2/normal
SolidCompression=yes
WizardStyle=modern

; Branding Icons & Wizard Images
SetupIconFile=..\assets\kavach.ico
UninstallDisplayIcon={app}\assets\kavach.ico
WizardImageFile=..\assets\wizard_large.bmp
WizardSmallImageFile=..\assets\wizard_small.bmp

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Automatically launch KAVACH Companion on Windows startup"; GroupDescription: "System Integration:"

[Files]
; Source tree containing backend, agent, collectors, and assets
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pyc,*__pycache__*,*.pytest_cache*,*.git*"
Source: "..\kavach-frontend\*"; DestDir: "{app}\kavach-frontend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs; Permissions: users-readexec
Source: "..\data\database\kavach.db"; DestDir: "{app}\data\database"; Flags: ignoreversion onlyifdoesntexist
; Compiled Flutter Windows Desktop release binary & runtime data
Source: "..\mobile\build\windows\x64\runner\Release\*"; DestDir: "{app}\desktop"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName} Desktop App"; Filename: "{app}\desktop\kavach.exe"; IconFilename: "{app}\assets\kavach.ico"
Name: "{group}\{#MyAppName} Companion"; Filename: "{app}\backend\.venv\Scripts\pythonw.exe"; Parameters: """{app}\backend\app\agent\companion.py"""; IconFilename: "{app}\assets\kavach.ico"
Name: "{group}\{#MyAppName} System Tray"; Filename: "{app}\backend\.venv\Scripts\pythonw.exe"; Parameters: """{app}\backend\app\agent\tray_companion.py"""; IconFilename: "{app}\assets\kavach.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\assets\kavach.ico"
Name: "{autodesktop}\{#MyAppName} Desktop App"; Filename: "{app}\desktop\kavach.exe"; IconFilename: "{app}\assets\kavach.ico"; Tasks: desktopicon
Name: "{autodesktop}\{#MyAppName} Companion"; Filename: "{app}\backend\.venv\Scripts\pythonw.exe"; Parameters: """{app}\backend\app\agent\companion.py"""; IconFilename: "{app}\assets\kavach.ico"; Tasks: desktopicon

[Registry]
; Configure auto-start with Windows for Tray Companion
Root: HKLM; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "KavachTrayCompanion"; ValueData: """{app}\backend\.venv\Scripts\pythonw.exe"" ""{app}\backend\app\agent\tray_companion.py"""; Flags: uninsdeletevalue; Tasks: autostart

[Run]
; Step 1: Register and start the background Windows Service
Filename: "{app}\backend\.venv\Scripts\python.exe"; Parameters: """{app}\backend\app\agent\service.py"" --startup auto install"; Flags: runhidden; StatusMsg: "Installing KAVACH Endpoint Security Windows Service..."
Filename: "{app}\backend\.venv\Scripts\python.exe"; Parameters: """{app}\backend\app\agent\service.py"" start"; Flags: runhidden; StatusMsg: "Starting KAVACH Endpoint Security Service..."

; Step 2: Launch KAVACH Tray Companion and first-launch Setup Wizard
Filename: "{app}\backend\.venv\Scripts\pythonw.exe"; Parameters: """{app}\backend\app\agent\tray_companion.py"""; Flags: nowait postinstall skipifsilent; Description: "Launch KAVACH System Tray Guardian"
Filename: "{app}\backend\.venv\Scripts\pythonw.exe"; Parameters: """{app}\backend\app\agent\companion.py"""; Flags: nowait postinstall; Description: "Open KAVACH Companion Desktop Interface"

[UninstallRun]
; Clean uninstaller: Stop and remove Windows service gracefully
Filename: "{app}\backend\.venv\Scripts\python.exe"; Parameters: """{app}\backend\app\agent\service.py"" stop"; Flags: runhidden
Filename: "{app}\backend\.venv\Scripts\python.exe"; Parameters: """{app}\backend\app\agent\service.py"" remove"; Flags: runhidden

; Terminate any lingering background tray or GUI processes
Filename: "taskkill.exe"; Parameters: "/F /IM pythonw.exe /FI ""WINDOWTITLE eq KAVACH*"""; Flags: runhidden
