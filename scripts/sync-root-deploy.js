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

  console.log("Root deploy files updated.");
}

if (require.main === module) {
  syncRootDeploy();
}

module.exports = { syncRootDeploy };
