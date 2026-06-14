@echo off
title Next-Level Logistics Launcher
echo ==========================================
echo  Next-Level Logistics - Starting Servers
echo ==========================================
echo.

:: Kill any existing processes on port 8000 and 3000
echo [1/3] Clearing ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Start API server in a new window
echo [2/3] Starting API server on port 8000...
start "API Server (port 8000)" cmd /k "cd /d %~dp0api && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Wait for API to boot
timeout /t 4 /nobreak >nul

:: Start Dashboard in a new window (Optional/Dev mode)
echo [3/3] Starting React Dev Server on port 3000...
start "React Dev Server (port 3000)" cmd /k "cd /d %~dp0dashboard && npm start"

echo.
echo =======================================================
echo  Servers are starting!
echo  API / Primary Dashboard: http://localhost:8000
echo  React Dev Server:        http://localhost:3000
echo =======================================================
echo.
echo This window can be closed.
pause
