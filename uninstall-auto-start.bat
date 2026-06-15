@echo off
setlocal
cd /d "%~dp0"

set "LINK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Hangout Auto Publish.lnk"

echo ============================================
echo   Remove Auto-Publish from Windows Login
echo ============================================
echo.

if exist "%LINK%" (
  del "%LINK%"
  echo Removed startup shortcut.
) else (
  echo No startup shortcut found — nothing to remove.
)

echo.
echo To stop a running watcher now, run: stop-auto-publish.bat
echo.
pause
