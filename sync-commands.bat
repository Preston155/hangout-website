@echo off
setlocal
cd /d "%~dp0"

echo Syncing Veltrix commands from source...
call npm run sync:commands
if errorlevel 1 (
  echo.
  echo Sync failed. Check .env has BOT3_SSH_HOST + BOT3_SSH_PASSWORD or BOT3_LOCAL_PATH.
  pause
  exit /b 1
)

echo.
echo Done. If auto-publish is running, the site will push automatically.
echo Otherwise run: npm run build  then git push
pause
