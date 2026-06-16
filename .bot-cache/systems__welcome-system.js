const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

function getWelcomeChannel(member, config) {
  if (config.welcomeChannelId) {
    const configured = member.guild.channels.cache.get(config.welcomeChannelId);
    if (configured && configured.isTextBased()) {
      return configured;
    }
  }

  if (member.guild.systemChannel && member.guild.systemChannel.isTextBased()) {
    return member.guild.systemChannel;
  }

  return member.guild.channels.cache.find((channel) => {
    return channel.type === ChannelType.GuildText && channel.isTextBased();
  });
}

function buildWelcomeButtons(member, config) {
  const verifyButton = config.verifyUrl
    ? new ButtonBuilder()
        .setLabel("Verify")
        .setStyle(ButtonStyle.Link)
        .setURL(config.verifyUrl)
    : new ButtonBuilder()
        .setCustomId("welcome_verify_info")
        .setLabel("Verify")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

  const countButton = new ButtonBuilder()
    .setCustomId("welcome_member_count")
    .setLabel(String(member.guild.memberCount || 0))
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true)
    .setEmoji("👥");

  return [new ActionRowBuilder().addComponents(verifyButton, countButton)];
}

function buildWelcomeMessage(member, config) {
  const memberNumber = member.guild.memberCount || 0;
  return (
    "👋 Welcome " +
    member.toString() +
    " to **" +
    config.serverName +
    "**! You are our **" +
    memberNumber +
    "th member**, we hope you enjoy your stay!\n" +
    "-# Ensure to verify to gain access to all of our channels."
  );
}

async function sendWelcome(member, config, overrideChannel = null) {
  const channel = overrideChannel || getWelcomeChannel(member, config);
  if (!channel) {
    console.warn("No welcome channel found for " + member.guild.name);
    return;
  }

  await channel.send({
    content: buildWelcomeMessage(member, config),
    components: buildWelcomeButtons(member, config)
  });
}

module.exports = { sendWelcome };
