#!/usr/bin/env node
/**
 * Auto-publish watcher — debounced git commit + push to GitHub main.
 * Run: node auto-publish.js  |  npm run auto-publish
 */

const fs = require("fs");
const path = require("path");
const { spawn, execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const ROOT = __dirname;
const PID_FILE = path.join(ROOT, ".auto-publish.pid");
const LOG_DIR = path.join(ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "auto-publish.log");
const REMOTE_URL = "https://github.com/Preston155/hangout-website.git";
const BRANCH = "main";
const DEBOUNCE_MS = 3_000;

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME || "Preston155",
  GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL || "Preston155@users.noreply.github.com",
  GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME || process.env.GIT_AUTHOR_NAME || "Preston155",
  GIT_COMMITTER_EMAIL:
    process.env.GIT_COMMITTER_EMAIL || process.env.GIT_AUTHOR_EMAIL || "Preston155@users.noreply.github.com",
};

const IGNORE_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "logs",
  "cache",
  "dist",
  "build",
  "bin",
  "obj",
  ".idea",
  ".vscode",
]);

const IGNORE_FILE_NAMES = new Set([".auto-publish.pid"]);

const IGNORE_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.production$/,
  /\.log$/i,
];

let debounceTimer = null;
let publishing = false;
let watchers = [];

function writeLog(line) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");
  } catch {
    /* ignore log write errors */
  }
}

function log(message) {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const line = `[${stamp}] ${message}`;
  console.log(line);
  writeLog(line);
}

function warn(message) {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const line = `[${stamp}] WARN: ${message}`;
  console.warn(line);
  writeLog(line);
}

function shouldIgnore(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);

  for (const part of parts) {
    if (IGNORE_DIR_NAMES.has(part)) return true;
    if (IGNORE_FILE_NAMES.has(part)) return true;
  }

  const base = parts[parts.length - 1] || "";
  if (IGNORE_FILE_NAMES.has(base)) return true;
  return IGNORE_FILE_PATTERNS.some((re) => re.test(base));
}

async function runGit(args, options = {}) {
  const { stdout, stderr } = await execFileAsync("git", args, {
    cwd: ROOT,
    env: GIT_ENV,
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
  if (stdout?.trim()) log(stdout.trim());
  if (stderr?.trim() && !options.allowStderr) log(stderr.trim());
  return { stdout: stdout || "", stderr: stderr || "" };
}

async function ensureGitReady() {
  const gitDir = path.join(ROOT, ".git");
  if (!fs.existsSync(gitDir)) {
    log("Git not initialized — running git init...");
    await runGit(["init"]);
  }

  let remotes = "";
  try {
    const res = await runGit(["remote", "-v"]);
    remotes = res.stdout;
  } catch {
    remotes = "";
  }

  if (!remotes.includes("origin")) {
    log("Adding origin remote...");
    await runGit(["remote", "add", "origin", REMOTE_URL]);
  } else if (!remotes.includes(REMOTE_URL)) {
    log("Updating origin remote URL...");
    await runGit(["remote", "set-url", "origin", REMOTE_URL]);
  }

  await runGit(["branch", "-M", BRANCH]);
}

async function runBuild() {
  log("Building httpdocs-ready (npm run build:httpdocs)...");
  await new Promise((resolve, reject) => {
    const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build:httpdocs"], {
      cwd: ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString().trim();
      if (text) log(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString().trim();
      if (text && !text.includes("npm warn")) warn(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build:httpdocs exited with code ${code}`));
    });
  });
}

function hasSecretStagedPaths(pathsText) {
  const lines = pathsText.split("\n").filter(Boolean);
  return lines.some((line) => {
    const file = line.slice(3).trim().replace(/^"|"$/g, "");
    const base = path.basename(file);
    return (
      base === ".env" ||
      base === ".env.local" ||
      base === ".env.production" ||
      /^\.env(\.|$)/.test(base)
    );
  });
}

async function publish() {
  if (publishing) {
    log("Publish already in progress — skipping.");
    return;
  }

  publishing = true;
  log("Starting auto-publish...");

  try {
    await ensureGitReady();

    const statusBefore = await runGit(["status", "--porcelain"]);
    if (!statusBefore.stdout.trim()) {
      log("No file changes detected — nothing to publish.");
      return;
    }

    try {
      await runBuild();
    } catch (err) {
      warn(`Build step failed: ${err.message}`);
      warn("Continuing with git publish using current files...");
    }

    await runGit(["add", "."]);

    const staged = await runGit(["diff", "--cached", "--name-only"]);
    if (!staged.stdout.trim()) {
      log("No staged changes after build — nothing to publish.");
      return;
    }

    if (hasSecretStagedPaths(staged.stdout)) {
      warn("Blocked .env from commit — unstaging env files.");
      await runGit(["reset", "HEAD", "--", ".env", ".env.local", ".env.production"]);
    }

    try {
      await execFileAsync("git", ["diff", "--cached", "--quiet"], { cwd: ROOT, env: GIT_ENV });
      log("No changes to commit — skipping.");
      return;
    } catch (err) {
      if (err.code !== 1) throw err;
    }

    const message = `Auto publish website update - ${formatCommitTimestamp()}`;
    log(`Committing: ${message}`);
    await runGit(["commit", "-m", message]);

    log(`Pushing to origin ${BRANCH}...`);
    await runGit(["push", "origin", BRANCH]);
    log("Publish complete. GitHub webhook should deploy to Plesk shortly.");
  } catch (err) {
    const msg = err.stderr?.trim() || err.message || String(err);
    warn(`Publish failed: ${msg}`);
    warn("Watcher is still running. Fix the issue and save a file to retry.");
  } finally {
    publishing = false;
  }
}

function formatCommitTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function schedulePublish(reason) {
  if (publishing) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    log(`Debounce finished (${DEBOUNCE_MS / 1000}s) — ${reason}`);
    publish();
  }, DEBOUNCE_MS);

  log(`Change detected — publish scheduled in ${DEBOUNCE_MS / 1000}s...`);
}

function onFsEvent(eventType, filename) {
  if (publishing) return;
  if (!filename) return;

  const relative = filename.replace(/\\/g, "/");
  if (shouldIgnore(relative)) return;

  schedulePublish(relative);
}

function watchPath(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  try {
    const watcher = fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const full = path.join(targetPath, filename.toString());
      const relative = path.relative(ROOT, full);
      onFsEvent(eventType, relative);
    });
    watchers.push(watcher);
    log(`Watching: ${path.relative(ROOT, targetPath) || "."}`);
  } catch (err) {
    warn(`Could not watch ${targetPath}: ${err.message}`);
    watchPathNonRecursive(targetPath);
  }
}

function watchPathNonRecursive(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  const watcher = fs.watch(targetPath, (eventType, filename) => {
    if (!filename) return;
    const relative = path.relative(ROOT, path.join(targetPath, filename.toString()));
    onFsEvent(eventType, relative);
  });
  watchers.push(watcher);
  log(`Watching (non-recursive): ${path.relative(ROOT, targetPath) || "."}`);
}

function writePidFile() {
  fs.writeFileSync(PID_FILE, String(process.pid), "utf8");
}

function removePidFile() {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch {
    /* ignore */
  }
}

function shutdown() {
  log("Stopping auto-publish watcher...");
  if (debounceTimer) clearTimeout(debounceTimer);
  watchers.forEach((w) => {
    try {
      w.close();
    } catch {
      /* ignore */
    }
  });
  removePidFile();
  process.exit(0);
}

async function main() {
  if (fs.existsSync(PID_FILE)) {
    try {
      const existingPid = Number(fs.readFileSync(PID_FILE, "utf8").trim());
      if (existingPid && existingPid !== process.pid) {
        warn(`PID file exists (${existingPid}). Another watcher may be running.`);
        warn("Run stop-auto-publish.bat or delete .auto-publish.pid if that process is gone.");
      }
    } catch {
      /* ignore */
    }
  }

  writePidFile();
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", removePidFile);

  log("Auto-publish watcher started.");
  log(`Repository: ${REMOTE_URL}`);
  log(`Branch: ${BRANCH}`);
  log(`Debounce: ${DEBOUNCE_MS / 1000} seconds after last save`);
  log("Edit files in Cursor and save — publishing is automatic.");
  log("Press Ctrl+C in this window to stop.\n");

  await ensureGitReady();

  watchPath(ROOT);

  const fallbackDirs = ["public", "api", "scripts", "assets", "desktop-native"];
  for (const dir of fallbackDirs) {
    const full = path.join(ROOT, dir);
    if (fs.existsSync(full)) watchPathNonRecursive(full);
  }
}

main().catch((err) => {
  warn(`Fatal error: ${err.message}`);
  removePidFile();
  process.exit(1);
});
