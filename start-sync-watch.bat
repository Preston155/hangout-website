@echo off
setlocal
cd /d "%~dp0"

echo Veltrix auto-sync + auto-publish
echo.
echo - Pulls new commands from your bot every 2 min
echo - Commits and pushes site changes to GitHub
echo.
echo Add BOT3_SSH_PASSWORD to .env first.
echo Press Ctrl+C to stop.
echo.

npm run auto-publish
