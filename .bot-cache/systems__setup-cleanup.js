const { SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType, MessageFlags } = require("discord.js");

void PermissionsBitField;

const BRAND_COLOR = 0x0b1f4d;
const ERROR_COLOR = 0xc23b3b;
const OK_COLOR = 0x1f8b4c;

function buildEmbed(color, title, description) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "City of Angels • Channel Safety" })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete-lcrp-channels")
    .setDescription("Safely delete one selected LCRP channel after confirmation.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("confirm")
        .setDescription("Type DELETE to unlock the confirmation buttons.")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel or category to delete. Defaults to the current channel.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Audit log reason.")
        .setRequired(false)
        .setMaxLength(250)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({ embeds: [buildEmbed(ERROR_COLOR, "Missing Permission", "You need Administrator permission to use this command.")] });
      return;
    }

    const confirm = interaction.options.getString("confirm", true);
    if (confirm !== "DELETE") {
      await interaction.editReply({ embeds: [buildEmbed(ERROR_COLOR, "Confirmation Required", "Type exactly 'DELETE' in the confirm option to continue.")] });
      return;
    }

    const target = interaction.options.getChannel("channel") || interaction.channel;
    const reason = interaction.options.getString("reason") || "City of Angels channel cleanup";
    const botMember = interaction.guild.members.me || await interaction.guild.members.fetchMe();

    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.editReply({ embeds: [buildEmbed(ERROR_COLOR, "Missing Bot Permission", "I need Manage Channels permission before I can delete channels.")] });
      return;
    }

    const isCategory = target.type === ChannelType.GuildCategory;
    const childCount = isCategory ? interaction.guild.channels.cache.filter((channel) => channel.parentId === target.id).size : 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lcrp_delete_confirm")
        .setLabel("Confirm Delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("lcrp_delete_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      embeds: [
        buildEmbed(
          BRAND_COLOR,
          "Confirm Channel Delete",
          [
            "Target: " + target.toString() + " ('" + target.name + "')",
            "Type: " + (isCategory ? "Category" : "Channel"),
            isCategory ? "Warning: this category currently has **" + childCount + "** child channel(s). They will not be auto-deleted by this command." : null,
            "Reason: " + reason,
            "",
            "Only you can press these buttons. This expires in 30 seconds."
          ].filter(Boolean).join("\n")
        )
      ],
      components: [row]
    });

    let button;
    try {
      button = await interaction.fetchReply().then((message) =>
        message.awaitMessageComponent({
          componentType: ComponentType.Button,
          time: 30_000
        })
      );
    } catch {
      await interaction.editReply({
        embeds: [buildEmbed(ERROR_COLOR, "Delete Timed Out", "No channel was deleted.")],
        components: []
      });
      return;
    }

    if (button.user.id !== interaction.user.id) {
      await button.reply({ content: "Only the command user can confirm this delete.", flags: 64 });
      return;
    }

    if (button.customId === "lcrp_delete_cancel") {
      await button.update({
        embeds: [buildEmbed(OK_COLOR, "Delete Cancelled", "No channel was deleted.")],
        components: []
      });
      return;
    }

    await target.delete(reason);
    await button.update({
      embeds: [buildEmbed(OK_COLOR, "Channel Deleted", "'" + target.name + "' was deleted successfully.")],
      components: []
    }).catch(() => null);
  }
};
