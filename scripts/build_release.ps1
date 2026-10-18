# KAVACH Enterprise Release Build Orchestrator
# Builds, tests, packages, and hashes the complete Windows installer distribution.

param(
    [switch]$SkipTests = $false,
    [string]$Version = "2.1.0"
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $WorkspaceRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          KAVACH Enterprise Release Build Pipeline (v$Version)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Prerequisite Checks
Write-Host "[1/5] Checking Toolchain Prerequisites..." -ForegroundColor Yellow

$ISCC_Path = $null
$CandidatePaths = @(
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
)

foreach ($path in $CandidatePaths) {
    if (Test-Path $path) {
        $ISCC_Path = $path
        break
    }
}

if (-not $ISCC_Path) {
    $whereIscc = (Get-Command iscc.exe -ErrorAction SilentlyContinue)
    if ($whereIscc) {
        $ISCC_Path = $whereIscc.Source
    }
}

if (-not $ISCC_Path) {
    Write-Error "Inno Setup Compiler (ISCC.exe) not found. Please install Inno Setup 6."
}
Write-Host "  [OK] Inno Setup: $ISCC_Path" -ForegroundColor Green

# 2. Automated Tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "[2/5] Running Backend & Notification Test Suites..." -ForegroundColor Yellow
    & python -m pytest backend/tests/ -v
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend test suite failed. Aborting release build."
    }
    Write-Host "  [OK] All backend tests passed." -ForegroundColor Green

    Write-Host "[3/5] Verifying Flutter Codebase..." -ForegroundColor Yellow
    Push-Location "mobile"
    & flutter analyze --no-pub
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Error "Flutter static analysis failed. Aborting release build."
    }
    Pop-Location
    Write-Host "  [OK] Flutter analysis passed with 0 errors." -ForegroundColor Green
} else {
    Write-Host "[2/5 & 3/5] Skipping test execution (-SkipTests enabled)." -ForegroundColor DarkGray
}

# 3. Create Release Directory
$ReleaseDir = Join-Path $WorkspaceRoot "release"
if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
}

# 4. Compile Windows Inno Setup Installer
Write-Host "[4/5] Compiling Inno Setup Windows Installer..." -ForegroundColor Yellow
$IssFile = Join-Path $WorkspaceRoot "installer\kavach_setup.iss"

& "$ISCC_Path" "/DMyAppVersion=$Version" "$IssFile"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Inno Setup compilation failed with exit code $LASTEXITCODE."
}

$InstallerExe = Join-Path $ReleaseDir "KAVACH-Setup-$Version.exe"
if (-not (Test-Path $InstallerExe)) {
    # Check if named with v prefix
    $AltExe = Join-Path $ReleaseDir "KAVACH-Setup-v$Version.exe"
    if (Test-Path $AltExe) {
        $InstallerExe = $AltExe
    }
}

if (Test-Path $InstallerExe) {
    Write-Host "  [SUCCESS] Installer compiled: $InstallerExe" -ForegroundColor Green
} else {
    Write-Error "Expected installer binary not found in $ReleaseDir."
}

# 5. Generate Checksums and Release Manifest
Write-Host "[5/5] Generating Cryptographic Checksums & Release Manifest..." -ForegroundColor Yellow

$FileHash = (Get-FileHash -Path $InstallerExe -Algorithm SHA256).Hash
$FileSize = (Get-Item $InstallerExe).Length
$FormattedSize = [math]::Round($FileSize / 1MB, 2)

$Manifest = [ordered]@{
    product = "KAVACH Enterprise SOAR-XDR Cyber Defense Platform"
    version = $Version
    build_timestamp_utc = (Get-Date).ToUniversalTime().ToString("u")
    installer_file = (Split-Path $InstallerExe -Leaf)
    file_size_bytes = $FileSize
    file_size_mb = "$FormattedSize MB"
    sha256 = $FileHash
    target_os = "Windows 10 / Windows 11 (64-bit)"
    prerequisites = @{
        min_ram = "4 GB"
        min_storage = "500 MB"
        admin_elevation = "Required only during initial Windows Service registration"
    }
    components_included = @(
        "KAVACH Windows Endpoint Background Service (Session 0)",
        "KAVACH Flutter Desktop Companion UI (Session 1+)",
        "KAVACH System Tray Guardian & Emergency One-Click Shield",
        "16 High-Precision Operating System Telemetry Sensors",
        "Encrypted SQLite Offline Spool Buffer & Exponential Shipper",
        "Hardware DPAPI Device Identity & Cryptographic Enrollment"
    )
}

$ManifestJson = $Manifest | ConvertTo-Json -Depth 5
$ManifestPath = Join-Path $ReleaseDir "release_manifest.json"
Set-Content -Path $ManifestPath -Value $ManifestJson -Encoding UTF8

$ChecksumPath = Join-Path $ReleaseDir "SHA256SUMS.txt"
Set-Content -Path $ChecksumPath -Value "$FileHash  $([System.IO.Path]::GetFileName($InstallerExe))" -Encoding UTF8

Write-Host "  [OK] SHA-256 Checksum: $FileHash" -ForegroundColor Green
Write-Host "  [OK] Manifest created: $ManifestPath" -ForegroundColor Green

# Sync release artifacts to frontend download directory
$FrontendReleases = Join-Path $WorkspaceRoot "kavach-frontend\releases"
if (-not (Test-Path $FrontendReleases)) {
    New-Item -ItemType Directory -Path $FrontendReleases -Force | Out-Null
}
Copy-Item -Path $InstallerExe -Destination (Join-Path $FrontendReleases (Split-Path $InstallerExe -Leaf)) -Force
Write-Host "  [OK] Synced installer binary to kavach-frontend/releases/" -ForegroundColor Green
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  KAVACH RELEASE BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "  Binary:   $InstallerExe" -ForegroundColor Green
Write-Host "  Size:     $FormattedSize MB" -ForegroundColor Green
Write-Host "  Checksum: $FileHash" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
