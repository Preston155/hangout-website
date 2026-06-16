#!/usr/bin/env node
/**
 * Run ON the bot VPS to apply dashboard edits without SSH from your PC.
 *
 *   BOT_ROOT=/root/bots/bot3 ADMIN_SECRET=your-secret node scripts/bot-apply-listener.js
 *
 * Then set bot_apply_url in api/config.php to http://YOUR_VPS_IP:3921/apply
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.ADMIN_LISTENER_PORT || 3921);
const SECRET = process.env.ADMIN_SECRET || "";
const BOT_ROOT = process.env.BOT_ROOT || "/root/bots/bot3";
const GUNS_ROOT = process.env.GUNS_ROOT || path.join(__dirname, "..");

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function applyOverrides(overrides) {
  process.chdir(GUNS_ROOT);
  const tmp = path.join(GUNS_ROOT, "public", "data", "admin-overrides.json");
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(overrides, null, 2) + "\n", "utf8");
  process.env.BOT3_LOCAL_PATH = BOT_ROOT;
  delete process.env.BOT3_SSH_HOST;
  const { syncToBot } = require("./sync-to-bot");
  return syncToBot({ remote: false });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST" || req.url !== "/apply") {
    res.statusCode = 404;
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
    return;
  }

  if (!SECRET) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "ADMIN_SECRET not set on listener" }));
    return;
  }

  const headerSecret = req.headers["x-admin-secret"] || "";
  if (headerSecret !== SECRET) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: "Unauthorized" }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const overrides = body.overrides || body;
    const result = await applyOverrides(overrides);
    res.end(JSON.stringify({ ok: true, result }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[bot-apply-listener] http://0.0.0.0:${PORT}/apply (BOT_ROOT=${BOT_ROOT})`);
});
