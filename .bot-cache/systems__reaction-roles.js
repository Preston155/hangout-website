const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} = require("discord.js");

const ROLE_SETS = [
  {
    id: "region",
    title: "🌍 Region Roles",
    description: "Choose your region so staff and members know your general area.",
    accentColor: 0xf1d84b,
    roles: [
      { label: "Europe", roleName: "Europe", emoji: "🌍" },
      { label: "North America", roleName: "North America", emoji: "🌎" },
      { label: "South America", roleName: "South America", emoji: "🌎" },
      { label: "Asia", roleName: "Asia", emoji: "🌏" },
      { label: "Oceania", roleName: "Oceania", emoji: "🌊" },
      { label: "Africa", roleName: "Africa", emoji: "🌍" }
    ]
  },
  {
    id: "timezone",
    title: "🕐 Timezone Roles",
    description: "Choose your timezone so sessions and events are easier to plan.",
    accentColor: 0x8fb7c7,
    roles: [
      { label: "US EST", roleName: "US EST", emoji: "🕐" },
      { label: "US CST", roleName: "US CST", emoji: "🕑" },
      { label: "US MST", roleName: "US MST", emoji: "🕒" },
      { label: "US PST", roleName: "US PST", emoji: "🕓" },
      { label: "GB GMT", roleName: "GB GMT", emoji: "🕔" },
      { label: "EU CET", roleName: "EU CET", emoji: "🕕" },
      { label: "AEST", roleName: "AEST", emoji: "🕖" }
    ]
  },
  {
    id: "mentions",
    title: "📢 Ping Roles",
    description: "Choose which server notifications you want to receive. Click a button again to remove the role.",
    accentColor: 0x5865f2,
    roles: [
      { label: "Announcements", roleName: "LCRP - Announcement Notification", emoji: "📢" },
      { label: "Session Ping", roleName: "LCRP - Session Ping", emoji: "🚨" },
      { label: "Giveaways", roleName: "LCRP - Giveaway Notification", emoji: "🎁" },
      { label: "Active Chat", roleName: "LCRP - Active Chat Notification", emoji: "💬" }
    ]
  }
];

function chunk(items, size) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function findRole(guild, roleName) {
  return guild.roles.cache.find((role) => role.name === roleName);
}

function roleLines(roleSet) {
  return roleSet.roles
    .map((role) => role.emoji + " " + role.label)
    .join("\n");
}

function makeSeparator() {
  return new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);
}

function makeButtonRow(roleSet, roles) {
  return new ActionRowBuilder().addComponents(
    roles.map((role) =>
      new ButtonBuilder()
        .setCustomId("rr:" + roleSet.id + ":" + role.roleName)
        .setLabel(role.label)
        .setEmoji(role.emoji)
        .setStyle(ButtonStyle.Secondary)
    )
  );
}

function buildContainer(roleSet) {
  const container = new ContainerBuilder()
    .setAccentColor(roleSet.accentColor)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## " + roleSet.title + "\n" + roleSet.description
      )
    )
    .addSeparatorComponents(makeSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**Available Roles**\n" + roleLines(roleSet)
      )
    )
    .addSeparatorComponents(makeSeparator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "_These buttons toggle roles on or off._"
      )
    );

  for (const roles of chunk(roleSet.roles, 4)) {
    container.addActionRowComponents(makeButtonRow(roleSet, roles));
  }

  return container;
}

async function setupReactionRoles(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await message.channel.send("You need Manage Server permission to set up reaction roles.");
    return;
  }

  for (const roleSet of ROLE_SETS) {
    await message.channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [buildContainer(roleSet)]
    });
  }
}

async function handleInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith("rr:")) {
    return false;
  }

  await interaction.deferReply({ flags: 64 }).catch(() => null);

  const [, setId, roleName] = interaction.customId.split(":");
  const roleSet = ROLE_SETS.find((set) => set.id === setId);
  const configuredRole = roleSet?.roles.find((role) => role.roleName === roleName);

  if (!configuredRole) {
    await interaction.editReply({ content: "That reaction role is no longer configured." }).catch(() => null);
    return true;
  }

  const role = findRole(interaction.guild, configuredRole.roleName);
  if (!role) {
    await interaction.editReply({ content: "I could not find the exact role: " + configuredRole.roleName }).catch(() => null);
    return true;
  }

  const member = interaction.member;
  const hasRole = member.roles.cache.has(role.id);

  try {
    if (hasRole) {
      await member.roles.remove(role);
      await interaction.editReply({ content: "Removed **" + role.name + "**." }).catch(() => null);
      return true;
    }

    await member.roles.add(role);
    await interaction.editReply({ content: "Added **" + role.name + "**." }).catch(() => null);
  } catch (error) {
    console.error("Reaction role toggle error:", error);
    await interaction.editReply({ content: "I could not update that role. Check my role position." }).catch(() => null);
  }
  return true;
}

module.exports = {
  setupReactionRoles,
  handleInteraction
};
