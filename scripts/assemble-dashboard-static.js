const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const builtDashboard = path.join(root, "dashboard-src", "dist", "index.html");
const privateWorkspace = path.join(root, "customer-site", "index.html");
const publicIndex = path.join(root, "public", "index.html");
const staffDirectory = path.join(root, "public", "staff");
const staffIndex = path.join(staffDirectory, "index.html");
const publicAssets = path.join(root, "public", "assets");
const staffAssets = path.join(staffDirectory, "assets");

if (!fs.existsSync(builtDashboard)) {
  throw new Error("Dashboard build is missing. Run the dashboard build first.");
}
if (!fs.existsSync(privateWorkspace)) {
  throw new Error("Private workspace source is missing.");
}

// The root keeps the custom Akron design, now as a private operations workspace.
// Keep the legacy dashboard at /staff for any saved links during the transition.
fs.mkdirSync(staffDirectory, { recursive: true });
fs.copyFileSync(privateWorkspace, publicIndex);
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
