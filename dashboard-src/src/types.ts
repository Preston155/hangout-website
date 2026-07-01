export type CommandType = "slash" | "prefix" | "auto";

export type CommandCategory =
  | "Slash commands"
  | "Prefix commands"
  | "Moderation"
  | "Tickets"
  | "Giveaways"
  | "Sessions"
  | "Utility"
  | "Systems/Automation";

export interface BotCommand {
  id: string;
  name: string;
  type: CommandType;
  description: string;
  usage: string;
  permission: string;
  cooldown: number | null;
  enabled: boolean;
  category: CommandCategory;
  source: string;
  aliases?: string[];
}

export interface BotStatus {
  pm2: string;
  online: boolean;
  status: string;
  uptime?: number | null;
  restarts?: number;
  memoryMb?: number;
  cpu?: number;
}

export interface BotCatalog {
  id: string;
  name: string;
  pm2: string;
  root: string;
  prefix: string;
  accent: string;
  status: BotStatus;
  stats: {
    total: number;
    slash: number;
    prefix: number;
    automation: number;
  };
  commands: BotCommand[];
}

export interface Catalog {
  generatedAt: string;
  categories: CommandCategory[];
  bots: BotCatalog[];
}
