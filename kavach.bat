@echo off
setlocal
set "KAVACH_ROOT=C:\KAVACH"
if exist "%KAVACH_ROOT%\backend\.venv\Scripts\python.exe" (
    "%KAVACH_ROOT%\backend\.venv\Scripts\python.exe" "%KAVACH_ROOT%\backend\kavach_tui.py" %*
) else (
    python "%KAVACH_ROOT%\backend\kavach_tui.py" %*
)
