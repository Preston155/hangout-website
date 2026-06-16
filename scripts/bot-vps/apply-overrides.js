#!/usr/bin/env node
/**
 * Runs on the bot VPS — applies dashboard overrides to local bot source.
 * Usage: node apply-overrides.js /path/to/overrides.json
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { parseAllSourceFiles } = require("./parse-bot-source");
const { buildCommandSourceIndex } = require("./command-source-index");
const { applyPatchesToBotSource } = require("./patch-bot-source");

const BOT_ROOT = path.join(__dirname, "..");
const SRC_ROOT = fs.existsSync(path.join(BOT_ROOT, "src")) ? path.join(BOT_ROOT, "src") : BOT_ROOT;

function walkJs(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJs(full, base, out);
    else if (entry.name.endsWith(".js")) out.push({ relative: path.relative(base, full).replace(/\\/g, "/"), full });
  }
  return out;
}

function loadBotFiles() {
  const map = new Map();
  for (const file of walkJs(SRC_ROOT, SRC_ROOT)) {
    map.set(file.relative, fs.readFileSync(file.full, "utf8"));
  }
  for (const name of ["config.js", "package.json"]) {
    const full = path.join(BOT_ROOT, name);
    if (fs.existsSync(full)) map.set(name, fs.readFileSync(full, "utf8"));
  }
  return map;
}

function writeBotFiles(filesMap, changedFiles) {
  for (const rel of changedFiles) {
    const content = filesMap.get(rel);
    const full =
      rel === "config.js" || rel === "package.json"
        ? path.join(BOT_ROOT, rel)
        : path.join(SRC_ROOT, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
}

function main() {
  const overridesPath = process.argv[2];
  if (!overridesPath || !fs.existsSync(overridesPath)) {
    console.error("Usage: node apply-overrides.js <overrides.json>");
    process.exit(1);
  }

  const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  const patches = overrides.commands || {};
  if (!Object.keys(patches).length) {
    console.log("No command patches.");
    return;
  }

  const metaPath = path.join(__dirname, "bot-commands.meta.json");
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : {};

  const filesMap = loadBotFiles();
  const extracted = parseAllSourceFiles(filesMap);
  const sourceIndex = buildCommandSourceIndex(extracted, meta);
  const { filesMap: patched, changedFiles, log } = applyPatchesToBotSource(filesMap, sourceIndex, patches);

  for (const line of log) console.log(line);

  if (!changedFiles.length) {
    console.log("No files changed.");
    return;
  }

  writeBotFiles(patched, changedFiles);
  console.log("Wrote:", changedFiles.join(", "));

  const restart = process.env.BOT_RESTART_CMD || "pm2 restart bot3 2>/dev/null || pm2 restart all 2>/dev/null || true";
  try {
    execSync(restart, { stdio: "inherit", cwd: BOT_ROOT });
  } catch {
  }
}

main();
