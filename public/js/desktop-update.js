(function () {
  const DISMISS_KEY = "discordRemakeDesktopUpdateDismissed";

  function parseVersion(value) {
    return String(value || "0")
      .split(".")
      .map((part) => parseInt(part.replace(/[^\d]/g, ""), 10) || 0);
  }

  function compareVersions(a, b) {
    const left = parseVersion(a);
    const right = parseVersion(b);
    const len = Math.max(left.length, right.length);
    for (let i = 0; i < len; i += 1) {
      const diff = (left[i] || 0) - (right[i] || 0);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
  }

  function getBanner() {
    return document.getElementById("desktopUpdateBanner");
  }

  function showBanner(info) {
    const banner = getBanner();
    if (!banner) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === info.version) return;

    const title = banner.querySelector(".desktop-update__title");
    const message = banner.querySelector(".desktop-update__message");
    const download = banner.querySelector(".desktop-update__download");

    if (title) title.textContent = info.title || "Desktop update available";
    if (message) message.textContent = info.message || `Version ${info.version} is ready.`;
    if (download) {
      download.href = `/downloads/${info.installer || "Discord-Remake-Setup.exe"}`;
      download.textContent = `Download v${info.version}`;
    }

    banner.classList.remove("hidden");
    banner.dataset.version = info.version;
  }

  async function checkForDesktopUpdate() {
    if (!window.desktopApp?.isDesktop) return;

    const localVersion = window.desktopApp.version || "0.0.0";

    try {
      const response = await fetch(`/downloads/desktop-version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;

      const info = await response.json();
      if (!info?.version) return;
      if (compareVersions(info.version, localVersion) > 0) {
        showBanner(info);
      }
    } catch {
      /* ignore — site still works */
    }
  }

  function wireBanner() {
    const banner = getBanner();
    if (!banner) return;

    banner.querySelector(".desktop-update__dismiss")?.addEventListener("click", () => {
      const version = banner.dataset.version;
      if (version) localStorage.setItem(DISMISS_KEY, version);
      banner.classList.add("hidden");
    });
  }

  function init() {
    wireBanner();
    checkForDesktopUpdate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
