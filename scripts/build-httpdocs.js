const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "httpdocs-ready");
const PUBLIC = path.join(ROOT, "public");

const COPY_FILES = [];

const HTACCESS = `# Discord Remake - Plesk httpdocs (PHP)
DirectoryIndex index.html

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^api/health/?$ api/health.php [L,QSA]
RewriteRule ^api/auth/register/?$ api/auth/register.php [L,QSA]
RewriteRule ^api/auth/login/?$ api/auth/login.php [L,QSA]
RewriteRule ^api/auth/restore/?$ api/auth/restore.php [L,QSA]
RewriteRule ^api/servers/channels/?$ api/servers/channels.php [L,QSA]
RewriteRule ^api/servers/create/?$ api/servers/create.php [L,QSA]
RewriteRule ^api/channels/create/?$ api/channels/create.php [L,QSA]
RewriteRule ^api/channels/join/?$ api/channels/join.php [L,QSA]
RewriteRule ^api/messages/send/?$ api/messages/send.php [L,QSA]
RewriteRule ^api/messages/upload/?$ api/messages/upload.php [L,QSA]
RewriteRule ^api/messages/poll/?$ api/messages/poll.php [L,QSA]
RewriteRule ^api/servers/join/?$ api/servers/join.php [L,QSA]
RewriteRule ^api/profile/update/?$ api/profile/update.php [L,QSA]
RewriteRule ^api/profile/upload/?$ api/profile/upload.php [L,QSA]
RewriteRule ^api/friends/list/?$ api/friends/list.php [L,QSA]
RewriteRule ^api/friends/add/?$ api/friends/add.php [L,QSA]
RewriteRule ^api/dms/list/?$ api/dms/list.php [L,QSA]
RewriteRule ^api/dms/open/?$ api/dms/open.php [L,QSA]
RewriteRule ^api/typing/ping/?$ api/typing/ping.php [L,QSA]
RewriteRule ^api/typing/poll/?$ api/typing/poll.php [L,QSA]
RewriteRule ^data(/|$) - [F,L]
RewriteRule ^node_modules(/|$) - [F,L]
RewriteRule ^(server|app)\\.js$ - [F,L]
RewriteRule ^package\\.json$ - [F,L]
</IfModule>
`;

const DATA_HTACCESS = `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
`;

const DEPLOY = `# Plesk Deploy — Discord Remake

## IMPORTANT — fix 403 Forbidden

403 means Apache cannot find \`index.html\` at the **httpdocs root**, or Node.js is not enabled.

Upload the **contents** of this folder directly into httpdocs (not the \`httpdocs-ready\` folder itself).

Your httpdocs should look like:
\`\`\`
httpdocs/
  index.html      ← must be here
  css/
  js/             ← discord.js, ui.js, auth-boot.js
  api/            ← REQUIRED
  data/           ← chmod 775
  .htaccess
\`\`\`

## Works on PHP alone (no Node.js required)

Auth + chat use the **api/** PHP folder. Node.js is optional for faster WebSocket chat.

## Verify PHP API

Open: \`https://prestonhq.com/api/health.php\`
Should return: \`{"ok":true,"mode":"php"}\`

## Upload checklist

\`\`\`
httpdocs/
  index.html
  css/
  js/          ← includes auth-boot.js
  api/         ← REQUIRED for register/chat
  uploads/     ← chmod 775 (profile images)
  data/        ← chmod 775
  .htaccess
\`\`\`

## Permissions (File Manager)

Select httpdocs folder → Permissions:
- Folders: **755**
- Files: **644**
- \`data/\` folder: **775** (writable)

## Still 403?

1. Confirm \`index.html\` exists in httpdocs root (not inside a subfolder)
2. Confirm Node.js is **Enabled** and app **Restarted**
3. Check Plesk **Node.js → Logs** for startup errors
4. Delete any old \`public/\` subfolder if you uploaded the previous build
`;

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rimraf(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function main() {
  console.log("Building httpdocs-ready for Plesk...");
  rimraf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  for (const file of COPY_FILES) {
    fs.copyFileSync(path.join(ROOT, file), path.join(OUT, file));
  }

  // Flatten public/ into httpdocs root so Apache finds index.html
  copyDir(PUBLIC, OUT);
  copyDir(path.join(ROOT, "api"), path.join(OUT, "api"));

  const socketClient = path.join(ROOT, "node_modules", "socket.io", "client-dist", "socket.io.min.js");
  const vendorDir = path.join(OUT, "js", "vendor");
  if (fs.existsSync(socketClient)) {
    fs.mkdirSync(vendorDir, { recursive: true });
    fs.copyFileSync(socketClient, path.join(vendorDir, "socket.io.min.js"));
  }

  const dataDir = path.join(OUT, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, ".htaccess"), DATA_HTACCESS);
  fs.writeFileSync(path.join(dataDir, ".gitkeep"), "");

  const uploadsDir = path.join(OUT, "uploads");
  fs.mkdirSync(path.join(uploadsDir, "avatars"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "banners"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "attachments"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "server-icons"), { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, ".htaccess"), "Options -Indexes\n");
  fs.writeFileSync(path.join(uploadsDir, ".gitkeep"), "");

  const downloadsDir = path.join(OUT, "downloads");
  fs.mkdirSync(downloadsDir, { recursive: true });

  const nativeExe = path.join(ROOT, "desktop-native", "dist", "Discord-Remake-Setup.exe");
  const liteExe = path.join(ROOT, "desktop-lite", "dist", "Discord-Remake-Setup.exe");
  const sourceExe = fs.existsSync(nativeExe)
    ? nativeExe
    : fs.existsSync(liteExe)
      ? liteExe
      : null;

  if (sourceExe) {
    fs.copyFileSync(sourceExe, path.join(downloadsDir, "Discord-Remake-Setup.exe"));
    fs.copyFileSync(sourceExe, path.join(downloadsDir, "Discord-Remake-Portable.exe"));
  } else {
    fs.writeFileSync(
      path.join(downloadsDir, "README.txt"),
      "Place Discord-Remake-Setup.exe here after running: npm run build:desktop\n",
    );
  }

  fs.writeFileSync(path.join(OUT, ".htaccess"), HTACCESS);
  fs.writeFileSync(path.join(OUT, "DEPLOY-PLESK.md"), DEPLOY);

  console.log(`Done. Upload contents of:\n  ${OUT}\n  into Plesk httpdocs (not the folder itself).`);
}

main();
