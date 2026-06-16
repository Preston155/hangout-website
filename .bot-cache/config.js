require("dotenv").config();

module.exports = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  guildId: process.env.GUILD_ID || "",
  prefix: process.env.PREFIX || ".",
  serverName: process.env.SERVER_NAME || "City of Angels",
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
  verifyUrl: process.env.VERIFY_URL || "",
  rulesChannelId: process.env.RULES_CHANNEL_ID || "",
  levelUpChannelId: process.env.LEVEL_UP_CHANNEL_ID || ""
};
