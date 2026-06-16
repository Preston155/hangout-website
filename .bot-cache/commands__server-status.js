const { baseEmbed } = require("../utils/embed-theme");

const UPDATE_MS = 30_000;

function buildStatusEmbed(guild) {
  const channels = guild.channels.cache;
  const textChannels = channels.filter((channel) => channel.isTextBased()).size;
  const voiceChannels = channels.filter((channel) => channel.isVoiceBased()).size;
  const categories = channels.filter((channel) => channel.type === 4).size;
  const createdUnix = Math.floor(guild.createdTimestamp / 1000);
  const refreshedUnix = Math.floor(Date.now() / 1000);

  return baseEmbed(guild)
    .setAuthor({
      name: guild.name + " Status",
      iconURL: guild.iconURL({ size: 128 }) || undefined
    })
    .setDescription("Live Discord server overview. Refreshes every **30 seconds**.")
    .addFields(
      {
        name: "Community",
        value: [
          "Members: **" + (guild.memberCount || 0) + "**",
          "Boosts: **" + (guild.premiumSubscriptionCount || 0) + "**",
          "Roles: **" + guild.roles.cache.size + "**"
        ].join("\n"),
        inline: true
      },
      {
        name: "Channels",
        value: [
          "Text: **" + textChannels + "**",
          "Voice: **" + voiceChannels + "**",
          "Categories: **" + categories + "**"
        ].join("\n"),
        inline: true
      },
      {
        name: "Details",
        value: [
          "Created: <t:" + createdUnix + ":D>",
          "Updated: <t:" + refreshedUnix + ":R>",
          "ID: `" + guild.id + "`"
        ].join("\n"),
        inline: false
      }
    );
}

async function updateLiveMessage(statusMessage, guild, key, liveStatusMessages) {
  try {
    await statusMessage.edit({ embeds: [buildStatusEmbed(guild)] });
  } catch (error) {
    clearInterval(liveStatusMessages.get(key)?.interval);
    liveStatusMessages.delete(key);
    console.error("Stopped live status updater:", error.message);
  }
}

module.exports = {
  prefixName: "status",
  aliases: ["serverstatus", "server-status", "server"],
  async executePrefix(message, liveStatusMessages) {
    const key = message.channel.id;
    const existing = liveStatusMessages.get(key);
    if (existing) {
      clearInterval(existing.interval);
      liveStatusMessages.delete(key);
      await existing.message.delete().catch(() => null);
    }

    const statusMessage = await message.channel.send({
      embeds: [buildStatusEmbed(message.guild)]
    });

    const interval = setInterval(() => {
      updateLiveMessage(statusMessage, message.guild, key, liveStatusMessages);
    }, UPDATE_MS);

    liveStatusMessages.set(key, { message: statusMessage, interval });
  }
};
