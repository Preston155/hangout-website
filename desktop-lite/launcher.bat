@echo off
set "URL=https://prestonhq.com/?desktop=1"
set "TITLE=Discord Remake"

where msedge >nul 2>&1 && (
  start "" msedge --app=%URL% --window-size=1280,800 --disable-features=msEdgeSidebar,msSmartScreenProtection
  exit /b 0
)

where chrome >nul 2>&1 && (
  start "" chrome --app=%URL% --window-size=1280,800
  exit /b 0
)

where brave >nul 2>&1 && (
  start "" brave --app=%URL% --window-size=1280,800
  exit /b 0
)

start "" %URL%
exit /b 0
