@echo off
title KAVACH — Web Frontend
echo Starting KAVACH React Frontend on port 5173...
if exist "%~dp0frontend\package.json" (
    cd /d "%~dp0frontend" && npm run dev
) else (
    python "%~dp0scripts\start_frontend.py"
)
pause
