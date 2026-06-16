/**
 * Apply admin command patches to Veltrix bot JavaScript source files.
 */

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsQuote(s) {
  const text = String(s ?? "");
  if (!text.includes("'") || text.includes('"')) {
    return JSON.stringify(text);
  }
  return `'${text.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function replaceSetDescription(content, cmdName, newDescription) {
  if (!newDescription) return content;
  const name = escapeRegExp(cmdName);
  const re = new RegExp(
    `(\\.setName\\(\\s*['"]${name}['"]\\s*\\)\\s*\\.setDescription\\(\\s*)(['"])(?:\\\\.|(?!\\2).)*\\2`,
  );
  if (re.test(content)) {
    return content.replace(re, `$1${jsQuote(newDescription)}`);
  }
  const fallback = new RegExp(
    `(new SlashCommandBuilder\\(\\)[\\s\\S]*?\\.setName\\(\\s*['"]${name}['"]\\s*\\)[\\s\\S]*?\\.setDescription\\(\\s*)(['"])(?:\\\\.|(?!\\2).)*\\2`,
  );
  return content.replace(fallback, `$1${jsQuote(newDescription)}`);
}

function replaceSubcommandDescriptions(content, subcommands = []) {
  let out = content;
  for (const sub of subcommands) {
    if (!sub?.name || !sub.description) continue;
    const subName = escapeRegExp(sub.name);
    const re = new RegExp(
      `(\\.setName\\(\\s*['"]${subName}['"]\\s*\\)\\s*\\.setDescription\\(\\s*)(['"])(?:\\\\.|(?!\\2).)*\\2`,
      "g",
    );
    out = out.replace(re, `$1${jsQuote(sub.description)}`);
  }
  return out;
}

function replaceAliasesArray(content, aliases = []) {
  if (!aliases.length) return content;
  const formatted = aliases.map((a) => jsQuote(typeof a === "string" ? a : a.name)).join(", ");
  if (/aliases\s*:\s*\[/.test(content)) {
    return content.replace(/aliases\s*:\s*\[[\s\S]*?\]/, `aliases: [${formatted}]`);
  }
  return content.replace(
    /(prefixName\s*:\s*['"][^'"]+['"],?\s*)/,
    `$1\n  aliases: [${formatted}],\n`,
  );
}

function patchIndexAliasRoute(content, primaryName, aliases = []) {
  const names = [primaryName, ...aliases.filter((a) => a && a !== primaryName)];
  const unique = [...new Set(names.map((n) => String(n).toLowerCase()))];
  const condition = unique.map((n) => `commandName === ${jsQuote(n)}`).join(" || ");
  const re = new RegExp(
    `if\\s*\\(\\s*commandName\\s*===\\s*['"]${escapeRegExp(primaryName)}['"][^)]*\\)\\s*\\{`,
  );
  if (!re.test(content)) return { content, changed: false };
  return {
    content: content.replace(re, `if (${condition}) {`),
    changed: true,
  };
}

function patchSlashFile(content, cmdName, patch) {
  let out = content;
  let changed = false;

  if (patch.description) {
    const next = replaceSetDescription(out, cmdName, patch.description);
    changed = changed || next !== out;
    out = next;
  }

  if (patch.subcommands?.length) {
    const next = replaceSubcommandDescriptions(out, patch.subcommands);
    changed = changed || next !== out;
    out = next;
  }

  return { content: out, changed };
}

function patchPrefixFile(content, patch) {
  let out = content;
  let changed = false;

  if (patch.aliases?.length) {
    const next = replaceAliasesArray(out, patch.aliases);
    changed = changed || next !== out;
    out = next;
  }

  return { content: out, changed };
}

function normalizeAliasList(aliases) {
  return (aliases || [])
    .map((a) => (typeof a === "string" ? a : a?.name))
    .filter(Boolean);
}

/**
 * @param {Map<string,string>} filesMap relative path -> source
 * @param {object} sources command-sources.json body
 * @param {object} commandPatches admin-overrides.commands
 */
function applyPatchesToBotSource(filesMap, sources, commandPatches = {}) {
  const changedFiles = new Set();
  const log = [];
  const nextMap = new Map(filesMap);

  for (const [overrideKey, patch] of Object.entries(commandPatches)) {
    if (!patch || typeof patch !== "object") continue;

    const sourceKey = sources.byOverrideKey?.[overrideKey] || sources.byOverrideKey?.[overrideKey.split(":").slice(0, 2).join(":")];
    if (!sourceKey) {
      log.push(`Skip ${overrideKey}: no bot source mapping`);
      continue;
    }

    const entry = sources.commands?.[sourceKey];
    if (!entry?.file) {
      log.push(`Skip ${overrideKey}: missing file for ${sourceKey}`);
      continue;
    }

    const file = entry.file;
    const content = nextMap.get(file);
    if (content == null) {
      log.push(`Skip ${overrideKey}: file not loaded (${file})`);
      continue;
    }

    let result = { content, changed: false };

    if (entry.kind === "slash" || entry.type === "slash") {
      result = patchSlashFile(content, entry.name, patch);
    } else if (entry.kind === "index-prefix") {
      result = patchIndexAliasRoute(content, entry.name, normalizeAliasList(patch.aliases));
      if (patch.description && entry.slashFile) {
        const slashContent = nextMap.get(entry.slashFile);
        if (slashContent) {
          const slashPatch = patchSlashFile(slashContent, entry.name, { description: patch.description, subcommands: patch.subcommands });
          if (slashPatch.changed) {
            nextMap.set(entry.slashFile, slashPatch.content);
            changedFiles.add(entry.slashFile);
          }
        }
      }
    } else if (entry.kind === "prefix" || entry.type === "prefix") {
      result = patchPrefixFile(content, patch);
    }

    if (result.changed) {
      nextMap.set(file, result.content);
      changedFiles.add(file);
      log.push(`Patched ${file} (${overrideKey})`);
    }
  }

  return { filesMap: nextMap, changedFiles: [...changedFiles], log };
}

module.exports = {
  applyPatchesToBotSource,
  patchSlashFile,
  patchPrefixFile,
  patchIndexAliasRoute,
  replaceSetDescription,
  replaceAliasesArray,
  jsQuote,
};
