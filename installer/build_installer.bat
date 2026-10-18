@echo off
setlocal

echo ======================================================================
echo KAVACH Enterprise Windows Installer Compiler
echo ======================================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

set "ISCC_EXE="
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set "ISCC_EXE=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set "ISCC_EXE=C:\Program Files\Inno Setup 6\ISCC.exe"
) else if exist "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" (
    set "ISCC_EXE=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
) else (
    for %%X in (iscc.exe) do set "ISCC_EXE=%%~$PATH:X"
)

if not defined ISCC_EXE (
    echo [!] WARNING: Inno Setup Compiler ISCC.exe was not found in standard paths.
    echo [*] To build the standalone setup package, please install Inno Setup 6:
    echo     https://jrsoftware.org/isdl.php
    echo [*] You can compile manually once installed via:
    echo     ISCC.exe installer\kavach_setup.iss
    exit /b 1
)

echo [*] Found Inno Setup Compiler at: "%ISCC_EXE%"
echo [*] Compiling installer\kavach_setup.iss...

if not exist "release" mkdir "release"
if not exist "dist" mkdir "dist"

"%ISCC_EXE%" installer\kavach_setup.iss

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] KAVACH Windows Setup package compiled successfully into .\release\
) else (
    echo [ERROR] Failed to compile Inno Setup package. Error code: %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

endlocal
