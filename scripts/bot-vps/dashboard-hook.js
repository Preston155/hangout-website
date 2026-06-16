/**
 * HTTP hook for Veltrix bot — receives dashboard publishes.
 * Add to src/index.js before client.login():
 *   require('./tools/veltrix-dashboard/dashboard-hook');
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PORT = Number(process.env.ADMIN_LISTENER_PORT || 3921);
const SECRET = process.env.ADMIN_SECRET || process.env.DASHBOARD_SECRET || "COARP";
const HOOK_DIR = __dirname;

function readBody(req) {
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

function applyOverrides(overrides) {
  const tmp = path.join(HOOK_DIR, ".admin-overrides.tmp.json");
  fs.writeFileSync(tmp, JSON.stringify(overrides, null, 2), "utf8");
  execFileSync(process.execPath, [path.join(HOOK_DIR, "apply-overrides.js"), tmp], {
    cwd: HOOK_DIR,
    stdio: "inherit",
    env: process.env,
  });
  fs.unlinkSync(tmp);
}

function start() {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "POST" || req.url !== "/apply") {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: "Not found" }));
      return;
    }

    const secret = req.headers["x-admin-secret"] || "";
    if (secret !== SECRET) {
      res.statusCode = 401;
      res.end(JSON.stringify({ ok: false, error: "Unauthorized" }));
      return;
    }

    try {
      const body = await readBody(req);
      applyOverrides(body.overrides || body);
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[veltrix-dashboard] listening on :${PORT}/apply`);
  });
}

start();
