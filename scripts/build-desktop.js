const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DESKTOP = path.join(ROOT, "desktop");
const DIST = path.join(DESKTOP, "dist");
const OUT = path.join(ROOT, "httpdocs-ready", "downloads");

const SOURCE_FILES = [
  path.join(DESKTOP, "main.js"),
  path.join(DESKTOP, "preload.js"),
  path.join(DESKTOP, "package.json"),
  path.join(DESKTOP, "icon.png"),
];

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" },
  });
}

function findExe() {
  if (!fs.existsSync(DIST)) return null;

  const rootExes = fs
    .readdirSync(DIST)
    .filter((f) => f.endsWith(".exe"))
    .map((f) => path.join(DIST, f));

  const portable = rootExes.find((f) => path.basename(f).includes("Portable"));
  if (portable) return portable;

  const unpacked = path.join(DIST, "win-unpacked", "Discord Remake.exe");
  if (fs.existsSync(unpacked)) return unpacked;

  return rootExes[0] || null;
}

function needsRebuild() {
  const exe = findExe();
  if (!exe) return true;

  const exeTime = fs.statSync(exe).mtimeMs;
  return SOURCE_FILES.some((file) => {
    if (!fs.existsSync(file)) return true;
    return fs.statSync(file).mtimeMs > exeTime;
  });
}

function copyInstaller() {
  const exe = findExe();
  if (!exe) {
    console.warn("No .exe found — run: npm run build:desktop:full");
    return false;
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(exe, path.join(OUT, "Discord-Remake-Setup.exe"));
  fs.copyFileSync(exe, path.join(OUT, "Discord-Remake-Portable.exe"));
  const mb = (fs.statSync(exe).size / 1024 / 1024).toFixed(1);
  console.log(`Copied ${path.basename(exe)} (${mb} MB) → downloads/`);
  return true;
}

function main() {
  const force = process.argv.includes("--full");
  const copyOnly = process.argv.includes("--copy");

  if (copyOnly) {
    if (!copyInstaller()) process.exit(1);
    return;
  }

  if (!force && !needsRebuild()) {
    console.log("Desktop exe is up to date — skipping rebuild (use --full to force).");
    copyInstaller();
    return;
  }

  console.log("Building Windows desktop app...\n");
  if (!fs.existsSync(path.join(DESKTOP, "node_modules"))) {
    run("npm install", DESKTOP);
  }
  run("npm run build", DESKTOP);
  if (!copyInstaller()) process.exit(1);
  console.log("\nDone. Run npm run build:httpdocs then upload downloads/ to your server.");
}

main();
