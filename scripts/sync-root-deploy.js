const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "httpdocs-ready");

const DEPLOY_ENTRIES = [
  "index.html",
  "favicon.svg",
  ".htaccess",
  "css",
  "js",
  "data",
  "assets",
  "api",
];

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

function inlineCriticalAssets(rootDir) {
  const indexPath = path.join(rootDir, "index.html");
  if (!fs.existsSync(indexPath)) return;

  const cssPath = path.join(rootDir, "css", "commands.css");
  const adminPath = path.join(rootDir, "js", "admin-editor.js");
  const appPath = path.join(rootDir, "js", "app.js");

  let html = fs.readFileSync(indexPath, "utf8");
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
  const admin = fs.existsSync(adminPath) ? fs.readFileSync(adminPath, "utf8") : "";
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, "utf8") : "";

  html = html
    .replace(/\s*<link rel="preload" href="assets\/veltrix-logo-256\.webp\?v=8"[^>]*>\s*/g, "\n")
    .replace(/\s*<link rel="preload" href="data\/bot-commands\.json\?v=\d+"[^>]*>\s*/g, "\n")
    .replace(/\s*<link rel="preload" href="data\/ecrp-commands\.json\?v=\d+"[^>]*>\s*/g, "\n")
    .replace(/\s*<link rel="stylesheet" href="css\/commands\.css\?v=\d+"\s*\/?>\s*/g, `\n    <style id="inlineCommandsCss">${css.replace(/<\/style/gi, "<\\/style")}</style>\n`)
    .replace(/\s*<script defer src="js\/admin-editor\.js\?v=\d+"><\/script>\s*/g, `\n    <script id="inlineAdminEditorJs">${admin.replace(/<\/script/gi, "<\\/script")}</script>\n`)
    .replace(/\s*<script defer src="js\/app\.js\?v=\d+"><\/script>\s*/g, `\n    <script id="inlineAppJs">${app.replace(/<\/script/gi, "<\\/script")}</script>\n`);

  fs.writeFileSync(indexPath, html);
}

function syncRootDeploy() {
  if (!fs.existsSync(SRC)) {
    throw new Error("Missing httpdocs-ready/. Run npm run build:httpdocs first.");
  }

  console.log("Syncing httpdocs-ready → repo root (for Plesk Git deploy)...");

  for (const name of DEPLOY_ENTRIES) {
    const from = path.join(SRC, name);
    const to = path.join(ROOT, name);
    if (!fs.existsSync(from)) continue;

    if (fs.statSync(from).isDirectory()) {
      rimraf(to);
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }

  inlineCriticalAssets(ROOT);
  inlineCriticalAssets(SRC);
  console.log("Root deploy files updated.");
}

if (require.main === module) {
  syncRootDeploy();
}

module.exports = { syncRootDeploy };
