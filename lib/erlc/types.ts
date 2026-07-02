export type ErlcSeverity = "low" | "medium" | "high" | "critical";
export type ErlcActionType = "warn" | "kick" | "ban" | "unban" | "kill" | "teleport" | "pm" | "announce";

export interface ErlcServer {
  id: string;
  name: string;
  code: string;
  owner: string;
  region: string;
  apiStatus: "connected" | "degraded" | "offline";
  playersOnline: number;
  maxPlayers: number;
  activeStaff: number;
  queue: number;
  uptime: string;
}

export interface ErlcPlayer {
  id: string;
  username: string;
  robloxId: string;
  team: string;
  status: "online" | "staff" | "flagged" | "banned";
  ping: number;
  warnings: number;
  notes: string[];
  playtime: string;
  lastSeen: string;
}

export interface ErlcModerationAction {
  id: string;
  type: ErlcActionType;
  staffName: string;
  playerName: string;
  reason: string;
  severity: ErlcSeverity;
  createdAt: string;
}

export type ErlcPermission =
  | "kick"
  | "ban"
  | "unban"
  | "kill"
  | "teleport"
  | "privateMessage"
  | "announce"
  | "apiKeys"
  | "staffRoles"
  | "exportLogs";

export interface ErlcStaffRole {
  name: "Owner" | "Admin" | "Moderator" | "Trial Mod";
  permissions: ErlcPermission[];
}
