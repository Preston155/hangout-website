import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "./router";
import { useHealth } from "./useHealth";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { setToastHandler } from "./components/ui";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Commands } from "./pages/Commands";
import { Builder } from "./pages/Builder";
import { Templates } from "./pages/Templates";
import { Permissions } from "./pages/Permissions";
import { Logs } from "./pages/Logs";
import { Settings } from "./pages/Settings";
import { CheckCircle2 } from "lucide-react";

function pageFor(path: string): { node: JSX.Element; key: string; active: string } {
  if (path === "/dashboard") return { node: <Overview />, key: "overview", active: "overview" };
  if (path === "/commands") return { node: <Commands />, key: "commands", active: "commands" };
  if (path === "/builder" || path === "/embeds" || path === "/new") return { node: <Builder />, key: "builder", active: "builder" };
  if (path === "/templates") return { node: <Templates />, key: "templates", active: "templates" };
  if (path === "/permissions") return { node: <Permissions />, key: "permissions", active: "permissions" };
  if (path === "/logs") return { node: <Logs />, key: "logs", active: "logs" };
  if (path === "/settings") return { node: <Settings />, key: "settings", active: "settings" };
  return { node: <Overview />, key: "overview", active: "overview" };
}

function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setToastHandler((m) => {
      setMsg(m);
      window.clearTimeout((window as any).__toastT);
      (window as any).__toastT = window.setTimeout(() => setMsg(null), 2600);
    });
  }, []);
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="glass-strong fixed bottom-5 right-5 z-[70] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-card"
    >
      <CheckCircle2 size={18} className="text-emerald-400" />
      {msg}
    </motion.div>
  );
}

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-500/20 blur-[120px] animate-aurora" />
      <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-brand-violet/15 blur-[120px] animate-aurora" style={{ animationDelay: "-6s" }} />
      <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-brand-fuchsia/10 blur-[130px] animate-aurora" style={{ animationDelay: "-12s" }} />
      <div
        className="absolute inset-0 opacity-[.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
        }}
      />
    </div>
  );
}

export function App() {
  const route = useRouter();
  const health = useHealth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [route.path]);

  if (route.path === "/login") {
    return (
      <>
        <Aurora />
        <Login />
        <Toaster />
      </>
    );
  }

  if (route.path === "/" || route.path === "") {
    return (
      <>
        <Aurora />
        <Landing health={health} />
        <Toaster />
      </>
    );
  }

  const { node, key, active } = pageFor(route.path);

  return (
    <>
      <Aurora />
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-white/[.06] bg-ink-900/40 backdrop-blur-xl lg:block">
          <Sidebar active={active} />
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="glass-strong fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
            >
              <Sidebar active={active} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar health={health} onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 px-3 py-5 sm:px-5 lg:px-7">
            <motion.div
              key={key + route.query.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1280px]"
            >
              {node}
            </motion.div>
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
