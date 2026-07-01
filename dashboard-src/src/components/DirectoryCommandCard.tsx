import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Copy, Shield, Terminal } from "lucide-react";
import type { BotCommand } from "../types";
import { TYPE_LABELS } from "../constants";

const TYPE_STYLE = {
  slash: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  prefix: "border-violet-400/25 bg-violet-400/10 text-violet-200",
  auto: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
} as const;

export function DirectoryCommandCard({ command, index, accent }: { command: BotCommand; index: number; accent: string }) {
  const copyUsage = async () => {
    try { await navigator.clipboard.writeText(command.usage || command.name); } catch { /* noop */ }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.22), duration: 0.24 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-[24px] border border-white/[.075] bg-[#0d0f18]/72 p-4 shadow-[0_20px_60px_-42px_rgba(0,0,0,.95)] transition hover:border-white/[.15] hover:bg-[#111421]/86"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute left-0 top-0 h-full w-1 opacity-70" style={{ background: `linear-gradient(${accent}, transparent)` }} />
      <div className="absolute -right-14 -top-14 h-28 w-28 rounded-full opacity-0 blur-3xl transition group-hover:opacity-30" style={{ background: accent }} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.035]" style={{ color: accent }}><Terminal size={15} /></span>
            <h3 className="truncate font-mono text-[15px] font-black tracking-tight text-white">{command.name}</h3>
          </div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-zinc-400">{command.description}</p>
        </div>
        <button onClick={copyUsage} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 text-zinc-500 transition hover:border-white/20 hover:bg-white/[.06] hover:text-white" title="Copy usage"><Copy size={15} /></button>
      </div>

      <div className="relative mt-4 rounded-2xl border border-white/[.065] bg-black/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">Usage</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${TYPE_STYLE[command.type]}`}>{TYPE_LABELS[command.type]}</span>
        </div>
        <code className="mt-1 block break-all font-mono text-[12px] leading-5 text-zinc-200">{command.usage}</code>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-zinc-500">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${command.enabled ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"}`}><CheckCircle2 size={12} /> {command.enabled ? "Enabled" : "Disabled"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.06] bg-white/[.025] px-2.5 py-1"><Shield size={13} /> {command.permission}</span>
        {command.cooldown != null && <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.06] bg-white/[.025] px-2.5 py-1"><Clock3 size={13} /> {command.cooldown}s</span>}
      </div>
    </motion.article>
  );
}