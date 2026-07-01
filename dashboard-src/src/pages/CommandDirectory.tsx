import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Activity, Bot, ChevronRight, Command, Filter, Gauge, Radar, Search, Sparkles, Terminal, Zap } from "lucide-react";
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
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[36px] border border-white/[.1] bg-white/[.035] p-5 shadow-[0_44px_130px_-64px_rgba(0,0,0,.98)] backdrop-blur-2xl sm:p-7 lg:p-8 animated-border command-hero" style={{ "--accent": activeBot.accent } as React.CSSProperties}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(129,140,248,.24),transparent_26rem),radial-gradient(circle_at_88%_12%,rgba(217,70,239,.18),transparent_24rem)]" />
        <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full opacity-35 blur-3xl" style={{ background: activeBot.accent }} />
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 opacity-40 lg:block" style={{ animation: "orbit 18s linear infinite" }} />
        <div className="flex flex-col gap-7 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="flex max-w-3xl flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-brand-200"><Radar size={13} /> PrestonHQ Command Nexus</div>
              <h1 className="mt-4 text-[clamp(36px,5vw,72px)] font-black leading-[0.92] tracking-[-0.06em] text-grad">Bot commands with a real mission-control feel.</h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-7 text-zinc-400 sm:text-[15px]">A polished command directory for IceSway, Veltrix, and ECRP with live status styling, grouped command intelligence, search, filters, and premium animated command cards.</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniStat icon={Bot} label="Bots indexed" value={catalog.bots.length} tone="from-cyan-400 to-brand-500" />
              <MiniStat icon={Activity} label="Runtime online" value={`${onlineCount}/${catalog.bots.length}`} tone="from-emerald-400 to-lime-300" />
              <MiniStat icon={Command} label="Commands" value={totalCommands} tone="from-fuchsia-400 to-brand-violet" />
            </div>
          </div>
          {featured && <CommandSpotlight command={featured} accent={activeBot.accent} botName={activeBot.name} />}
        </div>
        <div className="mt-7 h-2 overflow-hidden rounded-full border border-white/10 bg-black/30"><div className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" style={{ animation: "pulse-bar 3.2s ease-in-out infinite" }} /></div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/[.08] bg-black/18 p-2 backdrop-blur-xl">
            {catalog.bots.map((bot, i) => {
              const on = bot.id === activeBotId;
              const live = statuses[bot.id] || bot.status;
              return (
                <motion.button key={bot.id} onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className={`group relative mb-2 last:mb-0 w-full overflow-hidden rounded-[24px] border p-4 text-left transition duration-300 shine ${on ? "border-white/16 bg-white/[.075]" : "border-transparent bg-white/[.02] hover:border-white/10 hover:bg-white/[.04]"}`} style={{ boxShadow: on ? `0 26px 80px -46px ${bot.accent}` : undefined }}>
                  {on && <motion.div layoutId="active-bot-glow" className="absolute inset-0 rounded-[24px] border border-white/[.08]" />}
                  <div className="absolute inset-y-3 left-0 w-1 rounded-full opacity-80" style={{ background: `linear-gradient(${bot.accent}, transparent)` }} />
                  <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-45" style={{ background: bot.accent }} />
                  <div className="flex items-center gap-3">
                    <span className="relative grid h-12 w-12 place-items-center rounded-2xl text-base font-black text-[#07070b] shadow-[0_14px_40px_-18px_rgba(0,0,0,.9)]" style={{ background: `linear-gradient(135deg, ${bot.accent}, #f0abfc)` }}>{bot.name[0]}<span className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-ink-950 ${live.online ? "bg-emerald-400" : "bg-rose-400"}`} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-extrabold">{bot.name}</span><span className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500"><Bot size={12} /> {bot.pm2} · {live.status}</span></span>
                    <ChevronRight size={17} className={`text-zinc-500 transition ${on ? "translate-x-0 text-white" : "-translate-x-1 group-hover:translate-x-0"}`} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2"><BotPill label="Slash" value={bot.stats.slash} /><BotPill label="Prefix" value={bot.stats.prefix} /><BotPill label="Auto" value={bot.stats.automation} /></div>
                </motion.button>
              );
            })}
          </div>
          <div className="panel p-4">
            <div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.16em] text-zinc-500">Category map</span><Gauge size={15} style={{ color: activeBot.accent }} /></div>
            <div className="mt-3 space-y-2">
              {catalog.categories.filter((cat) => categoryCounts.has(cat)).slice(0, 6).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className="flex w-full items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] px-3 py-2 text-left text-[12px] text-zinc-400 transition hover:border-white/12 hover:text-white">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30"><span className="block h-full rounded-full" style={{ width: `${Math.max(18, ((categoryCounts.get(cat) || 0) / activeBot.stats.total) * 100)}%`, background: activeBot.accent }} /></span>
                  <span className="w-28 truncate">{cat}</span>
                  <b className="text-zinc-200">{categoryCounts.get(cat)}</b>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <AnimatePresence mode="wait"><motion.div key={activeBot.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}><BotOverview bot={activeBot} liveStatus={statuses[activeBot.id]} /></motion.div></AnimatePresence>
          <div className="panel p-4 sm:p-5 scanline">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="group flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 transition focus-within:border-brand-400/50 focus-within:bg-black/34"><Search size={17} className="text-zinc-500 transition group-focus-within:text-brand-300" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${activeBot.name} commands, usage, permissions…`} className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" /></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[460px]"><SearchStat label="Shown" value={filtered.length} /><SearchStat label="Categories" value={grouped.length} /><SearchStat label="Slash" value={activeBot.stats.slash} /><SearchStat label="Prefix" value={activeBot.stats.prefix} /></div>
            </div>
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              {FILTER_CATEGORIES.map((cat) => {
                const on = category === cat;
                const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
                return <button key={cat} onClick={() => setCategory(cat)} className={`relative shrink-0 overflow-hidden rounded-full border px-4 py-2 text-[12px] font-bold transition ${on ? "border-brand-400/50 bg-brand-500/18 text-white shadow-[0_0_32px_-16px_rgba(99,102,241,.9)]" : "border-white/10 bg-white/[.03] text-zinc-400 hover:border-white/18 hover:text-white"}`}>{on && <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent" />}{cat} <span className="ml-1 text-zinc-500">{count}</span></button>;
              })}
            </div>
          </div>

          {grouped.length ? <div className="space-y-9">{grouped.map(({ category: cat, items }) => (
            <section key={cat}>
              <div className="mb-4 flex items-end justify-between gap-3"><div className="min-w-0"><div className="mb-2 h-1.5 w-52 overflow-hidden rounded-full border border-white/10 bg-black/30"><div className="h-full rounded-full" style={{ width: `${Math.max(26, (items.length / filtered.length) * 100)}%`, background: `linear-gradient(90deg, ${activeBot.accent}, transparent)` }} /></div><h3 className="text-xl font-black tracking-tight">{cat}</h3><p className="mt-1 text-[12px] text-zinc-500">{items.length} command{items.length === 1 ? "" : "s"} loaded for {activeBot.name}</p></div><div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-zinc-500 sm:flex"><Zap size={13} style={{ color: activeBot.accent }} /> Active group</div></div>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{items.map((cmd, i) => <DirectoryCommandCard key={cmd.id} command={cmd} index={i} accent={activeBot.accent} />)}</div>
            </section>
          ))}</div> : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel grid place-items-center gap-4 py-24 text-center"><div className="grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[.04]"><Search size={30} className="text-zinc-500" /></div><div><p className="text-lg font-bold">No commands found</p><p className="mt-1 text-sm text-zinc-500">Try another search or category in {activeBot.name}.</p></div></motion.div>}
        </div>
      </section>
    </div>
  );
}

function CommandSpotlight({ command, accent, botName }: { command: BotCommand; accent: string; botName: string }) {
  return <div className="relative min-w-0 rounded-[30px] border border-white/10 bg-black/22 p-5 xl:w-[430px] scanline"><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: accent }} /><div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-zinc-500"><Sparkles size={12} style={{ color: accent }} /> Featured command</div><Terminal size={18} style={{ color: accent }} /></div><h2 className="mt-4 break-all font-mono text-2xl font-black text-white">{command.name}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{command.description}</p><div className="mt-4 rounded-2xl border border-white/[.07] bg-white/[.035] p-3"><div className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">Usage</div><code className="mt-1 block break-all font-mono text-[12px] text-zinc-200">{command.usage}</code></div><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-zinc-400"><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1">{botName}</span><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1">{command.category}</span><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1">{command.permission}</span></div></div>;
}
function MiniStat({ icon: Icon, label, value, tone }: { icon: typeof Bot; label: string; value: string | number; tone: string }) { return <div className="rounded-3xl border border-white/10 bg-black/20 p-4"><div className={`mb-3 h-1 rounded-full bg-gradient-to-r ${tone}`} /><div className="flex items-center gap-2"><Icon size={17} className="text-white/70" /><div className="text-2xl font-black tracking-tight">{value}</div></div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">{label}</div></div>; }
function BotPill({ label, value }: { label: string; value: number }) { return <span className="rounded-2xl border border-white/[.07] bg-black/20 px-2.5 py-2 text-center"><span className="block text-[13px] font-black text-white">{value}</span><span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-600">{label}</span></span>; }
function SearchStat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2"><div className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-600">{label}</div><div className="text-lg font-black text-white">{value}</div></div>; }