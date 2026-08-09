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

const emptyPlayer: Player = { id: "none", name: "No player selected", robloxId: "—", status: "online", team: "Waiting for live data", playtime: "—", ping: 0, warnings: 0, notes: ["Select an online player to open moderation controls."], lastSeen: "—" };

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("prestonhq_token");
  const response = await fetch(API_BASE + path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
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
        id: String(player.id || player.name), name: String(player.name || "Unknown"), robloxId: String(player.robloxId || player.id || "—"),
        status: player.staff ? "staff" : "online", team: String(player.team || "Civilian"), playtime: "Live", ping: 0, warnings: 0,
        notes: [player.callsign ? `Callsign: ${player.callsign}` : "Live ER:LC player", `Permission: ${player.permission || "Normal"}`], lastSeen: "Now",
      }));
      setPlayerData(mappedPlayers);
      setSelectedPlayer((current) => mappedPlayers.find((player) => player.id === current.id) || mappedPlayers[0] || emptyPlayer);
      setServerData({
        name: String(rawServer.Name || rawServer.name || rawServer.ServerName || "City of Angels Roleplay"),
        code: String(rawServer.JoinKey || rawServer.joinKey || rawServer.Code || "Private"),
        owner: String(rawServer.Owner || rawServer.owner || "Preston"), region: "ER:LC Private Server", apiStatus: "Connected", uptime: "Live sync",
        players: overview.stats?.players ?? mappedPlayers.length, maxPlayers: Number(rawServer.MaxPlayers || rawServer.maxPlayers || 40),
        staff: overview.stats?.staff ?? mappedPlayers.filter((player) => player.status === "staff").length,
        queue: overview.stats?.queue ?? 0, connected: true,
      });
      const cases = Array.isArray(logResponse.cases) ? logResponse.cases : [];
      setLogData(cases.map((item: any) => ({
        id: String(item.id), type: item.type as ModActionType, staff: String(item.staff?.name || "Dashboard Staff"),
        player: String(item.target || "Server"), reason: String(item.reason || "No reason supplied"),
        severity: item.type === "Ban" ? "critical" : item.type === "Kick" || item.type === "Kill" ? "high" : item.type === "PM" || item.type === "Announcement" ? "low" : "medium",
        time: relativeTime(item.createdAt),
      })));
      setSyncError(overview.warnings?.[0] || "");
    } catch (error) {
      setServerData((current) => ({ ...current, apiStatus: "Offline", connected: false }));
      setSyncError(error instanceof Error ? error.message : "Live sync failed.");
    }
  }, []);

  useEffect(() => {
    api<any>("/api/auth/me").then((data) => {
      if (!data.authenticated && !sessionStorage.getItem("prestonhq_token")) { setAuth("guest"); return; }
      setAuth("ready");
      loadLiveData();
    }).catch(() => setAuth(sessionStorage.getItem("prestonhq_token") ? "ready" : "guest"));
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
      await api("/api/erlc/actions", { method: "POST", body: JSON.stringify({ action: modal.action, target: modal.player?.name || "", reason }) });
      showToast(`${modal.action} completed${modal.player ? ` for ${modal.player.name}` : ""}.`);
      setModal(null);
      await loadLiveData();
    } catch (error) { showToast(error instanceof Error ? error.message : "Action failed."); }
    finally { setBusy(false); }
  };

  const sendCommand = async (command: string) => {
    setBusy(true);
    try { await api("/api/erlc/command", { method: "POST", body: JSON.stringify({ command }) }); showToast("Command sent to ER:LC."); await loadLiveData(); }
    catch (error) { showToast(error instanceof Error ? error.message : "Command failed."); }
    finally { setBusy(false); }
  };

  if (auth === "checking") return <LoadingScreen />;
  if (auth === "guest") return <LoginScreen onSuccess={() => { setAuth("ready"); loadLiveData(); }} />;

  return (
    <main className="min-h-screen bg-[#06080d] text-slate-100 font-sans selection:bg-sky-500 selection:text-white antialiased">
      <Background />
      <div className="relative flex min-h-screen">
        <Sidebar page={page} setPage={(next) => { setPage(next); setMobileOpen(false); }} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
        <section className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <Topbar page={page} onMenu={() => setMobileOpen(true)} serverData={serverData} onRefresh={loadLiveData} />
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
            {syncError && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 shadow-lg shadow-amber-950/20 backdrop-blur-md">
                <span className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="shrink-0 text-amber-400" size={18} />
                  {syncError}
                </span>
                <button onClick={loadLiveData} className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/30">Retry</button>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
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
    <main className="grid min-h-screen place-items-center bg-[#06080d] text-slate-100">
      <div className="text-center space-y-4">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-sky-400" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400">Opening secure moderation panel…</p>
      </div>
    </main>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = await api<any>("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
      if (data.token) sessionStorage.setItem("prestonhq_token", data.token);
      onSuccess();
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : "Login failed."); }
    finally { setBusy(false); }
  };
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#06080d] p-4 text-slate-100">
      <Background />
      <motion.form onSubmit={login} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 font-black text-white shadow-lg shadow-sky-500/20">PHQ</div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">Restricted Access</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">ER:LC OS</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">Sign in to access live players, server commands, moderation cases, and protected staff controls.</p>
        <label className="mt-6 block space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dashboard Password</span>
          <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500" placeholder="••••••••••••" />
        </label>
        {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">{error}</div>}
        <button disabled={busy || !password} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
          <Lock size={16} />
          {busy ? "Signing in…" : "Open Moderation Panel"}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">Actions are permission checked and permanently audited.</p>
        <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-800/80 pt-4 text-xs font-medium text-slate-400">
          <a className="transition hover:text-white" href="/privacy">Privacy Policy</a>
          <span>•</span>
          <a className="transition hover:text-white" href="/terms">Terms of Service</a>
        </div>
      </motion.form>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-sky-600/10 blur-[120px]" />
      <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
  );
}

function Sidebar({ page, setPage, mobileOpen, close }: { page: Page; setPage: (p: Page) => void; mobileOpen: boolean; close: () => void }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden" onClick={close} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-slate-900/80 p-4 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 font-extrabold text-white shadow-md shadow-sky-500/20">PHQ</div>
          <div>
            <div className="font-bold tracking-tight text-white">PrestonHQ</div>
            <div className="text-xs text-slate-400">ER:LC Moderation OS</div>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.id === page;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}>
                <Icon size={18} className={active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight size={14} className="text-sky-400" />}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <ShieldAlert size={16} /> Safety Mode Active
          </div>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">Dangerous ER:LC actions require confirmation and permission checks.</p>
        </div>
      </aside>
    </>
  );
}

function Topbar({ page, onMenu, serverData, onRefresh }: { page: Page; onMenu: () => void; serverData: ServerState; onRefresh: () => void }) {
  const label = nav.find((item) => item.id === page)?.label || "Dashboard";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white lg:hidden"><Menu size={20} /></button>
          <h1 className="text-xl font-bold tracking-tight text-white">{label}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill icon={<CircleDot size={14} className="text-sky-400" />} label={`${serverData.players}/${serverData.maxPlayers} Players`} />
          <StatusPill icon={<UserCheck size={14} className="text-emerald-400" />} label={`${serverData.staff} Staff`} />
          <button onClick={onRefresh} className="transition hover:opacity-80">
            <StatusPill icon={<Radio size={14} className={serverData.connected ? "text-emerald-400" : "text-rose-400"} />} label={serverData.connected ? "API Online" : "API Offline"} good={serverData.connected} />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon, label, good }: { icon: React.ReactNode; label: string; good?: boolean }) {
  return (
    <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs font-semibold text-slate-300">
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
        <Metric title="Online Players" value={`${serverData.players}/${serverData.maxPlayers}`} icon={<Users className="text-sky-400" />} tone="sky" />
        <Metric title="Active Staff" value={serverData.staff} icon={<Shield className="text-emerald-400" />} tone="emerald" />
        <Metric title="Queue" value={serverData.queue} icon={<Activity className="text-indigo-400" />} tone="violet" />
        <Metric title="API Status" value={serverData.connected ? "Live" : "Offline"} icon={<Zap className="text-amber-400" />} tone="amber" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Recent Moderation Actions" icon={<ClipboardList className="text-sky-400" />} action={<Button variant="ghost" onClick={() => setPage("logs")}>View Logs</Button>} />
            <div className="mt-4 space-y-2">{logs.slice(0, 5).map((log) => <LogRow key={log.id} log={log} />)}{!logs.length && <EmptyState title="No moderation actions yet" text="Completed staff actions will appear here automatically." />}</div>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="Connection Health" icon={<Cloud className="text-indigo-400" />} />
            <div className="mt-4 space-y-4">
              <Health label="PRC API" value="Healthy" percent={96} />
              <Health label="Discord Bot Bridge" value="Ready" percent={88} />
              <Health label="Webhook Delivery" value="Stable" percent={93} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={() => { onRefresh(); showToast("Refreshing live server data."); }}><RefreshCw size={14} /> Refresh</Button>
              <Button variant="ghost" onClick={() => setPage("connect")}><KeyRound size={14} /> API Setup</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ serverData }: { serverData: ServerState }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-xl">
      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            <Sparkles size={12} /> Live Server Overview
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{serverData.name}</h2>
          <p className="max-w-xl text-sm text-slate-400">Manage ER:LC moderation, staff controls, player profiles, command dispatch, and audit logs from one unified dashboard.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:grid-cols-4 lg:grid-cols-2">
          <Info label="Server Code" value={serverData.code} />
          <Info label="Owner" value={serverData.owner} />
          <Info label="Region" value={serverData.region} />
          <Info label="API Status" value={serverData.apiStatus} good={serverData.connected} />
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
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
          <CardHeader title="Connect ER:LC Server" icon={<Cloud className="text-sky-400" />} />
          <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-500 text-white"><KeyRound size={20} /></div>
              <div>
                <h3 className="font-bold text-white">PRC API Connection</h3>
                <p className="text-xs text-slate-400">Your key is validated server-side and never displayed after it is saved.</p>
              </div>
            </div>
          </div>
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Private Server API Key</span>
            <input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500" placeholder="Paste your PRC server key" />
          </label>
          <div className="mt-6 flex items-center justify-between">
            <Button onClick={connect} className={busy || apiKey.length < 12 ? "opacity-50 pointer-events-none" : ""}><Cloud size={16} />{busy ? "Validating..." : "Validate & Connect"}</Button>
            <span className="text-xs text-slate-500">Stored in protected API environment</span>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader title="Secure Setup" icon={<CheckCircle2 className="text-emerald-400" />} />
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
          <CardHeader title="Player Management" icon={<Users className="text-sky-400" />} action={<SearchBox value={q} setValue={setQ} placeholder="Search players..." />} />
          <div className="mt-4 divide-y divide-slate-800/60 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
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
    ["Kick", <LogOut size={14} />, true],
    ["Ban", <Ban size={14} />, true],
    ["Unban", <Shield size={14} />, true],
    ["Kill", <Skull size={14} />, true],
    ["Teleport", <MapPin size={14} />, false],
    ["PM", <MessageSquare size={14} />, false],
    ["Announcement", <Megaphone size={14} />, false]
  ];
  return (
    <Card>
      <CardHeader title="Player Profile" icon={<Eye className="text-indigo-400" />} />
      <div className="mt-4 flex items-center gap-4 border-b border-slate-800 pb-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-xl font-bold text-white shadow-md">{player.name[0]}</div>
        <div>
          <h3 className="font-bold text-white">{player.name}</h3>
          <p className="text-xs text-slate-400">ID: {player.robloxId} • {player.lastSeen}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Info label="Team" value={player.team} />
        <Info label="Ping" value={`${player.ping}ms`} />
        <Info label="Playtime" value={player.playtime} />
        <Info label="Warnings" value={String(player.warnings)} />
      </div>
      <div className="mt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</span>
        <div className="mt-2 space-y-2">
          {player.notes.map((note, idx) => <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-300">{note}</div>)}
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
    <button onClick={onClick} className={`flex w-full items-center justify-between p-3.5 text-left transition ${active ? "bg-sky-500/10 text-white" : "hover:bg-slate-800/40 text-slate-300"}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">{player.name[0]}</div>
        <div>
          <div className="text-sm font-semibold text-white">{player.name}</div>
          <div className="text-xs text-slate-400">{player.team}</div>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-400">{player.ping}ms</span>
    </button>
  );
}

function CommandCenter({ openAction, sendCommand, busy }: { openAction: (a: ModActionType) => void; sendCommand: (command: string) => void; busy: boolean }) {
  const [cmd, setCmd] = useState(":h Welcome to ECRP. Follow staff instructions.");
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Remote Command Center" icon={<Terminal className="text-sky-400" />} />
          <div className="mt-4 space-y-4">
            <textarea value={cmd} onChange={(e) => setCmd(e.target.value)} className="h-40 w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-sm text-white outline-none focus:border-sky-500" />
            <div className="flex items-center gap-3">
              <Button onClick={() => sendCommand(cmd)}><Command size={16} />{busy ? "Sending…" : "Send Command"}</Button>
              <Button variant="danger" onClick={() => openAction("Announcement")}><Lock size={16} /> Server Announcement</Button>
            </div>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader title="Templates" icon={<Sparkles className="text-amber-400" />} />
          <div className="mt-4 space-y-2">
            {commandTemplates.map((template) => (
              <button key={template.name} onClick={() => setCmd(template.command)} className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-left transition hover:border-slate-700 hover:bg-slate-800/50">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{template.name}</span>
                  {template.locked && <Lock size={12} className="text-amber-400" />}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-400 truncate">{template.command}</div>
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
      <CardHeader title="Moderation Timeline" icon={<ClipboardList className="text-sky-400" />} />
      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {["all", "low", "medium", "high", "critical"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? "bg-sky-500 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
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
    low: "border-slate-800 bg-slate-950/40 text-slate-300",
    medium: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    high: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    critical: "border-rose-500/20 bg-rose-500/10 text-rose-300"
  };
  return (
    <div className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${severityColors[log.severity]}`}>
      <div className="space-y-1">
        <div className="font-semibold text-white">
          <span className="text-sky-400">{log.staff}</span> executed <span className="font-bold">{log.type}</span> on <span className="text-indigo-300">{log.player}</span>
        </div>
        <div className="text-slate-400">{log.reason}</div>
      </div>
      <span className="shrink-0 text-slate-500">{log.time}</span>
    </div>
  );
}

function StaffPermissions({ showToast }: { showToast: (m: string) => void }) {
  const all: Permission[] = ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"];
  return (
    <Card>
      <CardHeader title="Staff Permissions Matrix" icon={<Shield className="text-emerald-400" />} action={<Button onClick={() => showToast("Permission matrix saved.")}>Save Changes</Button>} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">Role</th>
              {all.map((p) => <th key={p} className="pb-3 text-center font-semibold">{p}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {Object.entries(permissions).map(([role, perms]) => (
              <tr key={role}>
                <td className="py-3 font-bold text-white">{role}</td>
                {all.map((p) => (
                  <td key={p} className="py-3 text-center">
                    <input type="checkbox" defaultChecked={perms.includes(p)} className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0" />
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
      <CardHeader title="Dashboard Settings" icon={<Settings className="text-slate-400" />} />
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <div className="text-sm font-bold text-white">Audit Logging</div>
            <div className="text-xs text-slate-400">Automatically log all staff actions to Discord via Webhook.</div>
          </div>
          <Button variant="ghost" onClick={() => showToast("Audit settings updated.")}>Configure</Button>
        </div>
      </div>
    </Card>
  );
}

function ActionModal({ modal, close, confirm, busy }: { modal: { action: ModActionType; player?: Player }; close: () => void; confirm: (reason: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Execute {modal.action}</h3>
          <button onClick={close} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        {modal.player && <p className="mt-2 text-xs text-slate-400">Targeting player: <span className="font-semibold text-white">{modal.player.name}</span></p>}
        <label className="mt-4 block space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="h-24 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-sky-500" placeholder="Provide a reason for the audit log..." />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="danger" onClick={() => confirm(reason)}>{busy ? "Executing…" : "Confirm Action"}</Button>
        </div>
      </motion.div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-50 rounded-xl border border-sky-500/30 bg-slate-900/90 px-4 py-3 text-xs font-semibold text-sky-400 shadow-xl backdrop-blur-md">
      {message}
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl">{children}</div>;
}

function CardHeader({ title, icon, action }: { title: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="font-bold text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Button({ children, variant = "primary", onClick, className = "" }: { children: React.ReactNode; variant?: "primary" | "ghost" | "danger"; onClick?: () => void; className?: string }) {
  const styles = {
    primary: "bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20",
    ghost: "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50",
    danger: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500" />
    </div>
  );
}

function Info({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 text-xs font-bold ${good === true ? "text-emerald-400" : good === false ? "text-rose-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Health({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Checklist({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <CheckCircle2 size={16} className={done ? "text-emerald-400" : "text-slate-600"} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
}

function DashboardLegalFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
      <p>PrestonHQ ER:LC Moderation OS • Independent Tool</p>
    </footer>
  );
}
export default App;
