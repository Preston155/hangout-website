import { useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Bot, Command, Github, Sparkles } from "lucide-react";
import { CommandDirectory } from "./pages/CommandDirectory";

function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,.24),transparent_34rem),radial-gradient(circle_at_100%_20%,rgba(34,211,238,.10),transparent_30rem),radial-gradient(circle_at_0%_70%,rgba(217,70,239,.10),transparent_30rem)]" />
      <div className="absolute left-1/2 top-0 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute -top-32 left-[12%] h-72 w-72 rounded-full bg-brand-500/12 blur-[110px] animate-aurora" />
      <div className="absolute right-[8%] top-20 h-80 w-80 rounded-full bg-cyan-400/8 blur-[120px] animate-aurora" style={{ animationDelay: "-7s" }} />
    </div>
  );
}

export function App() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      document.documentElement.style.setProperty("--mouse-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  return (
    <>
      <Atmosphere />
      <div className="min-h-screen">
        <div className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 rounded-[26px] border border-white/[.08] bg-[#07080d]/75 px-3 py-3 shadow-[0_18px_80px_-48px_rgba(0,0,0,.95)] backdrop-blur-2xl sm:px-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-black text-black shadow-[0_18px_40px_-24px_rgba(255,255,255,.8)]">
                P
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-black/20 bg-emerald-400 text-[9px] text-black">●</span>
              </div>
              <div className="leading-tight">
                <div className="text-[15px] font-black tracking-tight text-white">PrestonHQ</div>
                <div className="text-[11px] font-semibold text-zinc-500">Bot Command OS</div>
              </div>
            </div>

            <nav className="hidden items-center gap-1 rounded-2xl border border-white/[.06] bg-white/[.035] p-1 lg:flex">
              <a className="rounded-xl bg-white/[.08] px-3 py-2 text-[12px] font-bold text-white" href="#commands">Commands</a>
              <a className="rounded-xl px-3 py-2 text-[12px] font-bold text-zinc-500 transition hover:text-white" href="#bots">Bots</a>
              <a className="rounded-xl px-3 py-2 text-[12px] font-bold text-zinc-500 transition hover:text-white" href="#status">Status</a>
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[12px] font-bold text-emerald-300 sm:flex">
                <Activity size={14} /> Live synced
              </div>
              <div className="hidden items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.035] px-3 py-2 text-[12px] font-bold text-zinc-400 md:flex">
                <Bot size={14} /> 3 bots
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[.08] bg-white/[.035] text-zinc-400">
                <Command size={16} />
              </div>
            </div>
          </motion.header>
        </div>

        <main id="commands" className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:py-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
            <CommandDirectory />
          </motion.div>
        </main>

        <footer className="mx-auto max-w-[1540px] px-4 pb-8 sm:px-6">
          <div className="flex flex-col gap-3 rounded-[24px] border border-white/[.06] bg-white/[.025] px-4 py-4 text-[12px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2"><Sparkles size={14} /> PrestonHQ command directory, rebuilt for connected bots.</span>
            <span className="inline-flex items-center gap-2"><Github size={14} /> GitHub synced + VPS deployed</span>
          </div>
        </footer>
      </div>
    </>
  );
}