import { useMemo, useState } from "react";
import { Check, Copy, Hash, Search } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeClass = {
  slash: "bg-[#5865f2]/20 text-[#c9cdfb]",
  prefix: "bg-[#b96dff]/18 text-[#e7c8ff]",
  auto: "bg-[#23a559]/18 text-[#b9f3c9]",
} as const;

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "icesway");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
  const [query, setQuery] = useState("");
  const { statuses } = useBotStatus();

  const activeBot = useMemo(() => catalog.bots.find((bot) => bot.id === activeBotId) || catalog.bots[0], [activeBotId]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    if (!activeBot) return map;
    for (const command of activeBot.commands) map.set(command.category, (map.get(command.category) || 0) + 1);
    return map;
  }, [activeBot]);

  const filtered = useMemo(() => {
    if (!activeBot) return [];
    const q = query.trim().toLowerCase();
    return activeBot.commands.filter((command) => {
      const matchCategory = category === "All" || command.category === category;
      const haystack = `${command.name} ${command.description} ${command.usage} ${command.permission} ${command.category} ${command.source}`.toLowerCase();
      return matchCategory && (!q || haystack.includes(q));
    });
  }, [activeBot, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const command of filtered) map.set(command.category, [...(map.get(command.category) || []), command]);
    return catalog.categories.filter((cat) => map.has(cat)).map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [filtered]);

  if (!activeBot) return null;
  const live = statuses[activeBot.id] || activeBot.status;

  return (
    <div className="flex h-screen overflow-hidden bg-[#313338] text-[#dbdee1]">
      <aside className="flex w-[72px] shrink-0 flex-col items-center gap-3 bg-[#1e1f22] py-3">
        <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#5865f2] text-lg font-black text-white">P</div>
        <div className="h-px w-8 bg-[#35363c]" />
        {catalog.bots.map((bot) => {
          const selected = bot.id === activeBotId;
          const botLive = statuses[bot.id] || bot.status;
          return (
            <button key={bot.id} onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }} className="group relative">
              {selected && <span className="absolute -left-[12px] top-2 h-8 w-1 rounded-r bg-white" />}
              <span className={`relative grid h-12 w-12 place-items-center text-base font-black text-black transition-all ${selected ? "rounded-2xl" : "rounded-[24px] group-hover:rounded-2xl"}`} style={{ background: `linear-gradient(135deg, ${bot.accent}, #fff)` }}>
                {bot.name[0]}
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1e1f22] ${botLive.online ? "bg-[#23a559]" : "bg-[#f23f42]"}`} />
              </span>
            </button>
          );
        })}
      </aside>

      <aside className="hidden w-[260px] shrink-0 bg-[#2b2d31] md:block">
        <div className="flex h-14 items-center border-b border-[#1f2024] px-4 shadow-sm">
          <div>
            <div className="text-sm font-bold text-white">PrestonHQ Commands</div>
            <div className="text-xs text-[#949ba4]">{catalog.bots.length} connected bots</div>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-2 px-2 text-xs font-bold uppercase text-[#949ba4]">Bots</div>
          <div className="space-y-1">
            {catalog.bots.map((bot) => {
              const selected = bot.id === activeBotId;
              return (
                <button key={bot.id} onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }} className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm ${selected ? "bg-[#404249] text-white" : "text-[#b5bac1] hover:bg-[#35373c] hover:text-white"}`}>
                  <span className="grid h-7 w-7 place-items-center rounded bg-[#1e1f22] text-xs font-black" style={{ color: bot.accent }}>{bot.name[0]}</span>
                  <span className="min-w-0 flex-1 truncate">{bot.name}</span>
                  {selected && <Check size={14} />}
                </button>
              );
            })}
          </div>

          <div className="mt-5 mb-2 px-2 text-xs font-bold uppercase text-[#949ba4]">Categories</div>
          <div className="space-y-0.5">
            {FILTER_CATEGORIES.map((cat) => {
              const selected = category === cat;
              const count = cat === "All" ? activeBot.stats.total : counts.get(cat as CommandCategory) || 0;
              return (
                <button key={cat} onClick={() => setCategory(cat)} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${selected ? "bg-[#404249] text-white" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"}`}>
                  <Hash size={15} />
                  <span className="min-w-0 flex-1 truncate">{cat}</span>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#26272c] bg-[#313338] px-4">
          <Hash size={22} className="text-[#80848e]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-bold text-white">{activeBot.name}</h1>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${live.online ? "bg-[#23a559]/20 text-[#8ff0a4]" : "bg-[#f23f42]/20 text-[#ffb3b3]"}`}>{live.status}</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded bg-[#1e1f22] px-3 py-1.5 text-xs text-[#b5bac1] sm:flex">
            <span>{filtered.length}/{activeBot.stats.total}</span>
            <span>•</span>
            <span>{activeBot.pm2}</span>
          </div>
        </header>

        <div className="border-b border-[#26272c] bg-[#313338] p-4">
          <div className="flex items-center gap-2 rounded bg-[#1e1f22] px-3 py-2">
            <Search size={16} className="text-[#80848e]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands, usage, permissions..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#80848e]" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {grouped.length ? grouped.map(({ category: group, items }) => (
            <section key={group} className="mb-7">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-[#949ba4]">
                <span>{group}</span>
                <span className="text-[#60646c]">{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map((command) => <CommandMessage key={command.id} command={command} />)}
              </div>
            </section>
          )) : (
            <div className="grid h-full place-items-center text-center text-[#949ba4]">No commands found.</div>
          )}
        </div>
      </main>
    </div>
  );
}

function CommandMessage({ command }: { command: BotCommand }) {
  const copy = async () => { try { await navigator.clipboard.writeText(command.usage || command.name); } catch {} };
  return (
    <article className="group flex gap-3 rounded px-2 py-2 hover:bg-[#2e3035]">
      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#5865f2] font-mono text-sm font-black text-white">/</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">{command.name}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeClass[command.type]}`}>{command.type}</span>
          {command.enabled && <span className="rounded bg-[#23a559]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#8ff0a4]">live</span>}
        </div>
        <p className="mt-1 text-sm text-[#b5bac1]">{command.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-[#1e1f22] px-2 py-1 font-mono text-[#dbdee1]">{command.usage}</code>
          <span className="rounded bg-[#35373c] px-2 py-1 text-[#b5bac1]">{command.permission}</span>
          <span className="hidden rounded bg-[#35373c] px-2 py-1 font-mono text-[#949ba4] lg:inline">{command.source}</span>
          <button onClick={copy} className="inline-flex items-center gap-1 rounded bg-[#35373c] px-2 py-1 text-[#b5bac1] opacity-0 transition hover:bg-[#404249] hover:text-white group-hover:opacity-100"><Copy size={12} /> Copy</button>
        </div>
      </div>
    </article>
  );
}