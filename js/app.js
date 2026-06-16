/* Veltrix · City of Angels */

const state = {
  data: null,
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
const BOOT_MIN_MS = 1800;
const bootStart = performance.now();

function logoPicture(className, w, h, alt = "") {
  const q = `?v=${LOGO_V}`;
  return `<picture class="${className}-wrap">
    <source srcset="assets/veltrix-logo-256.webp${q}" type="image/webp" />
    <img class="${className}" src="assets/veltrix-logo.png${q}" alt="${esc(alt)}" width="${w}" height="${h}" decoding="async" />
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
    sessionStorage.setItem("vx_boot_done", "1");
    setBootProgress(100);
    const status = document.getElementById("bootStatus");
    if (status) status.textContent = "Ready";
    boot.classList.add("is-exiting");
    boot.setAttribute("aria-busy", "false");
    setTimeout(() => {
      boot.classList.add("is-done");
      document.body.classList.add("is-ready");
      setTimeout(() => boot.remove(), 520);
    }, 420);
  };

  if (sessionStorage.getItem("vx_boot_done") === "1") {
    boot.dataset.dismissed = "1";
    boot.classList.add("is-done");
    document.body.classList.add("is-ready");
    boot.remove();
    return;
  }

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
    ...(cmd.aliases || []).map(aliasHaystack),
    ...(cmd.subcommands || []).map((s) => s.name + " " + s.description),
    ...(cmd.options || []).map((o) => o.name + " " + o.description),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function cmdDisplayName(cmd) {
  const type = cmd.type || "system";
  if (type === "prefix") {
    return cmd.usage ? cmd.usage.split(" ")[0].replace(/^\./, "") : cmd.name;
  }
  return cmd.name;
}

function cmdCopyText(cmd) {
  const type = cmd.type || "system";
  if (type === "slash") return `/${cmd.name}`;
  if (type === "prefix") {
    const base = cmd.usage ? cmd.usage.split(" ")[0] : `.${cmd.name}`;
    return base.startsWith(".") ? base : `.${base}`;
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
      ? `<span class="pill">${esc((cmd.aliases || []).slice(0, 2).map((a) => aliasLabel(a, type)).join(", "))}${cmd.aliases.length > 2 ? " +" + (cmd.aliases.length - 2) : ""}</span>`
      : "";

  return `<article class="card card--${type} card--cat-${esc(catId)}" data-cmd="${esc(key)}">
    <div class="card__top">
      <div class="${nameClass}">${esc(displayName)}</div>
      <div class="card__actions">
        <button class="icon-btn icon-btn--copy" data-copy="${esc(cmdCopyText(cmd))}" title="Copy command" type="button" aria-label="Copy command"></button>
        <span class="tag">${esc(type)}</span>
      </div>
    </div>
    <p class="card__desc">${esc(cmd.description || "")}</p>
    <div class="meta">${perm}${aliasPill}${cmd.usage ? `<span class="pill">${esc(cmd.usage)}</span>` : ""}</div>
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
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal__head">
          <div>
            <div class="${modalNameClass}" id="modalTitle">${esc(displayName)}</div>
            <span class="tag">${esc(type)}</span>
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
  return `<div class="toolbar" id="toolbar">
    <div class="search">
      <span class="search__icon"></span>
      <input id="searchInput" type="search" placeholder="Search commands…" value="${esc(state.query)}" autocomplete="off" />
    </div>
    <div class="filters">
      ${[["all", "All"], ["slash", "Slash"], ["prefix", "Prefix"], ["session", "Session"], ["systems", "Systems"]]
        .map(
          ([id, label]) =>
            `<button class="chip${state.filter === id ? " active" : ""}" data-filter="${esc(id)}" type="button">${label}</button>`,
        )
        .join("")}
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
      return `<section class="section" id="cat-${esc(cat.id)}">
        <div class="section__head">
          <h2>${esc(cat.label)}</h2>
          <span class="section__count">${cmds.length}</span>
        </div>
        <p class="section__desc">${esc(cat.description)}</p>
        <div class="grid">${cmds.map((c) => renderCard(c, cat.id)).join("")}</div>
      </section>`;
    })
    .join("");
}

function buildCommandViewHtml() {
  if (state.view === "admin" && state.adminAuth) {
    return renderAdminMain();
  }
  const sections = buildSectionsHtml();
  return `${buildToolbarHtml()}${sections || `<div class="empty"><p>No commands match that search.</p></div>`}`;
}

function syncNavActive() {
  document.querySelectorAll(".nav-link[data-filter]").forEach((btn) => {
    btn.classList.toggle("active", state.view === "commands" && state.filter === btn.dataset.filter);
  });
  document.getElementById("adminNavBtn")?.classList.toggle("active", state.view === "admin");
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
        <div class="sidebar__brand">
          <div class="sidebar__logo">
            ${logoPicture("sidebar__logo-img", 52, 52, "Veltrix")}
          </div>
          <div>
            <div class="sidebar__title">${esc(state.data.botName)}</div>
            <div class="sidebar__sub">${esc(state.data.subtitle)}</div>
          </div>
        </div>
        <nav class="sidebar__nav">
          ${navLinks
            .map(
              ([id, label, count]) =>
                `<button class="nav-link${state.view === "commands" && state.filter === id ? " active" : ""}" data-filter="${esc(id)}" type="button">
                  <span class="nav-link__dot"></span>${esc(label)}
                  <span class="nav-link__count">${count}</span>
                </button>`,
            )
            .join("")}
          <div class="sidebar__divider"></div>
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
                <p class="hero__label">City of Angels</p>
                <h1><span>Veltrix</span> commands</h1>
                <p class="hero__desc">
                  Slash commands, prefix commands, and automated features.
                  <span class="hero__prefix-wrap">Prefix <span class="hero__prefix-badge">${esc(prefix)}</span></span>
                </p>
              </div>
            </div>
            <div class="stats">
              <div class="stat"><div class="stat__val">${counts.total}</div><div class="stat__label">commands</div></div>
              <div class="stat"><div class="stat__val">${counts.slash}</div><div class="stat__label">slash</div></div>
              <div class="stat"><div class="stat__val">${counts.prefix}</div><div class="stat__label">prefix</div></div>
            </div>
          </div>
        </header>

        <div id="commandView">
        ${state.view === "admin" && state.adminAuth ? renderAdminMain() : `${buildToolbarHtml()}${sections || `<div class="empty"><p>No commands match that search.</p></div>`}`}
        </div>

        <footer class="footer">Updated ${esc(state.data.updatedAt)} · Veltrix · City of Angels</footer>
        </div>
      </main>
    </div>`;

  shellReady = true;
  wireShellEvents();
  renderModal();
  renderAdminGate();
  initToolbarStick();
  dismissBoot();
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
    if (state.adminGateOpen) closeAdminGate();
    else closeModal();
  }
  if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && !state.adminGateOpen) {
    e.preventDefault();
    document.getElementById("searchInput")?.focus();
  }
});

async function init() {
  state.adminAuth = isAdminAuthed();
  if (typeof getStoredAdminPassword === "function") {
    const p = getStoredAdminPassword();
    if (p) adminEditor.password = p;
  }

  try {
    const [cmdRes, overrideRes] = await Promise.all([
      fetch("data/bot-commands.json?v=14", { cache: "no-store" }),
      fetch("data/admin-overrides.json?v=1", { cache: "no-store" }),
    ]);
    if (!cmdRes.ok) throw new Error("Failed to load commands");
    state.data = await cmdRes.json();
    if (overrideRes.ok) adminEditor.overrides = await overrideRes.json();
    else if (typeof loadAdminOverrides === "function") await loadAdminOverrides();
    if (typeof mergeAdminIntoState === "function") mergeAdminIntoState();
  } catch (err) {
    dismissBoot();
    document.getElementById("app").innerHTML = `<div class="empty" style="min-height:100vh;display:grid;place-items:center"><p>Couldn't load commands. ${esc(err.message)}</p></div>`;
    return;
  }
  render();
}

init();
