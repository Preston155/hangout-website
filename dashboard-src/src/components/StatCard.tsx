import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  display,
  tint,
  live,
  sub,
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  display?: string;
  tint: string;
  live?: boolean;
  sub?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 26 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.025] p-4"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60"
        style={{ background: tint }}
      />
      <div className="relative flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] text-zinc-200">
          <Icon size={17} />
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            LIVE
          </span>
        )}
      </div>
      <div className="relative mt-3 text-2xl font-extrabold tracking-tight">
        {display != null ? display : value != null ? <AnimatedNumber value={value} /> : "—"}
      </div>
      <div className="relative mt-0.5 text-[12px] font-medium text-zinc-500">{label}</div>
      {sub && <div className="relative mt-0.5 text-[11px] text-zinc-600">{sub}</div>}
    </motion.div>
  );
}
