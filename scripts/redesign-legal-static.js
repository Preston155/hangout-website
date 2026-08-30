const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const css = `
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#0b0b0c;color:#f4f4f2;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
::selection{background:#f4f4f2;color:#0b0b0c}
a{color:inherit}
.site-header{border-bottom:1px solid rgba(255,255,255,.11)}
.nav{max-width:1180px;height:64px;margin:auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;font-size:14px;font-weight:650;letter-spacing:-.01em}
.brand-mark{width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:#f4f4f2;color:#0b0b0c;font-size:12px;font-weight:900}
.legal-nav{display:flex;gap:4px;color:rgba(255,255,255,.55);font-size:14px}
.legal-nav a{padding:8px 12px;text-decoration:none;transition:color .15s ease}
.legal-nav a:hover,.legal-nav a[aria-current=page]{color:#fff}
.page{max-width:1180px;margin:auto;padding:64px 32px 72px}
.back{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,.5);font-size:14px;text-decoration:none;transition:color .15s ease}
.back:hover{color:#fff}
.intro{max-width:760px;margin-top:64px}
.kicker,.updated,.section-number,.toc-number{font-family:"IBM Plex Mono",ui-monospace,monospace}
.kicker{margin:0;color:rgba(255,255,255,.4);font-size:11px;letter-spacing:.16em;text-transform:uppercase}
h1{margin:16px 0 0;font-size:clamp(42px,7vw,66px);line-height:1;letter-spacing:-.045em;font-weight:650}
.lede{max-width:680px;margin:24px 0 0;color:rgba(255,255,255,.58);font-size:18px;line-height:1.75}
.updated{margin:26px 0 0;color:rgba(255,255,255,.35);font-size:12px}
.layout{display:grid;grid-template-columns:220px minmax(0,720px);gap:80px;margin-top:56px;padding-top:40px;border-top:1px solid rgba(255,255,255,.11)}
.toc{position:sticky;top:32px;align-self:start}
.toc-title{margin:0 0 16px;color:rgba(255,255,255,.35);font-size:12px;font-weight:650;letter-spacing:.12em;text-transform:uppercase}
.toc ol{margin:0;padding:0;border-left:1px solid rgba(255,255,255,.12);list-style:none}
.toc a{display:flex;gap:12px;margin-left:-1px;padding:7px 0 7px 16px;border-left:1px solid transparent;color:rgba(255,255,255,.45);font-size:14px;line-height:1.4;text-decoration:none;transition:border-color .15s ease,color .15s ease}
.toc a:hover{border-color:rgba(255,255,255,.7);color:#fff}
.toc-number{color:rgba(255,255,255,.25);font-size:10px}
.legal-section{padding:40px 0;border-bottom:1px solid rgba(255,255,255,.1);scroll-margin-top:32px}
.legal-section:first-child{padding-top:0}
.legal-section:last-child{border-bottom:0}
.section-heading{display:flex;align-items:baseline;gap:16px}
.section-number{color:rgba(255,255,255,.25);font-size:11px}
h2{margin:0;font-size:24px;line-height:1.25;letter-spacing:-.025em;font-weight:650}
.section-copy{margin-top:20px;color:rgba(255,255,255,.58);font-size:16px;line-height:1.9}
.section-copy p{margin:0 0 14px}
.section-copy p:last-child{margin-bottom:0}
.section-copy ul{margin:20px 0 0;padding:0 0 0 20px;border-left:1px solid rgba(255,255,255,.14);list-style:none}
.section-copy li{margin:0 0 12px}
.contact{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:48px;padding-top:32px;border-top:1px solid rgba(255,255,255,.11)}
.contact strong{display:block;font-size:14px}
.contact p{margin:6px 0 0;color:rgba(255,255,255,.4);font-size:14px}
.contact a{padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.35);font-size:14px;text-decoration:none}
.site-footer{border-top:1px solid rgba(255,255,255,.11)}
.footer-inner{max-width:1180px;margin:auto;padding:28px 32px;display:flex;justify-content:space-between;gap:16px;color:rgba(255,255,255,.32);font-size:12px}
@media(max-width:820px){.nav,.page,.footer-inner{padding-left:20px;padding-right:20px}.page{padding-top:40px}.intro{margin-top:48px}.layout{grid-template-columns:1fr;gap:44px}.toc{position:static}.contact,.footer-inner{align-items:flex-start;flex-direction:column}.lede{font-size:16px}}
`;

function oneMatch(value, regex, label) {
  const match = value.match(regex);
  if (!match) throw new Error(`Could not read ${label}.`);
  return match[1].trim();
}

function build(type) {
  const file = path.join(root, "public", type, "index.html");
  const source = fs.readFileSync(file, "utf8");
  const title = oneMatch(source, /<h1>([^<]+)<\/h1>/, "title");
  const description = oneMatch(source, /<header>[\s\S]*?<p>([\s\S]*?)<\/p>/, "description");
  const lastUpdated = oneMatch(source, /Last Updated:\s*([^<]+)</, "last updated date");
  const sections = [];
  const sectionPattern = /<section class="card" id="([^"]+)">\s*<h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g;
  let match;

  while ((match = sectionPattern.exec(source))) {
    sections.push({ id: match[1], title: match[2].trim(), content: match[3].trim() });
  }

  if (!sections.length) throw new Error(`No legal sections found in ${file}.`);

  const isPrivacy = type === "privacy";
  const toc = sections.map((section, index) => `
          <li><a href="#${section.id}"><span class="toc-number">${String(index + 1).padStart(2, "0")}</span><span>${section.title}</span></a></li>`).join("");
  const content = sections.map((section, index) => `
        <section class="legal-section" id="${section.id}">
          <div class="section-heading"><span class="section-number">${String(index + 1).padStart(2, "0")}</span><h2>${section.title}</h2></div>
          <div class="section-copy">${section.content}</div>
        </section>`).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | PrestonHQ</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title} | PrestonHQ">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="PrestonHQ">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://prestonhq.com/${type}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <header class="site-header">
    <div class="nav">
      <a class="brand" href="/"><span class="brand-mark">P</span><span>PrestonHQ</span></a>
      <nav class="legal-nav" aria-label="Legal navigation">
        <a href="/terms"${!isPrivacy ? ' aria-current="page"' : ""}>Terms</a>
        <a href="/privacy"${isPrivacy ? ' aria-current="page"' : ""}>Privacy</a>
      </nav>
    </div>
  </header>
  <main class="page">
    <a class="back" href="/">← <span>Back to dashboard</span></a>
    <header class="intro">
      <p class="kicker">Legal / PrestonHQ</p>
      <h1>${title}</h1>
      <p class="lede">${description}</p>
      <p class="updated">Last updated ${lastUpdated}</p>
    </header>
    <div class="layout">
      <aside class="toc">
        <p class="toc-title">On this page</p>
        <ol>${toc}
        </ol>
      </aside>
      <article>${content}
        <div class="contact">
          <div><strong>Questions about this policy?</strong><p>We’ll help with legal, privacy, or account requests.</p></div>
          <a href="mailto:support@prestonhq.com">support@prestonhq.com ↗</a>
        </div>
      </article>
    </div>
  </main>
  <footer class="site-footer"><div class="footer-inner"><span>© ${new Date().getFullYear()} PrestonHQ</span><span>Built for authorized staff operations.</span></div></footer>
</body>
</html>
`;

  fs.writeFileSync(file, html);
  console.log(`Redesigned ${path.relative(root, file)}`);
}

build("terms");
build("privacy");
