/* Admin command editor — Veltrix */

const adminEditor = {
  overrides: null,
  editingKey: null,
  apiBase: "api/admin.php",
  password: null,
};

function adminApi(action, payload = {}) {
  return fetch(adminEditor.apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, password: adminEditor.password, ...payload }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

async function loadAdminOverrides() {
  try {
    const data = await adminApi("get");
    adminEditor.overrides = data.overrides || { commands: {}, previews: {}, systems: {}, meta: {} };
    return adminEditor.overrides;
  } catch {
    try {
      const res = await fetch("data/admin-overrides.json?v=" + Date.now(), { cache: "no-store" });
      if (res.ok) adminEditor.overrides = await res.json();
    } catch {
      adminEditor.overrides = { commands: {}, previews: {}, systems: {}, meta: {}, hiddenKeys: [] };
    }
    return adminEditor.overrides;
  }
}

function mergeAdminIntoState() {
  if (!adminEditor.overrides || !state.data) return;
  applyClientOverrides();
}

function applyClientOverrides() {
  const o = adminEditor.overrides;
  if (!o || !state.data) return;
  const hidden = new Set(o.hiddenKeys || []);
  for (const cat of state.data.categories) {
    cat.commands = cat.commands
      .filter((cmd) => !hidden.has(`${cat.id}:${cmd.name}:${cmd.type || "system"}`))
      .map((cmd) => {
        const key = `${cat.id}:${cmd.name}:${cmd.type || "system"}`;
        const alt = `${cmd.type || "prefix"}:${cmd.name}`;
        const patch = o.commands?.[key] || o.commands?.[alt];
        return patch ? { ...cmd, ...patch } : cmd;
      });
  }
}

function collectEditableCommands(data) {
  const rows = [];
  for (const cat of data.categories) {
    for (const cmd of cat.commands) {
      rows.push({ cmd, cat, key: `${cat.id}:${cmd.name}:${cmd.type || "system"}` });
    }
  }
  return rows;
}

function renderAdminEditor() {
  const rows = collectEditableCommands(state.data);
  const q = (state.adminQuery || "").trim().toLowerCase();

  const filtered = q
    ? rows.filter(({ cmd, cat }) => {
        const hay = [cmd.name, cmd.description, cat.label, cmd.type].join(" ").toLowerCase();
        return hay.includes(q);
      })
    : rows;

  const list = filtered
    .map(({ cmd, cat, key }) => {
      const label = cmd.type === "system" ? cmd.name : typeof cmdCopyText === "function" ? cmdCopyText(cmd) : cmd.name;
      const hasOverride = adminEditor.overrides?.commands?.[key];
      return `<button type="button" class="admin-cmd-row" data-edit-key="${esc(key)}">
        <span class="admin-cmd-row__name">${esc(label)}</span>
        <span class="admin-cmd-row__meta">${esc(cat.label)} · ${esc(cmd.type || "system")}</span>
        ${hasOverride ? '<span class="admin-badge">Edited</span>' : ""}
      </button>`;
    })
    .join("");

  return `
    <div class="admin-toolbar reveal is-visible">
      <input class="admin-search" id="adminSearch" type="search" placeholder="Filter commands…" value="${esc(state.adminQuery || "")}" />
      <button class="btn" id="adminPublishBtn" type="button">Publish to site &amp; bot</button>
      <button class="btn btn--ghost" id="adminBotOnlyBtn" type="button">Apply to bot only</button>
      <button class="btn btn--ghost" id="adminSyncHelpBtn" type="button">Sync help</button>
    </div>

    <div class="admin-panel reveal is-visible">
      <h3>Edit commands (${filtered.length})</h3>
      <p class="modal__desc">Edits update the <strong>live bot</strong> (slash descriptions, prefix aliases) and the <strong>website</strong>. Save first, then publish.</p>
      <div class="admin-cmd-list">${list || "<p class=\"modal__desc\">No commands match.</p>"}</div>
    </div>

    <div class="admin-panel reveal is-visible" id="adminEditorPanel" hidden>
      <h3 id="adminEditorTitle">Edit command</h3>
      <form id="adminEditorForm" class="admin-form">
        <label class="admin-field"><span>Description</span><textarea id="admDesc" rows="3"></textarea></label>
        <label class="admin-field"><span>Permission</span><input id="admPerm" type="text" placeholder="Everyone, Manage Server…" /></label>
        <label class="admin-field"><span>Usage</span><input id="admUsage" type="text" placeholder=".command or /command" /></label>
        <label class="admin-field"><span>Aliases (comma-separated)</span><input id="admAliases" type="text" /></label>
        <label class="admin-field"><span>Notes</span><textarea id="admNotes" rows="2"></textarea></label>
        <div class="admin-form__actions">
          <button class="btn" type="submit">Save changes</button>
          <button class="btn btn--ghost" id="adminEditorCancel" type="button">Cancel</button>
          <button class="btn btn--ghost admin-btn-danger" id="adminHideCmd" type="button">Hide from site</button>
        </div>
      </form>
    </div>`;
}

function openAdminEditor(key) {
  const found = typeof findCommand === "function" ? findCommand(key) : null;
  if (!found) return;
  adminEditor.editingKey = key;
  const { cmd } = found;
  const patch = adminEditor.overrides?.commands?.[key] || {};

  document.getElementById("adminEditorPanel")?.removeAttribute("hidden");
  document.getElementById("adminEditorTitle").textContent = `Edit ${cmdCopyText(cmd)}`;

  document.getElementById("admDesc").value = patch.description ?? cmd.description ?? "";
  document.getElementById("admPerm").value = patch.permission ?? cmd.permission ?? "";
  document.getElementById("admUsage").value = patch.usage ?? cmd.usage ?? "";
  document.getElementById("admAliases").value = (patch.aliases || cmd.aliases || [])
    .map((a) => (typeof a === "string" ? a : a.name))
    .join(", ");
  document.getElementById("admNotes").value = patch.notes ?? cmd.notes ?? "";
}

function closeAdminEditor() {
  adminEditor.editingKey = null;
  document.getElementById("adminEditorPanel")?.setAttribute("hidden", "");
}

function parseAliases(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function saveAdminEditor(e) {
  e?.preventDefault();
  const key = adminEditor.editingKey;
  if (!key) return;

  const patch = {
    description: document.getElementById("admDesc").value.trim(),
    permission: document.getElementById("admPerm").value.trim() || undefined,
    usage: document.getElementById("admUsage").value.trim() || undefined,
    aliases: parseAliases(document.getElementById("admAliases").value),
    notes: document.getElementById("admNotes").value.trim() || undefined,
  };

  const found = typeof findCommand === "function" ? findCommand(key) : null;
  if (found?.cmd?.subcommands?.length) {
    patch.subcommands = found.cmd.subcommands.map((s) => ({
      name: s.name,
      description: s.description || "",
    }));
  }

  try {
    await adminApi("save-command", { key, patch });
    await loadAdminOverrides();
    mergeAdminIntoState();
    showToast("Saved — publish to push to site & bot");
    closeAdminEditor();
    render();
  } catch (err) {
    showToast(err.message || "Save failed");
  }
}

async function publishAdminChanges() {
  try {
    const res = await adminApi("publish");
    await loadAdminOverrides();
    mergeAdminIntoState();
    const botNote = res.bot ? ` · Bot: ${res.bot}` : "";
    showToast("Published to site" + botNote);
    render();
  } catch (err) {
    showToast(err.message || "Publish failed — run npm run admin:publish on your PC");
  }
}

async function applyBotOnly() {
  try {
    const res = await adminApi("apply-bot");
    showToast("Applied to live bot" + (res.bot ? "" : ""));
  } catch (err) {
    showToast(err.message || "Bot apply failed — run npm run sync:to-bot on your PC");
  }
}

async function hideAdminCommand() {
  const key = adminEditor.editingKey;
  if (!key || !confirm("Hide this command from the public site?")) return;
  const o = { ...(adminEditor.overrides || {}), hiddenKeys: [...(adminEditor.overrides?.hiddenKeys || [])] };
  if (!o.hiddenKeys.includes(key)) o.hiddenKeys.push(key);
  try {
    await adminApi("save-overrides", { overrides: o });
    await loadAdminOverrides();
    mergeAdminIntoState();
    closeAdminEditor();
    render();
    showToast("Command hidden");
  } catch (err) {
    showToast(err.message || "Failed");
  }
}

function wireAdminEditor() {
  document.getElementById("adminSearch")?.addEventListener("input", (e) => {
    state.adminQuery = e.target.value;
    render();
  });

  document.querySelectorAll("[data-edit-key]").forEach((btn) => {
    btn.addEventListener("click", () => openAdminEditor(btn.dataset.editKey));
  });

  document.getElementById("adminEditorForm")?.addEventListener("submit", saveAdminEditor);
  document.getElementById("adminEditorCancel")?.addEventListener("click", closeAdminEditor);
  document.getElementById("adminHideCmd")?.addEventListener("click", hideAdminCommand);
  document.getElementById("adminPublishBtn")?.addEventListener("click", publishAdminChanges);
  document.getElementById("adminBotOnlyBtn")?.addEventListener("click", applyBotOnly);
  document.getElementById("adminSyncHelpBtn")?.addEventListener("click", () => {
    showToast("PC: npm run admin:publish · Bot only: npm run sync:to-bot");
  });
}

function setAdminPassword(pass) {
  adminEditor.password = pass;
  sessionStorage.setItem("vx_admin_pass", pass);
}

function getStoredAdminPassword() {
  return sessionStorage.getItem("vx_admin_pass") || null;
}
