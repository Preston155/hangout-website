import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeClass = {
  slash: "bg-blue-500/10 text-blue-300 ring-blue-400/20",
  prefix: "bg-purple-500/10 text-purple-300 ring-purple-400/20",
  auto: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
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
    for (const command of activeBot.commands) counts.set(command.category, (counts.get(command.category) || 0) + 1);
    return counts;
  }, [activeBot]);

  const filtered = useMemo(() => {
    if (!activeBot) return [];
    const q = query.trim().toLowerCase();
    return activeBot.commands.filter((command) => {
      const matchesCategory = category === "All" || command.category === category;
      const haystack = `${command.name} ${command.description} ${command.usage} ${command.permission} ${command.category} ${command.source}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [activeBot, query, category]);

  if (!activeBot) return null;
  const live = statuses[activeBot.id] || activeBot.status;

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-[#101012] p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Command database</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{activeBot.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{activeBot.pm2} · prefix {activeBot.prefix} · {filtered.length} shown / {activeBot.stats.total} total · {live.status}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center sm:w-[430px]">
          <Stat label="Shown" value={filtered.length} />
          <Stat label="Slash" value={activeBot.stats.slash} />
          <Stat label="Prefix" value={activeBot.stats.prefix} />
          <Stat label="Auto" value={activeBot.stats.automation} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <Box title="Bots">
            <div className="space-y-1">
              {catalog.bots.map((bot) => {
                const selected = bot.id === activeBotId;
                const botLive = statuses[bot.id] || bot.status;
                return (
                  <button
                    key={bot.id}
                    onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${selected ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                  >
                    <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-black text-black" style={{ background: `linear-gradient(135deg, ${bot.accent}, #fff)` }}>
                      {bot.name[0]}
                      <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#101012] ${botLive.online ? "bg-emerald-400" : "bg-red-400"}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{bot.name}</span>
                      <span className="block truncate text-xs text-zinc-600">{bot.stats.total} commands</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Box>

          <Box title="Categories">
            <div className="space-y-1">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat as CommandCategory) || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${selected ? "bg-zinc-800 text-white" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="ml-2 text-xs text-zinc-600">{count}</span>
                  </button>
                );
              })}
            </div>
          </Box>
        </aside>

        <main className="min-w-0 rounded-xl border border-zinc-800 bg-[#101012]">
          <div className="border-b border-zinc-800 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#0a0a0b] px-3 py-2.5">
              <Search size={16} className="text-zinc-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search command, usage, permission, source…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-[#0c0c0e] text-xs uppercase tracking-[0.14em] text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Command</th>
                  <th className="px-4 py-3 font-bold">Description</th>
                  <th className="px-4 py-3 font-bold">Usage</th>
                  <th className="px-4 py-3 font-bold">Permission</th>
                  <th className="px-4 py-3 font-bold">Source</th>
                  <th className="px-4 py-3 text-right font-bold">Copy</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((command) => <CommandRow key={command.id} command={command} />)}
              </tbody>
            </table>
          </div>

          {!filtered.length && (
            <div className="grid place-items-center py-20 text-center">
              <Search size={28} className="text-zinc-700" />
              <p className="mt-3 font-semibold text-white">No commands found</p>
              <p className="mt-1 text-sm text-zinc-500">Try a different search or category.</p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

function CommandRow({ command }: { command: BotCommand }) {
  const copy = async () => { try { await navigator.clipboard.writeText(command.usage || command.name); } catch {} };
  return (
    <tr className="border-t border-zinc-900 transition hover:bg-zinc-900/60">
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white">{command.name}</span>
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${typeClass[command.type]}`}>{command.type}</span>
        </div>
        <div className="mt-1 text-xs text-zinc-600">{command.category}</div>
      </td>
      <td className="max-w-[300px] px-4 py-3 align-top text-zinc-400">{command.description}</td>
      <td className="px-4 py-3 align-top"><code className="rounded-md bg-[#08080a] px-2 py-1 font-mono text-xs text-zinc-300">{command.usage}</code></td>
      <td className="px-4 py-3 align-top text-zinc-500">{command.permission}</td>
      <td className="max-w-[180px] truncate px-4 py-3 align-top font-mono text-xs text-zinc-600">{command.source}</td>
      <td className="px-4 py-3 text-right align-top"><button onClick={copy} className="inline-grid h-8 w-8 place-items-center rounded-md border border-zinc-800 text-zinc-500 transition hover:border-zinc-700 hover:text-white"><Copy size={14} /></button></td>
    </tr>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-zinc-800 bg-[#101012] p-3"><div className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">{title}</div>{children}</section>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-zinc-800 bg-[#0a0a0b] px-3 py-2"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">{label}</div><div className="mt-1 text-lg font-bold text-white">{value}</div></div>; }