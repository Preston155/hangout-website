const { Client, GatewayIntentBits, Events, PermissionFlagsBits,
  MessageFlags
} = require("discord.js");
const config = require("./config");
const serverStatus = require("./commands/server-status");
const purge = require("./commands/purge");
const serverRoles = require("./commands/server-roles");
const leveling = require("./systems/leveling-system");
const reactionRoles = require("./systems/reaction-roles");
const sessionSystem = require("./systems/session-system");
const welcomeSystem = require("./systems/welcome-system");
const mentionResponder = require("./systems/mention-responder");
const ticketSystem = require("./systems/ticket-system");
const countingSystem = require("./systems/counting-system");
const staffShiftSystem = require("./systems/staff-shift-system");
const { registerCommands, loadCommandCollection } = require("./register-commands");

const slashCommands = loadCommandCollection();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const liveStatusMessages = new Map();

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Prefix commands enabled with prefix "${config.prefix}"`);
  console.log("Advanced welcome system enabled.");
  console.log("Advanced leveling system enabled.");
  console.log("Advanced counting system enabled.");
  console.log("Staff shift system enabled.");
  await registerCommands(readyClient);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await welcomeSystem.sendWelcome(member, config);
  } catch (error) {
    console.error("Welcome system error:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = slashCommands.get(interaction.commandName);
    if (!command) {
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Slash command error:", error);
      const payload = { content: "There was an error running that command.", flags: 64 };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
    return;
  }

  try {
    await reactionRoles.handleInteraction(interaction);
    await sessionSystem.handleInteraction(interaction);
    if (await ticketSystem.handleInteraction(interaction)) return;
  } catch (error) {
    console.error("Reaction role interaction error:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "There was an error updating your role.", flags: 64 }).catch(() => null);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) {
    return;
  }

  const handledMention = await mentionResponder.handleMention(message).catch((error) => {
    console.error("Mention responder error:", error);
    return false;
  });
  if (handledMention) {
    return;
  }

  const isPrefixCommand = message.content.startsWith(config.prefix);

  if (!isPrefixCommand) {
    const handledCounting = await countingSystem.handleMessage(message).catch((error) => {
      console.error("Counting message error:", error);
      return false;
    });
    if (handledCounting) {
      return;
    }

    await leveling.handleMessage(message, config).catch((error) => {
      console.error("Leveling message error:", error);
    });
    return;
  }

  const raw = message.content.slice(config.prefix.length).trim();
  const [name, ...args] = raw.split(/\s+/);
  if (!name) {
    return;
  }

  const commandName = name.toLowerCase();

  const sessionAliases = {
    session: null,
    sv: "vote",
    ss: "start",
    se: "end"
  };

  if (Object.prototype.hasOwnProperty.call(sessionAliases, commandName)) {
    const sessionArgs = sessionAliases[commandName] ? [sessionAliases[commandName], ...args] : args;
    await sessionSystem.runSessionCommand(message, sessionArgs).catch(async (error) => {
      console.error("Session command error:", error);
      await message.channel.send("There was an error running that session command.");
    });
    return;
  }

  if (commandName === "shift" || commandName === "staffshift" || commandName === "duty") {
    await staffShiftSystem.prefixCommand(message, args).catch(async (error) => {
      console.error("Staff shift command error:", error);
      await message.channel.send("There was an error running the shift command.");
    });
    return;
  }

  if (commandName === "counting" || commandName === "count") {
    await countingSystem.prefixCommand(message, args).catch(async (error) => {
      console.error("Counting command error:", error);
      await message.channel.send("There was an error running the counting command.");
    });
    return;
  }

  if (commandName === "setuproles" || commandName === "reactionroles") {
    await reactionRoles.setupReactionRoles(message).catch(async (error) => {
      console.error("Reaction role setup error:", error);
      await message.channel.send("There was an error setting up reaction roles.");
    });
    return;
  }

  if (commandName === "addxp" || commandName === "givexp") {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.channel.send("You need Manage Server permission to add XP.");
      return;
    }

    await leveling.addXpCommand(message, args, config).catch(async (error) => {
      console.error("Add XP command error:", error);
      await message.channel.send("There was an error adding XP.");
    });
    return;
  }

  if (commandName === "level" || commandName === "rank") {
    await leveling.sendRank(message, args).catch(async (error) => {
      console.error("Rank command error:", error);
      await message.channel.send("There was an error getting level data.");
    });
    return;
  }

  if (commandName === "levels" || commandName === "leaderboard" || commandName === "lb") {
    await leveling.sendLeaderboard(message).catch(async (error) => {
      console.error("Leaderboard command error:", error);
      await message.channel.send("There was an error getting the leaderboard.");
    });
    return;
  }

  if (commandName === "purge" || commandName === "clear") {
    try {
      await purge.executePrefix(message, args);
    } catch (error) {
      console.error("Purge command error:", error);
      await message.channel.send("There was an error purging messages.");
    }
    return;
  }

  if (commandName === "testwelcome" || commandName === "welcometest") {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.channel.send("You need Manage Server permission to test the welcome message.");
      return;
    }

    try {
      await welcomeSystem.sendWelcome(message.member, config, message.channel);
    } catch (error) {
      console.error("Test welcome command error:", error);
      await message.channel.send("There was an error sending the test welcome message.");
    }
    return;
  }

  if (commandName === "roles" || commandName === "serverroles" || commandName === "server-roles") {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await message.channel.send("You need Manage Roles permission to view the server roles list.");
      return;
    }

    await serverRoles.handlePrefix(message, args).catch(async (error) => {
      console.error("Server roles command error:", error);
      await message.channel.send("There was an error getting the server roles.");
    });
    return;
  }

  const matchesServerStatus =
    commandName === serverStatus.prefixName ||
    serverStatus.aliases.includes(commandName);

  if (!matchesServerStatus) {
    return;
  }

  try {
    await serverStatus.executePrefix(message, liveStatusMessages);
  } catch (error) {
    console.error("Server status command error:", error);
    await message.channel.send("There was an error getting the Discord server status.");
  }
});

if (!config.token) {
  console.error("Missing DISCORD_TOKEN in .env");
  process.exit(1);
}

client.login(config.token);
