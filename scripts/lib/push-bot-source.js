const fs = require("fs");
const path = require("path");
const { Client } = require("ssh2");

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function remoteFilePath(remotePath, relativePath) {
  const base = remotePath.replace(/\/$/, "");
  const rel = relativePath.replace(/\\/g, "/");
  if (rel === "config.js" || rel === "package.json" || rel === "index.js") {
    return `${base}/src/${rel}`;
  }
  if (rel.startsWith("commands/") || rel.startsWith("systems/") || rel.startsWith("handlers/")) {
    return `${base}/src/${rel}`;
  }
  return `${base}/src/${rel}`;
}

function pushRemoteFiles({ host, port = 22, username, password, privateKeyPath, remotePath, filesMap, changedFiles, restartCmd }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const config = { host, port, username, readyTimeout: 30000 };

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
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }

          let i = 0;
          const written = [];

          function writeNext() {
            if (i >= changedFiles.length) {
              if (!restartCmd) {
                conn.end();
                resolve({ written, restarted: false });
                return;
              }
              conn.exec(restartCmd, (execErr, stream) => {
                let out = "";
                if (execErr) {
                  conn.end();
                  reject(execErr);
                  return;
                }
                stream
                  .on("close", () => {
                    conn.end();
                    resolve({ written, restarted: true, restartOutput: out.trim() });
                  })
                  .on("data", (d) => {
                    out += d.toString();
                  })
                  .stderr.on("data", (d) => {
                    out += d.toString();
                  });
              });
              return;
            }

            const rel = changedFiles[i++];
            const content = filesMap.get(rel);
            const remote = remoteFilePath(remotePath, rel);
            const dir = path.posix.dirname(remote);
            const tmp = `${remote}.tmp`;

            sftp.mkdir(dir, { mode: 0o755 }, () => {
              const stream = sftp.createWriteStream(tmp, { flags: "w" });
              stream.on("close", () => {
                sftp.rename(tmp, remote, (renameErr) => {
                  if (renameErr) {
                    conn.end();
                    reject(renameErr);
                    return;
                  }
                  written.push(rel);
                  writeNext();
                });
              });
              stream.on("error", (writeErr) => {
                conn.end();
                reject(writeErr);
              });
              stream.end(content, "utf8");
            });
          }

          writeNext();
        });
      })
      .on("error", reject)
      .connect(config);
  });
}

module.exports = { pushRemoteFiles, remoteFilePath };
