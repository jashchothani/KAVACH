@echo off
setlocal

echo ===================================================
echo KAVACH - SOAR-XDR Platform
echo Production Startup Script (Unified Deployment)
echo ===================================================

cd /d "%~dp0"

:: Resolve Python executable
set "PYTHON_EXE="
if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo.
echo [1/3] Building Frontend UI...
cd frontend
if not exist "node_modules" (
    call npm install
)
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/3] Starting KAVACH Telemetry Collectors...
cd backend
start /b "" "%PYTHON_EXE%" collector_agent.py
cd ..

echo.
echo [3/3] Starting KAVACH Core Server...
echo The application will be available at: http://127.0.0.1:8000/
cd backend
"%PYTHON_EXE%" -m uvicorn app.main:create_app --host 0.0.0.0 --port 8000 --factory

endlocal
