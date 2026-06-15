require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const ROOT = path.join(__dirname, "..");

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function main() {
  const dbName = process.env.DB_NAME || "erlc_cad";
  const config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: dbName,
    multipleStatements: true,
  };

  console.log(`Connecting to MySQL (${config.host}:${config.port}/${dbName})...`);
  const connection = await mysql.createConnection(config);

  const schemaFile = process.env.DB_USE_EXISTING === "true" || dbName !== "erlc_cad"
    ? "schema-tables.sql"
    : "schema.sql";
  const seedFile = schemaFile === "schema-tables.sql" ? "seed-tables.sql" : "seed.sql";

  console.log(`Running ${schemaFile}...`);
  await runSqlFile(connection, path.join(ROOT, "database", schemaFile));

  console.log(`Running ${seedFile}...`);
  await runSqlFile(connection, path.join(ROOT, "database", seedFile));

  await connection.end();
  console.log("Database initialized successfully.");
  console.log("Start the server with: npm run dev");
  console.log("Login with: admin / admin123 (if DEV_LOGIN=true)");
}

main().catch((err) => {
  console.error("Database init failed:", err.message);
  process.exit(1);
});
