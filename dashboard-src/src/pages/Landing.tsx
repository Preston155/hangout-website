import { motion } from "framer-motion";
import { ArrowRight, Blocks, Boxes, Command, Gauge, Layers, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "../components/ui";
import { navigate } from "../router";
import { useStore } from "../store";
import type { HealthState } from "../useHealth";

const features = [
  { icon: Zap, title: "Slash command builder", body: "Design names, options, permissions, cooldowns and roles visually." },
  { icon: Layers, title: "Embed builder", body: "Author, color, fields, images and buttons with a live Discord preview." },
  { icon: Shield, title: "Permission controls", body: "Role and channel access, admin bypass, and per-command toggles." },
  { icon: Boxes, title: "Templates", body: "Moderation, tickets, welcome, automod, giveaways, economy and more." },
  { icon: Gauge, title: "Live bot status", body: "Real-time health and latency from the control-plane API." },
  { icon: Command, title: "⌘K everywhere", body: "Fly between commands with a fast, keyboard-first command palette." },
];

export function Landing({ health }: { health: HealthState }) {
  const { state } = useStore();
  return (
    <div className="relative mx-auto w-full max-w-[1180px] px-5">
      {/* Nav */}
      <nav className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl brand-grad font-black text-[#0b0b10]">P</div>
          <div className="leading-tight">
            <div className="font-extrabold">PrestonHQ</div>
            <div className="text-[11px] text-zinc-500">Bot Control Panel</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          <Button variant="primary" onClick={() => navigate("/login")}>Login with Discord</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[12px] font-semibold text-zinc-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {health.online ? "Veltrix is online" : "Discord bot control panel"}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-[clamp(42px,6vw,76px)] font-black leading-[0.95] tracking-tight text-grad"
          >
            Command your bot.
            <br />
            Beautifully.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400"
          >
            Build slash commands, craft embeds, manage permissions and watch live status — a premium control surface for Veltrix that never touches a token.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button variant="primary" size="md" onClick={() => navigate("/dashboard")} className="h-12 px-6 text-[15px]">
              Open the dashboard <ArrowRight size={17} />
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate("/login")} className="h-12 px-6 text-[15px]">
              Login with Discord
            </Button>
          </motion.div>
          <div className="mt-10 flex flex-wrap gap-8">
            <Stat label="Veltrix bot" value={health.loading ? "…" : health.online ? "Online" : "Offline"} />
            <Stat label="commands" value={String(state.commands.length)} />
            <Stat label="servers" value={health.data ? String(health.data.guildCount) : "—"} />
            <Stat label="latency" value={health.latency != null ? `${health.latency}ms` : "—"} />
          </div>
        </div>

        {/* Hero mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 160, damping: 22 }}
          className="relative"
        >
          <div className="panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              </div>
              <span className="text-[11px] font-semibold text-zinc-500">prestonhq.com/dashboard</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 p-4">
              <div className="space-y-2">
                <div className="h-9 rounded-xl brand-grad opacity-90" />
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-7 rounded-lg bg-white/[.05]" />
                ))}
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {["Online", String(health.data?.guildCount ?? 1), String(state.commands.length)].map((v, i) => (
                    <div key={i} className="rounded-xl border border-white/[.07] bg-white/[.03] p-2.5">
                      <div className="text-sm font-bold">{v}</div>
                      <div className="text-[9px] text-zinc-500">{["status", "servers", "commands"][i]}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-[#313338] p-3">
                  <div className="rounded-md bg-[#2b2d31] p-2.5" style={{ borderLeft: "4px solid #6366f1" }}>
                    <div className="text-[12px] font-bold text-white">🎉 Giveaway</div>
                    <div className="mt-1 text-[11px] text-[#b5bac1]">Click below to enter — good luck!</div>
                    <div className="mt-2 inline-block rounded bg-[#5865f2] px-2.5 py-1 text-[10px] font-semibold text-white">Enter Giveaway</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-strong absolute -bottom-5 -right-3 w-52 rounded-2xl p-4 shadow-card"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-brand-300">
              <Sparkles size={13} /> Veltrix workspace
            </div>
            <div className="mt-1.5 font-bold">{state.server}</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">Commands, tickets, giveaways & shifts loaded.</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[.16em] text-zinc-500">Everything for bot control</div>
            <h2 className="mt-2 text-[clamp(28px,4vw,46px)] font-extrabold tracking-tight">One panel. Total command.</h2>
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
                className="group rounded-3xl border border-white/[.08] bg-white/[.025] p-5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-violet text-white shadow-[0_12px_30px_-12px_rgba(99,102,241,.9)]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-[16px] font-bold">{f.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-400">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl border border-white/[.08] bg-gradient-to-br from-brand-500/10 to-transparent p-10 text-center">
          <Blocks className="text-brand-400" />
          <h3 className="text-2xl font-extrabold">Ready to build?</h3>
          <p className="max-w-md text-zinc-400">Open the dashboard and ship your first command in under a minute.</p>
          <Button variant="primary" className="h-12 px-6" onClick={() => navigate("/dashboard")}>
            Launch dashboard <ArrowRight size={16} />
          </Button>
        </div>
        <div className="py-10 text-center text-[12px] text-zinc-600">PrestonHQ · Bot Control Panel · Veltrix on City of Angels</div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-[12px] text-zinc-500">{label}</div>
    </div>
  );
}
