import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeLabel = {
  slash: "SLASH",
  prefix: "PREFIX",
  auto: "AUTO",
} as const;

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "icesway");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
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
      const categoryMatch = category === "All" || command.category === category;
      const haystack = `${command.name} ${command.description} ${command.usage} ${command.permission} ${command.category} ${command.source}`.toLowerCase();
      return categoryMatch && (!q || haystack.includes(q));
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
    <div className="overflow-hidden rounded-[28px] border-[3px] border-[#14110d] bg-[#f7f0df] shadow-[10px_10px_0_#14110d]">
      <header className="border-b-[3px] border-[#14110d] bg-[#14110d] px-4 py-4 text-[#f7f0df] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#d9ff67]">PrestonHQ / Bot Command Manual</div>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] sm:text-6xl">Command Index</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[#b8b09f]">A readable manual for every connected bot. Pick a bot, filter a category, copy the command.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:w-[460px]">
            <Stat label="Shown" value={filtered.length} />
            <Stat label="Slash" value={activeBot.stats.slash} />
            <Stat label="Prefix" value={activeBot.stats.prefix} />
            <Stat label="Auto" value={activeBot.stats.automation} />
          </div>
        </div>
      </header>

      <section className="grid lg:grid-cols-[330px_1fr]">
        <aside className="border-b-[3px] border-[#14110d] bg-[#efe5cf] p-4 lg:border-b-0 lg:border-r-[3px]">
          <SectionTitle>Bots</SectionTitle>
          <div className="mt-3 space-y-2">
            {catalog.bots.map((bot) => {
              const selected = bot.id === activeBotId;
              const botLive = statuses[bot.id] || bot.status;
              return (
                <button
                  key={bot.id}
                  onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }}
                  className={`w-full border-[2px] border-[#14110d] px-3 py-3 text-left transition ${selected ? "bg-[#d9ff67] shadow-[5px_5px_0_#14110d]" : "bg-[#f7f0df] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#14110d]"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center border-[2px] border-[#14110d] text-sm font-black text-[#14110d]" style={{ background: bot.accent }}>{bot.name[0]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-black">{bot.name}</span>
                      <span className="block font-mono text-xs text-[#6f675b]">{bot.pm2} · {bot.stats.total} cmds · {botLive.status}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <SectionTitle>Categories</SectionTitle>
            <div className="mt-3 grid gap-2">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const count = cat === "All" ? activeBot.stats.total : counts.get(cat as CommandCategory) || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center justify-between border-[2px] border-[#14110d] px-3 py-2 text-left text-sm font-black transition ${selected ? "bg-[#14110d] text-[#f7f0df]" : "bg-[#f7f0df] hover:bg-[#fff8e8]"}`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="ml-3 font-mono text-xs opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="flex flex-col gap-3 border-[3px] border-[#14110d] bg-[#fff8e8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#6f675b]">Selected bot</div>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">{activeBot.name}</h2>
                  <p className="mt-1 font-mono text-xs text-[#6f675b]">{activeBot.pm2} · prefix {activeBot.prefix} · {filtered.length}/{activeBot.stats.total} shown · {live.status}</p>
                </div>
                <div className="flex items-center gap-2 border-[2px] border-[#14110d] bg-[#f7f0df] px-3 py-2 sm:w-[360px]">
                  <Search size={16} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands..." className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-[#8a8173]" />
                </div>
              </div>

              <div className="mt-5 space-y-6">
                {grouped.length ? grouped.map(({ category: group, items }) => (
                  <section key={group}>
                    <div className="mb-2 flex items-end justify-between border-b-[3px] border-[#14110d] pb-2">
                      <h3 className="text-xl font-black uppercase tracking-[-0.02em]">{group}</h3>
                      <span className="font-mono text-xs font-black text-[#6f675b]">{items.length} commands</span>
                    </div>
                    <div className="grid gap-3 2xl:grid-cols-2">
                      {items.map((command) => <CommandCard key={command.id} command={command} />)}
                    </div>
                  </section>
                )) : (
                  <div className="border-[3px] border-[#14110d] bg-[#fff8e8] p-10 text-center font-black">No commands found.</div>
                )}
              </div>
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-5 border-[3px] border-[#14110d] bg-[#14110d] p-4 text-[#f7f0df] shadow-[7px_7px_0_#8ecaff]">
                <div className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d9ff67]">How to use</div>
                <ol className="mt-4 space-y-3 text-sm font-semibold text-[#cfc6b6]">
                  <li><b className="text-white">01.</b> Pick a bot on the left.</li>
                  <li><b className="text-white">02.</b> Filter by category.</li>
                  <li><b className="text-white">03.</b> Copy the usage pill.</li>
                </ol>
                <div className="mt-6 border-t border-[#3b352d] pt-4 font-mono text-xs text-[#8f8678]">Generated from VPS bot folders. No placeholder command list.</div>
              </div>
            </aside>
          </div>
        </main>
      </section>
    </div>
  );
}

function CommandCard({ command }: { command: BotCommand }) {
  const copy = async () => { try { await navigator.clipboard.writeText(command.usage || command.name); } catch {} };
  return (
    <article className="border-[3px] border-[#14110d] bg-[#fff8e8] p-3 transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#14110d]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-all font-mono text-lg font-black">{command.name}</h4>
            <span className="border-[2px] border-[#14110d] bg-[#8ecaff] px-2 py-0.5 font-mono text-[10px] font-black text-[#14110d]">{typeLabel[command.type]}</span>
            {command.enabled && <span className="border-[2px] border-[#14110d] bg-[#d9ff67] px-2 py-0.5 font-mono text-[10px] font-black">LIVE</span>}
          </div>
          <p className="mt-2 text-sm font-semibold text-[#514a40]">{command.description}</p>
        </div>
        <button onClick={copy} className="grid h-9 w-9 shrink-0 place-items-center border-[2px] border-[#14110d] bg-[#f7f0df] transition hover:bg-[#d9ff67]" title="Copy usage"><Copy size={15} /></button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs font-black">
        <code className="border-[2px] border-[#14110d] bg-[#14110d] px-2 py-1 text-[#f7f0df]">{command.usage}</code>
        <span className="border-[2px] border-[#14110d] bg-[#f7f0df] px-2 py-1">{command.permission}</span>
        <span className="border-[2px] border-[#14110d] bg-[#f7f0df] px-2 py-1 text-[#6f675b]">{command.source}</span>
      </div>
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) { return <div className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#6f675b]">{children}</div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="border-[2px] border-[#f7f0df] px-3 py-2"><div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#8f8678]">{label}</div><div className="mt-1 text-xl font-black text-white">{value}</div></div>; }