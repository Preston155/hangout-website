@echo off
setlocal
cd /d "%~dp0"

echo Publishing to GitHub NOW...
call npm run build:httpdocs
if errorlevel 1 exit /b 1

git add httpdocs-ready index.html favicon.svg .htaccess css js api downloads data uploads public cad database server.js app.js scripts package.json package-lock.json .env.example CAD-SETUP.md PLESK-DATABASE.md
git add -A

git diff --cached --quiet
if %errorlevel%==0 (
  echo No changes to publish.
  goto :push
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set STAMP=%%i
git -c user.name=Preston155 -c user.email=Preston155@users.noreply.github.com commit -m "Publish website update - %STAMP%"

:push
git push origin main
echo.
echo Done. Plesk should deploy in ~1-2 minutes.
pause
