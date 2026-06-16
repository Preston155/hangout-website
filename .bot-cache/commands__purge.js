const { PermissionFlagsBits } = require("discord.js");

const MAX_PURGE = 500;
const BULK_DELETE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const OLD_DELETE_DELAY_MS = 125;

function parseAmount(args) {
  const amount = Number.parseInt(args[0], 10);
  if (!Number.isInteger(amount) || amount < 1) {
    return null;
  }
  return Math.min(amount, MAX_PURGE);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPinned(message) {
  return Boolean(message.pinned);
}

function isBulkDeletable(message) {
  return Date.now() - message.createdTimestamp < BULK_DELETE_MAX_AGE && !isPinned(message);
}

function isOldSingleDeletable(message) {
  return !isPinned(message) && !isBulkDeletable(message);
}

async function deleteOldMessages(messages) {
  let deleted = 0;

  for (const message of messages.values()) {
    if (isPinned(message)) {
      continue;
    }

    try {
      await message.delete();
      deleted += 1;
      await sleep(OLD_DELETE_DELAY_MS);
    } catch (error) {
      if (error.code !== 10008) {
        console.warn("Could not delete old message " + message.id + ": " + error.message);
      }
    }
  }

  return deleted;
}

async function fetchMessages(channel, amount, beforeId) {
  return channel.messages.fetch({
    limit: Math.min(amount, 100),
    before: beforeId
  });
}

module.exports = {
  prefixName: "purge",
  aliases: ["clear"],
  async executePrefix(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.channel.send("You need Manage Messages permission to use this command.");
      return;
    }

    const botMember = message.guild.members.me;
    if (!botMember.permissionsIn(message.channel).has(PermissionFlagsBits.ManageMessages)) {
      await message.channel.send("I need Manage Messages permission in this channel.");
      return;
    }

    const amount = parseAmount(args);
    if (!amount) {
      await message.channel.send("Usage: .purge <amount>");
      return;
    }

    const progress = await message.channel.send("Purging messages...");
    await message.delete().catch(() => null);

    let remaining = amount;
    let beforeId;
    let deleted = 0;
    let scanned = 0;
    let pinnedSkipped = 0;

    while (remaining > 0) {
      const fetched = await fetchMessages(message.channel, remaining, beforeId);
      if (fetched.size === 0) {
        break;
      }

      scanned += fetched.size;
      beforeId = fetched.last().id;

      const pinned = fetched.filter(isPinned);
      pinnedSkipped += pinned.size;

      const bulkable = fetched.filter(isBulkDeletable);
      const oldMessages = fetched.filter(isOldSingleDeletable);

      if (bulkable.size > 0) {
        const result = await message.channel.bulkDelete(bulkable, true);
        deleted += result.size;
      }

      if (oldMessages.size > 0) {
        deleted += await deleteOldMessages(oldMessages);
      }

      remaining -= fetched.size;
    }

    let summary = "Purged " + deleted + " message" + (deleted === 1 ? "" : "s") + ".";
    if (pinnedSkipped > 0) {
      summary += " Skipped " + pinnedSkipped + " pinned message" + (pinnedSkipped === 1 ? "" : "s") + ".";
    }

    let resultMessage = progress;
    await progress.edit(summary).catch(async () => {
      resultMessage = await message.channel.send(summary).catch(() => null);
    });

    setTimeout(() => {
      resultMessage?.delete().catch(() => null);
    }, 5000);

    if (deleted === 0 && scanned > 0) {
      console.warn("Purge scanned messages but none could be deleted.");
    }
  }
};
