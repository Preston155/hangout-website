import { motion } from "framer-motion";
import { useState } from "react";
import { Star, Pencil, Copy, Trash2, MoreVertical, Clock, Activity } from "lucide-react";
import type { Command } from "../types";
import { CAT_META, timeAgo } from "../constants";
import { Toggle, Badge, cx } from "./ui";

export function CommandCard({
  command,
  index = 0,
  onToggle,
  onFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  command: Command;
  index?: number;
  onToggle: () => void;
  onFavorite: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const meta = CAT_META[command.category];
  const Icon = meta.icon;
  const [menu, setMenu] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), type: "spring", stiffness: 240, damping: 24 }}
      whileHover={{ y: -6 }}
      onClick={onEdit}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/[.08] bg-white/[.025] p-5 transition-colors hover:border-white/[.16]"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-70 blur-2xl transition-all duration-300 group-hover:scale-125 group-hover:opacity-100"
        style={{ background: meta.glow }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.ring}, transparent)` }}
      />

      <div className="relative flex items-start justify-between">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}99)`, boxShadow: `0 10px 30px -10px ${meta.color}` }}
        >
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onFavorite}
            className={cx("grid h-8 w-8 place-items-center rounded-lg transition", command.favorite ? "text-amber-300" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5")}
            title="Favorite"
          >
            <Star size={15} fill={command.favorite ? "currentColor" : "none"} />
          </button>
          <Toggle on={command.enabled} onClick={onToggle} size="sm" />
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
              <MoreVertical size={15} />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="glass-strong absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl p-1 shadow-card"
                >
                  <MenuItem icon={Pencil} label="Edit" onClick={() => { setMenu(false); onEdit(); }} />
                  <MenuItem icon={Copy} label="Duplicate" onClick={() => { setMenu(false); onDuplicate(); }} />
                  <MenuItem icon={Trash2} label="Delete" danger onClick={() => { setMenu(false); onDelete(); }} />
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="relative mt-4 font-mono text-lg font-bold tracking-tight">
        <span className="text-zinc-500">/</span>
        {command.name}
      </h3>
      <p className="relative mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-zinc-400">{command.description}</p>

      <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
        <Badge tone={command.enabled ? "success" : "danger"}>
          <span className={cx("h-1.5 w-1.5 rounded-full", command.enabled ? "bg-emerald-400" : "bg-rose-400")} />
          {command.enabled ? "Active" : "Disabled"}
        </Badge>
        <Badge>
          <Icon size={11} style={{ color: meta.color }} />
          {command.category}
        </Badge>
        <Badge>{command.permission}</Badge>
      </div>

      <div className="relative mt-4 flex items-center justify-between border-t border-white/[.06] pt-3 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <Activity size={12} /> {command.uses.toLocaleString()} uses
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} /> {timeAgo(command.updatedAt)}
        </span>
      </div>
    </motion.article>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
        danger ? "text-rose-300 hover:bg-rose-500/15" : "text-zinc-300 hover:bg-white/8 hover:text-white"
      )}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
