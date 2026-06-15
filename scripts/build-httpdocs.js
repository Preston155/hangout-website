const fs = require("fs");
const path = require("path");
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
# ER:LC CAD API (PHP — works on Plesk without Node.js)
RewriteCond %{REQUEST_URI} ^/api/
RewriteCond %{REQUEST_URI} !^/api/health
RewriteCond %{REQUEST_URI} !^/api/install-cad-db
RewriteRule ^api/(.*)$ api/cad/router.php [L,QSA]
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

## PHP + MySQL (default on Plesk)

This build includes a **PHP CAD API** at \`api/cad/\` — no Node.js required.

### One-time setup

1. Git deploy (or upload \`httpdocs-ready\` contents to httpdocs)
2. Copy \`database/plesk.local.example.php\` → \`database/plesk.local.php\`
3. Paste your Plesk database password into \`plesk.local.php\`
4. Import \`database/install-all.sql\` via phpMyAdmin (if not done already)
5. Delete \`api/install-cad-db.php\` after setup

### Verify

- \`GET /api/health\` → \`{"ok":true,"mode":"cad","database":"connected"}\`
- Dev login: **admin** / **admin123** (disable with \`dev_login => false\` in plesk.local.php)

### Optional: Node.js

For Discord OAuth and the full Express server, enable Node.js with startup \`app.js\`.
See \`CAD-SETUP.md\` in the project root.
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
  } else {
    const downloadsDir = path.join(OUT, "downloads");
    fs.mkdirSync(downloadsDir, { recursive: true });
    fs.writeFileSync(path.join(downloadsDir, ".htaccess"), "Options -Indexes\n");
  }

  const dbDir = path.join(OUT, "database");
  fs.mkdirSync(dbDir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "database", "install-all.sql"), path.join(dbDir, "install-all.sql"));
  fs.copyFileSync(path.join(ROOT, "database", "plesk.local.example.php"), path.join(dbDir, "plesk.local.example.php"));
  fs.writeFileSync(path.join(dbDir, ".htaccess"), "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n");
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

  fs.writeFileSync(path.join(OUT, ".htaccess"), HTACCESS);
  fs.writeFileSync(path.join(OUT, "DEPLOY-PLESK.md"), DEPLOY);

  syncRootDeploy();

  console.log(`Done. Upload contents of:\n  ${OUT}\n  into Plesk httpdocs (not the folder itself).`);
}

main();
