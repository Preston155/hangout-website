@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Start Auto-Publish (hidden background)
echo ============================================
echo.
echo Starting in the background — no window will stay open.
echo Logs: logs\auto-publish.log
echo To stop: stop-auto-publish.bat
echo.

wscript //B "%~dp0start-auto-publish-hidden.vbs"

timeout /t 2 /nobreak >nul

if exist ".auto-publish.pid" (
  echo Auto-publish is running.
) else (
  echo Could not confirm start. Check logs\auto-publish.log
)

echo.
pause
