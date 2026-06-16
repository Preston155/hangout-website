#!/usr/bin/env node
/**
 * Push admin dashboard command edits to the live Veltrix bot over SSH.
 * Usage: npm run sync:to-bot
 */

const fs = require("fs");
const path = require("path");
const { parseAllSourceFiles } = require("./lib/parse-bot-source");
const { fetchLocal, fetchRemote } = require("./lib/fetch-bot-source");
const { buildCommandSourceIndex } = require("./lib/command-source-index");
const { applyPatchesToBotSource } = require("./lib/patch-bot-source");
const { pushRemoteFiles } = require("./lib/push-bot-source");
const { overridesToMetaPatches } = require("./lib/merge-admin-overrides");

const ROOT = path.join(__dirname, "..");
const OVERRIDES_JSON = path.join(ROOT, "public", "data", "admin-overrides.json");
const META_JSON = path.join(ROOT, "scripts", "bot-commands.meta.json");
const SOURCES_JSON = path.join(ROOT, "scripts", "command-sources.json");

loadEnv(path.join(ROOT, ".env"));

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function log(msg) {
  console.log(`[sync-to-bot] ${msg}`);
}

async function loadSourceFiles() {
  const localPath = process.env.BOT3_LOCAL_PATH;
  if (localPath && fs.existsSync(localPath)) {
    log(`Reading local bot source: ${localPath}`);
    return { filesMap: await fetchLocal(localPath), localPath };
  }

  const host = process.env.BOT3_SSH_HOST;
  const user = process.env.BOT3_SSH_USER || "root";
  const password = process.env.BOT3_SSH_PASSWORD;
  const keyPath = process.env.BOT3_SSH_KEY_PATH;
  const remotePath = process.env.BOT3_REMOTE_PATH || "/root/bots/bot3";

  if (!host) throw new Error("Set BOT3_LOCAL_PATH or BOT3_SSH_HOST in .env");

  log(`Fetching bot source via SSH: ${user}@${host}:${remotePath}`);
  const filesMap = await fetchRemote({
    host,
    username: user,
    password,
    privateKeyPath: keyPath,
    remotePath,
    port: Number(process.env.BOT3_SSH_PORT || 22),
  });
  return { filesMap, remotePath, host, user, password, keyPath };
}

async function syncToBot(options = {}) {
  if (!fs.existsSync(OVERRIDES_JSON)) {
    throw new Error("Missing admin-overrides.json — save edits in the dashboard first.");
  }

  const adminOverrides = JSON.parse(fs.readFileSync(OVERRIDES_JSON, "utf8"));
  const patches = adminOverrides.commands || {};
  if (!Object.keys(patches).length) {
    log("No command overrides to apply.");
    return { changed: false };
  }

  const meta = JSON.parse(fs.readFileSync(META_JSON, "utf8"));
  const { filesMap, localPath, remotePath, host, user, password, keyPath } = await loadSourceFiles();

  const extracted = parseAllSourceFiles(filesMap);
  const sourceIndex = buildCommandSourceIndex(extracted, meta);
  fs.writeFileSync(SOURCES_JSON, JSON.stringify(sourceIndex, null, 2) + "\n", "utf8");

  const { filesMap: patchedMap, changedFiles, log: patchLog } = applyPatchesToBotSource(
    filesMap,
    sourceIndex,
    patches,
  );

  for (const line of patchLog) log(line);

  if (!changedFiles.length) {
    log("No bot source files needed changes.");
    return { changed: false };
  }

  if (localPath && !options.remote) {
    for (const rel of changedFiles) {
      const full = path.join(localPath, "src", rel);
      const alt = path.join(localPath, rel);
      const target = fs.existsSync(path.dirname(full)) ? full : alt;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, patchedMap.get(rel), "utf8");
      log(`Wrote ${target}`);
    }
  } else if (remotePath && host) {
    const restartCmd = process.env.BOT3_RESTART_CMD || "pm2 restart bot3 2>/dev/null || pm2 restart all 2>/dev/null || true";
    const result = await pushRemoteFiles({
      host,
      username: user,
      password,
      privateKeyPath: keyPath,
      remotePath,
      filesMap: patchedMap,
      changedFiles,
      restartCmd,
    });
    log(`Uploaded ${result.written.length} file(s) to bot server.`);
    if (result.restarted) log(`Restart: ${result.restartOutput || "ok"}`);
  } else {
    throw new Error("No local or remote target to write bot files.");
  }

  const nextMeta = overridesToMetaPatches(adminOverrides, meta);
  fs.writeFileSync(META_JSON, JSON.stringify(nextMeta, null, 2) + "\n", "utf8");
  log("Updated bot-commands.meta.json with dashboard overrides.");

  return { changed: true, changedFiles };
}

async function main() {
  try {
    await syncToBot();
  } catch (err) {
    console.error(`[sync-to-bot] Failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { syncToBot };

if (require.main === module) main();
