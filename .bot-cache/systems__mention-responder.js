const COOLDOWN_MS = 1600;
const cooldowns = new Map();

const memory = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanPrompt(message) {
  return message.content
    .replace(new RegExp("<@!?" + message.client.user.id + ">", "g"), "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function onCooldown(message) {
  const key = message.guild.id + ":" + message.author.id;
  const now = Date.now();
  const last = cooldowns.get(key) || 0;
  if (now - last < COOLDOWN_MS) return true;
  cooldowns.set(key, now);
  return false;
}

function remember(message, prompt) {
  const key = message.guild.id + ":" + message.author.id;
  const previous = memory.get(key) || [];
  previous.push(prompt);
  memory.set(key, previous.slice(-4));
  return previous;
}

function pick(list, seed) {
  let total = 0;
  for (const char of seed) total += char.charCodeAt(0);
  return list[total % list.length];
}

function replyFor(prompt, history, userId) {
  const p = prompt.toLowerCase();
  const seed = prompt + userId + history.join("|");

  if (!prompt) return "yo?";

  if (/\b(stink|smell|trash|bad|suck|ugly|mid)\b/i.test(p)) {
    return pick([
      "nah that's actually crazy coming from you",
      "and yet here you are talking to me",
      "i'll survive somehow",
      "bold words for someone still pinging me",
      "ok that one hurt for like half a second"
    ], seed);
  }

  if (/\b(idiot|stupid|dumb|dummy)\b/i.test(p)) {
    return pick([
      "rude, but continue",
      "i'm listening anyway",
      "that was unnecessary but alright",
      "noted. still online though",
      "you say that like i have feelings installed"
    ], seed);
  }

  if (/\b(fuck you|stfu|shut up)\b/i.test(p)) {
    return pick([
      "nah",
      "make me",
      "wild opener",
      "you good?",
      "i'm gonna pretend that was friendly"
    ], seed);
  }

  if (/\b(what are you doing|wyd|what u doing)\b/i.test(p)) {
    return "watching chat and judging quietly";
  }

  if (/\b(hi|hello|hey|yo|sup)\b/i.test(p)) {
    return pick(["yo", "sup", "what's good", "hey", "i'm here"], seed);
  }

  if (/\b(why|how|what|when|where|can you|could you)\b/i.test(p)) {
    return pick([
      "probably, but give me the details",
      "depends, what exactly are you trying to do?",
      "i need one more sentence and i got you",
      "explain it like i'm staff on 2 hours of sleep",
      "maybe. what's the full move?"
    ], seed);
  }

  if (/\b(that'?s crazy|crazy|wild|lol|lmao)\b/i.test(p)) {
    return pick([
      "fr",
      "actually wild",
      "i'm saying",
      "you see it too",
      "couldn't be me"
    ], seed);
  }

  return pick([
    "real",
    "valid",
    "i hear you",
    "keep going",
    "what's the move?",
    "say less"
  ], seed);
}

async function handleMention(message) {
  if (!message.mentions.users.has(message.client.user.id)) return false;
  if (onCooldown(message)) return true;

  const prompt = cleanPrompt(message);
  const history = remember(message, prompt);
  await message.channel.sendTyping().catch(() => null);
  await sleep(350 + Math.floor(Math.random() * 450));

  await message.reply({
    content: replyFor(prompt, history, message.author.id),
    allowedMentions: { repliedUser: false, parse: [] }
  });
  return true;
}

module.exports = {
  handleMention
};
