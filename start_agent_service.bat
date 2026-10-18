@echo off
TITLE KAVACH Endpoint Agent Service
echo ========================================================
echo   Starting KAVACH Endpoint Telemetry & Defense Service...
echo ========================================================
echo.

set "PYTHON_EXE="
if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" "%~dp0backend\app\agent\service.py"
pause
