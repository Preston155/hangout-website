const { SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  PermissionsBitField, MessageFlags } = require("discord.js");

const BRAND_COLOR = 0x0b1f4d;
const OK_COLOR = 0x22c55e;
const ERROR_COLOR = 0xef4444;

const ROLE_DEFINITIONS = [
  { name: "👑 Founder", color: "#FFD700", permissions: "administrator" },
  { name: "💎 Owner", color: "#00E5FF", permissions: "administrator" },
  { name: "⚡ Co Owner", color: "#9B5CFF", permissions: "administrator" },
  { name: "🏛️ Community Director", color: "#C084FC", permissions: "administrator" },
  { name: "🧠 Server Director", color: "#FF4FD8", permissions: "administrator" },
  { name: "🕴️ Management", color: "#FF8C00", permissions: "administrator" },

  { name: "📌 Operations Director", color: "#F59E0B", permissions: "director" },
  { name: "📋 Staff Director", color: "#A855F7", permissions: "director" },
  { name: "🚨 Roleplay Director", color: "#EF4444", permissions: "director" },
  { name: "🏛️ Department Director", color: "#64748B", permissions: "director" },
  { name: "🛡️ Internal Affairs Director", color: "#111827", permissions: "director" },

  { name: "🛡️ Internal Affairs", color: "#1F2937", permissions: "internalAffairs" },
  { name: "🔎 IA Investigator", color: "#374151", permissions: "internalAffairs" },
  { name: "📁 IA Supervisor", color: "#4B5563", permissions: "internalAffairs" },

  { name: "⭐ Chief of Staff", color: "#F59E0B", permissions: "seniorStaff" },
  { name: "🛡️ Server Manager", color: "#5865F2", permissions: "seniorStaff" },
  { name: "🔨 Head Administrator", color: "#3B82F6", permissions: "seniorStaff" },
  { name: "🧰 Administrator", color: "#2563EB", permissions: "administratorStaff" },
  { name: "🛠️ Head Moderator", color: "#22C55E", permissions: "headModerator" },
  { name: "🛡️ Moderator", color: "#16A34A", permissions: "moderator" },
  { name: "🧪 Trial Moderator", color: "#84CC16", permissions: "trialModerator" },
  { name: "🎓 Staff Trainee", color: "#A3E635", permissions: "safe" },

  { name: "🚔 MPD Chief", color: "#1E40AF", permissions: "safe" },
  { name: "🚔 MPD Assistant Chief", color: "#2563EB", permissions: "safe" },
  { name: "🚔 MPD Supervisor", color: "#3B82F6", permissions: "safe" },
  { name: "🚒 FEMS Chief", color: "#991B1B", permissions: "safe" },
  { name: "🚒 FEMS Assistant Chief", color: "#DC2626", permissions: "safe" },
  { name: "🚒 FEMS Supervisor", color: "#EF4444", permissions: "safe" },
  { name: "📞 Dispatch Director", color: "#7E22CE", permissions: "safe" },
  { name: "🏛️ Government Official", color: "#64748B", permissions: "safe" },
  { name: "⚖️ Judge", color: "#CA8A04", permissions: "safe" },

  { name: "🚔 Metropolitan Police Department", color: "#1D4ED8", permissions: "safe" },
  { name: "🚒 Fire & EMS", color: "#DC2626", permissions: "safe" },
  { name: "📞 Dispatch", color: "#9333EA", permissions: "safe" },
  { name: "🏛️ Government", color: "#64748B", permissions: "safe" },
  { name: "🪪 Civilian", color: "#22C55E", permissions: "safe" },
  { name: "🚗 Registered Driver", color: "#38BDF8", permissions: "safe" },
  { name: "🏢 Business Owner", color: "#14B8A6", permissions: "safe" },
  { name: "📰 Media", color: "#06B6D4", permissions: "safe" },

  { name: "🎭 Roleplay Member", color: "#22C55E", permissions: "safe" },
  { name: "🦺 Whitelisted Member", color: "#10B981", permissions: "safe" },
  { name: "🚓 LEO Certified", color: "#1D4ED8", permissions: "safe" },
  { name: "🚒 FEMS Certified", color: "#DC2626", permissions: "safe" },
  { name: "📞 Dispatch Certified", color: "#9333EA", permissions: "safe" },
  { name: "🏛️ Government Certified", color: "#64748B", permissions: "safe" },

  { name: "🚀 Server Booster", color: "#F47FFF", permissions: "safe" },
  { name: "👑 OG Member", color: "#FBBF24", permissions: "safe" },
  { name: "🌟 Active Member", color: "#60A5FA", permissions: "safe" },
  { name: "💬 Member", color: "#9CA3AF", permissions: "safe" },
  { name: "👋 New Member", color: "#D1D5DB", permissions: "safe" },

  { name: "📢 Announcement Ping", color: "#EF4444", permissions: "safe" },
  { name: "🚦 Session Ping", color: "#22C55E", permissions: "safe" },
  { name: "🚨 Emergency Ping", color: "#DC2626", permissions: "safe" },
  { name: "🎁 Giveaway Ping", color: "#F59E0B", permissions: "safe" },
  { name: "📊 Poll Ping", color: "#3B82F6", permissions: "safe" },
  { name: "📋 Application Ping", color: "#A855F7", permissions: "safe" },
  { name: "📌 Update Ping", color: "#06B6D4", permissions: "safe" },

  { name: "🤖 Bots", color: "#5865F2", permissions: "administrator" },
  { name: "🔒 Muted", color: "#374151", permissions: "safe" }
];

function hexToNumber(hex) {
  return Number.parseInt(String(hex).replace("#", ""), 16);
}

function getRolePermissions(type) {
  const flags = PermissionsBitField.Flags;
  const sets = {
    administrator: [flags.Administrator],
    director: [
      flags.ManageGuild,
      flags.ManageRoles,
      flags.ManageChannels,
      flags.KickMembers,
      flags.BanMembers,
      flags.ManageMessages,
      flags.ModerateMembers,
      flags.ViewAuditLog,
      flags.ManageNicknames
    ],
    seniorStaff: [
      flags.ManageGuild,
      flags.ManageRoles,
      flags.ManageChannels,
      flags.KickMembers,
      flags.BanMembers,
      flags.ManageMessages,
      flags.ModerateMembers,
      flags.ViewAuditLog,
      flags.ManageNicknames
    ],
    administratorStaff: [
      flags.KickMembers,
      flags.BanMembers,
      flags.ManageMessages,
      flags.ModerateMembers,
      flags.ViewAuditLog,
      flags.ManageNicknames
    ],
    headModerator: [
      flags.KickMembers,
      flags.ManageMessages,
      flags.ModerateMembers,
      flags.ViewAuditLog,
      flags.ManageNicknames
    ],
    moderator: [flags.KickMembers, flags.ManageMessages, flags.ModerateMembers],
    trialModerator: [flags.ManageMessages, flags.ModerateMembers],
    internalAffairs: [flags.ManageMessages, flags.ModerateMembers, flags.ViewAuditLog],
    safe: []
  };

  return new PermissionsBitField(sets[type] || []);
}

function canManageRole(role, botMember) {
  if (!role) return true;
  if (role.managed) return false;
  return role.position < botMember.roles.highest.position;
}

async function findOrCreateRole(guild, definition, botMember, stats) {
  const existing = guild.roles.cache.find((role) => role.name === definition.name);
  const desiredColor = hexToNumber(definition.color);
  const desiredPermissions = getRolePermissions(definition.permissions);

  if (!existing) {
    const created = await guild.roles.create({
      name: definition.name,
      color: desiredColor,
      permissions: desiredPermissions,
      hoist: true,
      reason: "City of Angels role setup"
    });
    stats.created.push(created.name);
    return;
  }

  if (!canManageRole(existing, botMember)) {
    stats.skipped.push(existing.name + " (above/equal bot or managed)");
    return;
  }

  const needsUpdate =
    existing.color !== desiredColor ||
    existing.permissions.bitfield.toString() !== desiredPermissions.bitfield.toString() ||
    existing.hoist !== true;

  if (needsUpdate) {
    await existing.edit({
      color: desiredColor,
      permissions: desiredPermissions,
      hoist: true,
      reason: "City of Angels role setup"
    });
    stats.updated.push(existing.name);
  } else {
    stats.reused.push(existing.name);
  }
}

function formatList(items) {
  if (!items.length) return "None";
  return items.slice(0, 12).map((item) => "• " + item).join("\n") + (items.length > 12 ? "\n+" + (items.length - 12) + " more" : "");
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(OK_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "City of Angels • Role Setup" })
    .setTimestamp();
}

function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle("Role Setup Failed")
    .setDescription(description)
    .setFooter({ text: "City of Angels • Role Setup" })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-lcrp-roles")
    .setDescription("Create or update the City of Angels role structure.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({ embeds: [errorEmbed("You need Administrator permission to use this command.")] });
      return;
    }

    const guild = interaction.guild;
    const botMember = guild.members.me || await guild.members.fetchMe();

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ embeds: [errorEmbed("I need Manage Roles permission before I can set up roles.")] });
      return;
    }

    const stats = { created: [], reused: [], updated: [], skipped: [], failed: [] };

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLOR)
          .setTitle("Setting Up LCRP Roles")
          .setDescription("Creating the Washington DC ERLC role structure with safe, exact role permissions.")
      ]
    });

    for (const definition of ROLE_DEFINITIONS) {
      try {
        await findOrCreateRole(guild, definition, botMember, stats);
      } catch (error) {
        stats.failed.push(definition.name + " (" + error.message + ")");
      }
    }

    await interaction.editReply({
      embeds: [
        successEmbed("LCRP Roles Setup Complete", "Roles were created or updated safely. Old HR roles are not touched or deleted.")
          .addFields(
            { name: "Created", value: formatList(stats.created), inline: true },
            { name: "Reused", value: formatList(stats.reused), inline: true },
            { name: "Updated", value: formatList(stats.updated), inline: true },
            { name: "Skipped", value: formatList(stats.skipped), inline: false },
            { name: "Failed", value: formatList(stats.failed), inline: false }
          )
      ]
    });
  }
};
