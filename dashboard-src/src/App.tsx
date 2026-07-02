import { motion } from "framer-motion";
import { CommandDirectory } from "./pages/CommandDirectory";

export function App() {
  return (
    <div className="min-h-screen bg-[#e9e2d0] text-[#14110d]">
      <main className="mx-auto max-w-[1500px] p-3 sm:p-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CommandDirectory />
        </motion.div>
      </main>
    </div>
  );
}