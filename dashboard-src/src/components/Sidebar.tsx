import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Zap,
  Blocks,
  SquareStack,
  Sparkles,
  ShieldCheck,
  ScrollText,
  Settings,
  ChevronDown,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../store";
import { navigate } from "../router";
import { cx } from "./ui";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

export function Sidebar({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  const { state, setState, log } = useStore();
  const [serverOpen, setServerOpen] = useState(false);

  const control: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { id: "commands", label: "Commands", icon: Zap, path: "/commands", badge: state.commands.length },
    { id: "builder", label: "Builder", icon: Blocks, path: "/builder" },
    { id: "templates", label: "Templates", icon: Sparkles, path: "/templates" },
  ];
  const config: NavItem[] = [
    { id: "permissions", label: "Permissions", icon: ShieldCheck, path: "/permissions" },
    { id: "logs", label: "Activity", icon: ScrollText, path: "/logs" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const pickServer = (s: string) => {
    setServerOpen(false);
    if (s === state.server) return;
    setState((p) => ({ ...p, server: s }));
    log("Workspace", `Switched to ${s}`, "info");
  };

  return (
    <div className="flex h-full flex-col gap-1 p-3.5">
      <button onClick={() => go("/")} className="mb-3 flex items-center gap-3 px-1.5 py-1">
        <div className="grid h-9 w-9 place-items-center rounded-xl brand-grad font-black text-[#0b0b10] shadow-[0_10px_30px_-10px_rgba(139,92,246,.8)]">
          P
        </div>
        <div className="text-left leading-tight">
          <div className="text-[15px] font-extrabold">PrestonHQ</div>
          <div className="text-[11px] font-medium text-zinc-500">Bot Control Panel</div>
        </div>
      </button>

      {/* Server selector */}
      <div className="relative mb-2">
        <button
          onClick={() => setServerOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/12 to-transparent p-2.5 text-left transition hover:border-brand-500/40"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#16161c] to-brand-500 font-black shadow-[0_0_24px_-6px_rgba(99,102,241,.7)]">
            {state.bot.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-bold">{state.server}</div>
            <div className="truncate text-[11px] text-zinc-500">{state.bot.name} · {state.bot.pm2}</div>
          </div>
          <ChevronDown size={15} className={cx("text-zinc-500 transition", serverOpen && "rotate-180")} />
        </button>
        {serverOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setServerOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="glass-strong absolute left-0 right-0 top-[60px] z-20 rounded-2xl p-1.5 shadow-card"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Workspaces</div>
              {state.servers.map((s) => (
                <button
                  key={s}
                  onClick={() => pickServer(s)}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[.06] hover:text-white"
                >
                  {s}
                  {s === state.server && <Check size={14} className="text-brand-400" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>

      <NavGroup title="Control" items={control} active={active} onGo={go} />
      <NavGroup title="Configuration" items={config} active={active} onGo={go} />

      <div className="mt-auto rounded-2xl border border-white/[.06] bg-white/[.02] p-3">
        <div className="text-[11px] font-semibold text-zinc-400">Bot source</div>
        <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-600">{state.bot.source}</div>
        <div className="truncate font-mono text-[11px] text-zinc-600">{state.bot.pkg}</div>
      </div>
    </div>
  );
}

function NavGroup({ title, items, active, onGo }: { title: string; items: NavItem[]; active: string; onGo: (p: string) => void }) {
  return (
    <div className="mb-1">
      <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">{title}</div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const on = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onGo(item.path)}
              className={cx(
                "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13.5px] font-medium transition",
                on ? "text-white" : "text-zinc-400 hover:bg-white/[.04] hover:text-zinc-100"
              )}
            >
              {on && (
                <motion.div
                  layoutId="nav-active"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl border border-white/[.08] bg-gradient-to-r from-brand-500/18 to-brand-violet/5"
                />
              )}
              {on && <span className="absolute -left-3.5 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-brand-400 to-brand-violet shadow-[0_0_14px_rgba(99,102,241,.8)]" />}
              <span
                className={cx(
                  "relative grid h-7 w-7 place-items-center rounded-lg transition",
                  on ? "bg-gradient-to-br from-brand-500 to-brand-violet text-white shadow-[0_0_18px_-4px_rgba(99,102,241,.9)]" : "bg-white/[.05] text-zinc-400 group-hover:text-zinc-200"
                )}
              >
                <Icon size={15} />
              </span>
              <span className="relative">{item.label}</span>
              {item.badge != null && (
                <span className="relative ml-auto rounded-full bg-white/[.07] px-2 py-0.5 text-[10px] font-bold text-zinc-400">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
