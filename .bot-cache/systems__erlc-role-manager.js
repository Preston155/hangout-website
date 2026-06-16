const {
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField
} = require("discord.js");

const COLORS = { setup: 0x2563eb, ok: 0x22c55e, warn: 0xf59e0b, error: 0xef4444 };
const P = PermissionFlagsBits;
const highCommand = [P.ViewAuditLog, P.ManageGuild, P.ManageChannels, P.ManageRoles, P.ManageMessages, P.KickMembers, P.BanMembers, P.ModerateMembers, P.MentionEveryone, P.ManageNicknames];

const ROLE_GROUPS = [
  { category: "OWNERSHIP", roles: [
    ["👑・Server Owner", "#FF0000", [P.Administrator]],
    ["💎・Co Owner", "#B00000", [P.Administrator]],
    ["🛠️・Founder", "#FFD700", [P.Administrator]],
    ["🌟・Community Director", "#9B59B6", [P.Administrator]]
  ]},
  { category: "HIGH COMMAND", roles: [
    ["💼・Executive Team", "#1F51FF", highCommand],
    ["🛡️・Management Team", "#3498DB", highCommand],
    ["📌・Head Administrator", "#00FFFF", highCommand],
    ["⚖️・Internal Affairs Director", "#FFFFFF", highCommand],
    ["🎖️・Staff Director", "#FF8C00", highCommand]
  ]},
  { category: "STAFF TEAM", roles: [
    ["🔱・Senior Administrator", "#006400", [P.ViewAuditLog, P.ManageMessages, P.KickMembers, P.BanMembers, P.ModerateMembers, P.ManageNicknames]],
    ["🧭・Administrator", "#2ECC71", [P.ViewAuditLog, P.ManageMessages, P.KickMembers, P.BanMembers, P.ModerateMembers]],
    ["🎖️・Senior Moderator", "#F1C40F", [P.ViewAuditLog, P.ManageMessages, P.KickMembers, P.ModerateMembers]],
    ["🔨・Moderator", "#90EE90", [P.ManageMessages, P.KickMembers, P.ModerateMembers]],
    ["🧰・Trial Moderator", "#ADD8E6", [P.ManageMessages, P.ModerateMembers]],
    ["📋・Staff Assistant", "#95A5A6", [P.ManageMessages]]
  ]},
  { category: "INTERNAL AFFAIRS", roles: [
    ["⚖️・Internal Affairs", "#D5D8DC", [P.ViewAuditLog, P.ManageMessages, P.ModerateMembers]],
    ["🔍・Investigation Team", "#BDC3C7", [P.ManageMessages, P.ModerateMembers]]
  ]},
  { category: "SPECIAL TEAMS", roles: [
    ["📚・Training Team", "#E67E22", [P.ManageMessages]],
    ["🎫・Ticket Support", "#5865F2", [P.ManageMessages]],
    ["🤝・Partnership Team", "#E91E63", [P.ManageMessages]],
    ["🎬・Session Host", "#FF4757", [P.ManageMessages, P.MentionEveryone]]
  ]},
  { category: "DEPARTMENT COMMAND", roles: [
    ["🚓・Police Chief", "#0033A0", [P.ManageMessages]],
    ["🚔・Sheriff", "#654321", [P.ManageMessages]],
    ["🚒・Fire Chief", "#C0392B", [P.ManageMessages]],
    ["🚑・EMS Director", "#E74C3C", [P.ManageMessages]],
    ["🏛️・Civilian Director", "#2C3E50", [P.ManageMessages]],
    ["🛻・DOT Supervisor", "#F39C12", [P.ManageMessages]]
  ]},
  { category: "DEPARTMENTS", roles: [
    ["🚓・Law Enforcement", "#0055FF", []],
    ["🚒・Fire & Rescue", "#FF0000", []],
    ["🚑・Emergency Medical Services", "#FF6B6B", []],
    ["🏛️・Civilian Operations", "#34495E", []],
    ["🛻・Department of Transportation", "#F1C40F", []],
    ["📰・Media Team", "#9B59B6", []]
  ]},
  { category: "COMMUNITY", roles: [
    ["🎉・Server Booster", "#F47FFF", []],
    ["🏆・Veteran Member", "#FFD700", []],
    ["🌟・Known Member", "#F1C40F", []],
    ["⭐・Active Member", "#2ECC71", []],
    ["✅・Verified", "#57F287", []],
    ["🎮・Member", "#99AAB5", []],
    ["👋・New Member", "#95A5A6", []]
  ]},
  { category: "PING ROLES", roles: [
    ["🚨・Session Ping", "#ED4245", [], true],
    ["📢・Announcement Ping", "#5865F2", [], true],
    ["🎉・Giveaway Ping", "#F47FFF", [], true],
    ["📅・Event Ping", "#57F287", [], true],
    ["📝・Application Ping", "#FEE75C", [], true],
    ["💬・Chat Ping", "#3498DB", [], true]
  ]},
  { category: "STATUS ROLES", roles: [
    ["🟢・Available", "#57F287", []],
    ["🟡・Away", "#FEE75C", []],
    ["🔴・Do Not Disturb", "#ED4245", []],
    ["🌙・Inactive", "#747F8D", []]
  ]},
  { category: "PUNISHMENT ROLES", roles: [
    ["⛔・Suspended", "#2F3136", [], false],
    ["🚫・Blacklisted", "#000000", [], false]
  ]}
];

const ERLC_ROLES = ROLE_GROUPS.flatMap((group) => group.roles.map(([name, color, permissions, mentionable = false]) => ({
  category: group.category,
  name,
  color,
  permissions,
  mentionable,
  hoist: true
})));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findRoleByName(guild, name) {
  return guild.roles.cache.find((role) => role.name === name) || null;
}

function rolePermissions(roleData) {
  return new PermissionsBitField(roleData.permissions || []);
}

function formatList(items, empty = "None") {
  if (!items.length) return empty;
  return items.slice(0, 18).join("\n") + (items.length > 18 ? "\n+" + (items.length - 18) + " more" : "");
}

function buildSummaryEmbed(title, summary) {
  const embed = new EmbedBuilder()
    .setColor(summary.errors.length ? COLORS.warn : COLORS.ok)
    .setTitle(title)
    .setDescription("ERLC roles only. No channels were created, edited, or deleted.")
    .addFields(
      { name: "Created", value: formatList(summary.created), inline: true },
      { name: "Reused", value: formatList(summary.reused), inline: true },
      { name: "Updated", value: formatList(summary.updated), inline: true },
      { name: "Skipped", value: formatList(summary.skipped), inline: false },
      { name: "Errors", value: formatList(summary.errors), inline: false }
    )
    .setTimestamp();

  for (const group of ROLE_GROUPS) {
    embed.addFields({
      name: "╭──・" + group.category + "・──╮",
      value: group.roles.map((role) => role[0]).join("\n").slice(0, 1024),
      inline: false
    });
  }
  return embed;
}

async function requireSafeRoleSetup(interaction) {
  if (!interaction.member?.permissions?.has(P.PermissionFlagsBits?.Administrator || P.Administrator) && !interaction.member?.permissions?.has(P.Administrator)) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.error).setTitle("Administrator Required").setDescription("You need Administrator permission to run this command.")] });
    return null;
  }

  const guild = interaction.guild;
  const botMember = guild.members.me || await guild.members.fetchMe();
  if (!botMember.permissions.has(P.ManageRoles)) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.error).setTitle("Missing Bot Permission").setDescription("I need **Manage Roles** before I can create or update ERLC roles.")] });
    return null;
  }

  await guild.roles.fetch().catch(() => null);
  return { guild, botHighest: botMember.roles.highest };
}

function isEditable(role, botHighest) {
  return role.editable && role.position < botHighest.position;
}

async function updateRole(role, roleData, summary, botHighest) {
  if (!isEditable(role, botHighest)) {
    summary.skipped.push(roleData.name + " — move the bot role above this role");
    return role;
  }

  const permissions = rolePermissions(roleData);
  const changes = {};
  if (role.hexColor.toUpperCase() !== roleData.color.toUpperCase()) changes.color = roleData.color;
  if (role.permissions.bitfield !== permissions.bitfield) changes.permissions = permissions;
  if (role.mentionable !== roleData.mentionable) changes.mentionable = roleData.mentionable;
  if (role.hoist !== true) changes.hoist = true;

  if (Object.keys(changes).length) {
    await role.edit(changes, "ERLC role setup sync");
    summary.updated.push(roleData.name);
    await sleep(750);
  } else {
    summary.reused.push(roleData.name);
  }
  return role;
}

async function findOrCreateRole(guild, roleData, summary, botHighest) {
  const existing = findRoleByName(guild, roleData.name);
  if (existing) return updateRole(existing, roleData, summary, botHighest);

  const created = await guild.roles.create({
    name: roleData.name,
    color: roleData.color,
    permissions: rolePermissions(roleData),
    mentionable: roleData.mentionable,
    hoist: true,
    reason: "ERLC role setup"
  });
  summary.created.push(roleData.name);
  await sleep(750);
  return created;
}

async function applyRolePositions(guild, rolesArray, summary, botHighest) {
  await guild.roles.fetch().catch(() => null);
  const lowestToHighest = [...rolesArray].reverse();
  let target = 1;
  const maxTarget = Math.max(1, botHighest.position - 1);

  for (const roleData of lowestToHighest) {
    const role = findRoleByName(guild, roleData.name);
    if (!role) {
      summary.errors.push(roleData.name + " — missing during position sync");
      continue;
    }
    if (!isEditable(role, botHighest)) {
      summary.skipped.push(roleData.name + " — cannot move; move the bot role above all ERLC roles");
      continue;
    }
    try {
      await role.setPosition(Math.min(target, maxTarget), { reason: "ERLC role hierarchy sync" });
      target++;
      await sleep(750);
    } catch (error) {
      summary.errors.push(roleData.name + " — position failed: " + error.message);
    }
  }
}

async function runRoleSetup(interaction, options = {}) {
  const createMissing = options.createMissing !== false;
  await interaction.deferReply({ flags: 64 });
  const context = await requireSafeRoleSetup(interaction);
  if (!context) return;

  const { guild, botHighest } = context;
  const summary = { created: [], reused: [], updated: [], skipped: [], errors: [] };

  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.setup).setTitle("ERLC Role Setup").setDescription("Syncing role colors, permissions, mention settings, and display style...")] });

  for (const roleData of ERLC_ROLES) {
    try {
      const exists = findRoleByName(guild, roleData.name);
      if (!exists && !createMissing) {
        summary.skipped.push(roleData.name + " — missing; run /setup-erlc-roles");
        continue;
      }
      await findOrCreateRole(guild, roleData, summary, botHighest);
    } catch (error) {
      summary.errors.push(roleData.name + " — " + error.message);
    }
  }

  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.setup).setTitle("ERLC Role Setup").setDescription("Applying hierarchy from lowest to highest...")] });
  await applyRolePositions(guild, ERLC_ROLES, summary, botHighest);
  await interaction.editReply({ embeds: [buildSummaryEmbed(createMissing ? "ERLC Roles Setup Complete" : "ERLC Role Order Fixed", summary)] });
}

async function runRoleOrderFix(interaction) {
  await runRoleSetup(interaction, { createMissing: false });
}

module.exports = {
  ERLC_ROLES,
  ROLE_GROUPS,
  findRoleByName,
  findOrCreateRole,
  updateRole,
  applyRolePositions,
  sleep,
  runRoleSetup,
  runRoleOrderFix
};
