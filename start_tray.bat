@echo off
TITLE KAVACH System Tray Guardian
echo ========================================================
echo   Launching KAVACH System Tray Guardian...
echo ========================================================
echo.

set "PYTHON_EXE="
if exist "%~dp0backend\.venv\Scripts\pythonw.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\pythonw.exe"
) else if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=pythonw"
)

start "KAVACH Tray" "%PYTHON_EXE%" "%~dp0backend\app\agent\tray_companion.py"
echo KAVACH Tray Guardian active in notification area.
