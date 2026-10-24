@echo off
title KAVACH 16-Collector Endpoint Security Agent
echo ======================================================================
echo   KAVACH Standalone 16-Sensor Endpoint Telemetry Agent
echo   Edge Classification + Resilient Spooler + Cloud Shipper
echo ======================================================================
echo.

if exist "%~dp0kavach_silent_agent.vbs" (
    wscript.exe "%~dp0kavach_silent_agent.vbs"
    goto :done
)

if exist "%~dp0KavachCollectorAgent.exe" (
    start "" /B "%~dp0KavachCollectorAgent.exe" --startup --silent
    goto :done
)

if exist "%~dp0backend\.venv\Scripts\pythonw.exe" (
    start "" /B "%~dp0backend\.venv\Scripts\pythonw.exe" "%~dp0backend\collector_agent_entry.py" --startup --silent
    goto :done
)

start "" /B pythonw "%~dp0backend\collector_agent_entry.py" --startup --silent

:done
echo [✓] KAVACH 16-Collector Agent dispatched to background.
echo     Status file: %LOCALAPPDATA%\KAVACH\agent_runtime_status.json
exit /b 0
