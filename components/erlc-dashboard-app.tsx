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
import { useState } from "react";

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

const server = {
  name: "ECRP Liberty County",
  code: "ILCRPC",
  owner: "Liberty",
  region: "US-East",
  apiStatus: "Connected",
  uptime: "18h 42m",
  players: 31,
  maxPlayers: 40,
  staff: 7,
  queue: 4,
};

const players: Player[] = [
  { id: "p1", name: "CXUTIONWYDD", robloxId: "7656352503", status: "online", team: "Civilian", playtime: "2h 14m", ping: 42, warnings: 1, notes: ["Verified through PrestonHQ", "Good session history"], lastSeen: "Now" },
  { id: "p2", name: "lowe", robloxId: "184552991", status: "staff", team: "Sheriff", playtime: "4h 03m", ping: 36, warnings: 0, notes: ["Trusted giveaway host", "Active staff"], lastSeen: "Now" },
  { id: "p3", name: "Lemlegendary_yogurt", robloxId: "91244902", status: "flagged", team: "Civilian", playtime: "38m", ping: 84, warnings: 3, notes: ["Recent FRP report", "Needs review before ban"], lastSeen: "2m ago" },
  { id: "p4", name: "Potethefloofy", robloxId: "55487120", status: "online", team: "Fire & Rescue", playtime: "1h 05m", ping: 55, warnings: 0, notes: ["No active moderation notes"], lastSeen: "Now" },
  { id: "p5", name: "YAgooby012", robloxId: "10029202", status: "banned", team: "Banned", playtime: "0m", ping: 0, warnings: 5, notes: ["Mass RDM", "Ban expires in 2 days"], lastSeen: "Yesterday" },
];

const logs: ModAction[] = [
  { id: "a1", type: "Warn", staff: "Preston", player: "Lemlegendary_yogurt", reason: "FRP during pursuit", severity: "medium", time: "2 minutes ago" },
  { id: "a2", type: "PM", staff: "lowe", player: "CXUTIONWYDD", reason: "Asked for proof clip", severity: "low", time: "8 minutes ago" },
  { id: "a3", type: "Kick", staff: "Dream", player: "RandomGuest42", reason: "Ignoring staff instructions", severity: "high", time: "17 minutes ago" },
  { id: "a4", type: "Announcement", staff: "Preston", player: "Server", reason: "Peacetime ending in 5 minutes", severity: "low", time: "24 minutes ago" },
  { id: "a5", type: "Ban", staff: "Liberty", player: "YAgooby012", reason: "Mass RDM / staff evasion", severity: "critical", time: "1 hour ago" },
];

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
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(players[0]);
  const [modal, setModal] = useState<{ action: ModActionType; player?: Player } | null>(null);
  const [toast, setToast] = useState("");
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <main className="min-h-screen bg-[#07090f] text-white selection:bg-sky-300 selection:text-black">
      <Background />
      <div className="relative flex min-h-screen">
        <Sidebar page={page} setPage={(next) => { setPage(next); setMobileOpen(false); }} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
        <section className="flex min-w-0 flex-1 flex-col lg:pl-[292px]">
          <Topbar page={page} onMenu={() => setMobileOpen(true)} />
          <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {page === "overview" && <Overview showToast={showToast} setPage={setPage} />}
                {page === "connect" && <Connect showToast={showToast} />}
                {page === "players" && <Players selected={selectedPlayer} setSelected={setSelectedPlayer} openAction={(action, player) => setModal({ action, player })} />}
                {page === "commands" && <CommandCenter openAction={(action) => setModal({ action })} showToast={showToast} />}
                {page === "logs" && <Logs showToast={showToast} />}
                {page === "staff" && <StaffPermissions showToast={showToast} />}
                {page === "settings" && <SettingsPage showToast={showToast} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
      <AnimatePresence>{modal && <ActionModal modal={modal} close={() => setModal(null)} confirm={() => { showToast(`${modal.action} queued ${modal.player ? `for ${modal.player.name}` : "successfully"}.`); setModal(null); }} />}</AnimatePresence>
      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </main>
  );
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
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.9)]" /> API mock connected
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

function Topbar({ page, onMenu }: { page: Page; onMenu: () => void }) {
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
          <StatusPill icon={<CircleDot size={14} />} label={`${server.players}/${server.maxPlayers} players`} />
          <StatusPill icon={<UserCheck size={14} />} label={`${server.staff} staff active`} />
          <StatusPill icon={<Radio size={14} />} label="API online" good />
        </div>
      </div>
    </header>
  );
}

function Overview({ showToast, setPage }: { showToast: (m: string) => void; setPage: (p: Page) => void }) {
  return (
    <div className="space-y-5">
      <HeroCard />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Online Players" value={`${server.players}/${server.maxPlayers}`} icon={<Users />} tone="sky" />
        <Metric title="Active Staff" value={server.staff} icon={<Shield />} tone="emerald" />
        <Metric title="Queue" value={server.queue} icon={<Activity />} tone="violet" />
        <Metric title="API Uptime" value={server.uptime} icon={<Zap />} tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title="Recent moderation actions" icon={<ClipboardList />} action={<Button variant="ghost" onClick={() => setPage("logs")}>View logs</Button>} />
          <div className="mt-4 space-y-3">{logs.slice(0, 5).map((log) => <LogRow key={log.id} log={log} />)}</div>
        </Card>
        <Card>
          <CardHeader title="Connection health" icon={<Cloud />} />
          <div className="mt-4 grid gap-3">
            <Health label="PRC API" value="Healthy" percent={96} />
            <Health label="Discord bot bridge" value="Ready" percent={88} />
            <Health label="Webhook delivery" value="Stable" percent={93} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button onClick={() => showToast("Server data refreshed.")}><RefreshCw size={16} /> Refresh</Button>
            <Button variant="ghost" onClick={() => setPage("connect")}><KeyRound size={16} /> API setup</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.055] p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl md:p-8">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="relative grid gap-6 xl:grid-cols-[1fr_420px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-black uppercase tracking-[.22em] text-sky-100"><Sparkles size={14} /> Live server overview</div>
          <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[.92] tracking-[-.075em] md:text-7xl">{server.name}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">Connect ER:LC moderation, staff controls, player profiles, command dispatch, and audit logs from one polished PrestonHQ dashboard.</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
          <Info label="Server Code" value={server.code} />
          <Info label="Owner" value={server.owner} />
          <Info label="Region" value={server.region} />
          <Info label="API Status" value={server.apiStatus} good />
        </div>
      </div>
    </section>
  );
}

function Connect({ showToast }: { showToast: (m: string) => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
      <Card>
        <CardHeader title="Connect ER:LC Server" icon={<Cloud />} />
        <div className="mt-5 rounded-[1.5rem] border border-sky-300/15 bg-sky-300/10 p-5">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-300 text-black"><KeyRound /></div><div><h2 className="text-2xl font-black">PRC API authorization</h2><p className="text-sm text-white/50">Placeholder flow ready for official PRC auth links.</p></div></div>
          <Button className="mt-5" onClick={() => showToast("Authorization flow placeholder opened.")}><Cloud size={16} /> Connect ER:LC Server</Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Manual API key fallback" placeholder="prc_live_xxxxxxxxx" />
          <Field label="Server code" placeholder="ILCRPC" />
          <Field label="Webhook URL" placeholder="https://discord.com/api/webhooks/..." />
          <Field label="Discord guild ID" placeholder="1234567890" />
        </div>
        <Button className="mt-5" onClick={() => showToast("Mock API settings saved.")}>Save connection</Button>
      </Card>
      <Card>
        <CardHeader title="Setup checklist" icon={<CheckCircle2 />} />
        <div className="mt-5 space-y-3">
          {[["Create PRC API token", true], ["Connect Discord bot bridge", true], ["Choose moderation log channel", false], ["Review staff role permissions", false], ["Run first sync", false]].map(([label, done]) => <Checklist key={String(label)} label={String(label)} done={Boolean(done)} />)}
        </div>
      </Card>
    </div>
  );
}

function Players({ selected, setSelected, openAction }: { selected: Player; setSelected: (p: Player) => void; openAction: (a: ModActionType, p: Player) => void }) {
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

function CommandCenter({ openAction, showToast }: { openAction: (a: ModActionType) => void; showToast: (m: string) => void }) {
  const [cmd, setCmd] = useState(":h Welcome to ECRP. Follow staff instructions.");
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader title="Remote command center" icon={<Terminal />} />
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
          <label className="text-xs font-black uppercase tracking-[.22em] text-white/35">Command</label>
          <textarea value={cmd} onChange={(e) => setCmd(e.target.value)} className="mt-3 min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-[#07090f] p-4 font-mono text-sm outline-none transition focus:border-sky-300/40" />
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => showToast("Command sent to mock ER:LC client.")}><Command size={16} /> Send command</Button><Button variant="danger" onClick={() => openAction("Announcement")}><Lock size={16} /> Dangerous command</Button></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Templates" icon={<Sparkles />} />
        <div className="mt-5 space-y-3">{commandTemplates.map((template) => <button key={template.name} onClick={() => setCmd(template.command)} className="w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left transition hover:border-sky-300/30 hover:bg-sky-300/10"><div className="flex items-center justify-between gap-3"><b>{template.name}</b>{template.locked && <Lock size={15} className="text-amber-200" />}</div><code className="mt-2 block truncate text-xs text-white/45">{template.command}</code></button>)}</div>
      </Card>
    </div>
  );
}

function Logs({ showToast }: { showToast: (m: string) => void }) {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? logs : logs.filter((l) => l.severity === filter);
  return <Card><CardHeader title="Moderation timeline" icon={<ClipboardList />} action={<Button onClick={() => showToast("Logs exported as mock CSV.")}><Download size={16} /> Export logs</Button>} /><div className="mt-5 flex flex-wrap gap-2">{["all", "low", "medium", "high", "critical"].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${filter === f ? "border-sky-300/40 bg-sky-300/15 text-white" : "border-white/10 bg-white/[.04] text-white/50 hover:text-white"}`}>{f}</button>)}</div><div className="mt-5 space-y-3">{visible.map((log) => <LogRow key={log.id} log={log} />)}</div></Card>;
}

function StaffPermissions({ showToast }: { showToast: (m: string) => void }) {
  const all: Permission[] = ["Kick", "Ban", "Unban", "Kill", "Teleport", "PM", "Announce", "API Keys", "Staff Roles", "Export Logs"];
  return <Card><CardHeader title="Staff permissions matrix" icon={<Shield />} action={<Button onClick={() => showToast("Permission matrix saved.")}>Save changes</Button>} /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-sm"><thead><tr className="text-left text-xs uppercase tracking-[.18em] text-white/35"><th className="p-3">Role</th>{all.map((p) => <th key={p} className="p-3 text-center">{p}</th>)}</tr></thead><tbody>{Object.entries(permissions).map(([role, list]) => <tr key={role} className="rounded-2xl bg-white/[.035]"><td className="rounded-l-2xl p-3 font-black">{role}</td>{all.map((p) => <td key={p} className="p-3 text-center"><button className={`mx-auto grid h-7 w-11 place-items-center rounded-full border transition ${list.includes(p) ? "border-emerald-300/30 bg-emerald-300/20 text-emerald-100" : "border-white/10 bg-black/30 text-white/25"}`}>{list.includes(p) ? "✓" : ""}</button></td>)}<td className="rounded-r-2xl" /></tr>)}</tbody></table></div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/55">Audit: Preston updated Moderator permissions 14 minutes ago.</div></Card>;
}

function SettingsPage({ showToast }: { showToast: (m: string) => void }) {
  return <div className="grid gap-5 xl:grid-cols-2"><Card><CardHeader title="ER:LC API settings" icon={<KeyRound />} /><div className="mt-5 grid gap-4"><Field label="API base URL" placeholder="https://api.policeroleplay.community/v1" /><Field label="API token" placeholder="••••••••••••••" /><Field label="Sync interval" placeholder="30 seconds" /><Button onClick={() => showToast("API settings saved.")}>Save API settings</Button></div></Card><Card><CardHeader title="Integrations & branding" icon={<Bot />} /><div className="mt-5 grid gap-4"><Field label="Discord bot integration" placeholder="ECRP Assistant" /><Field label="Moderation webhook" placeholder="https://discord.com/api/webhooks/..." /><Field label="Dashboard accent" placeholder="Sky / Indigo" /><Button variant="ghost" onClick={() => showToast("Branding saved.")}>Save branding</Button></div></Card><Card><CardHeader title="Security" icon={<Lock />} /><div className="mt-5 space-y-3"><Checklist label="Require confirmation for bans" done /><Checklist label="Log every command execution" done /><Checklist label="Restrict API key visibility" done /><Checklist label="Enable staff 2FA reminder" done={false} /></div></Card><Card><CardHeader title="Empty/error states" icon={<AlertTriangle />} /><EmptyState title="No disconnected services" text="If PRC API or Discord goes down, errors will show here with retry buttons." /></Card></div>;
}

function ActionModal({ modal, close, confirm }: { modal: { action: ModActionType; player?: Player }; close: () => void; confirm: () => void }) {
  const dangerous = ["Kick", "Ban", "Unban", "Kill", "Announcement"].includes(modal.action);
  return <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div initial={{ scale: .96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 12 }} className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0b0e16] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[.18em] ${dangerous ? "border-rose-300/25 bg-rose-300/10 text-rose-100" : "border-sky-300/25 bg-sky-300/10 text-sky-100"}`}>{dangerous ? "Confirmation required" : "Confirm action"}</div><h2 className="mt-4 text-3xl font-black">{modal.action}</h2><p className="mt-2 text-white/55">{modal.player ? `Run ${modal.action} on ${modal.player.name}?` : `Run ${modal.action}?`} This is currently wired to the mock ER:LC client.</p></div><button onClick={close} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.04]"><X size={18} /></button></div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/55">Real ER:LC API call goes here after PRC credentials are connected.</div><div className="mt-5 flex gap-3"><Button variant="ghost" onClick={close}>Cancel</Button><Button variant={dangerous ? "danger" : "primary"} onClick={confirm}>Confirm {modal.action}</Button></div></motion.div></motion.div>;
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

export default App;
