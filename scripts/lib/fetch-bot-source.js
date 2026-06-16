const fs = require("fs");
const path = require("path");
const { Client } = require("ssh2");

const SOURCE_GLOBS = [
  "src/commands/**/*.js",
  "src/systems/**/*.js",
  "src/config.js",
  "src/index.js",
  "src/handlers/**/*.js",
  "config.js",
  "package.json",
];

function walkLocal(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkLocal(full, base, out);
    else if (entry.name.endsWith(".js") || entry.name === "package.json") {
      out.push({ relative: path.relative(base, full).replace(/\\/g, "/"), full });
    }
  }
  return out;
}

function fetchLocal(botPath) {
  const srcRoot = fs.existsSync(path.join(botPath, "src")) ? path.join(botPath, "src") : botPath;
  const files = walkLocal(srcRoot, srcRoot);
  const rootFiles = ["config.js", "package.json"]
    .map((f) => path.join(botPath, f))
    .filter((f) => fs.existsSync(f))
    .map((f) => ({ relative: path.basename(f), full: f }));

  const map = new Map();
  for (const file of [...files, ...rootFiles]) {
    map.set(file.relative, fs.readFileSync(file.full, "utf8"));
  }
  return map;
}

function fetchRemote({ host, port = 22, username, password, privateKeyPath, remotePath }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const config = { host, port, username, readyTimeout: 20000 };

    if (privateKeyPath && fs.existsSync(privateKeyPath)) {
      config.privateKey = fs.readFileSync(privateKeyPath);
    } else if (password) {
      config.password = password;
    } else {
      reject(new Error("SSH requires BOT3_SSH_PASSWORD or BOT3_SSH_KEY_PATH"));
      return;
    }

    conn
      .on("ready", () => {
        const findCmd = `find ${shellQuote(remotePath)}/src ${shellQuote(remotePath)}/config.js ${shellQuote(remotePath)}/package.json -type f \\( -name '*.js' -o -name 'package.json' \\) ! -path '*/node_modules/*' 2>/dev/null`;
        conn.exec(findCmd, (err, stream) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }

          let listing = "";
          stream
            .on("close", () => {
              const paths = listing
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean);
              if (!paths.length) {
                conn.end();
                reject(new Error(`No source files found under ${remotePath}`));
                return;
              }
              readRemoteFiles(conn, paths, remotePath).then(resolve).catch(reject).finally(() => conn.end());
            })
            .on("data", (d) => {
              listing += d.toString();
            })
            .stderr.on("data", () => {});
        });
      })
      .on("error", reject)
      .connect(config);
  });
}

function readRemoteFiles(conn, absolutePaths, remotePath) {
  const map = new Map();
  let i = 0;

  return new Promise((resolve, reject) => {
    function next() {
      if (i >= absolutePaths.length) {
        resolve(map);
        return;
      }
      const abs = absolutePaths[i++];
      const rel = abs.replace(remotePath.replace(/\/$/, "") + "/", "").replace(/^src\//, "");
      conn.exec(`cat ${shellQuote(abs)}`, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        let buf = "";
        stream
          .on("close", () => {
            map.set(rel, buf);
            next();
          })
          .on("data", (d) => {
            buf += d.toString();
          })
          .stderr.on("data", () => {});
      });
    }
    next();
  });
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function hashSourceMap(filesMap) {
  const crypto = require("crypto");
  const h = crypto.createHash("sha256");
  const keys = [...filesMap.keys()].sort();
  for (const k of keys) {
    h.update(k);
    h.update("\0");
    h.update(filesMap.get(k));
    h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
}

module.exports = {
  fetchLocal,
  fetchRemote,
  hashSourceMap,
  SOURCE_GLOBS,
};
