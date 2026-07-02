import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Bot, Check, ChevronRight, Copy, Search, Shield, Terminal } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeStyle = {
  slash: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  prefix: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  auto: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
} as const;

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "icesway");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selectedCommand = useMemo(() => filtered.find((cmd) => cmd.id === selectedId) || filtered[0] || null, [filtered, selectedId]);
  if (!activeBot) return null;
  const live = statuses[activeBot.id] || activeBot.status;

  return (
    <div className="grid min-h-[calc(100vh-92px)] gap-0 overflow-hidden rounded-2xl border border-white/[.08] bg-[#07080c]/90 lg:grid-cols-[260px_1fr_340px]">
      <aside className="border-b border-white/[.08] bg-[#08090d] p-3 lg:border-b-0 lg:border-r">
        <div className="mb-4 px-2">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-600">Bots</div>
        </div>
        <div className="space-y-1">
          {catalog.bots.map((bot) => {
            const selected = bot.id === activeBotId;
            const botLive = statuses[bot.id] || bot.status;
            return (
              <button
                key={bot.id}
                onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); setSelectedId(null); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? "bg-white/[.08] text-white" : "text-zinc-400 hover:bg-white/[.04] hover:text-white"}`}
              >
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-black text-black" style={{ background: `linear-gradient(135deg, ${bot.accent}, #fff)` }}>
                  {bot.name[0]}
                  <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#08090d] ${botLive.online ? "bg-emerald-400" : "bg-rose-400"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{bot.name}</span>
                  <span className="block truncate text-[11px] text-zinc-600">{bot.pm2} · {bot.stats.total}</span>
                </span>
                {selected && <Check size={14} className="text-zinc-400" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 border-t border-white/[.08] pt-4">
          <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[.2em] text-zinc-600">Categories</div>
          <div className="space-y-0.5">
            {FILTER_CATEGORIES.map((cat) => {
              const selected = category === cat;
              const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
              return (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setSelectedId(null); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition ${selected ? "bg-white/[.07] text-white" : "text-zinc-500 hover:bg-white/[.035] hover:text-zinc-300"}`}
                >
                  <span className="truncate">{cat}</span>
                  <span className="ml-2 text-[11px] text-zinc-600">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-[#050609]">
        <div className="sticky top-[65px] z-20 border-b border-white/[.08] bg-[#050609]/92 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">{activeBot.name}</h1>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${live.online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}>{live.status}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-zinc-500">{activeBot.pm2} · prefix {activeBot.prefix} · {filtered.length} shown / {activeBot.stats.total} total</p>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] px-3 py-2 xl:w-[420px]">
              <Search size={15} className="shrink-0 text-zinc-600" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }} placeholder="Search commands, usage, permissions…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${activeBot.id}-${category}-${query}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="p-4">
            {grouped.length ? (
              <div className="space-y-6">
                {grouped.map(({ category: cat, items }) => (
                  <section key={cat}>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-[11px] font-black uppercase tracking-[.18em] text-zinc-500">{cat}</h2>
                      <span className="text-[11px] text-zinc-600">{items.length}</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-white/[.08] bg-[#08090d]">
                      {items.map((cmd) => (
                        <CommandLine key={cmd.id} command={cmd} selected={selectedCommand?.id === cmd.id} accent={activeBot.accent} onSelect={() => setSelectedId(cmd.id)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl border border-white/[.08] bg-[#08090d] py-20 text-center">
                <Search size={28} className="text-zinc-600" />
                <p className="mt-3 font-bold text-white">No commands found</p>
                <p className="mt-1 text-sm text-zinc-500">Try another search or category.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <aside className="hidden border-l border-white/[.08] bg-[#08090d] p-4 lg:block">
        <CommandInspector command={selectedCommand} bot={activeBot.name} accent={activeBot.accent} />
      </aside>
    </div>
  );
}

function CommandLine({ command, selected, accent, onSelect }: { command: BotCommand; selected: boolean; accent: string; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`grid w-full grid-cols-[1fr_auto] gap-3 border-b border-white/[.06] px-3 py-3 text-left last:border-b-0 transition ${selected ? "bg-white/[.055]" : "hover:bg-white/[.03]"}`}>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <Terminal size={14} style={{ color: accent }} />
          <span className="font-mono text-[13px] font-black text-white">{command.name}</span>
          <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase ${typeStyle[command.type]}`}>{command.type}</span>
          {command.enabled && <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-300">live</span>}
        </span>
        <span className="mt-1 block truncate text-[12px] text-zinc-500">{command.description}</span>
      </span>
      <span className="hidden min-w-0 items-center gap-2 text-right sm:flex">
        <code className="rounded-md bg-black/25 px-2 py-1 font-mono text-[11px] text-zinc-400">{command.usage}</code>
        <ChevronRight size={14} className="text-zinc-700" />
      </span>
    </button>
  );
}

function CommandInspector({ command, bot, accent }: { command: BotCommand | null; bot: string; accent: string }) {
  if (!command) return <div className="text-sm text-zinc-500">Select a command.</div>;
  const copy = async () => { try { await navigator.clipboard.writeText(command.usage || command.name); } catch {} };
  return (
    <div className="sticky top-[84px] space-y-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-600">Command details</div>
        <h2 className="mt-2 break-all font-mono text-xl font-black text-white">{command.name}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{command.description}</p>
      </div>
      <div className="rounded-xl border border-white/[.08] bg-black/20 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-zinc-600">Usage</div>
        <code className="block break-all font-mono text-sm text-white">{command.usage}</code>
        <button onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-xs font-bold text-zinc-300 transition hover:text-white"><Copy size={13} /> Copy usage</button>
      </div>
      <Info label="Bot" value={bot} />
      <Info label="Type" value={command.type} />
      <Info label="Category" value={command.category} />
      <Info label="Permission" value={command.permission} />
      <Info label="Source" value={command.source} />
      <div className="h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><div className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-600">{label}</div><div className="mt-1 break-words text-sm font-semibold text-zinc-300">{value}</div></div>; }