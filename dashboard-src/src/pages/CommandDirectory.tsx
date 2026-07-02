import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Copy, Cpu, Gauge, Layers3, Radio, Search, Shield, Sparkles, Terminal, Zap } from "lucide-react";
import catalogData from "../catalog.json";
import { FILTER_CATEGORIES } from "../constants";
import { useBotStatus } from "../useBotStatus";
import type { BotCommand, Catalog, CommandCategory } from "../types";

const catalog = catalogData as Catalog;

const typeMeta = {
  slash: { label: "Slash", className: "border-cyan-300/35 bg-cyan-300/10 text-cyan-100" },
  prefix: { label: "Prefix", className: "border-fuchsia-300/35 bg-fuchsia-300/10 text-fuchsia-100" },
  auto: { label: "Auto", className: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100" },
} as const;

const catTone: Record<string, string> = {
  "Slash commands": "from-cyan-400 to-blue-500",
  "Prefix commands": "from-violet-400 to-fuchsia-500",
  Moderation: "from-red-400 to-orange-500",
  Tickets: "from-amber-300 to-yellow-500",
  Giveaways: "from-pink-400 to-rose-500",
  Sessions: "from-indigo-400 to-sky-500",
  Utility: "from-emerald-300 to-teal-500",
  "Systems/Automation": "from-slate-300 to-zinc-500",
};

export function CommandDirectory() {
  const [activeBotId, setActiveBotId] = useState(catalog.bots[0]?.id || "");
  const [category, setCategory] = useState<CommandCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const { statuses } = useBotStatus();

  const activeBot = useMemo(() => catalog.bots.find((bot) => bot.id === activeBotId) || catalog.bots[0], [activeBotId]);

  const filtered = useMemo(() => {
    if (!activeBot) return [];
    const q = query.trim().toLowerCase();
    return activeBot.commands.filter((command) => {
      const inCategory = category === "All" || command.category === category;
      const text = `${command.name} ${command.description} ${command.usage} ${command.permission} ${command.category} ${command.source}`.toLowerCase();
      return inCategory && (!q || text.includes(q));
    });
  }, [activeBot, category, query]);

  const selectedCommand = useMemo(() => {
    if (!activeBot) return null;
    return activeBot.commands.find((command) => command.id === selectedCommandId) || filtered[0] || activeBot.commands[0] || null;
  }, [activeBot, selectedCommandId, filtered]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!activeBot) return counts;
    for (const command of activeBot.commands) counts.set(command.category, (counts.get(command.category) || 0) + 1);
    return counts;
  }, [activeBot]);

  const grouped = useMemo(() => {
    const groups = new Map<string, BotCommand[]>();
    for (const command of filtered) groups.set(command.category, [...(groups.get(command.category) || []), command]);
    return catalog.categories.filter((cat) => groups.has(cat)).map((cat) => ({ category: cat, commands: groups.get(cat)! }));
  }, [filtered]);

  const totals = useMemo(() => {
    const commands = catalog.bots.reduce((sum, bot) => sum + bot.stats.total, 0);
    const online = catalog.bots.filter((bot) => (statuses[bot.id] || bot.status).online).length;
    return { commands, online };
  }, [statuses]);

  if (!activeBot) return null;
  const live = statuses[activeBot.id] || activeBot.status;

  return (
    <main className="min-h-screen bg-[#050509] text-white selection:bg-lime-300 selection:text-black">
      <style>{`
        @keyframes phq-scan { 0% { transform: translateX(-20%); opacity:.15 } 50% { opacity:.5 } 100% { transform: translateX(120%); opacity:.15 } }
        @keyframes phq-pulse { 0%,100% { opacity:.35 } 50% { opacity:.9 } }
        .phq-scan:before { content:""; position:absolute; inset:0; width:40%; background:linear-gradient(90deg, transparent, rgba(125,255,231,.16), transparent); animation:phq-scan 5.5s linear infinite; }
        .phq-grid { background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px); background-size: 54px 54px; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,.20),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(217,70,239,.18),transparent_31%),radial-gradient(circle_at_50%_92%,rgba(163,230,53,.10),transparent_38%)]" />
        <div className="phq-grid absolute inset-0 opacity-[.16]" />
        <div className="absolute left-0 top-0 h-full w-[34vw] bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl shadow-black/35 backdrop-blur-2xl phq-scan">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white text-xl font-black text-black shadow-[0_0_45px_rgba(34,211,238,.25)]">
                  P
                  <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-[#050509] bg-lime-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[.26em] text-lime-200/80">
                    <Radio size={14} /> PrestonHQ Command Arsenal
                  </div>
                  <h1 className="mt-1 text-2xl font-black tracking-[-.05em] sm:text-4xl">All bots. All commands. One control room.</h1>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <TopStat label="Bots" value={catalog.bots.length} />
                <TopStat label="Online" value={`${totals.online}/${catalog.bots.length}`} />
                <TopStat label="Commands" value={totals.commands} />
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-lime-300/15 bg-lime-300/10 p-4 shadow-2xl shadow-lime-950/20 backdrop-blur-2xl">
            <div className="flex h-full min-w-[240px] flex-col justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-lime-100"><CheckCircle2 size={18} /> Live synced</div>
              <p className="text-xs leading-5 text-white/50">Catalog rebuilds from the connected bot files and stays ready for staff lookup.</p>
            </div>
          </div>
        </header>

        <section className="mb-5 grid gap-3 lg:grid-cols-3">
          {catalog.bots.map((bot) => {
            const selected = bot.id === activeBot.id;
            const botLive = statuses[bot.id] || bot.status;
            return (
              <button
                key={bot.id}
                onClick={() => { setActiveBotId(bot.id); setCategory("All"); setQuery(""); setSelectedCommandId(null); }}
                className={`group relative overflow-hidden rounded-[1.75rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${selected ? "border-white/35 bg-white/[.12] shadow-2xl shadow-black/35" : "border-white/10 bg-white/[.045] hover:border-white/20 hover:bg-white/[.075]"}`}
              >
                <div className="absolute inset-x-6 top-0 h-px opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${bot.accent}, transparent)` }} />
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl text-xl font-black text-black transition group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${bot.accent}, #ffffff)` }}>{bot.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-black tracking-[-.03em]">{bot.name}</div>
                    <div className="mt-0.5 text-xs text-white/45">{bot.pm2} · {bot.stats.total} indexed</div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${botLive.online ? "bg-lime-300 shadow-[0_0_22px_rgba(190,242,100,.9)]" : "bg-red-400"}`} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <MiniStat label="Slash" value={bot.stats.slash} />
                  <MiniStat label="Prefix" value={bot.stats.prefix} />
                  <MiniStat label="Auto" value={bot.stats.automation} />
                </div>
              </button>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <aside className="space-y-4">
            <Panel className="p-4">
              <PanelTitle icon={<Layers3 size={16} />}>Categories</PanelTitle>
              <div className="mt-4 space-y-2">
                {FILTER_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  const count = cat === "All" ? activeBot.stats.total : categoryCounts.get(cat) || 0;
                  return (
                    <button key={cat} onClick={() => setCategory(cat)} className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm transition ${selected ? "border-lime-300/35 bg-lime-300/12 text-white" : "border-white/8 bg-black/20 text-white/55 hover:border-white/20 hover:bg-white/[.055] hover:text-white"}`}>
                      <span className="font-bold">{cat}</span>
                      <span className="rounded-full bg-black/35 px-2 py-0.5 text-xs text-white/45">{count}</span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-4">
              <PanelTitle icon={<Gauge size={16} />}>Runtime</PanelTitle>
              <div className="mt-4 grid gap-3 text-sm">
                <RuntimeRow label="Selected" value={activeBot.name} />
                <RuntimeRow label="Process" value={activeBot.pm2} />
                <RuntimeRow label="State" value={live.status} good={live.online} />
                <RuntimeRow label="Visible" value={`${filtered.length}/${activeBot.stats.total}`} />
              </div>
            </Panel>
          </aside>

          <section className="min-w-0 space-y-4">
            <Panel className="p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <Search size={18} className="text-lime-200/70" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search command, permission, usage, source..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" />
              </div>
            </Panel>

            {grouped.length ? grouped.map(({ category: group, commands }) => (
              <section key={group} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-1.5 rounded-full bg-gradient-to-b ${catTone[group] || "from-white to-white/30"}`} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black uppercase tracking-[.02em]">{group}</h2>
                    <p className="text-xs text-white/35">{commands.length} commands in {activeBot.name}</p>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {commands.map((command) => (
                    <CommandTile
                      key={command.id}
                      command={command}
                      active={selectedCommand?.id === command.id}
                      accent={activeBot.accent}
                      onSelect={() => setSelectedCommandId(command.id)}
                    />
                  ))}
                </div>
              </section>
            )) : (
              <Panel className="grid min-h-[300px] place-items-center p-10 text-center">
                <div>
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/8 text-white/60"><Search /></div>
                  <h2 className="text-2xl font-black">No commands found</h2>
                  <p className="mt-2 text-sm text-white/45">Try a different bot, category, or search.</p>
                </div>
              </Panel>
            )}
          </section>

          <aside className="xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)]">
            <Panel className="flex h-full flex-col overflow-hidden">
              <div className="border-b border-white/10 p-5">
                <PanelTitle icon={<Terminal size={16} />}>Command Details</PanelTitle>
                {selectedCommand ? (
                  <>
                    <h3 className="mt-5 text-3xl font-black tracking-[-.06em]">{selectedCommand.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{selectedCommand.description}</p>
                  </>
                ) : null}
              </div>
              {selectedCommand ? <CommandInspector command={selectedCommand} botName={activeBot.name} accent={activeBot.accent} /> : null}
            </Panel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function CommandTile({ command, active, accent, onSelect }: { command: BotCommand; active: boolean; accent: string; onSelect: () => void }) {
  const copy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try { await navigator.clipboard.writeText(command.usage || command.name); } catch {}
  };
  return (
    <article onClick={onSelect} className={`group relative cursor-pointer overflow-hidden rounded-[1.5rem] border bg-[#0d0f14]/85 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-[#12151d] ${active ? "border-white/35 shadow-2xl shadow-black/40" : "border-white/10 hover:border-white/22"}`}>
      <div className="absolute inset-y-5 left-0 w-1 rounded-r-full" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-black tracking-[-.03em]">{command.name}</h3>
            <Badge className={typeMeta[command.type].className}>{typeMeta[command.type].label}</Badge>
            {command.enabled ? <Badge className="border-lime-300/35 bg-lime-300/10 text-lime-100">Live</Badge> : null}
          </div>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-white/52">{command.description}</p>
        </div>
        <button onClick={copy} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.035] text-white/45 transition hover:border-lime-300/35 hover:bg-lime-300/10 hover:text-lime-100"><Copy size={16} /></button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <code className="rounded-xl bg-black/50 px-3 py-2 font-mono font-black text-white">{command.usage}</code>
        <span className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-white/50">{command.permission}</span>
      </div>
    </article>
  );
}

function CommandInspector({ command, botName, accent }: { command: BotCommand; botName: string; accent: string }) {
  const copy = async () => { try { await navigator.clipboard.writeText(command.usage || command.name); } catch {} };
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
      <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-[.24em] text-white/35">Usage</div>
        <code className="block rounded-2xl bg-black px-4 py-4 font-mono text-sm font-black text-white">{command.usage}</code>
        <button onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm font-bold text-white/70 transition hover:border-lime-300/35 hover:text-lime-100"><Copy size={15} /> Copy command</button>
      </div>
      <Detail label="Bot" value={botName} />
      <Detail label="Category" value={command.category} />
      <Detail label="Permission" value={command.permission} />
      <Detail label="Cooldown" value={command.cooldown ? `${command.cooldown}s` : "None"} />
      <Detail label="Source" value={command.source} mono />
      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[.035] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.24em] text-white/35"><Cpu size={14} /> System note</div>
        <p className="text-sm leading-6 text-white/50">This catalog is generated from bot files, so it stays cleaner than a manually typed command list.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-2/3 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, #bef264)` }} /></div>
      </div>
    </div>
  );
}

function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-[1.75rem] border border-white/10 bg-white/[.045] shadow-2xl shadow-black/25 backdrop-blur-2xl ${className}`}>{children}</div>;
}

function PanelTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.24em] text-white/42">{icon}{children}</div>;
}

function TopStat({ label, value }: { label: string; value: number | string }) {
  return <div className="min-w-[92px] rounded-2xl border border-white/10 bg-black/28 px-4 py-3"><div className="text-[10px] font-black uppercase tracking-[.22em] text-white/35">{label}</div><div className="mt-1 text-2xl font-black tracking-[-.06em]">{value}</div></div>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/8 bg-black/25 px-2 py-2"><div className="font-black text-white">{value}</div><div className="mt-0.5 text-[10px] uppercase tracking-[.18em] text-white/35">{label}</div></div>;
}

function RuntimeRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/25 px-3 py-2"><span className="text-white/40">{label}</span><span className={`truncate font-bold ${good ? "text-lime-200" : "text-white/80"}`}>{value}</span></div>;
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${className}`}>{children}</span>;
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4"><div className="text-[10px] font-black uppercase tracking-[.24em] text-white/35">{label}</div><div className={`mt-2 break-words text-sm font-bold text-white/78 ${mono ? "font-mono" : ""}`}>{value}</div></div>;
}