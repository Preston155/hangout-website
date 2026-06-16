const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { runRoleSetup } = require("../../systems/erlc-role-manager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-erlc-roles")
    .setDescription("Create or sync only the ERLC role hierarchy.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await runRoleSetup(interaction, { createMissing: true });
  }
};
