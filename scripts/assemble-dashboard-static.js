const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const builtDashboard = path.join(root, "dashboard-src", "dist", "index.html");
const publicIndex = path.join(root, "public", "index.html");

if (!fs.existsSync(builtDashboard)) {
  throw new Error("Dashboard build is missing. Run the dashboard build first.");
}

fs.copyFileSync(builtDashboard, publicIndex);
require("./generate-legal-static");
require("./build-httpdocs");
console.log("Assembled ER:LC dashboard and legal pages for Plesk.");
