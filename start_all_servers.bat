@echo off
TITLE KAVACH Launcher
echo ========================================================
echo   Starting KAVACH Threat Defense Platform Servers...
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

echo [1/2] Launching Backend API (FastAPI) on port 8000...
start "KAVACH Backend (FastAPI)" cmd /k "cd /d %~dp0backend && "%PYTHON_EXE%" -m uvicorn app.main:create_app --factory --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Web App (Vite) on port 5173...
start "KAVACH Frontend (React/Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   KAVACH Servers Launched!
echo   - Backend API:       http://localhost:8000
echo   - API Swagger Docs:  http://localhost:8000/docs
echo   - Frontend Web App:  http://localhost:5173
echo ========================================================
echo.
pause
