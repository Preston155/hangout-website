import { motion } from "framer-motion";
import type { LogEntry } from "../types";
import { timeAgo } from "../constants";
import { cx } from "./ui";

const dot: Record<LogEntry["kind"], string> = {
  info: "bg-brand-400",
  success: "bg-emerald-400",
  warn: "bg-amber-400",
  danger: "bg-rose-400",
};

export function ActivityFeed({ logs, limit }: { logs: LogEntry[]; limit?: number }) {
  const items = limit ? logs.slice(0, limit) : logs;
  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">No activity yet.</div>;
  }
  return (
    <div className="relative">
      <div className="absolute bottom-2 left-[6px] top-2 w-px bg-gradient-to-b from-white/10 to-transparent" />
      <div className="flex flex-col">
        {items.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="relative flex gap-3.5 py-2.5"
          >
            <span className={cx("relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-ink-950", dot[l.kind])} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-zinc-200">{l.tag}</span>
                <span className="text-[11px] text-zinc-600">{timeAgo(l.time)}</span>
              </div>
              <div className="text-[12.5px] leading-snug text-zinc-500">{l.msg}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
