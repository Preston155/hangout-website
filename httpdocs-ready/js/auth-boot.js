(function () {
  const form = document.getElementById("authForm");
  const err = document.getElementById("authError");
  const btn = document.getElementById("authSubmit");
  if (!form || !err || !btn) return;

  const API = "/api/";

  function showErr(text) {
    err.textContent = text || "";
    err.hidden = !text;
  }

  async function callApi(path, body) {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `API returned invalid response (${response.status}). Check that api/ is deployed.`,
      };
    }
  }

  async function waitForDiscordApp(maxMs = 8000) {
    if (typeof window.enterDiscordApp === "function") return;
    const start = Date.now();
    while (typeof window.enterDiscordApp !== "function") {
      if (Date.now() - start > maxMs) {
        throw new Error("App scripts did not load. Hard refresh the page (Ctrl+Shift+R).");
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async function checkApiHealth() {
    try {
      const response = await fetch(`${API}health`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!data.ok) showErr("API health check failed. Redeploy httpdocs-ready on Plesk.");
    } catch {
      showErr("Cannot reach /api/health.php. Plesk must deploy the httpdocs-ready folder (includes api/).");
    }
  }

  checkApiHealth();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (window.__authBusy) return;
    window.__authBusy = true;
    showErr("");
    btn.disabled = true;
    btn.textContent = "Saving…";

    const isRegister = document.getElementById("authModeRegister")?.checked;
    const username = document.getElementById("authUsername")?.value?.trim() || "";
    const displayName = document.getElementById("authDisplayName")?.value?.trim() || "";

    let res;
    try {
      res = isRegister
        ? await callApi("register", { username, displayName })
        : await callApi("login", { username });
    } catch {
      showErr(
        "Login request blocked or failed. Try disabling ad blockers, or open https://prestonhq.com/api/health.php in your browser.",
      );
      btn.disabled = false;
      btn.textContent = "Continue";
      window.__authBusy = false;
      return;
    }

    if (!res?.ok) {
      showErr(res?.error || "Authentication failed.");
      btn.disabled = false;
      btn.textContent = "Continue";
      window.__authBusy = false;
      return;
    }

    try {
      await waitForDiscordApp();
      window.enterDiscordApp(res);
    } catch (appErr) {
      console.error(appErr);
      showErr(appErr?.message || "Logged in, but the app failed to load. Hard refresh (Ctrl+Shift+R) and try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Continue";
      window.__authBusy = false;
    }
  });
})();
