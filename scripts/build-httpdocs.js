const fs = require("fs");
const path = require("path");
const { writeDesktopVersion } = require("./write-desktop-version");
const { syncRootDeploy } = require("./sync-root-deploy");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "httpdocs-ready");
const PUBLIC = path.join(ROOT, "public");

const COPY_FILES = [];

const HTACCESS = `# Discord Remake - Plesk httpdocs (PHP)
DirectoryIndex index.html

<IfModule mod_headers.c>
  <FilesMatch "^(index\\.html)?$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^api/install-cad-db(\.php)?/?$ api/install-cad-db.php [L,QSA]
RewriteRule ^api/health(\.php)?/?$ api/health.php [L,QSA]
RewriteRule ^api/login(\.php)?/?$ api/auth/login.php [L,QSA]
RewriteRule ^api/register(\.php)?/?$ api/auth/register.php [L,QSA]
RewriteRule ^api/restore(\.php)?/?$ api/auth/restore.php [L,QSA]
RewriteRule ^api/auth/register(\.php)?/?$ api/auth/register.php [L,QSA]
RewriteRule ^api/auth/login(\.php)?/?$ api/auth/login.php [L,QSA]
RewriteRule ^api/auth/restore(\.php)?/?$ api/auth/restore.php [L,QSA]
RewriteRule ^api/servers/channels(\.php)?/?$ api/servers/channels.php [L,QSA]
RewriteRule ^api/servers/create(\.php)?/?$ api/servers/create.php [L,QSA]
RewriteRule ^api/channels/create(\.php)?/?$ api/channels/create.php [L,QSA]
RewriteRule ^api/channels/join(\.php)?/?$ api/channels/join.php [L,QSA]
RewriteRule ^api/messages/send(\.php)?/?$ api/messages/send.php [L,QSA]
RewriteRule ^api/messages/upload(\.php)?/?$ api/messages/upload.php [L,QSA]
RewriteRule ^api/messages/poll(\.php)?/?$ api/messages/poll.php [L,QSA]
RewriteRule ^api/servers/join(\.php)?/?$ api/servers/join.php [L,QSA]
RewriteRule ^api/servers/update(\.php)?/?$ api/servers/update.php [L,QSA]
RewriteRule ^api/servers/leave(\.php)?/?$ api/servers/leave.php [L,QSA]
RewriteRule ^api/profile/update(\.php)?/?$ api/profile/update.php [L,QSA]
RewriteRule ^api/profile/upload(\.php)?/?$ api/profile/upload.php [L,QSA]
RewriteRule ^api/friends/list(\.php)?/?$ api/friends/list.php [L,QSA]
RewriteRule ^api/friends/add(\.php)?/?$ api/friends/add.php [L,QSA]
RewriteRule ^api/dms/list(\.php)?/?$ api/dms/list.php [L,QSA]
RewriteRule ^api/dms/open(\.php)?/?$ api/dms/open.php [L,QSA]
RewriteRule ^api/typing/ping(\.php)?/?$ api/typing/ping.php [L,QSA]
RewriteRule ^api/typing/poll(\.php)?/?$ api/typing/poll.php [L,QSA]
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

const DEPLOY = `# Plesk Deploy — ER:LC CAD / MDT

## Node.js required

This CAD system runs on **Node.js + MySQL**, not PHP alone.

### Setup on Plesk

1. Upload the full project (or use Git deploy)
2. Enable **Node.js** → startup file: \`app.js\`
3. Set environment variables from \`.env.example\`
4. Create MySQL database → run \`npm run db:init\` or import \`database/schema.sql\`
5. Run \`npm install\` and restart Node.js app

### Static-only folder (this httpdocs-ready build)

This folder contains the **frontend static files** only.
The API (\`/api/*\`) and auth (\`/auth/*\`) routes are served by the Node.js app.

For production, deploy the **full repo** with Node.js enabled — not just this folder.

### Verify

- \`GET /api/health\` → \`{"ok":true,"mode":"cad","database":"connected"}\`
- Login at \`/\` with Discord or dev credentials

See \`CAD-SETUP.md\` in the project root for full instructions.
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

  const apiDir = path.join(ROOT, "api");
  if (fs.existsSync(apiDir)) {
    copyDir(apiDir, path.join(OUT, "api"));
  }

  const rootDownloads = path.join(ROOT, "downloads");
  if (fs.existsSync(rootDownloads)) {
    copyDir(rootDownloads, path.join(OUT, "downloads"));
  }

  const dbDir = path.join(OUT, "database");
  fs.mkdirSync(dbDir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "database", "install-all.sql"), path.join(dbDir, "install-all.sql"));
  fs.copyFileSync(path.join(ROOT, "database", "plesk.local.example.php"), path.join(dbDir, "plesk.local.example.php"));
  fs.copyFileSync(path.join(ROOT, "database", "install-all.sql"), path.join(OUT, "api", "install-all.sql"));

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

  writeDesktopVersion(downloadsDir);

  fs.writeFileSync(path.join(OUT, ".htaccess"), HTACCESS);
  fs.writeFileSync(path.join(OUT, "DEPLOY-PLESK.md"), DEPLOY);

  syncRootDeploy();

  console.log(`Done. Upload contents of:\n  ${OUT}\n  into Plesk httpdocs (not the folder itself).`);
}

main();
