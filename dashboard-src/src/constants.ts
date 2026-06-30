import {
  Shield,
  Ticket,
  PartyPopper,
  Wrench,
  Coins,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "./types";

export interface CatMeta {
  icon: LucideIcon;
  color: string;
  glow: string;
  ring: string;
}

export const CATEGORIES: Category[] = [
  "Moderation",
  "Tickets",
  "Fun",
  "Utility",
  "Economy",
  "Logging",
];

export const CAT_META: Record<Category, CatMeta> = {
  Moderation: { icon: Shield, color: "#f43f5e", glow: "rgba(244,63,94,.22)", ring: "rgba(244,63,94,.4)" },
  Tickets: { icon: Ticket, color: "#22c55e", glow: "rgba(34,197,94,.2)", ring: "rgba(34,197,94,.4)" },
  Fun: { icon: PartyPopper, color: "#f59e0b", glow: "rgba(245,158,11,.22)", ring: "rgba(245,158,11,.4)" },
  Utility: { icon: Wrench, color: "#6366f1", glow: "rgba(99,102,241,.24)", ring: "rgba(99,102,241,.45)" },
  Economy: { icon: Coins, color: "#eab308", glow: "rgba(234,179,8,.2)", ring: "rgba(234,179,8,.4)" },
  Logging: { icon: ScrollText, color: "#38bdf8", glow: "rgba(56,189,248,.2)", ring: "rgba(56,189,248,.4)" },
};

export const PERMISSIONS = [
  "Everyone",
  "Manage Messages",
  "Kick Members",
  "Ban Members",
  "Manage Channels",
  "Manage Roles",
  "Manage Server",
  "Administrator",
];

export const OPTION_TYPES = [
  "string",
  "integer",
  "number",
  "boolean",
  "user",
  "channel",
  "role",
  "mentionable",
  "attachment",
];

export const BUTTON_STYLES = ["Primary", "Secondary", "Success", "Danger", "Link"];

export const API_BASE = "https://api.prestonhq.com";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function safeUrl(u: string): string {
  try {
    const x = new URL(u);
    return ["http:", "https:"].includes(x.protocol) ? x.href : "";
  } catch {
    return "";
  }
}

export function timeAgo(t: number): string {
  const d = Math.floor((Date.now() - t) / 1000);
  if (d < 5) return "just now";
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export function fmtUptime(s?: number): string {
  if (s == null) return "—";
  s = Math.floor(s);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
