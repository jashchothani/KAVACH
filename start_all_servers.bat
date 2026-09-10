@echo off
TITLE KAVACH Launcher
echo ========================================================
echo   Starting KAVACH Threat Defense Platform Servers...
echo ========================================================
echo.

echo [1/2] Launching Backend API (FastAPI) on port 8000...
start "KAVACH Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Web App (Vite) on port 5173...
start "KAVACH Frontend (React/Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   KAVACH Servers Launched!
echo   - Backend API:       http://localhost:8000
echo   - API Swagger Docs:  http://localhost:8000/docs
echo   - Frontend Web App:  http://localhost:5173
echo   - 3D Showcase:       http://localhost:5173/showcase
echo ========================================================
echo.
pause
