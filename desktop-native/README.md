# Discord Remake — Native Windows App

Real Windows desktop app using **WebView2** (system Edge engine). **No Electron. No browser tabs.**

## Build

```bash
npm run build:desktop
npm run build:httpdocs
```

Upload `httpdocs-ready/downloads/Discord-Remake-Setup.exe` to your site.

## What users get

- Native window with title bar and taskbar icon
- Loads https://prestonhq.com in an embedded WebView2 control
- External links open in the default browser
- `window.desktopApp.isDesktop === true` injected for the site

## Requirements (most PCs already have these)

- Windows 10/11
- [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)
- [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) (small, one-time if missing)

## Dev

```bash
cd desktop-native
dotnet run
```

Custom URL:

```bash
set APP_URL=http://localhost:3000
dotnet run
```

## Legacy builds

- `npm run build:desktop:lite` — tiny Edge launcher (not a real window)
- `npm run build:desktop:electron` — old 70MB Electron build (deprecated)
