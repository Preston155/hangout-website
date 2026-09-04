'use client';

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Command,
  CreditCard,
  Cpu,
  Database,
  Download,
  Eye,
  FileText,
  Globe,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  PhoneCall,
  Play,
  Printer,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Siren,
  Skull,
  Sparkles,
  Square,
  Terminal,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";

type Page = "overview" | "bot" | "operations" | "connect" | "players" | "cad" | "commands" | "logs" | "staff" | "tire-inventory" | "inventory-view" | "tire-sales" | "tire-sales-report" | "settings";
type Severity = "low" | "medium" | "high" | "critical";
type PlayerStatus = "online" | "flagged" | "banned" | "staff";
type ModActionType = "Warn" | "Kick" | "Ban" | "Unban" | "Kill" | "Teleport" | "PM" | "Announcement" | "CAD" | "System";
type Permission = "Kick" | "Ban" | "Unban" | "Kill" | "Teleport" | "PM" | "Announce" | "API Keys" | "Staff Roles" | "Export Logs";

type Player = {
  id: string;
  name: string;
  robloxId: string;
  status: PlayerStatus;
  team: string;
  playtime: string;
  ping: number;
  warnings: number;
  notes: string[];
  lastSeen: string;
};

type RobloxThumbnailResponse = {
  data?: {
    imageUrl?: string | null;
  };
};

const robloxHeadshotCache = new Map<string, string | null>();

function useRobloxHeadshot(robloxId: string) {
  const normalizedId = robloxId.trim();
  const isValidId = /^\d+$/.test(normalizedId);
  const cached = isValidId ? robloxHeadshotCache.get(normalizedId) : null;
  const [imageUrl, setImageUrl] = useState<string | null>(cached ?? null);
  const [imageFailed, setImageFailed] = useState(!isValidId);

  useEffect(() => {
    if (!isValidId) {
      setImageUrl(null);
      setImageFailed(true);
      return;
    }

    const cachedUrl = robloxHeadshotCache.get(normalizedId);
    if (cachedUrl !== undefined) {
      setImageUrl(cachedUrl);
      setImageFailed(cachedUrl === null);
      return;
    }

    const controller = new AbortController();
    setImageUrl(null);
    setImageFailed(false);

    async function loadHeadshot() {
      try {
        const endpoint = new URL(`/api/roblox/avatar/${encodeURIComponent(normalizedId)}`, API_BASE);

        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Roblox thumbnails returned ${response.status}`);

        const payload = (await response.json()) as RobloxThumbnailResponse;
        const nextUrl = payload.data?.imageUrl || null;

        robloxHeadshotCache.set(normalizedId, nextUrl);
        setImageUrl(nextUrl);
        setImageFailed(nextUrl === null);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        robloxHeadshotCache.set(normalizedId, null);
        setImageUrl(null);
        setImageFailed(true);
      }
    }

    void loadHeadshot();
    return () => controller.abort();
  }, [isValidId, normalizedId]);

  return {
    imageUrl: imageFailed ? null : imageUrl,
    markFailed: () => {
      robloxHeadshotCache.set(normalizedId, null);
      setImageFailed(true);
    },
  };
}

function PlayerAvatar({ player, large = false }: { player: Player; large?: boolean }) {
  const { imageUrl, markFailed } = useRobloxHeadshot(player.robloxId);
  const initial = player.name.trim().charAt(0).toUpperCase() || "?";
  const size = large ? "h-16 w-16 text-xl" : "h-9 w-9 text-xs";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-slate-700 via-zinc-800 to-zinc-950 shadow-md ${size}`}
      aria-label={`${player.name}'s Roblox avatar`}
    >
      <div className="absolute inset-0 flex items-center justify-center font-semibold text-zinc-100">
        {initial}
      </div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="relative h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={markFailed}
        />
      )}
      <span className={`absolute bottom-0 right-0 rounded-full border-2 border-zinc-950 bg-emerald-400 ${large ? "h-3.5 w-3.5" : "h-2.5 w-2.5"}`} />
    </div>
  );
}

type ModAction = {
  id: string;
  type: ModActionType;
  staff: string;
  player: string;
  reason: string;
  severity: Severity;
  time: string;
  timestamp?: string;
};

type ServerState = {
  name: string;
  code: string;
  owner: string;
  region: string;
  apiStatus: string;
  uptime: string;
  players: number;
  maxPlayers: number;
  staff: number;
  queue: number;
  connected: boolean;
};

type CADCall = {
  id: string;
  caller: string;
  location: string;
  type: string;
  description: string;
  priority: "Code 1" | "Code 2" | "Code 3";
  status: "Pending" | "Dispatched" | "Cleared";
  assignedUnits: string[];
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: string;
};

type CADRecord = {
  id: string;
  citizenName: string;
  robloxId: string;
  licenses: { drivers: boolean; firearm: boolean; commercial: boolean };
  warrants: string[];
  priors: string[];
  vehicle: { plate: string; model: string; color: string; status: "Valid" | "Stolen" | "Expired" };
  classification?: string;
  notes?: string;
  createdAt?: string;
};

type UnitStatus = {
  unitId: string;
  unitName: string;
  status: string;
  updatedAt: string;
};

type VeltrixDashboardData = {
  bot: {
    id: string;
    name: string;
    status: string;
    online: boolean;
    restarts: number;
    uptime: number | null;
    cpu: number;
    memoryMb: number;
  };
  database: { connected: boolean; integrity: string; sizeBytes: number };
  summary: {
    activeSessions: number;
    staffOnDuty: number;
    moderationCases: number;
    activeWarnings: number;
    verifiedMembers: number;
    staffProfiles: number;
    pendingLeaveRequests: number;
    activeStrikes: number;
    activeGiveaways: number;
  };
  giveaways: Array<{
    id: string;
    prize: string;
    status: string;
    hostName: string;
    winnerCount: number;
    endTime: number;
    entries: { users: number; weighted: number };
  }>;
  guildId: string | null;
  users: Record<string, { id: string; name: string; username: string; avatarUrl: string | null }>;
  activeShifts: Array<{ guildId: string; userId: string; startedAt: number; points: number; totalMs: number; completedShifts: number }>;
  shiftHistory: Array<{ id: number; guildId: string; userId: string; startedAt: number; endedAt: number; durationMs: number; points: number; endedBy: string; reason: string | null }>;
  warningHistory: Array<{ id: string; caseId: string; guildId: string; userId: string; moderatorId: string; reason: string; createdAt: number; active: number; removedBy: string | null; removedAt: number | null; removalReason: string | null }>;
  strikeHistory: Array<{ id: string; guildId: string; userId: string; points: number; reason: string; issuedBy: string; createdAt: number; active: number; removedBy: string | null; removedAt: number | null; removalReason: string | null }>;
  moderationHistory: Array<{ id: string; caseNumber: number; userId: string; moderatorId: string; action: string; reason: string; createdAt: number; active: number; removed: number }>;
  staffProfiles: Array<{ guildId: string; userId: string; points: number; totalMs: number; completedShifts: number; lastStart: number | null; lastEnd: number | null }>;
  recentStaffActivity: Array<{
    id: number;
    actorId: string;
    targetId: string | null;
    action: string;
    details: Record<string, unknown> | null;
    createdAt: number;
  }>;
  systems: Array<{ id: string; name: string; healthy: boolean }>;
  updatedAt: string;
};

type TireInventoryItem = {
  id: string;
  brand: string;
  model: string;
  size: string;
  packageType: "set4" | "pair" | "single";
  quantity: number;
  cost: number;
  price: number;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type TireSale = {
  id: string;
  serviceType: "tire" | "mount" | "plug" | "rotation" | "brakes";
  inventoryId: string;
  brand: string;
  model: string;
  size: string;
  packageType: "set4" | "pair" | "single";
  quantity: number;
  unitPrice: number;
  total: number;
  soldAt: string;
  customer: string;
  paymentMethod: string;
  notes: string;
  adjustInventory: boolean;
  recordedBy: string;
  createdAt: string;
};

type TireShopData = {
  inventory: TireInventoryItem[];
  sales: TireSale[];
  summary: {
    skus: number;
    units: number;
    lowStock: number;
    inventoryValue: number;
    todayUnits: number;
    todayRevenue: number;
    allTimeRevenue: number;
  };
  updatedAt: string;
};

const API_BASE = "https://api.prestonhq.com";

const defaultServer: ServerState = {
  name: "City of Angels Roleplay",
  code: "CityAngels",
  owner: "Preston",
  region: "US East (ER:LC)",
  apiStatus: "Connecting",
  uptime: "99.98%",
  players: 0,
  maxPlayers: 40,
  staff: 0,
  queue: 0,
  connected: false,
};

const emptyPlayer: Player = {
  id: "none",
  name: "No player selected",
  robloxId: "—",
  status: "online",
  team: "Waiting for telemetry",
  playtime: "—",
  ping: 0,
  warnings: 0,
  notes: ["Select an active player to view profile and issue moderation commands."],
  lastSeen: "—",
};

const mockCadCalls: CADCall[] = [
  {
    id: "CAD-91101",
    caller: "LunarPeach0",
    location: "River City Bank, Main St",
    type: "10-90 Silent Alarm / Bank Robbery",
    description: "Multiple armed suspects seen entering the vault area.",
    priority: "Code 3",
    status: "Pending",
    assignedUnits: [],
    timestamp: "2m ago",
  },
  {
    id: "CAD-91102",
    caller: "Civilian Dispatch",
    location: "Interstate 80, Exit 4",
    type: "10-50 Major Vehicle Accident",
    description: "Two-vehicle collision with rollover. EMS requested on scene.",
    priority: "Code 3",
    status: "Dispatched",
    assignedUnits: ["1-A-12", "E-1"],
    timestamp: "8m ago",
  },
];

const mockRecords: CADRecord[] = [
  {
    id: "REC-4401",
    citizenName: "LunarPeach0",
    robloxId: "8701907774",
    licenses: { drivers: true, firearm: true, commercial: false },
    warrants: ["Active Warrant: Evading Law Enforcement"],
    priors: ["Reckless Driving (x2)", "Failure to Comply"],
    vehicle: { plate: "ROBLOX1", model: "Bravado Buffalo", color: "Black", status: "Stolen" },
  },
];

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("prestonhq_token") || sessionStorage.getItem("prestonhq_token");
  const method = String(options.method || "GET").toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);
  let response: Response;
  try {
    response = await fetch(API_BASE + path, {
      ...options,
      signal: options.signal || controller.signal,
      cache: options.cache || (method === "GET" ? "no-store" : undefined),
      credentials: "include",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The shop server is taking too long to respond. Try again in a moment.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const payload = await response.json().catch(() => null);
  if (response.status === 401 && token) {
    localStorage.removeItem("prestonhq_token");
    sessionStorage.removeItem("prestonhq_token");
    window.dispatchEvent(new CustomEvent("akron-shop-auth-expired"));
  }
  if (!response.ok || !payload?.ok)
    throw new Error(payload?.error || `Request failed (${response.status})`);
  return payload.data as T;
}

function relativeTime(value: string) {
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "Just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

const DashboardClockContext = React.createContext(Date.now());

function DashboardClockProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <DashboardClockContext.Provider value={now}>{children}</DashboardClockContext.Provider>;
}

function LiveRelativeTime({ value }: { value: string | number }) {
  React.useContext(DashboardClockContext);
  return <>{relativeTime(new Date(value).toISOString())}</>;
}

function LiveShopTime() {
  const now = React.useContext(DashboardClockContext);
  return <>{new Date(now).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })}</>;
}

function LiveUptime({ startedAt }: { startedAt: number | null }) {
  React.useContext(DashboardClockContext);
  return <>{formatBotUptime(startedAt)}</>;
}

function formatShiftDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
}

function LiveShiftDuration({ startedAt }: { startedAt: number }) {
  React.useContext(DashboardClockContext);
  return <>{formatShiftDuration(Date.now() - startedAt)}</>;
}

function LiveEndsAt({ value }: { value: number }) {
  React.useContext(DashboardClockContext);
  return <>{formatEndsAt(value)}</>;
}

function AnimatedNumber({ value, decimals = 0, suffix = "", className = "" }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const displayed = useRef(0);
  const frame = useRef<number | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    const from = displayed.current;
    const difference = value - from;
    const started = performance.now();
    const duration = Math.min(900, Math.max(350, Math.abs(difference) * 45));

    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + difference * eased;
      displayed.current = next;
      setCurrent(next);
      if (progress < 1) frame.current = window.requestAnimationFrame(tick);
      else {
        displayed.current = value;
        setCurrent(value);
        frame.current = null;
      }
    };

    frame.current = window.requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return <span className={className}>{current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

const commandTemplates = [
  { name: "Peacetime Enabled", command: ":h Peacetime is now active. All priority scenes are paused.", locked: false },
  { name: "Server Restart", command: ":shutdown Server undergoing scheduled maintenance. Rejoin in 2 mins.", locked: true },
  { name: "Summon Staff", command: ":bring {player}", locked: true },
  { name: "Rules Reminder", command: ":h Active moderation in progress. Please adhere to server rules.", locked: false },
];

const permissions: Record<string, Permission[]> = {
  Owner: ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"],
  Admin: ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "Export Logs"],
  Moderator: ["Kick", "Kill", "Teleport", "PM", "Announce"],
  "Trial Mod": ["PM", "Announce"],
};

const navItems = [
  { id: "tire-inventory" as Page, label: "Stock Management", shortLabel: "Stock", icon: Package, tone: "sky" as const },
  { id: "inventory-view" as Page, label: "View Inventory", shortLabel: "View", icon: Eye, tone: "emerald" as const },
  { id: "tire-sales" as Page, label: "New Sale or Service", shortLabel: "New Sale", icon: ShoppingCart, tone: "amber" as const },
  { id: "tire-sales-report" as Page, label: "Sales Reports", shortLabel: "Reports", icon: ClipboardList, tone: "violet" as const },
  { id: "settings" as Page, label: "Account", shortLabel: "Account", icon: Settings, tone: "zinc" as const },
];

type ShopTone = "emerald" | "sky" | "amber" | "violet" | "zinc";
const shopToneStyles: Record<ShopTone, { text: string; dot: string; soft: string; ring: string }> = {
  emerald: { text: "text-emerald-400", dot: "bg-emerald-400", soft: "bg-emerald-400/10", ring: "ring-emerald-400/15" },
  sky: { text: "text-emerald-400", dot: "bg-emerald-400", soft: "bg-emerald-400/10", ring: "ring-emerald-400/15" },
  amber: { text: "text-emerald-400", dot: "bg-emerald-400", soft: "bg-emerald-400/10", ring: "ring-emerald-400/15" },
  violet: { text: "text-emerald-400", dot: "bg-emerald-400", soft: "bg-emerald-400/10", ring: "ring-emerald-400/15" },
  zinc: { text: "text-zinc-400", dot: "bg-zinc-400", soft: "bg-white/[.06]", ring: "ring-white/[.08]" },
};

const SHOP_BUILD_MARKER = "AKRON_SHOP_UI_20260904_OPERATIONS_CONSOLE_V35";

export function App() {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState<Page>("tire-inventory");
  const [auth, setAuth] = useState<"checking" | "guest" | "ready">("checking");
  const [serverData, setServerData] = useState<ServerState>(defaultServer);
  const [playerData, setPlayerData] = useState<Player[]>([]);
  const [logData, setLogData] = useState<ModAction[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(emptyPlayer);
  const [modal, setModal] = useState<{ action: ModActionType; player?: Player } | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const existingToken = sessionStorage.getItem("prestonhq_token");
    if (existingToken && !localStorage.getItem("prestonhq_token")) localStorage.setItem("prestonhq_token", existingToken);
    const styleId = "akron-shop-interface";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .shop-shell {
        isolation:isolate;
        position:relative;
        min-width:320px;
        color:#f9fafb;
        background:#090a0f;
        font-family:Inter,ui-sans-serif,system-ui,sans-serif;
      }
      .shop-shell::before {
        content:"";
        position:fixed;
        inset:0;
        z-index:-3;
        pointer-events:none;
        background:#090a0f;
      }
      .shop-shell::after {
        content:"";
        position:fixed;
        inset:0;
        z-index:-2;
        pointer-events:none;
        background:none;
      }
      .shop-wheel { position:relative; display:grid; place-items:center; aspect-ratio:1; filter:drop-shadow(0 12px 18px rgba(0,0,0,.38)); }
      .shop-wheel--positioned { position:absolute; }
      .shop-wheel img { position:relative; z-index:2; display:block; width:100%; height:100%; object-fit:contain; user-select:none; -webkit-user-drag:none; }
      .shop-wheel--animated img { transform:rotate(-4deg); }
      .shop-wheel::after { display:none; }
      .shop-wheel--animated::before, .tire-smoke, .tire-spark { display:none; }
      .shop-wordmark { font-family:Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif; letter-spacing:-.035em; text-transform:uppercase; }
      .shop-hero { position:relative; }
      .shop-hero::before, .shop-hero::after { display:none; }
      .shop-hero__beam, .shop-hero__speed { display:none; }
      .shop-panel { border-color:#232938 !important; background-color:#12151e !important; }
      .shop-ambient { display:none; }
      .alive-scan { position:relative; overflow:hidden; }
      .mobile-surface { position:relative; }
      .mobile-surface::before { display:none; }
      .shop-stat-grid { gap:16px !important; overflow:visible; border:0; border-radius:0; background:transparent; box-shadow:none; }
      .shop-stat-grid .mobile-stat-card { border:1px solid #232938 !important; border-radius:14px !important; background:#12151e; box-shadow:0 1px 2px rgba(0,0,0,.4); transition:border-color .15s ease,background-color .15s ease; }
      .shop-stat-grid .mobile-stat-card:hover { border-color:#333b50 !important; background:#151923; }
      .shop-shell input, .shop-shell select, .shop-shell textarea {
        color-scheme:dark;
        border-color:#232938 !important;
        background-color:#090a0f !important;
      }
      .shop-shell input:focus, .shop-shell select:focus, .shop-shell textarea:focus { border-color:#10b981 !important; }
      .shop-shell thead { background:#1a1e2b; }
      .shop-shell th { color:#9ca3af; font-size:11px; letter-spacing:.05em; }
      .shop-shell td { border-color:#232938 !important; }
      .shop-shell table tbody tr { transition:background-color .15s ease; }
      .shop-shell table tbody tr:hover { background:#151923; }
      .shop-card { background:#12151e !important; border-color:#232938 !important; border-radius:14px !important; box-shadow:0 1px 2px rgba(0,0,0,.4); }
      .shop-money { font-family:"JetBrains Mono",ui-monospace,monospace; }
      .shop-card-title-icon { box-shadow:inset 0 0 0 1px rgba(255,255,255,.055); }
      .live-dot { position:relative; }
      .live-dot::after { content:""; position:absolute; inset:-4px; border:1px solid currentColor; border-radius:999px; opacity:0; animation:live-ring 2.4s ease-out infinite; }
      @keyframes live-ring { 0%{transform:scale(.65);opacity:.55} 75%,100%{transform:scale(1.9);opacity:0} }
      @media (min-width: 768px) {
        .mobile-surface { transition:border-color .18s ease,background-color .18s ease; }
      }
      @media print {
        @page { size:auto; margin:0; }
        html, body { min-height:0 !important; height:auto !important; background:#fff !important; }
        body { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        body > *:not(.receipt-print-layer) { display:none !important; }
        .receipt-print-layer { display:block !important; position:static !important; inset:auto !important; min-height:0 !important; padding:0 !important; overflow:visible !important; background:#fff !important; }
        .receipt-print-layer > div { display:block !important; min-height:0 !important; width:100% !important; max-width:none !important; padding:0 !important; }
        .receipt-print-root { position:static !important; width:100% !important; min-height:0 !important; box-shadow:none !important; }
        .receipt-screen-actions { display:none !important; }
      }
      @media (max-width: 767px) {
        .shop-shell { background:#090a0f; }
        input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
        select,
        textarea {
          font-size: 16px !important;
          touch-action: manipulation;
        }
        .mobile-surface {
          transition: border-color .18s ease, background-color .18s ease;
        }
        .shop-hero { min-height:0; }
        .mobile-form-trigger { background:#12151e; }
        .shop-stat-grid { gap:10px !important; }
        .mobile-today-grid { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
        .mobile-today-grid > :first-child { grid-column:1 / -1; }
        .mobile-today-grid > :not(:first-child) { min-width:0; }
        button, a { -webkit-tap-highlight-color: transparent; }
        .mobile-tap { transition: background-color .18s ease, border-color .18s ease; }
        @keyframes mobile-status-pulse {
          0%, 100% { opacity: .45; transform: scale(.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .mobile-status-pulse { animation: mobile-status-pulse 2.2s ease-in-out infinite; }
      }
      @media (max-width: 389px) {
        .payment-summary-grid { grid-template-columns:minmax(0,1fr) !important; }
        .payment-summary-grid > * { display:flex; align-items:center; justify-content:space-between; gap:12px; text-align:left; }
        .payment-summary-grid > * + * { border-left-width:0 !important; border-top:1px solid rgba(255,255,255,.06); }
        .payment-summary-grid > * > :last-child { margin-top:0 !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .mobile-page > *, .mobile-status-pulse, .shop-wheel img, .shop-wheel--animated::before, .tire-smoke, .tire-spark, .shop-hero::before, .shop-hero__beam, .shop-hero__speed, .shop-ambient::before, .shop-ambient::after, .alive-scan::after, .live-dot::after { animation: none !important; }
        .mobile-surface, .mobile-tap { transition: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const checkForUiUpdate = async () => {
      try {
        const response = await fetch(`/?app-update=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
        const latestHtml = await response.text();
        if (!latestHtml.includes(SHOP_BUILD_MARKER)) window.location.reload();
      } catch { /* Stay usable offline and try again later. */ }
    };
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void checkForUiUpdate(); };
    const timer = window.setInterval(() => void checkForUiUpdate(), 60000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      setAuth("guest");
      showToast("Your session expired. Sign in again.");
    };
    window.addEventListener("akron-shop-auth-expired", handleExpiredSession);
    return () => {
      window.removeEventListener("akron-shop-auth-expired", handleExpiredSession);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, [showToast]);

  const loadLiveData = useCallback(async () => {
    try {
      const [overview, logResponse] = await Promise.all([
        api<any>("/api/erlc/overview"),
        api<any>("/api/erlc/logs?limit=200").catch(() => ({ cases: [] })),
      ]);
      if (!overview.configured) {
        setServerData({ ...defaultServer, apiStatus: "Key Required", connected: false });
        setPlayerData([]);
        setSyncError("ER:LC API credentials not detected.");
        return;
      }
      const rawServer = overview.server || {};
      const mappedPlayers: Player[] = (overview.players || []).map((player: any) => ({
        id: String(player.id || player.name),
        name: String(player.name || "Unknown"),
        robloxId: String(player.robloxId || player.id || "—"),
        status: player.staff ? "staff" : "online",
        team: String(player.team || "Civilian"),
        playtime: "Active",
        ping: player.ping || 32,
        warnings: 0,
        notes: [
          player.callsign ? `Callsign: ${player.callsign}` : "Verified session",
          `Role: ${player.permission || "Standard"}`,
        ],
        lastSeen: "Now",
      }));
      setPlayerData(mappedPlayers);
      setSelectedPlayer((current) => mappedPlayers.find((player) => player.id === current.id) || mappedPlayers[0] || emptyPlayer);
      setServerData({
        name: String(rawServer.Name || rawServer.name || rawServer.ServerName || "City of Angels Roleplay"),
        code: String(rawServer.JoinKey || rawServer.joinKey || rawServer.Code || "Private"),
        owner: String(rawServer.Owner || rawServer.owner || "Preston"),
        region: "US East (ER:LC)",
        apiStatus: "Active",
        uptime: "99.98%",
        players: overview.stats?.players ?? mappedPlayers.length,
        maxPlayers: Number(rawServer.MaxPlayers || rawServer.maxPlayers || 40),
        staff: overview.stats?.staff ?? mappedPlayers.filter((player) => player.status === "staff").length,
        queue: overview.stats?.queue ?? 0,
        connected: true,
      });
      const cases = Array.isArray(logResponse.cases) ? logResponse.cases : [];
      const audit = Array.isArray(logResponse.audit) ? logResponse.audit : [];
      setLogData(
        [...cases.map((item: any) => ({
          id: String(item.id),
          type: item.type as ModActionType,
          staff: String(item.staff?.name || "Admin"),
          player: String(item.target || "Server"),
          reason: String(item.reason || "No explicit reason specified"),
          severity:
            item.type === "Ban"
              ? "critical"
              : item.type === "Kick" || item.type === "Kill"
              ? "high"
              : item.type === "PM" || item.type === "Announcement"
              ? "low"
              : "medium",
          time: relativeTime(item.createdAt),
          timestamp: item.createdAt,
          sortTime: item.createdAt,
        })), ...audit.map((item: any) => ({
          id: String(item.id),
          type: String(item.action || "").startsWith("cad_") ? "CAD" as ModActionType : "System" as ModActionType,
          staff: String(item.actor?.name || "System"),
          player: String(item.details?.caller || item.details?.unitName || item.entityId || "Dashboard"),
          reason: String(item.details?.location || item.details?.classification || String(item.action || "System event").replaceAll("_", " ")),
          severity: String(item.action || "").includes("created") ? "medium" as Severity : "low" as Severity,
          time: relativeTime(item.timestamp),
          timestamp: item.timestamp,
          sortTime: item.timestamp,
        }))]
          .sort((a: any, b: any) => String(b.sortTime || "").localeCompare(String(a.sortTime || "")))
          .slice(0, 200)
      );
      setSyncError(overview.warnings?.[0] || "");
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setServerData((current) => ({ ...current, apiStatus: "Disconnected", connected: false }));
      setSyncError(error instanceof Error ? error.message : "Synchronization failure.");
    }
  }, []);

  useEffect(() => {
    api<any>("/api/auth/me")
      .then((data) => {
        if (!data.authenticated) {
          localStorage.removeItem("prestonhq_token");
          sessionStorage.removeItem("prestonhq_token");
          setAuth("guest");
          return;
        }
        setAuth("ready");
      })
      .catch(() => setAuth("guest"));
  }, [loadLiveData]);

  const executeAction = async (reason: string) => {
    if (!modal) return;
    setBusy(true);
    try {
      await api("/api/erlc/actions", {
        method: "POST",
        body: JSON.stringify({ action: modal.action, target: modal.player?.name || "", reason }),
      });
      showToast(`${modal.action} command dispatched successfully.`);
      setModal(null);
      await loadLiveData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Command dispatch failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendCommand = async (command: string) => {
    setBusy(true);
    try {
      await api("/api/erlc/command", { method: "POST", body: JSON.stringify({ command }) });
      showToast("Global command executed.");
      await loadLiveData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Execution failed.");
    } finally {
      setBusy(false);
    }
  };

  if (auth === "checking") return <LoadingScreen />;
  if (auth === "guest") return <LoginScreen onSuccess={() => setAuth("ready")} />;

  return (
    <DashboardClockProvider>
    <div className="shop-shell relative min-h-screen font-sans text-zinc-100 antialiased selection:bg-emerald-300/25 selection:text-white">
      <div className="shop-ambient" aria-hidden="true" />
      <div className="flex min-h-screen">
        <Sidebar page={page} setPage={setPage} />
        <main className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
          <Topbar page={page} />
          <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-28 sm:pt-7 lg:px-10 lg:pb-14 lg:pt-8">
            <AnimatePresence mode="wait">
              <motion.div className="mobile-page" key={page} initial={{ opacity: 0, y: reduceMotion ? 0 : 10, scale: reduceMotion ? 1 : 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }} transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
                {page === "tire-inventory" && <TireInventoryPage showToast={showToast} setPage={setPage} />}
                {page === "inventory-view" && <TireInventoryViewPage showToast={showToast} />}
                {page === "tire-sales" && <TireSalesPage showToast={showToast} setPage={setPage} />}
                {page === "tire-sales-report" && <TireSalesReportPage showToast={showToast} setPage={setPage} />}
                {page === "settings" && <SettingsPage showToast={showToast} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>
      <MobileShopNav page={page} setPage={setPage} />
      <AnimatePresence>{modal && <ActionModal modal={modal} close={() => setModal(null)} confirm={executeAction} busy={busy} />}</AnimatePresence>
      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
    </DashboardClockProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#090a0f] text-zinc-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-400" />
        <span className="text-xs font-medium tracking-wide">Opening Akron Tire Shop...</span>
      </div>
    </div>
  );
}

function ShopWheel({ className = "", accent = "#bef264", smoke = false, animated = false }: { className?: string; accent?: string; smoke?: boolean; animated?: boolean }) {
  return (
    <div aria-hidden="true" className={`shop-wheel ${animated ? "shop-wheel--animated" : ""} ${className}`}>
      {smoke && <><span className="tire-smoke" /><span className="tire-smoke tire-smoke--two" /><span className="tire-smoke tire-smoke--three" /><span className="tire-spark" /><span className="tire-spark tire-spark--two" /><span className="tire-spark tire-spark--three" /></>}
      <img src="/assets/akron-real-tire-mobile-v2.png" alt="" decoding="async" draggable={false} style={{ filter: `drop-shadow(0 0 18px ${accent}18)` }} />
    </div>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    api<{ available: boolean }>("/api/auth/passkeys/status")
      .then((status) => setPasskeyAvailable(status.available))
      .catch(() => setPasskeyAvailable(false));
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<any>("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
      if (data.token) localStorage.setItem("prestonhq_token", data.token);
      onSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Invalid access token.");
    } finally {
      setBusy(false);
    }
  };

  const loginWithPasskey = async () => {
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await api<any>("/api/auth/passkeys/authenticate/options", { method: "POST" });
      const credential = await startAuthentication({ optionsJSON });
      const data = await api<any>("/api/auth/passkeys/authenticate/verify", { method: "POST", body: JSON.stringify(credential) });
      if (data.token) localStorage.setItem("prestonhq_token", data.token);
      onSuccess();
    } catch (passkeyError) {
      const message = passkeyError instanceof Error ? passkeyError.message : "";
      setError(/timed out|not allowed|denied|cancel/i.test(message) ? "Passkey sign-in was not completed. On PC, choose Windows Hello, a security key, or use your phone or tablet." : message || "Passkey sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shop-shell min-h-screen text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(480px,.9fr)]">
        <section className="relative hidden overflow-hidden border-r border-[#232938] bg-[#12151e] p-12 lg:flex lg:flex-col xl:p-16">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl border border-white/[.07] bg-white/[.035]"><ShopWheel className="w-10" /></div><div><div className="text-base font-semibold text-white">Akron Tire Shop</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.16em] text-emerald-400">Shop operations</div></div></div>
          <div className="my-auto max-w-xl"><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-400">Inventory · Sales · Service</div><h1 className="mt-4 text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-[#f4f4ef] xl:text-6xl">Everything your shop needs, in one place.</h1><p className="mt-5 max-w-lg text-sm leading-7 text-zinc-500">Keep stock accurate, record every job, and review daily revenue without juggling separate tools.</p></div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#232938] bg-[#232938]"><div className="bg-[#1a1e2b] p-4"><Package className="h-4 w-4 text-emerald-400" /><div className="mt-3 text-xs font-medium text-zinc-300">Inventory</div></div><div className="bg-[#1a1e2b] p-4"><ShoppingCart className="h-4 w-4 text-emerald-400" /><div className="mt-3 text-xs font-medium text-zinc-300">Sales</div></div><div className="bg-[#1a1e2b] p-4"><ClipboardList className="h-4 w-4 text-emerald-400" /><div className="mt-3 text-xs font-medium text-zinc-300">Reports</div></div></div>
        </section>
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:bg-[#090a0f]">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl border border-white/[.07] bg-[#151a16]"><ShopWheel className="w-9" /></div><div><div className="text-base font-semibold text-white">Akron Tire Shop</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.15em] text-emerald-400">Shop operations</div></div></div></div>
            <div><div className="text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">Private access</div><h2 className="mt-2 text-[32px] font-semibold tracking-[-.045em] text-white">Sign in to the shop</h2><p className="mt-2 text-sm leading-relaxed text-zinc-500">Use your passkey or shop passcode to continue.</p></div>
            <form onSubmit={login} className="mt-8 space-y-4">
              {passkeyAvailable && <><button type="button" disabled={busy} onClick={() => void loginWithPasskey()} className="mobile-tap flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#07100b] transition hover:bg-emerald-300 disabled:opacity-40"><KeyRound className="h-4 w-4" />{busy ? "Waiting for passkey..." : "Continue with a passkey"}</button><p className="text-center text-[10px] leading-relaxed text-zinc-600">Face ID, Windows Hello, or a saved passkey</p><div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-white/[.07]" /><span className="text-[9px] font-medium uppercase tracking-[.14em] text-zinc-700">or</span><span className="h-px flex-1 bg-white/[.07]" /></div></>}
              <label className="block text-[11px] font-medium text-zinc-400">Shop passcode<input autoFocus={!passkeyAvailable} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your passcode" className="mt-2 min-h-12 w-full rounded-xl border border-white/[.08] bg-black/30 px-4 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10" /></label>
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[.07] p-3 text-xs text-red-400">{error}</div>}
              <button disabled={busy || !password} className="mobile-tap min-h-12 w-full rounded-xl border border-white/[.08] bg-white/[.055] px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[.09] disabled:opacity-40">{busy ? "Signing in..." : "Enter Shop"}</button>
            </form>
            <div className="mt-8 flex items-center gap-2 border-t border-white/[.06] pt-5 text-[10px] text-zinc-700"><ShieldCheck className="h-3.5 w-3.5" /> Secure private shop management</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-[#232938] bg-[#12151e] px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2 py-1.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,.25)]"><ShopWheel className="w-9" /></div>
        <div className="min-w-0">
          <div className="text-[15px] font-extrabold tracking-[-.025em] text-white">Akron Tire Shop</div>
          <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-emerald-400">Operations OS</div>
        </div>
      </div>
      <div className="my-5 h-px bg-[#232938]" />
      <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.15em] text-zinc-700">Workspace</div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === page;
          const tone = shopToneStyles[item.tone];
          return (
            <button key={item.id} onClick={() => setPage(item.id)} className={`group flex min-h-11 w-full items-center gap-3 rounded-[10px] border px-3.5 text-left text-[13px] font-semibold transition ${active ? "border-transparent bg-emerald-400/[.12] text-emerald-400" : "border-transparent text-zinc-400 hover:bg-[#1a1e2b] hover:text-white"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${active ? "bg-emerald-400/10" : "bg-transparent"}`}><Icon className={`h-4 w-4 ${active ? tone.text : "text-zinc-600 group-hover:text-zinc-400"}`} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#232938] px-2 pt-4">
        <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-medium text-zinc-300">Shop database</span><span className="flex items-center gap-1.5 text-[9px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live</span></div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-zinc-600">Changes save automatically across every device.</p>
      </div>
    </aside>
  );
}

function Topbar({ page }: { page: Page }) {
  const currentNav = navItems.find((item) => item.id === page);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#232938] bg-[#12151e] px-4 sm:px-6 lg:hidden">
      <div className="flex items-center gap-2.5 lg:hidden"><ShopWheel className="w-8 shrink-0" /><div><div className="text-[9px] font-bold uppercase tracking-[.16em] text-emerald-400">Akron Tire Shop</div><div className="mt-0.5 text-sm font-semibold tracking-[-.015em] text-white">{currentNav?.label}</div></div></div>
      <div className="ml-auto flex items-center gap-2 text-[9px] font-medium text-zinc-600 sm:text-[10px]"><span className="hidden font-mono tabular-nums text-zinc-500 sm:inline"><LiveShopTime /></span><span className="hidden h-3 w-px bg-white/[.08] sm:inline" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="hidden min-[380px]:inline">All changes saved</span><span className="min-[380px]:hidden">Saved</span></div>
    </header>
  );
}

function MobileShopNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#232938] bg-[#12151e]/[.98] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {navItems.map((item) => { const Icon = item.icon; const active = item.id === page; return <button key={item.id} onClick={() => setPage(item.id)} className={`relative flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[9px] font-medium transition ${active ? "text-emerald-300" : "text-zinc-600"}`}><span className={`grid h-7 w-9 place-items-center rounded-lg ${active ? "bg-emerald-400/10" : ""}`}><Icon className="h-[18px] w-[18px]" /></span><span className="truncate">{item.shortLabel}</span></button>; })}
      </div>
    </nav>
  );
}

function Overview({ showToast, setPage, serverData, logs, onRefresh }: { showToast: (m: string) => void; setPage: (p: Page) => void; serverData: ServerState; logs: ModAction[]; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-400 mb-2">
              <Server className="h-3 w-3 text-emerald-400" /> Live Instance
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{serverData.name}</h2>
            <p className="mt-1 text-xs text-zinc-400 max-w-xl">Real-time telemetry, automated moderation dispatches, and emergency server administrative controls.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
              <div className="text-[10px] text-zinc-500 font-medium">SERVER CODE</div>
              <div className="font-mono text-zinc-200 mt-0.5">{serverData.code}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
              <div className="text-[10px] text-zinc-500 font-medium">STATUS</div>
              <div className="text-emerald-400 mt-0.5 font-medium">{serverData.connected ? "Operational" : "Offline"}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Active Players" value={serverData.players} max={serverData.maxPlayers} sub="Capacity" icon={<Users className="h-4 w-4 text-zinc-400" />} />
        <Metric title="Staff Online" value={serverData.staff} sub="Active Administrators" icon={<Shield className="h-4 w-4 text-zinc-400" />} />
        <Metric title="Server Queue" value={serverData.queue} sub="Waiting Connection" icon={<Activity className="h-4 w-4 text-zinc-400" />} />
        <Metric title="API Health" value={serverData.connected ? 100 : 0} suffix="%" sub="Response Time ~24ms" icon={<Zap className="h-4 w-4 text-zinc-400" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Recent Audit Logs" icon={<ClipboardList className="h-4 w-4 text-zinc-400" />} action={<Button variant="ghost" onClick={() => setPage("logs")}>View Timeline</Button>} />
            <div className="mt-4 space-y-2">
              {logs.slice(0, 5).map((log) => <LogRow key={log.id} log={log} />)}
              {!logs.length && <EmptyState title="No logs recorded" text="System actions will appear here in real time." />}
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="Gateway Status" icon={<Cpu className="h-4 w-4 text-zinc-400" />} />
            <div className="mt-4 space-y-4">
              <Health label="PRC API Endpoint" value="Healthy" percent={98} />
              <Health label="Discord Bridge" value="Connected" percent={95} />
              <Health label="Webhook Stream" value="Active" percent={100} />
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="w-full" onClick={() => { onRefresh(); showToast("Refreshed server telemetry."); }}>Refresh Data</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, max, suffix = "", sub, icon }: { title: string; value: number; max?: number; suffix?: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs font-medium">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white tracking-tight"><AnimatedNumber value={value} suffix={suffix} />{typeof max === "number" && <>/<AnimatedNumber value={max} /></>}</div>
      <div className="mt-1 text-[11px] text-zinc-500">{sub}</div>
    </div>
  );
}

function Connect({ showToast, onConnected }: { showToast: (m: string) => void; onConnected: () => Promise<void> }) {
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      await api("/api/erlc/connect", { method: "POST", body: JSON.stringify({ apiKey }) });
      setApiKey("");
      showToast("ER:LC Server connected.");
      await onConnected();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Connect Server Gateway" icon={<Server className="h-4 w-4 text-zinc-400" />} />
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
            <p>Input your ER:LC Private Server API key to initiate real-time telemetry streaming and command execution rights.</p>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">PRC API Key</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste secret key..." className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 outline-none transition focus:border-zinc-500" />
            </div>
            <Button disabled={busy || apiKey.length < 8} onClick={connect}>
              {busy ? "Connecting..." : "Establish Connection"}
            </Button>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader title="Gateway Protocols" icon={<ShieldCheck className="h-4 w-4 text-zinc-400" />} />
          <div className="mt-4 space-y-3 text-xs text-zinc-400">
            <Checklist label="Encrypted SSL Payload" done />
            <Checklist label="Automatic Token Rotation" done />
            <Checklist label="Role-Based Enforcement" done />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Players({ players, selected, setSelected, openAction }: { players: Player[]; selected: Player; setSelected: (p: Player) => void; openAction: (a: ModActionType, p: Player) => void }) {
  const [q, setQ] = useState("");
  const filtered = players.filter((p) => `${p.name} ${p.robloxId} ${p.team}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Active Players" icon={<Users className="h-4 w-4 text-zinc-400" />} action={<SearchBox value={q} setValue={setQ} placeholder="Filter roster..." />} />
          <div className="mt-4 divide-y divide-zinc-800/60 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40">
            {filtered.map((player) => <PlayerRow key={player.id} player={player} active={selected.id === player.id} onClick={() => setSelected(player)} />)}
          </div>
          {!filtered.length && <EmptyState title="No active players found" text="Try refining your query." />}
        </Card>
      </div>
      <div>
        <PlayerProfile player={selected} openAction={openAction} />
      </div>
    </div>
  );
}

function PlayerProfile({ player, openAction }: { player: Player; openAction: (a: ModActionType, p: Player) => void }) {
  const actions: Array<[ModActionType, React.ReactNode, boolean]> = [
    ["Kick", <LogOut className="h-3.5 w-3.5" />, true],
    ["Ban", <Ban className="h-3.5 w-3.5" />, true],
    ["Kill", <Skull className="h-3.5 w-3.5" />, true],
    ["Teleport", <MapPin className="h-3.5 w-3.5" />, false],
    ["PM", <MessageSquare className="h-3.5 w-3.5" />, false],
  ];

  return (
    <Card>
      <CardHeader title="Player Details" icon={<Eye className="h-4 w-4 text-zinc-400" />} />
      <div className="mt-4 flex items-center gap-3.5 border-b border-zinc-800/80 pb-4">
        <PlayerAvatar player={player} large />
        <div>
          <h3 className="text-base font-semibold text-white">{player.name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Roblox ID: {player.robloxId}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Info label="Team Assignment" value={player.team} />
        <div><div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Ping Latency</div><div className="mt-0.5 text-xs font-medium text-zinc-200"><AnimatedNumber value={player.ping} suffix="ms" /></div></div>
        <Info label="Session Time" value={player.playtime} />
        <div><div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Prior Warnings</div><div className="mt-0.5 text-xs font-medium text-zinc-200"><AnimatedNumber value={player.warnings} /></div></div>
      </div>
      <div className="mt-6 space-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Quick Actions</span>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(([action, icon, danger]) => (
            <Button key={action} variant={danger ? "danger" : "secondary"} onClick={() => openAction(action, player)}>
              {icon}
              {action}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function PlayerRow({ player, active, onClick }: { player: Player; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between p-3 text-left transition ${active ? "bg-zinc-800/60 text-white" : "hover:bg-zinc-900/40 text-zinc-300"}`}>
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} />
        <div>
          <div className="text-xs font-medium text-zinc-200">{player.name}</div>
          <div className="text-[11px] text-zinc-500">{player.team}</div>
        </div>
      </div>
      <span className="font-mono text-xs text-zinc-500"><AnimatedNumber value={player.ping} suffix="ms" /></span>
    </button>
  );
}

function CadMdtCenter({ players, showToast }: { players: Player[]; showToast: (m: string) => void }) {
  const [activeTab, setActiveTab] = useState<"dispatch" | "lookup" | "units">("dispatch");
  const [calls, setCalls] = useState<CADCall[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [foundRecord, setFoundRecord] = useState<CADRecord | null>(null);
  const [unitStatus, setUnitStatus] = useState<Record<string, UnitStatus>>({});
  const [busy, setBusy] = useState(false);
  const [callForm, setCallForm] = useState({ type: "", location: "", priority: "Code 3", description: "" });
  const [recordForm, setRecordForm] = useState({ citizenName: "", classification: "Traffic Citation", notes: "" });

  const refreshCad = useCallback(async (silent = false) => {
    try {
      const response = await api<any>("/api/erlc/cad");
      setCalls(Array.isArray(response.calls) ? response.calls : []);
      setUnitStatus(response.unitStatuses || {});
      if (response.ingested && !silent) showToast(`${response.ingested} new in-game call${response.ingested === 1 ? "" : "s"} received.`);
    } catch (error) {
      if (!silent) showToast(error instanceof Error ? error.message : "CAD synchronization failed.");
    }
  }, [showToast]);

  useEffect(() => {
    void refreshCad(true);
    const timer = window.setInterval(() => void refreshCad(true), 5000);
    return () => window.clearInterval(timer);
  }, [refreshCad]);

  const createCall = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api<any>("/api/erlc/cad/calls", { method: "POST", body: JSON.stringify(callForm) });
      setCalls((current) => [response.call, ...current.filter((item) => item.id !== response.call.id)]);
      setCallForm({ type: "", location: "", priority: "Code 3", description: "" });
      showToast(response.broadcast?.delivered ? "CAD call saved and broadcast in game." : response.broadcast?.error ? `Call saved. Broadcast warning: ${response.broadcast.error}` : "CAD call saved.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "The CAD call could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const updateCall = async (call: CADCall, changes: Record<string, unknown>) => {
    setBusy(true);
    try {
      const response = await api<any>(`/api/erlc/cad/calls/${encodeURIComponent(call.id)}`, { method: "PATCH", body: JSON.stringify(changes) });
      setCalls((current) => current.map((item) => item.id === response.call.id ? response.call : item));
      showToast(`${response.call.id} updated.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "CAD call update failed.");
    } finally {
      setBusy(false);
    }
  };

  const dispatchUnits = (call: CADCall) => {
    const value = window.prompt("Enter unit callsigns separated by commas:", call.assignedUnits.join(", "));
    if (value === null) return;
    const assignedUnits = value.split(",").map((item) => item.trim()).filter(Boolean);
    void updateCall(call, { assignedUnits, status: "Dispatched", announce: true });
  };

  const searchRecords = async () => {
    setBusy(true);
    try {
      const response = await api<any>(`/api/erlc/cad/records?q=${encodeURIComponent(searchQuery)}`);
      const records = Array.isArray(response.records) ? response.records : [];
      setFoundRecord(records[0] || null);
      showToast(records.length ? `${records.length} matching record${records.length === 1 ? "" : "s"} found.` : "No matching records found.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "NCIC search failed.");
    } finally {
      setBusy(false);
    }
  };

  const createRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api<any>("/api/erlc/cad/records", { method: "POST", body: JSON.stringify(recordForm) });
      setFoundRecord(response.record);
      setSearchQuery(response.record.citizenName);
      setRecordForm({ citizenName: "", classification: "Traffic Citation", notes: "" });
      showToast("Incident report saved to the NCIC database.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Incident report could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnitStatusChange = async (unit: Player, status: string) => {
    try {
      const response = await api<any>(`/api/erlc/cad/units/${encodeURIComponent(unit.id)}`, { method: "PATCH", body: JSON.stringify({ unitName: unit.name, status }) });
      setUnitStatus((current) => ({ ...current, [unit.id]: response.unit }));
      showToast(`Updated ${unit.name} status to ${status}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unit status update failed.");
    }
  };

  const emergencyUnits = players.filter((p) =>
    ["Police", "Sheriff", "State Police", "Fire", "EMS"].some((dept) => p.team.toLowerCase().includes(dept.toLowerCase()))
  );
  const activeCalls = calls.filter((call) => call.status !== "Cleared");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Siren className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-white">Emergency Services MDT / CAD Dispatch Terminal</div>
            <div className="text-zinc-400 mt-0.5">Live emergency CAD routing, civilian NCIC warrants database, and officer status grid.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab("dispatch")} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "dispatch" ? "bg-blue-600 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}>
            911 CAD Queue (<AnimatedNumber value={activeCalls.length} />)
          </button>
          <button onClick={() => setActiveTab("lookup")} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "lookup" ? "bg-blue-600 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}>
            NCIC Lookup
          </button>
          <button onClick={() => setActiveTab("units")} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "units" ? "bg-blue-600 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}>
            Unit Monitor (<AnimatedNumber value={emergencyUnits.length} />)
          </button>
        </div>
      </div>

      {activeTab === "dispatch" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Active CAD Calls Queue" icon={<PhoneCall className="h-4 w-4 text-blue-400" />} />
              <div className="mt-4 space-y-3">
                {activeCalls.map((call) => (
                  <div key={call.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${call.priority === "Code 3" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                          {call.priority}
                        </span>
                        <span className="font-mono text-xs font-medium text-white">{call.id}</span>
                        <span className="text-xs text-zinc-400">• {call.type}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">{call.createdAt ? <LiveRelativeTime value={call.createdAt} /> : call.timestamp || "Just now"}</span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="text-zinc-300"><span className="text-zinc-500 font-medium">Caller:</span> {call.caller}</div>
                      <div className="text-zinc-300"><span className="text-zinc-500 font-medium">Location:</span> {call.location}</div>
                      <div className="text-zinc-400 leading-relaxed mt-2">{call.description}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                      <div className="text-xs text-zinc-500">
                        Units Assigned: {call.assignedUnits.length ? call.assignedUnits.join(", ") : "None"}
                      </div>
                      <div className="flex gap-2">
                        <Button disabled={busy} variant="secondary" onClick={() => dispatchUnits(call)}>Dispatch Units</Button>
                        <Button disabled={busy} variant="ghost" onClick={() => void updateCall(call, { status: "Cleared", announce: true })}>Clear</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!activeCalls.length && <EmptyState title="No active CAD calls" text="New dashboard dispatches and incoming ER:LC calls will appear here automatically." />}
              </div>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader title="Create 911 CAD Dispatch" icon={<Radio className="h-4 w-4 text-zinc-400" />} />
              <form onSubmit={createCall} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Call Title / Type</label>
                  <input required minLength={3} value={callForm.type} onChange={(event) => setCallForm({ ...callForm, type: event.target.value })} type="text" placeholder="e.g. 10-80 Pursuit" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Location</label>
                  <input required value={callForm.location} onChange={(event) => setCallForm({ ...callForm, location: event.target.value })} type="text" placeholder="e.g. Postal 104" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Response Priority</label>
                  <select value={callForm.priority} onChange={(event) => setCallForm({ ...callForm, priority: event.target.value })} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500">
                    <option value="Code 3">Code 3 (Emergency)</option>
                    <option value="Code 2">Code 2 (Urgent)</option>
                    <option value="Code 1">Code 1 (Routine)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Details</label>
                  <textarea required minLength={3} value={callForm.description} onChange={(event) => setCallForm({ ...callForm, description: event.target.value })} placeholder="Describe scenario details..." className="h-20 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500" />
                </div>
                <Button disabled={busy} className="w-full">{busy ? "Broadcasting..." : "Broadcast CAD Dispatch"}</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "lookup" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="NCIC Records Database Search" icon={<Database className="h-4 w-4 text-blue-400" />} />
              <form onSubmit={(event) => { event.preventDefault(); void searchRecords(); }} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Roblox username, ID, or vehicle plate..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500"
                />
                <Button disabled={busy}>Search</Button>
              </form>

              {foundRecord && (
                <div className="mt-6 space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">{foundRecord.citizenName}</h3>
                      <p className="text-xs text-zinc-500">Record: {foundRecord.id}{foundRecord.robloxId ? ` • Roblox ID: ${foundRecord.robloxId}` : ""}</p>
                    </div>
                    {foundRecord.warrants.length > 0 && <span className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/30">Warrant Flagged</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <Info label="Driver License" value={foundRecord.licenses.drivers ? "Valid" : "None"} />
                    <Info label="Firearm Permit" value={foundRecord.licenses.firearm ? "Valid" : "None"} />
                    <Info label="Commercial Permit" value={foundRecord.licenses.commercial ? "Valid" : "None"} />
                  </div>

                  <div className="border-t border-zinc-800/80 pt-3">
                    <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider mb-1.5">Active Warrants</div>
                    {foundRecord.warrants.map((w, idx) => (
                      <div key={idx} className="text-xs text-zinc-300 font-medium">{w}</div>
                    ))}
                    {!foundRecord.warrants.length && <div className="text-xs text-zinc-500">No active warrants recorded.</div>}
                    {foundRecord.classification && <div className="mt-2 text-xs font-medium text-zinc-300">{foundRecord.classification}</div>}
                    {foundRecord.notes && <div className="mt-1 text-xs text-zinc-400">{foundRecord.notes}</div>}
                  </div>

                  <div className="border-t border-zinc-800/80 pt-3">
                    <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Registered Vehicle</div>
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span>{foundRecord.vehicle.color} {foundRecord.vehicle.model} ({foundRecord.vehicle.plate})</span>
                      <span className="text-red-400 font-semibold">{foundRecord.vehicle.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader title="File Incident Report" icon={<FileText className="h-4 w-4 text-zinc-400" />} />
              <form onSubmit={createRecord} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Target Citizen Username</label>
                  <input required pattern="[A-Za-z0-9_]{3,20}" value={recordForm.citizenName} onChange={(event) => setRecordForm({ ...recordForm, citizenName: event.target.value })} type="text" placeholder="Username" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Offense Classification</label>
                  <select value={recordForm.classification} onChange={(event) => setRecordForm({ ...recordForm, classification: event.target.value })} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500">
                    <option>Traffic Citation</option>
                    <option>Misdemeanor Charge</option>
                    <option>Felony Arrest Warrant</option>
                    <option>BOLO / Alert</option>
                    <option>Incident Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Officer Notes</label>
                  <textarea required minLength={3} value={recordForm.notes} onChange={(event) => setRecordForm({ ...recordForm, notes: event.target.value })} placeholder="Include penal code citations..." className="h-20 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 outline-none focus:border-blue-500" />
                </div>
                <Button disabled={busy} className="w-full">{busy ? "Saving..." : "File Record"}</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "units" && (
        <Card>
          <CardHeader title="On-Duty Emergency Personnel Unit Matrix" icon={<UserCheck className="h-4 w-4 text-blue-400" />} />
          <div className="mt-4 divide-y divide-zinc-800/60 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40">
            {emergencyUnits.map((unit) => {
              const currentStatus = unitStatus[unit.id]?.status || "10-8 Available";
              return (
                <div key={unit.id} className="flex items-center justify-between p-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar player={unit} />
                    <div>
                      <div className="font-medium text-white">{unit.name}</div>
                      <div className="text-zinc-500 text-[11px]">{unit.team} • Ping: <AnimatedNumber value={unit.ping} suffix="ms" /></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {["10-8 Available", "10-97 On Scene", "10-6 Busy", "10-7 Out of Service"].map((st) => (
                      <button
                        key={st}
                        onClick={() => void handleUnitStatusChange(unit, st)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${currentStatus === st ? "bg-blue-600 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {!emergencyUnits.length && (
              <EmptyState title="No active law enforcement or EMS units" text="Units on Police or Fire/EMS teams will appear here automatically." />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function CommandCenter({ openAction, sendCommand, busy }: { openAction: (a: ModActionType) => void; sendCommand: (command: string) => void; busy: boolean }) {
  const [cmd, setCmd] = useState(":h Welcome to the server. Please follow all guidelines.");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Global Console" icon={<Terminal className="h-4 w-4 text-zinc-400" />} />
          <div className="mt-4 space-y-4">
            <textarea value={cmd} onChange={(e) => setCmd(e.target.value)} className="h-32 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-500" />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => sendCommand(cmd)}>
                <Command className="h-3.5 w-3.5" /> Dispatch Command
              </Button>
              <Button variant="secondary" onClick={() => openAction("Announcement")}>Broadcast Warning</Button>
            </div>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader title="Presets" icon={<Sparkles className="h-4 w-4 text-zinc-400" />} />
          <div className="mt-4 space-y-2">
            {commandTemplates.map((item) => (
              <button key={item.name} onClick={() => setCmd(item.command)} className="w-full rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3 text-left transition hover:bg-zinc-800/40">
                <div className="text-xs font-medium text-zinc-200">{item.name}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">{item.command}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Logs({ logs }: { logs: ModAction[] }) {
  return (
    <Card>
      <CardHeader title="System Audit Logs" icon={<ClipboardList className="h-4 w-4 text-zinc-400" />} />
      <div className="mt-4 space-y-2">
        {logs.map((log) => <LogRow key={log.id} log={log} />)}
        {!logs.length && <EmptyState title="No logs found" text="Moderation actions will log here." />}
      </div>
    </Card>
  );
}

function LogRow({ log }: { log: ModAction }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/30 p-3 text-xs">
      <div>
        <span className="font-medium text-white">{log.staff}</span> executed <span className="font-semibold text-zinc-300">{log.type}</span> on <span className="font-medium text-white">{log.player}</span>
        <div className="text-[11px] text-zinc-500 mt-0.5">{log.reason}</div>
      </div>
      <span className="text-[11px] text-zinc-600">{log.timestamp ? <LiveRelativeTime value={log.timestamp} /> : log.time}</span>
    </div>
  );
}

function StaffPermissions({ showToast }: { showToast: (m: string) => void }) {
  const all: Permission[] = ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"];
  const [matrix, setMatrix] = useState<Record<string, Permission[]>>(permissions);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<any>("/api/erlc/dashboard-config")
      .then((response) => setMatrix(response.permissions || permissions))
      .catch((error) => showToast(error instanceof Error ? error.message : "Permission sync failed."));
  }, [showToast]);

  const toggle = (role: string, permission: Permission) => {
    setMatrix((current) => {
      const existing = current[role] || [];
      return { ...current, [role]: existing.includes(permission) ? existing.filter((item) => item !== permission) : [...existing, permission] };
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      const response = await api<any>("/api/erlc/dashboard-config", { method: "PATCH", body: JSON.stringify({ permissions: matrix }) });
      setMatrix(response.permissions || matrix);
      showToast("Staff permissions saved permanently.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Permissions could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader title="Staff Authorization Matrix" icon={<ShieldCheck className="h-4 w-4 text-zinc-400" />} action={<Button disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : "Save Changes"}</Button>} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <th className="pb-3">Role</th>
              {all.map((p) => <th key={p} className="pb-3 text-center">{p}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {Object.entries(matrix).map(([role, perms]) => (
              <tr key={role}>
                <td className="py-3 font-medium text-white">{role}</td>
                {all.map((p) => (
                  <td key={p} className="py-3 text-center">
                    <input type="checkbox" checked={perms.includes(p)} onChange={() => toggle(role, p)} className="rounded border-zinc-800 bg-zinc-950 text-zinc-200 focus:ring-0" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatBotUptime(startedAt: number | null) {
  if (!startedAt) return "Offline";
  const elapsed = Math.max(0, Date.now() - startedAt);
  const days = Math.floor(elapsed / 86400000);
  const hours = Math.floor((elapsed % 86400000) / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  if (days) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatActivityName(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatEndsAt(value: number) {
  const remaining = value - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return "soon";
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  if (days) return `in ${days}d ${hours}h`;
  if (hours) return `in ${hours}h ${minutes}m`;
  return `in ${Math.max(1, minutes)}m`;
}

function VeltrixBotDashboard({ showToast, mode = "overview" }: { showToast: (m: string) => void; mode?: "overview" | "staff" }) {
  const [data, setData] = useState<VeltrixDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [shiftUserId, setShiftUserId] = useState("");
  const [shiftReason, setShiftReason] = useState("");
  const [shiftAction, setShiftAction] = useState<"start" | "end" | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [staffTimeframe, setStaffTimeframe] = useState<"all" | "7d" | "30d">("all");

  const load = useCallback(async (notify = false) => {
    if (notify) setRefreshing(true);
    try {
      const next = await api<VeltrixDashboardData>("/api/erlc/bot-dashboard/veltrix");
      setData(next);
      setError("");
      if (notify) showToast("Veltrix dashboard refreshed.");
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Veltrix data could not be loaded.";
      setError(message);
      if (notify) showToast(message);
    } finally {
      setLoading(false);
      if (notify) setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const runShiftAction = async (action: "start" | "end", targetUserId?: string) => {
    const userId = (targetUserId || shiftUserId).trim();
    if (!/^\d{17,20}$/.test(userId)) {
      showToast("Enter or select a valid Discord user ID.");
      return;
    }
    setShiftAction(action);
    try {
      await api(`/api/erlc/bot-dashboard/veltrix/shifts/${action}`, {
        method: "POST",
        body: JSON.stringify({ userId, reason: shiftReason.trim() || undefined }),
      });
      showToast(action === "start" ? "Shift started and logged." : "Shift ended, scored, and logged.");
      setShiftUserId("");
      setShiftReason("");
      await load();
    } catch (actionError) {
      showToast(actionError instanceof Error ? actionError.message : "Shift action failed.");
    } finally {
      setShiftAction(null);
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <div className="flex min-h-72 items-center justify-center gap-3 text-xs text-zinc-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading Veltrix telemetry...
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <EmptyState title="Veltrix telemetry unavailable" text={error || "The dashboard API did not return bot data."} />
        <div className="flex justify-center"><Button variant="secondary" onClick={() => void load(true)}>Retry</Button></div>
      </Card>
    );
  }

  const operationalSystems = data.systems.filter((system) => system.healthy).length;
  const userName = (userId: string | null | undefined) => userId ? (data.users[userId]?.name || `User ${userId.slice(-4)}`) : "Dashboard Admin";
  const matchesStaffFilter = (userId: string | null | undefined) => {
    if (!userId) return staffFilter === "all";
    const search = staffSearch.trim().toLowerCase();
    return (staffFilter === "all" || staffFilter === userId) && (!search || userName(userId).toLowerCase().includes(search) || userId.includes(search));
  };
  const inStaffTimeframe = (timestamp: number) => staffTimeframe === "all" || Date.now() - timestamp <= (staffTimeframe === "7d" ? 7 : 30) * 86400000;
  const visibleActiveShifts = data.activeShifts.filter((shift) => matchesStaffFilter(shift.userId));
  const visibleShiftHistory = data.shiftHistory.filter((shift) => matchesStaffFilter(shift.userId) && inStaffTimeframe(shift.endedAt));
  const visibleWarnings = data.warningHistory.filter((warning) => matchesStaffFilter(warning.userId) && inStaffTimeframe(warning.createdAt));
  const visibleStrikes = data.strikeHistory.filter((strike) => matchesStaffFilter(strike.userId) && inStaffTimeframe(strike.createdAt));
  const visibleModeration = data.moderationHistory.filter((item) => matchesStaffFilter(item.userId) && inStaffTimeframe(item.createdAt));
  const visibleProfiles = data.staffProfiles.filter((profile) => matchesStaffFilter(profile.userId));

  if (mode === "staff") {
    const discipline = [
      ...visibleWarnings.map((item) => ({ ...item, kind: "Warning" as const, points: null, issuerId: item.moderatorId })),
      ...visibleStrikes.map((item) => ({ ...item, kind: "Strike" as const, issuerId: item.issuedBy })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,.24),transparent_34%),linear-gradient(135deg,rgba(24,24,27,.98),rgba(9,9,11,.98))] p-6 shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 shadow-lg shadow-indigo-500/10"><ShieldCheck className="h-8 w-8 text-indigo-300" /><span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-indigo-400 ring-4 ring-zinc-950"><Zap className="h-3 w-3 fill-zinc-950 text-zinc-950" /></span></div>
              <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Staff Operations Command</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live Matrix</span></div><p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-400">Manage duty shifts, performance, discipline, and staff audit intelligence through Veltrix's persistent operations database.</p></div>
            </div>
            <Button variant="secondary" disabled={refreshing} onClick={() => void load(true)}><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Synchronizing..." : "Sync Staff Data"}</Button>
          </div>
          <div className="relative mt-6 grid gap-2 border-t border-white/10 pt-5 md:grid-cols-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" /><input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Search staff name or Discord ID" className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-9 pr-3 text-xs text-zinc-200 outline-none backdrop-blur focus:border-indigo-400/50" /></div>
            <select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-zinc-300 outline-none focus:border-indigo-400/50"><option value="all">All staff members</option>{data.staffProfiles.map((profile) => <option key={profile.userId} value={profile.userId}>{userName(profile.userId)}</option>)}</select>
            <select value={staffTimeframe} onChange={(event) => setStaffTimeframe(event.target.value as "all" | "7d" | "30d")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-zinc-300 outline-none focus:border-indigo-400/50"><option value="all">Timeframe: All Time</option><option value="7d">Timeframe: Past 7 Days</option><option value="30d">Timeframe: Past 30 Days</option></select>
          </div>
        </section>

        {error && <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">{error}</div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active Duty", value: data.summary.staffOnDuty, detail: "Staff clocked in now", icon: Radio, color: "indigo" },
            { label: "Completed Shifts", value: data.staffProfiles.reduce((sum, profile) => sum + profile.completedShifts, 0), detail: "Persistent all-time history", icon: Clock3, color: "cyan" },
            { label: "Active Infractions", value: data.summary.activeWarnings + data.summary.activeStrikes, detail: `${data.summary.activeWarnings} warnings / ${data.summary.activeStrikes} strikes`, icon: ShieldAlert, color: "amber" },
            { label: "Staff Profiles", value: data.summary.staffProfiles, detail: `${data.summary.pendingLeaveRequests} pending leave requests`, icon: Users, color: "emerald" },
          ].map((stat, index) => {
            const Icon = stat.icon;
            const colors: Record<string, string> = { indigo: "border-indigo-400/20 bg-indigo-500/5 text-indigo-300", cyan: "border-cyan-400/20 bg-cyan-500/5 text-cyan-300", amber: "border-amber-400/20 bg-amber-500/5 text-amber-300", emerald: "border-emerald-400/20 bg-emerald-500/5 text-emerald-300" };
            return <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className={`rounded-2xl border p-5 shadow-lg ${colors[stat.color]}`}><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-80">{stat.label}</span><Icon className="h-4 w-4" /></div><div className="mt-4 text-3xl font-black tracking-tight text-white"><AnimatedNumber value={stat.value} /></div><p className="mt-1 text-[10px] text-zinc-500">{stat.detail}</p></motion.div>;
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4"><div className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-500/10"><Terminal className="h-5 w-5 text-indigo-300" /></div><div><h2 className="text-sm font-bold text-white">Shift Control Terminal</h2><p className="text-[10px] text-zinc-500">Persistent management override</p></div></div>
            <div className="mt-4 space-y-3"><div><label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Staff profile</label><select value={shiftUserId} onChange={(event) => setShiftUserId(event.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-300 outline-none focus:border-indigo-500/50"><option value="">Select staff member</option>{data.staffProfiles.map((profile) => <option key={profile.userId} value={profile.userId}>{userName(profile.userId)} - {profile.userId}</option>)}</select></div><div><label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Discord user ID</label><input value={shiftUserId} onChange={(event) => setShiftUserId(event.target.value.replace(/\D/g, "").slice(0, 20))} inputMode="numeric" placeholder="805501165981794305" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 font-mono text-xs text-zinc-300 outline-none focus:border-indigo-500/50" /></div><div><label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Management note</label><input value={shiftReason} onChange={(event) => setShiftReason(event.target.value.slice(0, 240))} placeholder="Optional shift reason" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-300 outline-none focus:border-indigo-500/50" /></div><div className="grid grid-cols-2 gap-2 pt-1"><button disabled={shiftAction !== null} onClick={() => void runShiftAction("start")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"><Play className="h-3.5 w-3.5" />{shiftAction === "start" ? "Starting" : "Start Shift"}</button><button disabled={shiftAction !== null} onClick={() => void runShiftAction("end")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 text-xs font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"><Square className="h-3.5 w-3.5" />{shiftAction === "end" ? "Ending" : "End Shift"}</button></div></div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4"><div><h2 className="flex items-center gap-2 text-sm font-bold text-white"><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>Active Shift Operations</h2><p className="mt-1 text-[10px] text-zinc-500">Live duty telemetry updates automatically</p></div><span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-bold text-indigo-300">{visibleActiveShifts.length} ACTIVE</span></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">{visibleActiveShifts.length === 0 ? <div className="md:col-span-2"><EmptyState title="No active shifts found" text="Start a shift from the control terminal or change your filters." /></div> : visibleActiveShifts.map((shift) => <div key={shift.userId} className="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-indigo-400/35"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{data.users[shift.userId]?.avatarUrl ? <img src={data.users[shift.userId].avatarUrl || ""} alt="" className="h-10 w-10 rounded-xl border border-indigo-400/20 object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 font-bold text-indigo-300">{userName(shift.userId).charAt(0)}</div>}<div className="min-w-0"><div className="truncate text-xs font-bold text-white">{userName(shift.userId)}</div><div className="truncate font-mono text-[9px] text-zinc-600">{shift.userId}</div></div></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">ON DUTY</span></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-zinc-900/70 p-3 text-center"><div><div className="text-[9px] uppercase text-zinc-600">Duration</div><div className="mt-1 font-mono text-xs font-bold text-indigo-300"><LiveShiftDuration startedAt={shift.startedAt} /></div></div><div><div className="text-[9px] uppercase text-zinc-600">Performance</div><div className="mt-1 text-xs font-bold text-zinc-300">{shift.points} pts / {shift.completedShifts} shifts</div></div></div><button disabled={shiftAction !== null} onClick={() => void runShiftAction("end", shift.userId)} className="mt-3 w-full rounded-lg border border-red-400/20 bg-red-400/5 py-2 text-[10px] font-bold text-red-300 transition hover:bg-red-400/15">Force End Shift</button></div>)}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4"><div><h2 className="text-sm font-bold text-white">Staff Performance Database</h2><p className="mt-1 text-[10px] text-zinc-500">Points, completed shifts, total duty time, and last activity</p></div><span className="text-[10px] font-bold text-cyan-300">{visibleProfiles.length} PROFILES</span></div>
          {visibleProfiles.length === 0 ? <EmptyState title="No profiles found" text="No staff profiles match the current command filters." /> : <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60"><table className="w-full min-w-[700px] text-left text-xs"><thead className="border-b border-zinc-800 bg-zinc-900/80 text-[9px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Staff identity</th><th className="px-4 py-3">Points</th><th className="px-4 py-3">Shifts</th><th className="px-4 py-3">Total duty</th><th className="px-4 py-3">Last active</th></tr></thead><tbody className="divide-y divide-zinc-800/70">{visibleProfiles.map((profile) => <tr key={profile.userId} className="transition hover:bg-zinc-900/70"><td className="px-4 py-3"><div className="font-bold text-zinc-200">{userName(profile.userId)}</div><div className="font-mono text-[9px] text-zinc-600">{profile.userId}</div></td><td className="px-4 py-3 font-black text-amber-300">{profile.points}</td><td className="px-4 py-3 font-bold text-zinc-300">{profile.completedShifts}</td><td className="px-4 py-3 font-mono text-indigo-300">{formatShiftDuration(profile.totalMs)}</td><td className="px-4 py-3 text-zinc-500">{profile.lastStart ? <LiveRelativeTime value={profile.lastStart} /> : "Never"}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 shadow-xl"><div className="flex items-center justify-between border-b border-zinc-800 pb-4"><h2 className="flex items-center gap-2 text-sm font-bold text-white"><ShieldAlert className="h-4 w-4 text-amber-400" />Disciplinary Intelligence</h2><span className="text-[10px] text-zinc-500">{discipline.length} records</span></div><div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">{discipline.length === 0 ? <EmptyState title="No discipline records" text="Warnings and strikes matching your filters will appear here." /> : discipline.map((item) => <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${item.kind === "Strike" ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-300"}`}>{item.kind}</span><span className="text-xs font-bold text-zinc-200">{userName(item.userId)}</span></div><span className={`h-2 w-2 rounded-full ${item.active ? "bg-emerald-400" : "bg-zinc-700"}`} /></div><p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{item.reason}</p><div className="mt-2 border-t border-zinc-800 pt-2 text-[9px] text-zinc-600">Issued by {userName(item.issuerId)} - <LiveRelativeTime value={item.createdAt} /></div></div>)}</div></div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 shadow-xl"><div className="flex items-center justify-between border-b border-zinc-800 pb-4"><h2 className="flex items-center gap-2 text-sm font-bold text-white"><Activity className="h-4 w-4 text-violet-400" />Operations Audit Feed</h2><span className="text-[10px] text-zinc-500">Persistent events</span></div><div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">{data.recentStaffActivity.length === 0 ? <EmptyState title="No audit events" text="Veltrix staff actions will appear here automatically." /> : data.recentStaffActivity.filter((item) => matchesStaffFilter(item.actorId) || matchesStaffFilter(item.targetId)).map((activity) => <div key={activity.id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><div className="min-w-0"><div className="truncate text-xs font-bold text-zinc-200">{formatActivityName(activity.action)}</div><div className="mt-1 truncate text-[9px] text-zinc-600">{userName(activity.actorId)}{activity.targetId ? ` on ${userName(activity.targetId)}` : ""}</div></div><span className="shrink-0 text-[9px] text-zinc-600"><LiveRelativeTime value={activity.createdAt} /></span></div>)}</div></div>
        </section>
      </div>
    );
  }
  const stats: Array<{ label: string; value: number | null; detail: React.ReactNode; icon: React.ComponentType<{ className?: string }>; liveUptime?: boolean; suffix?: string }> = [
    { label: "Uptime", value: data.bot.uptime, liveUptime: true, detail: <><AnimatedNumber value={data.bot.restarts} /> lifetime restarts</>, icon: Activity },
    { label: "Memory", value: data.bot.memoryMb, suffix: " MB", detail: <><AnimatedNumber value={data.bot.cpu} decimals={1} suffix="%" /> CPU</>, icon: Cpu },
    { label: "Staff On Duty", value: data.summary.staffOnDuty, detail: <><AnimatedNumber value={data.summary.staffProfiles} /> staff profiles</>, icon: UserCheck },
    { label: "Active Sessions", value: data.summary.activeSessions, detail: <><AnimatedNumber value={data.summary.activeGiveaways} /> live giveaways</>, icon: Radio },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/30 shadow-sm backdrop-blur-xl">
        <div className="relative p-6 sm:p-7">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300 shadow-inner">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Veltrix Operations</h1>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${data.bot.online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300"}`}>
                    <span className="relative flex h-1.5 w-1.5">
                      {data.bot.online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />}
                      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${data.bot.online ? "bg-emerald-400" : "bg-red-400"}`} />
                    </span>
                    {data.bot.online ? "Online" : data.bot.status}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">Live bot health, persistent systems, giveaways, sessions, and database telemetry.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">Last synchronized</div>
                <div className="mt-0.5 text-xs text-zinc-300"><LiveRelativeTime value={data.updatedAt} /></div>
              </div>
              <Button variant="secondary" disabled={refreshing} onClick={() => void load(true)}><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> {refreshing ? "Syncing" : "Refresh"}</Button>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700"
            >
              <div className="relative flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <div className="relative mt-3 whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight text-white">{stat.liveUptime ? <LiveUptime startedAt={stat.value} /> : <AnimatedNumber value={stat.value || 0} suffix={stat.suffix} />}</div>
              <div className="relative mt-1 text-[11px] text-zinc-500">{stat.detail}</div>
              <div className="relative mt-3 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" /><span className="relative h-1.5 w-1.5 rounded-full bg-blue-400" /></span>
                Live telemetry
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-zinc-800">
                <motion.div
                  className="h-full origin-left bg-blue-400/80 will-change-transform"
                  animate={{ scaleX: [0, 1], opacity: [0.35, 0.9] }}
                  transition={{ duration: 5, repeat: Infinity, delay: index * 0.15, ease: "linear" }}
                />
              </div>
            </motion.div>
          );
        })}
      </section>

      {(mode as string) === "overview" && (<section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader title="System Health" icon={<Activity className="h-4 w-4 text-emerald-400" />} action={<span className="text-[10px] font-medium text-zinc-500"><AnimatedNumber value={operationalSystems} />/<AnimatedNumber value={data.systems.length} /> operational</span>} />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.systems.map((system) => (
              <div key={system.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
                <span className="text-xs font-medium text-zinc-300">{system.name}</span>
                <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase ${system.healthy ? "text-emerald-400" : "text-red-400"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${system.healthy ? "bg-emerald-400" : "bg-red-400"}`} /> {system.healthy ? "Ready" : "Issue"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Persistent Data" icon={<Database className="h-4 w-4 text-blue-400" />} action={<span className={`text-[10px] font-semibold uppercase ${data.database.integrity === "ok" ? "text-emerald-400" : "text-amber-400"}`}>{data.database.integrity}</span>} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Moderation cases", value: data.summary.moderationCases },
              { label: "Active warnings", value: data.summary.activeWarnings },
              { label: "Verified members", value: data.summary.verifiedMembers },
              { label: "Active strikes", value: data.summary.activeStrikes },
              { label: "Pending LOAs", value: data.summary.pendingLeaveRequests },
              { label: "Database", value: Math.max(0.1, data.database.sizeBytes / 1024 / 1024), decimals: 1, suffix: " MB" },
            ].map(({ label, value, decimals, suffix }) => (
              <div key={label} className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                <div className="text-lg font-semibold text-zinc-100"><AnimatedNumber value={value} decimals={decimals} suffix={suffix} /></div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>)}

      {(mode as string) === "staff" && (<>
      <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-zinc-950 via-indigo-950/25 to-zinc-950 p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-indigo-400" /> Staff Command Matrix</div><p className="mt-1 text-[11px] text-zinc-500">Filter every live shift, profile, warning, strike, and moderation record from one place.</p></div>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-3xl">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" /><input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Search staff or Discord ID" className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2.5 pl-9 pr-3 text-xs text-zinc-200 outline-none transition focus:border-indigo-500/60" /></div>
            <select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-xs text-zinc-300 outline-none transition focus:border-indigo-500/60"><option value="all">All staff members</option>{data.staffProfiles.map((profile) => <option key={profile.userId} value={profile.userId}>{userName(profile.userId)}</option>)}</select>
            <select value={staffTimeframe} onChange={(event) => setStaffTimeframe(event.target.value as "all" | "7d" | "30d")} className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-xs text-zinc-300 outline-none transition focus:border-indigo-500/60"><option value="all">All-time records</option><option value="7d">Past 7 days</option><option value="30d">Past 30 days</option></select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <Card>
          <CardHeader title="Shift Control" icon={<Clock3 className="h-4 w-4 text-blue-400" />} action={<span className="text-[10px] uppercase tracking-wider text-zinc-600">Staff Operations V2</span>} />
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Staff member</label>
              <select value={shiftUserId} onChange={(event) => setShiftUserId(event.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 outline-none transition focus:border-blue-500">
                <option value="">Select a known staff profile</option>
                {data.staffProfiles.map((profile) => <option key={profile.userId} value={profile.userId}>{userName(profile.userId)} — {profile.userId}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Discord user ID</label>
              <input value={shiftUserId} onChange={(event) => setShiftUserId(event.target.value.replace(/\D/g, "").slice(0, 20))} inputMode="numeric" placeholder="805501165981794305" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-200 outline-none transition focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Reason / note</label>
              <input value={shiftReason} onChange={(event) => setShiftReason(event.target.value.slice(0, 240))} placeholder="Optional management note" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 outline-none transition focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button disabled={shiftAction !== null} onClick={() => void runShiftAction("start")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-50"><Play className="h-3.5 w-3.5" /> {shiftAction === "start" ? "Starting..." : "Start Shift"}</button>
              <button disabled={shiftAction !== null} onClick={() => void runShiftAction("end")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-400/15 disabled:opacity-50"><Square className="h-3.5 w-3.5" /> {shiftAction === "end" ? "Ending..." : "End Shift"}</button>
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-600">Shift state, points, duration, history, and audit records are saved directly to Veltrix and survive every restart.</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Active Duty Roster" icon={<UserCheck className="h-4 w-4 text-emerald-400" />} action={<span className="rounded-md border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300"><AnimatedNumber value={visibleActiveShifts.length} /> shown</span>} />
          <div className="mt-4 space-y-2">
            {visibleActiveShifts.length === 0 ? <EmptyState title="No active shifts found" text="Start a shift or change the staff filters above." /> : visibleActiveShifts.map((shift) => (
              <div key={`${shift.guildId}-${shift.userId}`} className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {data.users[shift.userId]?.avatarUrl ? <img src={data.users[shift.userId].avatarUrl || ""} alt="" className="h-9 w-9 rounded-full border border-zinc-700 object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300">{userName(shift.userId).charAt(0).toUpperCase()}</div>}
                  <div className="min-w-0"><div className="truncate text-xs font-semibold text-white">{userName(shift.userId)}</div><div className="mt-0.5 font-mono text-[9px] text-zinc-600">{shift.userId}</div></div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right"><div className="font-mono text-sm font-semibold tabular-nums text-emerald-300"><LiveShiftDuration startedAt={shift.startedAt} /></div><div className="text-[9px] uppercase tracking-wider text-zinc-600">live duration</div></div>
                  <button disabled={shiftAction !== null} onClick={() => void runShiftAction("end", shift.userId)} className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-[10px] font-semibold text-red-300 transition hover:bg-red-400/15 disabled:opacity-50">End</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Shift History" icon={<Clock3 className="h-4 w-4 text-blue-400" />} action={<span className="text-[10px] text-zinc-600">{visibleShiftHistory.length} records</span>} />
          <div className="mt-4 divide-y divide-zinc-800/70">
            {visibleShiftHistory.length === 0 ? <EmptyState title="No completed shifts found" text="Completed shifts matching your filters will appear here." /> : visibleShiftHistory.slice(0, 8).map((shift) => (
              <div key={shift.id} className="py-2.5 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-zinc-300">{userName(shift.userId)}</span><span className="shrink-0 font-mono text-[10px] text-blue-300">{formatShiftDuration(shift.durationMs)}</span></div><div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-zinc-600"><span className="truncate">{shift.reason || `Ended by ${userName(shift.endedBy)}`}</span><span className="shrink-0">+{shift.points} pts</span></div></div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Warnings & Strikes" icon={<ShieldAlert className="h-4 w-4 text-amber-400" />} action={<span className="text-[10px] text-zinc-600">Persistent discipline</span>} />
          <div className="mt-4 space-y-2">
            {[...visibleWarnings.map((item) => ({ ...item, kind: "Warning", points: null })), ...visibleStrikes.map((item) => ({ ...item, kind: "Strike", moderatorId: item.issuedBy }))].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8).map((item) => (
              <div key={`${item.kind}-${item.id}`} className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${item.active ? "bg-amber-400/10 text-amber-300" : "bg-zinc-800 text-zinc-500"}`}>{item.kind}</span><span className="truncate text-xs font-medium text-zinc-300">{userName(item.userId)}</span></div><p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-zinc-500">{item.reason}</p></div>{item.points !== null && <span className="shrink-0 text-[10px] font-semibold text-red-300">{item.points} pts</span>}</div><div className="mt-2 text-[9px] text-zinc-700">By {userName(item.moderatorId)} · <LiveRelativeTime value={item.createdAt} /></div></div>
            ))}
            {visibleWarnings.length + visibleStrikes.length === 0 && <EmptyState title="No discipline records found" text="Warnings and staff strikes matching your filters will appear here." />}
          </div>
        </Card>

        <Card>
          <CardHeader title="Moderation Log" icon={<ClipboardList className="h-4 w-4 text-violet-400" />} action={<span className="text-[10px] text-zinc-600">All actions</span>} />
          <div className="mt-4 divide-y divide-zinc-800/70">
            {visibleModeration.length === 0 ? <EmptyState title="No moderation cases found" text="Warns, kicks, bans, and other matching actions will show here." /> : visibleModeration.slice(0, 9).map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-zinc-300">{item.action} · {userName(item.userId)}</span><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.active && !item.removed ? "bg-emerald-400" : "bg-zinc-700"}`} /></div><div className="mt-1 truncate text-[10px] text-zinc-600">{item.reason} · {userName(item.moderatorId)}</div></div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Staff Roster & Performance" icon={<Users className="h-4 w-4 text-cyan-400" />} action={<span className="rounded-md border border-cyan-400/15 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-300">{visibleProfiles.length} profiles</span>} />
        {visibleProfiles.length === 0 ? <EmptyState title="No staff profiles found" text="Change the staff filters to view additional profiles." /> : <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50"><table className="w-full min-w-[680px] text-left text-xs"><thead className="border-b border-zinc-800 bg-zinc-900/80 text-[9px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Staff identity</th><th className="px-4 py-3">Points</th><th className="px-4 py-3">Completed shifts</th><th className="px-4 py-3">Total duty time</th><th className="px-4 py-3">Last active</th></tr></thead><tbody className="divide-y divide-zinc-800/70">{visibleProfiles.map((profile) => <tr key={profile.userId} className="transition hover:bg-zinc-900/60"><td className="px-4 py-3"><div className="flex items-center gap-2.5">{data.users[profile.userId]?.avatarUrl ? <img src={data.users[profile.userId].avatarUrl || ""} alt="" className="h-7 w-7 rounded-lg border border-zinc-700 object-cover" /> : <div className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-[10px] font-bold text-cyan-300">{userName(profile.userId).charAt(0).toUpperCase()}</div>}<div><div className="font-semibold text-zinc-200">{userName(profile.userId)}</div><div className="font-mono text-[9px] text-zinc-600">{profile.userId}</div></div></div></td><td className="px-4 py-3 font-semibold text-amber-300">{profile.points}</td><td className="px-4 py-3 text-zinc-300">{profile.completedShifts}</td><td className="px-4 py-3 font-mono text-indigo-300">{formatShiftDuration(profile.totalMs)}</td><td className="px-4 py-3 text-zinc-500">{profile.lastStart ? <LiveRelativeTime value={profile.lastStart} /> : "Never"}</td></tr>)}</tbody></table></div>}
      </Card>
      </>)}

      <section className="grid gap-6 xl:grid-cols-2">
        {(mode as string) === "overview" && <Card>
          <CardHeader title="Active Giveaways" icon={<Sparkles className="h-4 w-4 text-violet-400" />} action={<span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400"><AnimatedNumber value={data.giveaways.length} /> live</span>} />
          <div className="mt-4 space-y-2">
            {data.giveaways.length === 0 ? <EmptyState title="No active giveaways" text="New Veltrix giveaways will appear here automatically." /> : data.giveaways.map((giveaway) => (
              <div key={giveaway.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-xs font-semibold text-white">{giveaway.prize}</div><div className="mt-1 text-[11px] text-zinc-500">Hosted by {giveaway.hostName} • {giveaway.winnerCount} winner{giveaway.winnerCount === 1 ? "" : "s"}</div></div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">{giveaway.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 text-[10px] text-zinc-500"><span><AnimatedNumber value={giveaway.entries.users} /> entered</span><span>Ends <LiveEndsAt value={giveaway.endTime} /></span></div>
              </div>
            ))}
          </div>
        </Card>}

        {(mode as string) === "staff" && <Card>
          <CardHeader title="Staff Operations Activity" icon={<ShieldCheck className="h-4 w-4 text-blue-400" />} action={<span className="text-[10px] text-zinc-600">Persistent audit trail</span>} />
          <div className="mt-4 divide-y divide-zinc-800/70">
            {data.recentStaffActivity.length === 0 ? <EmptyState title="No staff activity yet" text="Shift, quota, strike, and LOA actions will be recorded here." /> : data.recentStaffActivity.slice(0, 7).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0"><div className="truncate text-xs font-medium text-zinc-300">{formatActivityName(activity.action)}</div><div className="mt-0.5 truncate text-[10px] text-zinc-600">Actor {activity.actorId}{activity.targetId ? ` • Target ${activity.targetId}` : ""}</div></div>
                <span className="shrink-0 text-[10px] text-zinc-600"><LiveRelativeTime value={activity.createdAt} /></span>
              </div>
            ))}
          </div>
        </Card>}
      </section>
    </div>
  );
}

function SettingsPage({ showToast }: { showToast: (m: string) => void }) {
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const isWindows = typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);

  useEffect(() => {
    api<{ count: number }>("/api/auth/passkeys/status").then((status) => setPasskeyCount(status.count)).catch(() => undefined);
  }, []);

  const addPasskey = async () => {
    if (!browserSupportsWebAuthn()) return showToast("This browser does not support Face ID or passkeys.");
    setPasskeyBusy(true);
    try {
      const optionsJSON = await api<any>("/api/auth/passkeys/register/options", { method: "POST" });
      const credential = await startRegistration({ optionsJSON });
      await api("/api/auth/passkeys/register/verify", { method: "POST", body: JSON.stringify(credential) });
      const status = await api<{ count: number }>("/api/auth/passkeys/status");
      setPasskeyCount(status.count);
      showToast("Face ID / passkey added successfully.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Passkey setup was cancelled.");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("prestonhq_token");
    sessionStorage.removeItem("prestonhq_token");
    window.location.reload();
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <ShopPageHeader tone="zinc" eyebrow="Security" title="Account" description="Manage secure access to Akron Tire Shop." />
      <section className="shop-card mobile-surface overflow-hidden rounded-2xl border border-[#252b27] bg-[#121613]">
        <div className="border-b border-[#252b27] px-5 py-4 sm:px-6"><div className="text-[15px] font-semibold text-white">Sign-in security</div><div className="mt-1 text-xs text-zinc-500">Control how you securely access shop records.</div></div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 rounded-xl border border-[#29332c] bg-[#0f1511] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3.5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/15 bg-emerald-500/[.07]"><KeyRound className="h-[18px] w-[18px] text-emerald-300" /></div><div><div className="text-sm font-medium text-white">Passkey access</div><div className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">Use Windows Hello on your PC or Face ID on your iPhone. Your regular shop passcode will still work.</div><div className="mt-2 text-[10px] font-medium text-emerald-400">{passkeyCount} passkey{passkeyCount === 1 ? "" : "s"} registered</div></div></div>
            <button disabled={passkeyBusy} onClick={() => void addPasskey()} className="min-h-11 shrink-0 rounded-xl bg-emerald-400 px-4 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-40">{passkeyBusy ? "Waiting for Windows..." : isWindows ? "Set Up Windows PIN" : passkeyCount > 0 ? "Add Another Passkey" : "Add a Passkey"}</button>
          </div>
        </div>
      </section>
      <section className="shop-card mobile-surface flex flex-col gap-4 rounded-2xl border border-[#252b27] bg-[#121613] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><div className="text-sm font-semibold text-white">End this session</div><div className="mt-1 text-xs text-zinc-500">You will need your passkey or shop passcode to sign back in.</div></div><button onClick={signOut} className="mobile-tap min-h-11 rounded-xl border border-red-500/20 px-4 text-xs font-semibold text-red-400 transition hover:bg-red-500/10">Sign Out</button></section>
    </div>
  );
}

const tireFieldClass = "w-full min-h-11 rounded-xl border border-white/[.08] bg-black/30 px-3.5 py-2.5 text-sm font-medium text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function tireRimSize(size: string) {
  return size.toUpperCase().match(/(?:R|\/)(\d{2})\s*$/)?.[1] || "Other";
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function tirePackageLabel(value?: string, plural = false) {
  if (value === "set4") return plural ? "sets of 4" : "Set of 4";
  if (value === "pair") return plural ? "pairs" : "Pair (2)";
  return plural ? "individual tires" : "Individual";
}

function tirePackageClass(value?: string) {
  if (value === "set4") return "border-violet-500/25 bg-violet-500/10 text-violet-300";
  if (value === "pair") return "border-blue-500/25 bg-blue-500/10 text-blue-300";
  return "border-zinc-700 bg-zinc-800/60 text-zinc-400";
}

function workTypeLabel(value?: string) {
  if (value === "mount") return "Mount & Balance";
  if (value === "plug") return "Plug";
  if (value === "rotation") return "Rotation";
  if (value === "brakes") return "Brakes";
  return "Tire Sale";
}

const workTypeOptions = [
  { value: "tire", label: "Tire Sale", icon: Package },
  { value: "mount", label: "Mount & Balance", icon: Settings },
  { value: "plug", label: "Plug", icon: Zap },
  { value: "rotation", label: "Rotation", icon: RefreshCw },
  { value: "brakes", label: "Brakes", icon: ShieldAlert },
];

function easternDateKey(value: string | number | Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function shiftMonthKey(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftDateKey(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + amount));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

function dateKeyLabel(dateKey: string, todayKey = easternDateKey(new Date())) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const formatted = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (dateKey === todayKey) return `Today · ${formatted}`;
  if (dateKey === shiftDateKey(todayKey, -1)) return `Yesterday · ${formatted}`;
  return formatted;
}

function monthKeyLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
}

function paymentMethodTotal(sales: TireSale[], method: string) {
  return sales
    .filter((sale) => String(sale.paymentMethod || "").toLowerCase() === method.toLowerCase())
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0);
}

function cardPaymentTotal(sales: TireSale[]) {
  return paymentMethodTotal(sales, "Cashapp") + paymentMethodTotal(sales, "Chime");
}

function physicalTireCount(sales: TireSale[]) {
  return sales.reduce((sum, sale) => {
    if ((sale.serviceType || "tire") !== "tire") return sum;
    return sum + Number(sale.quantity || 0);
  }, 0);
}

function printEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildReceiptImage(sale: TireSale): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("Receipt image could not be created.")); return; }
    const isTire = (sale.serviceType || "tire") === "tire";
    const number = sale.id.replaceAll("-", "").slice(0, 10).toUpperCase();
    const date = new Date(sale.soldAt).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
    const time = new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
    const write = (text: string, x: number, y: number, font: string, color = "#111111", align: CanvasTextAlign = "left") => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y); };
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = "#10b981"; ctx.fillRect(0, 0, 1080, 20);
    ctx.fillStyle = "#111111"; ctx.fillRect(60, 70, 960, 220);
    write("AKRON", 104, 125, "900 24px Arial", "#6ee7b7");
    write("TIRE SHOP", 100, 190, "900 60px Arial", "#ffffff");
    write("TIRES  •  SALES  •  SERVICE", 104, 235, "700 17px Arial", "#a3a3a3");
    write("CUSTOMER RECEIPT", 972, 130, "300 28px Arial", "#d4d4d4", "right");
    write(`#${number}`, 972, 175, "700 20px monospace", "#ffffff", "right");
    ctx.fillStyle = "#10b981"; ctx.fillRect(810, 210, 162, 42);
    write("PAID IN FULL", 948, 238, "900 16px Arial", "#052e22", "right");
    ctx.fillStyle = "#f5f5f4"; ctx.fillRect(60, 330, 960, 190);
    write("CUSTOMER", 100, 382, "800 17px Arial", "#737373");
    write(sale.customer || "Walk-in customer", 100, 425, "800 30px Arial");
    write("DATE / TIME", 650, 382, "800 17px Arial", "#737373");
    write(date, 650, 420, "700 20px Arial");
    write(time, 650, 452, "500 18px Arial", "#737373");
    write("PAYMENT", 100, 482, "800 17px Arial", "#737373");
    write(sale.paymentMethod, 220, 482, "800 19px Arial");
    ctx.fillStyle = "#111111"; ctx.fillRect(60, 570, 960, 62);
    write("DESCRIPTION", 100, 610, "800 16px Arial", "#ffffff");
    write("QTY", 780, 610, "800 16px Arial", "#ffffff", "center");
    write("AMOUNT", 980, 610, "800 16px Arial", "#ffffff", "right");
    ctx.strokeStyle = "#d4d4d4"; ctx.strokeRect(60, 632, 960, 190);
    write(isTire ? sale.size : workTypeLabel(sale.serviceType), 100, 715, `900 36px ${isTire ? "monospace" : "Arial"}`);
    write(isTire ? tirePackageLabel(sale.packageType) : "Automotive service", 100, 756, "600 19px Arial", "#737373");
    write(String(sale.quantity), 780, 725, "800 27px monospace", "#111111", "center");
    write(money(sale.total), 980, 725, "900 30px monospace", "#111111", "right");
    if (sale.notes) { write("WORK NOTES", 80, 885, "800 17px Arial", "#737373"); write(sale.notes.slice(0, 90), 80, 925, "500 20px Arial"); }
    ctx.fillStyle = "#111111"; ctx.fillRect(560, 1010, 460, 170);
    write("TOTAL PAID", 602, 1070, "800 18px Arial", "#a3a3a3");
    write(money(sale.total), 978, 1135, "900 48px monospace", "#6ee7b7", "right");
    ctx.strokeStyle = "#d4d4d4"; ctx.beginPath(); ctx.moveTo(60, 1280); ctx.lineTo(1020, 1280); ctx.stroke();
    write("Thank you for your business.", 60, 1335, "800 24px Arial");
    write("Akron Tire Shop", 60, 1375, "500 17px Arial", "#737373");
    write(number, 1020, 1375, "600 16px monospace", "#a3a3a3", "right");
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Receipt image could not be saved.")), "image/png", 1);
  });
}

function printSaleReceipt(sale: TireSale, onBlocked: () => void) {
  const receiptWindow = window.open("about:blank", "akron-tire-receipt");
  if (!receiptWindow) {
    onBlocked();
    return;
  }
  const isTire = (sale.serviceType || "tire") === "tire";
  const workName = isTire ? "Tire Sale" : workTypeLabel(sale.serviceType);
  const receiptNumber = sale.id.replaceAll("-", "").slice(0, 10).toUpperCase();
  const soldDate = new Date(sale.soldAt).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
  const soldTime = new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const itemDetails = isTire
    ? `<tr><td><strong>${printEscape(sale.size)}</strong><span>${printEscape(tirePackageLabel(sale.packageType))}</span></td><td>${sale.quantity}</td><td>${printEscape(money(sale.total))}</td></tr>`
    : `<tr><td><strong>${printEscape(workTypeLabel(sale.serviceType))}</strong><span>Automotive service</span></td><td>${sale.quantity}</td><td>${printEscape(money(sale.total))}</td></tr>`;
  receiptWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Akron Tire Shop Receipt ${printEscape(receiptNumber)}</title><style>
    @page{size:80mm auto;margin:4mm}*{box-sizing:border-box}body{margin:0;background:#171917;color:#111;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px}.receipt{width:min(360px,100%);margin:24px auto;background:#fff;box-shadow:0 22px 60px rgba(0,0,0,.35)}.paper{padding:30px 27px 28px}.shop{text-align:center}.brand{font-size:22px;font-weight:900;letter-spacing:-.045em}.tagline{margin-top:4px;color:#5f635f;font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase}.rule{height:1px;margin:20px 0;background:#111}.receipt-title{text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:800;letter-spacing:.18em}.meta{display:grid;gap:7px;margin-top:17px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px}.meta-row{display:flex;justify-content:space-between;gap:16px}.meta-row span{color:#686c68}.meta-row b{text-align:right}.customer{margin-top:18px;padding:11px 12px;background:#f4f4f2}.customer-label{color:#747774;font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.customer-name{margin-top:4px;font-size:11px;font-weight:800}.items{width:100%;margin-top:20px;border-collapse:collapse}.items th{padding:0 0 8px;border-bottom:1px solid #111;font-size:8px;font-weight:850;text-align:left;text-transform:uppercase;letter-spacing:.1em}.items th:nth-child(2),.items td:nth-child(2){width:34px;text-align:center}.items th:last-child,.items td:last-child{text-align:right}.items td{padding:14px 0;border-bottom:1px dashed #aaa;vertical-align:top;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px}.items strong{display:block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px}.items span{display:block;margin-top:4px;color:#666;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px}.items td:last-child{font-size:12px;font-weight:800}.details{display:grid;gap:8px;margin-top:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px}.detail{display:flex;justify-content:space-between;gap:16px}.detail span{color:#666}.detail b{max-width:66%;text-align:right}.total{display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding:15px 14px;background:#111;color:#fff}.total-label{font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.total-value{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:24px;font-weight:900;letter-spacing:-.04em}.thank-you{margin-top:22px;text-align:center}.thank-you b{display:block;font-size:11px}.thank-you span{display:block;margin-top:5px;color:#6d716d;font-size:9px}.receipt-code{margin-top:18px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:8px;letter-spacing:.16em}.actions{display:flex;gap:9px;width:min(360px,calc(100% - 24px));margin:0 auto 24px}.actions button{flex:1;border:0;border-radius:8px;padding:14px;font:inherit;font-weight:800;cursor:pointer}.print{background:#fff;color:#111}.close{border:1px solid #555!important;background:#242724;color:#fff}.print-note{width:min(360px,calc(100% - 24px));margin:-10px auto 14px;color:#aeb2ae;font-size:10px;text-align:center}@media(max-width:400px){body{background:#fff}.receipt{width:100%;margin:0;box-shadow:none}.paper{padding:25px 22px}.actions{position:sticky;bottom:0;width:100%;margin:0;padding:12px;background:rgba(20,22,20,.96)}.print-note{width:100%;margin:0;padding:10px 14px;background:#171917}}@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.receipt{width:100%;margin:0;box-shadow:none}.paper{padding:0}.actions,.print-note{display:none}}
  </style></head><body><main class="receipt"><div class="paper"><header class="shop"><div class="brand">Akron Tire Shop</div><div class="tagline">Tires · Sales · Service</div></header><div class="rule"></div><div class="receipt-title">CUSTOMER RECEIPT</div><section class="meta"><div class="meta-row"><span>Receipt</span><b>#${printEscape(receiptNumber)}</b></div><div class="meta-row"><span>Date</span><b>${printEscape(soldDate)}</b></div><div class="meta-row"><span>Time</span><b>${printEscape(soldTime)}</b></div><div class="meta-row"><span>Payment</span><b>${printEscape(sale.paymentMethod)}</b></div></section><section class="customer"><div class="customer-label">Customer</div><div class="customer-name">${printEscape(sale.customer || "Walk-in customer")}</div></section><table class="items"><thead><tr><th>Item / Service</th><th>Qty</th><th>Total</th></tr></thead><tbody>${itemDetails}</tbody></table><section class="details"><div class="detail"><span>Work type</span><b>${printEscape(workName)}</b></div>${sale.notes ? `<div class="detail"><span>Notes</span><b>${printEscape(sale.notes)}</b></div>` : ""}</section><div class="total"><div class="total-label">Amount Paid</div><div class="total-value">${printEscape(money(sale.total))}</div></div><div class="thank-you"><b>Thank you for your business.</b><span>Akron Tire Shop</span></div><div class="receipt-code">${printEscape(receiptNumber)}</div></div></main><p class="print-note">Tap below to print or save this receipt as a PDF.</p><div class="actions"><button class="close" onclick="window.close()">Close</button><button class="print" onclick="window.focus();window.print()">Print / Save PDF</button></div></body></html>`);
  receiptWindow.document.close();
  receiptWindow.focus();
}

function ReceiptModal({ sale, onClose }: { sale: TireSale; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const isTire = (sale.serviceType || "tire") === "tire";
  const receiptNumber = sale.id.replaceAll("-", "").slice(0, 10).toUpperCase();
  const soldDate = new Date(sale.soldAt).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
  const soldTime = new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const printReceipt = () => {
    const previousTitle = document.title;
    const restoreTitle = () => { document.title = previousTitle; };
    document.title = `Akron Tire Shop Receipt ${receiptNumber}`;
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
    window.setTimeout(restoreTitle, 1500);
  };
  const saveReceipt = async () => {
    setSaving(true);
    try {
      const blob = await buildReceiptImage(sale);
      const fileName = `Akron-Tire-Shop-Receipt-${receiptNumber}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: `Akron Tire Shop Receipt #${receiptNumber}` });
      else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = fileName;
        document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) window.alert(error instanceof Error ? error.message : "Receipt could not be saved.");
    } finally { setSaving(false); }
  };
  return createPortal(
    <div className="receipt-print-layer fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Receipt preview">
      <div className="mx-auto flex min-h-full w-full max-w-[420px] items-center justify-center py-4">
        <div className="w-full">
          <section className="receipt-print-root overflow-hidden bg-white text-[#111] shadow-2xl">
            <div className="h-2.5 bg-[#10b981]" />
            <div className="px-8 py-8 sm:px-11 sm:py-10">
              <header className="flex items-start justify-between gap-6"><div><div className="text-[11px] font-black uppercase tracking-[.22em] text-[#10b981]">Akron</div><div className="mt-0.5 text-[30px] font-black leading-none tracking-[-.055em]">TIRE SHOP</div><div className="mt-2 text-[10px] font-semibold uppercase tracking-[.15em] text-neutral-500">Tires · Sales · Service</div></div><div className="text-right"><div className="text-[24px] font-light tracking-[-.035em] text-neutral-400">RECEIPT</div><div className="mt-1.5 font-mono text-[12px] font-bold">#{receiptNumber}</div><div className="mt-3 inline-flex rounded-full bg-[#d1fae5] px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-[#047857]">Paid in full</div></div></header>
              <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl bg-[#f5f5f4] p-5"><div><div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-500">Customer</div><div className="mt-1.5 text-[15px] font-bold">{sale.customer || "Walk-in customer"}</div></div><div className="grid grid-cols-2 gap-4 text-right"><div><div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-500">Date</div><div className="mt-1.5 text-[11px] font-bold">{soldDate}</div><div className="mt-1 text-[10px] text-neutral-500">{soldTime}</div></div><div><div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-500">Payment</div><div className="mt-1.5 text-[11px] font-bold">{sale.paymentMethod}</div></div></div></div>
              <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200"><table className="w-full border-collapse text-left"><thead className="bg-[#111] text-white"><tr className="text-[9px] uppercase tracking-[.14em]"><th className="px-5 py-3.5">Description</th><th className="px-4 py-3.5 text-center">Qty</th><th className="px-5 py-3.5 text-right">Amount</th></tr></thead><tbody><tr><td className="px-5 py-5"><strong className={`block text-[18px] ${isTire ? "font-mono" : "font-sans"}`}>{isTire ? sale.size : workTypeLabel(sale.serviceType)}</strong><span className="mt-1.5 block text-[11px] text-neutral-500">{isTire ? tirePackageLabel(sale.packageType) : "Automotive service"}</span></td><td className="px-4 py-5 text-center font-mono text-[14px] font-bold">{sale.quantity}</td><td className="px-5 py-5 text-right font-mono text-[15px] font-black">{money(sale.total)}</td></tr></tbody></table></div>
              {sale.notes && <div className="mt-5 rounded-xl border border-neutral-200 px-5 py-4"><div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-500">Work notes</div><div className="mt-2 text-[12px] leading-relaxed text-neutral-700">{sale.notes}</div></div>}
              <div className="mt-7 flex justify-end"><div className="w-full max-w-[300px] rounded-xl bg-[#111] px-5 py-5 text-white"><div className="flex items-center justify-between gap-5"><div><div className="text-[9px] font-bold uppercase tracking-[.15em] text-neutral-400">Total paid</div><div className="mt-1 text-[10px] text-neutral-500">Payment complete</div></div><strong className="font-mono text-[28px] tracking-[-.055em] text-[#6ee7b7]">{money(sale.total)}</strong></div></div></div>
              <footer className="mt-10 flex items-end justify-between gap-5 border-t border-neutral-200 pt-5"><div><strong className="block text-[13px]">Thank you for your business.</strong><span className="mt-1 block text-[10px] text-neutral-500">We appreciate you choosing Akron Tire Shop.</span></div><div className="text-right font-mono text-[9px] text-neutral-400">{receiptNumber}</div></footer>
            </div>
          </section>
          <div className="receipt-screen-actions grid grid-cols-3 gap-2 bg-[#171917] p-3"><button onClick={onClose} className="min-h-12 rounded-lg border border-white/15 text-xs font-semibold text-zinc-200">Close</button><button disabled={saving} onClick={() => void saveReceipt()} className="min-h-12 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 text-xs font-bold text-emerald-300 disabled:opacity-50"><Download className="mr-1 inline h-4 w-4" />{saving ? "Saving..." : "Save"}</button><button onClick={printReceipt} className="min-h-12 rounded-lg bg-white px-2 text-xs font-bold text-black"><Printer className="mr-1 inline h-4 w-4" />Print</button></div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function easternTimeValue(value: string | number | Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return `${get("hour")}:${get("minute")}`;
}

function easternDateTimeToIso(date: string, time: string) {
  const probe = new Date(`${date}T${time || "12:00"}:00Z`);
  const offsetName = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "longOffset" }).formatToParts(probe).find((part) => part.type === "timeZoneName")?.value || "GMT-05:00";
  const offset = offsetName.replace("GMT", "") || "-05:00";
  return new Date(`${date}T${time || "12:00"}:00${offset}`).toISOString();
}

function ShopPageHeader({ eyebrow, title, description, meta, actions, tone = "emerald" }: { eyebrow: string; title: string; description: string; meta?: React.ReactNode; actions?: React.ReactNode; tone?: ShopTone }) {
  const colors = shopToneStyles[tone];
  const HeaderIcon = tone === "sky" ? Package : tone === "amber" ? ShoppingCart : tone === "violet" ? ClipboardList : tone === "zinc" ? Settings : Eye;
  return (
    <div className="shop-hero flex flex-col items-stretch gap-5 pb-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#232938] bg-[#1a1e2b] text-emerald-400 sm:h-11 sm:w-11"><HeaderIcon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className={`mb-1.5 text-[9px] font-semibold uppercase tracking-[.16em] ${colors.text}`}>{eyebrow}</div>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-.025em] text-white sm:text-[30px]">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-[13px]">{description}</p>
          {meta}
        </div>
      </div>
      {actions && <div className="w-full shrink-0 sm:w-auto">{actions}</div>}
    </div>
  );
}

function TireStat({ label, value, detail, featured = false, tone = "emerald" }: { label: string; value: string | number; detail: string; featured?: boolean; tone?: ShopTone }) {
  const colors = shopToneStyles[tone];
  return (
    <div className={`mobile-stat-card mobile-surface relative min-w-0 overflow-hidden p-5 ${featured ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className={`truncate text-[9px] font-semibold uppercase tracking-[.12em] ${featured ? colors.text : "text-zinc-500"}`}>{label}</div>
      <AnimatePresence mode="popLayout" initial={false}><motion.div key={String(value)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .12 }} className="shop-money mt-2 truncate text-2xl font-bold tracking-[-.035em] text-white sm:text-[26px]">{value}</motion.div></AnimatePresence>
      <div className="mt-1.5 text-[10px] leading-snug text-zinc-600">{detail}</div>
    </div>
  );
}

function TireInventoryPage({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  const blank = { size: "", packageType: "set4", quantity: "", price: "" };
  const [data, setData] = useState<TireShopData | null>(null);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "low" | "out">("all");
  const [rimFilter, setRimFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const adjustmentLock = useRef(false);

  const load = useCallback(async () => {
    try {
      setData(await api<TireShopData>("/api/tire-shop"));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Inventory could not be loaded.");
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const updateField = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), price: Number(form.price) };
      const path = editingId ? `/api/tire-shop/inventory/${editingId}` : "/api/tire-shop/inventory";
      const next = await api<TireShopData>(path, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setData(next);
      setForm(blank);
      setEditingId(null);
      setMobileFormOpen(false);
      showToast(editingId ? "Inventory item updated." : "Tire added to inventory.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Inventory item could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const adjustItem = async (item: TireInventoryItem, amount: -1 | 1) => {
    if (adjustmentLock.current) return;
    const nextQuantity = item.quantity + amount;
    if (nextQuantity < 0) {
      showToast(`${item.size} is already at zero.`);
      return;
    }
    adjustmentLock.current = true;
    setAdjustingId(item.id);
    try {
      const next = await api<TireShopData>(`/api/tire-shop/inventory/${item.id}`, { method: "PATCH", body: JSON.stringify({ quantity: nextQuantity }) });
      setData(next);
      showToast(`${item.size}: ${nextQuantity} in stock.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Inventory quantity could not be updated.");
    } finally {
      adjustmentLock.current = false;
      setAdjustingId(null);
    }
  };

  const removeItem = async (item: TireInventoryItem) => {
    if (!window.confirm(`Remove tire size ${item.size} from inventory? Past sales will stay in the sales history.`)) return;
    setBusy(true);
    try {
      const next = await api<TireShopData>(`/api/tire-shop/inventory/${item.id}`, { method: "DELETE" });
      setData(next);
      if (editingId === item.id) { setEditingId(null); setForm(blank); }
      showToast(`${item.size} removed from inventory.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Inventory item could not be removed.");
    } finally { setBusy(false); }
  };

  const allInventory = data?.inventory || [];
  const rimSizes = [...new Set(allInventory.map((item) => tireRimSize(item.size)))].sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
  const inventory = allInventory.filter((item) => {
    const matchesSearch = `${item.size} ${tirePackageLabel(item.packageType)}`.toLowerCase().includes(search.toLowerCase());
    const matchesRim = rimFilter === "all" || tireRimSize(item.size) === rimFilter;
    const matchesStock = stockFilter === "all"
      || (stockFilter === "available" && item.quantity > 0)
      || (stockFilter === "low" && item.quantity > 0 && item.quantity <= 5)
      || (stockFilter === "out" && item.quantity === 0);
    return matchesSearch && matchesRim && matchesStock;
  });
  const summary = data?.summary;

  const exportInventory = () => {
    downloadCsv(`akron-inventory-${easternDateKey(new Date())}.csv`, [
      ["Tire Size", "Sold As", "Quantity", "Selling Price", "Stock Status"],
      ...inventory.map((item) => [
        item.size,
        tirePackageLabel(item.packageType),
        item.quantity,
        item.price.toFixed(2),
        item.quantity === 0 ? "Out of stock" : item.quantity <= 5 ? "Low stock" : "In stock",
      ]),
    ]);
    showToast(`${inventory.length} inventory item${inventory.length === 1 ? "" : "s"} exported.`);
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <ShopPageHeader tone="sky" eyebrow="Inventory" title="Manage Inventory" description="Add tires, update stock, and keep pricing organized." actions={<Button className="w-full justify-center px-5 sm:w-auto" onClick={() => setPage("tire-sales")}><ShoppingCart className="h-3.5 w-3.5" /> Record a Sale</Button>} />
      <div className="shop-stat-grid mobile-stat-grid grid grid-cols-2 lg:grid-cols-4">
        <TireStat label="Tire types" value={summary?.skus || 0} detail="Active inventory lines" />
        <TireStat label="Inventory quantity" value={summary?.units || 0} detail="Sets, pairs, and individual tires" />
        <TireStat label="Low stock" value={summary?.lowStock || 0} detail="Five or fewer remaining" />
        <TireStat label="Retail value" value={money(summary?.inventoryValue || 0)} detail="Current price × quantity" />
      </div>
      <section className="shop-card mobile-today-grid mobile-surface grid gap-3 rounded-2xl border border-[#252b27] bg-[#101712] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-5">
        <div><div className="text-[9px] font-semibold uppercase tracking-[.16em] text-emerald-400">Today</div><div className="mt-1 text-xs text-zinc-500">Live totals from today’s saved work.</div></div>
        <div className="rounded-xl border border-[#252d27] bg-[#0d110e] px-5 py-3"><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Revenue</div><div className="mt-1 text-xl font-semibold text-white">{money(summary?.todayRevenue || 0)}</div></div>
        <div className="rounded-xl border border-[#252d27] bg-[#0d110e] px-5 py-3"><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Jobs / items</div><div className="mt-1 text-xl font-semibold text-emerald-300">{summary?.todayUnits || 0}</div></div>
      </section>
      <div>
        <button type="button" onClick={() => setMobileFormOpen((open) => !open)} className="mobile-form-trigger mobile-tap flex w-full items-center gap-3 rounded-2xl border border-white/[.07] px-4 py-4 text-left md:hidden">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><Package className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">Add a tire</span><span className="mt-0.5 block text-[11px] text-zinc-500">Enter a new size, quantity, and price</span></span>
          <ChevronRight className={`h-5 w-5 text-zinc-500 transition ${mobileFormOpen ? "rotate-90" : ""}`} />
        </button>
        <div className={`${mobileFormOpen ? "mt-2 block" : "hidden"} md:block`}>
      <Card>
        <CardHeader title={editingId ? "Edit Inventory Item" : "Add Inventory Item"} icon={<Package className="h-4 w-4 text-sky-400" />} />
        <form onSubmit={saveItem} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-[11px] font-medium text-zinc-400">Size<input required name="size" value={form.size} onChange={updateField} placeholder="275/60R20" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Sold as<select name="packageType" value={form.packageType} onChange={(event) => setForm((current) => ({ ...current, packageType: event.target.value }))} className={`mt-1.5 ${tireFieldClass}`}><option value="set4">Set of 4</option><option value="pair">Pair (2)</option><option value="single">Individual</option></select></label>
          <label className="text-[11px] font-medium text-zinc-400">Quantity<input required min="0" step="1" type="number" name="quantity" value={form.quantity} onChange={updateField} placeholder="4" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Selling price<input required min="0" step="0.01" type="number" name="price" value={form.price} onChange={updateField} placeholder="0.00" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button disabled={busy} className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50 sm:w-auto sm:py-2.5">{busy ? "Saving..." : editingId ? "Save Changes" : "Add to Inventory"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank); }} className="rounded-lg px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white">Cancel</button>}
          </div>
        </form>
      </Card>
        </div>
      </div>
      <Card>
        <CardHeader title="All Inventory" icon={<Package className="h-4 w-4 text-zinc-400" />} action={<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inventory..." className="w-full rounded-xl border border-white/[.08] bg-[#090b0a] px-3.5 py-2.5 text-xs text-zinc-200 outline-none transition focus:border-emerald-400/45 sm:w-64" />} />
        <div className="mt-4 flex flex-col gap-3 border-b border-white/[.055] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#090b0a] p-1 ring-1 ring-inset ring-white/[.055]">
            {([['all', 'All'], ['available', 'Available'], ['low', 'Low'], ['out', 'Out']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setStockFilter(value)} className={`mobile-tap rounded-lg px-2.5 py-2 text-[10px] font-semibold transition sm:px-3 ${stockFilter === value ? "bg-sky-400/12 text-sky-200 ring-1 ring-inset ring-sky-400/20" : "text-zinc-500 hover:text-zinc-200"}`}>{label}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select value={rimFilter} onChange={(event) => setRimFilter(event.target.value)} className="min-h-10 rounded-xl border border-white/[.08] bg-[#090b0a] px-3 text-xs text-zinc-200 outline-none focus:border-sky-400/45"><option value="all">All rim sizes</option>{rimSizes.map((rim) => <option key={rim} value={rim}>{rim === "Other" ? rim : `${rim}\" rims`}</option>)}</select>
            <Button variant="secondary" disabled={!data || inventory.length === 0} onClick={exportInventory}><FileText className="h-3.5 w-3.5" /> Export CSV</Button>
          </div>
        </div>
        {!data ? <EmptyState title="Loading inventory" text="Reading the tire shop database..." /> : inventory.length === 0 ? <EmptyState title="No tires found" text={search || stockFilter !== "all" || rimFilter !== "all" ? "No inventory matches these filters." : "Use the form above to enter your first inventory item."} /> : (<>
          <div className="mt-4 space-y-3 sm:hidden">
            {inventory.map((item) => <article key={item.id} className="rounded-xl border border-white/[.065] bg-[#0b0d0c] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate font-mono text-lg font-semibold text-white">{item.size}</div><span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></div><div className="shrink-0 text-right"><div className={`text-2xl font-semibold ${item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity}</div><div className="text-[9px] uppercase tracking-wider text-zinc-600">in stock</div></div></div><div className="mt-4 grid grid-cols-[1fr_48px_48px] items-end gap-2 border-t border-white/[.06] pt-3"><div><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Selling price</div><div className="mt-1 text-lg font-semibold text-zinc-100">{money(item.price)}</div></div><button disabled={adjustingId !== null || item.quantity === 0} onClick={() => void adjustItem(item, -1)} className="mobile-tap grid h-12 place-items-center rounded-xl border border-white/[.08] bg-white/[.035] text-sm font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Remove one ${item.size} tire`}>−1</button><button disabled={adjustingId !== null} onClick={() => void adjustItem(item, 1)} className="mobile-tap grid h-12 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-sm font-semibold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Add one ${item.size} tire`}>+1</button></div><button disabled={busy} onClick={() => void removeItem(item)} className="mobile-tap mt-2.5 w-full rounded-xl border border-red-500/15 py-2.5 text-[10px] font-medium text-red-400/80">Remove from inventory</button></article>)}
          </div>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-zinc-800 sm:block">
            <table className="w-full min-w-[640px] text-left text-xs"><thead className="border-b border-zinc-800 bg-zinc-950/70 text-[10px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Tire Size</th><th className="px-4 py-3">Sold As</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Price</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-zinc-800/70">{inventory.map((item) => <tr key={item.id} className="hover:bg-zinc-900/60"><td className="px-4 py-3 font-mono font-semibold text-white">{item.size}</td><td className="px-4 py-3"><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></td><td className="px-4 py-3"><div className={`font-semibold ${item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity} <span className="text-[10px] font-normal text-zinc-500">{tirePackageLabel(item.packageType, true)}</span></div></td><td className="px-4 py-3 font-semibold text-zinc-200">{money(item.price)}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><button disabled={adjustingId !== null || item.quantity === 0} onClick={() => void adjustItem(item, -1)} className="rounded-md border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Remove one ${item.size} tire`}>−1</button><button disabled={adjustingId !== null} onClick={() => void adjustItem(item, 1)} className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Add one ${item.size} tire`}>+1</button><button disabled={busy} onClick={() => void removeItem(item)} className="rounded-md border border-red-500/20 px-3 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10">Remove</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </>)}
      </Card>
    </div>
  );
}

function TireInventoryViewPage({ showToast }: { showToast: (m: string) => void }) {
  const [data, setData] = useState<TireShopData | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try { setData(await api<TireShopData>("/api/tire-shop")); }
    catch (error) { showToast(error instanceof Error ? error.message : "Inventory could not be loaded."); }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const inventory = (data?.inventory || []).filter((item) => `${item.size} ${tirePackageLabel(item.packageType)}`.toLowerCase().includes(search.toLowerCase()));
  const summary = data?.summary;

  return (
    <div className="space-y-5 lg:space-y-7">
      <ShopPageHeader tone="sky" eyebrow="Read-only inventory" title="Inventory View" description="Available tires, quantities, and current selling prices." actions={<Button className="w-full sm:w-auto" variant="secondary" onClick={() => void load()}><RefreshCw className="h-3.5 w-3.5" /> Refresh Stock</Button>} />
      <div className="shop-stat-grid grid grid-cols-2 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1"><TireStat label="Inventory types" value={summary?.skus || 0} detail="Sizes and package types" /><TireStat label="Available quantity" value={summary?.units || 0} detail="Sets, pairs, and individuals" /><TireStat label="Low stock" value={summary?.lowStock || 0} detail="Five or fewer remaining" /></div>
      <Card>
        <CardHeader title="Available Inventory" icon={<Package className="h-4 w-4 text-zinc-400" />} action={<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tire size..." className="w-full rounded-xl border border-white/[.08] bg-[#090b0a] px-3.5 py-2.5 text-xs text-zinc-200 outline-none transition focus:border-emerald-400/45 sm:w-64" />} />
        {!data ? <EmptyState title="Loading inventory" text="Reading current stock..." /> : inventory.length === 0 ? <EmptyState title="No tires found" text={search ? "Try another tire size." : "There is no inventory to display yet."} /> : <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{inventory.map((item) => <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-lg font-semibold text-white">{item.size}</div><span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></div><div className="text-right"><div className={`text-2xl font-semibold ${item.quantity === 0 ? "text-red-400" : item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity}</div><div className="text-[10px] text-zinc-500">available</div></div></div><div className="mt-4 flex items-end justify-between border-t border-zinc-800 pt-3"><div><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Selling price</div><div className="mt-1 text-lg font-semibold text-zinc-100">{money(item.price)}</div></div><div className={`rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${item.quantity === 0 ? "bg-red-500/10 text-red-400" : item.quantity <= 5 ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}>{item.quantity === 0 ? "Out of stock" : item.quantity <= 5 ? "Low stock" : "In stock"}</div></div></article>)}</div>}
      </Card>
    </div>
  );
}

function TireSalesPage({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  const [data, setData] = useState<TireShopData | null>(null);
  const [receiptSale, setReceiptSale] = useState<TireSale | null>(null);
  const [form, setForm] = useState({ serviceType: "tire", inventoryId: "", quantity: "1", unitPrice: "", soldDate: easternDateKey(new Date()), soldTime: easternTimeValue(), customer: "", paymentMethod: "Cash", notes: "", adjustInventory: true });
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPickerOpen, setInventoryPickerOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentPeriod, setPaymentPeriod] = useState<"day" | "month">("day");
  const [paymentDate, setPaymentDate] = useState(easternDateKey(new Date()));
  const [selectedPayment, setSelectedPayment] = useState<"Cash" | "Cashapp" | "Chime">("Cash");

  const load = useCallback(async () => {
    try { setData(await api<TireShopData>("/api/tire-shop")); }
    catch (error) { showToast(error instanceof Error ? error.message : "Sales could not be loaded."); }
  }, [showToast]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let currentDay = easternDateKey(new Date());
    const syncCurrentSaleTime = () => {
      const now = new Date();
      const nextDay = easternDateKey(now);
      const nextTime = easternTimeValue(now);

      setForm((current) => {
        if (editingSaleId || current.soldDate !== currentDay) return current;
        if (current.soldDate === nextDay && current.soldTime === nextTime) return current;
        return {
          ...current,
          soldDate: nextDay,
          soldTime: nextTime,
          adjustInventory: current.serviceType === "tire",
        };
      });
      currentDay = nextDay;
    };

    syncCurrentSaleTime();
    const timer = window.setInterval(syncCurrentSaleTime, 1000);
    return () => window.clearInterval(timer);
  }, [editingSaleId]);

  const selectInventory = (id: string) => {
    const item = data?.inventory.find((entry) => entry.id === id);
    setForm((current) => ({ ...current, inventoryId: id, unitPrice: item ? String(item.price) : "" }));
    setInventorySearch(item ? `${item.size} — ${tirePackageLabel(item.packageType)}` : "");
    setInventoryPickerOpen(false);
  };

  const recordSale = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const path = editingSaleId ? `/api/tire-shop/sales/${editingSaleId}` : "/api/tire-shop/sales";
      const isNewSaleToday = !editingSaleId && form.soldDate === easternDateKey(new Date());
      const soldAt = isNewSaleToday ? new Date().toISOString() : easternDateTimeToIso(form.soldDate, form.soldTime);
      const next = await api<TireShopData>(path, { method: editingSaleId ? "PATCH" : "POST", body: JSON.stringify({ ...form, size: inventorySearch.trim(), quantity: Number(form.quantity), totalPrice: Number(form.unitPrice), soldAt }) });
      setData(next);
      setForm((current) => ({ ...current, inventoryId: "", quantity: "1", unitPrice: "", soldTime: easternTimeValue(), customer: "", notes: "" }));
      setInventorySearch("");
      setEditingSaleId(null);
      showToast(editingSaleId ? "Work entry updated." : form.serviceType === "tire" ? "Tire sale recorded and inventory updated." : `${workTypeLabel(form.serviceType)} service recorded.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Sale could not be recorded.");
    } finally { setBusy(false); }
  };

  const editSale = (sale: TireSale) => {
    const soldDate = easternDateKey(sale.soldAt);
    const item = data?.inventory.find((entry) => entry.id === sale.inventoryId);
    setEditingSaleId(sale.id);
    const serviceType = sale.serviceType || "tire";
    setForm({ serviceType, inventoryId: sale.inventoryId, quantity: String(sale.quantity), unitPrice: String(sale.total), soldDate, soldTime: easternTimeValue(sale.soldAt), customer: sale.customer, paymentMethod: ["Cash", "Cashapp", "Chime"].includes(sale.paymentMethod) ? sale.paymentMethod : "Cash", notes: sale.notes, adjustInventory: serviceType === "tire" && soldDate === easternDateKey(new Date()) });
    setInventorySearch(serviceType === "tire" ? (item ? `${item.size} — ${tirePackageLabel(item.packageType)}` : `${sale.size} — ${tirePackageLabel(sale.packageType)}`) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeSale = async (sale: TireSale) => {
    const isTire = (sale.serviceType || "tire") === "tire";
    if (!window.confirm(`Remove this ${workTypeLabel(sale.serviceType)} entry?${isTire && sale.adjustInventory !== false ? " The sold quantity will be returned to inventory." : ""}`)) return;
    setBusy(true);
    try {
      const next = await api<TireShopData>(`/api/tire-shop/sales/${sale.id}`, { method: "DELETE" });
      setData(next);
      if (editingSaleId === sale.id) {
        setEditingSaleId(null);
        setForm((current) => ({ ...current, inventoryId: "", quantity: "1", unitPrice: "", soldTime: easternTimeValue(), customer: "", notes: "" }));
        setInventorySearch("");
      }
      showToast(isTire ? "Tire sale removed and inventory reconciled." : "Service entry removed.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Sale could not be removed.");
    } finally { setBusy(false); }
  };

  const groups = Object.entries((data?.sales || []).reduce<Record<string, TireSale[]>>((result, sale) => {
    const key = easternDateKey(sale.soldAt);
    (result[key] ||= []).push(sale);
    return result;
  }, {})).sort(([a], [b]) => b.localeCompare(a));
  const summary = data?.summary;
  const todayKey = easternDateKey(new Date());
  const todaySales = (data?.sales || []).filter((sale) => easternDateKey(sale.soldAt) === todayKey);
  const todayTiresSold = physicalTireCount(todaySales);
  const averageSale = todaySales.length ? todaySales.reduce((sum, sale) => sum + sale.total, 0) / todaySales.length : 0;
  const currentMonthKey = todayKey.slice(0, 7);
  const monthSales = (data?.sales || []).filter((sale) => easternDateKey(sale.soldAt).slice(0, 7) === currentMonthKey);
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
  const monthItems = monthSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const monthTiresSold = physicalTireCount(monthSales);
  const monthAverage = monthSales.length ? monthRevenue / monthSales.length : 0;
  const currentMonthLabel = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", year: "numeric" });
  const paymentSales = paymentPeriod === "day"
    ? (data?.sales || []).filter((sale) => easternDateKey(sale.soldAt) === paymentDate)
    : monthSales;
  const selectedPaymentTotal = paymentMethodTotal(paymentSales, selectedPayment);
  const selectedCardTotal = cardPaymentTotal(paymentSales);
  const paymentPeriodLabel = paymentPeriod === "day" ? dateKeyLabel(paymentDate, todayKey) : currentMonthLabel;
  const currentSaleTotal = Math.max(0, Number(form.unitPrice) || 0);
  const isTireSale = form.serviceType === "tire";
  const isCurrentTireSale = isTireSale && form.soldDate === todayKey;
  const isLiveNewSale = !editingSaleId && form.soldDate === todayKey;
  const tireSelectionMissing = isTireSale && (isCurrentTireSale ? !form.inventoryId : !inventorySearch.trim());
  const inventoryMatches = (data?.inventory || []).filter((item) => {
    if (form.adjustInventory && item.quantity <= 0 && item.id !== form.inventoryId) return false;
    const query = inventorySearch.trim().toLowerCase();
    return !query || `${item.size} ${tirePackageLabel(item.packageType)}`.toLowerCase().includes(query);
  }).slice(0, 12);

  const chooseWorkType = (serviceType: string) => {
    setInventorySearch("");
    setInventoryPickerOpen(false);
    setForm((current) => ({ ...current, serviceType, inventoryId: "", unitPrice: "", adjustInventory: serviceType === "tire" && current.soldDate === easternDateKey(new Date()) }));
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <ShopPageHeader tone="amber" eyebrow="Sales desk" title="Sales & Services" description="Record tire sales, mount and balance work, plugs, rotations, and brakes." actions={<Button className="w-full justify-center sm:w-auto" variant="secondary" onClick={() => setPage("tire-inventory")}><Package className="h-3.5 w-3.5" /> Open Inventory</Button>} />
      <div className="shop-stat-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 xl:[&>*:last-child]:col-span-1"><TireStat featured tone="amber" label="Today's revenue" value={money(summary?.todayRevenue || 0)} detail="Calculated automatically" /><TireStat label="Tires sold today" value={todayTiresSold} detail="Physical tires" /><TireStat label="Jobs / items" value={summary?.todayUnits || 0} detail="Today's quantity" /><TireStat label="Transactions" value={todaySales.length} detail="Work recorded today" /><TireStat label="Average sale" value={money(averageSale)} detail="Revenue per transaction" /></div>
      <section className="shop-card rounded-2xl border border-[#252b27] bg-[#121613] p-4 sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><div className="text-[9px] font-semibold uppercase tracking-[.14em] text-emerald-400">Month to date</div><h2 className="mt-1 text-base font-semibold text-white">{currentMonthLabel}</h2></div><div className="text-right"><div className="text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-500">Revenue</div><div className="mt-1 text-2xl font-semibold tracking-[-.04em] text-white">{money(monthRevenue)}</div></div></div><div className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-[#252b27] pt-4 sm:grid-cols-4"><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Tires sold</div><div className="mt-1 text-base font-semibold text-zinc-200">{monthTiresSold}</div></div><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Jobs / items</div><div className="mt-1 text-base font-semibold text-zinc-200">{monthItems}</div></div><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Transactions</div><div className="mt-1 text-base font-semibold text-zinc-200">{monthSales.length}</div></div><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Average</div><div className="mt-1 text-base font-semibold text-zinc-200">{money(monthAverage)}</div></div></div></section>
      <section className="shop-card mobile-surface rounded-2xl border border-[#252b27] bg-[#121613] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-500">Payment totals</div><div className="mt-1 text-sm font-semibold text-white">{paymentPeriodLabel}</div></div><div className="grid grid-cols-2 rounded-lg bg-[#090b0a] p-1 ring-1 ring-inset ring-white/[.07]"><button onClick={() => setPaymentPeriod("day")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${paymentPeriod === "day" ? "bg-white/[.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Day</button><button onClick={() => setPaymentPeriod("month")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${paymentPeriod === "month" ? "bg-white/[.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Month</button></div></div>
        {paymentPeriod === "day" && <div className="mt-4 grid grid-cols-[42px_minmax(0,1fr)_42px] gap-2"><button aria-label="Previous day" onClick={() => setPaymentDate((current) => shiftDateKey(current, -1))} className="grid h-10 place-items-center rounded-lg border border-white/[.07] bg-[#090b0a] text-zinc-400 hover:text-white"><ChevronRight className="h-4 w-4 rotate-180" /></button><input aria-label="Payment totals date" type="date" max={todayKey} value={paymentDate} onChange={(event) => event.target.value && setPaymentDate(event.target.value)} className="min-w-0 rounded-lg border border-white/[.07] bg-[#090b0a] px-3 text-center text-xs font-semibold text-white outline-none focus:border-emerald-500/40" /><button aria-label="Next day" disabled={paymentDate >= todayKey} onClick={() => setPaymentDate((current) => shiftDateKey(current, 1))} className="grid h-10 place-items-center rounded-lg border border-white/[.07] bg-[#090b0a] text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div>}
        <div className="payment-summary-grid mt-4 grid grid-cols-3 divide-x divide-white/[.06] overflow-hidden rounded-lg border border-white/[.065] bg-[#0c0e0d]">{(["Cash", "Cashapp", "Chime"] as const).map((method) => <button key={method} onClick={() => setSelectedPayment(method)} className={`min-w-0 px-2.5 py-3 text-left transition first:rounded-l-lg last:rounded-r-lg sm:px-3 ${selectedPayment === method ? "bg-white/[.04]" : "hover:bg-white/[.02]"}`}><div className={`text-[9px] font-semibold uppercase tracking-[.12em] ${selectedPayment === method ? "text-emerald-400" : "text-zinc-500"}`}>{method}</div><div className="mt-1 truncate text-base font-semibold text-white sm:text-lg">{money(paymentMethodTotal(paymentSales, method))}</div></button>)}</div>
        <div className="mt-3 grid overflow-hidden rounded-xl border border-[#29332c] bg-[#0f1511] sm:grid-cols-2 sm:divide-x sm:divide-[#29332c]"><div className="flex items-center justify-between gap-3 px-3.5 py-3 text-xs"><span className="text-zinc-600">{selectedPayment} total</span><span className="font-semibold text-zinc-200">{money(selectedPaymentTotal)}</span></div><div className="flex items-center justify-between gap-3 border-t border-[#29332c] px-3.5 py-3 sm:border-t-0"><span className="flex items-center gap-2 text-xs font-medium text-emerald-300"><CreditCard className="h-3.5 w-3.5" /> Card total</span><span className="text-base font-semibold text-white">{money(selectedCardTotal)}</span></div></div>
        <p className="mt-2 text-[10px] text-zinc-600">Card total combines Cashapp and Chime. Cash is not included.</p>
      </section>
      <Card>
        <CardHeader title={editingSaleId ? "Edit Work Entry" : "Record Work"} icon={<ShoppingCart className="h-4 w-4 text-amber-400" />} action={<div className="text-right"><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Total</div><div className="text-sm font-semibold text-amber-300">{money(currentSaleTotal)}</div></div>} />
        <form onSubmit={recordSale} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <fieldset className="sm:col-span-2 lg:col-span-4"><legend className="text-[11px] font-medium text-zinc-400">What did you do?</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">{workTypeOptions.map((option) => { const Icon = option.icon; const selected = form.serviceType === option.value; return <button type="button" key={option.value} onClick={() => chooseWorkType(option.value)} className={`mobile-tap flex min-h-14 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold ring-1 ring-inset transition sm:flex-col sm:justify-center sm:text-center ${selected ? "bg-amber-400/10 text-amber-200 ring-amber-400/25" : "bg-[#0a0c0b] text-zinc-500 ring-white/[.06] hover:bg-white/[.035] hover:text-zinc-300"}`}><Icon className={`h-4 w-4 shrink-0 ${selected ? "text-amber-400" : "text-zinc-600"}`} /><span>{option.label}</span></button>; })}</div></fieldset>
          {isTireSale && <label className="relative text-[11px] font-medium text-zinc-400 sm:col-span-2">Tire size<input required autoComplete="off" value={inventorySearch} onFocus={() => setInventoryPickerOpen(true)} onBlur={() => window.setTimeout(() => setInventoryPickerOpen(false), 180)} onChange={(event) => { setInventorySearch(event.target.value); setInventoryPickerOpen(true); setForm((current) => ({ ...current, inventoryId: "", unitPrice: "" })); }} placeholder="Type a size, like 185/65/14" className={`mt-1.5 ${tireFieldClass}`} /><span className="mt-1 block text-[10px] font-normal text-zinc-600">{isCurrentTireSale ? "Today's sales must match an in-stock tire below." : "For an old sale, type any tire size—even if it is not in inventory."}</span>{inventoryPickerOpen && <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl">{inventoryMatches.length ? inventoryMatches.map((item) => <button type="button" key={item.id} onPointerDown={(event) => event.preventDefault()} onClick={() => selectInventory(item.id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-zinc-800"><span><span className="block font-mono text-xs font-semibold text-white">{item.size}</span><span className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[9px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></span><span className="shrink-0 text-right"><span className={`block text-xs font-semibold ${item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity} available</span><span className="mt-0.5 block text-[10px] text-zinc-500">{money(item.price)}</span></span></button>) : <div className="px-3 py-5 text-center text-xs text-zinc-500">{isCurrentTireSale ? "No matching in-stock tire found." : "No inventory match. Your typed size will still be saved with this old sale."}</div>}</div>}</label>}
          <label className="text-[11px] font-medium text-zinc-400">Quantity<input required min="1" step="1" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Total charged<input required min="0" step="0.01" type="number" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} placeholder="Full amount charged" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Date<input required type="date" max={easternDateKey(new Date())} value={form.soldDate} onChange={(event) => setForm((current) => ({ ...current, soldDate: event.target.value, adjustInventory: current.serviceType === "tire" && event.target.value === easternDateKey(new Date()) }))} className={`mt-1.5 ${tireFieldClass}`} /><span className="mt-1 block text-[10px] font-normal text-zinc-600">Past dates are allowed.</span></label>
          <label className="text-[11px] font-medium text-zinc-400">Sale time<input required readOnly={isLiveNewSale} type="time" value={form.soldTime} onChange={(event) => setForm((current) => ({ ...current, soldTime: event.target.value }))} className={`mt-1.5 ${tireFieldClass} ${isLiveNewSale ? "cursor-default" : ""}`} /><span className="mt-1 block text-[10px] font-normal text-zinc-600">{isLiveNewSale ? "Live Akron time — updates automatically." : "Saved and historical times can be edited."}</span></label>
          <label className="text-[11px] font-medium text-zinc-400">Customer / invoice<input value={form.customer} onChange={(event) => setForm((current) => ({ ...current, customer: event.target.value }))} placeholder="Optional" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <fieldset className="sm:col-span-2"><legend className="text-[11px] font-medium text-zinc-400">Payment method</legend><div className="mt-2 grid grid-cols-3 gap-2">{["Cash", "Cashapp", "Chime"].map((method) => <button type="button" key={method} onClick={() => setForm((current) => ({ ...current, paymentMethod: method }))} className={`mobile-tap min-h-11 rounded-xl px-2 text-[11px] font-semibold ring-1 ring-inset transition ${form.paymentMethod === method ? "bg-amber-400/10 text-amber-200 ring-amber-400/25" : "bg-[#0a0c0b] text-zinc-500 ring-white/[.06]"}`}>{method}</button>)}</div></fieldset>
          <label className="text-[11px] font-medium text-zinc-400">Notes<input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <div className={`rounded-lg border p-3 sm:col-span-2 lg:col-span-4 ${isTireSale && form.soldDate === easternDateKey(new Date()) ? "border-emerald-500/20 bg-emerald-500/10" : "border-blue-500/20 bg-blue-500/10"}`}><div className={`text-xs font-medium ${isTireSale && form.soldDate === easternDateKey(new Date()) ? "text-emerald-300" : "text-blue-300"}`}>{!isTireSale ? `${workTypeLabel(form.serviceType)} service — tire inventory will not change` : form.soldDate === easternDateKey(new Date()) ? "Today's tire sale — inventory will be reduced automatically" : "Past tire sale — current inventory will not be changed"}</div><div className="mt-1 text-[10px] leading-relaxed text-zinc-500">{!isTireSale ? "This job is saved in daily and monthly revenue totals without removing tires." : form.soldDate === easternDateKey(new Date()) ? "The quantity sold will be removed from this tire size." : "Your inventory is already current, so older sales are saved only in history."}</div></div>
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row lg:col-span-4"><button disabled={busy || tireSelectionMissing || !form.unitPrice} className="w-full rounded-lg bg-emerald-400 px-4 py-3 sm:w-auto sm:py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-40">{busy ? "Saving..." : editingSaleId ? "Save Changes" : `Record ${workTypeLabel(form.serviceType)} — ${money(currentSaleTotal)}`}</button>{editingSaleId && <button type="button" onClick={() => { setEditingSaleId(null); setInventorySearch(""); setForm((current) => ({ ...current, inventoryId: "", quantity: "1", unitPrice: "", soldTime: easternTimeValue(), customer: "", notes: "" })); }} className="rounded-lg px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white">Cancel</button>}</div>
        </form>
      </Card>
      <Card>
        <CardHeader title="Daily Work History" icon={<ClipboardList className="h-4 w-4 text-zinc-400" />} />
        {!data ? <EmptyState title="Loading work history" text="Reading saved sales and services..." /> : groups.length === 0 ? <EmptyState title="No work recorded" text="Your daily sales and service history will appear here." /> : <div className="mt-4 space-y-5">{groups.map(([date, sales]) => { const revenue = sales.reduce((sum, sale) => sum + sale.total, 0); const units = sales.reduce((sum, sale) => sum + sale.quantity, 0); return <section key={date} className="overflow-hidden rounded-xl border border-zinc-800"><div className="flex flex-col justify-between gap-2 border-b border-zinc-800 bg-zinc-950/70 px-4 py-3 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold text-white">{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div><div className="mt-0.5 text-[10px] text-zinc-500">{sales.length} transaction{sales.length === 1 ? "" : "s"} • {units} job/item{units === 1 ? "" : "s"}</div></div><div className="text-lg font-semibold text-emerald-300">{money(revenue)}</div></div><div className="divide-y divide-zinc-800/70">{sales.map((sale) => { const isTire = (sale.serviceType || "tire") === "tire"; return <div key={sale.id} className="grid gap-3 px-4 py-3 text-xs sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><div className="flex items-center gap-2"><span className={`font-semibold text-zinc-200 ${isTire ? "font-mono" : ""}`}>{isTire ? sale.size : workTypeLabel(sale.serviceType)}</span><span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${isTire ? tirePackageClass(sale.packageType) : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"}`}>{isTire ? tirePackageLabel(sale.packageType) : "Service"}</span></div><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500"><span>{new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} • {sale.customer || "Walk-in"} • {sale.paymentMethod} • Recorded by {sale.recordedBy}</span><span className={`rounded border px-1.5 py-0.5 ${isTire && sale.adjustInventory !== false ? "border-zinc-700 text-zinc-500" : "border-blue-500/20 bg-blue-500/10 text-blue-300"}`}>{isTire ? sale.adjustInventory === false ? "Historical entry" : "Stock adjusted" : "Inventory unchanged"}</span></div></div><div className="text-zinc-400">{sale.quantity} {isTire ? tirePackageLabel(sale.packageType, sale.quantity !== 1) : workTypeLabel(sale.serviceType)}</div><div className="font-semibold text-white sm:text-right">{money(sale.total)} total</div><div className="flex flex-wrap gap-2 sm:justify-end"><button onClick={() => setReceiptSale(sale)} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/10"><Printer className="h-3 w-3" /> Print Receipt</button><button onClick={() => editSale(sale)} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800">Edit</button><button disabled={busy} onClick={() => void removeSale(sale)} className="rounded-md border border-red-500/20 px-2.5 py-1.5 text-[10px] font-medium text-red-400 hover:bg-red-500/10">Remove</button></div></div>; })}</div></section>; })}</div>}
      </Card>
      {receiptSale && <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />}
    </div>
  );
}

function TireSalesReportPage({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  const currentDateKey = easternDateKey(new Date());
  const currentMonthKey = currentDateKey.slice(0, 7);
  const [reportPeriod, setReportPeriod] = useState<"day" | "month">("day");
  const [dayKey, setDayKey] = useState(currentDateKey);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [data, setData] = useState<TireShopData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [receiptSale, setReceiptSale] = useState<TireSale | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api<TireShopData>(`/api/tire-shop?fresh=${Date.now()}`, { cache: "no-store" }));
      setLastUpdated(new Date());
    }
    catch (error) { showToast(error instanceof Error ? error.message : "Tire sales could not be loaded."); }
    finally { setRefreshing(false); }
  }, [showToast]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    const refreshOnFocus = () => void load();
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [load]);

  const sales = (data?.sales || []).filter((sale) => {
    const saleDate = easternDateKey(sale.soldAt);
    return reportPeriod === "day" ? saleDate === dayKey : saleDate.slice(0, 7) === monthKey;
  });
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const quantity = physicalTireCount(sales);
  const average = sales.length ? revenue / sales.length : 0;
  const days = Object.entries(sales.reduce<Record<string, TireSale[]>>((result, sale) => {
    const day = easternDateKey(sale.soldAt);
    (result[day] ||= []).push(sale);
    return result;
  }, {})).sort(([a], [b]) => b.localeCompare(a));
  const canGoForward = reportPeriod === "day" ? dayKey < currentDateKey : monthKey < currentMonthKey;
  const periodLabel = reportPeriod === "day" ? dateKeyLabel(dayKey, currentDateKey) : monthKeyLabel(monthKey);
  const exportKey = reportPeriod === "day" ? dayKey : monthKey;

  const exportSales = () => {
    downloadCsv(`akron-sales-${exportKey}.csv`, [
      ["Date", "Time", "Work", "Tire Size", "Quantity", "Payment", "Customer", "Total", "Notes"],
      ...sales.map((sale) => {
        const isTire = (sale.serviceType || "tire") === "tire";
        return [
          easternDateKey(sale.soldAt),
          new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }),
          isTire ? "Tire Sale" : workTypeLabel(sale.serviceType),
          isTire ? sale.size : "",
          sale.quantity,
          sale.paymentMethod,
          sale.customer || "Walk-in",
          Number(sale.total || 0).toFixed(2),
          sale.notes || "",
        ];
      }),
    ]);
    showToast(`${sales.length} ${periodLabel} record${sales.length === 1 ? "" : "s"} exported.`);
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <ShopPageHeader tone="violet" eyebrow="Reporting" title="Sales Reports" description="View daily or monthly sales, services, and payment totals." meta={lastUpdated && <p className="mt-1.5 text-[10px] text-zinc-600">Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>} actions={<div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-3 sm:flex"><Button className="justify-center" variant="ghost" disabled={refreshing} onClick={() => void load()}><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh</Button><Button className="justify-center" variant="secondary" disabled={!sales.length} onClick={exportSales}><FileText className="h-3.5 w-3.5" /> Export CSV</Button><Button className="col-span-2 justify-center min-[520px]:col-span-1" onClick={() => setPage("tire-sales")}><ShoppingCart className="h-3.5 w-3.5" /> Record Work</Button></div>} />

      <section className="shop-card mobile-surface rounded-2xl border border-[#252b27] bg-[#121613] p-4 sm:p-5">
        <div className="mx-auto mb-4 grid max-w-[240px] grid-cols-2 rounded-lg bg-[#090b0a] p-1 ring-1 ring-inset ring-white/[.07]"><button onClick={() => setReportPeriod("day")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${reportPeriod === "day" ? "bg-white/[.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Day</button><button onClick={() => setReportPeriod("month")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${reportPeriod === "month" ? "bg-white/[.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Month</button></div>
        {reportPeriod === "day" ? <div className="grid grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-2"><button aria-label="Previous day" onClick={() => setDayKey((current) => shiftDateKey(current, -1))} className="grid h-10 place-items-center rounded-lg border border-white/[.07] bg-[#090b0a] text-zinc-400 transition hover:text-white"><ChevronRight className="h-4 w-4 rotate-180" /></button><div className="min-w-0 text-center"><input aria-label="Report date" type="date" max={currentDateKey} value={dayKey} onChange={(event) => event.target.value && setDayKey(event.target.value)} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1 text-center text-base font-semibold text-white outline-none focus:border-white/[.08]" /><div className="truncate text-[10px] text-zinc-500">{dateKeyLabel(dayKey, currentDateKey)}</div></div><button aria-label="Next day" disabled={!canGoForward} onClick={() => setDayKey((current) => shiftDateKey(current, 1))} className="grid h-10 place-items-center rounded-lg border border-white/[.07] bg-[#090b0a] text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div> : <div className="flex items-center justify-between gap-3"><button aria-label="Previous month" onClick={() => setMonthKey((current) => shiftMonthKey(current, -1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/[.07] bg-[#090b0a] text-zinc-400 transition hover:text-white"><ChevronRight className="h-4 w-4 rotate-180" /></button><h2 className="min-w-0 truncate text-center text-lg font-semibold text-white">{monthKeyLabel(monthKey)}</h2><button aria-label="Next month" disabled={!canGoForward} onClick={() => setMonthKey((current) => shiftMonthKey(current, 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/[.07] bg-[#090b0a] text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div>}
      </section>

      <div className="shop-stat-grid grid grid-cols-2 lg:grid-cols-4 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1"><TireStat featured tone="violet" label="Total revenue" value={money(revenue)} detail="Sales and services" /><TireStat label="Tires sold" value={quantity} detail="Physical tire count" /><TireStat label="Transactions" value={sales.length} detail="All recorded work" /><TireStat label="Average transaction" value={money(average)} detail="Per entry" /></div>

      <section className="shop-card mobile-surface rounded-2xl border border-[#252b27] bg-[#121613] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-500">Payment breakdown</div><div className="flex items-center gap-1.5 text-[9px] text-zinc-600"><CreditCard className="h-3 w-3" /> Card excludes cash</div></div><div className="mt-3 grid grid-cols-2 overflow-hidden rounded-xl border border-[#252b27] bg-[#0d110e] sm:grid-cols-4">{(["Cash", "Cashapp", "Chime"] as const).map((method) => <div key={method} className="min-w-0 border-b border-r border-white/[.06] p-3 sm:border-b-0 sm:p-4"><div className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-500">{method}</div><div className="mt-1 truncate text-base font-semibold text-white sm:text-lg">{money(paymentMethodTotal(sales, method))}</div></div>)}<div className="min-w-0 border-b border-white/[.06] bg-emerald-400/[.055] p-3 sm:border-b-0 sm:p-4"><div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.12em] text-emerald-400"><CreditCard className="h-3 w-3" /> Card total</div><div className="mt-1 truncate text-base font-semibold text-white sm:text-lg">{money(cardPaymentTotal(sales))}</div></div></div></section>

      <Card>
        <CardHeader title={`${periodLabel} Sales & Services`} icon={<ClipboardList className="h-4 w-4 text-zinc-400" />} />
        {!data ? <EmptyState title="Loading sales and services" text="Reading saved records..." /> : days.length === 0 ? <EmptyState title={`No work recorded for ${periodLabel}`} text={`Use the arrows or date picker to check another ${reportPeriod === "day" ? "day" : "month"}.`} /> : <div className="mt-4 space-y-4">{days.map(([date, daySales]) => { const dayTotal = daySales.reduce((sum, sale) => sum + sale.total, 0); const dayTires = physicalTireCount(daySales); return <section key={date} className="overflow-hidden rounded-xl border border-zinc-800"><div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/70 px-4 py-3"><div><div className="text-sm font-semibold text-white">{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div><div className="mt-0.5 text-[10px] text-zinc-500">{dayTires} tire{dayTires === 1 ? "" : "s"} sold • {daySales.length} transaction{daySales.length === 1 ? "" : "s"}</div></div><div className="text-base font-semibold text-emerald-300">{money(dayTotal)}</div></div><div className="divide-y divide-zinc-800/70">{daySales.map((sale) => { const isTire = (sale.serviceType || "tire") === "tire"; return <div key={sale.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className={`font-semibold text-zinc-200 ${isTire ? "font-mono" : ""}`}>{isTire ? sale.size : workTypeLabel(sale.serviceType)}</span><span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${isTire ? tirePackageClass(sale.packageType) : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"}`}>{isTire ? tirePackageLabel(sale.packageType) : "Service"}</span></div><div className="mt-1 text-[10px] text-zinc-500">{new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} • {sale.customer || "Walk-in"} • {sale.paymentMethod}</div></div><div className="text-zinc-400">{isTire ? `${sale.quantity} tire${sale.quantity === 1 ? "" : "s"}` : `${sale.quantity} ${workTypeLabel(sale.serviceType)}`}</div><div className="font-semibold text-white sm:text-right">{money(sale.total)}</div><button onClick={() => setReceiptSale(sale)} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-500/20 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/10"><Printer className="h-3 w-3" /> Receipt</button></div>; })}</div></section>; })}</div>}
      </Card>
      {receiptSale && <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />}
    </div>
  );
}

function ActionModal({ modal, close, confirm, busy }: { modal: { action: ModActionType; player?: Player }; close: () => void; confirm: (reason: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Confirm {modal.action}</h3>
          <button onClick={close} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {modal.player && <p className="mt-3 text-xs text-zinc-400">Targeting user: <span className="font-medium text-white">{modal.player.name}</span></p>}
        <div className="mt-4">
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide audit reasoning..." className="h-20 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-500" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="danger" disabled={busy} onClick={() => confirm(reason)}>{busy ? "Processing..." : "Confirm Action"}</Button>
        </div>
      </motion.div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-24 left-4 right-4 z-50 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-xs font-medium text-zinc-200 shadow-xl sm:left-auto sm:right-5 sm:max-w-sm lg:bottom-5">
      {message}
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="shop-card mobile-surface rounded-[14px] border p-4 sm:p-5 lg:p-6">{children}</div>;
}

function CardHeader({ title, icon, action }: { title: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="shop-card-title-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[.035]">{icon}</span>
        <h2 className="text-[15px] font-bold tracking-[-.015em] text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Button({ children, variant = "primary", onClick, disabled, className = "" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; disabled?: boolean; className?: string }) {
  const styles = {
    primary: "border border-emerald-500 bg-emerald-500 text-[#090a0f] hover:bg-emerald-600 hover:border-emerald-600",
    secondary: "border border-[#232938] bg-[#1a1e2b] text-zinc-100 hover:border-[#333b50] hover:bg-[#232838]",
    ghost: "border border-transparent text-zinc-400 hover:border-white/[.06] hover:bg-white/[.035] hover:text-white",
    danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`mobile-tap inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-[18px] py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="rounded-lg border border-zinc-800 bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500" />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 text-xs font-medium text-zinc-200">{value}</div>
    </div>
  );
}

function Health({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-200 font-medium">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-zinc-200" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Checklist({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-300">
      <CheckCircle2 className={`h-3.5 w-3.5 ${done ? "text-emerald-400" : "text-zinc-600"}`} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-8 text-center">
      <div className="text-xs font-medium text-zinc-300">{title}</div>
      <div className="mt-1 text-[11px] text-zinc-500">{text}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto hidden border-t border-white/[.06] bg-[#0a0c0b] py-5 text-center text-[10px] text-zinc-700 lg:block">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div>Akron Tire Shop &copy; 2026</div>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-zinc-300 transition">Privacy Policy</a>
          <a href="/terms" className="hover:text-zinc-300 transition">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default App;
