#!/usr/bin/env node
/**
 * Sync Veltrix command list from live bot source → public/data/bot-commands.json
 *
 * Sources (first match wins):
 *   BOT3_LOCAL_PATH  — local folder (e.g. C:/dev/bot3)
 *   BOT3_SSH_*       — remote server at BOT3_REMOTE_PATH
 *
 * Usage:
 *   npm run sync:commands
 *   npm run sync:commands -- --watch
 *   npm run sync:commands -- --no-build
 */

const fs = require("fs");
const path = require("path");
const { parseAllSourceFiles, extractPrefixFromConfig } = require("./lib/parse-bot-source");
const { fetchLocal, fetchRemote, hashSourceMap } = require("./lib/fetch-bot-source");

const ROOT = path.join(__dirname, "..");
const OUT_JSON = path.join(ROOT, "public", "data", "bot-commands.json");
const META_JSON = path.join(ROOT, "scripts", "bot-commands.meta.json");
const HASH_FILE = path.join(ROOT, ".bot3-source-hash");

loadEnv(path.join(ROOT, ".env"));

const args = process.argv.slice(2);
const watchMode = args.includes("--watch");
const skipBuild = args.includes("--no-build");
const force = args.includes("--force");

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
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${stamp}] ${msg}`);
}

function loadMeta() {
  if (!fs.existsSync(META_JSON)) {
    throw new Error(`Missing ${META_JSON}`);
  }
  return JSON.parse(fs.readFileSync(META_JSON, "utf8"));
}

function applyOverride(cmd, override) {
  if (!override) return cmd;
  const merged = { ...cmd, ...override };
  if (override.subcommands && cmd.subcommands) {
    merged.subcommands = mergeSubcommands(cmd.subcommands, override.subcommands);
  }
  return merged;
}

function mergeSubcommands(fromBot, fromMeta) {
  const byName = new Map(fromBot.map((s) => [s.name, s]));
  for (const s of fromMeta) byName.set(s.name, { ...byName.get(s.name), ...s });
  return [...byName.values()];
}

function buildOutput(extractedMap, meta, prefix) {
  const buckets = { slash: [], prefix: [], session: [] };

  for (const entry of extractedMap.values()) {
    const { _category, _source, ...cmd } = entry;
    const overrideKey = `${_category}:${cmd.name}`;
    const merged = applyOverride(cmd, meta.overrides?.[overrideKey]);
    buckets[_category]?.push(merged);
  }

  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => a.name.localeCompare(b.name));
  }

  const categories = Object.entries(meta.categories).map(([id, cfg]) => {
    if (id === "systems") {
      return {
        id,
        ...cfg,
        commands: (meta.systems || []).map((s) => ({ ...s, type: "system" })),
      };
    }
    return {
      id,
      ...cfg,
      commands: buckets[id] || [],
    };
  });

  return {
    botName: meta.botName,
    subtitle: meta.subtitle,
    prefix,
    package: meta.package,
    updatedAt: new Date().toISOString().slice(0, 10),
    categories,
  };
}

async function loadSourceFiles() {
  const localPath = process.env.BOT3_LOCAL_PATH;
  if (localPath && fs.existsSync(localPath)) {
    log(`Reading local bot source: ${localPath}`);
    return fetchLocal(localPath);
  }

  const host = process.env.BOT3_SSH_HOST;
  const user = process.env.BOT3_SSH_USER || "root";
  const password = process.env.BOT3_SSH_PASSWORD;
  const keyPath = process.env.BOT3_SSH_KEY_PATH;
  const remotePath = process.env.BOT3_REMOTE_PATH || "/root/bots/bot3";

  if (!host) {
    throw new Error(
      "Set BOT3_LOCAL_PATH or BOT3_SSH_HOST in .env — see .env.example",
    );
  }

  log(`Fetching bot source via SSH: ${user}@${host}:${remotePath}`);
  return fetchRemote({
    host,
    username: user,
    password,
    privateKeyPath: keyPath,
    remotePath,
    port: Number(process.env.BOT3_SSH_PORT || 22),
  });
}

function runBuild() {
  if (skipBuild) return;
  log("Running npm run build...");
  const { spawnSync } = require("child_process");
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) throw new Error("Build failed");
}

async function syncOnce(options = {}) {
  const shouldBuild = options.build ?? false;
  const meta = loadMeta();
  const filesMap = await loadSourceFiles();
  const hash = hashSourceMap(filesMap);

  if (!force && fs.existsSync(HASH_FILE)) {
    const prev = fs.readFileSync(HASH_FILE, "utf8").trim();
    if (prev === hash && fs.existsSync(OUT_JSON)) {
      log("Bot source unchanged — skipping sync.");
      return { changed: false, hash };
    }
  }

  const configText = filesMap.get("config.js") || "";
  const prefix = extractPrefixFromConfig(configText) || process.env.BOT3_PREFIX || ".";

  const extracted = parseAllSourceFiles(filesMap);
  const output = buildOutput(extracted, meta, prefix);

  const json = JSON.stringify(output, null, 2) + "\n";
  const prevJson = fs.existsSync(OUT_JSON) ? fs.readFileSync(OUT_JSON, "utf8") : "";
  const changed = json !== prevJson;

  if (changed) {
    fs.writeFileSync(OUT_JSON, json, "utf8");
    fs.writeFileSync(HASH_FILE, hash, "utf8");
    log(`Updated ${path.relative(ROOT, OUT_JSON)} (${extracted.size} commands parsed)`);
    if (shouldBuild) runBuild();
  } else {
    fs.writeFileSync(HASH_FILE, hash, "utf8");
    log("JSON already up to date.");
  }

  return { changed, hash, commandCount: extracted.size };
}

async function watchLoop(buildAfter) {
  const interval = Number(process.env.BOT3_SYNC_INTERVAL_MS || 120_000);
  log(`Watch mode — checking every ${interval / 1000}s (Ctrl+C to stop)`);

  async function tick() {
    try {
      await syncOnce({ build: buildAfter });
    } catch (err) {
      log(`Sync error: ${err.message}`);
    }
  }

  await tick();
  setInterval(tick, interval);
}

async function main() {
  try {
    const buildAfter = !skipBuild;
    if (watchMode) {
      await watchLoop(buildAfter);
    } else {
      const result = await syncOnce({ build: buildAfter });
      if (result.changed) log("Sync complete" + (buildAfter ? " — site rebuilt." : "."));
      else log("Nothing to do.");
    }
  } catch (err) {
    console.error(`Sync failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { syncOnce, buildOutput, loadMeta };

if (require.main === module) main();
