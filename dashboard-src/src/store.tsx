import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppState, Command, CommandEmbed, LogEntry } from "./types";
import { uid } from "./constants";

const STORAGE_KEY = "phq_console_v3";

export function mkEmbed(o: Partial<CommandEmbed> = {}): CommandEmbed {
  return {
    enabled: true,
    author: "",
    authorIcon: "",
    title: "",
    description: "",
    color: "#6366f1",
    thumbnail: "",
    image: "",
    footer: "",
    footerIcon: "",
    fields: [],
    buttons: [],
    ...o,
  };
}

function cmd(p: Partial<Command> & Pick<Command, "name" | "category" | "description">): Command {
  return {
    id: uid(),
    enabled: true,
    favorite: false,
    cooldown: 5,
    permission: "Manage Messages",
    roles: "Staff",
    ephemeral: false,
    response: "",
    options: [],
    embed: mkEmbed(),
    uses: 0,
    updatedAt: Date.now(),
    ...p,
  } as Command;
}

function seed(): AppState {
  const now = Date.now();
  const min = 60_000;
  return {
    user: null,
    bot: { name: "Veltrix", pkg: "veltrix-lcrp-bot", pm2: "bot3", source: "/root/bots/bot3", connected: true },
    server: "City of Angels",
    servers: ["City of Angels", "Vexel Studios", "Staff Hub"],
    permissions: {
      defaultRole: "Moderator",
      adminBypass: "Administrator",
      logChannel: "#bot-logs",
      disabledChannels: "#general, #media",
      dmReplies: false,
    },
    commands: [
      cmd({ name: "setup", category: "Moderation", description: "Create or update the safe Veltrix channel and role layout.", permission: "Administrator", roles: "Head Administrator", cooldown: 15, ephemeral: true, favorite: true, uses: 142, updatedAt: now - 14 * min, response: "Setup completed safely.", options: [{ id: uid(), name: "mode", type: "string", description: "Setup scope", required: false }], embed: mkEmbed({ title: "Veltrix Setup Complete", description: "Server layout and permissions were synced safely.", color: "#6366f1", fields: [{ id: uid(), name: "Scope", value: "channels / roles / permissions", inline: true }, { id: uid(), name: "Status", value: "Ready", inline: true }] }) }),
      cmd({ name: "ticket-panel", category: "Tickets", description: "Post the advanced Veltrix ticket panel.", permission: "Manage Server", cooldown: 10, uses: 308, favorite: true, updatedAt: now - 3 * min, response: "Ticket panel posted.", options: [{ id: uid(), name: "channel", type: "channel", description: "Where to post the panel", required: true }], embed: mkEmbed({ title: "Support Center", description: "Choose a ticket category below and our staff team will respond as soon as possible.", color: "#22c55e", fields: [{ id: uid(), name: "Categories", value: "Support • Reports • Appeals • Partnerships", inline: false }], buttons: [{ id: uid(), label: "Open Ticket", style: "Success", url: "" }] }) }),
      cmd({ name: "counting", category: "Fun", description: "Configure, reset, disable, or view the counting game status.", permission: "Manage Server", roles: "Management", uses: 87, updatedAt: now - 41 * min, response: "Counting system updated.", options: [{ id: uid(), name: "action", type: "string", description: "setup / status / reset / disable", required: true }], embed: mkEmbed({ title: "Counting System", description: "Counting channel settings were updated.", color: "#2dd4bf" }) }),
      cmd({ name: "shift", category: "Utility", description: "Start / end staff shifts and view the staff points leaderboard.", permission: "Manage Messages", roles: "Staff Team", ephemeral: true, uses: 533, favorite: true, updatedAt: now - 70 * min, response: "Shift updated.", options: [{ id: uid(), name: "action", type: "string", description: "start / end / status / leaderboard", required: true }], embed: mkEmbed({ title: "Staff Shift", description: "Your staff shift status has been updated.", color: "#8b5cf6" }) }),
      cmd({ name: "giveaway", category: "Fun", description: "Start, edit, reroll, pause, resume, end, delete, list, and proof giveaways.", permission: "Manage Server", roles: "Events Team", cooldown: 20, uses: 219, updatedAt: now - 2 * 60 * min, response: "Giveaway action completed.", options: [{ id: uid(), name: "prize", type: "string", description: "Giveaway prize", required: true }, { id: uid(), name: "winners", type: "integer", description: "Number of winners", required: false }], embed: mkEmbed({ title: "🎉 Giveaway", description: "Click below to enter — good luck everyone!", color: "#f59e0b", fields: [{ id: uid(), name: "Prize", value: "Discord Nitro", inline: true }, { id: uid(), name: "Winners", value: "1", inline: true }, { id: uid(), name: "Ends", value: "in 24h", inline: true }], buttons: [{ id: uid(), label: "Enter Giveaway", style: "Primary", url: "" }] }) }),
      cmd({ name: "session", category: "Utility", description: "Manage ERLC session votes, starts, attendance, and roster.", permission: "Manage Messages", roles: "Session Host", cooldown: 10, uses: 164, updatedAt: now - 5 * 60 * min, response: "Session command completed.", options: [{ id: uid(), name: "action", type: "string", description: "vote / start / end / status / roster", required: true }], embed: mkEmbed({ title: "Session System", description: "Session tools for City of Angels.", color: "#ef4444" }) }),
      cmd({ name: "birthday", category: "Fun", description: "Set and manage birthday announcements.", permission: "Everyone", roles: "Member", cooldown: 10, ephemeral: true, uses: 76, updatedAt: now - 8 * 60 * min, response: "Birthday saved.", options: [{ id: uid(), name: "date", type: "string", description: "Your birthday (DD/MM)", required: true }], embed: mkEmbed({ title: "🎂 Birthday Saved", description: "We will announce your birthday on the big day!", color: "#ec4899" }) }),
      cmd({ name: "server-status", category: "Utility", description: "Show server and community status.", permission: "Everyone", roles: "Member", cooldown: 10, uses: 421, updatedAt: now - 26 * 60 * min, response: "Status panel sent.", embed: mkEmbed({ title: "City of Angels Status", description: "Live community, channel, and server details.", color: "#38bdf8", fields: [{ id: uid(), name: "Community", value: "Online", inline: true }, { id: uid(), name: "Details", value: "Synced from Veltrix", inline: true }] }) }),
      cmd({ name: "server-roles", category: "Moderation", description: "Show server roles with clean pagination.", permission: "Manage Roles", uses: 54, updatedAt: now - 30 * 60 * min, response: "Role list sent.", embed: mkEmbed({ title: "Server Roles", description: "Paginated role overview.", color: "#64748b" }) }),
      cmd({ name: "purge", category: "Moderation", description: "Bulk delete messages safely with confirmation.", permission: "Manage Messages", roles: "Moderator", cooldown: 8, ephemeral: true, uses: 612, favorite: true, updatedAt: now - 55 * min, response: "Messages purged.", options: [{ id: uid(), name: "amount", type: "integer", description: "How many messages", required: true }], embed: mkEmbed({ title: "Purge Complete", description: "Messages were deleted safely.", color: "#f43f5e" }) }),
    ],
    logs: [
      { id: uid(), tag: "Veltrix", msg: "Connected to PM2 app bot3", time: now - 4 * min, kind: "success" },
      { id: uid(), tag: "Sync", msg: "10 Veltrix commands loaded from /root/bots/bot3", time: now - 9 * min, kind: "info" },
      { id: uid(), tag: "Status", msg: "Veltrix is online and ready", time: now - 16 * min, kind: "success" },
    ],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.commands)) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

interface StoreContextValue {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  log: (tag: string, msg: string, kind?: LogEntry["kind"]) => void;
  upsertCommand: (c: Command) => void;
  removeCommand: (id: string) => void;
  duplicateCommand: (id: string) => Command | null;
  toggleCommand: (id: string) => void;
  toggleFavorite: (id: string) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<AppState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setRaw((prev) => updater(prev));
  }, []);

  const log = useCallback((tag: string, msg: string, kind: LogEntry["kind"] = "info") => {
    setRaw((prev) => ({
      ...prev,
      logs: [{ id: uid(), tag, msg, time: Date.now(), kind }, ...prev.logs].slice(0, 80),
    }));
  }, []);

  const upsertCommand = useCallback((c: Command) => {
    setRaw((prev) => {
      const idx = prev.commands.findIndex((x) => x.id === c.id);
      const next = [...prev.commands];
      const stamped = { ...c, updatedAt: Date.now() };
      if (idx >= 0) next[idx] = stamped;
      else next.push(stamped);
      return { ...prev, commands: next };
    });
  }, []);

  const removeCommand = useCallback((id: string) => {
    setRaw((prev) => ({ ...prev, commands: prev.commands.filter((c) => c.id !== id) }));
  }, []);

  const duplicateCommand = useCallback((id: string): Command | null => {
    const src = stateRef.current.commands.find((c) => c.id === id);
    if (!src) return null;
    const copy: Command = {
      ...JSON.parse(JSON.stringify(src)),
      id: uid(),
      name: `${src.name}-copy`,
      favorite: false,
      uses: 0,
      updatedAt: Date.now(),
    };
    setRaw((prev) => ({ ...prev, commands: [...prev.commands, copy] }));
    return copy;
  }, []);

  const toggleCommand = useCallback((id: string) => {
    setRaw((prev) => ({
      ...prev,
      commands: prev.commands.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setRaw((prev) => ({
      ...prev,
      commands: prev.commands.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
    }));
  }, []);

  const reset = useCallback(() => setRaw(seed()), []);

  const value = useMemo<StoreContextValue>(
    () => ({ state, setState, log, upsertCommand, removeCommand, duplicateCommand, toggleCommand, toggleFavorite, reset }),
    [state, setState, log, upsertCommand, removeCommand, duplicateCommand, toggleCommand, toggleFavorite, reset]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
