import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Copy, Gauge, Search, Sparkles, Terminal, Zap } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeStyles = {
  slash: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  prefix: "border-violet-400/35 bg-violet-400/10 text-violet-200",
  auto: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
} as const;

const categoryHints: Record<string, string> = {
  "Slash commands": "Application commands",
  "Prefix commands": "Chat shortcuts",
  Moderation: "Staff tools",
  Tickets: "Support workflow",
  Giveaways: "Events & rewards",
  Sessions: "ERLC sessions",
  Utility: "Everyday tools",
  "Systems/Automation": "Background systems",
};

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
  const [query, setQuery] = useState("");
  const { statuses } = useBotStatus();

  const activeBot = useMemo(() => catalog.bots.find((bot) => bot.id === activeBotId) || catalog.bots[0], [activeBotId]);

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
      const inCategory = category === "All" || command.category === category;
      const haystack = `${command.name} ${command.description} ${command.usage} ${command.permission} ${command.category} ${command.source}`.toLowerCase();
      return inCategory && (!q || haystack.includes(q));
    });
  }, [activeBot, category, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, BotCommand[]>();
    for (const command of filtered) groups.set(command.category, [...(groups.get(command.category) || []), command]);
    return catalog.categories.filter((item) => groups.has(item)).map((item) => ({ category: item, items: groups.get(item)! }));
  }, [filtered]);

  const totals = useMemo(() => {
    const all = catalog.bots.reduce((sum, bot) => sum + bot.stats.total, 0);
    const online = catalog.bots.filter((bot) => (statuses[bot.id] || bot.status).online).length;
    return { all, online };
  }, [statuses]);

  if (!activeBot) return null;
  const live = statuses[activeBot.id] || activeBot.status;

  return (
    <main className="min-h-screen overflow-hidden bg-[#06070a] text-white selection:bg-cyan-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,.22),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(168,85,247,.2),transparent_30%),radial-gradient(circle_at_45%_100%,rgba(16,185,129,.12),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/8 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 py-4 lg:px-7">
        <header className="sticky top-4 z-30 mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-black/55 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black text-black shadow-lg shadow-cyan-500/20">
                P
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-black bg-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-black leading-tight tracking-[-.03em]">PrestonHQ</div>
                <div className="text-xs font-medium text-white/45">Command control center</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill icon={<Bot size={14} />} label={`${catalog.bots.length} bots`} />
              <Pill icon={<Gauge size={14} />} label={`${totals.online}/${catalog.bots.length} online`} tone="green" />
              <Pill icon={<Terminal size={14} />} label={`${totals.all} commands`} />
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <Panel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>Bots</SectionLabel>
                <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/45">live catalog</span>
              </div>
              <div className="space-y-3">
                {catalog.bots.map((bot) => {
                  const selected = bot.id === activeBot.id;
                  const botLive = statuses[bot.id] || bot.status;
                  return (
                    <button
                      key={bot.id}
                      onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); }}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition duration-200 ${selected ? "border-white/30 bg-white/14 shadow-xl shadow-black/30" : "border-white/8 bg-white/[.035] hover:border-white/18 hover:bg-white/[.07]"}`}
                    >
                      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full opacity-80" style={{ background: bot.accent }} />
                      <span className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-black text-black shadow-lg transition group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${bot.accent}, #ffffff)` }}>
                        {bot.name[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black tracking-[-.02em]">{bot.name}</span>
                        <span className="block truncate text-xs text-white/45">{bot.pm2} · {bot.stats.total} commands</span>
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${botLive.online ? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.9)]" : "bg-rose-400"}`} />
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>Filters</SectionLabel>
                <Sparkles size={15} className="text-cyan-200/70" />
              </div>
              <div className="grid gap-2">
                {FILTER_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat) || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${selected ? "border-cyan-300/35 bg-cyan-300/12 text-white" : "border-white/8 bg-white/[.025] text-white/55 hover:border-white/18 hover:bg-white/[.06] hover:text-white"}`}
                    >
                      <span className="font-bold">{cat}</span>
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white/55">{count}</span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </aside>

          <section className="min-w-0 space-y-5">
            <Panel className="overflow-hidden">
              <div className="relative p-6 sm:p-8">
                <div className="absolute right-0 top-0 h-40 w-72 rounded-bl-[80px] opacity-25 blur-3xl" style={{ background: activeBot.accent }} />
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-1 text-xs font-black uppercase tracking-[.28em] text-white/55">
                      <Zap size={13} className="text-cyan-200" /> PrestonHQ bot index
                    </div>
                    <h1 className="max-w-3xl text-5xl font-black leading-[.9] tracking-[-.08em] sm:text-7xl">
                      {activeBot.name}
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">
                      Fast command lookup across every connected bot. Pick a bot, filter by system, copy usage, and keep everything readable without digging through Discord.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[520px]">
                    <Metric label="Shown" value={filtered.length} />
                    <Metric label="Slash" value={activeBot.stats.slash} />
                    <Metric label="Prefix" value={activeBot.stats.prefix} />
                    <Metric label="Auto" value={activeBot.stats.automation} />
                  </div>
                </div>
              </div>
            </Panel>

            <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <Panel className="flex items-center gap-3 px-4 py-3">
                <Search size={18} className="shrink-0 text-cyan-200/70" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search command, usage, permission, source..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
              </Panel>
              <Panel className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[.22em] text-white/35">Status</div>
                  <div className="mt-1 flex items-center gap-2 text-sm font-bold"><CheckCircle2 size={16} className={live.online ? "text-emerald-300" : "text-rose-300"} /> {live.status}</div>
                </div>
                <div className="text-right text-xs text-white/40">{activeBot.pm2}<br />{filtered.length}/{activeBot.stats.total} visible</div>
              </Panel>
            </div>

            {grouped.length ? grouped.map(({ category: group, items }) => (
              <section key={group} className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-[-.03em]">{group}</h2>
                    <p className="text-sm text-white/40">{categoryHints[group] || "Command group"}</p>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">{items.length}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {items.map((command) => <CommandCard key={command.id} command={command} accent={activeBot.accent} />)}
                </div>
              </section>
            )) : (
              <Panel className="grid min-h-[260px] place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/8"><Search /></div>
                  <h2 className="text-2xl font-black">No commands found</h2>
                  <p className="mt-2 text-white/45">Try a different search or category.</p>
                </div>
              </Panel>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function CommandCard({ command, accent }: { command: BotCommand; accent: string }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(command.usage || command.name); } catch {}
  };
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#101117]/80 p-4 shadow-xl shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#151722]">
      <div className="absolute inset-x-5 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-black tracking-[-.03em]">{command.name}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${typeStyles[command.type]}`}>{command.type}</span>
            {command.enabled && <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-200">live</span>}
          </div>
          <p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-6 text-white/55">{command.description}</p>
        </div>
        <button onClick={copy} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.035] text-white/45 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100" title="Copy usage">
          <Copy size={16} />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <code className="rounded-xl bg-black/45 px-3 py-2 font-mono font-bold text-white">{command.usage}</code>
        <span className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-white/55">{command.permission}</span>
      </div>
      <div className="mt-3 truncate rounded-xl border border-white/8 bg-white/[.025] px-3 py-2 font-mono text-xs text-white/35">{command.source}</div>
    </article>
  );
}

function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-[28px] border border-white/10 bg-white/[.045] shadow-2xl shadow-black/25 backdrop-blur-xl ${className}`}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-black uppercase tracking-[.26em] text-white/35">{children}</div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-[10px] font-black uppercase tracking-[.24em] text-white/35">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-[-.06em]">{value}</div>
    </div>
  );
}

function Pill({ icon, label, tone = "default" }: { icon: React.ReactNode; label: string; tone?: "default" | "green" }) {
  return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold ${tone === "green" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[.045] text-white/70"}`}>{icon}{label}</div>;
}