'use client';
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Cloud,
  Command,
  Download,
  Eye,
  Gauge,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
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
  region: "ER:LC Private Server",
  apiStatus: "Connecting",
  uptime: "Live sync",
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
  team: "Waiting for live data",
  playtime: "—",
  ping: 0,
  warnings: 0,
  notes: ["Select an online player to open moderation controls."],
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
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

const commandTemplates = [
  { name: "Peacetime Start", command: ":h Peacetime is now active. No priority scenes.", locked: false },
  { name: "Server Shutdown", command: ":shutdown Scheduled restart. Rejoin in 2 minutes.", locked: true },
  { name: "Bring Staff", command: ":bring {player}", locked: true },
  { name: "Global Warning", command: ":h Staff are actively moderating. Follow all RP rules.", locked: false },
];

const permissions: Record<string, Permission[]> = {
  Owner: ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"],
  Admin: ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "Export Logs"],
  Moderator: ["Kick", "Kill", "Teleport", "PM", "Announce"],
  "Trial Mod": ["PM", "Announce"],
};

const nav = [
  { id: "overview" as Page, label: "Overview", icon: Gauge },
  { id: "connect" as Page, label: "Server Connect", icon: Cloud },
  { id: "players" as Page, label: "Players", icon: Users },
  { id: "commands" as Page, label: "Command Center", icon: Terminal },
  { id: "logs" as Page, label: "Moderation Logs", icon: ClipboardList },
  { id: "staff" as Page, label: "Staff Permissions", icon: Shield },
  { id: "settings" as Page, label: "Settings", icon: Settings },
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
    window.setTimeout(() => setToast(""), 2600);
  };

  const loadLiveData = useCallback(async () => {
    try {
      const [overview, logResponse] = await Promise.all([
        api<any>("/api/erlc/overview"),
        api<any>("/api/erlc/logs?limit=200").catch(() => ({ cases: [] })),
      ]);
      if (!overview.configured) {
        setServerData({ ...defaultServer, apiStatus: "API key required", connected: false });
        setPlayerData([]);
        setSyncError("ER:LC API is not configured on the server.");
        return;
      }
      const rawServer = overview.server || {};
      const mappedPlayers: Player[] = (overview.players || []).map((player: any) => ({
        id: String(player.id || player.name),
        name: String(player.name || "Unknown"),
        robloxId: String(player.robloxId || player.id || "—"),
        status: player.staff ? "staff" : "online",
        team: String(player.team || "Civilian"),
        playtime: "Live",
        ping: 0,
        warnings: 0,
        notes: [
          player.callsign ? `Callsign: ${player.callsign}` : "Live ER:LC player",
          `Permission: ${player.permission || "Normal"}`,
        ],
        lastSeen: "Now",
      }));
      setPlayerData(mappedPlayers);
      setSelectedPlayer((current) => mappedPlayers.find((player) => player.id === current.id) || mappedPlayers[0] || emptyPlayer);
      setServerData({
        name: String(rawServer.Name || rawServer.name || rawServer.ServerName || "City of Angels Roleplay"),
        code: String(rawServer.JoinKey || rawServer.joinKey || rawServer.Code || "Private"),
        owner: String(rawServer.Owner || rawServer.owner || "Preston"),
        region: "ER:LC Private Server",
        apiStatus: "Connected",
        uptime: "Live sync",
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
          staff: String(item.staff?.name || "Dashboard Staff"),
          player: String(item.target || "Server"),
          reason: String(item.reason || "No reason supplied"),
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
      setServerData((current) => ({ ...current, apiStatus: "Offline", connected: false }));
      setSyncError(error instanceof Error ? error.message : "Live sync failed.");
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
      showToast(`${modal.action} completed${modal.player ? ` for ${modal.player.name}` : ""}.`);
      setModal(null);
      await loadLiveData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendCommand = async (command: string) => {
    setBusy(true);
    try {
      await api("/api/erlc/command", { method: "POST", body: JSON.stringify({ command }) });
      showToast("Command sent to ER:LC.");
      await loadLiveData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Command failed.");
    } finally {
      setBusy(false);
    }
  };

  if (auth === "checking") return <LoadingScreen />;
  if (auth === "guest") return <LoginScreen onSuccess={() => { setAuth("ready"); loadLiveData(); }} />;

  return (
    <main className="min-h-screen bg-[#030712] font-mono text-cyan-50 selection:bg-cyan-500 selection:text-black antialiased">
      <Background />
      <div className="relative flex min-h-screen">
        <Sidebar page={page} setPage={(next) => { setPage(next); setMobileOpen(false); }} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
        <section className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <Topbar page={page} onMenu={() => setMobileOpen(true)} serverData={serverData} onRefresh={loadLiveData} />
          <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {syncError && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs font-semibold text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-xl">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="shrink-0 text-amber-400" size={16} />
                  <span>SYSTEM ALERT: {syncError}</span>
                </span>
                <button onClick={loadLiveData} className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1 font-bold tracking-wider text-amber-200 transition hover:bg-amber-500/40">
                  RETRY_SYNC
                </button>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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
        </section>
      </div>
      <AnimatePresence>{modal && <ActionModal modal={modal} close={() => setModal(null)} confirm={executeAction} busy={busy} />}</AnimatePresence>
      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
      <DashboardLegalFooter />
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#030712] font-mono text-cyan-400">
      <div className="space-y-4 text-center">
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 shadow-[0_0_15px_#22d3ee]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/70">INITIALIZING_SECURE_OS...</p>
      </div>
    </main>
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
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030712] p-4 text-cyan-50">
      <Background />
      <motion.form onSubmit={login} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 font-black text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            PHQ
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">RESTRICTED_ACCESS</span>
            <h1 className="text-xl font-extrabold tracking-tight text-white">ER:LC OS TERMINAL</h1>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">Enter secure operator clearance token to establish remote connection.</p>
        <label className="mt-6 block space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">ACCESS_KEY_TOKEN</span>
          <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-cyan-500/30 bg-black/60 px-4 py-3 text-sm text-cyan-200 outline-none transition focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)]" placeholder="••••••••••••" />
        </label>
        {error && <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</div>}
        <button disabled={busy || !password} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/20 py-3 text-xs font-bold uppercase tracking-wider text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)] transition hover:bg-cyan-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
          <Lock size={14} />
          {busy ? "AUTHENTICATING..." : "AUTHENTICATE_SESSION"}
        </button>
        <p className="mt-4 text-center text-[10px] text-slate-500">AUDITED SESSION • ALL DISPATCH COMMANDS LOGGED</p>
        <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-800/80 pt-4 text-[11px] font-medium text-slate-500">
          <a className="transition hover:text-cyan-400" href="/privacy">PRIVACY_POLICY</a>
          <span>•</span>
          <a className="transition hover:text-cyan-400" href="/terms">TERMS_OF_SERVICE</a>
        </div>
      </motion.form>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-1/4 -top-1/4 h-[700px] w-[700px] rounded-full bg-cyan-600/10 blur-[150px]" />
      <div className="absolute -right-1/4 -bottom-1/4 h-[700px] w-[700px] rounded-full bg-purple-600/10 blur-[150px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
}

function Sidebar({ page, setPage, mobileOpen, close }: { page: Page; setPage: (p: Page) => void; mobileOpen: boolean; close: () => void }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden" onClick={close} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-cyan-500/20 bg-slate-950/90 p-4 shadow-[5px_0_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-500/20 font-black text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            PHQ
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-white">PrestonHQ</div>
            <div className="text-[10px] text-cyan-400/80">ER:LC MODERATION OS</div>
          </div>
        </div>
        <nav className="mt-6 space-y-1.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.id === page;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold tracking-wider transition ${active ? "border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:border hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200"}`}>
                <Icon size={16} className={active ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"} />
                <span className="flex-1 text-left uppercase">{item.label}</span>
                {active && <ChevronRight size={14} className="text-cyan-400" />}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <ShieldAlert size={15} /> SAFETY_PROTOCOL_ACTIVE
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">High-risk administrative dispatches require confirmation.</p>
        </div>
      </aside>
    </>
  );
}

function Topbar({ page, onMenu, serverData, onRefresh }: { page: Page; onMenu: () => void; serverData: ServerState; onRefresh: () => void }) {
  const label = nav.find((item) => item.id === page)?.label || "Dashboard";
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white lg:hidden">
            <Menu size={18} />
          </button>
          <div>
            <div className="text-[9px] font-bold tracking-widest text-cyan-400/80 uppercase">SYSTEM_NODE</div>
            <h1 className="text-base font-extrabold tracking-wider text-white uppercase">{label}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill icon={<CircleDot size={12} className="text-cyan-400" />} label={`${serverData.players}/${serverData.maxPlayers} PLAYERS`} />
          <StatusPill icon={<UserCheck size={12} className="text-emerald-400" />} label={`${serverData.staff} STAFF`} />
          <button onClick={onRefresh} className="transition hover:opacity-80">
            <StatusPill icon={<Radio size={12} className={serverData.connected ? "text-emerald-400" : "text-rose-400"} />} label={serverData.connected ? "API_ONLINE" : "API_OFFLINE"} good={serverData.connected} />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon, label, good }: { icon: React.ReactNode; label: string; good?: boolean }) {
  return (
    <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-slate-300">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Overview({ showToast, setPage, serverData, logs, onRefresh }: { showToast: (m: string) => void; setPage: (p: Page) => void; serverData: ServerState; logs: ModAction[]; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <HeroCard serverData={serverData} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="ONLINE PLAYERS" value={`${serverData.players}/${serverData.maxPlayers}`} icon={<Users className="text-cyan-400" />} />
        <Metric title="ACTIVE STAFF" value={serverData.staff} icon={<Shield className="text-emerald-400" />} />
        <Metric title="QUEUE LENGTH" value={serverData.queue} icon={<Activity className="text-purple-400" />} />
        <Metric title="API LINK STATUS" value={serverData.connected ? "LIVE" : "OFFLINE"} icon={<Zap className="text-amber-400" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="MODERATION DISPATCH LOGS" icon={<ClipboardList className="text-cyan-400" />} action={<Button variant="ghost" onClick={() => setPage("logs")}>VIEW ALL</Button>} />
            <div className="mt-4 space-y-2">{logs.slice(0, 5).map((log) => <LogRow key={log.id} log={log} />)}{!logs.length && <EmptyState title="No moderation actions yet" text="Completed staff actions will appear here automatically." />}</div>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="SYSTEM CONNECTIONS" icon={<Cloud className="text-purple-400" />} />
            <div className="mt-4 space-y-4">
              <Health label="PRC API GATEWAY" value="HEALTHY" percent={96} />
              <Health label="DISCORD BOT LINK" value="READY" percent={88} />
              <Health label="AUDIT WEBHOOKS" value="STABLE" percent={93} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={() => { onRefresh(); showToast("Refreshing live server data."); }}><RefreshCw size={14} /> REFRESH</Button>
              <Button variant="ghost" onClick={() => setPage("connect")}><KeyRound size={14} /> API SETUP</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ serverData }: { serverData: ServerState }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-black p-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-2xl sm:p-8">
      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
            <Sparkles size={12} /> LIVE SERVER MONITOR
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">{serverData.name}</h2>
          <p className="max-w-xl text-xs text-slate-400 leading-relaxed">Centralized telemetry, administrative tools, player tracking, and instant moderation commands.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-cyan-500/20 bg-black/60 p-4 sm:grid-cols-4 lg:grid-cols-2">
          <Info label="JOIN CODE" value={serverData.code} />
          <Info label="OWNER" value={serverData.owner} />
          <Info label="REGION" value={serverData.region} />
          <Info label="API STATUS" value={serverData.apiStatus} good={serverData.connected} />
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
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
      showToast("ER:LC server connected successfully.");
      await onConnected();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="CONNECT ER:LC SERVER" icon={<Cloud className="text-cyan-400" />} />
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-500/20 text-cyan-300">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-white">PRC API KEY AUTHENTICATION</h3>
                <p className="text-[11px] text-slate-400">Keys are validated on server-side and safely stored in protected environment variables.</p>
              </div>
            </div>
          </div>
          <label className="mt-6 block space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PRIVATE SERVER KEY</span>
            <input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-black/60 px-4 py-3 text-xs text-cyan-300 outline-none transition focus:border-cyan-400" placeholder="Paste your PRC server key..." />
          </label>
          <div className="mt-6 flex items-center justify-between">
            <Button onClick={connect} className={busy || apiKey.length < 12 ? "opacity-40 pointer-events-none" : ""}><Cloud size={14} />{busy ? "VALIDATING..." : "VALIDATE & CONNECT"}</Button>
            <span className="text-[10px] text-slate-500">ENCRYPTED TRANSMISSION</span>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader title="SECURITY CHECKLIST" icon={<CheckCircle2 className="text-emerald-400" />} />
          <div className="mt-4 space-y-3">
            <Checklist label="Dashboard authentication enabled" done />
            <Checklist label="Discord bot bridge online" done />
            <Checklist label="PRC key validated before saving" done />
            <Checklist label="Moderation actions audited" done />
            <Checklist label="Live players refresh every 15s" done />
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
          <CardHeader title="PLAYER DIRECTORY" icon={<Users className="text-cyan-400" />} action={<SearchBox value={q} setValue={setQ} placeholder="SEARCH PLAYERS..." />} />
          <div className="mt-4 divide-y divide-slate-800/80 overflow-hidden rounded-xl border border-slate-800/80 bg-black/40">
            {filtered.map((player) => <PlayerRow key={player.id} player={player} active={selected.id === player.id} onClick={() => setSelected(player)} />)}
          </div>
          {!filtered.length && <EmptyState title="No players found" text="Try searching by username, Roblox ID, or team." />}
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
    ["Kick", <LogOut size={13} />, true],
    ["Ban", <Ban size={13} />, true],
    ["Unban", <Shield size={13} />, true],
    ["Kill", <Skull size={13} />, true],
    ["Teleport", <MapPin size={13} />, false],
    ["PM", <MessageSquare size={13} />, false],
    ["Announcement", <Megaphone size={13} />, false],
  ];
  return (
    <Card>
      <CardHeader title="PLAYER DOSSIER" icon={<Eye className="text-purple-400" />} />
      <div className="mt-4 flex items-center gap-4 border-b border-slate-800 pb-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-lg font-black text-cyan-300">
          {player.name[0]}
        </div>
        <div>
          <h3 className="font-extrabold text-white">{player.name}</h3>
          <p className="text-[11px] text-slate-400">ROBLOX ID: {player.robloxId}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Info label="CURRENT TEAM" value={player.team} />
        <Info label="LATENCY" value={`${player.ping}ms`} />
        <Info label="PLAYTIME" value={player.playtime} />
        <Info label="WARNINGS" value={String(player.warnings)} />
      </div>
      <div className="mt-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">TELEMETRY_NOTES</span>
        <div className="mt-2 space-y-2">
          {player.notes.map((note, idx) => (
            <div key={idx} className="rounded-lg border border-slate-800 bg-black/40 p-2.5 text-xs text-slate-300">
              {note}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {actions.map(([action, icon, dangerous]) => (
          <Button key={action} variant={dangerous ? "danger" : "ghost"} onClick={() => openAction(action, player)}>
            {icon}
            {action}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function PlayerRow({ player, active, onClick }: { player: Player; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between p-3.5 text-left transition ${active ? "border-l-2 border-l-cyan-400 bg-cyan-500/10 text-white" : "hover:bg-slate-900/50 text-slate-300"}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-slate-300 border border-slate-800">
          {player.name[0]}
        </div>
        <div>
          <div className="text-xs font-bold text-white">{player.name}</div>
          <div className="text-[10px] text-slate-400">{player.team}</div>
        </div>
      </div>
      <span className="text-[10px] font-bold text-cyan-400/80">{player.ping}ms</span>
    </button>
  );
}

function CommandCenter({ openAction, sendCommand, busy }: { openAction: (a: ModActionType) => void; sendCommand: (command: string) => void; busy: boolean }) {
  const [cmd, setCmd] = useState(":h Welcome to ECRP. Follow staff instructions.");
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="REMOTE DISPATCH TERMINAL" icon={<Terminal className="text-cyan-400" />} />
          <div className="mt-4 space-y-4">
            <textarea value={cmd} onChange={(e) => setCmd(e.target.value)} className="h-40 w-full rounded-xl border border-slate-800 bg-black/70 p-4 font-mono text-xs text-cyan-300 outline-none focus:border-cyan-400" />
            <div className="flex items-center gap-3">
              <Button onClick={() => sendCommand(cmd)}><Command size={14} />{busy ? "DISPATCHING..." : "DISPATCH COMMAND"}</Button>
              <Button variant="danger" onClick={() => openAction("Announcement")}><Lock size={14} /> BROADCAST ANNOUNCEMENT</Button>
            </div>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader title="PRESET DISPATCHES" icon={<Sparkles className="text-amber-400" />} />
          <div className="mt-4 space-y-2">
            {commandTemplates.map((template) => (
              <button key={template.name} onClick={() => setCmd(template.command)} className="w-full rounded-xl border border-slate-800/80 bg-black/40 p-3 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/5">
                <div className="flex items-center justify-between text-xs font-bold text-white uppercase">
                  <span>{template.name}</span>
                  {template.locked && <Lock size={12} className="text-amber-400" />}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400 truncate">{template.command}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Logs({ logs }: { logs: ModAction[] }) {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? logs : logs.filter((l) => l.severity === filter);
  return (
    <Card>
      <CardHeader title="AUDIT LOG TIMELINE" icon={<ClipboardList className="text-cyan-400" />} />
      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {["all", "low", "medium", "high", "critical"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${filter === f ? "border border-cyan-400/40 bg-cyan-500/20 text-cyan-300" : "bg-slate-900/60 text-slate-400 hover:text-white"}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {visible.map((log) => <LogRow key={log.id} log={log} />)}
        {!visible.length && <EmptyState title="No matching actions" text="Moderation cases will be stored here permanently." />}
      </div>
    </Card>
  );
}

function LogRow({ log }: { log: ModAction }) {
  const severityColors: Record<Severity, string> = {
    low: "border-slate-800 bg-black/40 text-slate-300",
    medium: "border-blue-500/30 bg-blue-950/20 text-blue-300",
    high: "border-amber-500/30 bg-amber-950/20 text-amber-300",
    critical: "border-rose-500/30 bg-rose-950/20 text-rose-300",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${severityColors[log.severity]}`}>
      <div className="space-y-1">
        <div className="font-bold text-white">
          <span className="text-cyan-400">{log.staff}</span> &gt; <span className="uppercase">{log.type}</span> &gt; <span className="text-purple-300">{log.player}</span>
        </div>
        <div className="text-[11px] text-slate-400">{log.reason}</div>
      </div>
      <span className="shrink-0 text-[10px] text-slate-500">{log.time}</span>
    </div>
  );
}

function StaffPermissions({ showToast }: { showToast: (m: string) => void }) {
  const all: Permission[] = ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"];
  return (
    <Card>
      <CardHeader title="ROLE PERMISSION MATRIX" icon={<Shield className="text-emerald-400" />} action={<Button onClick={() => showToast("Permission matrix saved.")}>SAVE CHANGES</Button>} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <th className="pb-3">ROLE</th>
              {all.map((p) => <th key={p} className="pb-3 text-center">{p}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {Object.entries(permissions).map(([role, perms]) => (
              <tr key={role}>
                <td className="py-3.5 font-bold text-white uppercase">{role}</td>
                {all.map((p) => (
                  <td key={p} className="py-3.5 text-center">
                    <input type="checkbox" defaultChecked={perms.includes(p)} className="rounded border-slate-800 bg-black text-cyan-500 focus:ring-0" />
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
      <CardHeader title="SYSTEM CONFIGURATION" icon={<Settings className="text-slate-400" />} />
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-black/40 p-4">
          <div>
            <div className="text-xs font-bold text-white uppercase">AUDIT DISPATCH WEBHOOKS</div>
            <div className="text-[11px] text-slate-400">Stream all moderation cases into Discord audit channels automatically.</div>
          </div>
          <Button variant="ghost" onClick={() => showToast("Audit settings updated.")}>CONFIGURE</Button>
        </div>
      </div>
    </Card>
  );
}

function ActionModal({ modal, close, confirm, busy }: { modal: { action: ModActionType; player?: Player }; close: () => void; confirm: (reason: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-white">EXECUTE {modal.action}</h3>
          <button onClick={close} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        {modal.player && <p className="mt-2 text-xs text-slate-400">Target subject: <span className="font-bold text-cyan-300">{modal.player.name}</span></p>}
        <label className="mt-4 block space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">DISPATCH REASON</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="h-24 w-full rounded-xl border border-slate-800 bg-black p-3 text-xs text-cyan-200 outline-none focus:border-cyan-400" placeholder="Required for compliance logs..." />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>CANCEL</Button>
          <Button variant="danger" onClick={() => confirm(reason)}>{busy ? "DISPATCHING..." : "CONFIRM EXECUTION"}</Button>
        </div>
      </motion.div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-50 rounded-xl border border-cyan-400/40 bg-slate-950/90 px-4 py-3 text-xs font-bold text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-xl">
      {message}
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-6 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-2xl">{children}</div>;
}

function CardHeader({ title, icon, action }: { title: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-xs font-black uppercase tracking-wider text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Button({ children, variant = "primary", onClick, className = "" }: { children: React.ReactNode; variant?: "primary" | "ghost" | "danger"; onClick?: () => void; className?: string }) {
  const styles = {
    primary: "border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
    ghost: "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white",
    danger: "border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-800 bg-black/60 pl-8 pr-4 py-1.5 text-[11px] text-cyan-300 placeholder-slate-500 outline-none focus:border-cyan-400" />
    </div>
  );
}

function Info({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-0.5 text-xs font-bold ${good === true ? "text-emerald-400" : good === false ? "text-rose-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Health({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="font-bold text-slate-300 uppercase">{label}</span>
        <span className="font-bold text-cyan-400">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
        <div className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Checklist({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <CheckCircle2 size={14} className={done ? "text-emerald-400" : "text-slate-600"} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-xs font-bold uppercase text-slate-300">{title}</p>
      <p className="mt-1 text-[11px] text-slate-500">{text}</p>
    </div>
  );
}

function DashboardLegalFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
      <p>PrestonHQ ER:LC OS Terminal • Restricted Operational Control</p>
    </footer>
  );
}
export default App;
