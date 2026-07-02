import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Activity, Bot, Command, Filter, Gauge, Layers3, Search, Server, Sparkles, Terminal, Zap } from "lucide-react";
import catalogData from "../catalog.json";
import { DirectoryCommandCard } from "../components/DirectoryCommandCard";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "icesway");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
  const { statuses } = useBotStatus();
  const activeBot = useMemo(() => catalog.bots.find((b) => b.id === activeBotId) || catalog.bots[0], [activeBotId]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!activeBot) return counts;
    for (const cmd of activeBot.commands) counts.set(cmd.category, (counts.get(cmd.category) || 0) + 1);
    return counts;
  }, [activeBot]);

  const filtered = useMemo(() => {
    if (!activeBot) return [];
    const q = query.trim().toLowerCase();
    return activeBot.commands.filter((cmd) => {
      const matchCategory = category === "All" || cmd.category === category;
      const hay = `${cmd.name} ${cmd.description} ${cmd.usage} ${cmd.permission} ${cmd.category} ${(cmd.aliases || []).join(" ")}`.toLowerCase();
      return matchCategory && (!q || hay.includes(q));
    });
  }, [activeBot, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const cmd of filtered) map.set(cmd.category, [...(map.get(cmd.category) || []), cmd]);
    return catalog.categories.filter((cat) => map.has(cat)).map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [filtered]);

  const totalCommands = catalog.bots.reduce((sum, bot) => sum + bot.stats.total, 0);
  const onlineCount = catalog.bots.filter((bot) => (statuses[bot.id] || bot.status).online).length;
  if (!activeBot) return null;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#090a10]/72 p-5 shadow-[0_36px_110px_-72px_rgba(0,0,0,.95)] backdrop-blur-2xl sm:p-6" style={{ "--accent": activeBot.accent } as React.CSSProperties}>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.012)),radial-gradient(circle_at_90%_0%,rgba(99,102,241,.18),transparent_24rem)]" />
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-zinc-400">
              <Sparkles size={12} style={{ color: activeBot.accent }} /> PrestonHQ Command OS
            </div>
            <h1 className="mt-4 max-w-4xl text-[clamp(30px,4.4vw,58px)] font-black leading-[.95] tracking-[-.055em] text-white">
              Commands for every bot, without the clutter.
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-zinc-400">
              Switch bots, search usage, and browse categories in a tighter dashboard that gets you to the commands fast.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-[420px]">
            <HeroMetric icon={Bot} label="Bots" value={catalog.bots.length} accent="#67e8f9" />
            <HeroMetric icon={Activity} label="Online" value={`${onlineCount}/${catalog.bots.length}`} accent="#34d399" />
            <HeroMetric icon={Command} label="Commands" value={totalCommands} accent="#a78bfa" />
          </div>
        </div>
      </section>

      <section id="bots" className="grid gap-3 lg:grid-cols-3">
        {catalog.bots.map((bot, index) => {
          const selected = bot.id === activeBotId;
          const live = statuses[bot.id] || bot.status;
          return (
            <motion.button
              key={bot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }}
              className={`group relative overflow-hidden rounded-[24px] border p-4 text-left transition ${selected ? "border-white/20 bg-white/[.075]" : "border-white/[.07] bg-white/[.025] hover:border-white/12 hover:bg-white/[.045]"}`}
            >
              <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40" style={{ background: bot.accent }} />
              <div className="relative flex items-center gap-3">
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl text-base font-black text-black" style={{ background: `linear-gradient(135deg, ${bot.accent}, #fff)` }}>
                  {bot.name[0]}
                  <span className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#090a10] ${live.online ? "bg-emerald-400" : "bg-rose-400"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-black text-white">{bot.name}</span>
                  <span className="mt-0.5 block text-[12px] font-semibold text-zinc-500">{bot.pm2} · {live.status}</span>
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-black text-zinc-400">{bot.stats.total}</span>
              </div>
            </motion.button>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[24px] border border-white/[.075] bg-white/[.025] p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-zinc-500"><span>Search</span><Search size={14} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/24 px-3 py-2.5">
              <Search size={15} className="text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a command…" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[.075] bg-white/[.025] p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-zinc-500"><span>Categories</span><Filter size={14} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 grid gap-1.5">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[12px] font-bold transition ${selected ? "border-white/15 bg-white/[.08] text-white" : "border-white/[.045] bg-black/10 text-zinc-500 hover:border-white/12 hover:text-zinc-200"}`}>
                    <span className="truncate">{cat}</span><span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-zinc-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden rounded-[24px] border border-white/[.075] bg-white/[.025] p-3 backdrop-blur-xl xl:block">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-zinc-500"><span>Stats</span><Gauge size={14} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat label="Shown" value={filtered.length} />
              <MiniStat label="Groups" value={grouped.length} />
              <MiniStat label="Slash" value={activeBot.stats.slash} />
              <MiniStat label="Prefix" value={activeBot.stats.prefix} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <div id="status" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4 xl:hidden">
            <StatChip icon={Search} label="Showing" value={filtered.length} />
            <StatChip icon={Layers3} label="Groups" value={grouped.length} />
            <StatChip icon={Terminal} label="Slash" value={activeBot.stats.slash} />
            <StatChip icon={Zap} label="Prefix" value={activeBot.stats.prefix} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`${activeBot.id}-${category}-${query}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-7">
              {grouped.length ? grouped.map(({ category: cat, items }) => (
                <section key={cat}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[20px] font-black tracking-[-.03em] text-white">{cat}</h2>
                      <p className="mt-0.5 text-[12px] font-semibold text-zinc-500">{items.length} command{items.length === 1 ? "" : "s"} in {activeBot.name}</p>
                    </div>
                    <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-white/[.06] sm:block"><span className="block h-full rounded-full" style={{ width: `${Math.max(22, (items.length / filtered.length) * 100)}%`, background: `linear-gradient(90deg, ${activeBot.accent}, transparent)` }} /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{items.map((cmd, i) => <DirectoryCommandCard key={cmd.id} command={cmd} index={i} accent={activeBot.accent} />)}</div>
                </section>
              )) : <EmptyState bot={activeBot.name} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </section>
    </div>
  );
}

function HeroMetric({ icon: Icon, label, value, accent }: { icon: typeof Bot; label: string; value: string | number; accent: string }) { return <div className="rounded-[20px] border border-white/[.08] bg-white/[.035] p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-500">{label}</span><Icon size={14} style={{ color: accent }} /></div><div className="mt-1 text-2xl font-black text-white">{value}</div></div>; }
function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/[.055] bg-black/15 p-2"><div className="text-[9px] font-black uppercase tracking-[.14em] text-zinc-600">{label}</div><div className="mt-1 text-lg font-black text-white">{value}</div></div>; }
function StatChip({ icon: Icon, label, value }: { icon: typeof Search; label: string; value: number }) { return <div className="rounded-[20px] border border-white/[.075] bg-white/[.025] p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">{label}</span><Icon size={14} className="text-zinc-500" /></div><div className="mt-1 text-xl font-black text-white">{value}</div></div>; }
function EmptyState({ bot }: { bot: string }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center rounded-[28px] border border-white/[.075] bg-white/[.025] py-20 text-center"><Search size={30} className="text-zinc-500" /><p className="mt-4 text-lg font-bold text-white">No commands found</p><p className="mt-1 text-sm text-zinc-500">Try another search or category in {bot}.</p></motion.div>; }