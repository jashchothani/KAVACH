@echo off
title KAVACH — Standalone Backend
echo Starting KAVACH Backend on port 8000...
if exist "%~dp0backend\.venv\Scripts\python.exe" (
    "%~dp0backend\.venv\Scripts\python.exe" "%~dp0scripts\start_backend.py"
) else (
    python "%~dp0scripts\start_backend.py"
)
pause
