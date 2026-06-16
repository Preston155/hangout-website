/**
 * Extract slash/prefix command metadata from Veltrix bot JavaScript source.
 */

function unescapeJsString(raw) {
  return raw
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return unescapeJsString(m[1]);
  }
  return null;
}

function allMatches(text, re) {
  const out = [];
  let m;
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const global = new RegExp(re.source, flags);
  while ((m = global.exec(text)) !== null) {
    out.push(m);
  }
  return out;
}

function extractSetPairs(block) {
  const name = firstMatch(block, [/\.setName\(\s*['"]([^'"]+)['"]/]);
  const description = firstMatch(block, [/\.setDescription\(\s*['"]([^'"]+)['"]/]);
  if (!name) return null;
  return { name, description: description || "" };
}

function extractSubcommands(text) {
  const subs = [];
  const re = /\.addSubcommand(?:Group)?\(\s*(?:\([^)]*\)\s*=>\s*)?(?:sub(?:command)?|group)?\s*(?:=>)?\s*\{([\s\S]*?)\}\s*\)/g;
  for (const m of allMatches(text, re)) {
    const pair = extractSetPairs(m[1]);
    if (pair) subs.push(pair);
  }
  if (subs.length) return subs;

  const simple = /\.addSubcommand(?:Group)?\([^)]*?setName\(\s*['"]([^'"]+)['"][^)]*?setDescription\(\s*['"]([^'"]+)['"]/g;
  for (const m of allMatches(text, simple)) {
    subs.push({ name: unescapeJsString(m[1]), description: unescapeJsString(m[2]) });
  }
  return subs;
}

function extractOptions(text) {
  const opts = [];
  const re =
    /\.add(?:String|Integer|Number|Boolean|User|Channel|Role|Mentionable|Attachment)Option\(\s*(?:\([^)]*\)\s*=>\s*)?(?:option|opt)?\s*(?:=>)?\s*\{([\s\S]*?)\}\s*\)/g;
  for (const m of allMatches(text, re)) {
    const pair = extractSetPairs(m[1]);
    if (pair) opts.push(pair);
  }
  return opts;
}

function extractSlashCommand(text, filePath) {
  if (!/SlashCommandBuilder|\.setName\(\s*['"]/.test(text)) return null;

  const name =
    firstMatch(text, [
      /new SlashCommandBuilder\(\)[\s\S]*?\.setName\(\s*['"]([^'"]+)['"]/,
      /\.setName\(\s*['"]([^'"]+)['"]/,
    ]) || pathBasename(filePath);

  const description =
    firstMatch(text, [/\.setDescription\(\s*['"]([^'"]+)['"]/]) || "";

  const subcommands = extractSubcommands(text);
  const options = extractOptions(text);

  const cmd = { name, type: "slash", description };
  if (subcommands.length) cmd.subcommands = subcommands;
  if (options.length) cmd.options = options;
  return cmd;
}

function extractPrefixCommand(text, filePath) {
  const name =
    firstMatch(text, [
      /prefixName\s*:\s*['"]([^'"]+)['"]/,
      /(?:^|\n)\s*name\s*:\s*['"]([^'"]+)['"]/m,
    ]) || null;

  if (!name && !/messageCreate|prefix|aliases\s*:/.test(text)) return null;

  const resolvedName = name || pathBasename(filePath);
  const description =
    firstMatch(text, [/description\s*:\s*['"]([^'"]+)['"]/, /\/\/\s*@description\s+(.+)/]) || "";

  const aliasMatch = text.match(/aliases\s*:\s*\[([\s\S]*?)\]/);
  let aliases = [];
  if (aliasMatch) {
    aliases = [...aliasMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  }

  const usage =
    firstMatch(text, [/usage\s*:\s*['"]([^'"]+)['"]/]) ||
    (aliases.length ? `.${resolvedName}` : `.${resolvedName}`);

  const cmd = {
    name: resolvedName,
    type: "prefix",
    description,
    usage: usage.startsWith(".") ? usage : `.${usage}`,
  };
  if (aliases.length) cmd.aliases = aliases;
  return cmd;
}

function extractSessionCommand(text) {
  if (!/session/i.test(text)) return null;
  if (!/vote|start|end|subcommand|aliases/i.test(text)) return null;

  const name = firstMatch(text, [/prefixName\s*:\s*['"]([^'"]+)['"]/, /name\s*:\s*['"]([^'"]+)['"]/]) || "session";

  const aliasMatch = text.match(/aliases\s*:\s*\[([\s\S]*?)\]/);
  let aliases = [];
  if (aliasMatch) {
    aliases = [...aliasMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  }

  const subcommands = [];
  const actionRe = /(?:case\s+['"]([^'"]+)['"]|['"](help|vote|start|end|status|list)['"]\s*:)/g;
  for (const m of allMatches(text, actionRe)) {
    const action = m[1];
    if (action && !subcommands.some((s) => s.name === action)) {
      subcommands.push({ name: action, description: `${action.charAt(0).toUpperCase()}${action.slice(1)} action.` });
    }
  }

  const knownSubs = [
    { name: "help", description: "Show session command help." },
    { name: "vote", description: "Open a session vote with Ready / Out buttons." },
    { name: "start", description: "Start the active session." },
    { name: "end", description: "End the current session." },
    { name: "status", description: "Show current session status and readiness." },
    { name: "list", description: "Show who is Ready vs Out." },
  ];

  return {
    name,
    type: "prefix",
    usage: `.${name} <action>`,
    aliases,
    description: firstMatch(text, [/description\s*:\s*['"]([^'"]+)['"]/]) || "Manage in-game session votes and roster.",
    subcommands: subcommands.length >= 3 ? subcommands : knownSubs,
    _category: "session",
  };
}

function pathBasename(filePath) {
  return String(filePath || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/\.js$/i, "");
}

function extractPrefixFromConfig(text) {
  return (
    firstMatch(text, [
      /PREFIX\s*=\s*process\.env\.PREFIX\s*\|\|\s*['"]([^'"]+)['"]/,
      /prefix\s*:\s*['"]([^'"]+)['"]/,
      /PREFIX\s*=\s*['"]([^'"]+)['"]/,
    ]) || "."
  );
}

function parseBotFile(relativePath, content) {
  const normalized = relativePath.replace(/\\/g, "/");
  const results = [];

  if (normalized.includes("session-system") || normalized.endsWith("session.js")) {
    const session = extractSessionCommand(content);
    if (session) {
      results.push(session);
      return results;
    }
  }

  const slash = extractSlashCommand(content, normalized);
  if (slash) results.push(slash);

  const prefix = extractPrefixCommand(content, normalized);
  if (prefix && (!slash || prefix.name !== slash.name)) {
    if (normalized.includes("session")) prefix._category = "session";
    results.push(prefix);
  }

  return results;
}

function parseAllSourceFiles(filesMap) {
  const byKey = new Map();

  for (const [relativePath, content] of filesMap.entries()) {
    if (!relativePath.endsWith(".js")) continue;
    if (relativePath.includes("node_modules")) continue;

    for (const cmd of parseBotFile(relativePath, content)) {
      const category = cmd._category || inferCategory(relativePath, cmd);
      delete cmd._category;
      const key = `${category}:${cmd.type}:${cmd.name}`;
      if (!byKey.has(key)) byKey.set(key, { ...cmd, _category: category, _source: relativePath });
    }
  }

  return byKey;
}

function inferCategory(relativePath, cmd) {
  const p = relativePath.replace(/\\/g, "/").toLowerCase();
  if (p.includes("session")) return "session";
  if (cmd.type === "slash") return "slash";
  if (cmd.type === "prefix") return "prefix";
  return "prefix";
}

module.exports = {
  parseBotFile,
  parseAllSourceFiles,
  extractPrefixFromConfig,
  unescapeJsString,
};
