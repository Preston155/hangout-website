const { query } = require("./db");

async function logAudit(req, action, entityType = null, entityId = null, details = null) {
  const userId = req.session?.user?.id || null;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || null;
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ip],
    );
  } catch (err) {
    console.warn("Audit log failed:", err.message);
  }
}

module.exports = { logAudit };
