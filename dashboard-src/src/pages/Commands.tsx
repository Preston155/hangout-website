import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Plus, Search, Star, Zap } from "lucide-react";
import { CommandCard } from "../components/CommandCard";
import { Button, Modal, cx, toast } from "../components/ui";
import { useStore } from "../store";
import { navigate } from "../router";
import { CAT_META, CATEGORIES } from "../constants";
import type { Command } from "../types";

export function Commands() {
  const { state, toggleCommand, toggleFavorite, duplicateCommand, removeCommand, log } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [pendingDelete, setPendingDelete] = useState<Command | null>(null);

  const list = useMemo(() => {
    return state.commands.filter((c) => {
      const matchQ = !q || `${c.name} ${c.description} ${c.permission} ${c.roles} ${c.category}`.toLowerCase().includes(q.toLowerCase());
      const matchF =
        filter === "All" ? true : filter === "Favorites" ? c.favorite : c.category === filter;
      return matchQ && matchF;
    });
  }, [state.commands, q, filter]);

  const tabs = ["All", "Favorites", ...CATEGORIES];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">Commands</div>
          <h1 className="mt-1.5 text-[clamp(24px,3.2vw,34px)] font-extrabold tracking-tight">Slash command center</h1>
          <p className="mt-1.5 text-[14px] text-zinc-400">Search, filter, toggle and edit every Veltrix command.</p>
        </div>
        <Button variant="primary" onClick={() => navigate("/new")}>
          <Plus size={16} /> New command
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2.5 focus-within:border-brand-500/60 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,.12)]">
          <Search size={16} className="text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search commands, permissions, roles…"
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t === "Favorites" ? Star : t === "All" ? Zap : CAT_META[t as keyof typeof CAT_META]?.icon;
            const on = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cx(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
                  on ? "border-brand-500/50 bg-brand-500/18 text-white" : "border-white/10 bg-white/[.03] text-zinc-400 hover:border-white/20 hover:text-white"
                )}
              >
                {Icon && <Icon size={13} style={t !== "All" && t !== "Favorites" ? { color: CAT_META[t as keyof typeof CAT_META]?.color } : undefined} />}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => (
            <CommandCard
              key={c.id}
              command={c}
              index={i}
              onToggle={() => {
                toggleCommand(c.id);
                log("Command", `/${c.name} ${c.enabled ? "disabled" : "enabled"}`, c.enabled ? "warn" : "success");
              }}
              onFavorite={() => toggleFavorite(c.id)}
              onEdit={() => navigate(`/builder?id=${c.id}`)}
              onDuplicate={() => {
                const copy = duplicateCommand(c.id);
                if (copy) {
                  log("Command", `/${c.name} duplicated`, "info");
                  toast(`Duplicated /${c.name}`);
                }
              }}
              onDelete={() => setPendingDelete(c)}
            />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-white/10 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[.04] text-zinc-500">
            <Search size={20} />
          </div>
          <p className="text-zinc-400">No commands match your search.</p>
          <Button variant="primary" size="sm" onClick={() => navigate("/new")}>
            <Plus size={14} /> Create one
          </Button>
        </div>
      )}

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete command?">
        <p className="text-[14px] leading-relaxed text-zinc-400">
          This removes <span className="font-mono font-semibold text-white">/{pendingDelete?.name}</span> from the dashboard. This won't delete files on the bot — it only affects the website's command list.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDelete) {
                removeCommand(pendingDelete.id);
                log("Command", `/${pendingDelete.name} deleted`, "danger");
                toast(`Deleted /${pendingDelete.name}`);
                setPendingDelete(null);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
