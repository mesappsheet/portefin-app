@echo off
cd /d "%~dp0"
echo.
echo Serveur HTTP sur http://localhost:8765
echo Ouvrez: http://localhost:8765/LOCAL_APPS.html
echo Ctrl+C pour arreter.
echo.
start "" "http://localhost:8765/LOCAL_APPS.html"
python -m http.server 8765
