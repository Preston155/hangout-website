@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Stop Auto Publish
echo ============================================
echo.
echo The easiest way to stop auto-publish is to close
echo the terminal window running start-auto-publish.bat
echo or press Ctrl+C in that window.
echo.

if not exist ".auto-publish.pid" (
  echo No .auto-publish.pid file found.
  echo Trying to find a running auto-publish.js process...
  goto :killByName
)

set /p PID=<".auto-publish.pid"
echo Found PID file: %PID%

tasklist /FI "PID eq %PID%" 2>nul | find /I "node.exe" >nul
if errorlevel 1 (
  echo Process %PID% is not running. Cleaning up PID file.
  del ".auto-publish.pid" 2>nul
  goto :killByName
)

echo Stopping auto-publish process %PID%...
taskkill /PID %PID% /T /F >nul 2>&1
if errorlevel 1 (
  echo Could not stop PID %PID%.
) else (
  echo Stopped.
)
del ".auto-publish.pid" 2>nul
goto :done

:killByName
for /f "tokens=2" %%i in ('wmic process where "CommandLine like '%%auto-publish.js%%'" get ProcessId /format:list 2^>nul ^| find "="') do (
  echo Stopping node auto-publish.js PID %%i...
  taskkill /PID %%i /T /F >nul 2>&1
)

:done
echo.
echo Done.
pause
