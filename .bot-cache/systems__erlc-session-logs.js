const { EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = process.env.SESSION_LOG_CHANNEL_ID || "1469659715285024851";
const POLL_MS = 30_000;
const ERLC_SERVER_URL = "https://api.policeroleplay.community/v1/server?JoinLogs=true";
const activeMonitors = new Map();

function apiKey() {
  return process.env.ERLC_API_KEY || process.env.ERLC_SERVER_KEY || process.env.SERVER_KEY || "";
}

function logChannel(guild) {
  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  return channel?.isTextBased() ? channel : null;
}

function simpleEmbed(title, description, color = 0x0b1f3a) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "City of Angels • Session Logs" })
    .setTimestamp();
}

async function sendLog(guild, embed) {
  const channel = logChannel(guild);
  if (!channel) return;
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch((error) => {
    console.warn("Could not send session log:", error.message);
  });
}

async function logVote(interaction, session, vote) {
  const label = vote === "attend" ? "✅ Attend Vote" : vote === "decline" ? "❌ Can't Attend Vote" : "🗑️ Vote Removed";
  await sendLog(
    interaction.guild,
    simpleEmbed(
      label,
      [
        "**User:** " + interaction.user.toString(),
        "**Session ID:** \`" + session.id + "\`",
        "**Ready:** **" + session.attending.size + "**",
        "**Can't Attend:** **" + session.notAttending.size + "**"
      ].join("\n"),
      vote === "attend" ? 0x2ecc71 : vote === "decline" ? 0xe74c3c : 0xf1c40f
    )
  );
}

function getJoinLogEntries(payload) {
  if (Array.isArray(payload?.JoinLogs)) return payload.JoinLogs;
  if (Array.isArray(payload?.joinLogs)) return payload.joinLogs;
  if (Array.isArray(payload?.join_logs)) return payload.join_logs;
  if (Array.isArray(payload?.Queue)) return [];
  return [];
}

function entryKey(entry) {
  return String(entry.Player || entry.player || entry.Username || entry.username || entry.Name || entry.name || JSON.stringify(entry));
}

function entryName(entry) {
  return String(entry.Player || entry.player || entry.Username || entry.username || entry.Name || entry.name || "Unknown player");
}

function entryTime(entry) {
  const value = entry.Timestamp || entry.timestamp || entry.Time || entry.time;
  if (!value) return "";
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return " • <t:" + (seconds > 9999999999 ? Math.floor(seconds / 1000) : seconds) + ":R>";
  }
  return " • " + String(value);
}

async function fetchServerJoinLogs() {
  const key = apiKey();
  if (!key) return { missingKey: true, entries: [] };

  const response = await fetch(ERLC_SERVER_URL, {
    headers: {
      "server-key": key,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("ERLC API returned " + response.status);
  }

  const payload = await response.json();
  return { missingKey: false, entries: getJoinLogEntries(payload) };
}

async function pollSessionJoins(client, guildId) {
  const monitor = activeMonitors.get(guildId);
  if (!monitor) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  try {
    const result = await fetchServerJoinLogs();
    if (result.missingKey) {
      if (!monitor.warnedMissingKey) {
        monitor.warnedMissingKey = true;
        await sendLog(guild, simpleEmbed("⚠️ ERLC API Key Missing", "Add \`ERLC_API_KEY=your_key\` to \`.env\` so session joins can be logged.", 0xf1c40f));
      }
      return;
    }

    for (const entry of result.entries) {
      const key = entryKey(entry);
      if (monitor.seen.has(key)) continue;
      monitor.seen.add(key);
      await sendLog(
        guild,
        simpleEmbed(
          "🚓 Session Join Logged",
          "**Player:** " + entryName(entry) + entryTime(entry) + "\n**Session ID:** \`" + monitor.sessionId + "\`",
          0x3498db
        )
      );
    }
  } catch (error) {
    if (!monitor.warnedError) {
      monitor.warnedError = true;
      await sendLog(guild, simpleEmbed("⚠️ ERLC Join Log Error", error.message, 0xe67e22));
    }
  }
}

function startSessionMonitor(client, guild, session) {
  stopSessionMonitor(guild.id);
  activeMonitors.set(guild.id, {
    sessionId: session.id,
    seen: new Set(),
    warnedMissingKey: false,
    warnedError: false,
    interval: null
  });

  const monitor = activeMonitors.get(guild.id);
  monitor.interval = setInterval(() => {
    pollSessionJoins(client, guild.id);
  }, POLL_MS);

  pollSessionJoins(client, guild.id);
}

function stopSessionMonitor(guildId) {
  const monitor = activeMonitors.get(guildId);
  if (monitor?.interval) clearInterval(monitor.interval);
  activeMonitors.delete(guildId);
}

async function logSessionStarted(guild, session) {
  await sendLog(
    guild,
    simpleEmbed(
      "🎮 Session Started",
      "**Session:** `" + session.id + "`\n**Ready:** **" + session.attending.size + "**",
      0x2ecc71
    )
  );
}

async function logSessionEnded(guild, session) {
  await sendLog(
    guild,
    simpleEmbed(
      "🛑 Session Ended",
      "**Session:** `" + session.id + "`\n**Attendance Saved:** **" + session.attending.size + "**",
      0xe74c3c
    )
  );
}

module.exports = {
  logVote,
  logSessionStarted,
  logSessionEnded,
  startSessionMonitor,
  stopSessionMonitor
};
