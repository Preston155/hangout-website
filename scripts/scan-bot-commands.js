#!/usr/bin/env node
/**
 * Scans PrestonHQ bot folders and emits a command catalog JSON.
 * Run on the VPS: node scripts/scan-bot-commands.js > dashboard-src/src/catalog.json
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const PERM_NAMES = {
  1n: "Create Instant Invite",
  2n: "Kick Members",
  4n: "Ban Members",
  8n: "Administrator",
  16n: "Manage Channels",
  32n: "Manage Guild",
  64n: "Add Reactions",
  128n: "View Audit Log",
  256n: "Priority Speaker",
  512n: "Stream",
  1024n: "View Channel",
  2048n: "Send Messages",
  4096n: "Send TTS Messages",
  8192n: "Manage Messages",
  16384n: "Embed Links",
  32768n: "Attach Files",
  65536n: "Read Message History",
  131072n: "Mention Everyone",
  262144n: "Use External Emojis",
  524288n: "View Guild Insights",
  1048576n: "Connect",
  2097152n: "Speak",
  4194304n: "Mute Members",
  8388608n: "Deafen Members",
  16777216n: "Move Members",
  33554432n: "Use VAD",
  67108864n: "Change Nickname",
  134217728n: "Manage Nicknames",
  268435456n: "Manage Roles",
  536870912n: "Manage Webhooks",
  1073741824n: "Manage Emojis and Stickers",
  2147483648n: "Manage Events",
  4294967296n: "Manage Threads",
  8589934592n: "Create Public Threads",
  17179869184n: "Create Private Threads",
  34359738368n: "Use External Stickers",
  68719476736n: "Send Messages in Threads",
  137438953472n: "Use Embedded Activities",
  274877906944n: "Moderate Members",
  549755813888n: "View Creator Monetization Analytics",
  1099511627776n: "Use Soundboard",
  2199023255552n: "Create Guild Expressions",
  4398046511104n: "Create Events",
  8796093022208n: "Use External Sounds",
  17592186044416n: "Send Voice Messages",
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".test.js")) out.push(full);
  }
  return out;
}

function permLabel(raw) {
  if (raw == null || raw === "" || raw === 0 || raw === "0") return "Everyone";
  try {
    const bits = BigInt(raw);
    if ((bits & 8n) === 8n) return "Administrator";
    const names = Object.entries(PERM_NAMES)
      .filter(([bit]) => (bits & BigInt(bit)) === BigInt(bit))
      .map(([, name]) => name);
    return names.slice(0, 2).join(", ") || "Staff";
  } catch {
    return String(raw);
  }
}

function inferCategory(botId, relPath, name, type, hints = {}) {
  const p = relPath.toLowerCase();
  const n = name.toLowerCase();
  if (hints.category) return normalizeCategory(hints.category);
  if (p.includes("moderation") || p.includes("purge") || ["ban", "kick", "warn", "timeout", "modlogs", "purge", "clear"].some((k) => n.includes(k)))
    return "Moderation";
  if (p.includes("ticket") || n.includes("ticket")) return "Tickets";
  if (p.includes("giveaway") || n.includes("giveaway")) return "Giveaways";
  if (p.includes("session") || n.includes("session") || n === "shift" || n.includes("shift")) return "Sessions";
  if (type === "auto" || hints.auto) return "Systems/Automation";
  if (type === "slash") return "Slash commands";
  if (type === "prefix") return "Prefix commands";
  return "Utility";
}

function normalizeCategory(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("moderation") || v === "mod") return "Moderation";
  if (v.includes("ticket")) return "Tickets";
  if (v.includes("giveaway")) return "Giveaways";
  if (v.includes("session")) return "Sessions";
  if (v.includes("system") || v.includes("automation")) return "Systems/Automation";
  if (v.includes("slash")) return "Slash commands";
  if (v.includes("prefix")) return "Prefix commands";
  if (v.includes("utility") || v === "utility") return "Utility";
  return "Utility";
}

function addCommand(map, cmd) {
  const key = `${cmd.type}:${cmd.name}`;
  if (map.has(key)) return;
  map.set(key, cmd);
}

function scanSlashFile(file, bot, prefixSymbol, commandsRoot, map) {
  let mod;
  try {
    delete require.cache[require.resolve(file)];
    mod = require(file);
  } catch {
    return;
  }
  if (!mod?.data?.name) return;
  let json;
  try {
    json = typeof mod.data.toJSON === "function" ? mod.data.toJSON() : { name: mod.data.name, description: mod.data.description || "" };
  } catch {
    json = { name: mod.data.name, description: mod.data.description || "" };
  }
  const rel = path.relative(commandsRoot, file);
  const subs = json.options?.filter((o) => o.type === 1 || o.type === 2).map((o) => o.name) || [];
  const usage = subs.length ? `/${json.name} <${subs.join("|")}>` : `/${json.name}`;
  addCommand(map, {
    id: `${bot.id}-slash-${json.name}`,
    name: json.name,
    type: "slash",
    description: json.description || mod.description || "No description provided.",
    usage,
    permission: permLabel(json.default_member_permissions ?? mod.defaultMemberPermissions),
    cooldown: mod.cooldown ?? null,
    enabled: mod.enabled !== false,
    category: inferCategory(bot.id, rel, json.name, "slash", { category: mod.category }),
    source: rel,
  });
}

function scanPrefixModule(file, bot, prefixSymbol, commandsRoot, map, mod, name, aliases = []) {
  const rel = path.relative(commandsRoot, file);
  const desc = mod.description || mod.help || "Prefix command.";
  const usage = mod.usage || `${prefixSymbol}${name}`;
  addCommand(map, {
    id: `${bot.id}-prefix-${name}`,
    name,
    type: "prefix",
    description: desc,
    usage,
    permission: mod.permission || mod.permissions || "Staff",
    cooldown: mod.cooldown ?? null,
    enabled: mod.enabled !== false,
    category: inferCategory(bot.id, rel, name, "prefix", { category: mod.category }),
    source: rel,
    aliases,
  });
}

function scanPrefixFile(file, bot, prefixSymbol, commandsRoot, map) {
  let mod;
  try {
    delete require.cache[require.resolve(file)];
    mod = require(file);
  } catch {
    return;
  }
  if (mod?.data?.name) return;
  if (mod?.prefixName && typeof mod.executePrefix === "function") {
    scanPrefixModule(file, bot, prefixSymbol, commandsRoot, map, mod, mod.prefixName, mod.aliases || []);
    return;
  }
  if (mod?.name && typeof mod.execute === "function" && !mod.data) {
    scanPrefixModule(file, bot, prefixSymbol, commandsRoot, map, mod, mod.name, mod.aliases || []);
  }
}

function scanBotCommands(bot) {
  const map = new Map();
  const commandsRoot = path.join(bot.root, "src/commands");
  for (const file of walk(commandsRoot)) scanSlashFile(file, bot, bot.prefix, commandsRoot, map);
  for (const file of walk(commandsRoot)) scanPrefixFile(file, bot, bot.prefix, commandsRoot, map);
  for (const extra of bot.extra || []) addCommand(map, { ...extra, id: extra.id || `${bot.id}-${extra.type}-${extra.name}` });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function scanSystems(bot) {
  const systemsRoot = path.join(bot.root, "src/systems");
  if (!fs.existsSync(systemsRoot)) return [];
  const features = [];
  const seen = new Set();
  for (const file of walk(systemsRoot)) {
    const base = path.basename(file, ".js");
    if (seen.has(base)) continue;
    if (/(Manager|Service|System|Integration|Logger|Renderer|Picker|Scheduler|Config|Database)$/i.test(base) || base.includes("-system")) {
      seen.add(base);
      const label = base.replace(/([A-Z])/g, " $1").replace(/-/g, " ").trim();
      features.push({
        id: `${bot.id}-auto-${base}`,
        name: label,
        type: "auto",
        description: `Automated ${label.toLowerCase()} feature.`,
        usage: "Automatic / event-driven",
        permission: "System",
        cooldown: null,
        enabled: true,
        category: "Systems/Automation",
        source: path.relative(path.join(bot.root, "src"), file),
      });
    }
  }
  return features.slice(0, 12);
}

function pm2Statuses() {
  try {
    const raw = execFileSync("pm2", ["jlist"], { encoding: "utf8", timeout: 10000 });
    const list = JSON.parse(raw || "[]");
    const targets = { bot2: "icesway", bot3: "veltrix", bot4: "ecrp" };
    const out = {};
    for (const proc of list) {
      const name = proc.name;
      const botId = targets[name];
      if (!botId) continue;
      const env = proc.pm2_env || {};
      out[botId] = {
        pm2: name,
        online: env.status === "online",
        status: env.status || "unknown",
        uptime: env.pm_uptime || null,
        restarts: Number(env.restart_time || 0),
        memoryMb: Math.round(Number(proc.monit?.memory || 0) / 1024 / 1024),
        cpu: Number(proc.monit?.cpu || 0),
      };
    }
    return out;
  } catch {
    return {};
  }
}

const BOTS = [
  {
    id: "icesway",
    name: "IceSway Utils",
    pm2: "bot2",
    root: "/root/bots/bot2",
    prefix: ".",
    accent: "#38bdf8",
    extra: [],
  },
  {
    id: "veltrix",
    name: "Veltrix",
    pm2: "bot3",
    root: "/root/bots/bot3",
    prefix: ".",
    accent: "#8b5cf6",
    extra: [
      { name: "purge", type: "prefix", description: "Bulk delete messages safely with confirmation.", usage: ".purge <amount>", permission: "Manage Messages", cooldown: null, enabled: true, category: "Moderation", source: "commands/purge.js", aliases: ["clear"] },
      { name: "session", type: "prefix", description: "Manage ERLC session votes, starts, attendance, and roster.", usage: ".session <action>", permission: "Manage Server", cooldown: null, enabled: true, category: "Sessions", source: "systems/session-system.js" },
      { name: "sv", type: "prefix", description: "Start a session vote.", usage: ".sv", permission: "Manage Server", cooldown: null, enabled: true, category: "Sessions", source: "index.js" },
      { name: "ss", type: "prefix", description: "Start an active session.", usage: ".ss", permission: "Manage Server", cooldown: null, enabled: true, category: "Sessions", source: "index.js" },
      { name: "se", type: "prefix", description: "End the active session.", usage: ".se", permission: "Manage Server", cooldown: null, enabled: true, category: "Sessions", source: "index.js" },
      { name: "shift", type: "prefix", description: "Staff shift and points system.", usage: ".shift <action>", permission: "Manage Messages", cooldown: null, enabled: true, category: "Sessions", source: "systems/staff-shift-system.js", aliases: ["staffshift", "duty"] },
      { name: "counting", type: "prefix", description: "Configure, reset, disable, or view counting game status.", usage: ".counting <action>", permission: "Manage Server", cooldown: null, enabled: true, category: "Systems/Automation", source: "systems/counting-system.js", aliases: ["count"] },
      { name: "level", type: "prefix", description: "Show member rank and XP.", usage: ".level [@user]", permission: "Everyone", cooldown: null, enabled: true, category: "Utility", source: "systems/leveling-system.js", aliases: ["rank"] },
      { name: "levels", type: "prefix", description: "Show the XP leaderboard.", usage: ".levels", permission: "Everyone", cooldown: null, enabled: true, category: "Utility", source: "systems/leveling-system.js", aliases: ["leaderboard", "lb"] },
      { name: "setuproles", type: "prefix", description: "Set up reaction role panels.", usage: ".setuproles", permission: "Manage Server", cooldown: null, enabled: true, category: "Systems/Automation", source: "systems/reaction-roles.js", aliases: ["reactionroles"] },
      { name: "server-status", type: "prefix", description: "Show server and community status panel.", usage: ".server-status", permission: "Everyone", cooldown: 10, enabled: true, category: "Utility", source: "commands/server-status.js" },
      { name: "server-roles", type: "prefix", description: "Show server roles with pagination.", usage: ".server-roles", permission: "Manage Roles", cooldown: null, enabled: true, category: "Moderation", source: "commands/server-roles.js" },
    ],
  },
  {
    id: "ecrp",
    name: "ECRP Assistant",
    pm2: "bot4",
    root: "/root/bots/bot4",
    prefix: "-",
    accent: "#22c55e",
    extra: [
      { name: "kick", type: "prefix", description: "Kick a member.", usage: "-kick @user [reason]", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "ban", type: "prefix", description: "Ban a member.", usage: "-ban @user [reason]", permission: "Administrator", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "tempban", type: "prefix", description: "Temporarily ban a member.", usage: "-tempban @user <duration> [reason]", permission: "Administrator", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "warn", type: "prefix", description: "Warn a member.", usage: "-warn @user [reason]", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "timeout", type: "prefix", description: "Timeout a member.", usage: "-timeout @user <duration> [reason]", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "cases", type: "prefix", description: "View moderation cases.", usage: "-cases [@user]", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "modlogs", type: "prefix", description: "View moderation logs.", usage: "-modlogs [@user]", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "lock", type: "prefix", description: "Lock the current channel.", usage: "-lock", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "unlock", type: "prefix", description: "Unlock the current channel.", usage: "-unlock", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "slowmode", type: "prefix", description: "Set channel slowmode.", usage: "-slowmode <seconds>", permission: "Staff", cooldown: null, enabled: true, category: "Moderation", source: "commands/moderation/moderation-prefix.js" },
      { name: "session", type: "prefix", description: "Patrol/session vote, start, end, roster, and attendance.", usage: "-session <action>", permission: "Manage Server", cooldown: null, enabled: true, category: "Sessions", source: "commands/utility/session.js" },
      { name: "status", type: "prefix", description: "Post the live server status panel.", usage: "-status", permission: "Manage Server", cooldown: null, enabled: true, category: "Utility", source: "commands/utility/status.js" },
      { name: "birthday", type: "prefix", description: "Set or manage birthday announcements.", usage: "-birthday <date>", permission: "Everyone", cooldown: null, enabled: true, category: "Utility", source: "commands/utility/birthday.js" },
      { name: "ticket setup", type: "prefix", description: "Set up the ticket panel.", usage: "-ticket setup", permission: "Manage Channels", cooldown: null, enabled: true, category: "Tickets", source: "systems/ticket-system.js" },
      { name: "setsupport", type: "prefix", description: "Configure the ticket support role.", usage: "-setsupport @role", permission: "Manage Server", cooldown: null, enabled: true, category: "Tickets", source: "systems/ticket-system.js" },
      { name: "verifyrole", type: "prefix", description: "Configure verification role.", usage: "-verifyrole @role", permission: "Manage Server", cooldown: null, enabled: true, category: "Systems/Automation", source: "systems/verification-system.js" },
      { name: "botupdates", type: "prefix", description: "Post the bot updates panel.", usage: "-botupdates", permission: "Manage Server", cooldown: null, enabled: true, category: "Utility", source: "systems/bot-updates-system.js", aliases: ["bot-updates"] },
    ],
  },
];

const pm2 = pm2Statuses();
const catalog = {
  generatedAt: new Date().toISOString(),
  categories: [
    "Slash commands",
    "Prefix commands",
    "Moderation",
    "Tickets",
    "Giveaways",
    "Sessions",
    "Utility",
    "Systems/Automation",
  ],
  bots: BOTS.map((bot) => {
    const commands = scanBotCommands(bot);
    const systems = scanSystems(bot);
    const merged = [...commands];
    for (const s of systems) {
      if (!merged.some((c) => c.name.toLowerCase() === s.name.toLowerCase() && c.type === "auto")) merged.push(s);
    }
    const stats = {
      total: merged.length,
      slash: merged.filter((c) => c.type === "slash").length,
      prefix: merged.filter((c) => c.type === "prefix").length,
      automation: merged.filter((c) => c.type === "auto" || c.category === "Systems/Automation").length,
    };
    return {
      ...bot,
      status: pm2[bot.id] || { pm2: bot.pm2, online: false, status: "unknown" },
      stats,
      commands: merged,
    };
  }),
};

process.stdout.write(JSON.stringify(catalog, null, 2));
