export type Category = "Moderation" | "Tickets" | "Fun" | "Utility" | "Economy" | "Logging";

export interface CommandOption {
  id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface EmbedField {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedButton {
  id: string;
  label: string;
  style: "Primary" | "Secondary" | "Success" | "Danger" | "Link";
  url: string;
}

export interface CommandEmbed {
  enabled: boolean;
  author: string;
  authorIcon: string;
  title: string;
  description: string;
  color: string;
  thumbnail: string;
  image: string;
  footer: string;
  footerIcon: string;
  fields: EmbedField[];
  buttons: EmbedButton[];
}

export interface Command {
  id: string;
  name: string;
  category: Category;
  description: string;
  enabled: boolean;
  favorite: boolean;
  cooldown: number;
  permission: string;
  roles: string;
  ephemeral: boolean;
  response: string;
  options: CommandOption[];
  embed: CommandEmbed;
  uses: number;
  updatedAt: number;
}

export interface LogEntry {
  id: string;
  tag: string;
  msg: string;
  time: number;
  kind: "info" | "success" | "warn" | "danger";
}

export interface BotInfo {
  name: string;
  pkg: string;
  pm2: string;
  source: string;
  connected: boolean;
}

export interface Permissions {
  defaultRole: string;
  adminBypass: string;
  logChannel: string;
  disabledChannels: string;
  dmReplies: boolean;
}

export interface User {
  name: string;
  id: string;
}

export interface AppState {
  user: User | null;
  bot: BotInfo;
  server: string;
  servers: string[];
  permissions: Permissions;
  commands: Command[];
  logs: LogEntry[];
}
