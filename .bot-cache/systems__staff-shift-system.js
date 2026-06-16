const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "staff-shifts.json");
const BRAND = "City of Angels";
const LOG_CHANNEL_ID = process.env.STAFF_SHIFT_LOG_CHANNEL_ID || process.env.STAFF_LOG_CHANNEL_ID || "";
const COLORS = { live: 0x22c55e, off: 0xef4444, info: 0x2563eb, warn: 0xf59e0b };
const POINTS_PER_HOUR = Number(process.env.SHIFT_POINTS_PER_HOUR || 2);
const START_POINTS = Number(process.env.SHIFT_START_POINTS || 1);
const MIN_SHIFT_MS = 60_000;

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
    console.error("Staff shift data failed to load:", error.message);
    return { guilds: {} };
  }
}

function saveStore() {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function guildState(guildId) {
  if (!store.guilds[guildId]) {
    store.guilds[guildId] = { staff: {}, active: {} };
    saveStore();
  }
  return store.guilds[guildId];
}

function staffRecord(guildId, userId) {
  const guild = guildState(guildId);
  if (!guild.staff[userId]) {
    guild.staff[userId] = {
      userId,
      points: 0,
      totalMs: 0,
      shifts: 0,
      lastStart: null,
      lastEnd: null
    };
  }
  return guild.staff[userId];
}

function hasStaffRole(member) {
  const names = member.roles.cache.map((role) => role.name.toLowerCase());
  return names.some((name) =>
    name.includes("staff") ||
    name.includes("moderator") ||
    name.includes("admin") ||
    name.includes("management") ||
    name.includes("internal affairs") ||
    name.includes("department command") ||
    name.includes("director")
  );
}

function isStaff(member) {
  return Boolean(
    member?.permissions?.has(PermissionFlagsBits.ManageMessages) ||
    member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
    hasStaffRole(member)
  );
}

function isManager(member) {
  return Boolean(member?.permissions?.has(PermissionFlagsBits.ManageGuild));
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return hours + "h " + minutes + "m";
  if (hours) return hours + "h";
  return minutes + "m";
}

function pointsForShift(ms) {
  if (ms < MIN_SHIFT_MS) return 0;
  return START_POINTS + Math.floor(ms / 3600000) * POINTS_PER_HOUR;
}

function embed(color, title, description) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: BRAND + " • Staff Shifts" })
    .setTimestamp();
}

async function send(target, payload) {
  if (target.reply) {
    await target.reply(payload);
    return;
  }
  await target.channel.send(payload);
}

async function log(guild, payload) {
  if (!LOG_CHANNEL_ID) return;
  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel?.isTextBased()) return;
  await channel.send({ ...payload, allowedMentions: { parse: [] } }).catch(() => null);
}

function getTargetMember(target, userArg) {
  if (target.options?.getMember) {
    return target.options.getMember("user") || target.member;
  }
  return target.mentions?.members?.first() || target.member;
}

async function start(target) {
  if (!isStaff(target.member)) {
    await send(target, { embeds: [embed(COLORS.warn, "Staff Only", "Only staff can start a shift.")], allowedMentions: { parse: [] } });
    return;
  }

  const guild = guildState(target.guild.id);
  if (guild.active[target.member.id]) {
    await send(target, { embeds: [embed(COLORS.warn, "Shift Already Active", "You are already on shift.")], allowedMentions: { parse: [] } });
    return;
  }

  guild.active[target.member.id] = { userId: target.member.id, startedAt: Date.now() };
  const record = staffRecord(target.guild.id, target.member.id);
  record.lastStart = Date.now();
  saveStore();

  const payload = {
    embeds: [
      embed(COLORS.live, "🟢 Shift Started", "**Staff:** <@" + target.member.id + ">\n**Status:** On duty\n**Started:** <t:" + Math.floor(Date.now() / 1000) + ":R>")
    ],
    allowedMentions: { parse: [] }
  };
  await send(target, payload);
  await log(target.guild, payload);
}

async function end(target) {
  if (!isStaff(target.member)) {
    await send(target, { embeds: [embed(COLORS.warn, "Staff Only", "Only staff can end a shift.")], allowedMentions: { parse: [] } });
    return;
  }

  const guild = guildState(target.guild.id);
  const active = guild.active[target.member.id];
  if (!active) {
    await send(target, { embeds: [embed(COLORS.warn, "No Active Shift", "You are not currently on shift.")], allowedMentions: { parse: [] } });
    return;
  }

  const endedAt = Date.now();
  const duration = endedAt - active.startedAt;
  const earned = pointsForShift(duration);
  const record = staffRecord(target.guild.id, target.member.id);
  record.points += earned;
  record.totalMs += duration;
  record.shifts += 1;
  record.lastEnd = endedAt;
  delete guild.active[target.member.id];
  saveStore();

  const payload = {
    embeds: [
      embed(
        COLORS.off,
        "🔴 Shift Ended",
        [
          "**Staff:** <@" + target.member.id + ">",
          "**Duration:** " + formatDuration(duration),
          "**Earned:** " + earned + " points",
          "**Total Points:** " + record.points
        ].join("\n")
      )
    ],
    allowedMentions: { parse: [] }
  };
  await send(target, payload);
  await log(target.guild, payload);
}

async function status(target) {
  const member = getTargetMember(target);
  const guild = guildState(target.guild.id);
  const record = staffRecord(target.guild.id, member.id);
  const active = guild.active[member.id];

  const lines = [
    "**Staff:** <@" + member.id + ">",
    "**Status:** " + (active ? "On duty" : "Off duty"),
    "**Points:** " + record.points,
    "**Shifts:** " + record.shifts,
    "**Total Time:** " + formatDuration(record.totalMs)
  ];
  if (active) lines.splice(2, 0, "**Started:** <t:" + Math.floor(active.startedAt / 1000) + ":R>");

  await send(target, { embeds: [embed(active ? COLORS.live : COLORS.info, "Staff Shift Status", lines.join("\n"))], allowedMentions: { parse: [] } });
}

function leaderboardEmbed(guild) {
  const state = guildState(guild.id);
  const rows = Object.values(state.staff)
    .sort((a, b) => b.points - a.points || b.totalMs - a.totalMs)
    .slice(0, 10)
    .map((record, index) => "**" + (index + 1) + ".** <@" + record.userId + "> • **" + record.points + "** pts • " + formatDuration(record.totalMs));

  return embed(COLORS.info, "🏆 Staff Points Leaderboard", rows.length ? rows.join("\n") : "No staff points yet.");
}

async function leaderboard(target) {
  await send(target, { embeds: [leaderboardEmbed(target.guild)], allowedMentions: { parse: [] } });
}

async function addPoints(target, member, amount) {
  if (!isManager(target.member)) {
    await send(target, { embeds: [embed(COLORS.warn, "Management Only", "You need Manage Server to edit staff points.")], allowedMentions: { parse: [] } });
    return;
  }
  const safeAmount = Math.trunc(Number(amount) || 0);
  const record = staffRecord(target.guild.id, member.id);
  record.points = Math.max(0, record.points + safeAmount);
  saveStore();
  await send(target, { embeds: [embed(COLORS.info, "Points Updated", "<@" + member.id + "> now has **" + record.points + "** points.")], allowedMentions: { parse: [] } });
}

async function prefixCommand(message, args) {
  const sub = (args[0] || "status").toLowerCase();
  if (sub === "start") return start(message);
  if (sub === "end" || sub === "stop") return end(message);
  if (sub === "status" || sub === "me") return status(message);
  if (sub === "leaderboard" || sub === "lb" || sub === "top") return leaderboard(message);
  if (sub === "addpoints" || sub === "add") {
    const member = message.mentions.members.first();
    const amount = Number.parseInt(args[2] || "0", 10);
    if (!member || !amount) {
      await message.channel.send("Usage: `.shift addpoints @user <amount>`");
      return;
    }
    return addPoints(message, member, amount);
  }
  await message.channel.send("Usage: `.shift start`, `.shift end`, `.shift status`, `.shift leaderboard`, `.shift addpoints @user <amount>`");
}

module.exports = { start, end, status, leaderboard, addPoints, prefixCommand, isStaff };