const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  PermissionsBitField,
  MessageFlags
} = require("discord.js");

const setupChannels = require("../../systems/server-layout");
const setupRoles = require("../../systems/role-layout");

const BRAND_COLOR = 0x0b1f4d;
const OK_COLOR = 0x22c55e;
const WARN_COLOR = 0xf59e0b;
const ERROR_COLOR = 0xef4444;

const SETUP_CATEGORY_NAMES = [
  "📌 INFORMATION",
  "🎫 SUPPORT",
  "🚔 SESSIONS",
  "💬 COMMUNITY",
  "🏛️ DEPARTMENTS",
  "🛡️ INTERNAL AFFAIRS",
  "🛡️ STAFF",
  "🔊 VOICE",
  "📌・INFORMATION",
  "🎫・SUPPORT",
  "🚓・SESSIONS",
  "💬・COMMUNITY",
  "🏛️・DEPARTMENTS",
  "🛡️・INTERNAL AFFAIRS",
  "🛡️・STAFF",
  "🔊・VOICE",
  "INFORMATION",
  "SUPPORT",
  "SESSIONS",
  "COMMUNITY",
  "DEPARTMENTS",
  "INTERNAL AFFAIRS",
  "STAFF",
  "VOICE",
  "📊 Server Status",
  "💎Boost Only",
  "🗒️ Information",
  "➿ Voice Channel's",
  "🧾 Important",
  "👾・SSU/SSD Information",
  "📝 Application's",
  "🗒️ Partnership Information",
  "💬 Community",
  "💡Suggestions",
  "➿ In - Game VC's",
  "👾 In-Game",
  "⚕️ Server Staff",
  "Application Review's",
  "⚕️・IA+ Server Staff",
  "📤・General Support",
  "📤・Internal Support",
  "📤・Management Support",
  "📤・Partnership Support",
  "LCRP Staff Application ticket",
  "Staff VC's",
  "Tickets",
  "Priority Tickets",
  "━━ 🌲 WELCOME",
  "Server Status",
  "Boost Only",
  "Information",
  "Voice Channel's",
  "Important",
  "SSU/SSD Information",
  "Application's",
  "Partnership Information",
  "Community",
  "Suggestions",
  "In - Game VC's",
  "In-Game",
  "Server Staff",
  "IA+ Server Staff"
];

const SETUP_CHANNEL_NAMES = [
  "📢・announcements",
  "📜・server-rules",
  "✅・verify",
  "📊・server-status",
  "📌・important-info",
  "🎫・create-ticket",
  "🎫・open-ticket",
  "📖・support-info",
  "📁・ticket-logs",
  "📋・session-vote",
  "🚨・session-start",
  "📘・session-logs",
  "📣・emergency-pings",
  "🚨・emergency-pings",
  "💬・general",
  "📸・media",
  "🤖・bot-commands",
  "🎉・giveaways",
  "📊・polls",
  "💡・suggestions",
  "🚓・pd-chat",
  "🚔・mpd-chat",
  "🚒・fire-ems-chat",
  "🚒・fems-chat",
  "☎️・dispatch-chat",
  "📞・dispatch-chat",
  "🏛️・government-chat",
  "📁・department-command",
  "📋・department-logs",
  "🛡️・ia-chat",
  "🔎・ia-investigations",
  "📁・ia-logs",
  "📋・ia-reports",
  "📌・staff-announcements",
  "💬・staff-chat",
  "📋・mod-logs",
  "🧾・mod-logs",
  "📝・applications-review",
  "📋・applications-review",
  "⚒️・staff-commands",
  "📂・staff-resources",
  "🔊・General VC",
  "🎮・Session VC",
  "🚓・Session VC",
  "🛡️・Staff VC",
  "📁・Command VC",
  "🎙️・AFK",
  "transcripts",
  "moderator-only",
  "📊┃server-info",
  "🔗┃chain-of-command",
  "📙┃server-rules",
  "📍┃reaction-roles",
  "🛍️┃server-shop",
  "💎┃server-boost",
  "🎂┃birthdays",
  "📢┃announcements",
  "📝┃server-updates",
  "📢┃community",
  "🎊┃giveaways",
  "📺┃socials",
  "📤┃support",
  "🔀┃invite-tracker",
  "👮🏽┃sheriff-cmps",
  "📸┃lcrpc-memories",
  "ingame-news",
  "ℹ️┃ssu-info",
  "📘┃game-rules",
  "🎮┃sessions",
  "📸┃lcrpc-media",
  "📏┃application-rules",
  "⚕️┃staff-application",
  "📊┃application-results",
  "🏬┃departments",
  "📗┃partnership-requirements",
  "🛹┃our-ad",
  "🤞🏽┃partnerships",
  "🛹┃server-relations",
  "💬┃chat",
  "📷┃media",
  "✝️┃daily-verse",
  "🤖┃cmds",
  "💯┃counting",
  "💫┃lvl-ups",
  "❔┃bot-help",
  "☄️┃suggestions",
  "🗣️┃ssu-chat",
  "📎┃ssu-clips",
  "💴┃economy",
  "💵┃game-stores",
  "💶┃game-shop",
  "🧾┃scene-rules",
  "📚┃scene-requests",
  "🗞️┃scene-lists",
  "🌍┃aop-map",
  "📚┃civ-info",
  "📑┃foid-cards",
  "🗞️┃staff-shouts",
  "📝┃staff-rules",
  "📃┃staff-tasks",
  "🤖┃staff-commands",
  "⛓️‍💥┃staff-guide",
  "🪄┃staff-chat",
  "🎥┃staff-images",
  "・・・・・・・・・・",
  "📈┃staff-promotions",
  "📉┃staff-punishments",
  "🪵┃mod-logs",
  "🪵┃transcripts",
  "⏳┃waiting-for-reply",
  "🪵┃in-game-logs",
  "🪵┃kick-logs",
  "🪵┃ban-logs",
  "🪵┃warning-logs",
  "🪵┃bot-help-logs",
  "📸┃lcrpc-staff-memories",
  "application-reviews",
  "application-results",
  "🗞️┃shouts",
  "🪄┃chat",
  "🧪┃testing-channel",
  "📦┃commands",
  "🪵┃ssuvote-logs",
  "🪵┃loa-logs",
  "do-not-close",
  "ticket-8",
  "💎Booster VC",
  "🎙️┃Voice Channel 1",
  "🎙️┃Voice Channel 2",
  "🎙️┃Staff Voice",
  "🎙️┃Movie Night",
  "🎙️┃Community Event's",
  "⏳┃Staff Waiting Room",
  "🎙️┃Staff Scene 1",
  "🎙️┃Staff Scene 2",
  "🎙️┃Staff Scene 3",
  "🎙️┃Staff Scene 4",
  "🎙️┃GLOBAL RTO",
  "🎙️┃Tac One",
  "🎙️┃Tac Two",
  "📞┃PD 911",
  "🎙️┃PD Scene 1",
  "🎙️┃PD Scene 2",
  "🎙️┃PD Scene 3",
  "🎙️┃PD Scene 4",
  "🎙️┃PD Scene 5",
  "📞┃LCOM Fire 911",
  "🎙️┃LCOM Scene 1",
  "🎙️┃LCOM Scene 2",
  "🎙️┃LCOM Scene 3",
  "🎙️┃LCOM Scene 4",
  "🎙️┃Civilian VC",
  "🎙️┃Civ Scene 1",
  "🎙️┃Civ Scene 2",
  "🎙️┃Civ Scene 3",
  "Waiting Room",
  "Liberties Office",
  "Ted's Office",
  "o's Office - Working on app join in!",
  "Gouby's Office",
  "Prestons Office"
];

const SETUP_ROLE_NAMES = [
  "Verified",
  "Trial Staff",
  "Moderator",
  "Senior Moderator",
  "Administrator",
  "Management",
  "Internal Affairs",
  "Department Command",
  "Police Department",
  "Fire/EMS Department",
  "Government",
  "Dispatch",
  "Muted",
  "Session Ping",
  "Giveaway Ping",
  "Announcement Ping",
  "Event Ping",
  "Poll Ping",
  "Media Ping",
  "Active Chat Ping",
  "EST",
  "CST",
  "MST",
  "PST",
  "GMT",
  "CET",
  "AEST",
  "🎓 Staff Trainee",
  "🧪 Trial Moderator",
  "🛡️ Moderator",
  "🛠️ Head Moderator",
  "🧰 Administrator",
  "🔨 Head Administrator",
  "🛡️ Head Administrator",
  "🕴️ Management",
  "🧠 Server Director",
  "🏛️ Community Director",
  "⚡ Co Owner",
  "💎 Owner",
  "👑 Founder",
  "🛡️ Internal Affairs",
  "🔎 IA Investigator",
  "📁 IA Supervisor",
  "🛡️ Internal Affairs Director",
  "🚔 Metropolitan Police Department",
  "🚓 LEO Certified",
  "🚔 MPD Supervisor",
  "🚔 MPD Assistant Chief",
  "🚔 MPD Chief",
  "🚒 Fire & EMS",
  "🚒 FEMS Certified",
  "🚒 FEMS Supervisor",
  "🚒 FEMS Assistant Chief",
  "🚒 FEMS Chief",
  "📞 Dispatch",
  "📞 Dispatch Certified",
  "📞 Dispatch Director",
  "🏛️ Government",
  "🏛️ Government Certified",
  "🏛️ Government Official",
  "⚖️ Judge",
  "🎭 Roleplay Member",
  "🦺 Whitelisted Member",
  "💬 Member",
  "🌟 Active Member",
  "🔒 Muted",
  "🚦 Session Ping",
  "🎁 Giveaway Ping",
  "📢 Announcement Ping",
  "📊 Poll Ping",
  "📋 Application Ping",
  "📌 Update Ping",
  "Operations Director",
  "Staff Director",
  "Roleplay Director",
  "Department Director",
  "Chief of Staff",
  "Server Manager",
  "Civilian",
  "Registered Driver",
  "Business Owner",
  "Media",
  "Server Booster",
  "OG Member",
  "New Member",
  "Emergency Ping",
  "Bots",
  "🎭 Operations Director",
  "📋 Staff Director",
  "🚨 Roleplay Director",
  "🏛️ Department Director",
  "⭐ Chief of Staff",
  "🛡️ Server Manager",
  "💻 Civilian",
  "🚗 Registered Driver",
  "🏢 Business Owner",
  "📰 Media",
  "🚀 Server Booster",
  "👑 OG Member",
  "👋 New Member",
  "🚨 Emergency Ping",
  "🤖 Bots",
  "Deputy Director",
  "Chief Operations Officer",
  "Head Executive Director",
  "Senior Executive Director",
  "Office Superintendent",
  "Office Director",
  "・Office of the Director",
  "▬ Directory ▬",
  "・ Direct Management",
  "・Head Management",
  "・Senior Management",
  "・Management",
  "・Junior Management",
  "・Trainee Management",
  "▬ Management▬",
  "・Internal Affairs Management",
  "・Internal Affairs Chief",
  "・Internal Affairs Senior Member",
  "・Internal Affairs Experienced Member",
  "・Internal Affairs Member",
  "▬ Internal Affairs▬",
  "・Supreme Administrator",
  "・Head Administrator",
  "・Senior Administrator",
  "・Administrator",
  "・Junior Administrator",
  "▬ Administration▬",
  "・Surreal Moderator",
  "・Supreme Moderator",
  "・Head Moderator",
  "・Senior Moderator",
  "・Moderator",
  "・Junior Moderator",
  "・Trial Moderator",
  "▬ ▬ Moderation▬ ▬",
  "LCRP - Staff Team",
  "・Former Staff",
  "▬ Random Role's ▬",
  "・Bible Perms",
  "・100th Member",
  "・LCRPC Administrative Partner",
  "・LCRP Partner",
  "・LCRPC OG",
  "・Bot's",
  "・Whitelisted Member",
  "・V.I.P",
  "・Member",
  "▬ Civ Role's ▬",
  "Unverified",
  "▬ Verify Roles ▬",
  "LCRP - Announcement Notification",
  "LCRP - Session Ping",
  "LCRP - Giveaway Notification",
  "LCRP - Active Chat Notification",
  "▬ Role Ping's ▬",
  "🇺🇸 EST",
  "🇺🇸 CST",
  "🇺🇸 MST",
  "🇺🇸 PST",
  "🇬🇧 GMT",
  "🇪🇺 CET",
  "▬ TimeZone's ▬",
  "SSU Poll Perms",
  "SSU Perms",
  "SSD Perms",
  "▬ SSU Role's ▬",
  "LockDown Perms",
  "▬ Bot's ▬",
  "24 hour SSU Command Permission",
  "Support Team",
  "Zero Tolerance Policy",
  "TestRole",
  "Reduced Activity",
  "Liberties Office Keys",
  "Preston's Office Keys",
  "Ted's Office Keys",
  "Silkies Office Keys",
  "Gouby's Office Keys",
  "new role",
  "Minecraft Server Member",
  "Roblox Verified",
  "Tickets Support",
  "Tickets Admin",
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Oceania",
  "Africa",
  "No Quota (here to help out)",
  "iPhone",
  "Android",
  "Samsung",
  "PS4",
  "XBOX",
  "PC",
  "Laptop",
  "LCRPC Police Helper",
  "⭐・LVL 5",
  "⭐・LVL 10",
  "⭐・LVL 15",
  "⭐・LVL 20",
  "⭐・LVL 30",
  "⭐・LVL 40",
  "⭐・LVL 50",
  "⭐・LVL 50+"
];

function hasSetupPermission(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  return interaction.member?.roles?.cache?.some((role) => role.name === "Management" || role.name === "🕴️ Management");
}

function embed(color, title, description) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setFooter({ text: "Veltrix • Setup Safety" }).setTimestamp();
}

function format(items) {
  if (!items?.length) return "None";
  return items.slice(0, 15).map((item) => "• " + item).join("\n") + (items.length > 15 ? "\n+" + (items.length - 15) + " more" : "");
}

function setupChannelTypes() {
  return new Set([ChannelType.GuildCategory, ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice]);
}

async function deleteSetupChannels(guild) {
  const deletedCategories = [];
  const deletedChannels = [];
  const skipped = [];
  await guild.channels.fetch().catch(() => null);
  const categoryNames = new Set(SETUP_CATEGORY_NAMES);
  const channelNames = new Set(SETUP_CHANNEL_NAMES);
  const types = setupChannelTypes();
  const categories = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildCategory && categoryNames.has(channel.name)).sort((a, b) => b.position - a.position);

  for (const category of categories.values()) {
    const children = guild.channels.cache.filter((channel) => channel.parentId === category.id).sort((a, b) => b.position - a.position);
    for (const child of children.values()) {
      try {
        await child.delete("Veltrix setup delete-channels/reset-server");
        deletedChannels.push(child.name + " / " + child.id);
        console.log("Deleted channel: " + child.name + "/" + child.id);
      } catch (error) {
        skipped.push(child.name + " / " + child.id + " / " + error.message);
      }
    }
    try {
      await category.delete("Veltrix setup delete-channels/reset-server");
      deletedCategories.push(category.name + " / " + category.id);
      console.log("Deleted category: " + category.name + "/" + category.id);
    } catch (error) {
      skipped.push(category.name + " / " + category.id + " / " + error.message);
    }
  }

  await guild.channels.fetch().catch(() => null);
  const looseChannels = guild.channels.cache.filter((channel) => types.has(channel.type) && channel.type !== ChannelType.GuildCategory && !channel.parentId && channelNames.has(channel.name));
  for (const channel of looseChannels.values()) {
    try {
      await channel.delete("Veltrix setup loose channel cleanup");
      deletedChannels.push(channel.name + " / " + channel.id);
      console.log("Deleted channel: " + channel.name + "/" + channel.id);
    } catch (error) {
      skipped.push(channel.name + " / " + channel.id + " / " + error.message);
    }
  }
  return { deletedCategories, deletedChannels, skipped };
}

async function deleteSetupRoles(guild) {
  const deletedRoles = [];
  const skippedRoles = [];
  await guild.roles.fetch().catch(() => null);
  const botMember = guild.members.me || await guild.members.fetchMe();
  for (const roleName of SETUP_ROLE_NAMES) {
    const role = guild.roles.cache.find((item) => item.name === roleName);
    if (!role) continue;
    if (role.id === guild.roles.everyone.id) {
      skippedRoles.push(role.name + " / " + role.id + " / @everyone");
      continue;
    }
    if (role.managed) {
      skippedRoles.push(role.name + " / " + role.id + " / managed role");
      console.log("Skipped role: " + role.name + "/" + role.id + "/managed role");
      continue;
    }
    if (role.id === botMember.roles.botRole?.id) {
      skippedRoles.push(role.name + " / " + role.id + " / bot role");
      console.log("Skipped role: " + role.name + "/" + role.id + "/bot role");
      continue;
    }
    if (!role.editable || role.position >= botMember.roles.highest.position) {
      skippedRoles.push(role.name + " / " + role.id + " / above or equal to bot role");
      console.log("Skipped role: " + role.name + "/" + role.id + "/above or equal to bot role");
      continue;
    }
    try {
      await role.delete("Veltrix setup delete-roles/reset-server");
      deletedRoles.push(role.name + " / " + role.id);
      console.log("Deleted role: " + role.name + "/" + role.id);
    } catch (error) {
      skippedRoles.push(role.name + " / " + role.id + " / " + error.message);
      console.log("Skipped role: " + role.name + "/" + role.id + "/" + error.message);
    }
  }
  return { deletedRoles, skippedRoles };
}

async function createServerLayout(guild) {
  const messages = [];
  const fakeInteraction = {
    guild,
    memberPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]),
    async deferReply() {
      messages.push("Deferred setup.");
    },
    async editReply(payload) {
      const data = payload?.embeds?.[0]?.data;
      if (data?.title) messages.push(data.title);
    }
  };
  await setupChannels.execute(fakeInteraction);
  return { messages };
}

async function applyChannelPermissions(guild) {
  return createServerLayout(guild);
}

async function auditPermissions(guild) {
  await guild.channels.fetch().catch(() => null);
  const risky = ["📁・ticket-logs", "📘・session-logs", "🤖・bot-commands", "📋・department-logs", "📁・department-command", "🛡️・ia-chat", "🔎・ia-investigations", "📁・ia-logs", "📋・ia-reports", "📌・staff-announcements", "💬・staff-chat", "📋・mod-logs", "📝・applications-review", "⚒️・staff-commands", "📂・staff-resources"];
  const failures = [];
  for (const name of risky) {
    const channel = guild.channels.cache.find((item) => item.name === name);
    if (!channel) continue;
    const perms = channel.permissionsFor(guild.roles.everyone);
    if (perms?.has(PermissionFlagsBits.ViewChannel) || perms?.has(PermissionFlagsBits.SendMessages)) failures.push(name + " still grants @everyone view/send.");
  }
  return { failures };
}

async function confirm(interaction, title, description, confirmLabel) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("setup_confirm").setLabel(confirmLabel).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("setup_cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
  );
  await interaction.editReply({ embeds: [embed(WARN_COLOR, title, description)], components: [row] });
  const reply = await interaction.fetchReply();
  let button;
  try {
    button = await reply.awaitMessageComponent({ componentType: ComponentType.Button, time: 30_000 });
  } catch {
    await interaction.editReply({ embeds: [embed(ERROR_COLOR, "Timed Out", "No changes were made.")], components: [] });
    return false;
  }
  if (button.user.id !== interaction.user.id) {
    await button.reply({ content: "Only the command user can confirm this action.", flags: 64 });
    return false;
  }
  if (button.customId === "setup_cancel") {
    await button.update({ embeds: [embed(OK_COLOR, "Cancelled", "No changes were made.")], components: [] });
    return false;
  }
  await button.update({ embeds: [embed(BRAND_COLOR, "Confirmed", "Working now. This may take a moment...")], components: [] });
  return true;
}

async function safeFinalReply(interaction, payload) {
  try {
    await interaction.editReply(payload);
    return;
  } catch (error) {
    console.error("Setup final reply fallback:", error.message);
  }

  const target = interaction.channel && interaction.channel.isTextBased?.()
    ? interaction.channel
    : interaction.guild.systemChannel;
  if (target?.isTextBased?.()) {
    await target.send({ ...payload, components: [] }).catch(() => null);
    return;
  }
  await interaction.user?.send({ ...payload, components: [] }).catch(() => null);
}

async function runSetupChannels(interaction) {
  await interaction.editReply({ embeds: [embed(BRAND_COLOR, "Setting Up Channels", "Creating/updating the Veltrix channel layout and permissions...")] });
  const setup = await createServerLayout(interaction.guild);
  const audit = await auditPermissions(interaction.guild);
  await interaction.editReply({ embeds: [embed(audit.failures.length ? WARN_COLOR : OK_COLOR, "Setup Channels Complete", "Channel layout and permissions were synced.").addFields({ name: "Setup", value: format(setup.messages), inline: false }, { name: "Permission Audit", value: audit.failures.length ? format(audit.failures) : "Passed", inline: false })], components: [] });
}

async function runSetupRoles(interaction) {
  const messages = [];
  const fakeInteraction = {
    guild: interaction.guild,
    memberPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]),
    async deferReply() { messages.push("Deferred role setup."); },
    async editReply(payload) {
      const data = payload?.embeds?.[0]?.data;
      if (data?.title) messages.push(data.title);
      if (data?.fields) for (const field of data.fields) messages.push(field.name + ": " + String(field.value || "").replace(/\n/g, " | ").slice(0, 300));
    }
  };
  await setupRoles.execute(fakeInteraction);
  await interaction.editReply({ embeds: [embed(OK_COLOR, "Setup Roles Complete", "Role setup was synced safely.").addFields({ name: "Summary", value: format(messages), inline: false })], components: [] });
}

async function runSetupPermissions(interaction) {
  await runSetupChannels(interaction);
}

async function runSetupAudit(interaction) {
  const audit = await auditPermissions(interaction.guild);
  await interaction.editReply({ embeds: [embed(audit.failures.length ? WARN_COLOR : OK_COLOR, "Permission Audit", audit.failures.length ? "Some risky permissions still need attention." : "Audit passed. Risky channels are locked from @everyone.").addFields({ name: "Findings", value: audit.failures.length ? format(audit.failures) : "Passed", inline: false })], components: [] });
}

async function runDeleteChannels(interaction) {
  if (!(await confirm(interaction, "Confirm Channel Cleanup", "This will delete only Veltrix setup-created categories/channels and their children. Unrelated channels will not be touched.", "Delete Setup Channels"))) return;
  const result = await deleteSetupChannels(interaction.guild);
  await safeFinalReply(interaction, { embeds: [embed(OK_COLOR, "Setup Channels Deleted", "Channel cleanup completed.").addFields({ name: "Deleted Categories", value: format(result.deletedCategories), inline: false }, { name: "Deleted Channels", value: format(result.deletedChannels), inline: false }, { name: "Skipped", value: format(result.skipped), inline: false })], components: [] });
}

async function runDeleteRoles(interaction) {
  if (!(await confirm(interaction, "Confirm Role Cleanup", "This will delete only exact Veltrix/LCRP setup role names that are safe for the bot to delete.", "Delete Setup Roles"))) return;
  const result = await deleteSetupRoles(interaction.guild);
  await safeFinalReply(interaction, { embeds: [embed(OK_COLOR, "Setup Roles Deleted", "Role cleanup completed.").addFields({ name: "Deleted Roles", value: format(result.deletedRoles), inline: false }, { name: "Skipped Roles", value: format(result.skippedRoles), inline: false })], components: [] });
}

async function runResetServer(interaction) {
  if (!(await confirm(interaction, "Confirm Server Reset", "This deletes only setup-created channels/categories and setup-created role names, then rebuilds the improved safe server layout.", "Confirm Reset"))) return;
  const channels = await deleteSetupChannels(interaction.guild);
  const roles = await deleteSetupRoles(interaction.guild);
  const setup = await createServerLayout(interaction.guild);
  const audit = await auditPermissions(interaction.guild);
  await safeFinalReply(interaction, { embeds: [embed(audit.failures.length ? WARN_COLOR : OK_COLOR, "Server Reset Complete", "Veltrix setup reset finished. Unrelated channels and roles were not touched.").addFields({ name: "Deleted Categories", value: format(channels.deletedCategories), inline: true }, { name: "Deleted Channels", value: format(channels.deletedChannels), inline: true }, { name: "Deleted Roles", value: format(roles.deletedRoles), inline: true }, { name: "Skipped Channels", value: format(channels.skipped), inline: false }, { name: "Skipped Roles", value: format(roles.skippedRoles), inline: false }, { name: "Setup", value: format(setup.messages), inline: false }, { name: "Permission Audit", value: audit.failures.length ? format(audit.failures) : "Passed", inline: false })], components: [] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Manage the Veltrix setup system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName("channels").setDescription("Create or update the safe Veltrix channel layout."))
    .addSubcommand((subcommand) => subcommand.setName("roles").setDescription("Create or update Veltrix setup roles."))
    .addSubcommand((subcommand) => subcommand.setName("permissions").setDescription("Reapply safe Veltrix channel permissions."))
    .addSubcommand((subcommand) => subcommand.setName("audit").setDescription("Audit risky setup channel permissions."))
    .addSubcommand((subcommand) => subcommand.setName("delete-channels").setDescription("Delete all Veltrix setup-created channels/categories."))
    .addSubcommand((subcommand) => subcommand.setName("delete-roles").setDescription("Delete all safe Veltrix setup-created roles."))
    .addSubcommand((subcommand) => subcommand.setName("reset-server").setDescription("Delete setup items and rebuild the safe layout.")),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }).catch(() => null);
    if (!hasSetupPermission(interaction)) {
      await interaction.editReply({ embeds: [embed(ERROR_COLOR, "Missing Permission", "Only Administrator or Management can use setup cleanup/reset commands.")] });
      return;
    }
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "channels") return runSetupChannels(interaction);
    if (subcommand === "roles") return runSetupRoles(interaction);
    if (subcommand === "permissions") return runSetupPermissions(interaction);
    if (subcommand === "audit") return runSetupAudit(interaction);
    if (subcommand === "delete-channels") return runDeleteChannels(interaction);
    if (subcommand === "delete-roles") return runDeleteRoles(interaction);
    if (subcommand === "reset-server") return runResetServer(interaction);
  },

  deleteSetupChannels,
  deleteSetupRoles,
  createServerLayout,
  applyChannelPermissions,
  auditPermissions
};
