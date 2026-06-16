#!/usr/bin/env node
/**
 * Merge admin-overrides into site data + meta, then git commit/push.
 * Usage: npm run admin:publish
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { mergeAll, overridesToMetaPatches } = require("./lib/merge-admin-overrides");

const ROOT = path.join(__dirname, "..");
const BOT_JSON = path.join(ROOT, "public", "data", "bot-commands.json");
const PREVIEWS_JSON = path.join(ROOT, "public", "data", "command-previews.json");
const OVERRIDES_JSON = path.join(ROOT, "public", "data", "admin-overrides.json");
const META_JSON = path.join(ROOT, "scripts", "bot-commands.meta.json");

function log(msg) {
  console.log(`[admin-publish] ${msg}`);
}

function main() {
  if (!fs.existsSync(BOT_JSON)) {
    console.error("Missing bot-commands.json");
    process.exit(1);
  }

  const botCommands = JSON.parse(fs.readFileSync(BOT_JSON, "utf8"));
  const previews = fs.existsSync(PREVIEWS_JSON)
    ? JSON.parse(fs.readFileSync(PREVIEWS_JSON, "utf8"))
    : {};
  const adminOverrides = fs.existsSync(OVERRIDES_JSON)
    ? JSON.parse(fs.readFileSync(OVERRIDES_JSON, "utf8"))
    : { commands: {}, previews: {}, systems: {}, meta: {} };

  const { data, previews: mergedPreviews } = mergeAll(botCommands, previews, adminOverrides);

  fs.writeFileSync(BOT_JSON, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.writeFileSync(PREVIEWS_JSON, JSON.stringify(mergedPreviews, null, 2) + "\n", "utf8");

  if (fs.existsSync(META_JSON)) {
    const meta = JSON.parse(fs.readFileSync(META_JSON, "utf8"));
    const nextMeta = overridesToMetaPatches(adminOverrides, meta);
    fs.writeFileSync(META_JSON, JSON.stringify(nextMeta, null, 2) + "\n", "utf8");
  }

  adminOverrides.publishedAt = new Date().toISOString();
  fs.writeFileSync(OVERRIDES_JSON, JSON.stringify(adminOverrides, null, 2) + "\n", "utf8");

  log("Merged overrides into bot-commands.json and command-previews.json");

  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (build.status !== 0) process.exit(build.status || 1);

  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME || "Preston155",
    GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL || "Preston155@users.noreply.github.com",
    GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME || "Preston155",
    GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL || "Preston155@users.noreply.github.com",
  };

  spawnSync("git", ["add", "public/data/bot-commands.json", "public/data/command-previews.json", "public/data/admin-overrides.json", "scripts/bot-commands.meta.json", "data/bot-commands.json", "data/command-previews.json", "data/admin-overrides.json", "api", "index.html", "js/app.js", "js/admin-editor.js", "js/preview-renderer.js", "css/commands.css"], {
    cwd: ROOT,
    stdio: "inherit",
    env,
  });

  const commit = spawnSync(
    "git",
    ["commit", "-m", "Publish admin command edits from dashboard."],
    { cwd: ROOT, stdio: "inherit", env },
  );
  if (commit.status !== 0 && !String(spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" }).stdout || "").trim()) {
    log("Nothing new to commit.");
    return;
  }
  if (commit.status !== 0) {
    log("Commit failed or nothing to commit — check git status.");
    return;
  }

  const push = spawnSync("git", ["push", "origin", "main"], { cwd: ROOT, stdio: "inherit", env });
  if (push.status !== 0) process.exit(push.status || 1);
  log("Pushed to GitHub — Plesk will deploy shortly.");
}

main();
