# KAVACH Server Startup Script (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting KAVACH Threat Defense Platform Servers...   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

# 1. Start Backend Server
Write-Host "[1/2] Launching Backend API (FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --reload --port 8000"

Start-Sleep -Seconds 2

# 2. Start Frontend Server (Pure HTML/CSS/JS)
Write-Host "[2/2] Launching Frontend Web App (HTML/CSS/JS) on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; backend\.venv\Scripts\python.exe scripts/start_frontend.py"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  KAVACH Servers Launched Successfully!" -ForegroundColor Cyan
Write-Host "  - Unified Web App & API: http://localhost:8000" -ForegroundColor White
Write-Host "  - User Security Shield:  http://localhost:8000/dashboard" -ForegroundColor White
Write-Host "  - SOC Analyst Console:   http://localhost:8000/analyst" -ForegroundColor White
Write-Host "  - Operations Login:      http://localhost:8000/login" -ForegroundColor White
Write-Host "  - Standalone Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host "  - API Swagger Docs:      http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
