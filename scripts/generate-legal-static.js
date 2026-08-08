const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const privacy = {
  slug: "privacy",
  title: "Privacy Policy",
  description: "This Privacy Policy explains how PrestonHQ handles data for the private ER:LC moderation dashboard used by City of Angels RP staff.",
  updated: "August 8, 2026",
  sections: [
    ["Information We Collect", ["PrestonHQ collects only the information needed to authenticate authorized City of Angels RP staff, display dashboard context, and maintain moderation accountability for our ER:LC server."], ["Discord ID, Discord username, and Discord avatar.", "Discord server permissions, staff roles, and authorization status.", "Login timestamps, session activity, and dashboard access events.", "Moderation logs, including staff member, target player, action type, reason, timestamp, and related audit details."]],
    ["How We Use Information", ["We use collected information to verify staff access, display the correct dashboard permissions, operate moderation tools, protect the server from abuse, and review staff accountability when actions are taken through PrestonHQ.", "We do not sell personal information or use dashboard data for advertising."]],
    ["Data Storage", ["Dashboard configuration, staff authorization records, and moderation logs may be stored in PrestonHQ systems or connected infrastructure. Data is retained only as long as needed for moderation, security, audit, and operational purposes."]],
    ["Security", ["PrestonHQ uses access controls, staff permission checks, session security, and confirmation prompts for sensitive moderation actions. We limit dashboard access to authorized staff and aim to protect API keys, logs, and session data from unauthorized access."]],
    ["Third-Party Services", ["PrestonHQ relies on third-party services to authenticate users and perform moderation functionality."], ["Discord is used for staff login, identity, roles, permissions, avatars, and related authorization checks.", "The ER:LC API is used to connect to and manage the City of Angels RP ER:LC server where approved."]],
    ["Cookies and Sessions", ["PrestonHQ may use cookies, secure session tokens, or similar technologies to keep authorized users logged in, protect sessions, and remember dashboard state. These are used for authentication and security, not third-party advertising."]],
    ["User Rights", ["Authorized users may request access to, correction of, or deletion of personal dashboard information where appropriate. Some moderation logs may be retained when needed for server safety, abuse prevention, dispute review, or audit integrity."]],
    ["Contact Information", ["For privacy questions, data requests, or account access concerns, contact PrestonHQ at support@prestonhq.com."]],
    ["Changes to this Policy", ["We may update this Privacy Policy as PrestonHQ, Discord authentication, ER:LC API access, or moderation features change. Updated versions will include a new Last Updated date."]],
  ],
};

const terms = {
  slug: "terms",
  title: "Terms of Service",
  description: "These Terms explain the rules for using PrestonHQ as an authorized ER:LC moderation dashboard for City of Angels RP staff.",
  updated: "August 8, 2026",
  sections: [
    ["Acceptance of Terms", ["By accessing or using PrestonHQ, you agree to follow these Terms of Service. If you do not agree, you may not use the dashboard."]],
    ["Dashboard Usage", ["PrestonHQ is a private web dashboard used by City of Angels RP staff to remotely manage our ER:LC server. The dashboard may include player management, moderation logs, command dispatch, staff permission controls, Discord authentication, and ER:LC API integrations.", "You are responsible for using the dashboard carefully, accurately, and only for legitimate server moderation purposes."]],
    ["Authorized Staff Only", ["Only approved City of Angels RP staff may access PrestonHQ. Access may be based on Discord authentication, staff roles, server permissions, or manual approval.", "You may not share your account, session, access token, or dashboard access with any other person."]],
    ["Prohibited Activities", ["You agree not to misuse PrestonHQ, bypass permission checks, exploit bugs, access data you are not authorized to view, or interfere with the dashboard, Discord integration, ER:LC API, or connected services."], ["Do not use moderation actions for harassment, retaliation, or personal disputes.", "Do not attempt to extract, leak, or misuse API keys, logs, staff data, or player information.", "Do not automate dashboard actions without approval from ownership."]],
    ["Abuse of the Dashboard", ["Abuse of PrestonHQ includes unnecessary bans, kicks, private messages, announcements, command spam, unauthorized permission changes, or any action that harms the ER:LC server, staff operations, or player trust.", "All moderation actions may be logged and reviewed by authorized leadership."]],
    ["Suspension or Removal of Access", ["PrestonHQ access may be suspended or removed at any time for security concerns, role changes, misuse, inactivity, staff removal, or violation of these Terms."]],
    ["Limitation of Liability", ["PrestonHQ is provided for internal server management. To the maximum extent permitted by law, PrestonHQ and its operators are not liable for indirect, incidental, or consequential damages arising from dashboard use, downtime, mistakes, third-party service issues, or ER:LC API behavior."]],
    ["Service Availability", ["We aim to keep PrestonHQ available and reliable, but access may be interrupted by maintenance, hosting issues, Discord outages, ER:LC API changes, network problems, or security events."]],
    ["Changes to the Terms", ["We may update these Terms as PrestonHQ, staff workflows, Discord authentication, or ER:LC API features change. Continued use after updates means you accept the revised Terms."]],
    ["Contact Information", ["For questions about these Terms, access issues, or dashboard policy concerns, contact support@prestonhq.com."]],
  ],
};

function id(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escape(s) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function legalPage(page) {
  const toc = page.sections.map(([title]) => `<a href="#${id(title)}">${escape(title)}</a>`).join("");
  const sections = page.sections.map(([title, body, bullets]) => `
    <section class="card" id="${id(title)}">
      <h2>${escape(title)}</h2>
      ${body.map((p) => `<p>${escape(p)}</p>`).join("")}
      ${bullets ? `<ul>${bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>` : ""}
    </section>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(page.title)} | PrestonHQ</title>
  <meta name="description" content="${escape(page.description)}">
  <meta property="og:title" content="${escape(page.title)} | PrestonHQ">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:site_name" content="PrestonHQ">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://prestonhq.com/${page.slug}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>${css()}</style>
</head>
<body>
  <div class="bg"></div>
  <nav><div><a class="btn ghost" href="/">← Back to dashboard</a><span>PrestonHQ Legal</span></div></nav>
  <main>
    <header>
      <span class="eyebrow">PrestonHQ · City of Angels RP</span>
      <h1>${escape(page.title)}</h1>
      <p>${escape(page.description)}</p>
      <strong>Last Updated: ${escape(page.updated)}</strong>
    </header>
    <div class="layout">
      <aside class="card toc"><h2>Table of contents</h2>${toc}</aside>
      <div class="sections">${sections}<section class="card contact"><div><b>Questions?</b><p>Contact PrestonHQ support for legal, privacy, or access requests.</p></div><a class="btn" href="mailto:support@prestonhq.com">support@prestonhq.com</a></section></div>
    </div>
    <footer><p>© PrestonHQ. All rights reserved.</p><div><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div></footer>
  </main>
</body>
</html>`;
}

function loginPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Staff Login | PrestonHQ</title><meta name="description" content="Discord staff login for PrestonHQ, the private City of Angels RP ER:LC moderation dashboard."><meta property="og:title" content="Staff Login | PrestonHQ"><meta property="og:description" content="Authorized City of Angels RP staff login for PrestonHQ."><style>${css()}</style></head><body><div class="bg"></div><main class="login-wrap"><section class="card login"><span class="eyebrow">PrestonHQ</span><h1>Staff Login</h1><p>PrestonHQ is restricted to authorized City of Angels RP staff. Discord authentication verifies identity, roles, and dashboard permissions.</p><a class="btn" href="/">Continue with Discord</a><p class="fine">By continuing, you agree to the <a href="/terms">Terms of Service</a> and acknowledge the <a href="/privacy">Privacy Policy</a>.</p></section></main></body></html>`;
}

function css() {
  return `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#07090f;color:#fff;font-family:Inter,system-ui,sans-serif}.bg{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 16% 10%,rgba(56,189,248,.2),transparent 32%),radial-gradient(circle at 82% 0%,rgba(99,102,241,.2),transparent 30%),radial-gradient(circle at 68% 88%,rgba(16,185,129,.1),transparent 38%)}.bg:after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:70px 70px;opacity:.2}nav{position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(7,9,15,.76);backdrop-filter:blur(22px)}nav>div{max-width:1152px;margin:auto;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 24px}nav span{font-weight:900;color:rgba(255,255,255,.7)}main{position:relative;max-width:1152px;margin:auto;padding:48px 24px 32px}header{margin-bottom:32px}.eyebrow{display:inline-flex;border:1px solid rgba(125,211,252,.2);background:rgba(125,211,252,.1);color:#d8f3ff;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}h1{max-width:900px;margin:22px 0 0;font-size:clamp(48px,8vw,92px);line-height:.92;letter-spacing:-.075em}header p{max-width:760px;color:rgba(255,255,255,.62);line-height:1.75;font-size:17px}header strong{color:rgba(255,255,255,.45);font-size:14px}.layout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:24px}.card{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.055);box-shadow:0 28px 80px rgba(0,0,0,.25);backdrop-filter:blur(20px);border-radius:32px;padding:22px}.toc{position:sticky;top:88px;align-self:start}.toc h2,.card h2{font-size:24px;margin:0 0 14px;letter-spacing:-.04em}.toc a{display:block;margin-top:8px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.2);border-radius:18px;padding:10px 12px;color:rgba(255,255,255,.62);font-weight:800;text-decoration:none}.toc a:hover{border-color:rgba(125,211,252,.3);background:rgba(125,211,252,.1);color:white}.sections{display:grid;gap:20px}.card p{color:rgba(255,255,255,.64);line-height:1.75}.card ul{display:grid;gap:10px;padding:0;margin:16px 0 0}.card li{list-style:none;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);border-radius:18px;padding:12px 14px;color:rgba(255,255,255,.72)}.btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(125,211,252,.25);background:#7dd3fc;color:#020617;border-radius:18px;padding:12px 16px;font-weight:900;text-decoration:none}.btn.ghost{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.78)}.contact{display:flex;gap:16px;align-items:center;justify-content:space-between}.contact b{font-size:18px}footer{display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.45)}footer a,.fine a{color:rgba(255,255,255,.8);text-decoration:none;margin-left:16px}.login-wrap{min-height:100vh;display:grid;place-items:center}.login{max-width:460px}.login h1{font-size:48px}.login .btn{width:100%;margin-top:18px}.fine{font-size:12px;text-align:center}@media(max-width:900px){.layout{grid-template-columns:1fr}.toc{position:static}.contact,footer{flex-direction:column;align-items:flex-start}nav span{display:none}}`;
}

function writePage(targetRoot, slug, html) {
  const dir = path.join(targetRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html.replace(/[ \t]+$/gm, ""));
}

for (const target of ["httpdocs-ready", "public"]) {
  const dir = path.join(ROOT, target);
  writePage(dir, "privacy", legalPage(privacy));
  writePage(dir, "terms", legalPage(terms));
  writePage(dir, "login", loginPage());
}

console.log("Generated static legal pages.");
