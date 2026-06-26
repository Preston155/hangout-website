const API_HEALTH = "https://api.prestonhq.com/api/health";
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });
reveals.forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
  observer.observe(el);
});

async function checkApi() {
  const orb = document.getElementById("apiOrb");
  const text = document.getElementById("apiStatusText");
  const backend = document.getElementById("backendLabel");
  const last = document.getElementById("lastCheck");
  try {
    const res = await fetch(API_HEALTH, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    orb?.classList.remove("offline");
    orb?.classList.add("online");
    if (text) text.textContent = "API online";
    if (backend) backend.textContent = "Online";
  } catch (error) {
    orb?.classList.remove("online");
    orb?.classList.add("offline");
    if (text) text.textContent = "API not reachable";
    if (backend) backend.textContent = "Check VPS";
  } finally {
    if (last) last.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
}

checkApi();
setInterval(checkApi, 30000);
