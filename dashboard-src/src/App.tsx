import { useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Bot, Command } from "lucide-react";
import { CommandDirectory } from "./pages/CommandDirectory";

function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050609]" />
      <div className="absolute inset-0 opacity-[.18]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute left-1/2 top-[-260px] h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[140px]" />
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
        <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#050609]/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-black text-black">P</div>
              <div className="leading-tight">
                <div className="text-[14px] font-black text-white">PrestonHQ</div>
                <div className="text-[11px] font-semibold text-zinc-500">Bot Command Library</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-2 text-[12px] font-bold text-zinc-400 sm:flex">
              <Bot size={14} /> IceSway · Veltrix · ECRP
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[12px] font-bold text-emerald-300 sm:inline-flex"><Activity size={14} /> Synced</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.03] text-zinc-400"><Command size={15} /></span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <CommandDirectory />
          </motion.div>
        </main>
      </div>
    </>
  );
}