const {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

const P = PermissionFlagsBits;
const COLORS = { working: 0x2563eb, ok: 0x22c55e, warn: 0xf59e0b, error: 0xef4444 };

const CATEGORIES = {
  INFORMATION: "╭──・INFORMATION・──╮",
  SESSION: "╭──・SESSION CENTER・──╮",
  COMMUNITY: "╭──・COMMUNITY・──╮",
  ROLEPLAY: "╭──・ROLEPLAY・──╮",
  DEPARTMENTS: "╭──・DEPARTMENTS・──╮",
  SUPPORT: "╭──・SUPPORT DESK・──╮",
  STAFF: "╭──・STAFF AREA・──╮",
  IA: "╭──・INTERNAL AFFAIRS・──╮",
  MANAGEMENT: "╭──・MANAGEMENT・──╮",
  VOICE: "╭──・VOICE CHANNELS・──╮"
};

const CHANNELS = {
  announcements: "📢┃announcements",
  serverInfo: "📌┃server-information",
  serverRules: "📜┃server-rules",
  roleplayRules: "📚┃roleplay-rules",
  verification: "✅┃verification",
  reactionRoles: "🎭┃reaction-roles",
  serverEvents: "📅┃server-events",
  importantLinks: "🔗┃important-links",
  ssuVote: "🕒┃ssu-vote",
  sessionStart: "🚨┃session-start",
  serverCode: "🔢┃server-code",
  serverStatus: "📍┃server-status",
  shutdownNotices: "🛑┃shutdown-notices",
  sessionLogs: "📊┃session-logs",
  sessionAttendance: "🎯┃session-attendance",
  generalChat: "💬┃general-chat",
  media: "📸┃media",
  clips: "🎥┃clips",
  suggestions: "💡┃suggestions",
  giveaways: "🎉┃giveaways",
  botCommands: "🤖┃bot-commands",
  memes: "😂┃memes",
  introductions: "👋┃introductions",
  roleplayNews: "📰┃roleplay-news",
  civilianInfo: "📋┃civilian-info",
  vehicleRegistration: "🚗┃vehicle-registration",
  businessRegistration: "🏠┃business-registration",
  characterProfiles: "🪪┃character-profiles",
  calls911: "📞┃911-calls",
  courtCases: "⚖️┃court-cases",
  boloAlerts: "🚧┃bolo-alerts",
  lawEnforcement: "🚓┃law-enforcement",
  fireRescue: "🚒┃fire-rescue",
  emergencyMedical: "🚑┃emergency-medical",
  civilianOperations: "🏛️┃civilian-operations",
  dotOperations: "🛻┃dot-operations",
  departmentApplications: "📁┃department-applications",
  departmentAnnouncements: "📌┃department-announcements",
  openTicket: "🎫┃open-ticket",
  generalSupport: "📨┃general-support",
  partnerships: "🤝┃partnerships",
  banAppeals: "📝┃ban-appeals",
  staffApplications: "📋┃staff-applications",
  playerReports: "⚠️┃player-reports",
  ticketTranscripts: "📁┃ticket-transcripts",
  staffChat: "🛡️┃staff-chat",
  staffAnnouncements: "📢┃staff-announcements",
  staffInformation: "📋┃staff-information",
  staffPoints: "📊┃staff-points",
  staffActivity: "🕒┃staff-activity",
  staffLogs: "📁┃staff-logs",
  moderationLogs: "⚠️┃moderation-logs",
  ticketLogs: "🎫┃ticket-logs",
  iaChat: "⚖️┃ia-chat",
  iaCases: "📂┃ia-cases",
  staffReports: "📝┃staff-reports",
  investigations: "🔍┃investigations",
  iaAnnouncements: "📌┃ia-announcements",
  iaLogs: "📁┃ia-logs",
  managementChat: "👑┃management-chat",
  managementAnnouncements: "📌┃management-announcements",
  serverStatistics: "📊┃server-statistics",
  managementLogs: "📁┃management-logs",
  staffRecords: "🧾┃staff-records",
  serverPlanning: "🗂️┃server-planning",
  privateDiscussion: "🔒┃private-discussion",
  generalVc: "🔊┃General VC",
  patrolVc: "🚓┃Patrol VC",
  fireEmsVc: "🚒┃Fire/EMS VC",
  staffVc: "🛡️┃Staff VC",
  managementVc: "👑┃Management VC",
  interviewRoom: "🎙️┃Interview Room",
  afk: "🔇┃AFK"
};

const ROLE_GROUPS = {
  OWNERSHIP: ["👑・Server Owner", "💎・Co Owner", "🛠️・Founder", "🌟・Community Director"],
  HIGH_COMMAND: ["💼・Executive Team", "🛡️・Management Team", "📌・Head Administrator", "⚖️・Internal Affairs Director", "🎖️・Staff Director"],
  STAFF: ["💼・Executive Team", "🛡️・Management Team", "📌・Head Administrator", "⚖️・Internal Affairs Director", "🎖️・Staff Director", "🔱・Senior Administrator", "🧭・Administrator", "🎖️・Senior Moderator", "🔨・Moderator", "🧰・Trial Moderator", "📋・Staff Assistant"],
  SENIOR_STAFF: ["💼・Executive Team", "🛡️・Management Team", "📌・Head Administrator", "⚖️・Internal Affairs Director", "🎖️・Staff Director", "🔱・Senior Administrator", "🧭・Administrator", "🎖️・Senior Moderator", "🔨・Moderator"],
  IA: ["⚖️・Internal Affairs Director", "⚖️・Internal Affairs", "🔍・Investigation Team"],
  MANAGEMENT: ["👑・Server Owner", "💎・Co Owner", "🛠️・Founder", "🌟・Community Director", "💼・Executive Team", "🛡️・Management Team"],
  SESSION_ACCESS: ["🎬・Session Host", "💼・Executive Team", "🛡️・Management Team", "📌・Head Administrator", "⚖️・Internal Affairs Director", "🎖️・Staff Director", "🔱・Senior Administrator", "🧭・Administrator", "🎖️・Senior Moderator", "🔨・Moderator", "🧰・Trial Moderator", "📋・Staff Assistant"],
  LEO: ["🚓・Police Chief", "🚔・Sheriff", "🚓・Law Enforcement"],
  FIRE_EMS: ["🚒・Fire Chief", "🚑・EMS Director", "🚒・Fire & Rescue", "🚑・Emergency Medical Services"],
  CIV: ["🏛️・Civilian Director", "🏛️・Civilian Operations"],
  DOT: ["🛻・DOT Supervisor", "🛻・Department of Transportation"],
  DEPT_COMMAND: ["🚓・Police Chief", "🚔・Sheriff", "🚒・Fire Chief", "🚑・EMS Director", "🏛️・Civilian Director", "🛻・DOT Supervisor"],
  PUBLIC_ACCESS: ["✅・Verified", "🎮・Member", "⭐・Active Member", "🌟・Known Member", "🏆・Veteran Member", "🎉・Server Booster"],
  PUNISHMENT: ["⛔・Suspended", "🚫・Blacklisted"],
  TICKET_SUPPORT: ["🎫・Ticket Support"],
  PARTNERSHIP: ["🤝・Partnership Team"]
};

const REQUIRED_ROLES = [...new Set(Object.values(ROLE_GROUPS).flat())];
const INFO_LOCKED = [CHANNELS.announcements, CHANNELS.serverInfo, CHANNELS.serverRules, CHANNELS.roleplayRules, CHANNELS.serverEvents, CHANNELS.importantLinks];
const VERIFICATION = [CHANNELS.verification, CHANNELS.reactionRoles];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRole(guild, name) {
  return guild.roles.cache.find((role) => role.name === name) || null;
}

function getCategory(guild, name) {
  return guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === name) || null;
}

function getChannel(guild, name) {
  return guild.channels.cache.find((channel) => channel.name === name && channel.type !== ChannelType.GuildCategory) || null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function roleNamesFromGroups(groups) {
  return unique(groups.flatMap((group) => ROLE_GROUPS[group] || []));
}

function roleOverwrites(guild, roles, allowArray = [], denyArray = [], missingRoles) {
  const result = [];
  for (const name of roles) {
    const role = getRole(guild, name);
    if (!role) {
      missingRoles.add(name);
      continue;
    }
    result.push({ id: role.id, allow: allowArray, deny: denyArray });
  }
  return result;
}

function botOverwrite(guild) {
  return {
    id: guild.members.me.id,
    allow: [P.ViewChannel, P.SendMessages, P.ManageChannels, P.ReadMessageHistory, P.UseApplicationCommands, P.ManageMessages, P.Connect, P.Speak],
    deny: []
  };
}

function publicBase(guild, missingRoles, options = {}) {
  const everyoneDeny = options.everyoneDeny ?? [P.ViewChannel];
  return [
    { id: guild.roles.everyone.id, allow: options.everyoneAllow || [], deny: everyoneDeny },
    ...roleOverwrites(guild, roleNamesFromGroups(["PUBLIC_ACCESS"]), options.publicAllow || [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.UseApplicationCommands, P.AddReactions, P.AttachFiles, P.EmbedLinks], options.publicDeny || [], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["PUNISHMENT"]), options.punishAllow || [], options.punishDeny || [P.SendMessages, P.AddReactions, P.UseApplicationCommands, P.Connect, P.Speak], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["STAFF"]), options.staffAllow || [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands], options.staffDeny || [], missingRoles),
    botOverwrite(guild)
  ];
}

function privateBase(guild, missingRoles, groups, extra = {}) {
  return [
    { id: guild.roles.everyone.id, allow: [], deny: [P.ViewChannel] },
    ...roleOverwrites(guild, roleNamesFromGroups(["PUBLIC_ACCESS"]), [], [P.ViewChannel], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(groups), extra.allow || [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands], [], missingRoles),
    botOverwrite(guild)
  ];
}

function infoLocked(guild, missingRoles) {
  return [
    { id: guild.roles.everyone.id, allow: [P.ViewChannel, P.ReadMessageHistory], deny: [P.SendMessages, P.AddReactions] },
    ...roleOverwrites(guild, roleNamesFromGroups(["PUBLIC_ACCESS"]), [P.ViewChannel, P.ReadMessageHistory], [P.SendMessages], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["PUNISHMENT"]), [P.ViewChannel, P.ReadMessageHistory], [P.SendMessages, P.AddReactions, P.UseApplicationCommands, P.Connect, P.Speak], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["STAFF"]), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands], [], missingRoles),
    botOverwrite(guild)
  ];
}

function verificationLocked(guild, missingRoles) {
  return [
    { id: guild.roles.everyone.id, allow: [P.ViewChannel, P.ReadMessageHistory, P.UseApplicationCommands], deny: [P.SendMessages, P.AddReactions] },
    ...roleOverwrites(guild, roleNamesFromGroups(["PUBLIC_ACCESS"]), [P.ViewChannel, P.ReadMessageHistory, P.UseApplicationCommands], [P.SendMessages], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["PUNISHMENT"]), [P.ViewChannel, P.ReadMessageHistory], [P.SendMessages, P.AddReactions, P.UseApplicationCommands, P.Connect, P.Speak], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["STAFF"]), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands], [], missingRoles),
    botOverwrite(guild)
  ];
}

function readOnlyPublic(guild, missingRoles, extraSendGroups = []) {
  return publicBase(guild, missingRoles, {
    publicAllow: [P.ViewChannel, P.ReadMessageHistory, P.UseApplicationCommands, P.AddReactions],
    publicDeny: [P.SendMessages],
    staffAllow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands]
  }).concat(roleOverwrites(guild, roleNamesFromGroups(extraSendGroups), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands], [], missingRoles));
}

function departmentPrivate(guild, missingRoles, groups) {
  return [
    { id: guild.roles.everyone.id, allow: [], deny: [P.ViewChannel] },
    ...roleOverwrites(guild, roleNamesFromGroups(["PUBLIC_ACCESS"]), [], [P.ViewChannel], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(groups), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.UseApplicationCommands], [], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["STAFF", "MANAGEMENT"]), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands], [], missingRoles),
    botOverwrite(guild)
  ];
}

function voiceBase(guild, missingRoles) {
  return [
    { id: guild.roles.everyone.id, allow: [], deny: [P.ViewChannel] },
    ...roleOverwrites(guild, roleNamesFromGroups(["PUBLIC_ACCESS"]), [P.ViewChannel, P.Connect, P.Speak], [], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["PUNISHMENT"]), [], [P.Connect, P.Speak], missingRoles),
    ...roleOverwrites(guild, roleNamesFromGroups(["STAFF"]), [P.ViewChannel, P.Connect, P.Speak, P.MuteMembers, P.DeafenMembers, P.MoveMembers], [], missingRoles),
    botOverwrite(guild)
  ];
}

function buildOverwrites(guild, config, missingRoles) {
  return config(guild, missingRoles);
}

async function applyOverwrites(channelOrCategory, overwrites) {
  await channelOrCategory.permissionOverwrites.set(overwrites, "ERLC permission sync");
}

async function syncChildren(category) {
  const children = category.children?.cache;
  if (!children?.size) return;
  for (const channel of children.values()) {
    if (!channel.permissionsLocked) continue;
    await channel.lockPermissions().catch(() => null);
    await sleep(500);
  }
}

function listText(items) {
  const values = [...items].filter(Boolean);
  if (!values.length) return "None";
  return values.slice(0, 30).join("\n") + (values.length > 30 ? "\n+" + (values.length - 30) + " more" : "");
}

function summaryEmbed(summary) {
  return new EmbedBuilder()
    .setColor(summary.errors.length || summary.missingRoles.size || summary.missingCategories.size || summary.missingChannels.size ? COLORS.warn : COLORS.ok)
    .setTitle("ERLC Channel Permissions Synced")
    .setDescription("Only existing categories/channels were updated. No channels or roles were created/deleted/renamed.")
    .addFields(
      { name: "Categories Updated", value: listText(summary.categoriesUpdated), inline: true },
      { name: "Channels Updated", value: listText(summary.channelsUpdated), inline: true },
      { name: "Missing Roles", value: listText(summary.missingRoles), inline: false },
      { name: "Missing Categories", value: listText(summary.missingCategories), inline: false },
      { name: "Missing Channels", value: listText(summary.missingChannels), inline: false },
      { name: "Errors", value: listText(summary.errors), inline: false }
    )
    .setTimestamp();
}

function categoryConfigs() {
  return new Map([
    [CATEGORIES.INFORMATION, infoLocked],
    [CATEGORIES.SESSION, (guild, miss) => publicBase(guild, miss, { publicAllow: [P.ViewChannel, P.ReadMessageHistory], publicDeny: [P.SendMessages], staffAllow: [P.ViewChannel, P.SendMessages, P.ManageMessages, P.ReadMessageHistory] }).concat(roleOverwrites(guild, roleNamesFromGroups(["SESSION_ACCESS"]), [P.ViewChannel, P.SendMessages, P.ManageMessages, P.ReadMessageHistory], [], miss))],
    [CATEGORIES.COMMUNITY, publicBase],
    [CATEGORIES.ROLEPLAY, (guild, miss) => publicBase(guild, miss, { publicAllow: [P.ViewChannel, P.ReadMessageHistory], publicDeny: [], staffAllow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.UseApplicationCommands] })],
    [CATEGORIES.DEPARTMENTS, (guild, miss) => privateBase(guild, miss, ["STAFF", "MANAGEMENT"])],
    [CATEGORIES.SUPPORT, (guild, miss) => publicBase(guild, miss, { publicAllow: [P.ViewChannel, P.ReadMessageHistory, P.UseApplicationCommands], publicDeny: [], staffAllow: [P.ViewChannel, P.SendMessages, P.ManageMessages, P.ReadMessageHistory, P.UseApplicationCommands] })],
    [CATEGORIES.STAFF, (guild, miss) => privateBase(guild, miss, ["STAFF", "SENIOR_STAFF"], { allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.UseApplicationCommands] }).concat(roleOverwrites(guild, roleNamesFromGroups(["SENIOR_STAFF"]), [P.ManageMessages], [], miss))],
    [CATEGORIES.IA, (guild, miss) => privateBase(guild, miss, ["IA", "MANAGEMENT"])],
    [CATEGORIES.MANAGEMENT, (guild, miss) => privateBase(guild, miss, ["MANAGEMENT", "OWNERSHIP"])],
    [CATEGORIES.VOICE, voiceBase]
  ]);
}

function channelConfigs() {
  const map = new Map();
  for (const name of INFO_LOCKED) map.set(name, infoLocked);
  for (const name of VERIFICATION) map.set(name, verificationLocked);
  for (const name of [CHANNELS.ssuVote]) map.set(name, (g, m) => readOnlyPublic(g, m, ["SESSION_ACCESS"]));
  for (const name of [CHANNELS.sessionStart, CHANNELS.serverCode, CHANNELS.serverStatus, CHANNELS.shutdownNotices]) map.set(name, (g, m) => readOnlyPublic(g, m, ["SESSION_ACCESS"]));
  for (const name of [CHANNELS.sessionLogs, CHANNELS.sessionAttendance]) map.set(name, (g, m) => privateBase(g, m, ["STAFF", "SESSION_ACCESS"]));
  map.set(CHANNELS.giveaways, (g, m) => readOnlyPublic(g, m, ["STAFF"]));
  for (const name of [CHANNELS.roleplayNews, CHANNELS.civilianInfo, CHANNELS.boloAlerts]) map.set(name, (g, m) => readOnlyPublic(g, m, name === CHANNELS.civilianInfo ? ["STAFF"] : ["STAFF", "SESSION_ACCESS"]));
  for (const name of [CHANNELS.vehicleRegistration, CHANNELS.businessRegistration, CHANNELS.characterProfiles, CHANNELS.calls911, CHANNELS.courtCases, CHANNELS.generalChat, CHANNELS.media, CHANNELS.clips, CHANNELS.suggestions, CHANNELS.botCommands, CHANNELS.memes, CHANNELS.introductions]) map.set(name, publicBase);
  map.set(CHANNELS.lawEnforcement, (g, m) => departmentPrivate(g, m, ["LEO"]));
  map.set(CHANNELS.fireRescue, (g, m) => departmentPrivate(g, m, ["FIRE_EMS"]));
  map.set(CHANNELS.emergencyMedical, (g, m) => departmentPrivate(g, m, ["FIRE_EMS"]));
  map.set(CHANNELS.civilianOperations, (g, m) => departmentPrivate(g, m, ["CIV"]));
  map.set(CHANNELS.dotOperations, (g, m) => departmentPrivate(g, m, ["DOT"]));
  map.set(CHANNELS.departmentApplications, publicBase);
  map.set(CHANNELS.departmentAnnouncements, (g, m) => [
    { id: g.roles.everyone.id, allow: [], deny: [P.ViewChannel] },
    ...roleOverwrites(g, roleNamesFromGroups(["LEO", "FIRE_EMS", "CIV", "DOT", "STAFF", "MANAGEMENT"]), [P.ViewChannel, P.ReadMessageHistory], [P.SendMessages], m),
    ...roleOverwrites(g, roleNamesFromGroups(["DEPT_COMMAND", "STAFF", "MANAGEMENT"]), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages], [], m),
    botOverwrite(g)
  ]);
  map.set(CHANNELS.openTicket, (g, m) => publicBase(g, m, { publicAllow: [P.ViewChannel, P.ReadMessageHistory, P.UseApplicationCommands], publicDeny: [P.SendMessages], staffAllow: [P.ViewChannel, P.SendMessages, P.ManageMessages, P.ReadMessageHistory] }));
  map.set(CHANNELS.generalSupport, (g, m) => publicBase(g, m, { publicAllow: [P.ViewChannel, P.ReadMessageHistory], publicDeny: [P.SendMessages], staffAllow: [P.ViewChannel, P.SendMessages, P.ManageMessages, P.ReadMessageHistory] }));
  for (const name of [CHANNELS.partnerships, CHANNELS.banAppeals, CHANNELS.staffApplications, CHANNELS.playerReports]) map.set(name, publicBase);
  map.set(CHANNELS.partnerships, (g, m) => publicBase(g, m).concat(roleOverwrites(g, roleNamesFromGroups(["PARTNERSHIP"]), [P.ManageMessages], [], m)));
  map.set(CHANNELS.ticketTranscripts, (g, m) => privateBase(g, m, ["STAFF"]));
  for (const name of [CHANNELS.staffChat, CHANNELS.staffInformation, CHANNELS.staffPoints, CHANNELS.staffActivity]) map.set(name, (g, m) => privateBase(g, m, ["STAFF", "SENIOR_STAFF"]));
  map.set(CHANNELS.staffAnnouncements, (g, m) => privateBase(g, m, ["STAFF"], { allow: [P.ViewChannel, P.ReadMessageHistory] }).concat(roleOverwrites(g, roleNamesFromGroups(["SENIOR_STAFF", "MANAGEMENT"]), [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages], [], m)));
  for (const name of [CHANNELS.staffLogs, CHANNELS.moderationLogs]) map.set(name, (g, m) => privateBase(g, m, ["SENIOR_STAFF", "MANAGEMENT"]));
  map.set(CHANNELS.ticketLogs, (g, m) => privateBase(g, m, ["STAFF", "TICKET_SUPPORT"]));
  for (const name of [CHANNELS.iaChat, CHANNELS.iaCases, CHANNELS.staffReports, CHANNELS.investigations, CHANNELS.iaAnnouncements, CHANNELS.iaLogs]) map.set(name, (g, m) => privateBase(g, m, ["IA", "MANAGEMENT"]));
  for (const name of [CHANNELS.managementChat, CHANNELS.managementAnnouncements, CHANNELS.serverStatistics, CHANNELS.managementLogs, CHANNELS.staffRecords, CHANNELS.serverPlanning, CHANNELS.privateDiscussion]) map.set(name, (g, m) => privateBase(g, m, ["MANAGEMENT", "OWNERSHIP"]));
  map.set(CHANNELS.generalVc, voiceBase);
  map.set(CHANNELS.patrolVc, (g, m) => privateBase(g, m, ["LEO", "SESSION_ACCESS", "STAFF", "MANAGEMENT"], { allow: [P.ViewChannel, P.Connect, P.Speak] }));
  map.set(CHANNELS.fireEmsVc, (g, m) => privateBase(g, m, ["FIRE_EMS", "SESSION_ACCESS", "STAFF", "MANAGEMENT"], { allow: [P.ViewChannel, P.Connect, P.Speak] }));
  map.set(CHANNELS.staffVc, (g, m) => privateBase(g, m, ["STAFF", "MANAGEMENT"], { allow: [P.ViewChannel, P.Connect, P.Speak] }));
  map.set(CHANNELS.managementVc, (g, m) => privateBase(g, m, ["MANAGEMENT", "OWNERSHIP"], { allow: [P.ViewChannel, P.Connect, P.Speak] }));
  map.set(CHANNELS.interviewRoom, (g, m) => [
    { id: g.roles.everyone.id, allow: [], deny: [P.ViewChannel] },
    ...roleOverwrites(g, roleNamesFromGroups(["PUBLIC_ACCESS"]), [P.ViewChannel], [P.Connect], m),
    ...roleOverwrites(g, roleNamesFromGroups(["STAFF", "MANAGEMENT"]), [P.ViewChannel, P.Connect, P.Speak, P.MoveMembers], [], m),
    botOverwrite(g)
  ]);
  map.set(CHANNELS.afk, (g, m) => publicBase(g, m, { publicAllow: [P.ViewChannel, P.Connect], publicDeny: [P.Speak], staffAllow: [P.ViewChannel, P.Connect, P.MoveMembers] }));
  return map;
}

async function runFix(interaction) {
  await interaction.deferReply({ flags: 64 });
  const summary = {
    categoriesUpdated: new Set(),
    channelsUpdated: new Set(),
    missingRoles: new Set(),
    missingCategories: new Set(),
    missingChannels: new Set(),
    errors: new Set()
  };

  if (!interaction.member?.permissions?.has(P.Administrator)) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.error).setTitle("Administrator Required").setDescription("You need Administrator permission to run this command.")] });
    return;
  }

  const guild = interaction.guild;
  const botMember = guild.members.me || await guild.members.fetchMe();
  if (!botMember.permissions.has(P.ManageChannels)) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.error).setTitle("Missing Bot Permission").setDescription("I need **Manage Channels** before I can apply permission overwrites.")] });
    return;
  }

  await guild.roles.fetch().catch(() => null);
  await guild.channels.fetch().catch(() => null);

  for (const roleName of REQUIRED_ROLES) {
    if (!getRole(guild, roleName)) summary.missingRoles.add(roleName);
  }
  for (const categoryName of Object.values(CATEGORIES)) {
    if (!getCategory(guild, categoryName)) summary.missingCategories.add(categoryName);
  }
  for (const channelName of Object.values(CHANNELS)) {
    if (!getChannel(guild, channelName)) summary.missingChannels.add(channelName);
  }

  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.working).setTitle("ERLC Permission Sync").setDescription("Applying category permission overwrites first...")] });

  for (const [categoryName, config] of categoryConfigs()) {
    const category = getCategory(guild, categoryName);
    if (!category) continue;
    try {
      await applyOverwrites(category, buildOverwrites(guild, config, summary.missingRoles));
      summary.categoriesUpdated.add(categoryName);
      await syncChildren(category);
      await sleep(500);
    } catch (error) {
      summary.errors.add(categoryName + " — " + error.message);
    }
  }

  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.working).setTitle("ERLC Permission Sync").setDescription("Applying channel-specific overwrites...")] });

  for (const [channelName, config] of channelConfigs()) {
    const channel = getChannel(guild, channelName);
    if (!channel) continue;
    try {
      await applyOverwrites(channel, buildOverwrites(guild, config, summary.missingRoles));
      summary.channelsUpdated.add(channelName);
      await sleep(500);
    } catch (error) {
      summary.errors.add(channelName + " — " + error.message);
    }
  }

  await interaction.editReply({ embeds: [summaryEmbed(summary)] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fix-erlc-channel-permissions")
    .setDescription("Fix only existing ERLC category/channel permission overwrites.")
    .setDefaultMemberPermissions(P.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await runFix(interaction);
  }
};
