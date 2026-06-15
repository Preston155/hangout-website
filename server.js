const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const PORT = Number(process.env.PORT || process.env.PLESK_NODEJS_PORT || 3847);
const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : __dirname;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

app.set("trust proxy", 1);

const BACKEND_FILES = new Set(["server.js", "app.js", "package.json", "package-lock.json"]);

app.use((req, res, next) => {
  const base = path.basename(req.path);
  if (BACKEND_FILES.has(base)) return res.sendStatus(404);
  if (req.path.startsWith("/data")) return res.sendStatus(403);
  if (req.path.startsWith("/node_modules")) return res.sendStatus(403);
  next();
});

app.use(express.json({ limit: "8mb" }));
app.use(express.static(PUBLIC_DIR, { index: "index.html", maxAge: "1h" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: "production" });
});

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function dataPath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readStore(name, fallback) {
  ensureDataDir();
  const file = dataPath(name);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return structuredClone(fallback);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return structuredClone(fallback);
  }
}

function writeStore(name, data) {
  ensureDataDir();
  fs.writeFileSync(dataPath(name), JSON.stringify(data, null, 2));
}

const onlineUsers = new Map();

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    banner: user.banner,
    accentColor: user.accentColor,
    status: user.status || "online",
  };
}

function getUserServers(userId) {
  const servers = readStore("servers", { items: [] });
  return servers.items.filter(
    (s) => s.ownerId === userId || s.memberIds.includes(userId),
  );
}

function attachSocketSession(socket, userId) {
  onlineUsers.set(socket.id, userId);
  socket.join(`user:${userId}`);
  broadcastOnline();
}

function registerUser(username, displayName) {
  const users = readStore("users", { items: [] });
  const clean = String(username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3) return { ok: false, error: "Username must be at least 3 characters (letters, numbers, underscore)." };
  if (users.items.some((u) => u.username === clean)) {
    return { ok: false, error: "Username already taken." };
  }

  const user = {
    id: uuidv4(),
    username: clean,
    displayName: String(displayName || clean).trim().slice(0, 32) || clean,
    bio: "",
    avatar: null,
    banner: null,
    accentColor: "#5865f2",
    status: "online",
    createdAt: Date.now(),
  };

  users.items.push(user);
  writeStore("users", users);

  return { ok: true, user: publicUser(user), servers: getUserServers(user.id) };
}

function loginUser(username) {
  const users = readStore("users", { items: [] });
  const clean = String(username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const user = users.items.find((u) => u.username === clean);
  if (!user) return { ok: false, error: "User not found. Register first." };
  return { ok: true, user: publicUser(user), servers: getUserServers(user.id) };
}

function restoreUser(userId) {
  const users = readStore("users", { items: [] });
  const user = users.items.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Session expired. Please log in again." };
  return { ok: true, user: publicUser(user), servers: getUserServers(user.id) };
}

app.post("/api/auth/register", (req, res) => {
  try {
    const result = registerUser(req.body?.username, req.body?.displayName);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Registration failed." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const result = loginUser(req.body?.username);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Login failed." });
  }
});

app.post("/api/auth/restore", (req, res) => {
  try {
    const result = restoreUser(req.body?.userId);
    res.status(result.ok ? 200 : 401).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Could not restore session." });
  }
});

function getServerChannels(serverId) {
  const channels = readStore("channels", { items: [] });
  return channels.items.filter((c) => c.serverId === serverId);
}

function getChannelMessages(channelId, limit = 100) {
  const messages = readStore("messages", { items: [] });
  return messages.items
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-limit);
}

function broadcastOnline() {
  const users = readStore("users", { items: [] });
  const list = [...onlineUsers.values()].map((id) => publicUser(users.items.find((u) => u.id === id))).filter(Boolean);
  io.emit("users:online", list);
}

function emitToServerMembers(serverId, event, payload) {
  const servers = readStore("servers", { items: [] });
  const server = servers.items.find((s) => s.id === serverId);
  if (!server) return;

  const memberSet = new Set([...server.memberIds, server.ownerId].filter((id) => id !== "system"));
  for (const [socketId, userId] of onlineUsers.entries()) {
    if (memberSet.has(userId) || server.ownerId === "system") {
      io.to(socketId).emit(event, payload);
    }
  }
  io.emit(event, payload);
}

io.on("connection", (socket) => {
  let currentUserId = null;
  let currentChannelId = null;

  socket.on("auth:register", ({ username, displayName }, cb) => {
    const result = registerUser(username, displayName);
    if (result.ok) {
      currentUserId = result.user.id;
      attachSocketSession(socket, currentUserId);
    }
    cb?.(result);
  });

  socket.on("auth:login", ({ username }, cb) => {
    const result = loginUser(username);
    if (result.ok) {
      currentUserId = result.user.id;
      attachSocketSession(socket, currentUserId);
    }
    cb?.(result);
  });

  socket.on("auth:restore", ({ userId }, cb) => {
    const result = restoreUser(userId);
    if (result.ok) {
      currentUserId = result.user.id;
      attachSocketSession(socket, currentUserId);
    }
    cb?.(result);
  });

  socket.on("profile:update", (updates, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const users = readStore("users", { items: [] });
    const user = users.items.find((u) => u.id === currentUserId);
    if (!user) return cb?.({ ok: false, error: "User not found." });

    if (updates.displayName) user.displayName = String(updates.displayName).trim().slice(0, 32);
    if (updates.bio !== undefined) user.bio = String(updates.bio).slice(0, 190);
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.banner !== undefined) user.banner = updates.banner;
    if (updates.accentColor) user.accentColor = updates.accentColor;
    if (updates.status) user.status = updates.status;

    writeStore("users", users);
    broadcastOnline();
    io.emit("profile:updated", publicUser(user));
    cb?.({ ok: true, user: publicUser(user) });
  });

  socket.on("server:create", ({ name, icon }, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const cleanName = String(name || "").trim().slice(0, 100);
    if (!cleanName) return cb?.({ ok: false, error: "Server name required." });

    const servers = readStore("servers", { items: [] });
    const channels = readStore("channels", { items: [] });
    const serverId = uuidv4();
    const generalId = uuidv4();

    const newServer = {
      id: serverId,
      name: cleanName,
      icon: icon || null,
      ownerId: currentUserId,
      memberIds: [currentUserId],
      channelIds: [generalId],
      createdAt: Date.now(),
    };

    const general = {
      id: generalId,
      serverId,
      name: "general",
      type: "text",
      createdAt: Date.now(),
    };

    servers.items.push(newServer);
    channels.items.push(general);
    writeStore("servers", servers);
    writeStore("channels", channels);

    io.emit("server:created", { server: newServer, channels: [general] });
    cb?.({ ok: true, server: newServer, channels: [general] });
  });

  socket.on("server:join", ({ inviteCode }, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const servers = readStore("servers", { items: [] });
    const server = servers.items.find((s) => s.id === inviteCode || s.name.toLowerCase() === String(inviteCode).toLowerCase());
    if (!server) return cb?.({ ok: false, error: "Server not found." });
    if (!server.memberIds.includes(currentUserId)) {
      server.memberIds.push(currentUserId);
      writeStore("servers", servers);
    }
    const channels = getServerChannels(server.id);
    cb?.({ ok: true, server, channels });
  });

  socket.on("channel:create", ({ serverId, name }, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const cleanName = String(name || "").trim().toLowerCase().replace(/\s+/g, "-").slice(0, 100);
    if (!cleanName) return cb?.({ ok: false, error: "Channel name required." });

    const servers = readStore("servers", { items: [] });
    const server = servers.items.find((s) => s.id === serverId);
    if (!server) return cb?.({ ok: false, error: "Server not found." });
    if (server.ownerId !== currentUserId && server.ownerId !== "system") {
      return cb?.({ ok: false, error: "Only the server owner can create channels." });
    }

    const channels = readStore("channels", { items: [] });
    const channel = {
      id: uuidv4(),
      serverId,
      name: cleanName,
      type: "text",
      createdAt: Date.now(),
    };

    channels.items.push(channel);
    server.channelIds.push(channel.id);
    writeStore("channels", channels);
    writeStore("servers", servers);

    io.emit("channel:created", { serverId, channel });
    cb?.({ ok: true, channel });
  });

  socket.on("server:channels", ({ serverId }, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const servers = readStore("servers", { items: [] });
    const server = servers.items.find((s) => s.id === serverId);
    if (!server) return cb?.({ ok: false, error: "Server not found." });
    const isMember = server.memberIds.includes(currentUserId) || server.ownerId === "system";
    if (!isMember && server.ownerId !== currentUserId) {
      return cb?.({ ok: false, error: "You are not a member of this server." });
    }
    cb?.({ ok: true, channels: getServerChannels(serverId), server });
  });

  socket.on("channel:join", ({ channelId }, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const channels = readStore("channels", { items: [] });
    const channel = channels.items.find((c) => c.id === channelId);
    if (!channel) return cb?.({ ok: false, error: "Channel not found." });

    if (currentChannelId) socket.leave(`channel:${currentChannelId}`);
    currentChannelId = channelId;
    socket.join(`channel:${channelId}`);

    const users = readStore("users", { items: [] });
    const messages = getChannelMessages(channelId).map((m) => ({
      ...m,
      author: publicUser(users.items.find((u) => u.id === m.authorId)) || {
        id: "system",
        displayName: "System",
        username: "system",
        avatar: null,
      },
    }));

    const servers = readStore("servers", { items: [] });
    const server = servers.items.find((s) => s.id === channel.serverId);
    const members = (server?.memberIds || [])
      .map((id) => publicUser(users.items.find((u) => u.id === id)))
      .filter(Boolean);

    cb?.({ ok: true, channel, messages, members, server });
  });

  socket.on("message:send", ({ channelId, content }, cb) => {
    if (!currentUserId) return cb?.({ ok: false, error: "Not authenticated." });
    const text = String(content || "").trim();
    if (!text) return cb?.({ ok: false, error: "Message cannot be empty." });
    if (text.length > 2000) return cb?.({ ok: false, error: "Message too long." });

    const channels = readStore("channels", { items: [] });
    const channel = channels.items.find((c) => c.id === channelId);
    if (!channel) return cb?.({ ok: false, error: "Channel not found." });

    const messages = readStore("messages", { items: [] });
    const users = readStore("users", { items: [] });
    const author = users.items.find((u) => u.id === currentUserId);

    const message = {
      id: uuidv4(),
      channelId,
      authorId: currentUserId,
      content: text,
      timestamp: Date.now(),
    };

    messages.items.push(message);
    writeStore("messages", messages);

    const payload = {
      ...message,
      author: publicUser(author),
    };

    io.to(`channel:${channelId}`).emit("message:new", payload);
    cb?.({ ok: true, message: payload });
  });

  socket.on("typing:start", ({ channelId }) => {
    if (!currentUserId || !channelId) return;
    const users = readStore("users", { items: [] });
    const user = users.items.find((u) => u.id === currentUserId);
    socket.to(`channel:${channelId}`).emit("typing:update", {
      channelId,
      user: publicUser(user),
      typing: true,
    });
  });

  socket.on("typing:stop", ({ channelId }) => {
    if (!currentUserId || !channelId) return;
    const users = readStore("users", { items: [] });
    const user = users.items.find((u) => u.id === currentUserId);
    socket.to(`channel:${channelId}`).emit("typing:update", {
      channelId,
      user: publicUser(user),
      typing: false,
    });
  });

  socket.on("disconnect", () => {
    if (currentChannelId) socket.leave(`channel:${currentChannelId}`);
    onlineUsers.delete(socket.id);
    broadcastOnline();
  });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return next();
});

function startServer() {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Discord remake running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
