import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Activity, Bot, CheckCircle2, ChevronRight, Command, Filter, Search, Terminal, Zap } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeColor = {
  slash: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  prefix: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  auto: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
} as const;

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

  if (!activeBot) return null;
  const live = statuses[activeBot.id] || activeBot.status;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-[72px] lg:self-start">
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <Label>Bots</Label>
            <span className="rounded-lg bg-white/[.05] px-2 py-1 text-[11px] font-bold text-zinc-500">{catalog.bots.length}</span>
          </div>
          <div className="space-y-1.5">
            {catalog.bots.map((bot) => {
              const selected = bot.id === activeBotId;
              const botLive = statuses[bot.id] || bot.status;
              return (
                <button key={bot.id} onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }} className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${selected ? "border-white/14 bg-white/[.075]" : "border-transparent hover:border-white/[.08] hover:bg-white/[.035]"}`}>
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black text-black" style={{ background: `linear-gradient(135deg, ${bot.accent}, #fff)` }}>
                    {bot.name[0]}
                    <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#08090d] ${botLive.online ? "bg-emerald-400" : "bg-rose-400"}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-black text-white">{bot.name}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-zinc-500">{bot.pm2} · {bot.stats.total} commands</span>
                  </span>
                  <ChevronRight size={14} className={`text-zinc-600 transition ${selected ? "text-zinc-300" : "group-hover:text-zinc-400"}`} />
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between"><Label>Categories</Label><Filter size={14} className="text-zinc-600" /></div>
          <div className="space-y-1.5">
            {FILTER_CATEGORIES.map((cat) => {
              const selected = category === cat;
              const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
              return (
                <button key={cat} onClick={() => setCategory(cat)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[12px] font-bold transition ${selected ? "bg-white/[.08] text-white" : "text-zinc-500 hover:bg-white/[.035] hover:text-zinc-300"}`}>
                  <span className="truncate">{cat}</span>
                  <span className="ml-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-zinc-500">{count}</span>
                </button>
              );
            })}
          </div>
        </Panel>
      </aside>

      <main className="min-w-0 space-y-4">
        <section className="rounded-[24px] border border-white/[.08] bg-[#0b0d14]/78 p-4 shadow-[0_24px_70px_-46px_rgba(0,0,0,.9)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">{activeBot.name}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${live.online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${live.online ? "bg-emerald-400" : "bg-rose-400"}`} />{live.status}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-semibold text-zinc-500">{activeBot.pm2} · prefix {activeBot.prefix} · {activeBot.stats.total} indexed commands</p>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:w-[420px]">
              <Stat label="Shown" value={filtered.length} />
              <Stat label="Slash" value={activeBot.stats.slash} />
              <Stat label="Prefix" value={activeBot.stats.prefix} />
              <Stat label="Auto" value={activeBot.stats.automation} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[.08] bg-black/25 px-3 py-2.5">
            <Search size={16} className="text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search command name, usage, permission..." className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-600" />
          </div>
        </section>

        <AnimatePresence mode="wait">
          <motion.div key={`${activeBot.id}-${category}-${query}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-5">
            {grouped.length ? grouped.map(({ category: cat, items }) => (
              <section key={cat} className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div>
                    <h2 className="text-[15px] font-black uppercase tracking-[.11em] text-zinc-300">{cat}</h2>
                    <p className="mt-0.5 text-[12px] text-zinc-600">{items.length} command{items.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="h-1 w-32 overflow-hidden rounded-full bg-white/[.06]"><span className="block h-full rounded-full" style={{ width: `${Math.max(18, (items.length / filtered.length) * 100)}%`, background: activeBot.accent }} /></div>
                </div>
                <div className="grid gap-2.5 xl:grid-cols-2 2xl:grid-cols-3">{items.map((cmd, i) => <CommandRow key={cmd.id} command={cmd} index={i} accent={activeBot.accent} />)}</div>
              </section>
            )) : <EmptyState bot={activeBot.name} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function CommandRow({ command, index, accent }: { command: BotCommand; index: number; accent: string }) {
  const copyUsage = async () => { try { await navigator.clipboard.writeText(command.usage || command.name); } catch {} };
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.01, 0.12) }} className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-[#0b0d14]/70 p-3 transition hover:border-white/[.14] hover:bg-[#10131d]">
      <div className="absolute left-0 top-0 h-full w-1 opacity-70" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Terminal size={14} style={{ color: accent }} />
            <h3 className="font-mono text-[14px] font-black text-white">{command.name}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${typeColor[command.type]}`}>{command.type}</span>
            {command.enabled && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300"><CheckCircle2 size={11} /> live</span>}
          </div>
          <p className="mt-2 line-clamp-1 text-[13px] text-zinc-400">{command.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <code className="rounded-lg border border-white/[.07] bg-black/25 px-2 py-1 font-mono text-zinc-300">{command.usage}</code>
            <span className="rounded-lg bg-white/[.035] px-2 py-1">{command.permission}</span>
          </div>
        </div>
        <button onClick={copyUsage} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-black/20 text-zinc-500 transition hover:text-white">⧉</button>
      </div>
    </motion.article>
  );
}

function Panel({ children }: { children: React.ReactNode }) { return <section className="rounded-[22px] border border-white/[.075] bg-[#0b0d14]/72 p-3 shadow-[0_18px_60px_-45px_rgba(0,0,0,.9)] backdrop-blur-xl">{children}</section>; }
function Label({ children }: { children: React.ReactNode }) { return <div className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-600">{children}</div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/[.07] bg-white/[.035] px-3 py-2"><div className="text-[9px] font-black uppercase tracking-[.14em] text-zinc-600">{label}</div><div className="text-lg font-black text-white">{value}</div></div>; }
function EmptyState({ bot }: { bot: string }) { return <div className="grid place-items-center rounded-[24px] border border-white/[.075] bg-[#0b0d14]/72 py-20 text-center"><Search size={30} className="text-zinc-600" /><p className="mt-4 text-lg font-bold text-white">No commands found</p><p className="mt-1 text-sm text-zinc-500">Try another search or category in {bot}.</p></div>; }