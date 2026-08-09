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
  Command,
  Cpu,
  Eye,
  Globe,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Sparkles,
  Terminal,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

type Page = "overview" | "connect" | "players" | "commands" | "logs" | "staff" | "settings";
type Severity = "low" | "medium" | "high" | "critical";
type PlayerStatus = "online" | "flagged" | "banned" | "staff";
type ModActionType = "Warn" | "Kick" | "Ban" | "Unban" | "Kill" | "Teleport" | "PM" | "Announcement";
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
  data?: Array<{
    state?: string;
    imageUrl?: string;
  }>;
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
        const endpoint = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
        endpoint.search = new URLSearchParams({
          userIds: normalizedId,
          size: "150x150",
          format: "Png",
          isCircular: "true",
        }).toString();

        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Roblox thumbnails returned ${response.status}`);

        const payload = (await response.json()) as RobloxThumbnailResponse;
        const thumbnail = payload.data?.[0];
        const nextUrl = thumbnail?.state === "Completed" && thumbnail.imageUrl
          ? thumbnail.imageUrl
          : null;

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
  const size = large ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-slate-700 via-zinc-800 to-zinc-950 shadow-[0_10px_28px_rgba(0,0,0,0.32)] ${size}`}
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
      <span className={`absolute bottom-0 right-0 rounded-full border-2 border-zinc-950 bg-emerald-400 ${large ? "h-4 w-4" : "h-3 w-3"}`} />
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
  { id: "connect" as Page, label: "Server Connect", icon: Server },
  { id: "players" as Page, label: "Players", icon: Users },
  { id: "commands" as Page, label: "Console Dispatch", icon: Terminal },
  { id: "logs" as Page, label: "Audit Logs", icon: ClipboardList },
  { id: "staff" as Page, label: "Staff Matrix", icon: ShieldCheck },
  { id: "settings" as Page, label: "System Settings", icon: Settings },
];

export function App() {
  const [page, setPage] = useState<Page>("overview");
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
      setLogData(
        cases.map((item: any) => ({
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
        }))
      );
      setSyncError(overview.warnings?.[0] || "");
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
    const timer = window.setInterval(loadLiveData, 15000);
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
    <div className="min-h-screen bg-[#09090b] font-sans text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
      <div className="flex min-h-screen">
        <Sidebar page={page} setPage={(next) => { setPage(next); setMobileOpen(false); }} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
        <main className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Topbar page={page} onMenu={() => setMobileOpen(true)} serverData={serverData} onRefresh={loadLiveData} />
          <div className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
            {syncError && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-300">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{syncError}</span>
                </div>
                <button onClick={loadLiveData} className="rounded bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/30">
                  Retry Sync
                </button>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                {page === "overview" && <Overview showToast={showToast} setPage={setPage} serverData={serverData} logs={logData} onRefresh={loadLiveData} />}
                {page === "connect" && <Connect showToast={showToast} onConnected={async () => { await loadLiveData(); setPage("overview"); }} />}
                {page === "players" && <Players players={playerData} selected={selectedPlayer} setSelected={setSelectedPlayer} openAction={(action, player) => setModal({ action, player })} />}
                {page === "commands" && <CommandCenter openAction={(action) => setModal({ action })} sendCommand={sendCommand} busy={busy} />}
                {page === "logs" && <Logs logs={logData} />}
                {page === "staff" && <StaffPermissions showToast={showToast} />}
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

function Topbar({ page, onMenu, serverData, onRefresh }: { page: Page; onMenu: () => void; serverData: ServerState; onRefresh: () => void }) {
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
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{serverData.players}/{serverData.maxPlayers} Online</span>
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
        <Metric title="Active Players" value={`${serverData.players}/${serverData.maxPlayers}`} sub="Capacity" icon={<Users className="h-4 w-4 text-zinc-400" />} />
        <Metric title="Staff Online" value={serverData.staff} sub="Active Administrators" icon={<Shield className="h-4 w-4 text-zinc-400" />} />
        <Metric title="Server Queue" value={serverData.queue} sub="Waiting Connection" icon={<Activity className="h-4 w-4 text-zinc-400" />} />
        <Metric title="API Health" value={serverData.connected ? "100%" : "0%"} sub="Response Time ~24ms" icon={<Zap className="h-4 w-4 text-zinc-400" />} />
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

function Metric({ title, value, sub, icon }: { title: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs font-medium">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white tracking-tight">{value}</div>
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
      <div className="mt-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 to-zinc-950/90 p-4 shadow-inner shadow-black/20 backdrop-blur">
        <div className="flex items-center gap-4">
          <PlayerAvatar player={player} large />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight text-white">{player.name}</h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-zinc-500">Roblox ID · {player.robloxId || "Unavailable"}</p>
            <p className="mt-2 truncate text-xs text-zinc-300">{player.team}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Info label="Team Assignment" value={player.team} />
        <Info label="Ping Latency" value={`${player.ping}ms`} />
        <Info label="Session Time" value={player.playtime} />
        <Info label="Prior Warnings" value={String(player.warnings)} />
      </div>
      <div className="mt-6 space-y-2">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Quick Actions</span>
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
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/70 ${active ? "bg-slate-800/80 text-white shadow-[inset_3px_0_0_#38bdf8]" : "text-zinc-300 hover:bg-white/[0.035]"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-100">{player.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="truncate">{player.team}</span>
            <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-zinc-600" />
            <span className="shrink-0 font-mono">ID {player.robloxId || "—"}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden rounded-full border border-white/[0.06] bg-zinc-950/60 px-2 py-1 font-mono text-[10px] text-zinc-500 sm:inline">
          {player.ping}ms
        </span>
        <ChevronRight className={`h-4 w-4 transition ${active ? "text-sky-300" : "text-zinc-700 group-hover:translate-x-0.5 group-hover:text-zinc-400"}`} />
      </div>
    </button>
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
      <span className="text-[11px] text-zinc-600">{log.time}</span>
    </div>
  );
}

function StaffPermissions({ showToast }: { showToast: (m: string) => void }) {
  const all: Permission[] = ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"];
  return (
    <Card>
      <CardHeader title="Staff Authorization Matrix" icon={<ShieldCheck className="h-4 w-4 text-zinc-400" />} action={<Button onClick={() => showToast("Permissions updated.")}>Save Changes</Button>} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <th className="pb-3">Role</th>
              {all.map((p) => <th key={p} className="pb-3 text-center">{p}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {Object.entries(permissions).map(([role, perms]) => (
              <tr key={role}>
                <td className="py-3 font-medium text-white">{role}</td>
                {all.map((p) => (
                  <td key={p} className="py-3 text-center">
                    <input type="checkbox" defaultChecked={perms.includes(p)} className="rounded border-zinc-800 bg-zinc-950 text-zinc-200 focus:ring-0" />
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

function SettingsPage({ showToast }: { showToast: (m: string) => void }) {
  return (
    <Card>
      <CardHeader title="System Settings" icon={<Settings className="h-4 w-4 text-zinc-400" />} />
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <div>
            <div className="text-xs font-medium text-white">Discord Webhook Stream</div>
            <div className="text-[11px] text-zinc-500">Route all audit events directly to Discord channels.</div>
          </div>
          <Button variant="secondary" onClick={() => showToast("Settings updated.")}>Configure</Button>
        </div>
      </div>
    </Card>
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
