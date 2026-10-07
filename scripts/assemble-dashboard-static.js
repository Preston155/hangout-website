const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const builtDashboard = path.join(root, "dashboard-src", "dist", "index.html");
const publicIndex = path.join(root, "public", "index.html");
const staffDirectory = path.join(root, "public", "staff");
const staffIndex = path.join(staffDirectory, "index.html");
const publicAssets = path.join(root, "public", "assets");
const staffAssets = path.join(staffDirectory, "assets");

if (!fs.existsSync(builtDashboard)) {
  throw new Error("Dashboard build is missing. Run the dashboard build first.");
}

// This is a private shop workspace, so the operations dashboard belongs at the
// root. Keep /staff as an alias for saved bookmarks and existing staff links.
fs.mkdirSync(staffDirectory, { recursive: true });
fs.copyFileSync(builtDashboard, publicIndex);
fs.copyFileSync(builtDashboard, staffIndex);

// The dashboard's standalone build references its favicon and shop artwork
// relatively, so give /staff its own assets directory.
if (fs.existsSync(publicAssets)) {
  fs.rmSync(staffAssets, { recursive: true, force: true });
  fs.cpSync(publicAssets, staffAssets, { recursive: true });
}
require("./generate-legal-static");
require("./build-httpdocs");
console.log("Assembled private shop dashboard for Plesk.");
