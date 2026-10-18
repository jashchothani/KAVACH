@echo off
TITLE KAVACH Windows Companion
echo ========================================================
echo   Launching KAVACH Windows Companion GUI...
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

start "KAVACH Windows Companion" "%PYTHON_EXE%" "%~dp0backend\app\agent\companion.py"
echo KAVACH Companion launched successfully.
