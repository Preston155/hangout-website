const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "counting.json");
const BRAND = "City of Angels";
const COLORS = { ok: 0x22c55e, warn: 0xf59e0b, error: 0xef4444, info: 0x0f172a };

let store = loadStore();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return { guilds: {} };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Counting data failed to load:", error.message);
    return { guilds: {} };
  }
}

function saveStore() {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function defaultState(guildId) {
  return {
    guildId,
    enabled: false,
    channelId: null,
    current: 0,
    record: 0,
    lastUserId: null,
    lastMessageId: null,
    totalCounts: 0,
    mistakes: 0,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };
}

function getState(guildId) {
  if (!store.guilds[guildId]) {
    store.guilds[guildId] = defaultState(guildId);
    saveStore();
  }
  return store.guilds[guildId];
}

function canManage(member) {
  return member?.permissions?.has(PermissionFlagsBits.ManageGuild);
}

function makeEmbed(color, title, description) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: BRAND + " • Counting System" })
    .setTimestamp();
}

function statusEmbed(guild, state) {
  const channelText = state.channelId ? "<#" + state.channelId + ">" : "Not set";
  return makeEmbed(
    state.enabled ? COLORS.ok : COLORS.warn,
    "🔢 Premium Counting",
    [
      "**Channel:** " + channelText,
      "**Status:** " + (state.enabled ? "Enabled" : "Disabled"),
      "**Next:** `" + (state.current + 1) + "`",
      "**Current:** `" + state.current + "`",
      "**Record:** `" + state.record + "`",
      "**Mistakes:** `" + state.mistakes + "`"
    ].join("\n")
  );
}

function parseNumber(content) {
  const trimmed = content.trim();
  if (!/^\d{1,12}$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

async function setup(target, channel, start = 0) {
  const state = getState(target.guild.id);
  state.enabled = true;
  state.channelId = channel.id;
  state.current = Math.max(0, Number(start) || 0);
  state.record = Math.max(state.record || 0, state.current);
  state.lastUserId = null;
  state.lastMessageId = null;
  state.startedAt = Date.now();
  state.updatedAt = Date.now();
  saveStore();

  const payload = {
    embeds: [
      makeEmbed(
        COLORS.ok,
        "🔢 Counting Started",
        ["**Channel:** " + channel.toString(), "**Next:** `" + (state.current + 1) + "`", "**Rule:** No double-counting."].join("\n")
      )
    ],
    allowedMentions: { parse: [] }
  };

  if (target.reply) await target.reply(payload);
  else await target.channel.send(payload);
}

async function disable(target) {
  const state = getState(target.guild.id);
  state.enabled = false;
  state.updatedAt = Date.now();
  saveStore();

  const payload = { embeds: [makeEmbed(COLORS.warn, "Counting Disabled", "The counting system is now off.")], allowedMentions: { parse: [] } };
  if (target.reply) await target.reply(payload);
  else await target.channel.send(payload);
}

async function reset(target, start = 0) {
  const state = getState(target.guild.id);
  state.current = Math.max(0, Number(start) || 0);
  state.lastUserId = null;
  state.lastMessageId = null;
  state.updatedAt = Date.now();
  saveStore();

  const payload = { embeds: [makeEmbed(COLORS.ok, "Counting Reset", "Next number is `" + (state.current + 1) + "`.")], allowedMentions: { parse: [] } };
  if (target.reply) await target.reply(payload);
  else await target.channel.send(payload);
}

async function status(target) {
  const state = getState(target.guild.id);
  const payload = { embeds: [statusEmbed(target.guild, state)], allowedMentions: { parse: [] } };
  if (target.reply) await target.reply(payload);
  else await target.channel.send(payload);
}

async function prefixCommand(message, args) {
  const sub = (args[0] || "status").toLowerCase();
  if (!["setup", "set", "status", "reset", "disable", "off"].includes(sub)) {
    await message.channel.send("Usage: `.counting setup [#channel] [start]`, `.counting status`, `.counting reset [start]`, `.counting disable`");
    return;
  }

  if (sub === "status") {
    await status(message);
    return;
  }

  if (!canManage(message.member)) {
    await message.channel.send("You need Manage Server permission to manage counting.");
    return;
  }

  if (sub === "setup" || sub === "set") {
    const mentioned = message.mentions.channels.first();
    const channel = mentioned || message.channel;
    const startArg = mentioned ? args[2] : args[1];
    await setup(message, channel, Number.parseInt(startArg || "0", 10));
    return;
  }

  if (sub === "reset") {
    await reset(message, Number.parseInt(args[1] || "0", 10));
    return;
  }

  await disable(message);
}

async function handleMessage(message) {
  const state = getState(message.guild.id);
  if (!state.enabled || message.channel.id !== state.channelId) return false;

  const value = parseNumber(message.content);
  if (value === null) {
    await message.react("⚠️").catch(() => null);
    return true;
  }

  const expected = state.current + 1;
  if (message.author.id === state.lastUserId) {
    state.current = 0;
    state.lastUserId = null;
    state.lastMessageId = null;
    state.mistakes += 1;
    state.updatedAt = Date.now();
    saveStore();
    await message.react("❌").catch(() => null);
    await message.channel.send({
      embeds: [makeEmbed(COLORS.error, "Counting Broken", "<@" + message.author.id + "> counted twice in a row. Restart at `1`.")],
      allowedMentions: { parse: [] }
    });
    return true;
  }

  if (value !== expected) {
    state.current = 0;
    state.lastUserId = null;
    state.lastMessageId = null;
    state.mistakes += 1;
    state.updatedAt = Date.now();
    saveStore();
    await message.react("❌").catch(() => null);
    await message.channel.send({
      embeds: [makeEmbed(COLORS.error, "Counting Broken", "<@" + message.author.id + "> sent `" + value + "`. Expected `" + expected + "`. Restart at `1`.")],
      allowedMentions: { parse: [] }
    });
    return true;
  }

  state.current = value;
  state.record = Math.max(state.record || 0, value);
  state.lastUserId = message.author.id;
  state.lastMessageId = message.id;
  state.totalCounts += 1;
  state.updatedAt = Date.now();
  saveStore();

  await message.react(value === state.record && value > 1 ? "🏆" : "✅").catch(() => null);
  return true;
}

module.exports = { setup, disable, reset, status, prefixCommand, handleMessage, getState, statusEmbed };