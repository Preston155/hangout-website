@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Install Auto-Publish at Windows Login
echo ============================================
echo.
echo This adds a shortcut to your Startup folder so
echo auto-publish runs every time you log in to Windows.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-auto-start.ps1"

if errorlevel 1 (
  echo.
  echo Install failed. Try running this file as your normal user account.
)

echo.
pause
