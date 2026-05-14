@echo off
title Multi-Agent System

echo.
echo ========================================
echo   Multi-Agent System - Starting
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Starting backend...
start "Backend" cmd /k "cd backend && python app.py"

echo [2/2] Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5001
echo.
echo IMPORTANT: Do NOT close the black windows!
echo.
pause
