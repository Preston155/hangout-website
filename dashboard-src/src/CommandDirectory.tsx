import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Filter, Search, Sparkles } from "lucide-react";
import catalogData from "../catalog.json";
import { BotOverview } from "../components/BotOverview";
import { DirectoryCommandCard } from "../components/DirectoryCommandCard";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCatalog, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "icesway");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
  const { statuses } = useBotStatus();

  const activeBot = useMemo(
    () => catalog.bots.find((b) => b.id === activeBotId) || catalog.bots[0],
    [activeBotId]
  );

  const filtered = useMemo(() => {
    if (!activeBot) return [];
    const q = query.trim().toLowerCase();
    return activeBot.commands.filter((cmd) => {
      const matchCategory = category === "All" || cmd.category === category;
      const hay = `${cmd.name} ${cmd.description} ${cmd.usage} ${cmd.permission} ${cmd.category} ${(cmd.aliases || []).join(" ")}`.toLowerCase();
      const matchQuery = !q || hay.includes(q);
      return matchCategory && matchQuery;
    });
  }, [activeBot, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const cmd of filtered) {
      const list = map.get(cmd.category) || [];
      list.push(cmd);
      map.set(cmd.category, list);
    }
    return catalog.categories
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [filtered]);

  if (!activeBot) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-brand-200">
            <Sparkles size={13} /> PrestonHQ Command Directory
          </div>
          <h1 className="mt-3 text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight text-grad">
            Every bot. Every command.
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-zinc-400">
            Browse slash, prefix, and automation commands across IceSway Utils, Veltrix, and ECRP Assistant — indexed from live bot folders on the VPS.
          </p>
        </div>
        <div className="text-[12px] text-zinc-500">Catalog generated {new Date(catalog.generatedAt).toLocaleString()}</div>
      </header>

      {/* Bot tabs */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {catalog.bots.map((bot) => {
          const on = bot.id === activeBotId;
          const live = statuses[bot.id];
          return (
            <button
              key={bot.id}
              onClick={() => {
                setActiveBotId(bot.id);
                setCategory("All");
              }}
              className={`relative shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                on ? "border-white/15 bg-white/[.06] shadow-[0_20px_50px_-30px_rgba(0,0,0,.8)]" : "border-white/[.06] bg-white/[.02] hover:border-white/12"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl text-sm font-black text-[#09090b]"
                  style={{ background: `linear-gradient(135deg, ${bot.accent}, #6366f1)` }}
                >
                  {bot.name[0]}
                </span>
                <span>
                  <span className="block text-[14px] font-bold">{bot.name}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                    {bot.stats.total} commands
                    <span className={`inline-flex h-1.5 w-1.5 rounded-full ${(live || bot.status).online ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <BotOverview bot={activeBot} liveStatus={statuses[activeBot.id]} />

      {/* Search + filters */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 focus-within:border-brand-500/50">
            <Search size={16} className="text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${activeBot.name} commands…`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <Filter size={14} /> {filtered.length} shown
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTER_CATEGORIES.map((cat) => {
            const on = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition ${
                  on ? "border-brand-500/40 bg-brand-500/15 text-white" : "border-white/10 bg-white/[.03] text-zinc-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped command sections */}
      {grouped.length ? (
        <div className="space-y-8">
          {grouped.map(({ category: cat, items }) => (
            <section key={cat}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{cat}</h3>
                  <p className="text-[12px] text-zinc-500">{items.length} command{items.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((cmd, i) => (
                  <DirectoryCommandCard key={cmd.id} command={cmd} index={i} accent={activeBot.accent} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel grid place-items-center gap-3 py-20 text-center">
          <Search size={28} className="text-zinc-600" />
          <p className="text-zinc-400">No commands match your search in {activeBot.name}.</p>
        </motion.div>
      )}
    </div>
  );
}
