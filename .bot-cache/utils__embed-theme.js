const { EmbedBuilder } = require("discord.js");

const COLORS = {
  primary: 0x2f80ed,
  success: 0x2ecc71,
  warning: 0xf1c40f,
  danger: 0xe74c3c,
  neutral: 0x95a5a6
};

function baseEmbed(guild, color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter({
      text: guild ? guild.name : "City of Angels",
      iconURL: guild?.iconURL({ size: 64 }) || undefined
    });
}

function compactEmbed(guild, title, description, color = COLORS.primary) {
  return baseEmbed(guild, color)
    .setTitle(title)
    .setDescription(description);
}

module.exports = {
  COLORS,
  baseEmbed,
  compactEmbed
};
