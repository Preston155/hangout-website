import { useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Blocks, Bot, Sparkles } from "lucide-react";
import { CommandDirectory } from "./pages/CommandDirectory";

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-44 -top-44 h-[560px] w-[560px] rounded-full bg-brand-500/20 blur-[130px] animate-aurora" />
      <div className="absolute -right-36 top-8 h-[520px] w-[520px] rounded-full bg-brand-violet/18 blur-[130px] animate-aurora" style={{ animationDelay: "-6s" }} />
      <div className="absolute bottom-[-210px] left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[140px] animate-aurora" style={{ animationDelay: "-12s" }} />
      <div className="absolute left-[8%] top-[18%] h-24 w-24 rounded-full border border-white/10 opacity-30" style={{ animation: "orbit 12s linear infinite" }} />
      <div className="absolute right-[18%] top-[28%] h-16 w-16 rounded-full border border-brand-400/20 opacity-40" style={{ animation: "orbit 16s linear infinite reverse" }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent" />
    </div>
  );
}

function TopTicker() {
  const items = ["Multi-bot command intelligence", "IceSway Utils online telemetry", "Veltrix command catalog", "ECRP Assistant command center", "Live PM2 status when API is reachable"];
  return (
    <div className="border-b border-white/[.07] bg-black/24 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center overflow-hidden px-4 sm:px-6">
        <div className="mr-4 hidden items-center gap-2 border-r border-white/10 py-2.5 pr-4 text-[11px] font-black uppercase tracking-[.18em] text-brand-300 sm:flex">
          <Sparkles size={13} /> Live Console
        </div>
        <div className="no-scrollbar flex flex-1 gap-8 overflow-hidden whitespace-nowrap py-2.5 text-[11px] font-bold uppercase tracking-[.16em] text-zinc-500">
          <motion.div className="flex gap-8" animate={{ x: [0, -520] }} transition={{ repeat: Infinity, duration: 22, ease: "linear" }}>
            {[...items, ...items, ...items].map((item, i) => (
              <span key={`${item}-${i}`} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.9)]" />{item}</span>
            ))}
          </motion.div>
        </div>
      </div>
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
      <Aurora />
      <div className="min-h-screen">
        <TopTicker />
        <header className="sticky top-0 z-30 border-b border-white/[.07] bg-ink-950/68 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl brand-grad text-sm font-black text-[#06060a] shadow-[0_16px_48px_-18px_rgba(129,140,248,.9)]">P<span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-ink-950 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,.9)]" /></div>
              <div><div className="text-[15px] font-extrabold tracking-tight">PrestonHQ</div><div className="text-[11px] text-zinc-500">Command Nexus</div></div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[12px] text-zinc-400 lg:flex"><Bot size={14} className="text-brand-300" /> IceSway <span className="text-zinc-700">/</span> Veltrix <span className="text-zinc-700">/</span> ECRP</div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] font-bold text-emerald-300 sm:inline-flex"><Activity size={14} className="mr-2" /> Systems synced</div>
              <div className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[12px] font-bold text-zinc-300"><Blocks size={14} className="mr-2 inline" /> Dashboard v5</div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
            <CommandDirectory />
          </motion.div>
        </main>
      </div>
    </>
  );
}
