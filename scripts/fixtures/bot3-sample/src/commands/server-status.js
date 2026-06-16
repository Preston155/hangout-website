const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server-status")
    .setDescription("Live Discord server overview embed."),
};
