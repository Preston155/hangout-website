const fs = require("fs");
const path = require("path");
const { syncRootDeploy } = require("./sync-root-deploy");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "httpdocs-ready");
const PUBLIC = path.join(ROOT, "public");

const HTACCESS = `DirectoryIndex index.html
Options -Indexes

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^u/([A-Za-z0-9_.-]+)/?$ /index.html#/u/$1 [NE,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "same-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  <FilesMatch "^(index\\.html)?$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  <FilesMatch "\\.(?:css|js|json|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
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
  console.log("Building httpdocs-ready (PrestonHQ Profiles)...");
  rimraf(OUT);
  fs.mkdirSync(OUT, { recursive: true });
  copyDir(PUBLIC, OUT);
  fs.writeFileSync(path.join(OUT, ".htaccess"), HTACCESS);
  syncRootDeploy();
  console.log(`Done. Deploy contents of:\n  ${OUT}`);
}

main();
