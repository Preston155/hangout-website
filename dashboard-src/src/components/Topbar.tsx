import { motion } from "framer-motion";
import { Search, Menu, Plus, Command as CommandIcon, Activity, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../router";
import { Button, cx } from "./ui";
import type { HealthState } from "../useHealth";
import { CAT_META } from "../constants";

export function Topbar({ health, onMenu }: { health: HealthState; onMenu: () => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = q
    ? state.commands.filter((c) => `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-soft">
        <button onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-300 hover:bg-white/10 lg:hidden">
          <Menu size={18} />
        </button>

        {/* Command search */}
        <div className="relative flex-1 max-w-xl">
          <div className={cx("flex items-center gap-2.5 rounded-xl border bg-black/30 px-3 py-2 transition", focus ? "border-brand-500/60 shadow-[0_0_0_4px_rgba(99,102,241,.12)]" : "border-white/10")}>
            <Search size={16} className="text-zinc-500" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              placeholder="Search commands…"
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
            />
            <kbd className="hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 sm:inline-flex">
              ⌘K
            </kbd>
          </div>
          {focus && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong absolute left-0 right-0 top-12 z-40 rounded-2xl p-1.5 shadow-card"
            >
              {results.map((c) => {
                const Icon = CAT_META[c.category].icon;
                return (
                  <button
                    key={c.id}
                    onMouseDown={() => navigate(`/builder?id=${c.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[.06]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5" style={{ color: CAT_META[c.category].color }}>
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[13px] text-white">/{c.name}</span>
                      <span className="block truncate text-[11px] text-zinc-500">{c.description}</span>
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 sm:flex">
            {health.online ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-rose-400" />}
            <span className="text-[12px] font-semibold text-zinc-300">{health.loading ? "Checking…" : health.online ? "Veltrix online" : "Offline"}</span>
            {health.latency != null && <span className="text-[11px] text-zinc-600">· {health.latency}ms</span>}
          </div>
          <Button variant="primary" size="md" onClick={() => navigate("/new")}>
            <Plus size={16} /> <span className="hidden sm:inline">New command</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
