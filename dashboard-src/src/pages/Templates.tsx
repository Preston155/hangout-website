import { motion } from "framer-motion";
import { ArrowRight, Bot, Coins, Gift, MessageSquarePlus, ScrollText, Shield, Sparkles, Ticket, UserPlus } from "lucide-react";
import { useStore, mkEmbed } from "../store";
import { navigate } from "../router";
import { toast } from "../components/ui";
import { uid } from "../constants";
import type { Category, Command } from "../types";

interface Tpl {
  key: string;
  name: string;
  icon: any;
  desc: string;
  accent: string;
  build: () => Command;
}

const base = (p: Partial<Command> & Pick<Command, "name" | "category" | "description">): Command => ({
  id: uid(),
  enabled: true,
  favorite: false,
  cooldown: 5,
  permission: "Manage Server",
  roles: "Staff",
  ephemeral: false,
  response: "",
  options: [],
  embed: mkEmbed(),
  uses: 0,
  updatedAt: Date.now(),
  ...p,
});

const TEMPLATES: Tpl[] = [
  { key: "moderation", name: "Moderation", icon: Shield, accent: "#f43f5e", desc: "Warn, mute, kick and ban with reasons and logging.", build: () => base({ name: "moderate", category: "Moderation" as Category, description: "Moderate a member: warn, mute, kick or ban.", permission: "Ban Members", roles: "Moderator", options: [{ id: uid(), name: "member", type: "user", description: "Member to action", required: true }, { id: uid(), name: "action", type: "string", description: "warn / mute / kick / ban", required: true }, { id: uid(), name: "reason", type: "string", description: "Reason", required: false }], embed: mkEmbed({ title: "Moderation Action", description: "Action applied successfully.", color: "#f43f5e", fields: [{ id: uid(), name: "Member", value: "{member}", inline: true }, { id: uid(), name: "Action", value: "{action}", inline: true }] }) }) },
  { key: "tickets", name: "Tickets", icon: Ticket, accent: "#22c55e", desc: "Post a support panel with category buttons.", build: () => base({ name: "ticket-panel", category: "Tickets", description: "Post the support ticket panel.", options: [{ id: uid(), name: "channel", type: "channel", description: "Channel for the panel", required: true }], embed: mkEmbed({ title: "Support Center", description: "Click a button to open a ticket.", color: "#22c55e", buttons: [{ id: uid(), label: "Open Ticket", style: "Success", url: "" }] }) }) },
  { key: "welcome", name: "Welcome", icon: UserPlus, accent: "#6366f1", desc: "Greet new members with a styled embed.", build: () => base({ name: "welcome", category: "Utility", description: "Configure the welcome message.", options: [{ id: uid(), name: "channel", type: "channel", description: "Welcome channel", required: true }], embed: mkEmbed({ title: "Welcome!", description: "Welcome {user} to {server}! 🎉", color: "#6366f1" }) }) },
  { key: "automod", name: "AutoMod", icon: Bot, accent: "#ef4444", desc: "Filter spam, links and blocked words.", build: () => base({ name: "automod", category: "Moderation", description: "Configure automatic moderation filters.", permission: "Manage Server", roles: "Admin", options: [{ id: uid(), name: "filter", type: "string", description: "spam / links / words", required: true }, { id: uid(), name: "enabled", type: "boolean", description: "On or off", required: true }], embed: mkEmbed({ title: "AutoMod Updated", description: "Your automod filters were updated.", color: "#ef4444" }) }) },
  { key: "giveaways", name: "Giveaways", icon: Gift, accent: "#f59e0b", desc: "Run trackable giveaways with entry buttons.", build: () => base({ name: "giveaway", category: "Fun", description: "Start a giveaway.", roles: "Events Team", cooldown: 20, options: [{ id: uid(), name: "prize", type: "string", description: "Prize", required: true }, { id: uid(), name: "winners", type: "integer", description: "Winners", required: false }], embed: mkEmbed({ title: "🎉 Giveaway", description: "Click below to enter!", color: "#f59e0b", buttons: [{ id: uid(), label: "Enter", style: "Primary", url: "" }] }) }) },
  { key: "reaction-roles", name: "Reaction Roles", icon: Sparkles, accent: "#8b5cf6", desc: "Self-assign roles with buttons.", build: () => base({ name: "reaction-roles", category: "Utility", description: "Post a reaction role panel.", permission: "Manage Roles", options: [{ id: uid(), name: "channel", type: "channel", description: "Channel", required: true }], embed: mkEmbed({ title: "Reaction Roles", description: "Click a button to toggle a role.", color: "#8b5cf6", buttons: [{ id: uid(), label: "Member", style: "Secondary", url: "" }] }) }) },
  { key: "economy", name: "Economy", icon: Coins, accent: "#eab308", desc: "Balance, daily rewards and a coin shop.", build: () => base({ name: "balance", category: "Economy", description: "Check your coin balance.", permission: "Everyone", roles: "Member", options: [{ id: uid(), name: "user", type: "user", description: "Whose balance", required: false }], embed: mkEmbed({ title: "💰 Balance", description: "Here is the current balance.", color: "#eab308", fields: [{ id: uid(), name: "Coins", value: "1,250", inline: true }] }) }) },
  { key: "logging", name: "Logging", icon: ScrollText, accent: "#38bdf8", desc: "Log edits, deletes, joins and leaves.", build: () => base({ name: "logging", category: "Logging", description: "Configure server logging.", roles: "Admin", options: [{ id: uid(), name: "channel", type: "channel", description: "Log channel", required: true }, { id: uid(), name: "events", type: "string", description: "edits / deletes / joins / all", required: true }], embed: mkEmbed({ title: "Logging Enabled", description: "Server events will now be logged.", color: "#38bdf8" }) }) },
];

export function Templates() {
  const { upsertCommand, log } = useStore();

  const use = (t: Tpl) => {
    const cmd = t.build();
    upsertCommand(cmd);
    log("Template", `${t.name} template added as /${cmd.name}`, "success");
    toast(`${t.name} template added`);
    navigate(`/builder?id=${cmd.id}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">Templates</div>
        <h1 className="mt-1.5 text-[clamp(24px,3.2vw,34px)] font-extrabold tracking-tight">Start from a blueprint</h1>
        <p className="mt-1.5 text-[14px] text-zinc-400">One click adds a polished, ready-to-edit command to Veltrix.</p>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -6 }}
              onClick={() => use(t)}
              className="group relative overflow-hidden rounded-3xl border border-white/[.08] bg-white/[.025] p-5 text-left transition-colors hover:border-white/[.18]"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-60 blur-2xl transition-all duration-300 group-hover:scale-125 group-hover:opacity-100" style={{ background: `${t.accent}33` }} />
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`, boxShadow: `0 12px 32px -12px ${t.accent}` }}>
                <Icon size={22} />
              </div>
              <h3 className="relative mt-4 text-[16px] font-bold">{t.name}</h3>
              <p className="relative mt-1.5 text-[13px] leading-relaxed text-zinc-400">{t.desc}</p>
              <div className="relative mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-300 opacity-0 transition group-hover:opacity-100">
                <MessageSquarePlus size={14} /> Add command <ArrowRight size={13} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
