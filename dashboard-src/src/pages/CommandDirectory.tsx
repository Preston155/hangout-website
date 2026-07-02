import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Activity, Bot, CheckCircle2, Command, Filter, Gauge, Layers3, Search, Server, Sparkles, Terminal, Zap } from "lucide-react";
import catalogData from "../catalog.json";
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
  const live = activeBot ? statuses[activeBot.id] || activeBot.status : undefined;
  if (!activeBot || !live) return null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/[.09] bg-[#090a10]/72 p-5 shadow-[0_42px_120px_-70px_rgba(0,0,0,.95)] backdrop-blur-2xl sm:p-7 lg:p-8" style={{ "--accent": activeBot.accent } as React.CSSProperties}>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.018)),radial-gradient(circle_at_80%_15%,rgba(99,102,241,.2),transparent_26rem)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr] xl:items-stretch">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-zinc-400">
                <Sparkles size={13} style={{ color: activeBot.accent }} /> PrestonHQ Command OS
              </div>
              <h1 className="mt-5 max-w-4xl text-[clamp(34px,5.2vw,68px)] font-black leading-[.94] tracking-[-.07em] text-white">
                Command center for every PrestonHQ bot.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-400">
                Browse every command, switch bots instantly, and keep usage, permissions, categories, and runtime context in one clean dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric icon={Bot} label="Bots" value={catalog.bots.length} accent="#67e8f9" />
              <HeroMetric icon={Activity} label="Online" value={`${onlineCount}/${catalog.bots.length}`} accent="#34d399" />
              <HeroMetric icon={Command} label="Commands" value={totalCommands} accent="#a78bfa" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <RuntimePanel botName={activeBot.name} pm2={activeBot.pm2} prefix={activeBot.prefix} status={live.status} online={live.online} accent={activeBot.accent} total={activeBot.stats.total} />
            {featured && <Spotlight command={featured} accent={activeBot.accent} />}
          </div>
        </div>
      </section>

      <section id="bots" className="grid gap-3 lg:grid-cols-3">
        {catalog.bots.map((bot, index) => {
          const on = bot.id === activeBotId;
          const botLive = statuses[bot.id] || bot.status;
          return (
            <motion.button
              key={bot.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }}
              className={`group relative overflow-hidden rounded-[28px] border p-4 text-left transition duration-300 ${on ? "border-white/18 bg-white/[.075]" : "border-white/[.07] bg-white/[.025] hover:border-white/12 hover:bg-white/[.045]"}`}
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl transition group-hover:opacity-45" style={{ background: bot.accent }} />
              {on && <motion.div layoutId="bot-card-active" className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />}
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl text-base font-black text-black" style={{ background: `linear-gradient(135deg, ${bot.accent}, #fff)` }}>
                    {bot.name[0]}
                    <span className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#090a10] ${botLive.online ? "bg-emerald-400" : "bg-rose-400"}`} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-black text-white">{bot.name}</span>
                    <span className="mt-1 block text-[12px] font-semibold text-zinc-500">{bot.pm2} · {botLive.status}</span>
                  </span>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-black text-zinc-400">{bot.stats.total}</span>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                <BotMicro label="Slash" value={bot.stats.slash} />
                <BotMicro label="Prefix" value={bot.stats.prefix} />
                <BotMicro label="Auto" value={bot.stats.automation} />
              </div>
            </motion.button>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-white/[.075] bg-white/[.025] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[.18em] text-zinc-500"><span>Search</span><Search size={15} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/24 px-3.5 py-3">
              <Search size={16} className="text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Command, usage, permission…" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[.075] bg-white/[.025] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[.18em] text-zinc-500"><span>Categories</span><Filter size={15} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 grid gap-2">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-[12px] font-bold transition ${selected ? "border-white/15 bg-white/[.08] text-white" : "border-white/[.055] bg-black/10 text-zinc-500 hover:border-white/12 hover:text-zinc-200"}`}>
                    <span className="truncate">{cat}</span><span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-zinc-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[.075] bg-white/[.025] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[.18em] text-zinc-500"><span>Distribution</span><Gauge size={15} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 space-y-2">
              {catalog.categories.filter((cat) => categoryCounts.has(cat)).slice(0, 7).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/[.055] bg-black/10 px-3 py-2 text-left text-[12px] text-zinc-400 transition hover:border-white/12 hover:text-white">
                  <span className="min-w-0"><span className="block truncate">{cat}</span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/35"><span className="block h-full rounded-full" style={{ width: `${Math.max(18, ((categoryCounts.get(cat) || 0) / activeBot.stats.total) * 100)}%`, background: activeBot.accent }} /></span></span>
                  <b className="text-zinc-200">{categoryCounts.get(cat)}</b>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <div id="status" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
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
                      <h2 className="text-[22px] font-black tracking-[-.03em] text-white">{cat}</h2>
                      <p className="mt-1 text-[12px] font-semibold text-zinc-500">{items.length} command{items.length === 1 ? "" : "s"} in {activeBot.name}</p>
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

function RuntimePanel({ botName, pm2, prefix, status, online, accent, total }: { botName: string; pm2: string; prefix: string; status: string; online: boolean; accent: string; total: number }) {
  return <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[.045] p-5"><div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-25 blur-3xl" style={{ background: accent }} /><div className="relative flex items-center justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.18em] text-zinc-500">Selected bot</div><div className="mt-1 text-2xl font-black text-white">{botName}</div></div><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-black ${online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}><span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} />{online ? "Online" : status}</span></div><div className="relative mt-5 grid grid-cols-3 gap-2"><BotMicro label="PM2" value={pm2} /><BotMicro label="Prefix" value={prefix} /><BotMicro label="Commands" value={total} /></div></div>;
}
function Spotlight({ command, accent }: { command: BotCommand; accent: string }) { return <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/22 p-5"><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl" style={{ background: accent }} /><div className="relative flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.18em] text-zinc-500">Quick preview</span><Terminal size={18} style={{ color: accent }} /></div><h3 className="relative mt-3 break-all font-mono text-xl font-black text-white">{command.name}</h3><p className="relative mt-2 line-clamp-2 text-[13px] leading-6 text-zinc-400">{command.description}</p><code className="relative mt-4 block rounded-2xl border border-white/[.07] bg-white/[.035] px-3 py-2 font-mono text-[12px] text-zinc-200">{command.usage}</code></div>; }
function HeroMetric({ icon: Icon, label, value, accent }: { icon: typeof Bot; label: string; value: string | number; accent: string }) { return <div className="rounded-[24px] border border-white/[.08] bg-white/[.035] p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.16em] text-zinc-500">{label}</span><Icon size={16} style={{ color: accent }} /></div><div className="mt-2 text-3xl font-black text-white">{value}</div></div>; }
function BotMicro({ label, value }: { label: string; value: string | number }) { return <span className="min-w-0 rounded-2xl border border-white/[.07] bg-black/20 px-2.5 py-2 text-center"><span className="block truncate text-[13px] font-black text-white">{value}</span><span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-600">{label}</span></span>; }
function StatChip({ icon: Icon, label, value }: { icon: typeof Search; label: string; value: number }) { return <div className="rounded-[24px] border border-white/[.075] bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">{label}</span><Icon size={15} className="text-zinc-500" /></div><div className="mt-2 text-2xl font-black text-white">{value}</div></div>; }
function EmptyState({ bot }: { bot: string }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center rounded-[30px] border border-white/[.075] bg-white/[.025] py-24 text-center"><div className="grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[.04]"><Search size={30} className="text-zinc-500" /></div><p className="mt-4 text-lg font-bold text-white">No commands found</p><p className="mt-1 text-sm text-zinc-500">Try another search or category in {bot}.</p></motion.div>; }