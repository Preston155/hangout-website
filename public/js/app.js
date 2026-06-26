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
const BOOT_MIN_MS = 120;
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
  return `<div class="bot-tabs" aria-label="Bot command tabs">${state.bots
    .map((bot) => {
      const counts = countCommands(bot.data);
      const active = bot.id === state.activeBot;
      return `<button class="bot-tab${active ? " active" : ""}" data-bot="${esc(bot.id)}" type="button">
        <span class="bot-tab__mark">${bot.id === "ecrp" ? "<img src=\"assets/veltrix-logo-256.webp?v=8\" alt=\"\" />" : "<img src=\"assets/veltrix-logo-256.webp?v=8\" alt=\"\" />"}</span>
        <span class="bot-tab__text"><strong>${esc(bot.data.botName)}</strong><small>${esc(bot.data.subtitle || `${counts.total} commands`)}</small></span>
        <span class="bot-tab__count">${counts.total}</span>
      </button>`;
    })
    .join("")}</div>`;
}


function formatGiveawayTime(ms) {
  if (!ms) return "Unknown";
  try {
    return new Date(Number(ms)).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "Unknown";
  }
}

function giveawayTimeLeft(giveaway) {
  if (giveaway.status === "paused") return "Paused";
  const end = Number(giveaway.endTime || 0);
  if (!end) return "No end time";
  const diff = end - Date.now();
  if (diff <= 0) return "Ending soon";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ${mins % 60}m left`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h left`;
}

function renderEntrants(giveaway) {
  const entrants = giveaway.entries?.visible || [];
  if (!entrants.length) return `<div class="giveaway-entrants giveaway-entrants--empty">No one has joined yet.</div>`;
  return `<div class="giveaway-entrants">${entrants.slice(0, 24).map((entry, index) => {
    const user = entry.user || {};
    const label = user.displayName || user.username || entry.userId;
    const avatar = user.avatarUrl || "";
    return `<button class="entrant" type="button" data-avatar="${esc(avatar)}" data-name="${esc(label)}" data-tag="${esc(user.tag || entry.userId)}" title="View ${esc(label)}'s profile picture">
      <span class="entrant__rank">#${index + 1}</span>
      <span class="entrant__pfp-wrap">${avatar ? `<img class="entrant__pfp" src="${esc(avatar)}" alt="" loading="lazy" />` : `<span class="entrant__avatar">?</span>`}</span>
      <span class="entrant__info"><span class="entrant__name">${esc(label)}</span><small>${esc(user.tag || entry.userId)}</small></span>
      ${entry.weight > 1 ? `<b class="entrant__weight">×${entry.weight}</b>` : ""}
    </button>`;
  }).join("")}${entrants.length > 24 ? `<div class="entrant entrant--more">+${entrants.length - 24} more joined</div>` : ""}</div>`;
}

function openAvatarViewer({ avatar, name, tag }) {
  document.getElementById("avatarViewer")?.remove();
  const safeName = esc(name || "Discord User");
  const safeTag = esc(tag || "");
  const safeAvatar = esc(avatar || "");
  document.body.insertAdjacentHTML("beforeend", `<div class="avatar-viewer" id="avatarViewer" role="dialog" aria-modal="true" aria-label="Discord profile picture viewer">
    <div class="avatar-viewer__card">
      <button class="avatar-viewer__close" id="avatarViewerClose" type="button" aria-label="Close">×</button>
      <div class="avatar-viewer__ring">
        ${safeAvatar ? `<img src="${safeAvatar}" alt="${safeName} profile picture" />` : `<span>?</span>`}
      </div>
      <h3>${safeName}</h3>
      ${safeTag ? `<p>${safeTag}</p>` : ""}
      ${safeAvatar ? `<a class="btn" href="${safeAvatar}" target="_blank" rel="noreferrer">Open full size</a>` : ""}
    </div>
  </div>`);
  document.getElementById("avatarViewerClose")?.addEventListener("click", closeAvatarViewer);
  document.getElementById("avatarViewer")?.addEventListener("click", (event) => {
    if (event.target.id === "avatarViewer") closeAvatarViewer();
  });
}

function closeAvatarViewer() {
  document.getElementById("avatarViewer")?.remove();
}

function giveawayMessageUrl(giveaway) {
  if (!giveaway.guildId || !giveaway.channelId || !giveaway.messageId) return "";
  return `https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`;
}

function renderGiveawayEmbedPreview(giveaway) {
  const entries = Number(giveaway.entries?.users || 0);
  const weighted = Number(giveaway.entries?.weighted || 0);
  const winners = Number(giveaway.winnerCount || 0);
  const messageUrl = giveawayMessageUrl(giveaway);
  const image = giveaway.imageUrl ? `<img class="giveaway-embed__image" src="${esc(giveaway.imageUrl)}" alt="Giveaway image" loading="lazy" />` : "";
  return `<div class="giveaway-embed" role="group" aria-label="Giveaway embed preview">
    <div class="giveaway-embed__bar"></div>
    <div class="giveaway-embed__body">
      <div class="giveaway-embed__header">
        <span class="giveaway-embed__bot">${esc(giveaway.botName || "Unknown bot")}</span>
        <span class="giveaway-status giveaway-status--${esc(giveaway.status || "active")}">${esc(giveaway.status || "active")}</span>
      </div>
      <h2>🎉 ${esc(giveaway.prize || "Untitled giveaway")}</h2>
      ${giveaway.description ? `<p class="giveaway-desc">${esc(giveaway.description)}</p>` : `<p class="giveaway-desc giveaway-desc--muted">No extra description set.</p>`}
      <div class="giveaway-embed__fields">
        <div><small>Hosted by</small><strong>${esc(giveaway.hostName || "Unknown")}</strong></div>
        <div><small>Ends</small><strong>${esc(formatGiveawayTime(giveaway.endTime))}</strong></div>
        <div><small>Time left</small><strong>${esc(giveawayTimeLeft(giveaway))}</strong></div>
        <div><small>Winners</small><strong>${winners}</strong></div>
      </div>
      <div class="giveaway-embed__stats">
        <span>🎟️ <b>${entries}</b> joined</span>
        <span>✨ <b>${weighted}</b> entries</span>
        <span>🤖 <b>${esc(giveaway.botName || "Bot")}</b></span>
      </div>
      ${image}
      <div class="giveaway-embed__footer">
        <span>ID: ${esc(giveaway.id || "unknown")}</span>
        ${messageUrl ? `<a href="${esc(messageUrl)}" target="_blank" rel="noreferrer">Open Discord message ↗</a>` : ""}
      </div>
    </div>
  </div>`;
}

function renderGiveawaysView() {
  if (state.giveawaysLoading && !state.giveaways) {
    return `<div class="toolbar"><div class="toolbar__hint">Loading active giveaways…</div></div><div class="giveaway-loading"><div class="loader"></div></div>`;
  }
  if (state.giveawaysError) {
    return `<div class="empty"><div class="empty__icon" aria-hidden="true">!</div><p class="empty__title">Couldn\'t load giveaways</p><p class="empty__hint">${esc(state.giveawaysError)}</p><button class="btn" id="giveawaysRetryBtn" type="button">Retry</button></div>`;
  }
  const payload = state.giveaways || { giveaways: [], updatedAt: null };
  const giveaways = payload.giveaways || [];
  const updated = payload.updatedAt ? new Date(payload.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "just now";
  const totalJoined = giveaways.reduce((sum, giveaway) => sum + Number(giveaway.entries?.users || 0), 0);
  const cards = giveaways.map((giveaway) => `<article class="giveaway-card giveaway-card--${esc(giveaway.status)}">
    <div class="giveaway-card__main">
      ${renderGiveawayEmbedPreview(giveaway)}
      <aside class="giveaway-join-panel">
        <div class="giveaway-join-panel__head">
          <div>
            <span class="giveaway-section-title">Joined users</span>
            <strong>${Number(giveaway.entries?.users || 0)} member${Number(giveaway.entries?.users || 0) === 1 ? "" : "s"}</strong>
          </div>
          <span class="giveaway-join-panel__badge">${Number(giveaway.entries?.weighted || 0)} entries</span>
        </div>
        ${renderEntrants(giveaway)}
      </aside>
    </div>
  </article>`).join("");
  return `<div class="giveaway-head">
    <div><p class="hero__label">Live giveaway tracker</p><h1><span>Active</span> giveaways</h1><p class="hero__desc">Discord-style giveaway previews, joined users, hosts, and the bot running each giveaway.</p></div>
    <button class="btn" id="giveawaysRefreshBtn" type="button">Refresh</button>
  </div>
  <div class="giveaway-summary">
    <div><strong>${giveaways.length}</strong><span>active/paused</span></div>
    <div><strong>${totalJoined}</strong><span>joined users</span></div>
    <div><strong>${esc(updated)}</strong><span>last update</span></div>
  </div>
  ${cards || `<div class="empty"><div class="empty__icon" aria-hidden="true">🎁</div><p class="empty__title">No active giveaways right now</p><p class="empty__hint">When ECRP or Veltrix starts one, it will show here.</p></div>`}`;
}

async function loadGiveaways({ silent = false } = {}) {
  if (state.giveawaysLoading) return;
  state.giveawaysLoading = true;
  if (!silent) {
    state.giveawaysError = "";
    updateCommandView();
  }
  try {
    const res = await fetch("https://api.prestonhq.com/api/giveaways/active", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "API returned an error");
    state.giveaways = json.data;
    state.giveawaysError = "";
  } catch (error) {
    state.giveawaysError = error.message || "Unknown error";
  } finally {
    state.giveawaysLoading = false;
    if (state.view === "giveaways") updateCommandView();
  }
}

function startGiveawayRefresh() {
  clearInterval(state.giveawaysTimer);
  state.giveawaysTimer = setInterval(() => {
    if (state.view === "giveaways") loadGiveaways({ silent: true });
  }, 30000);
}

function openGiveawaysView() {
  state.view = "giveaways";
  closeSidebar();
  updateCommandView();
  loadGiveaways({ silent: !!state.giveaways });
  startGiveawayRefresh();
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
