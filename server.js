require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const { testConnection } = require("./cad/db");
const { mountAuthRoutes, ensureDevAdmin } = require("./cad/auth");
const cadRoutes = require("./cad/routes");

const PORT = Number(process.env.PORT || process.env.PLESK_NODEJS_PORT || 3847);
const PUBLIC_DIR = path.join(__dirname, "public");

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    name: "erlc_cad_sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  }),
);

const BACKEND_FILES = new Set(["server.js", "app.js", "package.json", "package-lock.json"]);
app.use((req, res, next) => {
  const base = path.basename(req.path);
  if (BACKEND_FILES.has(base)) return res.sendStatus(404);
  if (req.path.startsWith("/cad") || req.path.startsWith("/database")) return res.sendStatus(403);
  next();
});

app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true, mode: "cad", database: "connected" });
  } catch (err) {
    res.status(503).json({ ok: false, mode: "cad", database: "disconnected", error: err.message });
  }
});

mountAuthRoutes(app);
app.use("/api", cadRoutes);

app.use("/downloads", express.static(path.join(__dirname, "downloads"), { maxAge: "1h" }));
app.use(express.static(PUBLIC_DIR, { index: "index.html", maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/auth")) return next();
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  next();
});

async function startServer() {
  if (process.env.DEV_LOGIN === "true") {
    try {
      await ensureDevAdmin();
    } catch (err) {
      console.warn("Dev admin setup skipped:", err.message);
    }
  }

  server.listen(PORT, () => {
    console.log(`ER:LC CAD running at http://localhost:${PORT}`);
    if (process.env.DEV_LOGIN === "true") {
      console.log("Dev login enabled — admin / admin123 (or DEV_LOGIN_PASSWORD)");
    }
  });
}

module.exports = { app, startServer };

if (require.main === module) {
  startServer();
}
