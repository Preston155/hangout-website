(function () {
  const form = document.getElementById("authForm");
  const err = document.getElementById("authError");
  const btn = document.getElementById("authSubmit");
  if (!form || !err || !btn) return;

  function showErr(text) {
    err.textContent = text || "";
    err.hidden = !text;
  }

  async function callApi(path, body) {
    const response = await fetch(`api/${path}.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: "API error — upload the api/ folder to httpdocs." };
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (window.__authBusy) return;
    window.__authBusy = true;
    showErr("");
    btn.disabled = true;
    btn.textContent = "Saving…";

    try {
      const isRegister = document.getElementById("authModeRegister")?.checked;
      const username = document.getElementById("authUsername")?.value?.trim() || "";
      const displayName = document.getElementById("authDisplayName")?.value?.trim() || "";

      const res = isRegister
        ? await callApi("auth/register", { username, displayName })
        : await callApi("auth/login", { username });

      if (!res?.ok) {
        showErr(res?.error || "Authentication failed.");
        return;
      }

      if (typeof window.persistDiscordSession === "function") {
        window.persistDiscordSession(res);
      } else {
        localStorage.setItem("discordRemakeUserId", res.user.id);
      }

      if (typeof window.enterDiscordApp === "function") {
        window.enterDiscordApp(res);
      } else {
        location.reload();
      }
    } catch {
      showErr("Cannot reach api/auth/*.php — upload the api folder to httpdocs.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Continue";
      window.__authBusy = false;
    }
  });
})();
