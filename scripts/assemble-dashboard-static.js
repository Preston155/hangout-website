const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const builtDashboard = path.join(root, "dashboard-src", "dist", "index.html");
const publicStorefront = path.join(root, "customer-site", "index.html");
const publicIndex = path.join(root, "public", "index.html");
const staffDirectory = path.join(root, "public", "staff");
const staffIndex = path.join(staffDirectory, "index.html");
const publicAssets = path.join(root, "public", "assets");
const staffAssets = path.join(staffDirectory, "assets");

if (!fs.existsSync(builtDashboard)) {
  throw new Error("Dashboard build is missing. Run the dashboard build first.");
}

if (!fs.existsSync(publicStorefront)) {
  throw new Error("Customer storefront is missing. Add customer-site/index.html before building.");
}

// The root is the customer-facing site. Keep the authenticated operations app
// under /staff so it can continue using the same API and persisted data files.
fs.mkdirSync(staffDirectory, { recursive: true });
fs.copyFileSync(publicStorefront, publicIndex);
fs.copyFileSync(builtDashboard, staffIndex);

// The dashboard's standalone build references its favicon and shop artwork
// relatively, so give /staff its own assets directory.
if (fs.existsSync(publicAssets)) {
  fs.rmSync(staffAssets, { recursive: true, force: true });
  fs.cpSync(publicAssets, staffAssets, { recursive: true });
}
require("./generate-legal-static");
require("./build-httpdocs");
console.log("Assembled customer storefront and staff dashboard for Plesk.");
