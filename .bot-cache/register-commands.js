const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

function walkCommandFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkCommandFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

function loadCommandCollection() {
  const commands = new Collection();
  const commandDir = path.join(__dirname, "commands");
  for (const file of walkCommandFiles(commandDir)) {
    delete require.cache[require.resolve(file)];
    const command = require(file);
    if (!command?.data?.name || typeof command.execute !== "function") continue;
    if (commands.has(command.data.name)) {
      console.warn("Duplicate slash command skipped:", command.data.name, file);
      continue;
    }
    commands.set(command.data.name, command);
  }
  return commands;
}

function shouldUseGuildCommands() {
  return process.env.COMMAND_DEPLOY_SCOPE === "guild" || process.env.NODE_ENV === "development";
}

async function registerCommands(client) {
  const commands = loadCommandCollection();
  const payload = commands.map((command) => command.data.toJSON());
  if (!payload.length || !client?.application) return payload;

  if (shouldUseGuildCommands()) {
    const guildId = process.env.GUILD_ID;
    const guild = guildId ? await client.guilds.fetch(guildId).catch(() => null) : null;
    if (!guild) {
      console.error("Guild command deploy selected, but GUILD_ID was not found.");
      return payload;
    }
    await guild.commands.set(payload);
    console.log("Registered " + payload.length + " guild slash command(s) in " + guild.name + ".");
    return payload;
  }

  await client.application.commands.set(payload);
  console.log("Registered " + payload.length + " global slash command(s).");
  return payload;
}

module.exports = { registerCommands, loadCommandCollection };
