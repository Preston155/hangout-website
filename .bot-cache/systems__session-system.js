const fs = require("fs");
const path = require("path");

const erlcLogs = require("./erlc-session-logs");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} = require("discord.js");

const DATA_DIR = path.join(__dirname, "..", "data");
const SESSION_DATA_FILE = path.join(DATA_DIR, "sessions.json");
const SESSION_BRAND = process.env.SESSION_BRAND || "City of Angels";
const SESSION_FOOTER = SESSION_BRAND + " • Session Management";
const activeSessions = new Map();
loadSessions();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveSessions() {
  ensureDataDir();
  const sessions = {};

  for (const [key, session] of activeSessions.entries()) {
    sessions[key] = {
      ...session,
      attending: Array.from(session.attending),
      notAttending: Array.from(session.notAttending)
    };
  }

  fs.writeFileSync(SESSION_DATA_FILE, JSON.stringify({ sessions }, null, 2));
}

function loadSessions() {
  ensureDataDir();
  if (!fs.existsSync(SESSION_DATA_FILE)) {
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(SESSION_DATA_FILE, "utf8"));
    for (const [key, session] of Object.entries(data.sessions || {})) {
      activeSessions.set(key, {
        ...session,
        attending: new Set(session.attending || []),
        notAttending: new Set(session.notAttending || [])
      });
    }
  } catch (error) {
    console.error("Could not load saved sessions:", error.message);
  }
}

function staffCheck(message) {
  return message.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

function makeSessionId() {
  return Date.now().toString(36);
}

function sessionKey(guildId) {
  return guildId;
}

function progressBar(value, total) {
  const slots = 10;
  const safeTotal = Math.max(0, Number(total) || 0);
  if (!safeTotal) {
    return "`░░░░░░░░░░` **0%**";
  }

  const ratio = Math.max(0, Math.min(1, value / safeTotal));
  const percent = Math.round(ratio * 100);
  const filled = Math.max(0, Math.min(slots, Math.round(ratio * slots)));
  return "`" + "█".repeat(filled) + "░".repeat(slots - filled) + "` **" + percent + "%**";
}

function voteStatusLine(session) {
  if (session.endedAt) return "Closed";
  if (session.startedAt) return "Active";
  return "Active";
}

function compactStats(session) {
  const total = session.attending.size + session.notAttending.size;
  return [
    "✅ **Ready:** " + session.attending.size,
    "❌ **Out:** " + session.notAttending.size,
    "📊 **Total:** " + total
  ].join("\n");
}

function voteBadge(session) {
  if (session.startedAt) return "`LIVE`";
  if (session.endedAt) return "`CLOSED`";
  return "`VOTE OPEN`";
}

function memberLine(ids, emptyText) {
  const list = Array.from(ids).map((id) => "<@" + id + ">");
  return list.length ? list.join("  ") : emptyText;
}

function statusPill(label) {
  return "`" + label + "`";
}

function mentionList(ids, emptyText) {
  const list = Array.from(ids).map((id, index) => "**" + (index + 1) + ".** <@" + id + ">");
  return list.length ? list.join("\n") : emptyText;
}

function sessionSummary(session) {
  const total = session.attending.size + session.notAttending.size;
  return {
    total,
    ready: session.attending.size,
    out: session.notAttending.size,
    status: voteStatusLine(session)
  };
}

function compactEmbed(color, title, description) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: SESSION_FOOTER })
    .setTimestamp();
}

function sessionHelpEmbed() {
  return compactEmbed(
    0x2f6bff,
    "City of Angels Sessions",
    [
      "**.session vote** - open a patrol vote",
      "**.session start** - start the active session",
      "**.session end** - close and save attendance",
      "**.session status** - view the current session",
      "**.session list** - show ready/out voters"
    ].join("\n")
  );
}

function sessionStatusEmbed(session) {
  if (!session) {
    return compactEmbed(0x95a5a6, "No Active Session", "Start one with **.session vote**.");
  }

  const summary = sessionSummary(session);
  return compactEmbed(
    session.startedAt ? 0x2f6bff : 0x2ecc71,
    "City of Angels Session Status",
    [
      "**Host:** <@" + session.hostId + ">  •  **Status:** " + summary.status,
      "**Votes:** ✅ " + summary.ready + " Ready  •  ❌ " + summary.out + " Out  •  📊 " + summary.total + " Total",
      "**Readiness:** " + progressBar(summary.ready, summary.total)
    ].join("\n")
  );
}

function sessionListEmbed(session) {
  if (!session) {
    return compactEmbed(0x95a5a6, "No Active Session", "There is no active vote list.");
  }

  return compactEmbed(
    0x2f6bff,
    "Session Vote List",
    [
      "**Ready:** " + memberLine(session.attending, "None yet."),
      "**Out:** " + memberLine(session.notAttending, "None yet.")
    ].join("\n")
  );
}

function buildVoteContainer(session) {
  const totalVotes = session.attending.size + session.notAttending.size;
  const accent = session.endedAt ? 0x2b2d31 : session.startedAt ? 0xed4245 : 0x0f8f4d;

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## 📋 City of Angels Session Vote\n" +
        "**Hosted by:** <@" + session.hostId + ">\n" +
        "**Server:** City of Angels"
      )
    )
    .addSeparatorComponents(makeSmallSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**Roster**\n" +
          compactStats(session)
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**Readiness**\n" +
          progressBar(session.attending.size, totalVotes)
      )
    )
    .addSeparatorComponents(makeSmallSeparator());

  container.addActionRowComponents(voteRows(session)[0]);

  container.addSeparatorComponents(makeSmallSeparator());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent("-# City of Angels • Session Management")
  );

  return container;
}


function attendingMentionIds(session) {
  return Array.from(session.attending || []).filter((id) => /^\d+$/.test(id));
}

function attendingPingText(session) {
  const ids = attendingMentionIds(session);
  return ids.length ? ids.map((id) => "<@" + id + ">").join(" ") : "No attendees to ping.";
}

function makeSmallSeparator() {
  return new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);
}

function buildStartContainer(session) {
  const gameCode = process.env.SESSION_GAME_CODE || "CityAngels";
  const serverOwner = process.env.SESSION_SERVER_OWNER || "Preston";
  const pinged = session.attending.size ? attendingPingText(session) : "No attendees yet.";

  return new ContainerBuilder()
    .setAccentColor(0x1f6feb)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## 🚦 City of Angels Session Started\n" +
        "**Session is now open. Join up and begin patrol.**"
      )
    )
    .addSeparatorComponents(makeSmallSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**🎮 Server**\n" +
          "> **Code:** `" + gameCode + "`\n" +
          "> **Owner:** " + serverOwner
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**✅ Attendance**\n" +
          "> **Ready:** " + session.attending.size + "\n" +
          "> **Pinged:** " + pinged
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**🚓 Patrol Notice**\n" +
          "> Realistic scenes\n" +
          "> Clean comms\n" +
          "> Follow staff direction"
      )
    )
    .addSeparatorComponents(makeSmallSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# City of Angels • Active Patrol")
    );
}


function sessionMentionIds(session, extraIds = []) {
  return Array.from(new Set([...extraIds, ...attendingMentionIds(session)].filter((id) => /^\d+$/.test(id))));
}

function mentionContent(ids) {
  return ids.length ? ids.map((id) => "<@" + id + ">").join(" ") : "";
}

async function sendCleanPingEmbed(channel, pingIds, payload) {
  const sent = await channel.send({
    ...payload,
    content: mentionContent(pingIds),
    allowedMentions: {
      parse: [],
      users: pingIds
    }
  });

  if (pingIds.length) {
    setTimeout(() => {
      sent.edit({ content: "", allowedMentions: { parse: [] } }).catch(() => null);
    }, 1200);
  }

  return sent;
}

async function sendSessionStarted(channel, session) {
  const attendingIds = attendingMentionIds(session);

  await channel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [buildStartContainer(session)],
    allowedMentions: {
      users: attendingIds,
      roles: [],
      parse: []
    }
  });

  await erlcLogs.logSessionStarted(channel.guild, session);
  erlcLogs.startSessionMonitor(channel.client, channel.guild, session);
}

async function refreshVoteMessage(guild, session) {
  if (!session.voteMessageId || !session.channelId) {
    return;
  }

  const channel = guild.channels.cache.get(session.channelId);
  if (!channel || !channel.isTextBased()) {
    return;
  }

  const voteMessage = await channel.messages.fetch(session.voteMessageId).catch(() => null);
  if (!voteMessage) {
    return;
  }

  await voteMessage.edit({
    content: "",
    embeds: [],
    flags: MessageFlags.IsComponentsV2,
    components: [buildVoteContainer(session)],
    allowedMentions: {
      users: sessionMentionIds(session, [session.hostId]),
      roles: [],
      parse: []
    }
  });
}

function shouldAutoStartSession(session) {
  return !session.startedAt && session.attending.size >= 1;
}

function buildEndContainer(message, session) {
  const attendance = memberLine(session.attending, "No attendance logged.");
  const totalVotes = session.attending.size + session.notAttending.size;

  return new ContainerBuilder()
    .setAccentColor(0xed4245)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## 🏁 City of Angels Session Closed\n" +
        "**Session ended. Attendance has been saved.**"
      )
    )
    .addSeparatorComponents(makeSmallSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**📋 Report**\n" +
          "> **Closed By:** " + message.author.toString() + "\n" +
          "> **Attended:** " + session.attending.size + "\n" +
          "> **Votes:** " + totalVotes
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**👥 Attendance**\n> " + attendance.slice(0, 3500)
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**📦 Closing Notice**\n" +
          "> Reset scenes\n" +
          "> Clear vehicles\n" +
          "> Prepare for next patrol"
      )
    )
    .addSeparatorComponents(makeSmallSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# City of Angels • Session Closed")
    );
}


function voteRows(session) {
  const locked = Boolean(session.endedAt);
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("session:attend:" + session.id)
        .setLabel("Ready")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success)
        .setDisabled(locked),
      new ButtonBuilder()
        .setCustomId("session:decline:" + session.id)
        .setLabel("Out")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(locked),
      new ButtonBuilder()
        .setCustomId("session:remove:" + session.id)
        .setLabel("Clear")
        .setEmoji("🧹")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(locked)
    )
  ];
}


async function runSessionCommand(message, args) {
  const subcommand = (args[0] || "help").toLowerCase();
  const aliases = {
    v: "vote",
    s: "start",
    e: "end",
    close: "end",
    stop: "end",
    info: "status",
    voters: "list",
    roster: "list"
  };
  const action = aliases[subcommand] || subcommand;

  if (!["help", "vote", "start", "end", "status", "list"].includes(action)) {
    await message.channel.send({ embeds: [sessionHelpEmbed()], allowedMentions: { parse: [] } });
    return;
  }

  if (action === "help") {
    await message.channel.send({ embeds: [sessionHelpEmbed()], allowedMentions: { parse: [] } });
    return;
  }

  const key = sessionKey(message.guild.id);
  const session = activeSessions.get(key);

  if (action === "status") {
    await message.channel.send({ embeds: [sessionStatusEmbed(session)], allowedMentions: { parse: [] } });
    return;
  }

  if (action === "list") {
    await message.channel.send({
      embeds: [sessionListEmbed(session)],
      allowedMentions: {
        users: session ? sessionMentionIds(session, [session.hostId]) : [],
        roles: [],
        parse: []
      }
    });
    return;
  }

  if (!staffCheck(message)) {
    await message.channel.send({
      embeds: [compactEmbed(0xed4245, "Session Command Denied", "You need **Manage Server** to control sessions.")],
      allowedMentions: { parse: [] }
    });
    return;
  }

  if (action === "vote") {
    await startVote(message);
    return;
  }

  if (action === "start") {
    await startSession(message);
    return;
  }

  await endSession(message);
}

async function startVote(message) {
  const key = sessionKey(message.guild.id);
  const session = {
    id: makeSessionId(),
    guildId: message.guild.id,
    channelId: message.channel.id,
    hostId: message.author.id,
    attending: new Set(),
    notAttending: new Set(),
    voteMessageId: null,
    startedAt: null
  };

  const existing = activeSessions.get(key);
  if (existing && !existing.endedAt) {
    await message.channel.send({
      embeds: [sessionStatusEmbed(existing).setTitle("Session Already Open")],
      allowedMentions: { parse: [] }
    });
    return;
  }

  activeSessions.set(key, session);
  saveSessions();

  const sent = await message.channel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [buildVoteContainer(session)],
    allowedMentions: {
      users: [session.hostId],
      roles: [],
      parse: []
    }
  });

  session.voteMessageId = sent.id;
  saveSessions();
}

async function startSession(message) {
  const key = sessionKey(message.guild.id);
  let session = activeSessions.get(key);

  if (!session) {
    session = {
      id: makeSessionId(),
      guildId: message.guild.id,
      channelId: message.channel.id,
      hostId: message.author.id,
      attending: new Set(),
      notAttending: new Set(),
      voteMessageId: null,
      startedAt: null
    };
    activeSessions.set(key, session);
    saveSessions();
  }

  session.startedAt = Date.now();
  saveSessions();

  await refreshVoteMessage(message.guild, session);
  await sendSessionStarted(message.channel, session);
}

async function endSession(message) {
  const key = sessionKey(message.guild.id);
  const session = activeSessions.get(key);

  if (!session) {
    await message.channel.send({
      embeds: [compactEmbed(0x95a5a6, "No Active Session", "There is no session to close.")],
      allowedMentions: { parse: [] }
    });
    return;
  }

  const endPingIds = sessionMentionIds(session, [message.author.id]);
  await message.channel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [buildEndContainer(message, session)],
    allowedMentions: {
      users: endPingIds,
      roles: [],
      parse: []
    }
  });
  await erlcLogs.logSessionEnded(message.guild, session);
  erlcLogs.stopSessionMonitor(message.guild.id);
  activeSessions.delete(key);
  saveSessions();
}

async function updateVoteMessage(interaction, session) {
  await interaction.message.edit({
    content: "",
    embeds: [],
    flags: MessageFlags.IsComponentsV2,
    components: [buildVoteContainer(session)],
    allowedMentions: {
      users: sessionMentionIds(session, [session.hostId]),
      roles: [],
      parse: []
    }
  });
}

async function handleInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith("session:")) {
    return false;
  }

  const [, action, sessionId] = interaction.customId.split(":");
  const session = activeSessions.get(sessionKey(interaction.guild.id));

  if (!session || session.id !== sessionId) {
    await interaction.reply({ content: "This session vote is no longer active.", flags: 64 });
    return true;
  }

  if (action === "attend") {
    await interaction.deferReply({ flags: 64 });

    session.attending.add(interaction.user.id);
    session.notAttending.delete(interaction.user.id);

    const shouldStart = shouldAutoStartSession(session);
    if (shouldStart) {
      session.startedAt = Date.now();
    }

    saveSessions();
    await updateVoteMessage(interaction, session);

    if (shouldStart) {
      await refreshVoteMessage(interaction.guild, session);
      await interaction.editReply("Ready. Session started.");
      erlcLogs.logVote(interaction, session, "attend").catch(() => null);
      await sendSessionStarted(interaction.channel, session);
      return true;
    }

    await interaction.editReply("Ready.");
    erlcLogs.logVote(interaction, session, "attend").catch(() => null);
    return true;
  }

  if (action === "decline") {
    await interaction.deferReply({ flags: 64 });

    session.notAttending.add(interaction.user.id);
    session.attending.delete(interaction.user.id);
    saveSessions();
    await updateVoteMessage(interaction, session);
    await interaction.editReply("Marked out.");
    erlcLogs.logVote(interaction, session, "decline").catch(() => null);
    return true;
  }

  if (action === "remove") {
    await interaction.deferReply({ flags: 64 });

    const canClear = interaction.user.id === session.hostId || interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!canClear) {
      await interaction.editReply("Only the host or staff can clear this vote.");
      return true;
    }

    session.attending.clear();
    session.notAttending.clear();
    saveSessions();
    await updateVoteMessage(interaction, session);
    await interaction.editReply("Votes cleared.");
    erlcLogs.logVote(interaction, session, "remove").catch(() => null);
    return true;
  }

  if (action === "view") {
    await interaction.deferReply({ flags: 64 });
    await interaction.editReply({ embeds: [sessionListEmbed(session)] });
    return true;
  }

  return true;
}

module.exports = {
  runSessionCommand,
  handleInteraction
};
