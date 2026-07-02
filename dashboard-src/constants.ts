import type { CommandCategory } from "./types";

export const API_BASE = "https://api.prestonhq.com";

export const FILTER_CATEGORIES: Array<CommandCategory | "All"> = [
  "All",
  "Slash commands",
  "Prefix commands",
  "Moderation",
  "Tickets",
  "Giveaways",
  "Sessions",
  "Utility",
  "Systems/Automation",
];

export const TYPE_LABELS = {
  slash: "Slash",
  prefix: "Prefix",
  auto: "Auto",
} as const;

export function fmtUptime(ms?: number | null): string {
  if (!ms) return "—";
  const s = Math.floor((Date.now() - ms) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
