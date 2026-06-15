const mysql = require("mysql2/promise");

let pool = null;

function getConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "erlc_cad",
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
  };
}

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(getConfig());
  }
  return pool;
}

async function query(sql, params = []) {
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function testConnection() {
  const p = await getPool();
  await p.query("SELECT 1");
  return true;
}

module.exports = { getPool, query, queryOne, testConnection };
