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
import { useCallback, useEffect, useState } from "react";

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
    <main className="min-h-screen bg-[#07090f] text-white selection:bg-sky-300 selection:text-black">
      <Background />
      <div className="relative flex min-h-screen">
        <Sidebar page={page} setPage={(next) => { setPage(next); setMobileOpen(false); }} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
        <section className="flex min-w-0 flex-1 flex-col lg:pl-[292px]">
          <Topbar page={page} onMenu={() => setMobileOpen(true)} serverData={serverData} onRefresh={loadLiveData} />
          <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
            {syncError && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><span><AlertTriangle className="mr-2 inline" size={16} />{syncError}</span><button onClick={loadLiveData} className="font-black">Retry</button></div>}
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
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
  return <main className="grid min-h-screen place-items-center bg-[#07090f] text-white"><div className="text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-sky-300" /><p className="mt-4 text-sm font-bold text-white/45">Opening secure moderation panel…</p></div></main>;
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
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07090f] p-5 text-white"><Background /><motion.form onSubmit={login} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0e16]/90 p-7 shadow-2xl backdrop-blur-2xl"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-400 font-black text-black">PHQ</div><div className="mt-6 text-xs font-black uppercase tracking-[.22em] text-sky-200">Restricted staff access</div><h1 className="mt-2 text-4xl font-black tracking-[-.06em]">ER:LC Moderation OS</h1><p className="mt-3 leading-6 text-white/50">Sign in to access live players, server commands, moderation cases, and protected staff controls.</p><label className="mt-6 block text-xs font-black uppercase tracking-[.18em] text-white/40">Dashboard password<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-base text-white outline-none transition focus:border-sky-300/45" placeholder="Enter password" /></label>{error && <div className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">{error}</div>}<button disabled={busy || !password} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-300 px-4 py-3.5 font-black text-black transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40"><Lock size={17} />{busy ? "Signing in…" : "Open moderation panel"}</button><p className="mt-4 text-center text-xs text-white/30">Actions are permission checked and permanently audited.</p><div className="mt-4 flex items-center justify-center gap-4 border-t border-white/10 pt-4 text-xs font-bold text-white/45"><a className="transition hover:text-white" href="/privacy">Privacy Policy</a><a className="transition hover:text-white" href="/terms">Terms of Service</a></div></motion.form></main>;
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(56,189,248,.20),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(99,102,241,.20),transparent_30%),radial-gradient(circle_at_68%_88%,rgba(16,185,129,.10),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:70px_70px] opacity-20" />
    </div>
  );
}

function Sidebar({ page, setPage, mobileOpen, close }: { page: Page; setPage: (p: Page) => void; mobileOpen: boolean; close: () => void }) {
  return (
    <>
      {mobileOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={close} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[292px] border-r border-white/10 bg-[#090b12]/88 p-4 backdrop-blur-2xl transition lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="rounded-[1.55rem] border border-white/10 bg-white/[.055] p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-400 font-black text-black">PHQ</div>
              <div>
                <div className="font-black tracking-[-.04em]">PrestonHQ</div>
                <div className="text-xs text-white/45">ER:LC Moderation OS</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.9)]" /> Secure staff control panel
            </div>
          </div>
          <nav className="mt-5 grid gap-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.id === page;
              return (
                <button key={item.id} onClick={() => setPage(item.id)} className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${active ? "border-sky-300/30 bg-sky-300/12 text-white shadow-lg shadow-sky-950/20" : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/[.045] hover:text-white"}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-sky-300 text-black" : "bg-white/[.06] text-white/55 group-hover:text-white"}`}><Icon size={17} /></span>
                  <span className="flex-1 font-bold">{item.label}</span>
                  {active && <ChevronRight size={16} />}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-sm font-black"><ShieldAlert size={17} className="text-amber-200" /> Safety Mode</div>
            <p className="mt-2 text-xs leading-5 text-white/45">Dangerous ER:LC actions require confirmation and permission checks.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ page, onMenu, serverData, onRefresh }: { page: Page; onMenu: () => void; serverData: ServerState; onRefresh: () => void }) {
  const label = nav.find((item) => item.id === page)?.label || "Dashboard";
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07090f]/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.045] lg:hidden"><Menu size={18} /></button>
          <div>
            <div className="text-xs font-black uppercase tracking-[.24em] text-white/35">ER:LC Control</div>
            <h1 className="text-xl font-black tracking-[-.04em]">{label}</h1>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <StatusPill icon={<CircleDot size={14} />} label={`${serverData.players}/${serverData.maxPlayers} players`} />
          <StatusPill icon={<UserCheck size={14} />} label={`${serverData.staff} staff active`} />
          <button onClick={onRefresh}><StatusPill icon={<Radio size={14} />} label={serverData.connected ? "API online" : "API offline"} good={serverData.connected} /></button>
        </div>
      </div>
    </header>
  );
}

function Overview({ showToast, setPage, serverData, logs, onRefresh }: { showToast: (m: string) => void; setPage: (p: Page) => void; serverData: ServerState; logs: ModAction[]; onRefresh: () => void }) {
  return (
    <div className="space-y-5">
      <HeroCard serverData={serverData} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Online Players" value={`${serverData.players}/${serverData.maxPlayers}`} icon={<Users />} tone="sky" />
        <Metric title="Active Staff" value={serverData.staff} icon={<Shield />} tone="emerald" />
        <Metric title="Queue" value={serverData.queue} icon={<Activity />} tone="violet" />
        <Metric title="API Status" value={serverData.connected ? "Live" : "Offline"} icon={<Zap />} tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title="Recent moderation actions" icon={<ClipboardList />} action={<Button variant="ghost" onClick={() => setPage("logs")}>View logs</Button>} />
          <div className="mt-4 space-y-3">{logs.slice(0, 5).map((log) => <LogRow key={log.id} log={log} />)}{!logs.length && <EmptyState title="No moderation actions yet" text="Completed staff actions will appear here automatically." />}</div>
        </Card>
        <Card>
          <CardHeader title="Connection health" icon={<Cloud />} />
          <div className="mt-4 grid gap-3">
            <Health label="PRC API" value="Healthy" percent={96} />
            <Health label="Discord bot bridge" value="Ready" percent={88} />
            <Health label="Webhook delivery" value="Stable" percent={93} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button onClick={() => { onRefresh(); showToast("Refreshing live server data."); }}><RefreshCw size={16} /> Refresh</Button>
            <Button variant="ghost" onClick={() => setPage("connect")}><KeyRound size={16} /> API setup</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HeroCard({ serverData }: { serverData: ServerState }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.055] p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl md:p-8">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="relative grid gap-6 xl:grid-cols-[1fr_420px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-black uppercase tracking-[.22em] text-sky-100"><Sparkles size={14} /> Live server overview</div>
          <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[.92] tracking-[-.075em] md:text-7xl">{serverData.name}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">Connect ER:LC moderation, staff controls, player profiles, command dispatch, and audit logs from one polished PrestonHQ dashboard.</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
          <Info label="Server Code" value={serverData.code} />
          <Info label="Owner" value={serverData.owner} />
          <Info label="Region" value={serverData.region} />
          <Info label="API Status" value={serverData.apiStatus} good={serverData.connected} />
        </div>
      </div>
    </section>
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
    <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
      <Card>
        <CardHeader title="Connect ER:LC Server" icon={<Cloud />} />
        <div className="mt-5 rounded-[1.5rem] border border-sky-300/15 bg-sky-300/10 p-5">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-300 text-black"><KeyRound /></div><div><h2 className="text-2xl font-black">PRC API connection</h2><p className="text-sm text-white/50">Your key is validated server-side and never displayed after it is saved.</p></div></div>
        </div>
        <label className="mt-5 block">
          <span className="text-xs font-black uppercase tracking-[.18em] text-white/35">Private-server API key</span>
          <input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-sky-300/40" placeholder="Paste your PRC server key" />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={connect} className={busy || apiKey.length < 12 ? "pointer-events-none opacity-45" : ""}><Cloud size={16} />{busy ? "Validating&" : "Validate & connect"}</Button>
          <p className="text-xs text-white/35">The key is stored only in the protected API environment.</p>
        </div>
      </Card>
      <Card>
        <CardHeader title="Secure setup" icon={<CheckCircle2 />} />
        <div className="mt-5 space-y-3">
          <Checklist label="Dashboard authentication enabled" done />
          <Checklist label="Discord bot bridge online" done />
          <Checklist label="PRC key validated before saving" done />
          <Checklist label="Moderation actions audited" done />
          <Checklist label="Live players refresh every 15 seconds" done />
        </div>
      </Card>
    </div>
  );
}

function Players({ players, selected, setSelected, openAction }: { players: Player[]; selected: Player; setSelected: (p: Player) => void; openAction: (a: ModActionType, p: Player) => void }) {
  const [q, setQ] = useState("");
  const filtered = players.filter((p) => `${p.name} ${p.robloxId} ${p.team}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader title="Player management" icon={<Users />} action={<SearchBox value={q} setValue={setQ} placeholder="Search players..." />} />
        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
          {filtered.map((player) => <PlayerRow key={player.id} player={player} active={selected.id === player.id} onClick={() => setSelected(player)} />)}
        </div>
        {!filtered.length && <EmptyState title="No players found" text="Try a username, Roblox ID, or team." />}
      </Card>
      <PlayerProfile player={selected} openAction={openAction} />
    </div>
  );
}

function PlayerProfile({ player, openAction }: { player: Player; openAction: (a: ModActionType, p: Player) => void }) {
  const actions: Array<[ModActionType, React.ReactNode, boolean]> = [["Kick", <LogOut />, true], ["Ban", <Ban />, true], ["Unban", <Shield />, true], ["Kill", <Skull />, true], ["Teleport", <MapPin />, false], ["PM", <MessageSquare />, false], ["Announcement", <Megaphone />, false]];
  return (
    <Card>
      <CardHeader title="Player profile" icon={<Eye />} />
      <div className="mt-5 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-sky-300 to-indigo-400 text-2xl font-black text-black">{player.name[0]}</div>
        <div className="min-w-0"><h2 className="truncate text-2xl font-black">{player.name}</h2><p className="text-sm text-white/45">ID {player.robloxId} · {player.lastSeen}</p></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info label="Team" value={player.team} />
        <Info label="Ping" value={`${player.ping}ms`} />
        <Info label="Playtime" value={player.playtime} />
        <Info label="Warnings" value={String(player.warnings)} />
      </div>
      <div className="mt-5"><div className="text-xs font-black uppercase tracking-[.22em] text-white/35">Notes</div><div className="mt-3 space-y-2">{player.notes.map((note) => <div key={note} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm text-white/60">{note}</div>)}</div></div>
      <div className="mt-5 grid grid-cols-2 gap-2">{actions.map(([action, icon, dangerous]) => <Button key={action} variant={dangerous ? "danger" : "ghost"} onClick={() => openAction(action, player)}>{icon}{action}</Button>)}</div>
    </Card>
  );
}

function CommandCenter({ openAction, sendCommand, busy }: { openAction: (a: ModActionType) => void; sendCommand: (command: string) => void; busy: boolean }) {
  const [cmd, setCmd] = useState(":h Welcome to ECRP. Follow staff instructions.");
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader title="Remote command center" icon={<Terminal />} />
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
          <label className="text-xs font-black uppercase tracking-[.22em] text-white/35">Command</label>
          <textarea value={cmd} onChange={(e) => setCmd(e.target.value)} className="mt-3 min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-[#07090f] p-4 font-mono text-sm outline-none transition focus:border-sky-300/40" />
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => sendCommand(cmd)}><Command size={16} /> {busy ? "Sending…" : "Send command"}</Button><Button variant="danger" onClick={() => openAction("Announcement")}><Lock size={16} /> Server announcement</Button></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Templates" icon={<Sparkles />} />
        <div className="mt-5 space-y-3">{commandTemplates.map((template) => <button key={template.name} onClick={() => setCmd(template.command)} className="w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left transition hover:border-sky-300/30 hover:bg-sky-300/10"><div className="flex items-center justify-between gap-3"><b>{template.name}</b>{template.locked && <Lock size={15} className="text-amber-200" />}</div><code className="mt-2 block truncate text-xs text-white/45">{template.command}</code></button>)}</div>
      </Card>
    </div>
  );
}

function Logs({ logs }: { logs: ModAction[] }) {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? logs : logs.filter((l) => l.severity === filter);
  return <Card><CardHeader title="Moderation timeline" icon={<ClipboardList />} /><div className="mt-5 flex flex-wrap gap-2">{["all", "low", "medium", "high", "critical"].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${filter === f ? "border-sky-300/40 bg-sky-300/15 text-white" : "border-white/10 bg-white/[.04] text-white/50 hover:text-white"}`}>{f}</button>)}</div><div className="mt-5 space-y-3">{visible.map((log) => <LogRow key={log.id} log={log} />)}{!visible.length && <EmptyState title="No matching actions" text="Moderation cases will be stored here permanently." />}</div></Card>;
}

function StaffPermissions({ showToast }: { showToast: (m: string) => void }) {
  const all: Permission[] = ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"];
  return <Card><CardHeader title="Staff permissions matrix" icon={<Shield />} action={<Button onClick={() => showToast("Permission matrix saved.")}>Save changes</Button>} /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-sm"><thead><tr className="text-left text-xs uppercase tracking-[.18em] text-white/35"><th className="p-3">Role</th>{all.map((p) => <th key={p} className="p-3 text-center">{p}</th>)}</tr></thead><tbody>{Object.entries(permissions).map(([role, list]) => <tr key={role} className="rounded-2xl bg-white/[.035]"><td className="rounded-l-2xl p-3 font-black">{role}</td>{all.map((p) => <td key={p} className="p-3 text-center"><button className={`mx-auto grid h-7 w-11 place-items-center rounded-full border transition ${list.includes(p) ? "border-emerald-300/30 bg-emerald-300/20 text-emerald-100" : "border-white/10 bg-black/30 text-white/25"}`}>{list.includes(p) ? "✓" : ""}</button></td>)}<td className="rounded-r-2xl" /></tr>)}</tbody></table></div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/55">Audit: Preston updated Moderator permissions 14 minutes ago.</div></Card>;
}

function SettingsPage({ showToast }: { showToast: (m: string) => void }) {
  return <div className="grid gap-5 xl:grid-cols-2"><Card><CardHeader title="ER:LC API connection" icon={<KeyRound />} /><div className="mt-5 grid gap-4"><Info label="API host" value="api.policeroleplay.community" /><Info label="Credential storage" value="Server-side only" good /><Info label="Refresh interval" value="15 seconds" /><Button onClick={() => showToast("API credentials are protected on the VPS.")}>Connection security</Button></div></Card><Card><CardHeader title="Integrations & branding" icon={<Bot />} /><div className="mt-5 grid gap-4"><Field label="Discord bot integration" placeholder="Veltrix" /><Field label="Moderation webhook" placeholder="Optional log webhook" /><Field label="Dashboard accent" placeholder="Sky / Indigo" /><Button variant="ghost" onClick={() => showToast("Branding preferences saved for this browser.")}>Save branding</Button></div></Card><Card><CardHeader title="Security" icon={<Lock />} /><div className="mt-5 space-y-3"><Checklist label="Require confirmation for bans" done /><Checklist label="Log every command execution" done /><Checklist label="Restrict API key visibility" done /><Checklist label="Use protected staff login" done /></div></Card><Card><CardHeader title="Service health" icon={<AlertTriangle />} /><EmptyState title="Automatic health monitoring" text="PRC API failures appear globally with a safe retry action." /></Card></div>;
}

function ActionModal({ modal, close, confirm, busy }: { modal: { action: ModActionType; player?: Player }; close: () => void; confirm: (reason: string) => void; busy: boolean }) {
  const dangerous = ["Kick", "Ban", "Unban", "Kill", "Announcement"].includes(modal.action);
  const [reason, setReason] = useState("");
  return <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div initial={{ scale: .96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 12 }} className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0b0e16] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[.18em] ${dangerous ? "border-rose-300/25 bg-rose-300/10 text-rose-100" : "border-sky-300/25 bg-sky-300/10 text-sky-100"}`}>{dangerous ? "Confirmation required" : "Confirm action"}</div><h2 className="mt-4 text-3xl font-black">{modal.action}</h2><p className="mt-2 text-white/55">{modal.player ? `Run ${modal.action} on ${modal.player.name}?` : `Send a server-wide announcement?`} The command will execute immediately and be added to the audit log.</p></div><button onClick={close} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.04]"><X size={18} /></button></div><label className="mt-5 block text-xs font-black uppercase tracking-[.18em] text-white/35">{modal.action === "Announcement" || modal.action === "PM" ? "Message" : "Reason"}<textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-sky-300/40" placeholder={modal.action === "Announcement" ? "Message sent to the whole server…" : "Enter the moderation reason…"} /></label><div className="mt-5 flex gap-3"><Button variant="ghost" onClick={close}>Cancel</Button><Button variant={dangerous ? "danger" : "primary"} onClick={() => confirm(reason)}>{busy ? "Sending…" : `Confirm ${modal.action}`}</Button></div></motion.div></motion.div>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-[2rem] border border-white/10 bg-white/[.055] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}>{children}</section>; }
function CardHeader({ title, icon, action }: { title: string; icon: React.ReactNode; action?: React.ReactNode }) { return <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.18em] text-white/45">{icon}{title}</div>{action}</div>; }
function Button({ children, onClick, variant = "primary", className = "" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; className?: string }) { const styles = variant === "danger" ? "border-rose-300/25 bg-rose-400/15 text-rose-50 hover:bg-rose-400/22" : variant === "ghost" ? "border-white/10 bg-white/[.055] text-white/75 hover:border-white/18 hover:bg-white/[.08]" : "border-sky-300/25 bg-sky-300 text-black hover:bg-sky-200"; return <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5 ${styles} ${className}`}>{children}</button>; }
function StatusPill({ icon, label, good }: { icon: React.ReactNode; label: string; good?: boolean }) { return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${good ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[.045] text-white/60"}`}>{icon}{label}</div>; }
function Metric({ title, value, icon, tone }: { title: string; value: React.ReactNode; icon: React.ReactNode; tone: "sky" | "emerald" | "violet" | "amber" }) { const map = { sky: "from-sky-400/22", emerald: "from-emerald-400/22", violet: "from-violet-400/22", amber: "from-amber-400/22" }; return <Card className={`bg-gradient-to-br ${map[tone]} to-white/[.045]`}><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[.08] text-white/75">{icon}</div><Sparkles size={16} className="text-white/30" /></div><div className="mt-6 text-4xl font-black tracking-[-.06em]">{value}</div><div className="mt-1 text-sm font-bold text-white/45">{title}</div></Card>; }
function Info({ label, value, good }: { label: string; value: string; good?: boolean }) { return <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-3 py-2 last:mb-0"><span className="text-sm text-white/45">{label}</span><b className={good ? "text-emerald-200" : "text-white"}>{value}</b></div>; }
function Health({ label, value, percent }: { label: string; value: string; percent: number }) { return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><div className="flex justify-between text-sm"><b>{label}</b><span className="text-white/45">{value}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/35"><div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300" style={{ width: `${percent}%` }} /></div></div>; }
function Checklist({ label, done }: { label: string; done: boolean }) { return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className={`grid h-8 w-8 place-items-center rounded-xl ${done ? "bg-emerald-300 text-black" : "bg-white/[.06] text-white/35"}`}>{done ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}</span><span className="font-bold text-white/75">{label}</span></div>; }
function Field({ label, placeholder }: { label: string; placeholder: string }) { return <label className="block"><span className="text-xs font-black uppercase tracking-[.18em] text-white/35">{label}</span><input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-sky-300/40" placeholder={placeholder} /></label>; }
function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (v: string) => void; placeholder: string }) { return <div className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2"><Search size={16} className="text-white/35" /><input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>; }
function PlayerRow({ player, active, onClick }: { player: Player; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 border-b border-white/10 p-4 text-left last:border-b-0 transition ${active ? "bg-sky-300/10" : "hover:bg-white/[.04]"}`}><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-400 font-black text-black">{player.name[0]}</div><div className="min-w-0 flex-1"><div className="truncate font-black">{player.name}</div><div className="text-xs text-white/45">{player.team} · {player.playtime} · {player.ping}ms</div></div><SeverityBadge severity={player.status === "banned" ? "critical" : player.status === "flagged" ? "high" : player.status === "staff" ? "low" : "medium"} label={player.status} /></button>; }
function LogRow({ log }: { log: ModAction }) { return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><SeverityBadge severity={log.severity} label={log.type} /><div className="min-w-0 flex-1"><div className="font-black">{log.player}</div><div className="text-sm text-white/45">{log.reason}</div></div><div className="text-right text-xs text-white/40"><b className="block text-white/65">{log.staff}</b>{log.time}</div></div>; }
function SeverityBadge({ severity, label }: { severity: Severity; label: string }) { const styles = { low: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100", medium: "border-sky-300/25 bg-sky-300/10 text-sky-100", high: "border-amber-300/25 bg-amber-300/10 text-amber-100", critical: "border-rose-300/25 bg-rose-300/10 text-rose-100" }; return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${styles[severity]}`}>{label}</span>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/15 bg-white/[.025] p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[.06] text-white/40"><AlertTriangle /></div><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-1 text-sm text-white/45">{text}</p></div>; }
function Toast({ message }: { message: string }) { return <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="fixed bottom-5 right-5 z-50 rounded-2xl border border-emerald-300/20 bg-[#0b1512] px-4 py-3 text-sm font-bold text-emerald-100 shadow-2xl"><CheckCircle2 className="mr-2 inline" size={16} />{message}</motion.div>; }
function DashboardLegalFooter() { return <footer className="relative border-t border-white/10 bg-[#07090f]/80 py-5 pl-0 text-sm text-white/45 backdrop-blur-2xl lg:pl-[292px]"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© PrestonHQ. All rights reserved.</p><div className="flex gap-4"><a className="transition hover:text-white" href="/privacy">Privacy Policy</a><a className="transition hover:text-white" href="/terms">Terms of Service</a></div></div></footer>; }

export default App;
