/* Bot3 Command List */

const state = {
  data: null,
  query: "",
  filter: "all",
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function permClass(perm) {
  if (!perm || perm === "Everyone") return "var(--green)";
  if (/admin/i.test(perm)) return "var(--red)";
  return "var(--orange)";
}

function countCommands(data) {
  let slash = 0;
  let prefix = 0;
  let total = 0;
  for (const cat of data.categories) {
    for (const cmd of cat.commands) {
      total++;
      if (cmd.type === "slash") slash++;
      if (cmd.type === "prefix") prefix++;
    }
  }
  return { total, slash, prefix };
}

function matches(cmd, q) {
  if (!q) return true;
  const hay = [
    cmd.name,
    cmd.description,
    cmd.usage,
    cmd.permission,
    cmd.notes,
    ...(cmd.aliases || []),
    ...(cmd.subcommands || []).map((s) => s.name + " " + s.description),
    ...(cmd.options || []).map((o) => o.name + " " + o.description),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function renderCard(cmd) {
  const type = cmd.type || "system";
  const nameClass = type === "slash" ? "cmd-name cmd-name--slash" : type === "prefix" ? "cmd-name cmd-name--prefix" : "cmd-name";
  const displayName =
    type === "prefix"
      ? (cmd.usage ? cmd.usage.split(" ")[0].replace(/^\./, "") : cmd.name)
      : cmd.name;

  const aliases = (cmd.aliases || []).length
    ? `<span>${cmd.aliases.map((a) => (type === "prefix" ? "." : "") + esc(a)).join(", ")}</span>`
    : "";

  const perm = cmd.permission
    ? `<span style="border-color:${permClass(cmd.permission)};color:${permClass(cmd.permission)}">${esc(cmd.permission)}</span>`
    : "";

  const subs = (cmd.subcommands || []).length
    ? `<div class="subs"><div class="subs__title">Subcommands</div>${cmd.subcommands
        .map(
          (s) =>
            `<div class="sub"><code>${esc(s.name)}</code><span>${esc(s.description)}</span></div>`,
        )
        .join("")}</div>`
    : "";

  const opts = (cmd.options || []).length
    ? `<div class="subs"><div class="subs__title">Options</div>${cmd.options
        .map(
          (o) =>
            `<div class="sub"><code>${esc(o.name)}</code><span>${esc(o.description)}</span></div>`,
        )
        .join("")}</div>`
    : "";

  const notes = cmd.notes ? `<p style="font-size:12px;color:var(--dim);margin-top:8px">${esc(cmd.notes)}</p>` : "";

  return `<article class="card">
    <div class="card__top">
      <div class="${nameClass}">${esc(displayName)}</div>
      <span class="tag tag--${type}">${esc(type)}</span>
    </div>
    <p>${esc(cmd.description || "")}</p>
    <div class="meta">${perm}${aliases}${cmd.usage ? `<span>${esc(cmd.usage)}</span>` : ""}</div>
    ${notes}${subs}${opts}
  </article>`;
}

function render() {
  const app = document.getElementById("app");
  if (!state.data) {
    app.innerHTML = `<div class="page"><div class="empty">Loading commands…</div></div>`;
    return;
  }

  const q = state.query.trim().toLowerCase();
  const counts = countCommands(state.data);

  const sections = state.data.categories
    .filter((cat) => state.filter === "all" || state.filter === cat.id)
    .map((cat) => {
      const cmds = cat.commands.filter((c) => matches(c, q));
      if (!cmds.length) return "";
      return `<section class="section">
        <div class="section__head">
          <span class="section__icon">${cat.icon}</span>
          <h2>${esc(cat.label)}</h2>
        </div>
        <p class="section__desc">${esc(cat.description)}</p>
        <div class="grid">${cmds.map(renderCard).join("")}</div>
      </section>`;
    })
    .join("");

  app.innerHTML = `
    <div class="page">
      <header class="hero">
        <div class="hero__badge"><span class="hero__badge-dot"></span> Online Reference</div>
        <h1><span>${esc(state.data.botName)}</span> Commands</h1>
        <p>${esc(state.data.subtitle)} — every slash command, prefix command, and system feature in one place. Prefix: <strong style="color:var(--orange)">${esc(state.data.prefix)}</strong></p>
        <div class="stats">
          <div class="stat"><div class="stat__val">${counts.total}</div><div class="stat__label">Total</div></div>
          <div class="stat"><div class="stat__val">${counts.slash}</div><div class="stat__label">Slash</div></div>
          <div class="stat"><div class="stat__val">${counts.prefix}</div><div class="stat__label">Prefix</div></div>
        </div>
      </header>

      <div class="toolbar">
        <div class="search">
          <span class="search__icon">🔍</span>
          <input id="searchInput" type="search" placeholder="Search commands, aliases, permissions…" value="${esc(state.query)}" />
        </div>
        <div class="filters">
          ${[
            ["all", "All"],
            ...state.data.categories.map((c) => [c.id, c.label.replace(" Commands", "").replace("Automatic ", "")]),
          ]
            .map(
              ([id, label]) =>
                `<button class="chip${state.filter === id ? " active" : ""}" data-filter="${esc(id)}">${esc(label)}</button>`,
            )
            .join("")}
        </div>
      </div>

      ${sections || `<div class="empty">No commands match your search.</div>`}

      <footer class="footer">Updated ${esc(state.data.updatedAt)} · ${esc(state.data.package || "Bot3")}</footer>
    </div>`;

  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
    const input = document.getElementById("searchInput");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      render();
    });
  });
}

async function init() {
  try {
    const res = await fetch("data/bot-commands.json?v=1", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load commands");
    state.data = await res.json();
  } catch (err) {
    document.getElementById("app").innerHTML = `<div class="page"><div class="empty">Could not load command data. ${esc(err.message)}</div></div>`;
    return;
  }
  render();
}

init();
