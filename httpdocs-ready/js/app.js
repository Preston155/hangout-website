/* Veltrix · City of Angels */

const state = {
  data: null,
  bots: [],
  activeBot: "veltrix",
  giveaways: null,
  giveawaysLoading: false,
  giveawaysError: "",
  giveawaysTimer: null,
  query: "",
  filter: "all",
  view: "commands",
  adminAuth: false,
  modalCmd: null,
  adminGateOpen: false,
  adminQuery: "",
};

const ADMIN_SESSION_KEY = "vx_admin";
const ADMIN_PASS = "COARP";

const LOGO_V = 8;
const LOGO_SRC = "data:image/webp;base64,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";
const BOOT_MIN_MS = 120;
const bootStart = performance.now();

function logoPicture(className, w, h, alt = "") {
  const q = `?v=${LOGO_V}`;
  return `<picture class="${className}-wrap">
    <source srcset="${LOGO_SRC}" type="image/webp" />
    <img class="${className}" src="${LOGO_SRC}" alt="${esc(alt)}" width="${w}" height="${h}" decoding="async" />
  </picture>`;
}

function setBootProgress(pct) {
  const bar = document.getElementById("bootProgress");
  const boot = document.getElementById("boot");
  const rounded = Math.round(pct);
  if (bar) bar.style.width = `${rounded}%`;
  const progress = boot?.querySelector(".boot__progress");
  progress?.setAttribute("aria-valuenow", String(rounded));
}

function dismissBoot() {
  const boot = document.getElementById("boot");
  if (!boot || boot.dataset.dismissed === "1") return;

  const finish = () => {
    boot.dataset.dismissed = "1";
    setBootProgress(100);
    boot.classList.add("is-exiting");
    boot.setAttribute("aria-busy", "false");
    setTimeout(() => {
      boot.classList.add("is-done");
      document.body.classList.add("is-ready");
      setTimeout(() => boot.remove(), 380);
    }, 320);
  };

  const elapsed = performance.now() - bootStart;
  const wait = Math.max(0, BOOT_MIN_MS - elapsed);
  setTimeout(finish, wait);
}
let revealObserver = null;
let toolbarScrollHandler = null;
let shellReady = false;
let searchDebounce = null;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function permClass(perm) {
  if (!perm || perm === "Everyone") return "pill--perm-everyone";
  if (/admin/i.test(perm)) return "pill--perm-admin";
  return "pill--perm-mod";
}

function activeBotData() {
  return state.data;
}

function switchBot(botId) {
  const next = state.bots.find((bot) => bot.id === botId);
  if (!next) return;
  state.activeBot = botId;
  state.data = next.data;
  state.filter = "all";
  state.view = "commands";
  state.modalCmd = null;
  closeSidebar();
  render({ force: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function botInitials(name) {
  return String(name || "Bot")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "B";
}

function renderBotTabs() {
  if (!state.bots.length) return "";
  return `<div class="bot-tabs bot-tabs--brand" aria-label="Bot command tabs">${state.bots
    .map((bot) => {
      const counts = countCommands(bot.data);
      const active = bot.id === state.activeBot;
      return `<button class="sidebar__brand bot-brand-tab${active ? " active" : ""}" data-bot="${esc(bot.id)}" type="button" aria-label="Show ${esc(bot.data.botName)} commands">
        <div class="sidebar__logo">
          ${logoPicture("sidebar__logo-img", 52, 52, bot.data.botName)}
        </div>
        <div class="bot-brand-tab__copy">
          <div class="sidebar__title">${esc(bot.data.botName)}</div>
          <div class="sidebar__sub">${esc(bot.data.subtitle || `${counts.total} commands`)}</div>
        </div>
        <span class="bot-brand-tab__count">${counts.total}</span>
      </button>`;
    })
    .join("")}</div>`;
}


function countCommands(data) {
  let slash = 0;
  let prefix = 0;
  let systems = 0;
  let total = 0;
  for (const cat of data.categories) {
    for (const cmd of cat.commands) {
      total++;
      if (cmd.type === "slash") slash++;
      if (cmd.type === "prefix") prefix++;
    }
    if (cat.id === "systems") systems += cat.commands.length;
  }
  return { total, slash, prefix, systems };
}

function matches(cmd, q) {
  if (!q) return true;
  const hay = [
    cmd.name,
    cmd.description,
    cmd.usage,
    cmd.permission,
    cmd.notes,
    ...(cmd.aliases || []).map(aliasHaystack),
    ...(cmd.subcommands || []).map((s) => s.name + " " + s.description),
    ...(cmd.options || []).map((o) => o.name + " " + o.description),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function highlightText(text, query) {
  const raw = String(text ?? "");
  if (!query) return esc(raw);
  const q = query.trim();
  if (!q) return esc(raw);
  const lower = raw.toLowerCase();
  const needle = q.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) return esc(raw);
  const before = raw.slice(0, idx);
  const match = raw.slice(idx, idx + q.length);
  const after = raw.slice(idx + q.length);
  return `${esc(before)}<mark class="hi">${esc(match)}</mark>${highlightText(after, q)}`;
}

function visibleCommandCount() {
  if (!state.data) return 0;
  const q = state.query.trim().toLowerCase();
  let n = 0;
  for (const cat of state.data.categories) {
    if (state.filter !== "all" && state.filter !== cat.id) continue;
    n += cat.commands.filter((c) => matches(c, q)).length;
  }
  return n;
}

function cmdDisplayName(cmd) {
  const type = cmd.type || "system";
  if (type === "prefix") {
    const base = cmd.usage ? cmd.usage.split(" ")[0] : cmd.name;
    return String(base).replace(/^[.!?/$-]/, "");
  }
  return cmd.name;
}

function cmdCopyText(cmd) {
  const type = cmd.type || "system";
  if (type === "slash") return `/${cmd.name}`;
  if (type === "prefix") {
    const base = cmd.usage ? cmd.usage.split(" ")[0] : `.${cmd.name}`;
    return /^[.!?/$-]/.test(base) ? base : `${state.data?.prefix || "."}${base}`;
  }
  return cmd.name;
}

function cmdKey(cmd, catId) {
  return `${catId}:${cmd.name}:${cmd.type || "system"}`;
}

function isAdminAuthed() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function setAdminAuthed(on) {
  if (on) sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
  state.adminAuth = on;
}

function openAdminGate() {
  state.adminGateOpen = true;
  renderAdminGate();
}

function closeAdminGate() {
  state.adminGateOpen = false;
  document.getElementById("adminGate")?.remove();
}

function renderAdminGate() {
  document.getElementById("adminGate")?.remove();
  if (!state.adminGateOpen) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="admin-gate-backdrop" id="adminGate">
      <div class="admin-gate" role="dialog" aria-modal="true" aria-labelledby="adminGateTitle">
        <div class="admin-gate__icon" aria-hidden="true">🔐</div>
        <h2 class="admin-gate__title" id="adminGateTitle">Admin Dashboard</h2>
        <p class="admin-gate__sub">Enter your access code to continue.</p>
        <form id="adminGateForm" autocomplete="off">
          <div class="admin-gate__field">
            <input id="adminPassInput" type="password" placeholder="Access code" spellcheck="false" autocapitalize="off" />
            <button class="admin-gate__toggle" id="adminPassToggle" type="button" aria-label="Show password">👁</button>
          </div>
          <div class="admin-gate__error" id="adminGateError" aria-live="polite"></div>
          <div class="admin-gate__actions">
            <button class="btn btn--ghost" id="adminGateCancel" type="button">Cancel</button>
            <button class="btn" type="submit">Unlock</button>
          </div>
        </form>
      </div>
    </div>`,
  );

  const input = document.getElementById("adminPassInput");
  const form = document.getElementById("adminGateForm");
  const toggle = document.getElementById("adminPassToggle");

  input?.focus();

  toggle?.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "🙈" : "👁";
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  document.getElementById("adminGateCancel")?.addEventListener("click", closeAdminGate);
  document.getElementById("adminGate")?.addEventListener("click", (e) => {
    if (e.target.id === "adminGate") closeAdminGate();
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input?.value.trim() || "";
    const gate = document.querySelector(".admin-gate");
    const err = document.getElementById("adminGateError");

    if (val === ADMIN_PASS) {
      setAdminAuthed(true);
      if (typeof setAdminPassword === "function") setAdminPassword(val);
      closeAdminGate();
      state.view = "admin";
      closeSidebar();
      render();
      showToast("Admin access granted");
      return;
    }

    input?.classList.add("is-error");
    if (err) err.textContent = "Incorrect access code";
    gate?.classList.remove("is-shake");
    void gate?.offsetWidth;
    gate?.classList.add("is-shake");
    input?.select();
  });

  input?.addEventListener("input", () => {
    input.classList.remove("is-error");
    const err = document.getElementById("adminGateError");
    if (err) err.textContent = "";
  });
}

function collectAllCommands(data) {
  const rows = [];
  for (const cat of data.categories) {
    for (const cmd of cat.commands) {
      rows.push({ cmd, cat });
    }
  }
  return rows;
}

function permissionStats(data) {
  const map = new Map();
  for (const { cmd } of collectAllCommands(data)) {
    const key = cmd.permission || "—";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function renderAdminMain() {
  const counts = countCommands(state.data);
  const perms = permissionStats(state.data);

  const permRows = perms
    .map(
      ([perm, n]) =>
        `<tr><td>${esc(perm)}</td><td>${n}</td></tr>`,
    )
    .join("");

  return `
    <div class="admin-hero reveal is-visible">
      <h1>Admin Dashboard</h1>
      <p>Command reference overview for Veltrix · City of Angels. Session active until you sign out.</p>
    </div>

    <div class="admin-grid reveal is-visible">
      <div class="admin-card"><div class="admin-card__val">${counts.total}</div><div class="admin-card__label">Total commands</div></div>
      <div class="admin-card"><div class="admin-card__val">${counts.slash}</div><div class="admin-card__label">Slash</div></div>
      <div class="admin-card"><div class="admin-card__val">${counts.prefix}</div><div class="admin-card__label">Prefix</div></div>
      <div class="admin-card"><div class="admin-card__val">${state.data.categories.length}</div><div class="admin-card__label">Categories</div></div>
    </div>

    <div class="admin-panel reveal is-visible">
      <h3>Sync &amp; data</h3>
      <table class="admin-table">
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Last updated</td><td>${esc(state.data.updatedAt)}</td></tr>
        <tr><td>Package</td><td>${esc(state.data.package || "—")}</td></tr>
        <tr><td>Prefix</td><td><code>${esc(state.data.prefix)}</code></td></tr>
        <tr><td>Categories</td><td>${state.data.categories.length}</td></tr>
      </table>
    </div>

    <div class="admin-panel reveal is-visible">
      <h3>Permissions breakdown</h3>
      <table class="admin-table">
        <tr><th>Permission</th><th>Commands</th></tr>
        ${permRows}
      </table>
    </div>

    <div class="admin-actions reveal is-visible">
      <button class="btn" id="adminBackBtn" type="button">← Back to commands</button>
      <button class="btn btn--ghost" id="adminLogoutBtn" type="button">Sign out</button>
    </div>

    ${typeof renderAdminEditor === "function" ? renderAdminEditor() : ""}`;
}

function findCommand(key) {
  if (!state.data || !key) return null;
  for (const cat of state.data.categories) {
    for (const cmd of cat.commands) {
      if (cmdKey(cmd, cat.id) === key) return { cmd, cat };
    }
  }
  return null;
}

function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 2000);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${text}`);
  } catch {
    showToast("Couldn't copy");
  }
}

function aliasName(a) {
  return typeof a === "string" ? a : a.name;
}

function aliasLabel(a, type) {
  const name = aliasName(a);
  return type === "prefix" ? `.${name}` : name;
}

function aliasHaystack(a) {
  if (typeof a === "string") return a;
  return `${a.name} ${a.description || ""}`;
}

function navLabel(cat) {
  return cat.label
    .replace(" Commands", "")
    .replace("Automatic ", "");
}

function catIcon(id) {
  if (id === "all") return "◈";
  const cat = state.data?.categories.find((c) => c.id === id);
  return cat?.icon || "•";
}

function renderCard(cmd, catId) {
  const type = cmd.type || "system";
  const nameClass =
    type === "slash"
      ? "cmd-name cmd-name--slash"
      : type === "prefix"
        ? "cmd-name cmd-name--prefix"
        : "cmd-name cmd-name--system";
  const displayName = type === "system" ? cmd.name : cmdDisplayName(cmd);
  const key = cmdKey(cmd, catId);
  const hasMore = (cmd.subcommands || []).length || (cmd.options || []).length || cmd.notes;

  const perm = cmd.permission
    ? `<span class="pill ${permClass(cmd.permission)}">${esc(cmd.permission)}</span>`
    : "";

  const aliasPill =
    (cmd.aliases || []).length > 0
      ? `<span class="pill pill--alias">${esc((cmd.aliases || []).slice(0, 2).map((a) => aliasLabel(a, type)).join(", "))}${cmd.aliases.length > 2 ? " +" + (cmd.aliases.length - 2) : ""}</span>`
      : "";

  const q = state.query.trim();

  return `<article class="card card--${type} card--cat-${esc(catId)}" data-cmd="${esc(key)}">
    <div class="card__top">
      <div class="${nameClass}" style="--cmd-prefix: '${esc(state.data?.prefix || ".")}'">${highlightText(displayName, q)}</div>
      <div class="card__actions">
        <button class="icon-btn icon-btn--copy" data-copy="${esc(cmdCopyText(cmd))}" title="Copy command" type="button" aria-label="Copy command"></button>
        <span class="tag tag--${esc(type)}">${esc(type)}</span>
      </div>
    </div>
    <p class="card__desc">${highlightText(cmd.description || "", q)}</p>
    <div class="meta">${perm}${aliasPill}${cmd.usage ? `<span class="pill pill--usage">${esc(cmd.usage)}</span>` : ""}</div>
    ${hasMore ? `<button class="card__more" type="button">Details</button>` : ""}
  </article>`;
}

function renderModal() {
  const existing = document.getElementById("cmdModal");
  if (existing) existing.remove();
  if (!state.modalCmd) return;

  const { cmd } = state.modalCmd;
  const type = cmd.type || "system";
  const displayName = type === "system" ? cmd.name : cmdDisplayName(cmd);
  const copyVal = cmdCopyText(cmd);
  const modalNameClass =
    type === "slash" ? "modal__cmd modal__cmd--slash" : type === "prefix" ? "modal__cmd modal__cmd--prefix" : "modal__cmd";

  const subs = (cmd.subcommands || []).length
    ? `<div class="modal__block"><div class="modal__block-title">Subcommands</div><div class="modal__list">${cmd.subcommands
        .map((s) => `<div class="modal__row"><code>${esc(s.name)}</code><span>${esc(s.description)}</span></div>`)
        .join("")}</div></div>`
    : "";

  const opts = (cmd.options || []).length
    ? `<div class="modal__block"><div class="modal__block-title">Options</div><div class="modal__list">${cmd.options
        .map((o) => `<div class="modal__row"><code>${esc(o.name)}</code><span>${esc(o.description)}</span></div>`)
        .join("")}</div></div>`
    : "";

  const aliases = (cmd.aliases || []).length
    ? `<div class="modal__block"><div class="modal__block-title">Aliases</div><div class="modal__list">${cmd.aliases
        .map((a) => {
          const label = aliasLabel(a, type);
          const desc = typeof a === "object" && a.description ? a.description : "";
          return `<div class="modal__row modal__row--alias"><code>${esc(label)}</code>${desc ? `<span>${esc(desc)}</span>` : ""}</div>`;
        })
        .join("")}</div></div>`
    : "";

  const notes = cmd.notes
    ? `<div class="modal__block"><div class="modal__block-title">Notes</div><p class="modal__desc">${esc(cmd.notes)}</p></div>`
    : "";

  const perm = cmd.permission
    ? `<div class="modal__block"><div class="modal__block-title">Permission</div><span class="pill ${permClass(cmd.permission)}">${esc(cmd.permission)}</span></div>`
    : "";

  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="modal-backdrop" id="cmdModal">
      <div class="modal modal--${esc(type)}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal__head">
          <div>
            <div class="${modalNameClass}" id="modalTitle" style="--cmd-prefix: '${esc(state.data?.prefix || ".")}'">${esc(displayName)}</div>
            <span class="tag tag--${esc(type)}">${esc(type)}</span>
          </div>
          <button class="icon-btn" id="modalClose" type="button" aria-label="Close">&times;</button>
        </div>
        <div class="modal__body">
          <p class="modal__desc">${esc(cmd.description || "")}</p>
          <div class="modal__block">
            <div class="modal__block-title">Command</div>
            <div class="modal__copy-row">
              <span>${esc(copyVal)}</span>
              <button class="btn" data-copy="${esc(copyVal)}" type="button">Copy</button>
            </div>
          </div>
          ${perm}${aliases}${subs}${opts}${notes}
          <button class="btn btn--ghost" id="modalClose2" type="button" style="width:100%;margin-top:6px">Close</button>
        </div>
      </div>
    </div>`,
  );

  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  document.getElementById("modalClose2")?.addEventListener("click", closeModal);
  document.getElementById("cmdModal")?.addEventListener("click", (e) => {
    if (e.target.id === "cmdModal") closeModal();
  });
  document.querySelectorAll("#cmdModal [data-copy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(btn.dataset.copy);
    });
  });
}

function closeModal() {
  state.modalCmd = null;
  document.getElementById("cmdModal")?.remove();
}

function buildToolbarHtml() {
  const visible = visibleCommandCount();
  const filtering = state.query.trim() || state.filter !== "all";
  const countLabel = filtering
    ? `<span class="toolbar__count">${visible} command${visible === 1 ? "" : "s"}</span>`
    : `<span class="toolbar__hint">Press <kbd>/</kbd> to search</span>`;

  return `<div class="toolbar" id="toolbar">
    <div class="search">
      <span class="search__icon"></span>
      <input id="searchInput" type="search" placeholder="Search commands…" value="${esc(state.query)}" autocomplete="off" />
    </div>
    <div class="toolbar__right">
      <div class="filters">
      ${[["all", "All"], ["slash", "Slash"], ["prefix", "Prefix"], ["session", "Session"], ["systems", "Systems"]]
        .map(
          ([id, label]) =>
            `<button class="chip chip--${esc(id)}${state.filter === id ? " active" : ""}" data-filter="${esc(id)}" type="button"><span class="chip__icon" aria-hidden="true">${esc(catIcon(id))}</span>${label}</button>`,
        )
        .join("")}
      </div>
      ${countLabel}
    </div>
  </div>`;
}

function buildSectionsHtml() {
  const q = state.query.trim().toLowerCase();
  return state.data.categories
    .filter((cat) => state.filter === "all" || state.filter === cat.id)
    .map((cat) => {
      const cmds = cat.commands.filter((c) => matches(c, q));
      if (!cmds.length) return "";
      return `<section class="section section--${esc(cat.id)}" id="cat-${esc(cat.id)}">
        <div class="section__head">
          <span class="section__icon" aria-hidden="true">${esc(cat.icon || "•")}</span>
          <div class="section__titles">
            <h2>${esc(cat.label)}</h2>
            <p class="section__desc">${esc(cat.description)}</p>
          </div>
          <span class="section__count">${cmds.length}</span>
        </div>
        <div class="grid">${cmds.map((c) => renderCard(c, cat.id)).join("")}</div>
      </section>`;
    })
    .join("");
}

function buildCommandViewHtml() {
  if (state.view === "admin" && state.adminAuth) {
    return renderAdminMain();
  }
  if (state.view === "giveaways") {
    return renderGiveawaysView();
  }
  const sections = buildSectionsHtml();
  return `${buildToolbarHtml()}${sections || `<div class="empty"><div class="empty__icon" aria-hidden="true">⌕</div><p class="empty__title">No commands found</p><p class="empty__hint">Try another search term or switch the category filter.</p></div>`}`;
}

function syncNavActive() {
  document.querySelectorAll(".nav-link[data-filter]").forEach((btn) => {
    btn.classList.toggle("active", state.view === "commands" && state.filter === btn.dataset.filter);
  });
  document.getElementById("adminNavBtn")?.classList.toggle("active", state.view === "admin");
  document.getElementById("giveawaysNavBtn")?.classList.toggle("active", state.view === "giveaways");
}

function updateCommandView() {
  const root = document.getElementById("commandView");
  if (!root) {
    render({ force: true });
    return;
  }
  const hadSearchFocus = document.activeElement?.id === "searchInput";
  root.innerHTML = buildCommandViewHtml();
  syncNavActive();
  if (state.view === "admin" && state.adminAuth && typeof wireAdminEditor === "function") {
    wireAdminEditor();
  }
  if (!toolbarScrollHandler) initToolbarStick();
  if (hadSearchFocus) document.getElementById("searchInput")?.focus();
}

function render(opts = {}) {
  const app = document.getElementById("app");
  if (!state.data) {
    app.innerHTML = `<div class="loading"><div class="loader"></div></div>`;
    shellReady = false;
    return;
  }

  if (shellReady && !opts.force) {
    updateCommandView();
    renderModal();
    return;
  }

  const counts = countCommands(state.data);
  const prefix = state.data.prefix || ".";

  const navLinks = [
    ["all", "All", counts.total],
    ...state.data.categories.map((c) => [c.id, navLabel(c), c.commands.length]),
  ];

  const sections = buildSectionsHtml();

  app.innerHTML = `
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <button class="mobile-nav-toggle" id="navToggle" type="button" aria-label="Open menu">☰</button>
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        ${renderBotTabs()}
        <nav class="sidebar__nav">
          ${navLinks
            .map(
              ([id, label, count]) =>
                `<button class="nav-link nav-link--${esc(id)}${state.view === "commands" && state.filter === id ? " active" : ""}" data-filter="${esc(id)}" type="button">
                  <span class="nav-link__icon" aria-hidden="true">${esc(catIcon(id))}</span>
                  ${esc(label)}
                  <span class="nav-link__count">${count}</span>
                </button>`,
            )
            .join("")}
          <div class="sidebar__divider"></div>
          <button class="nav-link nav-link--giveaways${state.view === "giveaways" ? " active" : ""}" id="giveawaysNavBtn" type="button">
            <span class="nav-link__icon" aria-hidden="true">🎁</span>
            Active Giveaways
            <span class="nav-link__count">Live</span>
          </button>
          <button class="nav-link nav-link--admin${state.view === "admin" ? " active" : ""}" id="adminNavBtn" type="button">
            <span class="nav-link__icon nav-link__icon--lock"></span>
            Admin Dashboard
            ${state.adminAuth ? "" : `<span class="nav-link__lock">Locked</span>`}
          </button>
        </nav>
        <div class="sidebar__meta">
          Press <kbd>/</kbd> to search. Click a command for the full breakdown.
        </div>
      </aside>
      <main class="main">
        <div class="main__inner">
        <header class="hero">
          <div class="hero__row">
            <div class="hero__brand">
              ${logoPicture("hero__logo", 96, 96)}
              <div>
                <p class="hero__label">${esc(state.data.subtitle || "Bot commands")}</p>
                <h1><span>${esc(state.data.botName)}</span> commands</h1>
                <p class="hero__desc">
                  Slash commands, prefix commands, and automated features for ${esc(state.data.botName)}.
                  <span class="hero__prefix-wrap">Prefix <span class="hero__prefix-badge">${esc(prefix)}</span></span>
                </p>
              </div>
            </div>
            <div class="stats">
              <div class="stat stat--total"><div class="stat__val">${counts.total}</div><div class="stat__label">commands</div></div>
              <div class="stat stat--slash"><div class="stat__val">${counts.slash}</div><div class="stat__label">slash</div></div>
              <div class="stat stat--prefix"><div class="stat__val">${counts.prefix}</div><div class="stat__label">prefix</div></div>
              <div class="stat stat--systems"><div class="stat__val">${counts.systems}</div><div class="stat__label">auto</div></div>
            </div>
          </div>
        </header>

        <div id="commandView">
        ${state.view === "admin" && state.adminAuth ? renderAdminMain() : `${buildToolbarHtml()}${sections || `<div class="empty"><div class="empty__icon" aria-hidden="true">⌕</div><p class="empty__title">No commands found</p><p class="empty__hint">Try another search term or switch the category filter.</p></div>`}`}
        </div>

        <footer class="footer"><span class="footer__brand">${esc(state.data.botName)}</span> · Command center · Updated ${esc(state.data.updatedAt)}</footer>
        </div>
      </main>
    </div>`;

  shellReady = true;
  wireShellEvents();
  renderModal();
  renderAdminGate();
  initToolbarStick();
  initScrollTop();
  dismissBoot();
}

function initScrollTop() {
  const btn = document.getElementById("scrollTop");
  if (!btn || btn.dataset.wired === "1") return;
  btn.dataset.wired = "1";

  const onScroll = () => {
    btn.classList.toggle("hidden", window.scrollY < 480);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initReveal() {
  /* scroll reveal removed for performance — sections use content-visibility in CSS */
}

function initToolbarStick() {
  const toolbar = document.getElementById("toolbar");
  if (!toolbar) return;

  if (toolbarScrollHandler) window.removeEventListener("scroll", toolbarScrollHandler);

  toolbarScrollHandler = () => {
    toolbar.classList.toggle("is-stuck", window.scrollY > 100);
  };
  toolbarScrollHandler();
  window.addEventListener("scroll", toolbarScrollHandler, { passive: true });
}

function applyFilter(filterId, scrollToCategory) {
  state.view = "commands";
  state.filter = filterId;
  closeSidebar();
  updateCommandView();
  if (scrollToCategory && filterId !== "all") {
    document.getElementById(`cat-${filterId}`)?.scrollIntoView({ behavior: "smooth" });
  }
}

function wireShellEvents() {
  const app = document.getElementById("app");
  if (!app || app.dataset.wired === "1") return;
  app.dataset.wired = "1";

  app.addEventListener("input", (e) => {
    if (e.target.id !== "searchInput") return;
    state.query = e.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(updateCommandView, 100);
  });

  app.addEventListener("click", (e) => {
    const avatarBtn = e.target.closest(".entrant[data-avatar]");
    if (avatarBtn) {
      openAvatarViewer({ avatar: avatarBtn.dataset.avatar, name: avatarBtn.dataset.name, tag: avatarBtn.dataset.tag });
      return;
    }

    const botTab = e.target.closest(".bot-tab[data-bot]");
    if (botTab) {
      switchBot(botTab.dataset.bot);
      return;
    }

    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      e.stopPropagation();
      copyText(copyBtn.dataset.copy);
      return;
    }

    const chip = e.target.closest(".chip[data-filter]");
    if (chip) {
      applyFilter(chip.dataset.filter, false);
      return;
    }

    const navFilter = e.target.closest(".nav-link[data-filter]");
    if (navFilter) {
      applyFilter(navFilter.dataset.filter, true);
      return;
    }

    if (e.target.closest("#giveawaysNavBtn")) {
      openGiveawaysView();
      return;
    }

    if (e.target.closest("#giveawaysRefreshBtn") || e.target.closest("#giveawaysRetryBtn")) {
      loadGiveaways();
      return;
    }

    if (e.target.closest("#adminNavBtn")) {
      if (state.adminAuth) {
        state.view = "admin";
        closeSidebar();
        updateCommandView();
        syncNavActive();
        if (typeof wireAdminEditor === "function") wireAdminEditor();
      } else {
        openAdminGate();
      }
      return;
    }

    if (e.target.closest("#adminBackBtn")) {
      state.view = "commands";
      updateCommandView();
      syncNavActive();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (e.target.closest("#adminLogoutBtn")) {
      setAdminAuthed(false);
      sessionStorage.removeItem("vx_admin_pass");
      state.view = "commands";
      updateCommandView();
      syncNavActive();
      showToast("Signed out");
      return;
    }

    const moreBtn = e.target.closest(".card__more");
    const card = e.target.closest(".card[data-cmd]");
    if (moreBtn || card) {
      const target = moreBtn ? moreBtn.closest(".card[data-cmd]") : card;
      if (!target) return;
      if (moreBtn) e.stopPropagation();
      const found = findCommand(target.dataset.cmd);
      if (found) {
        state.modalCmd = found;
        renderModal();
      }
      return;
    }

    if (e.target.id === "navToggle") toggleSidebar();
    if (e.target.id === "sidebarOverlay") closeSidebar();
  });
}

function wireEvents() {
  /* legacy — shell uses delegated events */
}

function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("sidebarOverlay")?.classList.toggle("open");
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAvatarViewer();
    if (state.adminGateOpen) closeAdminGate();
    else closeModal();
  }
  if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && !state.adminGateOpen) {
    e.preventDefault();
    document.getElementById("searchInput")?.focus();
  }
});

function getEmbeddedJson(id) {
  const el = document.getElementById(id);
  if (!el?.textContent) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
}

async function fetchJsonFast(url, fallback) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(url, { cache: "force-cache", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

async function init() {
  state.adminAuth = isAdminAuthed();
  if (typeof getStoredAdminPassword === "function") {
    const p = getStoredAdminPassword();
    if (p) adminEditor.password = p;
  }

  try {
    const embeddedVeltrix = getEmbeddedJson("embeddedVeltrixCommands");
    const embeddedEcrp = getEmbeddedJson("embeddedEcrpCommands");
    const embeddedOverrides = getEmbeddedJson("embeddedAdminOverrides") || {};

    if (!embeddedVeltrix) throw new Error("Embedded command data is missing");

    state.bots = [
      { id: "veltrix", data: embeddedVeltrix },
      ...(embeddedEcrp ? [{ id: "ecrp", data: embeddedEcrp }] : []),
    ];
    state.activeBot = state.bots[0]?.id || "veltrix";
    state.data = state.bots[0]?.data || embeddedVeltrix;
    adminEditor.overrides = embeddedOverrides;
    if (typeof mergeAdminIntoState === "function") mergeAdminIntoState();
    render();

    Promise.all([
      fetchJsonFast("data/bot-commands.json?v=17", embeddedVeltrix),
      fetchJsonFast("data/admin-overrides.json?v=3", embeddedOverrides),
      fetchJsonFast("data/ecrp-commands.json?v=3", embeddedEcrp),
    ]).then(([veltrixData, overrides, ecrpData]) => {
      state.bots = [
        { id: "veltrix", data: veltrixData || embeddedVeltrix },
        ...(ecrpData ? [{ id: "ecrp", data: ecrpData }] : []),
      ];
      const active = state.bots.find((bot) => bot.id === state.activeBot) || state.bots[0];
      state.activeBot = active?.id || "veltrix";
      state.data = active?.data || veltrixData || embeddedVeltrix;
      adminEditor.overrides = overrides || {};
      if (typeof mergeAdminIntoState === "function") mergeAdminIntoState();
      render({ force: true });
    });
  } catch (err) {
    dismissBoot();
    document.getElementById("app").innerHTML = `<div class="empty" style="min-height:100vh;display:grid;place-items:center"><p>Couldn't load commands. ${esc(err.message)}</p></div>`;
    return;
  }
}

init();
