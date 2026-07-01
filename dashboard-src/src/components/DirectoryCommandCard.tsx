import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Copy, FileCode2, Shield, Sparkles, Terminal } from "lucide-react";
import type { BotCommand } from "../types";
import { TYPE_LABELS } from "../constants";

const TYPE_STYLE = {
  slash: "border-sky-500/35 bg-sky-500/12 text-sky-200",
  prefix: "border-violet-500/35 bg-violet-500/12 text-violet-200",
  auto: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
} as const;

export function DirectoryCommandCard({ command, index, accent }: { command: BotCommand; index: number; accent: string }) {
  const copyUsage = async () => {
    try { await navigator.clipboard.writeText(command.usage || command.name); } catch { /* noop */ }
  };

  return (
    <motion.article initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(index * 0.025, 0.32), duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }} whileHover={{ y: -6, scale: 1.012 }} className="group panel premium-card shine relative min-h-[260px] overflow-hidden p-4 sm:p-5" style={{ "--accent": accent, boxShadow: `0 28px 80px -40px ${accent}66` } as React.CSSProperties}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-20 blur-3xl transition duration-500 group-hover:opacity-50" style={{ background: accent }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[.045]" style={{ color: accent }}><Terminal size={15} /></span><h3 className="truncate font-mono text-[16px] font-black tracking-tight text-white">{command.name}</h3></div>
          <div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${TYPE_STYLE[command.type]}`}>{TYPE_LABELS[command.type]}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${command.enabled ? "border border-emerald-400/25 bg-emerald-500/12 text-emerald-200" : "border border-zinc-500/20 bg-zinc-500/10 text-zinc-400"}`}><CheckCircle2 size={12} /> {command.enabled ? "Enabled" : "Disabled"}</span></div>
        </div>
        <button onClick={copyUsage} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 text-zinc-500 transition hover:border-white/20 hover:bg-white/[.06] hover:text-white" title="Copy usage"><Copy size={15} /></button>
      </div>
      <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-zinc-400">{command.description}</p>
      <div className="mt-5 rounded-2xl border border-white/[.07] bg-black/24 p-3.5">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-zinc-600"><FileCode2 size={13} /> Usage Pattern</div>
        <code className="block break-all rounded-xl border border-white/[.06] bg-white/[.035] px-3 py-2 font-mono text-[12px] text-zinc-200">{command.usage}</code>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-zinc-500"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.06] bg-white/[.025] px-2.5 py-1"><Shield size={13} /> {command.permission}</span>{command.cooldown != null && <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.06] bg-white/[.025] px-2.5 py-1"><Clock3 size={13} /> {command.cooldown}s</span>}</div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[.06] pt-3 text-[11px] text-zinc-600"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.06] bg-white/[.03] px-2.5 py-1 font-bold text-zinc-400"><Sparkles size={12} style={{ color: accent }} /> {command.category}</span><span className="truncate font-mono">{command.source}</span></div>
    </motion.article>
  );
}
