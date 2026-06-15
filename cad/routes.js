const express = require("express");
const { query, queryOne } = require("./db");
const { logAudit } = require("./audit");
const { requireAuth, requireRole } = require("./auth");

const router = express.Router();

function charRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
    dob: r.dob,
    gender: r.gender,
    address: r.address,
    phone: r.phone,
    licenses: r.licenses ? JSON.parse(r.licenses) : {},
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function vehicleRow(r) {
  return {
    id: r.id,
    characterId: r.character_id,
    plate: r.plate,
    make: r.make,
    model: r.model,
    color: r.color,
    year: r.year,
    stolen: Boolean(r.stolen),
    registrationStatus: r.registration_status,
    ownerFirst: r.first_name,
    ownerLast: r.last_name,
  };
}

function callRow(r) {
  return {
    id: r.id,
    callerName: r.caller_name,
    callerPhone: r.caller_phone,
    location: r.location,
    description: r.description,
    type: r.type,
    priority: r.priority,
    status: r.status,
    createdBy: r.created_by,
    createdAt: r.created_at,
    closedAt: r.closed_at,
    assignedUnits: r.assigned_units ? r.assigned_units.split(",") : [],
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

router.get("/config", async (_req, res) => {
  const rows = await query(`SELECT config_key, config_value FROM server_config`);
  const config = { serverName: process.env.SERVER_NAME || "Liberty County CAD", serverLogo: process.env.SERVER_LOGO || "" };
  rows.forEach((r) => {
    if (r.config_key === "server_name") config.serverName = r.config_value;
    if (r.config_key === "server_logo") config.serverLogo = r.config_value;
  });
  res.json({ ok: true, config });
});

// ─── Characters ───────────────────────────────────────────────────────────────

router.get("/characters/mine", requireAuth, async (req, res) => {
  const rows = await query(`SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC`, [req.session.user.id]);
  res.json({ ok: true, characters: rows.map(charRow) });
});

router.post("/characters", requireAuth, async (req, res) => {
  const { firstName, lastName, dob, gender, address, phone, licenses, notes } = req.body || {};
  if (!firstName || !lastName) return res.status(400).json({ ok: false, error: "Name required." });
  const result = await query(
    `INSERT INTO characters (user_id, first_name, last_name, dob, gender, address, phone, licenses, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.session.user.id, firstName, lastName, dob || null, gender || null, address || null, phone || null, licenses ? JSON.stringify(licenses) : null, notes || null],
  );
  await logAudit(req, "character.create", "character", result.insertId);
  const row = await queryOne(`SELECT * FROM characters WHERE id = ?`, [result.insertId]);
  res.json({ ok: true, character: charRow(row) });
});

router.put("/characters/:id", requireAuth, async (req, res) => {
  const char = await queryOne(`SELECT * FROM characters WHERE id = ? AND user_id = ?`, [req.params.id, req.session.user.id]);
  if (!char) return res.status(404).json({ ok: false, error: "Character not found." });
  const { firstName, lastName, dob, gender, address, phone, licenses, notes } = req.body || {};
  await query(
    `UPDATE characters SET first_name=?, last_name=?, dob=?, gender=?, address=?, phone=?, licenses=?, notes=? WHERE id=?`,
    [firstName || char.first_name, lastName || char.last_name, dob ?? char.dob, gender ?? char.gender, address ?? char.address, phone ?? char.phone, licenses ? JSON.stringify(licenses) : char.licenses, notes ?? char.notes, char.id],
  );
  await logAudit(req, "character.update", "character", char.id);
  const row = await queryOne(`SELECT * FROM characters WHERE id = ?`, [char.id]);
  res.json({ ok: true, character: charRow(row) });
});

router.get("/characters/search", requireAuth, requireRole("police", "dispatch", "admin"), async (req, res) => {
  const q = `%${(req.query.q || "").trim()}%`;
  if (q === "%%") return res.json({ ok: true, results: [] });
  const rows = await query(
    `SELECT * FROM characters WHERE first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name,' ',last_name) LIKE ? LIMIT 50`,
    [q, q, q],
  );
  res.json({ ok: true, results: rows.map(charRow) });
});

router.get("/characters/:id/records", requireAuth, async (req, res) => {
  const id = req.params.id;
  const char = await queryOne(`SELECT * FROM characters WHERE id = ?`, [id]);
  if (!char) return res.status(404).json({ ok: false, error: "Not found." });
  if (char.user_id !== req.session.user.id && !["police", "dispatch", "admin", "fire", "ems"].includes(req.session.user.role)) {
    return res.status(403).json({ ok: false, error: "Access denied." });
  }
  const [citations, warnings, arrests, warrants, vehicles] = await Promise.all([
    query(`SELECT c.*, u.display_name AS officer_name FROM citations c JOIN users u ON u.id=c.officer_id WHERE c.character_id=? ORDER BY c.created_at DESC`, [id]),
    query(`SELECT w.*, u.display_name AS officer_name FROM warnings w JOIN users u ON u.id=w.officer_id WHERE w.character_id=? ORDER BY w.created_at DESC`, [id]),
    query(`SELECT a.*, u.display_name AS officer_name FROM arrests a JOIN users u ON u.id=a.officer_id WHERE a.character_id=? ORDER BY a.created_at DESC`, [id]),
    query(`SELECT w.*, u.display_name AS officer_name FROM warrants w JOIN users u ON u.id=w.officer_id WHERE w.character_id=? ORDER BY w.created_at DESC`, [id]),
    query(`SELECT * FROM vehicles WHERE character_id=?`, [id]),
  ]);
  res.json({
    ok: true,
    character: charRow(char),
    citations,
    warnings,
    arrests: arrests.map((a) => ({ ...a, charges: JSON.parse(a.charges || "[]") })),
    warrants,
    vehicles: vehicles.map(vehicleRow),
  });
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────

router.post("/vehicles", requireAuth, async (req, res) => {
  const { characterId, plate, make, model, color, year } = req.body || {};
  const char = await queryOne(`SELECT * FROM characters WHERE id = ? AND user_id = ?`, [characterId, req.session.user.id]);
  if (!char) return res.status(404).json({ ok: false, error: "Character not found." });
  if (!plate || !make || !model) return res.status(400).json({ ok: false, error: "Plate, make, and model required." });
  try {
    const result = await query(
      `INSERT INTO vehicles (character_id, plate, make, model, color, year) VALUES (?,?,?,?,?,?)`,
      [characterId, plate.toUpperCase(), make, model, color || null, year || null],
    );
    await logAudit(req, "vehicle.create", "vehicle", result.insertId);
    const row = await queryOne(
      `SELECT v.*, c.first_name, c.last_name FROM vehicles v JOIN characters c ON c.id=v.character_id WHERE v.id=?`,
      [result.insertId],
    );
    res.json({ ok: true, vehicle: vehicleRow(row) });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ ok: false, error: "Plate already registered." });
    throw err;
  }
});

router.get("/vehicles/search", requireAuth, requireRole("police", "dispatch", "admin"), async (req, res) => {
  const plate = (req.query.plate || "").trim().toUpperCase();
  if (!plate) return res.json({ ok: true, results: [] });
  const rows = await query(
    `SELECT v.*, c.first_name, c.last_name FROM vehicles v JOIN characters c ON c.id=v.character_id WHERE v.plate LIKE ? LIMIT 20`,
    [`%${plate}%`],
  );
  res.json({ ok: true, results: rows.map(vehicleRow) });
});

// ─── Police records ───────────────────────────────────────────────────────────

router.post("/citations", requireAuth, requireRole("police", "admin"), async (req, res) => {
  const { characterId, vehicleId, charge, fineAmount, location, notes } = req.body || {};
  if (!characterId || !charge) return res.status(400).json({ ok: false, error: "Character and charge required." });
  const result = await query(
    `INSERT INTO citations (character_id, vehicle_id, officer_id, charge, fine_amount, location, notes) VALUES (?,?,?,?,?,?,?)`,
    [characterId, vehicleId || null, req.session.user.id, charge, fineAmount || 0, location || null, notes || null],
  );
  await logAudit(req, "citation.create", "citation", result.insertId, { characterId, charge });
  res.json({ ok: true, id: result.insertId });
});

router.post("/warnings", requireAuth, requireRole("police", "admin"), async (req, res) => {
  const { characterId, reason, location, notes } = req.body || {};
  if (!characterId || !reason) return res.status(400).json({ ok: false, error: "Character and reason required." });
  const result = await query(
    `INSERT INTO warnings (character_id, officer_id, reason, location, notes) VALUES (?,?,?,?,?)`,
    [characterId, req.session.user.id, reason, location || null, notes || null],
  );
  await logAudit(req, "warning.create", "warning", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

router.post("/arrests", requireAuth, requireRole("police", "admin"), async (req, res) => {
  const { characterId, charges, location, narrative } = req.body || {};
  if (!characterId || !charges?.length) return res.status(400).json({ ok: false, error: "Character and charges required." });
  const result = await query(
    `INSERT INTO arrests (character_id, officer_id, charges, location, narrative) VALUES (?,?,?,?,?)`,
    [characterId, req.session.user.id, JSON.stringify(charges), location || null, narrative || null],
  );
  await logAudit(req, "arrest.create", "arrest", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

router.post("/warrants", requireAuth, requireRole("police", "admin"), async (req, res) => {
  const { characterId, charge, notes } = req.body || {};
  if (!characterId || !charge) return res.status(400).json({ ok: false, error: "Character and charge required." });
  const result = await query(
    `INSERT INTO warrants (character_id, officer_id, charge, notes) VALUES (?,?,?,?)`,
    [characterId, req.session.user.id, charge, notes || null],
  );
  await logAudit(req, "warrant.create", "warrant", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

// ─── BOLOs ────────────────────────────────────────────────────────────────────

router.get("/bolos", requireAuth, async (req, res) => {
  const status = req.query.status || "active";
  const rows = await query(
    `SELECT b.*, u.display_name AS creator_name FROM bolos b JOIN users u ON u.id=b.creator_id WHERE b.status=? ORDER BY b.created_at DESC LIMIT 100`,
    [status],
  );
  res.json({ ok: true, bolos: rows });
});

router.post("/bolos", requireAuth, requireRole("police", "dispatch", "admin"), async (req, res) => {
  const { type, subject, description, plate } = req.body || {};
  if (!type || !subject || !description) return res.status(400).json({ ok: false, error: "Type, subject, and description required." });
  const result = await query(
    `INSERT INTO bolos (creator_id, type, subject, description, plate) VALUES (?,?,?,?,?)`,
    [req.session.user.id, type, subject, description, plate || null],
  );
  await logAudit(req, "bolo.create", "bolo", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

router.patch("/bolos/:id/clear", requireAuth, requireRole("police", "dispatch", "admin"), async (req, res) => {
  await query(`UPDATE bolos SET status='cleared' WHERE id=?`, [req.params.id]);
  await logAudit(req, "bolo.clear", "bolo", Number(req.params.id));
  res.json({ ok: true });
});

// ─── 911 Calls ────────────────────────────────────────────────────────────────

router.get("/calls", requireAuth, async (req, res) => {
  const status = req.query.status;
  let sql = `SELECT c.*, GROUP_CONCAT(u.callsign) AS assigned_units
    FROM calls c
    LEFT JOIN call_assignments ca ON ca.call_id = c.id
    LEFT JOIN units u ON u.id = ca.unit_id`;
  const params = [];
  if (status) {
    sql += ` WHERE c.status = ?`;
    params.push(status);
  }
  sql += ` GROUP BY c.id ORDER BY c.priority ASC, c.created_at DESC LIMIT 200`;
  const rows = await query(sql, params);
  res.json({ ok: true, calls: rows.map(callRow) });
});

router.post("/calls", requireAuth, async (req, res) => {
  const { callerName, callerPhone, location, description, type, priority } = req.body || {};
  if (!location || !description) return res.status(400).json({ ok: false, error: "Location and description required." });
  const isCivilian = req.session.user.role === "civilian";
  const callType = type || (isCivilian ? "police" : "other");
  const result = await query(
    `INSERT INTO calls (caller_name, caller_phone, location, description, type, priority, status, created_by) VALUES (?,?,?,?,?,?,?,?)`,
    [callerName || req.session.user.displayName, callerPhone || null, location, description, callType, priority || 3, "pending", req.session.user.id],
  );
  await logAudit(req, "call.create", "call", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

router.patch("/calls/:id", requireAuth, requireRole("dispatch", "police", "fire", "ems", "admin"), async (req, res) => {
  const { priority, status } = req.body || {};
  const updates = [];
  const params = [];
  if (priority != null) { updates.push("priority=?"); params.push(priority); }
  if (status) {
    updates.push("status=?");
    params.push(status);
    if (status === "closed") updates.push("closed_at=NOW()");
  }
  if (!updates.length) return res.status(400).json({ ok: false, error: "Nothing to update." });
  params.push(req.params.id);
  await query(`UPDATE calls SET ${updates.join(",")} WHERE id=?`, params);
  await logAudit(req, "call.update", "call", Number(req.params.id), { priority, status });
  res.json({ ok: true });
});

router.post("/calls/:id/assign", requireAuth, requireRole("dispatch", "admin"), async (req, res) => {
  const { unitId } = req.body || {};
  if (!unitId) return res.status(400).json({ ok: false, error: "Unit required." });
  await query(`INSERT IGNORE INTO call_assignments (call_id, unit_id) VALUES (?,?)`, [req.params.id, unitId]);
  await query(`UPDATE calls SET status='active' WHERE id=? AND status='pending'`, [req.params.id]);
  await query(`UPDATE units SET status='enroute' WHERE id=?`, [unitId]);
  await logAudit(req, "call.assign", "call", Number(req.params.id), { unitId });
  res.json({ ok: true });
});

// ─── Units ────────────────────────────────────────────────────────────────────

router.get("/units", requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT un.*, u.display_name, d.name AS department_name, d.type AS department_type
     FROM units un JOIN users u ON u.id=un.user_id JOIN departments d ON d.id=un.department_id
     ORDER BY un.status, un.callsign`,
  );
  res.json({
    ok: true,
    units: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      departmentName: r.department_name,
      departmentType: r.department_type,
      callsign: r.callsign,
      status: r.status,
      lastUpdate: r.last_update,
    })),
  });
});

router.post("/units/register", requireAuth, requireRole("police", "fire", "ems", "dispatch", "admin"), async (req, res) => {
  const { callsign } = req.body || {};
  const user = await queryOne(`SELECT department_id FROM users WHERE id=?`, [req.session.user.id]);
  if (!user?.department_id) return res.status(400).json({ ok: false, error: "No department assigned." });
  const existing = await queryOne(`SELECT id FROM units WHERE user_id=?`, [req.session.user.id]);
  if (existing) {
    await query(`UPDATE units SET callsign=?, status='available' WHERE user_id=?`, [callsign, req.session.user.id]);
    return res.json({ ok: true, id: existing.id });
  }
  const result = await query(
    `INSERT INTO units (user_id, department_id, callsign, status) VALUES (?,?,?,'available')`,
    [req.session.user.id, user.department_id, callsign || `${req.session.user.role.toUpperCase()}-1`],
  );
  res.json({ ok: true, id: result.insertId });
});

router.patch("/units/status", requireAuth, requireRole("police", "fire", "ems", "dispatch", "admin"), async (req, res) => {
  const { status } = req.body || {};
  const valid = ["available", "busy", "enroute", "onscene", "transport", "panic", "offduty"];
  if (!valid.includes(status)) return res.status(400).json({ ok: false, error: "Invalid status." });
  await query(`UPDATE units SET status=? WHERE user_id=?`, [status, req.session.user.id]);
  await logAudit(req, status === "panic" ? "unit.panic" : "unit.status", "unit", req.session.user.id, { status });
  res.json({ ok: true, panic: status === "panic" });
});

// ─── Fire/EMS ─────────────────────────────────────────────────────────────────

router.get("/calls/fire-medical", requireAuth, requireRole("fire", "ems", "dispatch", "admin"), async (req, res) => {
  const rows = await query(
    `SELECT c.*, GROUP_CONCAT(u.callsign) AS assigned_units FROM calls c
     LEFT JOIN call_assignments ca ON ca.call_id=c.id LEFT JOIN units u ON u.id=ca.unit_id
     WHERE c.type IN ('fire','medical') AND c.status != 'closed'
     GROUP BY c.id ORDER BY c.priority, c.created_at DESC`,
  );
  res.json({ ok: true, calls: rows.map(callRow) });
});

router.post("/patient-reports", requireAuth, requireRole("fire", "ems", "admin"), async (req, res) => {
  const { callId, patientName, vitals, treatment, transportHospital, transportStatus } = req.body || {};
  if (!patientName) return res.status(400).json({ ok: false, error: "Patient name required." });
  const unit = await queryOne(`SELECT id FROM units WHERE user_id=?`, [req.session.user.id]);
  if (!unit) return res.status(400).json({ ok: false, error: "Register your unit first." });
  const result = await query(
    `INSERT INTO patient_reports (call_id, unit_id, patient_name, vitals, treatment, transport_hospital, transport_status) VALUES (?,?,?,?,?,?,?)`,
    [callId || null, unit.id, patientName, vitals ? JSON.stringify(vitals) : null, treatment || null, transportHospital || null, transportStatus || "none"],
  );
  await logAudit(req, "patient_report.create", "patient_report", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get("/admin/users", requireAuth, requireRole("admin"), async (_req, res) => {
  const rows = await query(
    `SELECT u.id, u.username, u.display_name, u.email, u.role, u.is_active, u.last_login, d.name AS department_name, r.name AS rank_name
     FROM users u LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN ranks r ON r.id=u.rank_id ORDER BY u.created_at DESC`,
  );
  res.json({ ok: true, users: rows });
});

router.patch("/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { role, departmentId, rankId, isActive } = req.body || {};
  await query(`UPDATE users SET role=COALESCE(?,role), department_id=?, rank_id=?, is_active=COALESCE(?,is_active) WHERE id=?`, [
    role || null, departmentId ?? null, rankId ?? null, isActive ?? null, req.params.id,
  ]);
  await logAudit(req, "admin.user_update", "user", Number(req.params.id), req.body);
  res.json({ ok: true });
});

router.get("/admin/departments", requireAuth, requireRole("admin"), async (_req, res) => {
  res.json({ ok: true, departments: await query(`SELECT * FROM departments ORDER BY name`) });
});

router.post("/admin/departments", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, type, callsignPrefix, color } = req.body || {};
  const result = await query(`INSERT INTO departments (name, type, callsign_prefix, color) VALUES (?,?,?,?)`, [name, type, callsignPrefix || "", color || "#2563eb"]);
  await logAudit(req, "admin.dept_create", "department", result.insertId);
  res.json({ ok: true, id: result.insertId });
});

router.get("/admin/ranks", requireAuth, requireRole("admin"), async (_req, res) => {
  res.json({ ok: true, ranks: await query(`SELECT r.*, d.name AS department_name FROM ranks r JOIN departments d ON d.id=r.department_id ORDER BY d.name, r.level`) });
});

router.post("/admin/ranks", requireAuth, requireRole("admin"), async (req, res) => {
  const { departmentId, name, level, permissions } = req.body || {};
  const result = await query(`INSERT INTO ranks (department_id, name, level, permissions) VALUES (?,?,?,?)`, [departmentId, name, level || 1, JSON.stringify(permissions || [])]);
  res.json({ ok: true, id: result.insertId });
});

router.get("/admin/audit", requireAuth, requireRole("admin"), async (_req, res) => {
  const rows = await query(
    `SELECT a.*, u.display_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200`,
  );
  res.json({ ok: true, logs: rows.map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null })) });
});

router.put("/admin/config", requireAuth, requireRole("admin"), async (req, res) => {
  const { serverName, serverLogo } = req.body || {};
  if (serverName) await query(`INSERT INTO server_config (config_key, config_value) VALUES ('server_name',?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value)`, [serverName]);
  if (serverLogo != null) await query(`INSERT INTO server_config (config_key, config_value) VALUES ('server_logo',?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value)`, [serverLogo]);
  await logAudit(req, "admin.config_update", "config", null, req.body);
  res.json({ ok: true });
});

// ─── Dashboard stats ────────────────────────────────────────────────────────────

router.get("/dashboard/stats", requireAuth, async (_req, res) => {
  const [activeCalls, activeUnits, activeBolos, activeWarrants] = await Promise.all([
    queryOne(`SELECT COUNT(*) AS c FROM calls WHERE status IN ('pending','active')`),
    queryOne(`SELECT COUNT(*) AS c FROM units WHERE status NOT IN ('offduty')`),
    queryOne(`SELECT COUNT(*) AS c FROM bolos WHERE status='active'`),
    queryOne(`SELECT COUNT(*) AS c FROM warrants WHERE status='active'`),
  ]);
  res.json({
    ok: true,
    stats: {
      activeCalls: activeCalls.c,
      activeUnits: activeUnits.c,
      activeBolos: activeBolos.c,
      activeWarrants: activeWarrants.c,
    },
  });
});

module.exports = router;
