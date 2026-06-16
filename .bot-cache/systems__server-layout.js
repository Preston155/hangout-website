const { SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField, MessageFlags } = require("discord.js");

const BRAND_COLOR = 0x0b1f4d;
const OK_COLOR = 0x22c55e;
const ERROR_COLOR = 0xef4444;

const ROLE_DEFINITIONS = [];

const ROLE_ALIASES = {
  verified: ["Verified", "🎭 Roleplay Member", "🦺 Whitelisted Member", "💬 Member", "🌟 Active Member"],
  trialStaff: ["Trial Staff", "🎓 Staff Trainee", "🧪 Trial Moderator"],
  moderator: ["Moderator", "🛡️ Moderator"],
  seniorModerator: ["Senior Moderator", "🛠️ Head Moderator", "🔨 Head Administrator", "🛡️ Server Manager", "⭐ Chief of Staff"],
  administrator: ["Administrator", "🧰 Administrator", "🔨 Administrator", "🔨 Head Administrator", "🛡️ Head Administrator"],
  management: ["Management", "🕴️ Management", "🧠 Server Director", "🏛️ Community Director", "⚡ Co Owner", "💎 Owner", "👑 Founder"],
  ia: ["Internal Affairs", "🛡️ Internal Affairs", "🔎 IA Investigator", "📁 IA Supervisor", "🛡️ Internal Affairs Director"],
  departmentCommand: ["Department Command", "📌 Operations Director", "🚨 Roleplay Director", "🏛️ Department Director", "🚔 MPD Chief", "🚒 FEMS Chief", "📞 Dispatch Director", "🏛️ Government Official", "⚖️ Judge"],
  police: ["Police Department", "🚔 Metropolitan Police Department", "🚓 LEO Certified", "🚔 MPD Supervisor", "🚔 MPD Assistant Chief", "🚔 MPD Chief"],
  fireEms: ["Fire/EMS Department", "🚒 Fire & EMS", "🚒 FEMS Certified", "🚒 FEMS Supervisor", "🚒 FEMS Assistant Chief", "🚒 FEMS Chief"],
  dispatch: ["Dispatch", "📞 Dispatch", "📞 Dispatch Certified", "📞 Dispatch Director"],
  government: ["Government", "🏛️ Government", "🏛️ Government Certified", "🏛️ Government Official", "⚖️ Judge"],
  bot: ["Bots", "🤖 Bots"]
};

const LAYOUT = [
  {
    name: "📌 INFORMATION",
    kind: "info",
    channels: [
      { name: "📢・announcements", aliases: ["📢・announcements"], type: ChannelType.GuildText, mode: "announcements" },
      { name: "📜・server-rules", aliases: ["📜・server-rules"], type: ChannelType.GuildText, mode: "readOnly" },
      { name: "✅・verify", aliases: ["✅・verify"], type: ChannelType.GuildText, mode: "verify" },
      { name: "📊・server-status", aliases: ["📊・server-status"], type: ChannelType.GuildText, mode: "botSendReadOnly" },
      { name: "📌・important-info", aliases: ["📌・important-info"], type: ChannelType.GuildText, mode: "readOnly" }
    ]
  },
  {
    name: "🎫 SUPPORT",
    kind: "support",
    channels: [
      { name: "🎫・create-ticket", aliases: ["🎫・create-ticket", "🎫・open-ticket"], type: ChannelType.GuildText, mode: "ticketCreate" },
      { name: "📖・support-info", aliases: ["📖・support-info"], type: ChannelType.GuildText, mode: "readOnly" },
      { name: "📁・ticket-logs", aliases: ["📁・ticket-logs"], type: ChannelType.GuildText, mode: "staffLog" }
    ]
  },
  {
    name: "🚔 SESSIONS",
    kind: "sessions",
    channels: [
      { name: "📋・session-vote", aliases: ["📋・session-vote"], type: ChannelType.GuildText, mode: "sessionVote" },
      { name: "🚨・session-start", aliases: ["🚨・session-start"], type: ChannelType.GuildText, mode: "sessionStart" },
      { name: "📘・session-logs", aliases: ["📘・session-logs"], type: ChannelType.GuildText, mode: "staffLog" },
      { name: "📣・emergency-pings", aliases: ["📣・emergency-pings", "🚨・emergency-pings"], type: ChannelType.GuildText, mode: "emergencyPings" }
    ]
  },
  {
    name: "💬 COMMUNITY",
    kind: "community",
    channels: [
      { name: "💬・general", aliases: ["💬・general"], type: ChannelType.GuildText, mode: "memberChat" },
      { name: "📸・media", aliases: ["📸・media"], type: ChannelType.GuildText, mode: "media" },
      { name: "🤖・bot-commands", aliases: ["🤖・bot-commands"], type: ChannelType.GuildText, mode: "commandsOnly" },
      { name: "🎉・giveaways", aliases: ["🎉・giveaways"], type: ChannelType.GuildText, mode: "staffBotPost" },
      { name: "📊・polls", aliases: ["📊・polls"], type: ChannelType.GuildText, mode: "staffBotPost" },
      { name: "💡・suggestions", aliases: ["💡・suggestions"], type: ChannelType.GuildText, mode: "suggestions" }
    ]
  },
  {
    name: "🏛️ DEPARTMENTS",
    kind: "departments",
    channels: [
      { name: "🚓・pd-chat", aliases: ["🚓・pd-chat", "🚔・mpd-chat"], type: ChannelType.GuildText, mode: "pd" },
      { name: "🚒・fire-ems-chat", aliases: ["🚒・fire-ems-chat", "🚒・fems-chat"], type: ChannelType.GuildText, mode: "fireEms" },
      { name: "☎️・dispatch-chat", aliases: ["☎️・dispatch-chat", "📞・dispatch-chat"], type: ChannelType.GuildText, mode: "dispatch" },
      { name: "🏛️・government-chat", aliases: ["🏛️・government-chat"], type: ChannelType.GuildText, mode: "government" },
      { name: "📁・department-command", aliases: ["📁・department-command"], type: ChannelType.GuildText, mode: "departmentCommand" },
      { name: "📋・department-logs", aliases: ["📋・department-logs"], type: ChannelType.GuildText, mode: "departmentLogs" }
    ]
  },
  {
    name: "🛡️ INTERNAL AFFAIRS",
    kind: "ia",
    channels: [
      { name: "🛡️・ia-chat", aliases: ["🛡️・ia-chat"], type: ChannelType.GuildText, mode: "iaChat" },
      { name: "🔎・ia-investigations", aliases: ["🔎・ia-investigations"], type: ChannelType.GuildText, mode: "iaChat" },
      { name: "📁・ia-logs", aliases: ["📁・ia-logs"], type: ChannelType.GuildText, mode: "iaLog" },
      { name: "📋・ia-reports", aliases: ["📋・ia-reports"], type: ChannelType.GuildText, mode: "iaChat" }
    ]
  },
  {
    name: "🛡️ STAFF",
    kind: "staff",
    channels: [
      { name: "📌・staff-announcements", aliases: ["📌・staff-announcements"], type: ChannelType.GuildText, mode: "staffAnnouncements" },
      { name: "💬・staff-chat", aliases: ["💬・staff-chat"], type: ChannelType.GuildText, mode: "staffChat" },
      { name: "📋・mod-logs", aliases: ["📋・mod-logs", "🧾・mod-logs"], type: ChannelType.GuildText, mode: "staffLog" },
      { name: "📝・applications-review", aliases: ["📝・applications-review", "📋・applications-review"], type: ChannelType.GuildText, mode: "adminOnly" },
      { name: "⚒️・staff-commands", aliases: ["⚒️・staff-commands"], type: ChannelType.GuildText, mode: "staffCommands" },
      { name: "📂・staff-resources", aliases: ["📂・staff-resources"], type: ChannelType.GuildText, mode: "staffRead" }
    ]
  },
  {
    name: "🔊 VOICE",
    kind: "voice",
    channels: [
      { name: "🔊・General VC", aliases: ["🔊・General VC"], type: ChannelType.GuildVoice, mode: "voicePublic" },
      { name: "🎮・Session VC", aliases: ["🎮・Session VC", "🚓・Session VC"], type: ChannelType.GuildVoice, mode: "voiceSession" },
      { name: "🛡️・Staff VC", aliases: ["🛡️・Staff VC"], type: ChannelType.GuildVoice, mode: "voiceStaff" },
      { name: "📁・Command VC", aliases: ["📁・Command VC"], type: ChannelType.GuildVoice, mode: "voiceCommand" },
      { name: "🎙️・AFK", aliases: ["🎙️・AFK"], type: ChannelType.GuildVoice, mode: "voiceAfk" }
    ]
  }
];

function perm(bits) {
  return bits.filter(Boolean);
}

function roleByName(guild, name) {
  return guild.roles.cache.find((role) => role.name === name) || null;
}

function rolesByGroup(guild, groups) {
  const names = groups.flatMap((group) => ROLE_ALIASES[group] || []);
  const roles = [];
  for (const name of names) {
    const found = roleByName(guild, name);
    if (found && !roles.some((role) => role.id === found.id)) roles.push(found);
  }
  return roles;
}

function add(overwrites, id, allow = [], deny = []) {
  overwrites.push({ id, allow: perm(allow), deny: perm(deny) });
}

function addGroups(guild, overwrites, groups, allow = [], deny = []) {
  for (const role of rolesByGroup(guild, groups)) add(overwrites, role.id, allow, deny);
}

function baseBits() {
  const f = PermissionFlagsBits;
  return {
    read: [f.ViewChannel, f.ReadMessageHistory],
    memberChat: [f.ViewChannel, f.SendMessages, f.ReadMessageHistory, f.AddReactions, f.UseExternalEmojis],
    mediaChat: [f.ViewChannel, f.SendMessages, f.ReadMessageHistory, f.AddReactions, f.UseExternalEmojis, f.AttachFiles, f.EmbedLinks],
    commands: [f.ViewChannel, f.ReadMessageHistory, f.UseApplicationCommands],
    staffChat: [f.ViewChannel, f.SendMessages, f.ReadMessageHistory, f.AddReactions, f.UseExternalEmojis, f.AttachFiles, f.EmbedLinks],
    staffRead: [f.ViewChannel, f.ReadMessageHistory],
    staffManage: [f.ViewChannel, f.SendMessages, f.ReadMessageHistory, f.ManageMessages, f.EmbedLinks, f.AttachFiles],
    bot: [f.ViewChannel, f.SendMessages, f.ReadMessageHistory, f.EmbedLinks, f.AttachFiles, f.ManageMessages, f.ManageChannels, f.UseExternalEmojis, f.UseApplicationCommands],
    voice: [f.ViewChannel, f.Connect, f.Speak, f.Stream, f.UseVAD],
    voiceStaff: [f.ViewChannel, f.Connect, f.Speak, f.Stream, f.UseVAD, f.MuteMembers, f.MoveMembers]
  };
}

function categoryOverwrites(guild, kind) {
  const f = PermissionFlagsBits;
  const b = baseBits();
  const everyone = guild.roles.everyone.id;
  const botId = guild.members.me.id;
  const overwrites = [];

  // Categories start restrictive; child channels only loosen what they need.
  if (["staff", "ia", "departments"].includes(kind)) add(overwrites, everyone, [], [f.ViewChannel, f.SendMessages, f.AddReactions, f.CreatePublicThreads, f.CreatePrivateThreads]);
  else add(overwrites, everyone, b.read, [f.SendMessages]);

  if (kind === "community") addGroups(guild, overwrites, ["verified"], b.memberChat);
  if (["info", "support", "sessions"].includes(kind)) addGroups(guild, overwrites, ["verified"], b.read, [f.SendMessages]);
  if (kind === "voice") addGroups(guild, overwrites, ["verified"], b.voice);
  if (kind === "staff") addGroups(guild, overwrites, ["trialStaff", "moderator", "seniorModerator", "administrator", "management"], b.staffRead);
  if (kind === "ia") addGroups(guild, overwrites, ["ia", "administrator", "management"], b.staffChat);
  if (kind === "departments") addGroups(guild, overwrites, ["departmentCommand", "administrator", "management"], b.staffRead);

  addGroups(guild, overwrites, ["administrator", "management"], b.staffManage);
  add(overwrites, botId, b.bot);
  return overwrites;
}

function channelOverwrites(guild, mode) {
  const f = PermissionFlagsBits;
  const b = baseBits();
  const everyone = guild.roles.everyone.id;
  const botId = guild.members.me.id;
  const overwrites = [];

  const hideEveryone = () => add(overwrites, everyone, [], [f.ViewChannel, f.SendMessages, f.AddReactions, f.CreatePublicThreads, f.CreatePrivateThreads]);
  const readEveryone = () => add(overwrites, everyone, b.read, [f.SendMessages]);
  const bot = () => add(overwrites, botId, b.bot);
  const staffRead = () => addGroups(guild, overwrites, ["trialStaff", "moderator", "seniorModerator", "administrator", "management"], b.staffRead);
  const staffSend = () => addGroups(guild, overwrites, ["trialStaff", "moderator", "seniorModerator", "administrator", "management"], b.staffChat);
  const adminSend = () => addGroups(guild, overwrites, ["administrator", "management"], b.staffManage);
  const modPlusSend = () => addGroups(guild, overwrites, ["moderator", "seniorModerator", "administrator", "management"], b.staffChat);

  switch (mode) {
    case "readOnly":
      readEveryone(); addGroups(guild, overwrites, ["verified"], b.read, [f.SendMessages]); adminSend(); bot(); break;
    case "announcements":
      readEveryone(); addGroups(guild, overwrites, ["verified"], [f.ViewChannel, f.ReadMessageHistory, f.AddReactions], [f.SendMessages]); adminSend(); bot(); break;
    case "verify":
      add(overwrites, everyone, [f.ViewChannel, f.ReadMessageHistory, f.UseApplicationCommands], [f.SendMessages]); bot(); break;
    case "botSendReadOnly":
      readEveryone(); addGroups(guild, overwrites, ["verified"], b.read, [f.SendMessages]); bot(); adminSend(); break;
    case "ticketCreate":
      readEveryone(); addGroups(guild, overwrites, ["verified"], b.commands, [f.SendMessages]); staffRead(); bot(); break;
    case "staffLog":
      hideEveryone(); staffRead(); adminSend(); bot(); break;
    case "sessionVote":
      readEveryone(); addGroups(guild, overwrites, ["verified"], b.commands, [f.SendMessages]); staffSend(); bot(); break;
    case "sessionStart":
      readEveryone(); addGroups(guild, overwrites, ["verified"], b.read, [f.SendMessages]); staffSend(); bot(); break;
    case "emergencyPings":
      readEveryone(); addGroups(guild, overwrites, ["verified"], b.read, [f.SendMessages]); modPlusSend(); bot(); break;
    case "memberChat":
      hideEveryone(); addGroups(guild, overwrites, ["verified"], b.memberChat); staffSend(); bot(); break;
    case "media":
      hideEveryone(); addGroups(guild, overwrites, ["verified"], b.mediaChat); staffSend(); bot(); break;
    case "commandsOnly":
      hideEveryone(); addGroups(guild, overwrites, ["verified"], b.commands, [f.SendMessages, f.AttachFiles]); staffSend(); bot(); break;
    case "staffBotPost":
      readEveryone(); addGroups(guild, overwrites, ["verified"], [f.ViewChannel, f.ReadMessageHistory, f.AddReactions, f.UseApplicationCommands], [f.SendMessages]); staffSend(); bot(); break;
    case "suggestions":
      hideEveryone(); addGroups(guild, overwrites, ["verified"], [f.ViewChannel, f.SendMessages, f.ReadMessageHistory, f.UseApplicationCommands]); add(overwrites, botId, [...b.bot, f.ManageMessages]); staffSend(); break;
    case "pd":
      hideEveryone(); addGroups(guild, overwrites, ["police"], b.memberChat); addGroups(guild, overwrites, ["departmentCommand"], b.staffRead); adminSend(); bot(); break;
    case "fireEms":
      hideEveryone(); addGroups(guild, overwrites, ["fireEms"], b.memberChat); addGroups(guild, overwrites, ["departmentCommand"], b.staffRead); adminSend(); bot(); break;
    case "dispatch":
      hideEveryone(); addGroups(guild, overwrites, ["dispatch"], b.memberChat); addGroups(guild, overwrites, ["departmentCommand"], b.staffRead); adminSend(); bot(); break;
    case "government":
      hideEveryone(); addGroups(guild, overwrites, ["government"], b.memberChat); addGroups(guild, overwrites, ["departmentCommand"], b.staffRead); adminSend(); bot(); break;
    case "departmentCommand":
      hideEveryone(); addGroups(guild, overwrites, ["departmentCommand"], b.staffChat); adminSend(); bot(); break;
    case "departmentLogs":
      hideEveryone(); addGroups(guild, overwrites, ["departmentCommand"], b.staffRead); adminSend(); bot(); break;
    case "iaChat":
      hideEveryone(); addGroups(guild, overwrites, ["ia", "administrator", "management"], b.staffChat); bot(); break;
    case "iaLog":
      hideEveryone(); addGroups(guild, overwrites, ["ia", "administrator", "management"], b.staffRead); adminSend(); bot(); break;
    case "staffAnnouncements":
      hideEveryone(); staffRead(); adminSend(); bot(); break;
    case "staffChat":
      hideEveryone(); staffSend(); bot(); break;
    case "adminOnly":
      hideEveryone(); adminSend(); bot(); break;
    case "staffCommands":
      hideEveryone(); addGroups(guild, overwrites, ["trialStaff", "moderator", "seniorModerator", "administrator", "management"], [...b.commands, f.SendMessages]); bot(); break;
    case "staffRead":
      hideEveryone(); staffRead(); adminSend(); bot(); break;
    case "voicePublic":
      add(overwrites, everyone, [], [f.ViewChannel]); addGroups(guild, overwrites, ["verified"], b.voice); bot(); break;
    case "voiceSession":
      add(overwrites, everyone, [], [f.ViewChannel]); addGroups(guild, overwrites, ["verified"], b.voice); addGroups(guild, overwrites, ["moderator", "seniorModerator", "administrator", "management"], b.voiceStaff); bot(); break;
    case "voiceStaff":
      hideEveryone(); addGroups(guild, overwrites, ["trialStaff", "moderator", "seniorModerator", "administrator", "management"], b.voice); addGroups(guild, overwrites, ["administrator", "management"], b.voiceStaff); bot(); break;
    case "voiceCommand":
      hideEveryone(); addGroups(guild, overwrites, ["departmentCommand", "administrator", "management"], b.voice); bot(); break;
    case "voiceAfk":
      add(overwrites, everyone, [], [f.ViewChannel]); addGroups(guild, overwrites, ["verified"], [f.ViewChannel, f.Connect], [f.Speak]); bot(); break;
    default:
      readEveryone(); bot();
  }

  return overwrites;
}

function findByName(collection, names, type, parentId) {
  const wanted = new Set(names);
  return collection.find((channel) => wanted.has(channel.name) && channel.type === type && (!parentId || channel.parentId === parentId))
    || collection.find((channel) => wanted.has(channel.name) && channel.type === type)
    || null;
}

async function ensureRole(guild, definition, stats) {
  let role = roleByName(guild, definition.name);
  if (!role) {
    role = await guild.roles.create({
      name: definition.name,
      color: definition.color,
      permissions: new PermissionsBitField(definition.permissions),
      hoist: true,
      reason: "Veltrix ERLC setup role creation"
    });
    stats.rolesCreated.push(role.name);
  } else {
    if (role.editable && !role.hoist) {
      await role.edit({ hoist: true, reason: "Veltrix ERLC setup role display sync" });
    }
    stats.rolesUpdated.push(role.name);
  }
  return role;
}

async function ensureCategory(guild, spec, stats) {
  let category = findByName(guild.channels.cache, [spec.name], ChannelType.GuildCategory);
  if (!category) {
    category = await guild.channels.create({
      name: spec.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: categoryOverwrites(guild, spec.kind),
      reason: "Veltrix ERLC setup category creation"
    });
    stats.categoriesCreated.push(spec.name);
  } else {
    await category.permissionOverwrites.set(categoryOverwrites(guild, spec.kind), "Veltrix ERLC category permission sync");
    stats.categoriesUpdated.push(spec.name);
  }
  return category;
}

async function ensureChannel(guild, category, spec, stats) {
  const channel = findByName(guild.channels.cache, [spec.name, ...(spec.aliases || [])], spec.type, category.id);
  const options = {
    name: spec.name,
    type: spec.type,
    parent: category.id,
    permissionOverwrites: channelOverwrites(guild, spec.mode),
    reason: "Veltrix ERLC channel setup"
  };

  if (!channel) {
    const created = await guild.channels.create(options);
    stats.channelsCreated.push(created.name);
    return created;
  }

  const updates = {};
  if (channel.name !== spec.name) updates.name = spec.name;
  if (channel.parentId !== category.id) updates.parent = category.id;
  if (Object.keys(updates).length) await channel.edit(updates, "Veltrix ERLC channel rename/move");
  await channel.permissionOverwrites.set(channelOverwrites(guild, spec.mode), "Veltrix ERLC channel permission sync");
  stats.channelsUpdated.push(spec.name);
  return channel;
}

function format(items) {
  if (!items.length) return "None";
  return items.slice(0, 10).map((item) => "• " + item).join("\n") + (items.length > 10 ? "\n+" + (items.length - 10) + " more" : "");
}

function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle("Setup Failed")
    .setDescription(description)
    .setFooter({ text: "Veltrix • ERLC Server Setup" })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-lcrp-channels")
    .setDescription("Create or update the safe Veltrix ERLC channel/permission layout.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({ embeds: [errorEmbed("You need Administrator permission to run the setup.")] });
      return;
    }

    const guild = interaction.guild;
    const botMember = guild.members.me || await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ embeds: [errorEmbed("I need Manage Channels and Manage Roles before I can safely rebuild the layout.")] });
      return;
    }

    const stats = { rolesCreated: [], rolesUpdated: [], categoriesCreated: [], categoriesUpdated: [], channelsCreated: [], channelsUpdated: [], failed: [] };

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLOR)
          .setTitle("Rebuilding ERLC Server Layout")
          .setDescription("Creating roles, syncing categories, and applying safe channel-specific overwrites. Normal members will not be able to chat in staff, IA, department, logs, or command-only channels.")
      ]
    });

    for (const definition of ROLE_DEFINITIONS) {
      try {
        await ensureRole(guild, definition, stats);
      } catch (error) {
        stats.failed.push("Role " + definition.name + ": " + error.message);
      }
    }

    for (const categorySpec of LAYOUT) {
      try {
        const category = await ensureCategory(guild, categorySpec, stats);
        for (const channelSpec of categorySpec.channels) {
          try {
            await ensureChannel(guild, category, channelSpec, stats);
          } catch (error) {
            stats.failed.push("Channel " + channelSpec.name + ": " + error.message);
          }
        }
      } catch (error) {
        stats.failed.push("Category " + categorySpec.name + ": " + error.message);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(stats.failed.length ? 0xf59e0b : OK_COLOR)
      .setTitle("Veltrix ERLC Setup Complete")
      .setDescription("Permissions were rebuilt with category-level overwrites first, then channel-specific exceptions. Staff/private/log/department/IA channels are hidden from normal members.")
      .addFields(
        { name: "Roles Created", value: format(stats.rolesCreated), inline: true },
        { name: "Roles Updated/Reused", value: format(stats.rolesUpdated), inline: true },
        { name: "Categories Created", value: format(stats.categoriesCreated), inline: true },
        { name: "Categories Updated", value: format(stats.categoriesUpdated), inline: true },
        { name: "Channels Created", value: format(stats.channelsCreated), inline: true },
        { name: "Channels Updated", value: format(stats.channelsUpdated), inline: true },
        { name: "Failed / Skipped", value: format(stats.failed), inline: false }
      )
      .setFooter({ text: "Veltrix • Safe ERLC Permissions" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
