@echo off
setlocal
cd /d "%~dp0"

if not exist "logs\auto-publish.log" (
  echo No log file yet. Start auto-publish first.
  pause
  exit /b 1
)

notepad "logs\auto-publish.log"
