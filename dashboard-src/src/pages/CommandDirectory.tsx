import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Activity, Bot, ChevronRight, Command, Filter, Gauge, Layers3, Radar, Search, Sparkles, Terminal, Zap } from "lucide-react";
import catalogData from "../catalog.json";
import { BotOverview } from "../components/BotOverview";
import { DirectoryCommandCard } from "../components/DirectoryCommandCard";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

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
  const featured = filtered[0] || activeBot?.commands[0];
  if (!activeBot) return null;

  return (
    <div className="space-y-6">
      <section className="modern-hero relative overflow-hidden rounded-[34px] border border-white/[.09] bg-white/[.04] p-5 shadow-[0_42px_120px_-64px_rgba(0,0,0,.95)] backdrop-blur-2xl sm:p-7 lg:p-8" style={{ "--accent": activeBot.accent } as React.CSSProperties}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,.20),transparent_26rem),radial-gradient(circle_at_85%_0%,rgba(34,211,238,.12),transparent_22rem)]" />
        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-zinc-400">
              <Radar size={13} style={{ color: activeBot.accent }} /> PrestonHQ command center
            </div>
            <h1 className="mt-4 text-[clamp(34px,5vw,64px)] font-black leading-[.96] tracking-[-.055em] text-white">
              One clean hub for every bot command.
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-zinc-400 sm:text-[15px]">
              Fast command lookup for IceSway, Veltrix, and ECRP — with live-style bot panels, categories, usage examples, permissions, and source info in a cleaner modern dashboard.
            </p>
          </div>
          {featured && <CommandSpotlight command={featured} accent={activeBot.accent} botName={activeBot.name} />}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Bot} label="Bots connected" value={catalog.bots.length} accent="#67e8f9" />
        <MetricCard icon={Activity} label="Online status" value={`${onlineCount}/${catalog.bots.length}`} accent="#34d399" />
        <MetricCard icon={Command} label="Commands indexed" value={totalCommands} accent="#a78bfa" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-white/[.08] bg-black/20 p-2 backdrop-blur-xl">
            <div className="px-3 pb-2 pt-2 text-[11px] font-black uppercase tracking-[.18em] text-zinc-600">Bot tabs</div>
            <div className="space-y-2">
              {catalog.bots.map((bot, i) => {
                const on = bot.id === activeBotId;
                const live = statuses[bot.id] || bot.status;
                return (
                  <motion.button
                    key={bot.id}
                    onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`group relative w-full overflow-hidden rounded-[22px] border p-3.5 text-left transition ${on ? "border-white/15 bg-white/[.075]" : "border-transparent bg-white/[.018] hover:border-white/10 hover:bg-white/[.04]"}`}
                  >
                    {on && <motion.div layoutId="bot-active-bg" className="absolute inset-0 rounded-[22px] bg-white/[.035]" />}
                    <div className="relative flex items-center gap-3">
                      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black text-[#07070b]" style={{ background: `linear-gradient(135deg, ${bot.accent}, #f0abfc)` }}>
                        {bot.name[0]}
                        <span className={`absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-950 ${live.online ? "bg-emerald-400" : "bg-rose-400"}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-extrabold text-white">{bot.name}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500"><Bot size={12} /> {bot.pm2} · {bot.stats.total} commands</span>
                      </span>
                      <ChevronRight size={16} className={`relative text-zinc-500 transition ${on ? "text-white" : "group-hover:text-zinc-300"}`} />
                    </div>
                    <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
                      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(18, (bot.stats.total / totalCommands) * 100))}%`, background: `linear-gradient(90deg, ${bot.accent}, transparent)` }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.18em] text-zinc-500">Filters</span><Filter size={15} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/24 px-3.5 py-3">
              <Search size={16} className="text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands…" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>
            <div className="mt-3 grid gap-2">
              {FILTER_CATEGORIES.map((cat) => {
                const on = category === cat;
                const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-[12px] font-bold transition ${on ? "border-white/15 bg-white/[.075] text-white" : "border-white/[.06] bg-white/[.02] text-zinc-500 hover:border-white/12 hover:text-zinc-200"}`}>
                    <span className="truncate">{cat}</span><span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-zinc-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.18em] text-zinc-500">Category map</span><Gauge size={15} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 space-y-2">
              {catalog.categories.filter((cat) => categoryCounts.has(cat)).slice(0, 7).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className="flex w-full items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.02] px-3 py-2 text-left text-[12px] text-zinc-400 transition hover:border-white/12 hover:text-white">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30"><span className="block h-full rounded-full" style={{ width: `${Math.max(18, ((categoryCounts.get(cat) || 0) / activeBot.stats.total) * 100)}%`, background: activeBot.accent }} /></span>
                  <span className="w-28 truncate">{cat}</span>
                  <b className="text-zinc-200">{categoryCounts.get(cat)}</b>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeBot.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
              <BotOverview bot={activeBot} liveStatus={statuses[activeBot.id]} />
            </motion.div>
          </AnimatePresence>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SearchStat label="Showing" value={filtered.length} icon={Search} />
            <SearchStat label="Groups" value={grouped.length} icon={Layers3} />
            <SearchStat label="Slash" value={activeBot.stats.slash} icon={Terminal} />
            <SearchStat label="Prefix" value={activeBot.stats.prefix} icon={Zap} />
          </div>

          {grouped.length ? <div className="space-y-8">{grouped.map(({ category: cat, items }) => (
            <section key={cat}>
              <div className="mb-4 flex items-end justify-between gap-3 rounded-[24px] border border-white/[.06] bg-white/[.025] px-4 py-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black tracking-tight text-white">{cat}</h3>
                  <p className="mt-1 text-[12px] text-zinc-500">{items.length} command{items.length === 1 ? "" : "s"} in {activeBot.name}</p>
                </div>
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-black/35 sm:w-44"><div className="h-full rounded-full" style={{ width: `${Math.max(24, (items.length / filtered.length) * 100)}%`, background: `linear-gradient(90deg, ${activeBot.accent}, transparent)` }} /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{items.map((cmd, i) => <DirectoryCommandCard key={cmd.id} command={cmd} index={i} accent={activeBot.accent} />)}</div>
            </section>
          ))}</div> : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel grid place-items-center gap-4 py-24 text-center"><div className="grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[.04]"><Search size={30} className="text-zinc-500" /></div><div><p className="text-lg font-bold">No commands found</p><p className="mt-1 text-sm text-zinc-500">Try another search or category in {activeBot.name}.</p></div></motion.div>}
        </main>
      </section>
    </div>
  );
}

function CommandSpotlight({ command, accent, botName }: { command: BotCommand; accent: string; botName: string }) {
  return <div className="relative min-w-0 rounded-[28px] border border-white/10 bg-black/20 p-4 xl:w-[410px]"><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl" style={{ background: accent }} /><div className="relative flex items-center justify-between"><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-zinc-500"><Sparkles size={12} style={{ color: accent }} /> Spotlight</div><Terminal size={18} style={{ color: accent }} /></div><h2 className="relative mt-4 break-all font-mono text-xl font-black text-white">{command.name}</h2><p className="relative mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{command.description}</p><div className="relative mt-4 rounded-2xl border border-white/[.07] bg-white/[.035] p-3"><div className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">Usage</div><code className="mt-1 block break-all font-mono text-[12px] text-zinc-200">{command.usage}</code></div><div className="relative mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-zinc-400"><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1">{botName}</span><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1">{command.category}</span></div></div>;
}
function MetricCard({ icon: Icon, label, value, accent }: { icon: typeof Bot; label: string; value: string | number; accent: string }) { return <div className="panel p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.16em] text-zinc-500">{label}</span><Icon size={17} style={{ color: accent }} /></div><div className="mt-2 text-3xl font-black text-white">{value}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30"><div className="h-full w-2/3 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} /></div></div>; }
function SearchStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Search }) { return <div className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">{label}</div><Icon size={15} className="text-zinc-500" /></div><div className="mt-2 text-2xl font-black text-white">{value}</div></div>; }