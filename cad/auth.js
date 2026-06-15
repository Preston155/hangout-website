const bcrypt = require("bcryptjs");
const { query, queryOne } = require("./db");
const { logAudit } = require("./audit");

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ ok: false, error: "Not authenticated." });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ ok: false, error: "Not authenticated." });
    }
    const role = req.session.user.role;
    if (role === "admin" || roles.includes(role)) return next();
    return res.status(403).json({ ok: false, error: "Access denied." });
  };
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    avatar: row.avatar,
    role: row.role,
    departmentId: row.department_id,
    rankId: row.rank_id,
    permissions: row.permissions ? JSON.parse(row.permissions) : [],
  };
}

async function findUserById(id) {
  return queryOne(
    `SELECT u.*, d.name AS department_name, d.type AS department_type, r.name AS rank_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN ranks r ON r.id = u.rank_id
     WHERE u.id = ? AND u.is_active = 1`,
    [id],
  );
}

async function findUserByDiscordId(discordId) {
  return queryOne(`SELECT * FROM users WHERE discord_id = ? AND is_active = 1`, [discordId]);
}

async function findUserByUsername(username) {
  return queryOne(`SELECT * FROM users WHERE username = ? AND is_active = 1`, [username]);
}

async function upsertDiscordUser(profile) {
  const existing = await findUserByDiscordId(profile.id);
  if (existing) {
    await query(
      `UPDATE users SET username = ?, display_name = ?, email = ?, avatar = ?, last_login = NOW() WHERE id = ?`,
      [profile.username, profile.global_name || profile.username, profile.email, profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null, existing.id],
    );
    return findUserById(existing.id);
  }
  const result = await query(
    `INSERT INTO users (discord_id, username, display_name, email, avatar, role, last_login)
     VALUES (?, ?, ?, ?, ?, 'civilian', NOW())`,
    [
      profile.id,
      profile.username,
      profile.global_name || profile.username,
      profile.email,
      profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
    ],
  );
  return findUserById(result.insertId);
}

async function ensureDevAdmin() {
  const existing = await findUserByUsername("admin");
  const hash = await bcrypt.hash(process.env.DEV_LOGIN_PASSWORD || "admin123", 10);
  if (existing) {
    if (!existing.password_hash) {
      await query(`UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?`, [hash, existing.id]);
    }
    return;
  }
  await query(
    `INSERT INTO users (username, display_name, role, department_id, password_hash, permissions)
     VALUES ('admin', 'System Administrator', 'admin', (SELECT id FROM departments WHERE type='admin' LIMIT 1), ?, '["admin.all"]')`,
    [hash],
  );
}

function mountAuthRoutes(app) {
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.user) return res.json({ ok: true, user: null });
    const user = await findUserById(req.session.user.id);
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ ok: true, user: null });
    }
    req.session.user = publicUser(user);
    res.json({
      ok: true,
      user: {
        ...publicUser(user),
        departmentName: user.department_name,
        departmentType: user.department_type,
        rankName: user.rank_name,
      },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.post("/api/auth/dev-login", async (req, res) => {
    if (process.env.DEV_LOGIN !== "true") {
      return res.status(403).json({ ok: false, error: "Dev login disabled." });
    }
    const { username, password } = req.body || {};
    const user = await findUserByUsername(username || "admin");
    if (!user?.password_hash) {
      return res.status(401).json({ ok: false, error: "Invalid credentials." });
    }
    const valid = await bcrypt.compare(password || "", user.password_hash);
    if (!valid) return res.status(401).json({ ok: false, error: "Invalid credentials." });
    req.session.user = publicUser(user);
    await query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);
    await logAudit(req, "auth.dev_login", "user", user.id);
    const full = await findUserById(user.id);
    res.json({
      ok: true,
      user: {
        ...publicUser(full),
        departmentName: full.department_name,
        departmentType: full.department_type,
        rankName: full.rank_name,
      },
    });
  });

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const callbackUrl = process.env.DISCORD_CALLBACK_URL;

  app.get("/auth/discord", (req, res) => {
    if (!clientId || !callbackUrl) {
      return res.redirect("/?error=discord_not_configured");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "identify email",
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
  });

  app.get("/auth/discord/callback", async (req, res) => {
    if (!clientId || !clientSecret || !callbackUrl) {
      return res.redirect("/?error=discord_not_configured");
    }
    const { code } = req.query;
    if (!code) return res.redirect("/?error=no_code");

    try {
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error("Token exchange failed");

      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userRes.json();
      const user = await upsertDiscordUser(profile);
      req.session.user = publicUser(user);
      await logAudit(req, "auth.discord_login", "user", user.id);
      res.redirect("/#dashboard");
    } catch (err) {
      console.error("Discord OAuth error:", err);
      res.redirect("/?error=oauth_failed");
    }
  });
}

module.exports = {
  requireAuth,
  requireRole,
  publicUser,
  findUserById,
  ensureDevAdmin,
  mountAuthRoutes,
};
