import { motion } from "framer-motion";
import { CommandDirectory } from "./pages/CommandDirectory";

export function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <header className="border-b border-zinc-800 bg-[#0d0d0f]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-100 text-sm font-black text-black">P</div>
            <div>
              <div className="text-sm font-bold text-white">PrestonHQ</div>
              <div className="text-xs text-zinc-500">Bot command reference</div>
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-500">IceSway · Veltrix · ECRP</div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-5">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CommandDirectory />
        </motion.div>
      </main>
    </div>
  );
}