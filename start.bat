@echo off
title Homedify - Master Controller
echo ==================================================
echo         HOMEDIFY SYSTEM BOOTLOADER
echo ==================================================
echo.

:: 1. Start AI Engine (Flask API)
echo [1/3] Starting AI Trust Engine (Port 5001)...
start "Homedify AI Engine" cmd /k "cd Ai_Model && call venv\Scripts\activate && python api.py"

:: 2. Start Backend (Node.js)
echo [2/3] Starting Backend Server (Port 5000)...
start "Homedify Backend" cmd /k "cd backend && npm run dev"

:: 3. Start Frontend (Next.js/React)
echo [3/3] Starting Frontend Dashboard (Port 3000)...
start "Homedify Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==================================================
echo   SUCCESS: All 3 services are launching!
echo   1. AI Service:  http://127.0.0.1:5001
echo   2. Backend:     http://localhost:5000
echo   3. Website:     http://localhost:3000
echo ==================================================
echo.
echo TIP: If you want to test the standalone camera scanner, 
echo      run 'python final_engine.py' inside the Ai_Model folder.
echo.
pause
