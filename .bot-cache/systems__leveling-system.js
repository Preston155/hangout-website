const fs = require("fs");
const path = require("path");
const { baseEmbed, COLORS } = require("../utils/embed-theme");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "levels.json");
const MESSAGE_COOLDOWN_MS = 60_000;
const MIN_XP = 15;
const MAX_XP = 25;
const LEADERBOARD_SIZE = 10;

const LEVEL_ROLES = [
  { level: 5, name: "⭐・LVL 5" },
  { level: 10, name: "⭐・LVL 10" },
  { level: 15, name: "⭐・LVL 15" },
  { level: 20, name: "⭐・LVL 20" },
  { level: 30, name: "⭐・LVL 30" },
  { level: 40, name: "⭐・LVL 40" },
  { level: 50, name: "⭐・LVL 50" },
  { level: 50, name: "⭐・LVL 50+" }
];

const cooldowns = new Map();

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ guilds: {} }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Level data was unreadable, recreating file:", error.message);
    return { guilds: {} };
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getGuildStore(data, guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = { users: {} };
  }
  return data.guilds[guildId];
}

function getUserRecord(guildStore, userId) {
  if (!guildStore.users[userId]) {
    guildStore.users[userId] = {
      xp: 0,
      level: 0,
      messages: 0,
      lastLevelUpAt: null
    };
  }
  return guildStore.users[userId];
}

function xpForLevel(level) {
  return 100 + level * level * 35;
}

function totalXpForLevel(level) {
  let total = 0;
  for (let current = 0; current < level; current += 1) {
    total += xpForLevel(current);
  }
  return total;
}

function calculateLevel(totalXp) {
  let level = 0;
  let remaining = totalXp;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  return level;
}

function randomXp() {
  return Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
}

function getCooldownKey(message) {
  return message.guild.id + ":" + message.author.id;
}

function isOnCooldown(message) {
  const key = getCooldownKey(message);
  const last = cooldowns.get(key) || 0;
  return Date.now() - last < MESSAGE_COOLDOWN_MS;
}

function markCooldown(message) {
  cooldowns.set(getCooldownKey(message), Date.now());
}

function shouldAnnounceLevelUp(oldLevel, newLevel) {
  return newLevel > oldLevel && oldLevel < 50;
}

function displayLevel(level) {
  return level >= 50 ? "50+" : String(level);
}

function bestLevelRole(level) {
  let best = null;
  for (const role of LEVEL_ROLES) {
    if (level >= role.level) {
      best = role;
    }
  }
  return best;
}

async function syncLevelRole(member, level) {
  const target = bestLevelRole(level);
  const guildRoles = member.guild.roles.cache;
  const configuredRoles = LEVEL_ROLES
    .map((role) => guildRoles.find((guildRole) => guildRole.name === role.name))
    .filter(Boolean);

  for (const role of configuredRoles) {
    const shouldHave = target && role.name === target.name;

    if (shouldHave && !member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch((error) => {
        console.warn("Could not add level role " + role.name + ": " + error.message);
      });
    }

    if (!shouldHave && member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch((error) => {
        console.warn("Could not remove old level role " + role.name + ": " + error.message);
      });
    }
  }
}

async function sendLevelUp(message, record, oldLevel, config = {}) {
  const role = bestLevelRole(record.level);
  const channel =
    (config.levelUpChannelId && message.guild.channels.cache.get(config.levelUpChannelId)) ||
    message.channel;

  if (!channel || !channel.isTextBased()) {
    return;
  }

  await channel.send(
    "🎉 " +
      message.member.toString() +
      " reached **Level " +
      displayLevel(record.level) +
      "**" +
      (role ? " • 🏷️ " + role.name : "") +
      "\n✨ Keep chatting to earn more XP."
  );
}

async function handleMessage(message, config = {}) {
  if (isOnCooldown(message)) {
    return;
  }

  markCooldown(message);

  const data = readData();
  const guildStore = getGuildStore(data, message.guild.id);
  const record = getUserRecord(guildStore, message.author.id);
  const oldLevel = record.level;

  record.xp += randomXp();
  record.messages += 1;
  record.level = calculateLevel(record.xp);

  if (shouldAnnounceLevelUp(oldLevel, record.level)) {
    record.lastLevelUpAt = new Date().toISOString();
  }

  writeData(data);

  if (shouldAnnounceLevelUp(oldLevel, record.level)) {
    await syncLevelRole(message.member, record.level);
    await sendLevelUp(message, record, oldLevel, config);
  }
}

function getSortedUsers(guildStore) {
  return Object.entries(guildStore.users)
    .map(([userId, record]) => ({ userId, ...record }))
    .sort((a, b) => b.xp - a.xp);
}

function getRank(guildStore, userId) {
  const sorted = getSortedUsers(guildStore);
  const index = sorted.findIndex((record) => record.userId === userId);
  return index === -1 ? null : index + 1;
}

async function applyXp(member, amount, config = {}, announceChannel = null) {
  const data = readData();
  const guildStore = getGuildStore(data, member.guild.id);
  const record = getUserRecord(guildStore, member.id);
  const oldLevel = record.level;

  record.xp = Math.max(0, record.xp + amount);
  record.level = calculateLevel(record.xp);

  if (shouldAnnounceLevelUp(oldLevel, record.level)) {
    record.lastLevelUpAt = new Date().toISOString();
  }

  writeData(data);
  await syncLevelRole(member, record.level);

  if (shouldAnnounceLevelUp(oldLevel, record.level) && announceChannel) {
    await sendLevelUp({ guild: member.guild, member, channel: announceChannel }, record, oldLevel, config);
  }

  return { record, oldLevel };
}

async function addXpCommand(message, args, config = {}) {
  const mentioned = message.mentions.members.first();
  const target = mentioned || message.member;
  const amountArg = mentioned ? args.find((arg) => /^\d+$/.test(arg)) : args[0];
  const amount = Number.parseInt(amountArg, 10);

  if (!Number.isInteger(amount) || amount < 1) {
    await message.channel.send("Usage: .addxp <amount> or .addxp @user <amount>");
    return;
  }

  const cappedAmount = Math.min(amount, 5000000);
  const { record, oldLevel } = await applyXp(target, cappedAmount, config, message.channel);
  const leveled = shouldAnnounceLevelUp(oldLevel, record.level) ? " • 🎉 Level up!" : "";

  await message.channel.send(
    "✅ Added **" +
      cappedAmount +
      " XP** to " +
      target.toString() +
      ". Now **Level " +
      displayLevel(record.level) +
      "** with **" +
      record.xp +
      " XP**." +
      leveled
  );
}

async function sendRank(message, args) {
  const target = message.mentions.members.first() || message.member;
  const data = readData();
  const guildStore = getGuildStore(data, message.guild.id);
  const record = getUserRecord(guildStore, target.id);
  const currentLevelXp = totalXpForLevel(record.level);
  const nextLevelXp = totalXpForLevel(record.level + 1);
  const progressXp = record.xp - currentLevelXp;
  const neededXp = nextLevelXp - currentLevelXp;
  const rank = getRank(guildStore, target.id) || "Unranked";
  const role = bestLevelRole(record.level);

  const isMaxDisplayLevel = record.level >= 50;
  const barLength = 10;
  const filled = isMaxDisplayLevel
    ? barLength
    : Math.max(0, Math.min(barLength, Math.round((progressXp / neededXp) * barLength)));
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

  const embed = baseEmbed(message.guild, COLORS.primary)
    .setAuthor({
      name: target.user.username + "'s Level",
      iconURL: target.user.displayAvatarURL({ size: 128 })
    })
    .setDescription(
      "Level **" +
        displayLevel(record.level) +
        "** · Rank **#" +
        rank +
        "**\n" +
        (isMaxDisplayLevel
          ? bar + " **Max role tier reached**"
          : bar + " **" + progressXp + "/" + neededXp + " XP** to Level " + (record.level + 1)) +
        "\nTotal XP: **" +
        record.xp +
        "**" +
        (role ? "\nRole: **" + role.name + "**" : "")
    );

  await message.channel.send({ embeds: [embed] });
}

async function sendLeaderboard(message) {
  const data = readData();
  const guildStore = getGuildStore(data, message.guild.id);
  const sorted = getSortedUsers(guildStore).slice(0, LEADERBOARD_SIZE);

  if (sorted.length === 0) {
    await message.channel.send("No level data yet.");
    return;
  }

  const lines = sorted.map((record, index) => {
    return (
      "**#" +
      (index + 1) +
      "** <@" +
      record.userId +
      "> - Level **" +
      record.level +
      "** (" +
      record.xp +
      " XP)"
    );
  });

  const embed = baseEmbed(message.guild, COLORS.warning)
    .setTitle("Level Leaderboard")
    .setDescription(lines.join("\n"));

  await message.channel.send({ embeds: [embed] });
}

module.exports = {
  handleMessage,
  sendRank,
  sendLeaderboard,
  addXpCommand
};
