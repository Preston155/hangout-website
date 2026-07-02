import { motion } from "framer-motion";
import { CommandDirectory } from "./pages/CommandDirectory";

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
  return (
    <>
      <Aurora />
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-white/[.06] bg-ink-900/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl brand-grad text-sm font-black text-[#09090b]">P</div>
              <div>
                <div className="text-sm font-bold tracking-tight">PrestonHQ</div>
                <div className="text-[11px] text-zinc-500">Multi-bot command directory</div>
              </div>
            </div>
            <div className="hidden text-[12px] text-zinc-500 sm:block">IceSway · Veltrix · ECRP Assistant</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <CommandDirectory />
          </motion.div>
        </main>
      </div>
    </>
  );
}
