import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button, cx, toast } from "../components/ui";
import { ActivityFeed } from "../components/ActivityFeed";
import { useStore } from "../store";
import { timeAgo } from "../constants";

export function Logs() {
  const { state, setState, log } = useStore();

  const clear = () => {
    setState((p) => ({ ...p, logs: [] }));
    log("System", "Activity log cleared", "warn");
    toast("Logs cleared");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">Activity</div>
          <h1 className="mt-1.5 text-[clamp(24px,3.2vw,34px)] font-extrabold tracking-tight">Activity timeline</h1>
          <p className="mt-1.5 text-[14px] text-zinc-400">Command edits, syncs and bot status changes.</p>
        </div>
        <Button variant="danger" onClick={clear}><Trash2 size={15} /> Clear logs</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="panel p-5">
          <h3 className="mb-3 font-bold">Timeline</h3>
          <ActivityFeed logs={state.logs} />
        </div>
        <div className="panel h-fit p-5">
          <h3 className="mb-3 font-bold">Summary</h3>
          {(["success", "info", "warn", "danger"] as const).map((k) => {
            const count = state.logs.filter((l) => l.kind === k).length;
            const colors = { success: "bg-emerald-400", info: "bg-brand-400", warn: "bg-amber-400", danger: "bg-rose-400" } as const;
            return (
              <div key={k} className="flex items-center justify-between border-b border-white/[.05] py-2.5 last:border-0">
                <span className="flex items-center gap-2.5 text-[13px] capitalize text-zinc-400">
                  <span className={cx("h-2 w-2 rounded-full", colors[k])} /> {k}
                </span>
                <span className="text-[13px] font-bold">{count}</span>
              </div>
            );
          })}
          {state.logs[0] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-white/[.06] bg-white/[.02] p-3">
              <div className="text-[11px] text-zinc-500">Last event</div>
              <div className="mt-0.5 text-[13px] font-semibold">{state.logs[0].tag}</div>
              <div className="text-[12px] text-zinc-500">{timeAgo(state.logs[0].time)}</div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
