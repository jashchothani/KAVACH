@echo off
title KAVACH 16-Collector Endpoint Security Agent
echo ======================================================================
echo   KAVACH Standalone 16-Sensor Endpoint Telemetry Agent
echo   Edge Classification + Resilient Spooler + Cloud Shipper
echo ======================================================================
echo.

if exist "%~dp0KavachCollectorAgent.exe" (
    echo [*] Starting compiled KavachCollectorAgent.exe silently in background...
    start "" "%~dp0KavachCollectorAgent.exe" --startup --silent
    goto :done
)

if exist "%~dp0backend\.venv\Scripts\python.exe" (
    echo [*] Starting collector agent via venv pythonw...
    start "" "%~dp0backend\.venv\Scripts\pythonw.exe" "%~dp0backend\collector_agent_entry.py" --startup --silent
    goto :done
)

echo [*] Starting collector agent via system pythonw...
start "" pythonw "%~dp0backend\collector_agent_entry.py" --startup --silent

:done
echo [✓] KAVACH 16-Collector Agent dispatched to background.
echo     Status file: %LOCALAPPDATA%\KAVACH\agent_runtime_status.json
exit /b 0
