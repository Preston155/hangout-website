import { useState } from "react";
import { Bot, Plus, RotateCcw, Save, Server } from "lucide-react";
import { Button, Field, Input, Badge, toast } from "../components/ui";
import { useStore } from "../store";

export function Settings() {
  const { state, setState, log, reset } = useStore();
  const [bot, setBot] = useState(state.bot);
  const [newName, setNewName] = useState("");
  const [newPm2, setNewPm2] = useState("");

  const saveBot = () => {
    setState((p) => ({ ...p, bot }));
    log("Bot", "Bot settings saved", "info");
    toast("Settings saved");
  };

  const addBot = () => {
    if (!newName.trim()) {
      toast("Enter a bot name");
      return;
    }
    log("Bot", `Registered new bot: ${newName}`, "success");
    toast(`${newName} connected`);
    setNewName("");
    setNewPm2("");
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">Settings</div>
        <h1 className="mt-1.5 text-[clamp(24px,3.2vw,34px)] font-extrabold tracking-tight">Workspace &amp; bots</h1>
        <p className="mt-1.5 text-[14px] text-zinc-400">Connect bots and configure the Veltrix workspace.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300"><Bot size={17} /></span>
              <h3 className="font-bold">Connected bot</h3>
            </div>
            <Badge tone="success">Connected</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bot name"><Input value={bot.name} onChange={(e) => setBot({ ...bot, name: e.target.value })} /></Field>
            <Field label="PM2 app"><Input value={bot.pm2} onChange={(e) => setBot({ ...bot, pm2: e.target.value })} /></Field>
            <Field label="Package"><Input value={bot.pkg} onChange={(e) => setBot({ ...bot, pkg: e.target.value })} /></Field>
            <Field label="Source path"><Input value={bot.source} onChange={(e) => setBot({ ...bot, source: e.target.value })} /></Field>
          </div>
          <Button variant="primary" className="mt-4" onClick={saveBot}><Save size={15} /> Save settings</Button>
        </div>

        <div className="space-y-5">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] text-zinc-300"><Plus size={17} /></span>
              <h3 className="font-bold">Add another bot</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bot name"><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ECRP Assistant" /></Field>
              <Field label="PM2 app"><Input value={newPm2} onChange={(e) => setNewPm2(e.target.value)} placeholder="bot4" /></Field>
            </div>
            <Button variant="subtle" className="mt-4" onClick={addBot}><Plus size={15} /> Connect bot</Button>
          </div>

          <div className="panel p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] text-zinc-300"><Server size={17} /></span>
              <h3 className="font-bold">Workspaces</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.servers.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[12.5px] font-medium text-zinc-300">{s}</span>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/12 text-rose-300"><RotateCcw size={16} /></span>
              <h3 className="font-bold">Reset dashboard</h3>
            </div>
            <p className="mb-3 text-[13px] text-zinc-500">Restore the default commands and clear local changes on this device.</p>
            <Button variant="danger" onClick={() => { reset(); toast("Dashboard reset"); }}><RotateCcw size={15} /> Reset to defaults</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
