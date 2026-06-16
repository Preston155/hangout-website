const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { runRoleOrderFix } = require("../../systems/erlc-role-manager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fix-erlc-role-order")
    .setDescription("Reapply the ERLC role hierarchy order without touching channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await runRoleOrderFix(interaction);
  }
};
