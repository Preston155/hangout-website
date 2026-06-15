/* ER:LC CAD / MDT — Single Page Application */

const state = {
  user: null,
  config: { serverName: "Liberty County CAD", serverLogo: "" },
  view: "landing",
  stats: null,
  recordsTab: "vehicles",
};

window.__CAD_STATE__ = state;

function isDesktopApp() {
  return !!window.desktopApp?.isDesktop;
}

const LIVE_VIEWS = new Set(["dashboard", "dispatch", "police", "fire", "calls", "units", "bolos"]);
let livePollTimer = null;
let clockTimer = null;

// ─── Utils ────────────────────────────────────────────────────────────────────

function toast(msg, type = "success") {
  const stack = document.getElementById("toastStack");
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  stack.append(el);
  setTimeout(() => el.remove(), 3500);
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
window.esc = esc;

function priorityBadge(p) {
  return `<span class="badge badge--p${p}">P${p}</span>`;
}
window.priorityBadge = priorityBadge;

function statusBadge(s) {
  const map = { pending: "pending", active: "active", closed: "closed", panic: "panic", available: "active", enroute: "pending", onscene: "active" };
  return `<span class="badge badge--${map[s] || "closed"}">${esc(s)}</span>`;
}
window.statusBadge = statusBadge;

function modal(title, bodyHtml, onSubmit) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <h3 class="modal__title">${esc(title)}</h3>
      <div class="modal__body">${bodyHtml}</div>
      <div class="modal__actions">
        <button class="btn btn--ghost" data-cancel>Cancel</button>
        <button class="btn btn--primary" data-submit>Save</button>
      </div>
    </div>`;
  document.body.append(backdrop);
  backdrop.querySelector("[data-cancel]").onclick = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector("[data-submit]").onclick = async () => {
    try {
      await onSubmit(backdrop);
      backdrop.remove();
    } catch (err) {
      toast(err.message, "error");
    }
  };
  return backdrop;
}

function navigate(view) {
  state.view = view;
  location.hash = view;
  render();
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function renderLanding() {
  return `
    <div class="landing page-enter">
      <nav class="landing__nav">
        <div class="landing__brand">
          <div class="landing__brand-icon">🚔</div>
          <div>
            <div>${esc(state.config.serverName)}</div>
            <div class="landing__status"><span class="landing__status-dot"></span> System Online</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <a class="btn btn--ghost" href="downloads/Liberty-County-CAD-Setup.exe" download>📥 Desktop App</a>
          <button class="btn btn--primary" onclick="navigate('login')">Sign In →</button>
        </div>
      </nav>

      <div class="landing__hero-wrap">
        <div class="landing__hero-text">
          <div class="landing__tag"><span class="landing__status-dot"></span> ER:LC Roleplay CAD</div>
          <h1><span class="highlight">ER:LC</span> CAD / MDT</h1>
          <p>The professional dispatch and mobile data terminal built for Emergency Response: Liberty County servers. Real-time 911, unit tracking, and full MDT access.</p>
          <div class="landing__actions">
            <button class="btn btn--primary" onclick="navigate('login')">⚡ Access CAD System</button>
            <a class="btn btn--ghost" href="downloads/Liberty-County-CAD-Setup.exe" download>Download Desktop App</a>
          </div>
        </div>

        <div class="landing__mockup">
          <div class="landing__mockup-glow"></div>
          <div class="cad-preview">
            <div class="cad-preview__bar">
              <span class="cad-preview__dot cad-preview__dot--r"></span>
              <span class="cad-preview__dot cad-preview__dot--y"></span>
              <span class="cad-preview__dot cad-preview__dot--g"></span>
              <span style="margin-left:8px">LC-DISPATCH // LIVE</span>
            </div>
            <div class="cad-preview__body">
              <div class="cad-preview__row"><span class="badge badge--p1">P1</span><span>10-80 · Armed Robbery · Main St</span><span class="badge badge--active">ACTIVE</span></div>
              <div class="cad-preview__row"><span class="badge badge--p2">P2</span><span>10-50 · MVA · Highway 1</span><span class="badge badge--pending">PENDING</span></div>
              <div class="cad-preview__row"><span class="badge badge--p3">P3</span><span>10-16 · Welfare Check · Oak Ave</span><span class="badge badge--active">ACTIVE</span></div>
              <div class="cad-preview__row"><span style="color:var(--success)">LCSO-7</span><span>Unit Available · Patrol</span><span class="badge badge--active">10-8</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="landing__features stagger">
        <div class="feature-card"><div class="feature-card__icon">📡</div><h3>Live Dispatch</h3><p>Real-time 911 call queue, unit assignment, and priority management.</p></div>
        <div class="feature-card"><div class="feature-card__icon">🚔</div><h3>Police MDT</h3><p>NCIC-style name & plate search, citations, warrants, and BOLOs.</p></div>
        <div class="feature-card"><div class="feature-card__icon">🚑</div><h3>Fire & EMS</h3><p>Medical calls, patient care reports, and transport tracking.</p></div>
        <div class="feature-card"><div class="feature-card__icon">👤</div><h3>Civilian Portal</h3><p>Character registration, vehicle records, and 911 submission.</p></div>
      </div>
    </div>`;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function renderLogin() {
  const err = new URLSearchParams(location.search).get("error");
  const errMsg = { discord_not_configured: "Discord login not configured.", oauth_failed: "Discord login failed.", no_code: "Login cancelled." }[err] || "";
  return `
    <div class="login-page page-enter">
      <div class="login-wrap">
        <div class="login-brand">
          <div class="login-brand__icon">🚔</div>
          <h2>${esc(state.config.serverName)}</h2>
          <p>Secure access to the Liberty County Computer-Aided Dispatch and Mobile Data Terminal system.</p>
          <div class="login-brand__features">
            <div class="login-brand__feat"><span>▸</span> Real-time dispatch console</div>
            <div class="login-brand__feat"><span>▸</span> Full police & fire MDT</div>
            <div class="login-brand__feat"><span>▸</span> Civilian self-service portal</div>
            <div class="login-brand__feat"><span>▸</span> Discord OAuth supported</div>
          </div>
        </div>
        <div class="login-card">
          <h2>Terminal Login</h2>
          <p>Authenticate to access your department modules.</p>
          ${errMsg ? `<div class="login-error">⚠ ${esc(errMsg)}</div>` : ""}
          <a class="btn btn--discord btn--block" href="/auth/discord">Continue with Discord</a>
          <div class="login-divider">dev access</div>
          <form id="devLoginForm">
            <div class="field"><label>Username</label><input name="username" value="admin" required autocomplete="username" /></div>
            <div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password" /></div>
            <button class="btn btn--primary btn--block" type="submit">Sign In to CAD</button>
          </form>
          ${isDesktopApp() ? "" : `<button class="btn btn--ghost btn--block" style="margin-top:12px" onclick="navigate('landing')">← Back to Home</button>`}
        </div>
      </div>
    </div>`;
}

async function wireLogin() {
  document.getElementById("devLoginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await API.post("/auth/dev-login", { username: fd.get("username"), password: fd.get("password") });
      state.user = res.user;
      toast("Signed in successfully.");
      navigate("dashboard");
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊", roles: ["all"] },
  { id: "civilian", label: "Civilian Portal", icon: "👤", roles: ["civilian", "admin"] },
  { id: "police", label: "Police MDT", icon: "🚔", roles: ["police", "admin"] },
  { id: "fire", label: "Fire / EMS", icon: "🚑", roles: ["fire", "ems", "admin"] },
  { id: "dispatch", label: "Dispatch", icon: "📡", roles: ["dispatch", "admin"] },
  { id: "admin", label: "Admin Panel", icon: "⚙️", roles: ["admin"] },
];

const DESKTOP_NAV = [
  {
    section: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "📊", roles: ["all"] },
      { id: "dispatch", label: "Dispatch Console", icon: "📡", roles: ["dispatch", "admin"] },
      { id: "calls", label: "Active Calls", icon: "📞", roles: ["dispatch", "police", "fire", "ems", "admin"] },
      { id: "units", label: "Units & Status", icon: "🚓", roles: ["police", "fire", "ems", "dispatch", "admin"] },
    ],
  },
  {
    section: "Mobile Data Terminal",
    items: [
      { id: "police", label: "Police MDT", icon: "🚔", roles: ["police", "admin"] },
      { id: "fire", label: "Fire / EMS MDT", icon: "🚑", roles: ["fire", "ems", "admin"] },
      { id: "civilian", label: "Civilian Portal", icon: "👤", roles: ["civilian", "admin"] },
    ],
  },
  {
    section: "Records & Lookup",
    items: [
      { id: "person-lookup", label: "Person Lookup", icon: "🔎", roles: ["police", "dispatch", "admin"] },
      { id: "vehicle-lookup", label: "Vehicle Lookup", icon: "🚗", roles: ["police", "dispatch", "admin"] },
      { id: "warrants", label: "Warrants", icon: "⚠️", roles: ["police", "dispatch", "admin"] },
      { id: "bolos", label: "BOLOs", icon: "📋", roles: ["police", "dispatch", "admin"] },
      { id: "citations", label: "Citations", icon: "📝", roles: ["police", "admin"] },
      { id: "arrests", label: "Arrest Reports", icon: "🔗", roles: ["police", "admin"] },
      { id: "incidents", label: "Incident Reports", icon: "📁", roles: ["dispatch", "police", "admin"] },
    ],
  },
  {
    section: "Administration",
    items: [
      { id: "admin", label: "Admin Panel", icon: "⚙️", roles: ["admin"] },
      { id: "departments", label: "Departments", icon: "🏛️", roles: ["admin"] },
      { id: "users", label: "User Management", icon: "👥", roles: ["admin"] },
    ],
  },
];

function canAccess(item) {
  if (!state.user) return false;
  if (item.roles.includes("all")) return true;
  return item.roles.includes(state.user.role);
}

function renderShell(content, title, badge = "CAD") {
  const navItems = NAV.filter(canAccess);
  let navHtml = "";

  if (isDesktopApp()) {
    navHtml = DESKTOP_NAV.map((group) => {
      const items = group.items.filter(canAccess);
      if (!items.length) return "";
      return `<div class="nav-section">${group.section}</div>${items
        .map(
          (item) =>
            `<button class="nav-item${state.view === item.id ? " active" : ""}" onclick="navigate('${item.id}');document.getElementById('sidebar')?.classList.remove('open')">
              <span class="nav-item__icon">${item.icon}</span>${item.label}
            </button>`,
        )
        .join("")}`;
    }).join("");

    navHtml += `<div class="sidebar__panic">
      <button class="btn btn--danger btn--block sidebar__panic-btn" onclick="setUnitStatus('panic')">⚠ PANIC BUTTON</button>
    </div>`;
  } else {
    navHtml = `<div class="nav-section">Modules</div>${navItems
      .map(
        (item) =>
          `<button class="nav-item${state.view === item.id ? " active" : ""}" onclick="navigate('${item.id}');document.getElementById('sidebar')?.classList.remove('open')">
            <span class="nav-item__icon">${item.icon}</span>${item.label}
          </button>`,
      )
      .join("")}`;
  }

  const profileHtml = isDesktopApp()
    ? `<div class="sidebar__profile-card">
          <div class="sidebar__profile-avatar">${esc((state.user?.displayName || "?")[0])}</div>
          <div>
            <div class="sidebar__user-name">${esc(state.user?.displayName)}</div>
            <div class="sidebar__user-role">${esc(state.user?.role)}</div>
            ${state.user?.departmentName ? `<div class="sidebar__user-dept">${esc(state.user.departmentName)}</div>` : ""}
          </div>
        </div>
        <div class="sidebar__profile-actions">
          <button class="btn btn--ghost btn--sm" onclick="DesktopShell?.openSettings()">Settings</button>
          <button class="btn btn--ghost btn--sm" onclick="logout()">Sign Out</button>
        </div>`
    : `<div class="sidebar__user-name">${esc(state.user?.displayName)}</div>
          <div class="sidebar__user-role">${esc(state.user?.role)}</div>
          ${state.user?.departmentName ? `<div class="sidebar__user-dept">${esc(state.user.departmentName)}</div>` : ""}
          <button class="btn btn--ghost btn--sm btn--block" style="margin-top:12px" onclick="logout()">Sign Out</button>`;

  return `
    <div class="shell${isDesktopApp() ? " shell--desktop" : ""}">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__brand-icon">🚔</div>
          <div class="sidebar__brand-text">
            ${esc(state.config.serverName)}
            <div class="sidebar__brand-sub">CAD / MDT v${esc(window.desktopApp?.version || "2.0")}</div>
          </div>
          <span class="sidebar__brand-dot" title="System online"></span>
        </div>
        <nav class="sidebar__nav">${navHtml}</nav>
        <div class="sidebar__user">${profileHtml}</div>
      </aside>
      <div class="sidebar-overlay" onclick="document.getElementById('sidebar').classList.remove('open')"></div>
      <div class="main">
        <header class="topbar">
          <div class="topbar__left">
            <button class="mobile-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
            <h1>${esc(title)}</h1>
            <span class="topbar__badge">${esc(badge)}</span>
          </div>
          <div class="topbar__right">
            ${isDesktopApp() ? `<span class="topbar__dept">${esc(state.user?.departmentName || state.user?.role || "")}</span>` : ""}
            <div class="topbar__clock" id="liveClock">--:--:--</div>
            ${LIVE_VIEWS.has(state.view) ? `<span class="live-badge"><span class="live-badge__dot"></span>LIVE</span>` : ""}
          </div>
        </header>
        <div class="content">${content}</div>
      </div>
    </div>`;
}
window.renderShell = renderShell;

async function logout() {
  await API.post("/auth/logout");
  state.user = null;
  navigate(isDesktopApp() ? "login" : "landing");
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function renderDashboardView() {
  let stats = { activeCalls: 0, activeUnits: 0, activeBolos: 0, activeWarrants: 0 };
  try {
    const res = await API.get("/dashboard/stats");
    stats = res.stats;
  } catch { /* ignore */ }

  const modules = NAV.filter((n) => n.id !== "dashboard" && canAccess(n));
  const moduleCards = modules.map((m) =>
    `<div class="module-card" onclick="navigate('${m.id}')">
      <div class="module-card__icon">${m.icon}</div>
      <div class="module-card__title">${m.label}</div>
      <div class="module-card__desc">Open ${m.label.toLowerCase()}</div>
      <span class="module-card__arrow">→</span>
    </div>`,
  ).join("");

  return renderShell(`
    <div class="grid grid--4 stagger" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-card__icon">📞</div><div class="stat-card__value">${stats.activeCalls}</div><div class="stat-card__label">Active Calls</div></div>
      <div class="stat-card"><div class="stat-card__icon">📡</div><div class="stat-card__value">${stats.activeUnits}</div><div class="stat-card__label">Units Online</div></div>
      <div class="stat-card"><div class="stat-card__icon">🔍</div><div class="stat-card__value">${stats.activeBolos}</div><div class="stat-card__label">Active BOLOs</div></div>
      <div class="stat-card"><div class="stat-card__icon">⚠️</div><div class="stat-card__value">${stats.activeWarrants}</div><div class="stat-card__label">Warrants</div></div>
    </div>
    <div class="card__title" style="margin-bottom:14px;padding-bottom:0;border:none">Department Modules</div>
    <div class="grid grid--3 stagger">${moduleCards}</div>
  `, "Dashboard", "HOME");
}

// ─── Civilian ─────────────────────────────────────────────────────────────────

async function renderCivilianView() {
  let chars = [];
  try { chars = (await API.get("/characters/mine")).characters; } catch { /* */ }

  const charRows = chars.map((c) =>
    `<tr>
      <td>${esc(c.firstName)} ${esc(c.lastName)}</td>
      <td>${esc(c.dob || "—")}</td>
      <td>${esc(c.phone || "—")}</td>
      <td><button class="btn btn--ghost btn--sm" onclick="viewRecords(${c.id})">Records</button>
          <button class="btn btn--ghost btn--sm" onclick="editCharacter(${c.id})">Edit</button></td>
    </tr>`,
  ).join("") || `<tr><td colspan="4" class="empty-state">No characters yet.</td></tr>`;

  return renderShell(`
    <div class="grid grid--2">
      <div class="card">
        <div class="card__title">My Characters</div>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>DOB</th><th>Phone</th><th></th></tr></thead><tbody>${charRows}</tbody></table></div>
        <button class="btn btn--primary" style="margin-top:14px" onclick="createCharacter()">+ New Character</button>
      </div>
      <div class="card">
        <div class="card__title">Submit 911 Call</div>
        <form id="civilian911Form">
          <div class="field"><label>Location</label><input name="location" required placeholder="123 Main St, Liberty County" /></div>
          <div class="field"><label>Emergency Type</label>
            <select name="type"><option value="police">Police</option><option value="fire">Fire</option><option value="medical">Medical</option></select>
          </div>
          <div class="field"><label>Description</label><textarea name="description" required placeholder="Describe the emergency..."></textarea></div>
          <button class="btn btn--danger btn--block" type="submit">🚨 SUBMIT 911 CALL</button>
        </form>
      </div>
    </div>
    <div id="recordsPanel" class="card" style="margin-top:16px;display:none"></div>
  `, "Civilian Portal", "CIV");
}

async function wireCivilian() {
  document.getElementById("civilian911Form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await API.post("/calls", { location: fd.get("location"), description: fd.get("description"), type: fd.get("type"), priority: 2 });
      toast("911 call submitted!");
      e.target.reset();
    } catch (err) { toast(err.message, "error"); }
  });
}

window.createCharacter = () => {
  const m = modal("New Character", `
    <div class="field"><label>First Name</label><input id="cFirst" required /></div>
    <div class="field"><label>Last Name</label><input id="cLast" required /></div>
    <div class="field"><label>Date of Birth</label><input id="cDob" type="date" /></div>
    <div class="field"><label>Gender</label><input id="cGender" /></div>
    <div class="field"><label>Address</label><input id="cAddress" /></div>
    <div class="field"><label>Phone</label><input id="cPhone" /></div>
  `, async () => {
    await API.post("/characters", {
      firstName: document.getElementById("cFirst").value,
      lastName: document.getElementById("cLast").value,
      dob: document.getElementById("cDob").value || null,
      gender: document.getElementById("cGender").value,
      address: document.getElementById("cAddress").value,
      phone: document.getElementById("cPhone").value,
    });
    toast("Character created.");
    navigate("civilian");
  });
};

window.editCharacter = async (id) => {
  const res = await API.get(`/characters/${id}/records`);
  const c = res.character;
  modal("Edit Character", `
    <div class="field"><label>First Name</label><input id="cFirst" value="${esc(c.firstName)}" /></div>
    <div class="field"><label>Last Name</label><input id="cLast" value="${esc(c.lastName)}" /></div>
    <div class="field"><label>DOB</label><input id="cDob" type="date" value="${esc(c.dob || "")}" /></div>
    <div class="field"><label>Phone</label><input id="cPhone" value="${esc(c.phone || "")}" /></div>
    <div class="field"><label>Address</label><input id="cAddress" value="${esc(c.address || "")}" /></div>
  `, async () => {
    await API.put(`/characters/${id}`, {
      firstName: document.getElementById("cFirst").value,
      lastName: document.getElementById("cLast").value,
      dob: document.getElementById("cDob").value,
      phone: document.getElementById("cPhone").value,
      address: document.getElementById("cAddress").value,
    });
    toast("Character updated.");
    navigate("civilian");
  });
};

window.viewRecords = async (id, tab = "vehicles") => {
  state.recordsTab = tab;
  const res = await API.get(`/characters/${id}/records`);
  const panel = document.getElementById("recordsPanel");
  if (!panel) return;
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const tabs = [
    { id: "vehicles", label: "Vehicles", count: res.vehicles.length },
    { id: "citations", label: "Citations", count: res.citations.length },
    { id: "warnings", label: "Warnings", count: res.warnings.length },
    { id: "arrests", label: "Arrests", count: res.arrests.length },
    { id: "warrants", label: "Warrants", count: res.warrants.length },
  ];

  let tableHtml = "";
  if (tab === "vehicles") {
    const rows = res.vehicles.map((v) => `<tr><td><strong>${esc(v.plate)}</strong></td><td>${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</td><td>${esc(v.color)}</td><td>${v.stolen ? '<span class="badge badge--panic">STOLEN</span>' : esc(v.registrationStatus)}</td></tr>`).join("")
      || `<tr><td colspan="4" class="empty-state">No vehicles registered</td></tr>`;
    tableHtml = `<div class="table-wrap"><table><thead><tr><th>Plate</th><th>Vehicle</th><th>Color</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else if (tab === "citations") {
    const rows = res.citations.map((c) => `<tr><td>${esc(c.charge)}</td><td>$${esc(c.fine_amount)}</td><td>${esc(c.location || "—")}</td><td>${esc(c.officer_name)}</td><td>${new Date(c.created_at).toLocaleDateString()}</td></tr>`).join("")
      || `<tr><td colspan="5" class="empty-state">No citations</td></tr>`;
    tableHtml = `<div class="table-wrap"><table><thead><tr><th>Charge</th><th>Fine</th><th>Location</th><th>Officer</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else if (tab === "warnings") {
    const rows = res.warnings.map((w) => `<tr><td>${esc(w.reason)}</td><td>${esc(w.location || "—")}</td><td>${esc(w.officer_name)}</td><td>${new Date(w.created_at).toLocaleDateString()}</td></tr>`).join("")
      || `<tr><td colspan="4" class="empty-state">No warnings</td></tr>`;
    tableHtml = `<div class="table-wrap"><table><thead><tr><th>Reason</th><th>Location</th><th>Officer</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else if (tab === "arrests") {
    const rows = res.arrests.map((a) => `<tr><td>${esc((a.charges || []).join(", "))}</td><td>${esc(a.location || "—")}</td><td>${esc(a.officer_name)}</td><td>${new Date(a.created_at).toLocaleDateString()}</td></tr>`).join("")
      || `<tr><td colspan="4" class="empty-state">No arrests</td></tr>`;
    tableHtml = `<div class="table-wrap"><table><thead><tr><th>Charges</th><th>Location</th><th>Officer</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else if (tab === "warrants") {
    const rows = res.warrants.map((w) => `<tr><td>${esc(w.charge)}</td><td>${statusBadge(w.status)}</td><td>${esc(w.officer_name)}</td><td>${new Date(w.created_at).toLocaleDateString()}</td></tr>`).join("")
      || `<tr><td colspan="4" class="empty-state">No warrants</td></tr>`;
    tableHtml = `<div class="table-wrap"><table><thead><tr><th>Charge</th><th>Status</th><th>Officer</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  panel.innerHTML = `
    <div class="card__title">Criminal Record — ${esc(res.character.firstName)} ${esc(res.character.lastName)}</div>
    <div class="record-tabs">
      ${tabs.map((t) => `<button class="record-tab${tab === t.id ? " active" : ""}" onclick="viewRecords(${id},'${t.id}')">${t.label} <span class="record-tab__count">${t.count}</span></button>`).join("")}
      <button class="btn btn--ghost btn--sm record-tabs__action" onclick="registerVehicle(${id})">+ Vehicle</button>
    </div>
    ${tableHtml}`;
};

window.registerVehicle = (charId) => {
  modal("Register Vehicle", `
    <div class="field"><label>Plate</label><input id="vPlate" required style="text-transform:uppercase" /></div>
    <div class="field"><label>Make</label><input id="vMake" required /></div>
    <div class="field"><label>Model</label><input id="vModel" required /></div>
    <div class="field"><label>Color</label><input id="vColor" /></div>
    <div class="field"><label>Year</label><input id="vYear" type="number" min="1900" max="2099" /></div>
  `, async () => {
    await API.post("/vehicles", { characterId: charId, plate: document.getElementById("vPlate").value, make: document.getElementById("vMake").value, model: document.getElementById("vModel").value, color: document.getElementById("vColor").value, year: document.getElementById("vYear").value || null });
    toast("Vehicle registered.");
    viewRecords(charId);
  });
};

// ─── Police MDT ───────────────────────────────────────────────────────────────

async function renderPoliceView() {
  let calls = [], bolos = [];
  try {
    [calls, bolos] = await Promise.all([
      API.get("/calls?status=active").then((r) => r.calls),
      API.get("/bolos?status=active").then((r) => r.bolos),
    ]);
  } catch { /* */ }

  const callRows = calls.slice(0, 8).map((c) =>
    `<tr><td>${priorityBadge(c.priority)}</td><td>${esc(c.type)}</td><td>${esc(c.location)}</td><td>${esc(c.description?.slice(0, 60))}</td></tr>`,
  ).join("") || `<tr><td colspan="4" class="empty-state">No active calls</td></tr>`;

  return renderShell(`
    <div class="search-bar">
      <input id="policeSearch" placeholder="Search name..." />
      <button class="btn btn--primary" onclick="policeNameSearch()">Name Search</button>
      <input id="plateSearch" placeholder="Plate..." style="max-width:140px;text-transform:uppercase" />
      <button class="btn btn--primary" onclick="plateSearch()">Plate Search</button>
    </div>
    <div id="searchResults" class="card" style="margin-bottom:16px;display:none"></div>
    <div class="grid grid--2">
      <div class="card">
        <div class="card__title">Unit Status</div>
        <div class="status-grid" id="unitStatusGrid">
          ${["available","busy","enroute","onscene","transport","offduty"].map((s) => `<button class="status-btn" data-status="${s}" onclick="setUnitStatus('${s}')">${s.toUpperCase()}</button>`).join("")}
          <button class="status-btn status-btn--panic" onclick="setUnitStatus('panic')">⚠ PANIC</button>
        </div>
        <button class="btn btn--ghost btn--sm" style="margin-top:12px" onclick="registerUnit()">Register Unit</button>
      </div>
      <div class="card">
        <div class="card__title">Quick Actions</div>
        <div class="action-grid">
          <button class="action-chip" onclick="policeAction('citation')">Citation</button>
          <button class="action-chip" onclick="policeAction('warning')">Warning</button>
          <button class="action-chip" onclick="policeAction('arrest')">Arrest Report</button>
          <button class="action-chip" onclick="policeAction('warrant')">Warrant</button>
          <button class="action-chip" onclick="policeAction('bolo')">Create BOLO</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card__title">Active 911 Calls</div>
      <div class="table-wrap"><table><thead><tr><th>Pri</th><th>Type</th><th>Location</th><th>Description</th></tr></thead><tbody>${callRows}</tbody></table></div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card__title">Active BOLOs</div>
      <div class="table-wrap"><table><thead><tr><th>Type</th><th>Subject</th><th>Description</th><th>Plate</th></tr></thead><tbody>
        ${bolos.map((b) => `<tr><td>${esc(b.type)}</td><td>${esc(b.subject)}</td><td>${esc(b.description?.slice(0,80))}</td><td>${esc(b.plate||"—")}</td></tr>`).join("") || `<tr><td colspan="4">No active BOLOs</td></tr>`}
      </tbody></table></div>
    </div>
  `, "Police MDT", "LAW");
}

window.policeNameSearch = async () => {
  const q = document.getElementById("policeSearch")?.value;
  if (!q) return;
  const res = await API.get(`/characters/search?q=${encodeURIComponent(q)}`);
  const panel = document.getElementById("searchResults");
  panel.style.display = "block";
  panel.innerHTML = `<div class="card__title">Name Search Results</div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>DOB</th><th>Phone</th><th></th></tr></thead><tbody>
    ${res.results.map((c) => `<tr><td>${esc(c.firstName)} ${esc(c.lastName)}</td><td>${esc(c.dob||"—")}</td><td>${esc(c.phone||"—")}</td><td><button class="btn btn--ghost btn--sm" onclick="viewRecords(${c.id})">View</button></td></tr>`).join("") || "<tr><td colspan='4'>No results</td></tr>"}
    </tbody></table></div>`;
};

window.plateSearch = async () => {
  const plate = document.getElementById("plateSearch")?.value;
  if (!plate) return;
  const res = await API.get(`/vehicles/search?plate=${encodeURIComponent(plate)}`);
  const panel = document.getElementById("searchResults");
  panel.style.display = "block";
  panel.innerHTML = `<div class="card__title">Plate Search Results</div>
    <div class="table-wrap"><table><thead><tr><th>Plate</th><th>Vehicle</th><th>Owner</th><th>Status</th></tr></thead><tbody>
    ${res.results.map((v) => `<tr><td><strong>${esc(v.plate)}</strong></td><td>${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</td><td>${esc(v.ownerFirst)} ${esc(v.ownerLast)}</td><td>${v.stolen?"🚨 STOLEN":esc(v.registrationStatus)}</td></tr>`).join("") || "<tr><td colspan='4'>No results</td></tr>"}
    </tbody></table></div>`;
};

window.setUnitStatus = async (status) => {
  try {
    const res = await API.patch("/units/status", { status });
    document.querySelectorAll(".status-btn").forEach((b) => b.classList.toggle("active", b.dataset.status === status));
    if (res.panic) {
      toast("⚠ PANIC BUTTON ACTIVATED — All units notified!", "error");
      window.DesktopShell?.pushNotification({
        title: "⚠ PANIC ACTIVATED",
        body: "Your unit has triggered a panic alert.",
        type: "panic",
        urgency: "critical",
        view: "dispatch",
      });
    } else toast(`Status: ${status}`);
  } catch (err) { toast(err.message, "error"); }
};

window.registerUnit = () => {
  modal("Register Unit", `<div class="field"><label>Callsign</label><input id="callsign" placeholder="LCSO-12" required /></div>`, async () => {
    await API.post("/units/register", { callsign: document.getElementById("callsign").value });
    toast("Unit registered.");
  });
};

window.policeAction = (type) => {
  const forms = {
    citation: `<div class="field"><label>Character ID</label><input id="charId" type="number" required /></div><div class="field"><label>Charge</label><input id="charge" required /></div><div class="field"><label>Fine ($)</label><input id="fine" type="number" min="0" /></div><div class="field"><label>Location</label><input id="loc" /></div>`,
    warning: `<div class="field"><label>Character ID</label><input id="charId" type="number" required /></div><div class="field"><label>Reason</label><input id="reason" required /></div><div class="field"><label>Location</label><input id="loc" /></div>`,
    arrest: `<div class="field"><label>Character ID</label><input id="charId" type="number" required /></div><div class="field"><label>Charges (comma separated)</label><input id="charges" required /></div><div class="field"><label>Location</label><input id="loc" /></div><div class="field"><label>Narrative</label><textarea id="narrative"></textarea></div>`,
    warrant: `<div class="field"><label>Character ID</label><input id="charId" type="number" required /></div><div class="field"><label>Charge</label><input id="charge" required /></div><div class="field"><label>Notes</label><textarea id="notes"></textarea></div>`,
    bolo: `<div class="field"><label>Type</label><select id="boloType"><option value="person">Person</option><option value="vehicle">Vehicle</option></select></div><div class="field"><label>Subject</label><input id="subject" required /></div><div class="field"><label>Description</label><textarea id="desc" required></textarea></div><div class="field"><label>Plate (if vehicle)</label><input id="plate" /></div>`,
  };
  modal(type.charAt(0).toUpperCase() + type.slice(1), forms[type], async () => {
    const charId = Number(document.getElementById("charId")?.value);
    if (type === "citation") await API.post("/citations", { characterId: charId, charge: document.getElementById("charge").value, fineAmount: document.getElementById("fine").value, location: document.getElementById("loc").value });
    else if (type === "warning") await API.post("/warnings", { characterId: charId, reason: document.getElementById("reason").value, location: document.getElementById("loc").value });
    else if (type === "arrest") await API.post("/arrests", { characterId: charId, charges: document.getElementById("charges").value.split(",").map((s) => s.trim()), location: document.getElementById("loc").value, narrative: document.getElementById("narrative").value });
    else if (type === "warrant") await API.post("/warrants", { characterId: charId, charge: document.getElementById("charge").value, notes: document.getElementById("notes").value });
    else if (type === "bolo") await API.post("/bolos", { type: document.getElementById("boloType").value, subject: document.getElementById("subject").value, description: document.getElementById("desc").value, plate: document.getElementById("plate").value });
    toast(`${type} created.`);
  });
};

// ─── Dispatch ─────────────────────────────────────────────────────────────────

async function renderDispatchView() {
  let calls = [], units = [];
  try {
    [calls, units] = await Promise.all([API.get("/calls").then((r) => r.calls), API.get("/units").then((r) => r.units)]);
  } catch { /* */ }

  const panicUnits = units.filter((u) => u.status === "panic");
  const panicBanner = panicUnits.length
    ? `<div class="panic-banner">⚠ OFFICER PANIC — ${panicUnits.map((u) => esc(u.callsign)).join(", ")} — ALL UNITS RESPOND</div>`
    : "";

  const callRows = calls.map((c) => `
    <tr>
      <td>#${c.id}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${esc(c.type)}</td>
      <td>${esc(c.location)}</td>
      <td>${esc(c.description?.slice(0, 50))}</td>
      <td>${esc(c.assignedUnits?.join(", ") || "—")}</td>
      <td>
        ${c.status !== "closed" ? `<button class="btn btn--ghost btn--sm" onclick="assignUnit(${c.id})">Assign</button>
        <button class="btn btn--ghost btn--sm" onclick="setCallPriority(${c.id})">Priority</button>
        <button class="btn btn--ghost btn--sm" onclick="closeCall(${c.id})">Close</button>` : ""}
      </td>
    </tr>`).join("") || `<tr><td colspan="8" class="empty-state">No calls</td></tr>`;

  const unitRows = units.map((u) =>
    `<tr><td><strong>${esc(u.callsign)}</strong></td><td>${esc(u.displayName)}</td><td>${esc(u.departmentName)}</td><td>${u.status === "panic" ? statusBadge("panic") : statusBadge(u.status)}</td></tr>`,
  ).join("") || `<tr><td colspan="4">No units online</td></tr>`;

  return renderShell(`
    ${panicBanner}
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn btn--primary" onclick="createDispatchCall()">+ New Call</button>
      <button class="btn btn--ghost" onclick="createBolo()">+ BOLO</button>
    </div>
    <div class="grid grid--2">
      <div class="card" style="grid-column:1/-1">
        <div class="card__title">Active 911 Calls</div>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Pri</th><th>Status</th><th>Type</th><th>Location</th><th>Description</th><th>Units</th><th></th></tr></thead><tbody>${callRows}</tbody></table></div>
      </div>
      <div class="card">
        <div class="card__title">Active Units</div>
        <div class="table-wrap"><table><thead><tr><th>Callsign</th><th>Officer</th><th>Dept</th><th>Status</th></tr></thead><tbody>${unitRows}</tbody></table></div>
      </div>
    </div>
  `, "Dispatch Panel", "DISP");
}

window.createDispatchCall = () => {
  modal("Create Call", `
    <div class="field"><label>Location</label><input id="loc" required /></div>
    <div class="field"><label>Type</label><select id="type"><option value="police">Police</option><option value="fire">Fire</option><option value="medical">Medical</option><option value="traffic">Traffic</option></select></div>
    <div class="field"><label>Priority</label><select id="pri"><option value="1">P1 — Emergency</option><option value="2">P2 — Urgent</option><option value="3" selected>P3 — Routine</option><option value="4">P4 — Low</option></select></div>
    <div class="field"><label>Description</label><textarea id="desc" required></textarea></div>
  `, async () => {
    await API.post("/calls", { location: document.getElementById("loc").value, type: document.getElementById("type").value, priority: Number(document.getElementById("pri").value), description: document.getElementById("desc").value });
    toast("Call created.");
    navigate("dispatch");
  });
};

window.assignUnit = async (callId) => {
  const units = (await API.get("/units")).units.filter((u) => u.status !== "offduty");
  modal("Assign Unit", `<div class="field"><label>Unit</label><select id="unitId">${units.map((u) => `<option value="${u.id}">${esc(u.callsign)} — ${esc(u.displayName)}</option>`).join("")}</select></div>`, async () => {
    await API.post(`/calls/${callId}/assign`, { unitId: Number(document.getElementById("unitId").value) });
    toast("Unit assigned.");
    navigate("dispatch");
  });
};

window.setCallPriority = (callId) => {
  modal("Set Priority", `<div class="field"><label>Priority</label><select id="pri"><option value="1">P1</option><option value="2">P2</option><option value="3">P3</option><option value="4">P4</option></select></div>`, async () => {
    await API.patch(`/calls/${callId}`, { priority: Number(document.getElementById("pri").value) });
    toast("Priority updated.");
    navigate("dispatch");
  });
};

window.closeCall = async (callId) => {
  await API.patch(`/calls/${callId}`, { status: "closed" });
  toast("Call closed.");
  navigate("dispatch");
};

window.createBolo = () => policeAction("bolo");

// ─── Fire / EMS ───────────────────────────────────────────────────────────────

async function renderFireView() {
  let calls = [];
  try { calls = (await API.get("/calls/fire-medical")).calls; } catch { /* */ }
  const rows = calls.map((c) =>
    `<tr><td>${priorityBadge(c.priority)}</td><td>${esc(c.type)}</td><td>${esc(c.location)}</td><td>${esc(c.description?.slice(0,60))}</td><td>${statusBadge(c.status)}</td></tr>`,
  ).join("") || `<tr><td colspan="5" class="empty-state">No active fire/medical calls</td></tr>`;

  return renderShell(`
    <div class="grid grid--2">
      <div class="card">
        <div class="card__title">Unit Status</div>
        <div class="status-grid">
          ${["available","enroute","onscene","transport","offduty"].map((s) => `<button class="status-btn" onclick="setUnitStatus('${s}')">${s.toUpperCase()}</button>`).join("")}
        </div>
        <button class="btn btn--ghost btn--sm" style="margin-top:12px" onclick="registerUnit()">Register Unit</button>
      </div>
      <div class="card">
        <div class="card__title">Patient Report</div>
        <form id="patientForm">
          <div class="field"><label>Patient Name</label><input name="patientName" required /></div>
          <div class="field"><label>Call ID (optional)</label><input name="callId" type="number" /></div>
          <div class="field"><label>Treatment</label><textarea name="treatment"></textarea></div>
          <div class="field"><label>Transport Hospital</label><input name="hospital" /></div>
          <div class="field"><label>Transport Status</label>
            <select name="transportStatus"><option value="none">None</option><option value="enroute">En Route</option><option value="arrived">Arrived</option><option value="complete">Complete</option></select>
          </div>
          <button class="btn btn--primary btn--block" type="submit">Submit Report</button>
        </form>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card__title">Fire / Medical Calls</div>
      <div class="table-wrap"><table><thead><tr><th>Pri</th><th>Type</th><th>Location</th><th>Description</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `, "Fire / EMS MDT", "EMS");
}

async function wireFire() {
  document.getElementById("patientForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await API.post("/patient-reports", {
        patientName: fd.get("patientName"),
        callId: fd.get("callId") || null,
        treatment: fd.get("treatment"),
        transportHospital: fd.get("hospital"),
        transportStatus: fd.get("transportStatus"),
      });
      toast("Patient report submitted.");
      e.target.reset();
    } catch (err) { toast(err.message, "error"); }
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

async function renderAdminView() {
  let users = [], departments = [], logs = [];
  try {
    [users, departments, logs] = await Promise.all([
      API.get("/admin/users").then((r) => r.users),
      API.get("/admin/departments").then((r) => r.departments),
      API.get("/admin/audit").then((r) => r.logs),
    ]);
  } catch { /* */ }

  const userRows = users.map((u) => `
    <tr>
      <td>${esc(u.display_name)}</td>
      <td>${esc(u.username)}</td>
      <td><select onchange="updateUserRole(${u.id}, this.value)" style="padding:4px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px">
        ${["civilian","police","fire","ems","dispatch","admin"].map((r) => `<option value="${r}"${u.role===r?" selected":""}>${r}</option>`).join("")}
      </select></td>
      <td>${esc(u.department_name||"—")}</td>
      <td>${u.is_active ? "✅" : "❌"}</td>
    </tr>`).join("");

  const logRows = logs.slice(0, 50).map((l) =>
    `<tr><td style="font-family:var(--mono);font-size:12px">${new Date(l.created_at).toLocaleString()}</td><td>${esc(l.display_name||"System")}</td><td>${esc(l.action)}</td><td>${esc(l.entity_type||"")} #${l.entity_id||""}</td></tr>`,
  ).join("");

  return renderShell(`
    <div class="tabs">
      <button class="tab active" onclick="navigate('admin')">Users</button>
    </div>
    <div class="grid grid--2">
      <div class="card" style="grid-column:1/-1">
        <div class="card__title">User Management</div>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Department</th><th>Active</th></tr></thead><tbody>${userRows}</tbody></table></div>
      </div>
      <div class="card">
        <div class="card__title">Server Config</div>
        <form id="configForm">
          <div class="field"><label>Server Name</label><input name="serverName" value="${esc(state.config.serverName)}" /></div>
          <div class="field"><label>Logo URL</label><input name="serverLogo" value="${esc(state.config.serverLogo)}" /></div>
          <button class="btn btn--primary" type="submit">Save Config</button>
        </form>
      </div>
      <div class="card">
        <div class="card__title">Departments (${departments.length})</div>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Prefix</th></tr></thead><tbody>
          ${departments.map((d) => `<tr><td>${esc(d.name)}</td><td>${esc(d.type)}</td><td>${esc(d.callsign_prefix)}</td></tr>`).join("")}
        </tbody></table></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card__title">Audit Log</div>
      <div class="table-wrap"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th></tr></thead><tbody>${logRows}</tbody></table></div>
    </div>
  `, "Admin Panel", "ADM");
}

window.updateUserRole = async (id, role) => {
  try {
    await API.patch(`/admin/users/${id}`, { role });
    toast("User role updated.");
  } catch (err) { toast(err.message, "error"); }
};

async function wireAdmin() {
  document.getElementById("configForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await API.put("/admin/config", { serverName: fd.get("serverName"), serverLogo: fd.get("serverLogo") });
      state.config.serverName = fd.get("serverName");
      toast("Config saved.");
    } catch (err) { toast(err.message, "error"); }
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

async function render() {
  const app = document.getElementById("app");
  const view = state.view;

  if (!state.user && !["landing", "login"].includes(view)) {
    state.view = "login";
    return render();
  }

  stopLivePoll();

  let html = "";
  if (view === "landing") html = renderLanding();
  else if (view === "login") html = renderLogin();
  else {
    app.innerHTML = `<div class="shell"><div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">LOADING ${view.toUpperCase()}...</div></div></div>`;
    if (view === "dashboard") html = await renderDashboardView();
    else if (view === "civilian") html = await renderCivilianView();
    else if (view === "police") html = await renderPoliceView();
    else if (view === "dispatch") html = await renderDispatchView();
    else if (view === "fire") html = await renderFireView();
    else if (view === "admin") html = await renderAdminView();
    else if (view === "calls" && window.DesktopViews) html = await DesktopViews.renderCallsView();
    else if (view === "units" && window.DesktopViews) html = await DesktopViews.renderUnitsView();
    else if (view === "person-lookup" && window.DesktopViews) html = await DesktopViews.renderPersonLookupView();
    else if (view === "vehicle-lookup" && window.DesktopViews) html = await DesktopViews.renderVehicleLookupView();
    else if (view === "warrants" && window.DesktopViews) html = await DesktopViews.renderWarrantsView();
    else if (view === "bolos" && window.DesktopViews) html = await DesktopViews.renderBolosView();
    else if (view === "citations" && window.DesktopViews) html = await DesktopViews.renderCitationsView();
    else if (view === "arrests" && window.DesktopViews) html = await DesktopViews.renderArrestsView();
    else if (view === "incidents" && window.DesktopViews) html = await DesktopViews.renderIncidentsView();
    else if (view === "departments" && window.DesktopViews) html = await DesktopViews.renderDepartmentsView();
    else if (view === "users" && window.DesktopViews) html = await DesktopViews.renderUsersView();
    else html = await renderDashboardView();
  }

  app.innerHTML = html;
  document.title = `${view.charAt(0).toUpperCase() + view.slice(1)} — ${state.config.serverName}`;

  wireLogin();
  wireCivilian();
  wireFire();
  wireAdmin();
  startClock();
  startLivePoll();
}

function stopLivePoll() {
  if (livePollTimer) {
    clearInterval(livePollTimer);
    livePollTimer = null;
  }
}

function startLivePoll() {
  stopLivePoll();
  if (!LIVE_VIEWS.has(state.view) || !state.user) return;
  livePollTimer = setInterval(() => {
    if (document.querySelector(".modal-backdrop")) return;
    if (document.activeElement?.matches("input, textarea, select")) return;
    render();
  }, 6000);
}

function startClock() {
  if (clockTimer) clearInterval(clockTimer);
  const tick = () => {
    const el = document.getElementById("liveClock");
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString("en-US", { hour12: false });
    }
  };
  tick();
  clockTimer = setInterval(tick, 1000);
}

window.navigate = navigate;

async function init() {
  try {
    const cfg = await API.get("/config");
    state.config = cfg.config;
  } catch { /* offline */ }

  try {
    const auth = await API.get("/auth/me");
    if (auth.user) state.user = auth.user;
  } catch { /* */ }

  const defaultView = state.user ? "dashboard" : (isDesktopApp() ? "login" : "landing");
  const hash = location.hash.replace("#", "") || defaultView;
  if (isDesktopApp() && hash === "landing") {
    state.view = state.user ? "dashboard" : "login";
  } else {
    state.view = hash;
  }
  await render();
}

window.init = init;

window.addEventListener("hashchange", () => {
  state.view = location.hash.replace("#", "") || "dashboard";
  render();
});

init();
