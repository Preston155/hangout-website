const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const shifts = require("../systems/staff-shift-system");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Staff shift and points system.")
    .setDMPermission(false)
    .addSubcommand((sub) => sub.setName("start").setDescription("Start your staff shift."))
    .addSubcommand((sub) => sub.setName("end").setDescription("End your staff shift."))
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("View staff shift status.")
        .addUserOption((option) => option.setName("user").setDescription("Staff member.").setRequired(false))
    )
    .addSubcommand((sub) => sub.setName("leaderboard").setDescription("View the staff points leaderboard."))
    .addSubcommand((sub) =>
      sub
        .setName("addpoints")
        .setDescription("Add staff points.")
        .addUserOption((option) => option.setName("user").setDescription("Staff member.").setRequired(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("Points to add.").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "start") return shifts.start(interaction);
    if (sub === "end") return shifts.end(interaction);
    if (sub === "status") return shifts.status(interaction);
    if (sub === "leaderboard") return shifts.leaderboard(interaction);
    if (sub === "addpoints") return shifts.addPoints(interaction, interaction.options.getMember("user"), interaction.options.getInteger("amount"));
  }
};