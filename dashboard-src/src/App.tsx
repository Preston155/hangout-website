'use client';

import { AnimatePresence, motion } from "framer-motion";
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
  Cpu,
  Database,
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
  const token = sessionStorage.getItem("prestonhq_token");
  const response = await fetch(API_BASE + path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
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
  { id: "overview" as Page, label: "Overview", icon: Layers },
  { id: "bot" as Page, label: "Veltrix Bot", icon: Cpu },
  { id: "operations" as Page, label: "Staff Operations", icon: Clock3 },
  { id: "connect" as Page, label: "Server Connect", icon: Server },
  { id: "players" as Page, label: "Players", icon: Users },
  { id: "cad" as Page, label: "MDT / CAD Center", icon: Siren },
  { id: "commands" as Page, label: "Console Dispatch", icon: Terminal },
  { id: "logs" as Page, label: "Audit Logs", icon: ClipboardList },
  { id: "staff" as Page, label: "Staff Matrix", icon: ShieldCheck },
  { id: "tire-inventory" as Page, label: "Tire Inventory", icon: Package },
  { id: "inventory-view" as Page, label: "Inventory View", icon: Eye },
  { id: "tire-sales" as Page, label: "Sales & Services", icon: ShoppingCart },
  { id: "tire-sales-report" as Page, label: "Monthly Tire Sales", icon: ClipboardList },
  { id: "settings" as Page, label: "System Settings", icon: Settings },
];

export function App() {
  const [page, setPage] = useState<Page>("tire-inventory");
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => {
    const styleId = "prestonhq-mobile-form-no-zoom";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media (max-width: 767px) {
        input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
        select,
        textarea {
          font-size: 16px !important;
          touch-action: manipulation;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

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
        if (!data.authenticated && !sessionStorage.getItem("prestonhq_token")) {
          setAuth("guest");
          return;
        }
        setAuth("ready");
        loadLiveData();
      })
      .catch(() => setAuth(sessionStorage.getItem("prestonhq_token") ? "ready" : "guest"));
  }, [loadLiveData]);

  useEffect(() => {
    if (auth !== "ready") return;
    const timer = window.setInterval(loadLiveData, 10000);
    return () => window.clearInterval(timer);
  }, [auth, loadLiveData]);

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
  if (auth === "guest") return <LoginScreen onSuccess={() => { setAuth("ready"); loadLiveData(); }} />;

  return (
    <DashboardClockProvider>
    <div className="min-h-screen bg-[#09090b] font-sans text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
      <div className="flex min-h-screen">
        <Sidebar page={page} setPage={(next) => { setPage(next); setMobileOpen(false); }} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
        <main className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Topbar page={page} onMenu={() => setMobileOpen(true)} serverData={serverData} onRefresh={loadLiveData} lastSyncedAt={lastSyncedAt} />
          <div className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
            {syncError && (
              <div className="mb-6 flex flex-col items-stretch justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-300 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{syncError}</span>
                </div>
                <button onClick={loadLiveData} className="w-full shrink-0 rounded bg-amber-500/20 px-3 py-2 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/30 sm:w-auto sm:py-1">
                  Retry Sync
                </button>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                {page === "overview" && <Overview showToast={showToast} setPage={setPage} serverData={serverData} logs={logData} onRefresh={loadLiveData} />}
                {page === "bot" && <VeltrixBotDashboard showToast={showToast} mode="overview" />}
                {page === "operations" && <VeltrixBotDashboard showToast={showToast} mode="staff" />}
                {page === "connect" && <Connect showToast={showToast} onConnected={async () => { await loadLiveData(); setPage("overview"); }} />}
                {page === "players" && <Players players={playerData} selected={selectedPlayer} setSelected={setSelectedPlayer} openAction={(action, player) => setModal({ action, player })} />}
                {page === "cad" && <CadMdtCenter players={playerData} showToast={showToast} />}
                {page === "commands" && <CommandCenter openAction={(action) => setModal({ action })} sendCommand={sendCommand} busy={busy} />}
                {page === "logs" && <Logs logs={logData} />}
                {page === "staff" && <StaffPermissions showToast={showToast} />}
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
      <AnimatePresence>{modal && <ActionModal modal={modal} close={() => setModal(null)} confirm={executeAction} busy={busy} />}</AnimatePresence>
      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
    </DashboardClockProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#09090b] text-zinc-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
        <span className="text-xs font-medium tracking-wide">Connecting to platform...</span>
      </div>
    </div>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<any>("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
      if (data.token) sessionStorage.setItem("prestonhq_token", data.token);
      onSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Invalid access token.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#09090b] p-4 text-zinc-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm">
            <Lock className="h-5 w-5 text-zinc-300" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">PrestonHQ Terminal</h1>
          <p className="mt-1 text-xs text-zinc-400">Enter operator authorization key to access management controls.</p>
        </div>
        <form onSubmit={login} className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-xl backdrop-blur-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Access Passcode</label>
              <input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
            </div>
            {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">{error}</div>}
            <button disabled={busy || !password} className="w-full rounded-lg bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-900 transition hover:bg-white active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-zinc-100">
              {busy ? "Authenticating..." : "Authorize Access"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-[11px] text-zinc-600">
          <span>Protected Infrastructure • ER:LC API Gateway</span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, mobileOpen, close }: { page: Page; setPage: (p: Page) => void; mobileOpen: boolean; close: () => void }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={close} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800/80 bg-[#0c0c0e] p-4 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-900 text-xs">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white tracking-tight">PrestonHQ</span>
            <span className="text-[10px] text-zinc-500">ER:LC Control Center</span>
          </div>
        </div>
        <div className="my-4 h-px bg-zinc-800/60" />
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === page;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${active ? "bg-zinc-800/80 text-white shadow-sm" : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"}`}>
                <Icon className={`h-4 w-4 ${active ? "text-zinc-100" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> High-Level Audit Active
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">All administrative operations are permanently logged and verified.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ page, onMenu, serverData, onRefresh, lastSyncedAt }: { page: Page; onMenu: () => void; serverData: ServerState; onRefresh: () => void; lastSyncedAt: string | null }) {
  const currentNav = navItems.find((item) => item.id === page);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-zinc-800/80 bg-[#09090b]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button onClick={onMenu} className="mr-3 rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:text-white lg:hidden">
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        <span>Console</span>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
        <span className="text-zinc-100">{currentNav?.label}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {lastSyncedAt && <div className="hidden text-[10px] text-zinc-600 md:block">Synced <LiveRelativeTime value={lastSyncedAt} /></div>}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span><AnimatedNumber value={serverData.players} />/<AnimatedNumber value={serverData.maxPlayers} /> Online</span>
        </div>
        <button onClick={onRefresh} className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
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
  const [settings, setSettings] = useState({ broadcastCadToServer: true, ingestModCalls: true, eventWebhookEnabled: true, autoRefreshSeconds: 15 });
  const [eventWebhook, setEventWebhook] = useState<{ configured: boolean; url: string | null }>({ configured: false, url: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<any>("/api/erlc/dashboard-config")
      .then((response) => {
        setSettings((current) => ({ ...current, ...(response.settings || {}) }));
        setEventWebhook(response.eventWebhook || { configured: false, url: null });
      })
      .catch((error) => showToast(error instanceof Error ? error.message : "Settings sync failed."));
  }, [showToast]);

  const save = async () => {
    setBusy(true);
    try {
      const response = await api<any>("/api/erlc/dashboard-config", { method: "PATCH", body: JSON.stringify({ settings }) });
      setSettings((current) => ({ ...current, ...(response.settings || {}) }));
      showToast("Dashboard settings saved permanently.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const switchSetting = (key: "broadcastCadToServer" | "ingestModCalls" | "eventWebhookEnabled") => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Card>
      <CardHeader title="System Settings" icon={<Settings className="h-4 w-4 text-zinc-400" />} action={<Button disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : "Save Settings"}</Button>} />
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <div>
            <div className="text-xs font-medium text-white">Broadcast CAD Calls In Game</div>
            <div className="text-[11px] text-zinc-500">Send newly created dashboard calls through the live ER:LC command API.</div>
          </div>
          <button onClick={() => switchSetting("broadcastCadToServer")} className={`relative h-6 w-11 rounded-full transition ${settings.broadcastCadToServer ? "bg-emerald-500" : "bg-zinc-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${settings.broadcastCadToServer ? "left-6" : "left-1"}`} /></button>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <div>
            <div className="text-xs font-medium text-white">Automatic In-Game Call Intake</div>
            <div className="text-[11px] text-zinc-500">Import only new ER:LC mod calls after the first baseline sync.</div>
          </div>
          <button onClick={() => switchSetting("ingestModCalls")} className={`relative h-6 w-11 rounded-full transition ${settings.ingestModCalls ? "bg-emerald-500" : "bg-zinc-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${settings.ingestModCalls ? "left-6" : "left-1"}`} /></button>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-white">ER:LC Event Log Webhook</div>
              <div className="text-[11px] text-zinc-500">Receives new 911 and emergency events without exposing dashboard credentials.</div>
            </div>
            <button onClick={() => switchSetting("eventWebhookEnabled")} className={`rounded border px-2 py-1 text-[10px] font-semibold ${eventWebhook.configured && settings.eventWebhookEnabled ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>{!eventWebhook.configured ? "NOT CONFIGURED" : settings.eventWebhookEnabled ? "ENABLED" : "DISABLED"}</button>
          </div>
          {eventWebhook.url && <div className="mt-3 flex gap-2"><input readOnly value={eventWebhook.url} className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-400 outline-none" /><Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(eventWebhook.url || ""); showToast("Webhook URL copied."); }}>Copy URL</Button></div>}
        </div>
      </div>
    </Card>
  );
}

const tireFieldClass = "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
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
  if (value === "mount") return "Mount";
  if (value === "plug") return "Plug";
  if (value === "rotation") return "Rotation";
  if (value === "brakes") return "Brakes";
  return "Tire Sale";
}

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

function monthKeyLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
}

function paymentMethodTotal(sales: TireSale[], method: string) {
  return sales
    .filter((sale) => String(sale.paymentMethod || "").toLowerCase() === method.toLowerCase())
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0);
}

function physicalTireCount(sales: TireSale[]) {
  return sales.reduce((sum, sale) => {
    if ((sale.serviceType || "tire") !== "tire") return sum;
    return sum + Number(sale.quantity || 0);
  }, 0);
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

function TireStat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[11px] text-zinc-500">{detail}</div>
    </div>
  );
}

function TireInventoryPage({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  const blank = { size: "", packageType: "set4", quantity: "", price: "" };
  const [data, setData] = useState<TireShopData | null>(null);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

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
      showToast(editingId ? "Inventory item updated." : "Tire added to inventory.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Inventory item could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const editItem = (item: TireInventoryItem) => {
    setEditingId(item.id);
    setForm({ size: item.size, packageType: item.packageType || "single", quantity: String(item.quantity), price: String(item.price) });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const inventory = (data?.inventory || []).filter((item) => `${item.size} ${tirePackageLabel(item.packageType)}`.toLowerCase().includes(search.toLowerCase()));
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="text-2xl font-semibold tracking-tight text-white">Tire Inventory</h1><p className="mt-1 text-xs text-zinc-400">Every tire in stock, with live quantities and pricing. No separate PIN required.</p></div>
        <Button variant="secondary" onClick={() => setPage("tire-sales")}><ShoppingCart className="h-3.5 w-3.5" /> Open Tire Sales</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TireStat label="Tire types" value={summary?.skus || 0} detail="Active inventory lines" />
        <TireStat label="Inventory quantity" value={summary?.units || 0} detail="Sets, pairs, and individual tires" />
        <TireStat label="Low stock" value={summary?.lowStock || 0} detail="Five or fewer remaining" />
        <TireStat label="Retail value" value={money(summary?.inventoryValue || 0)} detail="Current price × quantity" />
      </div>
      <Card>
        <CardHeader title={editingId ? "Edit Inventory Item" : "Add Inventory Item"} icon={<Package className="h-4 w-4 text-emerald-400" />} />
        <form onSubmit={saveItem} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-[11px] font-medium text-zinc-400">Size<input required name="size" value={form.size} onChange={updateField} placeholder="275/60R20" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Sold as<select name="packageType" value={form.packageType} onChange={(event) => setForm((current) => ({ ...current, packageType: event.target.value }))} className={`mt-1.5 ${tireFieldClass}`}><option value="set4">Set of 4</option><option value="pair">Pair (2)</option><option value="single">Individual</option></select></label>
          <label className="text-[11px] font-medium text-zinc-400">Quantity<input required min="0" step="1" type="number" name="quantity" value={form.quantity} onChange={updateField} placeholder="4" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Selling price<input required min="0" step="0.01" type="number" name="price" value={form.price} onChange={updateField} placeholder="0.00" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button disabled={busy} className="rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-50">{busy ? "Saving..." : editingId ? "Save Changes" : "Add to Inventory"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank); }} className="rounded-lg px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white">Cancel</button>}
          </div>
        </form>
      </Card>
      <Card>
        <CardHeader title="All Inventory" icon={<Package className="h-4 w-4 text-zinc-400" />} action={<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inventory..." className="w-44 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-500 sm:w-64" />} />
        {!data ? <EmptyState title="Loading inventory" text="Reading the tire shop database..." /> : inventory.length === 0 ? <EmptyState title="No tires found" text={search ? "Try another search." : "Use the form above to enter your first inventory item."} /> : (<>
          <div className="mt-4 space-y-3 sm:hidden">
            {inventory.map((item) => <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-base font-semibold text-white">{item.size}</div><span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></div><div className="text-right"><div className={`text-lg font-semibold ${item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity}</div><div className="text-[10px] text-zinc-500">{tirePackageLabel(item.packageType, true)}</div></div></div><div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3"><div><div className="text-[10px] uppercase tracking-wider text-zinc-600">Selling price</div><div className="mt-0.5 font-semibold text-zinc-200">{money(item.price)}</div></div><div className="flex gap-2"><button onClick={() => editItem(item)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200">Edit</button><button disabled={busy} onClick={() => void removeItem(item)} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400">Remove</button></div></div></article>)}
          </div>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-zinc-800 sm:block">
            <table className="w-full min-w-[640px] text-left text-xs"><thead className="border-b border-zinc-800 bg-zinc-950/70 text-[10px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Tire Size</th><th className="px-4 py-3">Sold As</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Price</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-zinc-800/70">{inventory.map((item) => <tr key={item.id} className="hover:bg-zinc-900/60"><td className="px-4 py-3 font-mono font-semibold text-white">{item.size}</td><td className="px-4 py-3"><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></td><td className="px-4 py-3"><div className={`font-semibold ${item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity} <span className="text-[10px] font-normal text-zinc-500">{tirePackageLabel(item.packageType, true)}</span></div></td><td className="px-4 py-3 font-semibold text-zinc-200">{money(item.price)}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><button onClick={() => editItem(item)} className="rounded-md border border-zinc-700 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white">Edit</button><button disabled={busy} onClick={() => void removeItem(item)} className="rounded-md border border-red-500/20 px-3 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10">Remove</button></div></td></tr>)}</tbody>
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"><Eye className="h-3 w-3" /> Read only</div><h1 className="text-2xl font-semibold tracking-tight text-white">Inventory View</h1><p className="mt-1 text-xs text-zinc-400">A clean list of what is available and the current selling price.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"><RefreshCw className="h-3.5 w-3.5" /> Refresh Stock</button></div>
      <div className="grid gap-4 sm:grid-cols-3"><TireStat label="Inventory types" value={summary?.skus || 0} detail="Sizes and package types" /><TireStat label="Available quantity" value={summary?.units || 0} detail="Sets, pairs, and individuals" /><TireStat label="Low stock" value={summary?.lowStock || 0} detail="Five or fewer remaining" /></div>
      <Card>
        <CardHeader title="Available Inventory" icon={<Package className="h-4 w-4 text-zinc-400" />} action={<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tire size..." className="w-40 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-500 sm:w-64" />} />
        {!data ? <EmptyState title="Loading inventory" text="Reading current stock..." /> : inventory.length === 0 ? <EmptyState title="No tires found" text={search ? "Try another tire size." : "There is no inventory to display yet."} /> : <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{inventory.map((item) => <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-lg font-semibold text-white">{item.size}</div><span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></div><div className="text-right"><div className={`text-2xl font-semibold ${item.quantity === 0 ? "text-red-400" : item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity}</div><div className="text-[10px] text-zinc-500">available</div></div></div><div className="mt-4 flex items-end justify-between border-t border-zinc-800 pt-3"><div><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Selling price</div><div className="mt-1 text-lg font-semibold text-zinc-100">{money(item.price)}</div></div><div className={`rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${item.quantity === 0 ? "bg-red-500/10 text-red-400" : item.quantity <= 5 ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}>{item.quantity === 0 ? "Out of stock" : item.quantity <= 5 ? "Low stock" : "In stock"}</div></div></article>)}</div>}
      </Card>
    </div>
  );
}

function TireSalesPage({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  const [data, setData] = useState<TireShopData | null>(null);
  const [form, setForm] = useState({ serviceType: "tire", inventoryId: "", quantity: "1", unitPrice: "", soldDate: easternDateKey(new Date()), soldTime: easternTimeValue(), customer: "", paymentMethod: "Cash", notes: "", adjustInventory: true });
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPickerOpen, setInventoryPickerOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentPeriod, setPaymentPeriod] = useState<"today" | "month">("today");
  const [selectedPayment, setSelectedPayment] = useState<"Cash" | "Cashapp" | "Chime">("Cash");

  const load = useCallback(async () => {
    try { setData(await api<TireShopData>("/api/tire-shop")); }
    catch (error) { showToast(error instanceof Error ? error.message : "Sales could not be loaded."); }
  }, [showToast]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let currentDay = easternDateKey(new Date());
    const timer = window.setInterval(() => {
      const nextDay = easternDateKey(new Date());
      if (nextDay !== currentDay) {
        setForm((current) => current.soldDate === currentDay ? { ...current, soldDate: nextDay, soldTime: easternTimeValue(), adjustInventory: current.serviceType === "tire" } : current);
        currentDay = nextDay;
      }
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

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
  const paymentSales = paymentPeriod === "today" ? todaySales : monthSales;
  const selectedPaymentTotal = paymentMethodTotal(paymentSales, selectedPayment);
  const currentMonthLabel = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", year: "numeric" });
  const currentSaleTotal = Math.max(0, Number(form.unitPrice) || 0);
  const isTireSale = form.serviceType === "tire";
  const isCurrentTireSale = isTireSale && form.soldDate === todayKey;
  const tireSelectionMissing = isTireSale && (isCurrentTireSale ? !form.inventoryId : !inventorySearch.trim());
  const inventoryMatches = (data?.inventory || []).filter((item) => {
    if (form.adjustInventory && item.quantity <= 0 && item.id !== form.inventoryId) return false;
    const query = inventorySearch.trim().toLowerCase();
    return !query || `${item.size} ${tirePackageLabel(item.packageType)}`.toLowerCase().includes(query);
  }).slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight text-white">Sales & Services</h1><p className="mt-1 text-xs text-zinc-400">Record tire sales, mounts, plugs, rotations, and brake work.</p></div><Button variant="secondary" onClick={() => setPage("tire-inventory")}><Package className="h-3.5 w-3.5" /> Open Inventory</Button></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5"><TireStat label="Today's revenue" value={money(summary?.todayRevenue || 0)} detail="Calculated automatically" /><TireStat label="Tires sold today" value={todayTiresSold} detail="Physical tires" /><TireStat label="Jobs / items" value={summary?.todayUnits || 0} detail="Today's quantity" /><TireStat label="Transactions" value={todaySales.length} detail="Work recorded today" /><TireStat label="Average sale" value={money(averageSale)} detail="Revenue per transaction" /></div>
      <section className="rounded-xl border border-emerald-500/15 bg-emerald-500/[.04] p-4 sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">This Month</div><h2 className="mt-1 text-lg font-semibold text-white">{currentMonthLabel}</h2></div><div className="text-right"><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Monthly revenue</div><div className="mt-1 text-2xl font-semibold tracking-tight text-emerald-300">{money(monthRevenue)}</div></div></div><div className="grid grid-cols-2 gap-3 border-t border-emerald-500/10 pt-4 sm:grid-cols-4"><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Tires sold</div><div className="mt-1 text-base font-semibold text-emerald-300">{monthTiresSold}</div></div><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Jobs / items</div><div className="mt-1 text-base font-semibold text-zinc-200">{monthItems}</div></div><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Transactions</div><div className="mt-1 text-base font-semibold text-zinc-200">{monthSales.length}</div></div><div><div className="text-[9px] uppercase tracking-wider text-zinc-600">Average sale</div><div className="mt-1 text-base font-semibold text-zinc-200">{money(monthAverage)}</div></div></div></section>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Payment totals</div><div className="mt-1 text-sm font-semibold text-white">{paymentPeriod === "today" ? "Today" : currentMonthLabel}</div></div><div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1"><button onClick={() => setPaymentPeriod("today")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${paymentPeriod === "today" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>Today</button><button onClick={() => setPaymentPeriod("month")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${paymentPeriod === "month" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>This Month</button></div></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">{(["Cash", "Cashapp", "Chime"] as const).map((method) => <button key={method} onClick={() => setSelectedPayment(method)} className={`rounded-xl border p-3 text-left transition ${selectedPayment === method ? "border-emerald-500/35 bg-emerald-500/10" : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"}`}><div className={`text-[10px] font-semibold uppercase tracking-wider ${selectedPayment === method ? "text-emerald-400" : "text-zinc-500"}`}>{method}</div><div className="mt-1 text-xl font-semibold text-white">{money(paymentMethodTotal(paymentSales, method))}</div></button>)}</div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2.5 text-xs"><span className="text-zinc-500">Selected: {selectedPayment}</span><span className="font-semibold text-emerald-300">{money(selectedPaymentTotal)}</span></div>
      </section>
      <Card>
        <CardHeader title={editingSaleId ? "Edit Work Entry" : "Record Work"} icon={<ShoppingCart className="h-4 w-4 text-emerald-400" />} action={<div className="text-right"><div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Total</div><div className="text-sm font-semibold text-emerald-300">{money(currentSaleTotal)}</div></div>} />
        <form onSubmit={recordSale} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-[11px] font-medium text-zinc-400 sm:col-span-2">Work performed<select value={form.serviceType} onChange={(event) => { const serviceType = event.target.value; setInventorySearch(""); setInventoryPickerOpen(false); setForm((current) => ({ ...current, serviceType, inventoryId: "", unitPrice: "", adjustInventory: serviceType === "tire" && current.soldDate === easternDateKey(new Date()) })); }} className={`mt-1.5 ${tireFieldClass}`}><option value="tire">Tire Sale</option><option value="mount">Mount</option><option value="plug">Plug</option><option value="rotation">Rotation</option><option value="brakes">Brakes</option></select></label>
          {isTireSale && <label className="relative text-[11px] font-medium text-zinc-400 sm:col-span-2">Tire size<input required autoComplete="off" value={inventorySearch} onFocus={() => setInventoryPickerOpen(true)} onBlur={() => window.setTimeout(() => setInventoryPickerOpen(false), 180)} onChange={(event) => { setInventorySearch(event.target.value); setInventoryPickerOpen(true); setForm((current) => ({ ...current, inventoryId: "", unitPrice: "" })); }} placeholder="Type a size, like 185/65/14" className={`mt-1.5 ${tireFieldClass}`} /><span className="mt-1 block text-[10px] font-normal text-zinc-600">{isCurrentTireSale ? "Today's sales must match an in-stock tire below." : "For an old sale, type any tire size—even if it is not in inventory."}</span>{inventoryPickerOpen && <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl">{inventoryMatches.length ? inventoryMatches.map((item) => <button type="button" key={item.id} onPointerDown={(event) => event.preventDefault()} onClick={() => selectInventory(item.id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-zinc-800"><span><span className="block font-mono text-xs font-semibold text-white">{item.size}</span><span className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[9px] font-semibold ${tirePackageClass(item.packageType)}`}>{tirePackageLabel(item.packageType)}</span></span><span className="shrink-0 text-right"><span className={`block text-xs font-semibold ${item.quantity <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{item.quantity} available</span><span className="mt-0.5 block text-[10px] text-zinc-500">{money(item.price)}</span></span></button>) : <div className="px-3 py-5 text-center text-xs text-zinc-500">{isCurrentTireSale ? "No matching in-stock tire found." : "No inventory match. Your typed size will still be saved with this old sale."}</div>}</div>}</label>}
          <label className="text-[11px] font-medium text-zinc-400">Quantity<input required min="1" step="1" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Total charged<input required min="0" step="0.01" type="number" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} placeholder="Full amount charged" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Date<input required type="date" max={easternDateKey(new Date())} value={form.soldDate} onChange={(event) => setForm((current) => ({ ...current, soldDate: event.target.value, adjustInventory: current.serviceType === "tire" && event.target.value === easternDateKey(new Date()) }))} className={`mt-1.5 ${tireFieldClass}`} /><span className="mt-1 block text-[10px] font-normal text-zinc-600">Past dates are allowed.</span></label>
          <label className="text-[11px] font-medium text-zinc-400">Sale time<input required type="time" value={form.soldTime} onChange={(event) => setForm((current) => ({ ...current, soldTime: event.target.value }))} className={`mt-1.5 ${tireFieldClass}`} /><span className="mt-1 block text-[10px] font-normal text-zinc-600">New sales use the actual current time.</span></label>
          <label className="text-[11px] font-medium text-zinc-400">Customer / invoice<input value={form.customer} onChange={(event) => setForm((current) => ({ ...current, customer: event.target.value }))} placeholder="Optional" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <label className="text-[11px] font-medium text-zinc-400">Payment<select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} className={`mt-1.5 ${tireFieldClass}`}><option>Cash</option><option>Cashapp</option><option>Chime</option></select></label>
          <label className="text-[11px] font-medium text-zinc-400">Notes<input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional" className={`mt-1.5 ${tireFieldClass}`} /></label>
          <div className={`rounded-lg border p-3 sm:col-span-2 lg:col-span-4 ${isTireSale && form.soldDate === easternDateKey(new Date()) ? "border-emerald-500/20 bg-emerald-500/10" : "border-blue-500/20 bg-blue-500/10"}`}><div className={`text-xs font-medium ${isTireSale && form.soldDate === easternDateKey(new Date()) ? "text-emerald-300" : "text-blue-300"}`}>{!isTireSale ? `${workTypeLabel(form.serviceType)} service — tire inventory will not change` : form.soldDate === easternDateKey(new Date()) ? "Today's tire sale — inventory will be reduced automatically" : "Past tire sale — current inventory will not be changed"}</div><div className="mt-1 text-[10px] leading-relaxed text-zinc-500">{!isTireSale ? "This job is saved in daily and monthly revenue totals without removing tires." : form.soldDate === easternDateKey(new Date()) ? "The quantity sold will be removed from this tire size." : "Your inventory is already current, so older sales are saved only in history."}</div></div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button disabled={busy || tireSelectionMissing || !form.unitPrice} className="rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-40">{busy ? "Saving..." : editingSaleId ? "Save Changes" : `Record ${workTypeLabel(form.serviceType)} — ${money(currentSaleTotal)}`}</button>{editingSaleId && <button type="button" onClick={() => { setEditingSaleId(null); setInventorySearch(""); setForm((current) => ({ ...current, inventoryId: "", quantity: "1", unitPrice: "", soldTime: easternTimeValue(), customer: "", notes: "" })); }} className="rounded-lg px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white">Cancel</button>}</div>
        </form>
      </Card>
      <Card>
        <CardHeader title="Daily Work History" icon={<ClipboardList className="h-4 w-4 text-zinc-400" />} />
        {!data ? <EmptyState title="Loading work history" text="Reading saved sales and services..." /> : groups.length === 0 ? <EmptyState title="No work recorded" text="Your daily sales and service history will appear here." /> : <div className="mt-4 space-y-5">{groups.map(([date, sales]) => { const revenue = sales.reduce((sum, sale) => sum + sale.total, 0); const units = sales.reduce((sum, sale) => sum + sale.quantity, 0); return <section key={date} className="overflow-hidden rounded-xl border border-zinc-800"><div className="flex flex-col justify-between gap-2 border-b border-zinc-800 bg-zinc-950/70 px-4 py-3 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold text-white">{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div><div className="mt-0.5 text-[10px] text-zinc-500">{sales.length} transaction{sales.length === 1 ? "" : "s"} • {units} job/item{units === 1 ? "" : "s"}</div></div><div className="text-lg font-semibold text-emerald-300">{money(revenue)}</div></div><div className="divide-y divide-zinc-800/70">{sales.map((sale) => { const isTire = (sale.serviceType || "tire") === "tire"; return <div key={sale.id} className="grid gap-3 px-4 py-3 text-xs sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><div className="flex items-center gap-2"><span className={`font-semibold text-zinc-200 ${isTire ? "font-mono" : ""}`}>{isTire ? sale.size : workTypeLabel(sale.serviceType)}</span><span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${isTire ? tirePackageClass(sale.packageType) : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"}`}>{isTire ? tirePackageLabel(sale.packageType) : "Service"}</span></div><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500"><span>{new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} • {sale.customer || "Walk-in"} • {sale.paymentMethod} • Recorded by {sale.recordedBy}</span><span className={`rounded border px-1.5 py-0.5 ${isTire && sale.adjustInventory !== false ? "border-zinc-700 text-zinc-500" : "border-blue-500/20 bg-blue-500/10 text-blue-300"}`}>{isTire ? sale.adjustInventory === false ? "Historical entry" : "Stock adjusted" : "Inventory unchanged"}</span></div></div><div className="text-zinc-400">{sale.quantity} {isTire ? tirePackageLabel(sale.packageType, sale.quantity !== 1) : workTypeLabel(sale.serviceType)}</div><div className="font-semibold text-white sm:text-right">{money(sale.total)} total</div><div className="flex gap-2 sm:justify-end"><button onClick={() => editSale(sale)} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800">Edit</button><button disabled={busy} onClick={() => void removeSale(sale)} className="rounded-md border border-red-500/20 px-2.5 py-1.5 text-[10px] font-medium text-red-400 hover:bg-red-500/10">Remove</button></div></div>; })}</div></section>; })}</div>}
      </Card>
    </div>
  );
}

function TireSalesReportPage({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  const currentMonthKey = easternDateKey(new Date()).slice(0, 7);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [data, setData] = useState<TireShopData | null>(null);

  const load = useCallback(async () => {
    try { setData(await api<TireShopData>("/api/tire-shop")); }
    catch (error) { showToast(error instanceof Error ? error.message : "Tire sales could not be loaded."); }
  }, [showToast]);
  useEffect(() => { void load(); }, [load]);

  const sales = (data?.sales || []).filter((sale) => (sale.serviceType || "tire") === "tire" && easternDateKey(sale.soldAt).slice(0, 7) === monthKey);
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const quantity = physicalTireCount(sales);
  const average = sales.length ? revenue / sales.length : 0;
  const days = Object.entries(sales.reduce<Record<string, TireSale[]>>((result, sale) => {
    const day = easternDateKey(sale.soldAt);
    (result[day] ||= []).push(sale);
    return result;
  }, {})).sort(([a], [b]) => b.localeCompare(a));
  const canGoForward = monthKey < currentMonthKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-white">Monthly Tire Sales</h1><p className="mt-1 text-xs text-zinc-400">Tire sales only. Services are excluded from this report.</p></div><Button variant="secondary" onClick={() => setPage("tire-sales")}><ShoppingCart className="h-3.5 w-3.5" /> Record Sale</Button></div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><button aria-label="Previous month" onClick={() => setMonthKey((current) => shiftMonthKey(current, -1))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-600 hover:text-white"><ChevronRight className="h-5 w-5 rotate-180" /></button><div className="min-w-0 text-center"><div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Viewing month</div><h2 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">{monthKeyLabel(monthKey)}</h2></div><button aria-label="Next month" disabled={!canGoForward} onClick={() => setMonthKey((current) => shiftMonthKey(current, 1))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button></div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><TireStat label="Tire revenue" value={money(revenue)} detail={monthKeyLabel(monthKey)} /><TireStat label="Tires sold" value={quantity} detail="Physical tire count" /><TireStat label="Tire transactions" value={sales.length} detail="Services excluded" /><TireStat label="Average sale" value={money(average)} detail="Per transaction" /></div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Payment breakdown</div><div className="mt-3 grid gap-2 sm:grid-cols-3">{(["Cash", "Cashapp", "Chime"] as const).map((method) => <div key={method} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{method}</div><div className="mt-1 text-xl font-semibold text-white">{money(paymentMethodTotal(sales, method))}</div></div>)}</div></section>

      <Card>
        <CardHeader title={`${monthKeyLabel(monthKey)} Tire Sales`} icon={<ClipboardList className="h-4 w-4 text-zinc-400" />} />
        {!data ? <EmptyState title="Loading tire sales" text="Reading saved monthly records..." /> : days.length === 0 ? <EmptyState title="No tire sales this month" text="Use the arrows to check another month." /> : <div className="mt-4 space-y-4">{days.map(([date, daySales]) => { const dayTotal = daySales.reduce((sum, sale) => sum + sale.total, 0); const dayTires = physicalTireCount(daySales); return <section key={date} className="overflow-hidden rounded-xl border border-zinc-800"><div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/70 px-4 py-3"><div><div className="text-sm font-semibold text-white">{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div><div className="mt-0.5 text-[10px] text-zinc-500">{dayTires} tire{dayTires === 1 ? "" : "s"} sold • {daySales.length} transaction{daySales.length === 1 ? "" : "s"}</div></div><div className="text-base font-semibold text-emerald-300">{money(dayTotal)}</div></div><div className="divide-y divide-zinc-800/70">{daySales.map((sale) => <div key={sale.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono font-semibold text-zinc-200">{sale.size}</span><span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${tirePackageClass(sale.packageType)}`}>{tirePackageLabel(sale.packageType)}</span></div><div className="mt-1 text-[10px] text-zinc-500">{new Date(sale.soldAt).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} • {sale.customer || "Walk-in"} • {sale.paymentMethod}</div></div><div className="text-zinc-400">{physicalTireCount([sale])} tire{physicalTireCount([sale]) === 1 ? "" : "s"}</div><div className="font-semibold text-white sm:text-right">{money(sale.total)}</div></div>)}</div></section>; })}</div>}
      </Card>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-5 right-5 z-50 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-200 shadow-xl">
      {message}
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 backdrop-blur-xl">{children}</div>;
}

function CardHeader({ title, icon, action }: { title: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Button({ children, variant = "primary", onClick, disabled, className = "" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; disabled?: boolean; className?: string }) {
  const styles = {
    primary: "bg-zinc-100 text-zinc-900 hover:bg-white",
    secondary: "border border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/40",
    danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition active:scale-[0.99] disabled:opacity-40 ${styles[variant]} ${className}`}>
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
    <footer className="mt-auto border-t border-zinc-800/80 bg-[#09090b] py-4 text-center text-[11px] text-zinc-500">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div>PrestonHQ &copy; 2026. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-zinc-300 transition">Privacy Policy</a>
          <a href="/terms" className="hover:text-zinc-300 transition">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default App;
