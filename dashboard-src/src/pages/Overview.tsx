import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Layers,
  Plus,
  RefreshCw,
  Server,
  Sparkles,
  Star,
  Timer,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { Button, toast } from "../components/ui";
import { useHealth } from "../useHealth";
import { useStore } from "../store";
import { navigate } from "../router";
import { CAT_META, fmtUptime, timeAgo } from "../constants";

export function Overview() {
  const { state, log } = useStore();
  const health = useHealth();
  const enabled = state.commands.filter((c) => c.enabled).length;
  const uses = state.commands.reduce((a, c) => a + c.uses, 0);
  const pct = Math.round((enabled / Math.max(1, state.commands.length)) * 100);
  const favorites = state.commands.filter((c) => c.favorite).slice(0, 4);
  const recent = [...state.commands].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const sync = () => {
    log("Sync", `${state.commands.length} commands staged for ${state.bot.name} (${state.bot.pm2})`, "success");
    toast(`Synced to ${state.bot.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">Veltrix Control Panel</div>
          <h1 className="mt-1.5 text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight">{state.server}</h1>
          <p className="mt-1.5 max-w-xl text-[14px] text-zinc-400">
            Manage Veltrix commands, embeds, permissions and live status — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold ${health.online ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-rose-500/25 bg-rose-500/10 text-rose-300"}`}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${health.online ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${health.online ? "bg-emerald-400" : "bg-rose-400"}`} />
            </span>
            {health.loading ? "Checking…" : health.online ? "Connected" : "Offline"}
          </span>
          <Button variant="primary" onClick={sync}>
            <RefreshCw size={15} /> Sync Veltrix
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard index={0} icon={CheckCircle2} label="Bot status" display={health.loading ? "…" : health.online ? "Online" : "Offline"} tint="rgba(34,197,94,.3)" live sub="gateway" />
        <StatCard index={1} icon={Server} label="Servers" value={health.data?.guildCount ?? 0} tint="rgba(99,102,241,.3)" live sub="connected" />
        <StatCard index={2} icon={Zap} label="Commands" value={state.commands.length} tint="rgba(139,92,246,.3)" sub="total" />
        <StatCard index={3} icon={Layers} label="Active" value={enabled} tint="rgba(217,70,239,.3)" sub={`${state.commands.length - enabled} off`} />
        <StatCard index={4} icon={Activity} label="Executions" value={uses} tint="rgba(56,189,248,.3)" sub="all-time" />
        <StatCard index={5} icon={AlertTriangle} label="Errors" value={0} tint="rgba(245,158,11,.25)" sub="last 24h" />
        <StatCard index={6} icon={Gauge} label="Latency" display={health.latency != null ? `${health.latency}ms` : "—"} tint="rgba(34,197,94,.25)" live sub="API" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {/* Live bot status */}
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ boxShadow: ["0 0 0 0 rgba(34,197,94,.18)", "0 0 0 12px rgba(34,197,94,0)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="grid h-16 w-16 place-items-center rounded-2xl text-2xl font-black"
                  style={{ background: health.online ? "radial-gradient(circle at 50% 30%, rgba(34,197,94,.4), rgba(99,102,241,.16))" : "radial-gradient(circle at 50% 30%, rgba(244,63,94,.32), rgba(99,102,241,.14))" }}
                >
                  {state.bot.name[0]}
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold">Live bot status</h3>
                  <p className="text-[12.5px] text-zinc-500">Read-only health from api.prestonhq.com — no tokens exposed.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
              <KV label="Gateway bot" value={health.data?.botUser ?? "—"} />
              <KV label="Servers" value={health.data ? String(health.data.guildCount) : "—"} />
              <KV label="API uptime" value={fmtUptime(health.data?.uptime)} />
              <KV label="Latency" value={health.latency != null ? `${health.latency}ms` : "—"} />
              <KV label="Veltrix PM2" value={state.bot.pm2} />
              <KV label="Checked" value={health.checkedAt ? timeAgo(health.checkedAt) : "—"} />
            </div>
          </div>

          {/* Command health + recently edited */}
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={16} className="text-brand-400" />
                <h3 className="font-bold">Recently edited</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/commands")}>
                View all <ArrowUpRight size={14} />
              </Button>
            </div>
            <div className="mt-3 space-y-1.5">
              {recent.map((c) => {
                const meta = CAT_META[c.category];
                const Icon = meta.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/builder?id=${c.id}`)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition hover:border-white/[.08] hover:bg-white/[.03]"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${meta.color}1f`, color: meta.color }}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[13.5px] font-semibold">/{c.name}</span>
                      <span className="block truncate text-[12px] text-zinc-500">{c.description}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-600">{timeAgo(c.updatedAt)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Command health ring */}
          <div className="panel flex items-center gap-5 p-5">
            <Ring pct={pct} />
            <div>
              <h3 className="font-bold">Command health</h3>
              <p className="mt-1 text-[12.5px] text-zinc-500">{enabled} active · {state.commands.length - enabled} disabled · 0 errors</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="panel p-5">
            <h3 className="mb-3 font-bold">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <QuickAction icon={Plus} label="New command" onClick={() => navigate("/new")} />
              <QuickAction icon={Layers} label="Embed builder" onClick={() => navigate("/embeds")} />
              <QuickAction icon={Sparkles} label="Templates" onClick={() => navigate("/templates")} />
              <QuickAction icon={Activity} label="Activity" onClick={() => navigate("/logs")} />
            </div>
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="panel p-5">
              <div className="mb-3 flex items-center gap-2">
                <Star size={15} className="text-amber-300" fill="currentColor" />
                <h3 className="font-bold">Favorites</h3>
              </div>
              <div className="space-y-1.5">
                {favorites.map((c) => {
                  const meta = CAT_META[c.category];
                  const Icon = meta.icon;
                  return (
                    <button key={c.id} onClick={() => navigate(`/builder?id=${c.id}`)} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[.04]">
                      <Icon size={15} style={{ color: meta.color }} />
                      <span className="font-mono text-[13px]">/{c.name}</span>
                      <span className="ml-auto text-[11px] text-zinc-600">{c.uses.toLocaleString()} uses</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="panel p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">Activity feed</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/logs")}>All</Button>
            </div>
            <ActivityFeed logs={state.logs} limit={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/[.05] py-2.5">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="mt-0.5 truncate text-[14px] font-semibold">{value}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-white/[.08] bg-white/[.02] px-3 py-3 text-left text-[13px] font-semibold transition hover:border-brand-500/40 hover:bg-brand-500/[.06]"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.06] text-brand-300">
        <Icon size={15} />
      </span>
      {label}
    </motion.button>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[88px] w-[88px] place-items-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="7" fill="none" />
        <motion.circle
          cx="44"
          cy="44"
          r={r}
          stroke="url(#ringg)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-base font-extrabold">{pct}%</span>
    </div>
  );
}
