# KAVACH Server Startup Script (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting KAVACH Threat Defense Platform Servers...   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

# 1. Start Backend Server
Write-Host "[1/2] Launching Backend API (FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 2

# 2. Start Frontend Server
Write-Host "[2/2] Launching Frontend Web App (Vite) on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  KAVACH Servers Launched Successfully!" -ForegroundColor Cyan
Write-Host "  - Backend API:       http://localhost:8000" -ForegroundColor White
Write-Host "  - API Swagger Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Frontend Web App:  http://localhost:5173" -ForegroundColor White
Write-Host "  - 3D Showcase:       http://localhost:5173/showcase" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
