/**
 * Merge admin-overrides.json into bot-commands + command-previews.
 */

function deepMergeCmd(base, patch) {
  if (!patch) return base;
  const out = { ...base, ...patch };
  if (patch.subcommands && base.subcommands) {
    const byName = new Map(base.subcommands.map((s) => [s.name, s]));
    for (const s of patch.subcommands) byName.set(s.name, { ...byName.get(s.name), ...s });
    out.subcommands = [...byName.values()];
  }
  if (patch.aliases) out.aliases = patch.aliases;
  return out;
}

function applyCommandOverrides(data, overrides = {}) {
  if (!data?.categories) return data;
  const hidden = new Set(overrides.hiddenKeys || []);

  const categories = data.categories.map((cat) => ({
    ...cat,
    commands: cat.commands
      .filter((cmd) => !hidden.has(`${cat.id}:${cmd.name}:${cmd.type || "system"}`))
      .map((cmd) => {
        const key = `${cat.id}:${cmd.name}:${cmd.type || "system"}`;
        const alt = `${cmd.type || "prefix"}:${cmd.name}`;
        const patch = overrides.commands?.[key] || overrides.commands?.[alt];
        return patch ? deepMergeCmd(cmd, patch) : cmd;
      }),
  }));

  if (overrides.newCommands?.length) {
    for (const entry of overrides.newCommands) {
      const cat = categories.find((c) => c.id === entry.categoryId);
      if (!cat) continue;
      if (!cat.commands.some((c) => c.name === entry.command.name)) {
        cat.commands.push({ ...entry.command });
      }
    }
  }

  return {
    ...data,
    botName: overrides.meta?.botName || data.botName,
    subtitle: overrides.meta?.subtitle || data.subtitle,
    prefix: overrides.meta?.prefix || data.prefix,
    categories,
  };
}

function applyPreviewOverrides(previews, overrides = {}) {
  if (!previews) previews = {};
  return { ...previews, ...(overrides.previews || {}) };
}

function applySystemOverrides(data, overrides = {}) {
  if (!overrides.systems || !data?.categories) return data;
  const sysCat = data.categories.find((c) => c.id === "systems");
  if (!sysCat) return data;
  sysCat.commands = sysCat.commands.map((cmd) => {
    const patch = overrides.systems[cmd.name];
    return patch ? { ...cmd, ...patch } : cmd;
  });
  return data;
}

function mergeAll(botCommands, previews, adminOverrides) {
  const o = adminOverrides || { commands: {}, previews: {}, systems: {}, meta: {} };
  let data = structuredClone(botCommands);
  data = applySystemOverrides(data, o);
  data = applyCommandOverrides(data, o);
  const mergedPreviews = applyPreviewOverrides(previews, o);
  data.updatedAt = new Date().toISOString().slice(0, 10);
  return { data, previews: mergedPreviews };
}

function overridesToMetaPatches(adminOverrides, existingMeta = {}) {
  const overrides = { ...(existingMeta.overrides || {}) };
  for (const [key, patch] of Object.entries(adminOverrides.commands || {})) {
    const parts = key.split(":");
    const metaKey = parts.length >= 3 ? `${parts[0]}:${parts[1]}` : key;
    overrides[metaKey] = { ...(overrides[metaKey] || {}), ...patch };
  }
  return { ...existingMeta, overrides };
}

module.exports = {
  mergeAll,
  applyCommandOverrides,
  applyPreviewOverrides,
  overridesToMetaPatches,
  deepMergeCmd,
};
