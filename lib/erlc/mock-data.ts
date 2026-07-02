import type { ErlcModerationAction, ErlcPlayer, ErlcServer, ErlcStaffRole } from "./types";

export const mockServer: ErlcServer = {
  id: "ecrp-main",
  name: "ECRP Liberty County",
  code: "ILCRPC",
  owner: "Liberty",
  region: "US-East",
  apiStatus: "connected",
  playersOnline: 31,
  maxPlayers: 40,
  activeStaff: 7,
  queue: 4,
  uptime: "18h 42m",
};

export const mockPlayers: ErlcPlayer[] = [
  { id: "p1", username: "CXUTIONWYDD", robloxId: "7656352503", team: "Civilian", status: "online", ping: 42, warnings: 1, notes: ["Verified through PrestonHQ"], playtime: "2h 14m", lastSeen: "Now" },
  { id: "p2", username: "lowe", robloxId: "184552991", team: "Sheriff", status: "staff", ping: 36, warnings: 0, notes: ["Trusted staff member"], playtime: "4h 03m", lastSeen: "Now" },
  { id: "p3", username: "Lemlegendary_yogurt", robloxId: "91244902", team: "Civilian", status: "flagged", ping: 84, warnings: 3, notes: ["Recent FRP report"], playtime: "38m", lastSeen: "2m ago" },
];

export const mockActions: ErlcModerationAction[] = [
  { id: "a1", type: "warn", staffName: "Preston", playerName: "Lemlegendary_yogurt", reason: "FRP during pursuit", severity: "medium", createdAt: new Date().toISOString() },
  { id: "a2", type: "kick", staffName: "Dream", playerName: "RandomGuest42", reason: "Ignoring staff instructions", severity: "high", createdAt: new Date().toISOString() },
  { id: "a3", type: "ban", staffName: "Liberty", playerName: "YAgooby012", reason: "Mass RDM / staff evasion", severity: "critical", createdAt: new Date().toISOString() },
];

export const mockRoles: ErlcStaffRole[] = [
  { name: "Owner", permissions: ["kick", "ban", "unban", "kill", "teleport", "privateMessage", "announce", "apiKeys", "staffRoles", "exportLogs"] },
  { name: "Admin", permissions: ["kick", "ban", "unban", "kill", "teleport", "privateMessage", "announce", "exportLogs"] },
  { name: "Moderator", permissions: ["kick", "kill", "teleport", "privateMessage", "announce"] },
  { name: "Trial Mod", permissions: ["privateMessage", "announce"] },
];
