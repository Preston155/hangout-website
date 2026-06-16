const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const PAGE_SIZE = 20;
const BRAND_COLOR = 0x0b1f4d;

function cleanRoleName(role) {
  return role.name === "@everyone" ? "@everyone" : role.name;
}

function getRoles(guild) {
  return [...guild.roles.cache.values()]
    .filter((role) => role.name !== "@everyone")
    .sort((a, b) => b.position - a.position || a.name.localeCompare(b.name));
}

function clampPage(page, totalPages) {
  const parsed = Number.parseInt(page, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, totalPages);
}

function formatRoleLine(role, index) {
  const tags = [];
  if (role.managed) tags.push("managed");
  if (role.hoist) tags.push("displayed");
  if (role.mentionable) tags.push("mentionable");
  const suffix = tags.length ? " _" + tags.join(", ") + "_" : "";
  return "**" + index + ".** " + role.toString() + " • `" + cleanRoleName(role) + "` • pos " + role.position + " • " + role.members.size + " members" + suffix;
}

function buildRolesEmbed(guild, page = 1) {
  const roles = getRoles(guild);
  const totalPages = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRoles = roles.slice(start, start + PAGE_SIZE);

  const description = pageRoles.length
    ? pageRoles.map((role, offset) => formatRoleLine(role, start + offset + 1)).join("\n")
    : "No roles found.";

  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("🛡️・Server Roles")
    .setDescription(description)
    .addFields(
      { name: "Server", value: guild.name, inline: true },
      { name: "Roles", value: String(roles.length), inline: true },
      { name: "Page", value: safePage + "/" + totalPages, inline: true }
    )
    .setFooter({ text: "Use /server-roles page:" + Math.min(safePage + 1, totalPages) + " for the next page." })
    .setTimestamp();
}

async function sendServerRoles(target, page) {
  const guild = target.guild;
  const embed = buildRolesEmbed(guild, page);

  if (target.reply) {
    await target.reply({ embeds: [embed], flags: 64 });
    return;
  }

  await target.channel.send({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server-roles")
    .setDescription("Show the roles in this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number to view.")
        .setMinValue(1)
        .setRequired(false)
    ),

  buildRolesEmbed,
  async execute(interaction) {
    const page = interaction.options.getInteger("page") || 1;
    await sendServerRoles(interaction, page);
  },

  async handlePrefix(message, args) {
    const page = args[0] || 1;
    await sendServerRoles(message, page);
  }
};
