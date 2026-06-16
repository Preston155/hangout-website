/**
 * Build command → bot source file index for admin patch push.
 */

const INDEX_PREFIX_ROUTES = {
  shift: { slashFile: "commands/shift.js" },
  counting: {},
  setuproles: {},
  addxp: {},
  level: {},
  levels: {},
  purge: {},
  testwelcome: {},
  roles: {},
  status: { slashFile: "commands/server-status.js" },
};

function overrideKey(category, name, type) {
  return `${category}:${name}:${type || category}`;
}

function metaKey(category, name) {
  return `${category}:${name}`;
}

function buildCommandSourceIndex(extractedMap, meta = {}) {
  const commands = {};
  const byOverrideKey = {};

  for (const entry of extractedMap.values()) {
    const { _category, _source, ...cmd } = entry;
    const type = cmd.type || _category;
    const mk = metaKey(_category, cmd.name);
    const ok = overrideKey(_category, cmd.name, type);

    commands[mk] = {
      file: _source,
      name: cmd.name,
      type,
      kind: type === "slash" ? "slash" : "prefix",
    };
    byOverrideKey[ok] = mk;

    if (type === "slash") {
      const prefixOk = overrideKey(_category, cmd.name, "prefix");
      if (INDEX_PREFIX_ROUTES[cmd.name]) {
        const route = INDEX_PREFIX_ROUTES[cmd.name];
        commands[`prefix:${cmd.name}`] = {
          file: "index.js",
          name: cmd.name,
          type: "prefix",
          kind: "index-prefix",
          slashFile: route.slashFile || _source,
        };
        byOverrideKey[prefixOk] = `prefix:${cmd.name}`;
      }
    }
  }

  for (const cmd of meta.manualCommands?.prefix || []) {
    const mk = `prefix:${cmd.name}`;
    if (commands[mk]) continue;
    const ok = overrideKey("prefix", cmd.name, "prefix");
    const slashSibling = [...extractedMap.values()].find(
      (e) => e.name === cmd.name && (e.type === "slash" || e._category === "slash"),
    );
    const slashFile = INDEX_PREFIX_ROUTES[cmd.name]?.slashFile || slashSibling?._source;

    commands[mk] = {
      file: INDEX_PREFIX_ROUTES[cmd.name] ? "index.js" : slashSibling?._source || "index.js",
      name: cmd.name,
      type: "prefix",
      kind: INDEX_PREFIX_ROUTES[cmd.name] ? "index-prefix" : "prefix",
      slashFile,
    };
    byOverrideKey[ok] = mk;
  }

  for (const [category, names] of Object.entries(meta.manualCommands || {})) {
    if (category === "prefix") continue;
    for (const cmd of names) {
      const mk = metaKey(category, cmd.name);
      const ok = overrideKey(category, cmd.name, cmd.type || category);
      if (!commands[mk]) {
        commands[mk] = {
          file: cmd.source || `commands/${cmd.name}.js`,
          name: cmd.name,
          type: cmd.type || category,
          kind: (cmd.type || category) === "slash" ? "slash" : "prefix",
        };
      }
      byOverrideKey[ok] = mk;
    }
  }

  return { version: 1, commands, byOverrideKey };
}

module.exports = { buildCommandSourceIndex, INDEX_PREFIX_ROUTES };
