const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SVG_PATH = path.join(ROOT, "public", "assets", "og-image.svg");
const PNG_PATH = path.join(ROOT, "public", "assets", "og-image.png");

function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.warn("og-image.svg missing, skipping PNG generation.");
    return;
  }

  let Resvg;
  try {
    ({ Resvg } = require("@resvg/resvg-js"));
  } catch {
    console.warn("@resvg/resvg-js not installed — og-image.png not regenerated.");
    return;
  }

  const svg = fs.readFileSync(SVG_PATH, "utf8");
  const resvg = new Resvg(Buffer.from(svg, "utf8"), {
    fitTo: { mode: "width", value: 1200 },
    font: {
      loadSystemFonts: true,
    },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(PNG_PATH, png);
  console.log("Generated assets/og-image.png");
}

main();
