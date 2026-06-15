# Plesk Deploy — Discord Remake

## IMPORTANT — fix 403 Forbidden

403 means Apache cannot find `index.html` at the **httpdocs root**, or Node.js is not enabled.

Upload the **contents** of this folder directly into httpdocs (not the `httpdocs-ready` folder itself).

Your httpdocs should look like:
```
httpdocs/
  index.html      ← must be here
  css/
  js/             ← discord.js, ui.js, auth-boot.js
  api/            ← REQUIRED
  data/           ← chmod 775
  .htaccess
```

## Works on PHP alone (no Node.js required)

Auth + chat use the **api/** PHP folder. Node.js is optional for faster WebSocket chat.

## Verify PHP API

Open: `https://prestonhq.com/api/health.php`
Should return: `{"ok":true,"mode":"php"}`

## Upload checklist

```
httpdocs/
  index.html
  css/
  js/          ← includes auth-boot.js
  api/         ← REQUIRED for register/chat
  uploads/     ← chmod 775 (profile images)
  data/        ← chmod 775
  .htaccess
```

## Permissions (File Manager)

Select httpdocs folder → Permissions:
- Folders: **755**
- Files: **644**
- `data/` folder: **775** (writable)

## Still 403?

1. Confirm `index.html` exists in httpdocs root (not inside a subfolder)
2. Confirm Node.js is **Enabled** and app **Restarted**
3. Check Plesk **Node.js → Logs** for startup errors
4. Delete any old `public/` subfolder if you uploaded the previous build
