import { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { Button, Field, Input, Toggle, cx, toast } from "../components/ui";
import { useStore } from "../store";
import { navigate } from "../router";
import { CAT_META } from "../constants";

export function Permissions() {
  const { state, setState, toggleCommand, log } = useStore();
  const [form, setForm] = useState(state.permissions);

  const save = () => {
    setState((p) => ({ ...p, permissions: form }));
    log("Permissions", "Permission settings updated", "info");
    toast("Permissions saved");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">Permissions</div>
          <h1 className="mt-1.5 text-[clamp(24px,3.2vw,34px)] font-extrabold tracking-tight">Roles &amp; access</h1>
          <p className="mt-1.5 text-[14px] text-zinc-400">Control who can run commands and where Veltrix responds.</p>
        </div>
        <Button variant="primary" onClick={save}><Save size={15} /> Save permissions</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300"><ShieldCheck size={17} /></span>
            <h3 className="font-bold">Access defaults</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default command role"><Input value={form.defaultRole} onChange={(e) => setForm({ ...form, defaultRole: e.target.value })} /></Field>
            <Field label="Admin bypass role"><Input value={form.adminBypass} onChange={(e) => setForm({ ...form, adminBypass: e.target.value })} /></Field>
            <Field label="Log channel"><Input value={form.logChannel} onChange={(e) => setForm({ ...form, logChannel: e.target.value })} /></Field>
            <Field label="Disabled channels"><Input value={form.disabledChannels} onChange={(e) => setForm({ ...form, disabledChannels: e.target.value })} /></Field>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.02] p-3.5">
            <div>
              <div className="text-[13.5px] font-semibold">Allow DM replies</div>
              <div className="text-[12px] text-zinc-500">Let Veltrix respond to direct messages</div>
            </div>
            <Toggle on={form.dmReplies} onClick={() => setForm({ ...form, dmReplies: !form.dmReplies })} />
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="mb-1 font-bold">Per-command access</h3>
          <p className="mb-3 text-[12.5px] text-zinc-500">Quick enable / disable across every command.</p>
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {state.commands.map((c) => {
              const meta = CAT_META[c.category];
              const Icon = meta.icon;
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${meta.color}1f`, color: meta.color }}><Icon size={15} /></span>
                  <button onClick={() => navigate(`/builder?id=${c.id}`)} className="min-w-0 flex-1 text-left">
                    <div className="truncate font-mono text-[13px] font-semibold">/{c.name}</div>
                    <div className="truncate text-[11px] text-zinc-500">{c.permission} · {c.roles || "any role"}</div>
                  </button>
                  <span className={cx("rounded-md px-2 py-0.5 text-[10px] font-bold", c.enabled ? "bg-emerald-500/12 text-emerald-300" : "bg-rose-500/12 text-rose-300")}>{c.enabled ? "ON" : "OFF"}</span>
                  <Toggle size="sm" on={c.enabled} onClick={() => toggleCommand(c.id)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
