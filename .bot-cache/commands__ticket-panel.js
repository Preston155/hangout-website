const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { sendTicketPanel, isStaff, CONFIG } = require("../systems/ticket-system");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Send the City of Angels ticket panel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!interaction.guild || !interaction.channel?.isTextBased()) {
      await interaction.reply({ content: "Run this inside a server text channel.", flags: 64 });
      return;
    }
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: "Only staff can send the ticket panel.", flags: 64 });
      return;
    }
    await sendTicketPanel(interaction.channel);
    const warnings = [];
    if (!CONFIG.STAFF_ROLE_ID) warnings.push("TICKET_STAFF_ROLE_ID is not set, so Admin/Manage Channels users count as staff.");
    if (!CONFIG.TICKET_LOG_CHANNEL_ID) warnings.push("TICKET_LOG_CHANNEL_ID is not set, so ticket logs will not send.");
    await interaction.reply({ content: "Ticket panel sent." + (warnings.length ? "\\n\\n" + warnings.map((w) => "Warning: " + w).join("\\n") : ""), flags: 64 });
  }
};
