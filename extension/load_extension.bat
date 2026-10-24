@echo off
title KAVACH Browser Threat Sentinel - Extension Setup
color 0b
echo ======================================================================
echo    KAVACH Browser Threat Sentinel - Extension Setup Guide
echo ======================================================================
echo.
echo [1] Opening Chrome/Edge Extensions page...
start chrome://extensions 2>nul || start edge://extensions 2>nul
echo.
echo [2] Opening KAVACH Extension folder in File Explorer...
explorer.exe "%~dp0"
echo.
echo ======================================================================
echo THREE SIMPLE STEPS TO LOAD THE EXTENSION:
echo 1. In your browser (Chrome, Edge, or Brave), toggle ON "Developer mode"
echo    (located in the top-right corner of the Extensions page).
echo.
echo 2. Click the "Load unpacked" button (top-left).
echo.
echo 3. Select this folder:
echo    %~dp0
echo.
echo KAVACH Browser Threat Sentinel will immediately connect and protect!
echo ======================================================================
echo.
pause
