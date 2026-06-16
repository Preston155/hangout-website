const { ChannelType, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const counting = require("../systems/counting-system");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Manage the premium counting system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set the counting channel.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Counting channel.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("start")
            .setDescription("Number to start from.")
            .setMinValue(0)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("status").setDescription("Show counting status."))
    .addSubcommand((sub) =>
      sub
        .setName("reset")
        .setDescription("Reset counting.")
        .addIntegerOption((option) =>
          option
            .setName("start")
            .setDescription("Number to reset to.")
            .setMinValue(0)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Turn off counting.")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      await counting.setup(interaction, interaction.options.getChannel("channel"), interaction.options.getInteger("start") || 0);
      return;
    }
    if (sub === "reset") {
      await counting.reset(interaction, interaction.options.getInteger("start") || 0);
      return;
    }
    if (sub === "disable") {
      await counting.disable(interaction);
      return;
    }
    await counting.status(interaction);
  }
};