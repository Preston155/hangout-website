#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { fetchRemote } = require("./lib/fetch-bot-source");

const ROOT = path.join(__dirname, "..");
const CACHE = path.join(ROOT, ".bot-cache");

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

loadEnv(path.join(ROOT, ".env"));

fetchRemote({
  host: process.env.BOT3_SSH_HOST,
  username: process.env.BOT3_SSH_USER || "root",
  password: process.env.BOT3_SSH_PASSWORD,
  remotePath: process.env.BOT3_REMOTE_PATH || "/root/bots/bot3",
})
  .then((map) => {
    fs.mkdirSync(CACHE, { recursive: true });
    for (const [rel, content] of map) {
      const out = path.join(CACHE, rel.replace(/\//g, "__"));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, content, "utf8");
    }
    const keys = [...map.keys()].sort();
    console.log(keys.filter((k) => /command|system|index/.test(k)).join("\n"));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
