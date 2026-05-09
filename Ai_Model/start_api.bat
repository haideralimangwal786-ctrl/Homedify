@echo off
echo ==============================================
echo  HOMEDIFY AI TRUST ENGINE - API SERVER
echo ==============================================
cd /d %~dp0
call venv\Scripts\activate
echo Virtual Environment Activated.
echo Starting Flask Server on port 5001...
python api.py
pause
