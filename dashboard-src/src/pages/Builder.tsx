import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowLeft, GripVertical, Image as ImageIcon, Layers, ListTree, MessageSquare, Plus, Save, Settings2, Trash2, Wand2 } from "lucide-react";
import { Button, Field, Input, Select, Textarea, Toggle, Badge, cx, toast } from "../components/ui";
import { DiscordPreview } from "../components/DiscordPreview";
import { useStore, mkEmbed } from "../store";
import { navigate } from "../router";
import { BUTTON_STYLES, CATEGORIES, CAT_META, OPTION_TYPES, PERMISSIONS, uid } from "../constants";
import type { Category, Command, EmbedButton, EmbedField } from "../types";

type Tab = "general" | "options" | "response" | "embed";

function freshCommand(): Command {
  return {
    id: uid(),
    name: "new-command",
    category: "Utility",
    description: "A new command built from PrestonHQ.",
    enabled: true,
    favorite: false,
    cooldown: 5,
    permission: "Manage Messages",
    roles: "Staff",
    ephemeral: false,
    response: "",
    options: [],
    embed: mkEmbed({ title: "New Command", description: "Built with the PrestonHQ embed builder.", color: "#6366f1" }),
    uses: 0,
    updatedAt: Date.now(),
  };
}

export function Builder() {
  const { state, upsertCommand, log } = useStore();
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const isNew = pathname === "/new";
  const id = params.get("id");

  const initial = useMemo<Command>(() => {
    if (isNew) return freshCommand();
    const found = state.commands.find((c) => c.id === id) || state.commands[0];
    return found ? JSON.parse(JSON.stringify(found)) : freshCommand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draft, setDraft] = useState<Command>(initial);
  const [tab, setTab] = useState<Tab>(pathname === "/embeds" ? "embed" : "general");
  const [dirty, setDirty] = useState(isNew);

  const patch = (p: Partial<Command>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDirty(true);
  };
  const patchEmbed = (p: Partial<Command["embed"]>) => {
    setDraft((d) => ({ ...d, embed: { ...d.embed, ...p } }));
    setDirty(true);
  };

  const save = () => {
    const clean: Command = { ...draft, name: draft.name.trim().toLowerCase().replace(/\s+/g, "-") || "command" };
    upsertCommand(clean);
    setDraft(clean);
    setDirty(false);
    log(isNew ? "Create" : "Publish", `/${clean.name} ${isNew ? "created" : "updated"} from the website`, "success");
    toast(`/${clean.name} ${isNew ? "created" : "saved"}`);
    if (isNew) navigate(`/builder?id=${clean.id}`);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "general", label: "General", icon: Settings2 },
    { id: "options", label: "Options", icon: ListTree },
    { id: "response", label: "Response", icon: MessageSquare },
    { id: "embed", label: "Embed", icon: Layers },
  ];

  const meta = CAT_META[draft.category];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/commands")} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white">
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[.16em] text-brand-300">{isNew ? "Create command" : "Command builder"}</div>
            <h1 className="mt-0.5 flex items-center gap-2 font-mono text-[clamp(20px,3vw,28px)] font-extrabold tracking-tight">
              <span className="text-zinc-600">/</span>{draft.name || "command"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {dirty ? <Badge tone="brand">Unsaved changes</Badge> : <Badge tone="success">Saved</Badge>}
          <Button variant="primary" onClick={save}>
            <Save size={15} /> {isNew ? "Create command" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
        {/* Config */}
        <div className="panel overflow-hidden p-0">
          <div className="flex gap-1 border-b border-white/[.07] p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  "relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition",
                  tab === t.id ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                {tab === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-brand-500/18 ring-1 ring-brand-500/30" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                <t.icon size={15} className="relative" />
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
                {tab === "general" && (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 text-[12.5px] font-medium text-zinc-400">Category</div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {CATEGORIES.map((cat) => {
                          const m = CAT_META[cat];
                          const Icon = m.icon;
                          const on = draft.category === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => patch({ category: cat })}
                              className={cx(
                                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition",
                                on ? "border-transparent text-white" : "border-white/[.08] text-zinc-400 hover:border-white/20 hover:text-white"
                              )}
                              style={on ? { background: `${m.color}1f`, boxShadow: `inset 0 0 0 1px ${m.ring}` } : undefined}
                            >
                              <Icon size={17} style={{ color: m.color }} />
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Command name" hint={`Becomes /${draft.name || "command"}`}>
                        <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
                      </Field>
                      <Field label="Required permission">
                        <Select value={draft.permission} onChange={(e) => patch({ permission: e.target.value })}>
                          {PERMISSIONS.map((p) => <option key={p}>{p}</option>)}
                        </Select>
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Description">
                          <Input value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
                        </Field>
                      </div>
                      <Field label="Cooldown (seconds)">
                        <Input type="number" min={0} value={draft.cooldown} onChange={(e) => patch({ cooldown: Number(e.target.value || 0) })} />
                      </Field>
                      <Field label="Allowed roles" hint="Comma separated">
                        <Input value={draft.roles} onChange={(e) => patch({ roles: e.target.value })} placeholder="Staff, Moderator" />
                      </Field>
                    </div>
                    <div className="flex flex-col gap-2.5 rounded-xl border border-white/[.07] bg-white/[.02] p-3.5">
                      <ToggleRow label="Ephemeral response" desc="Only the user who ran it can see the reply" on={draft.ephemeral} onClick={() => patch({ ephemeral: !draft.ephemeral })} />
                      <ToggleRow label="Command enabled" desc="Turn this command on or off" on={draft.enabled} onClick={() => patch({ enabled: !draft.enabled })} />
                    </div>
                  </div>
                )}

                {tab === "options" && (
                  <div className="space-y-3">
                    <Header icon={ListTree} title="Slash options" desc={`Arguments users pass to /${draft.name}`} />
                    {draft.options.length === 0 && <Empty text="No options yet — great for simple commands." />}
                    {draft.options.map((o, i) => (
                      <motion.div key={o.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/[.08] bg-white/[.02] p-3">
                        <div className="flex items-center gap-2">
                          <GripVertical size={15} className="shrink-0 text-zinc-600" />
                          <Input
                            value={o.name}
                            placeholder="name"
                            onChange={(e) => patch({ options: draft.options.map((x) => (x.id === o.id ? { ...x, name: e.target.value } : x)) })}
                          />
                          <Select
                            value={o.type}
                            className="max-w-[140px]"
                            onChange={(e) => patch({ options: draft.options.map((x) => (x.id === o.id ? { ...x, type: e.target.value } : x)) })}
                          >
                            {OPTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </Select>
                          <button
                            onClick={() => patch({ options: draft.options.filter((x) => x.id !== o.id) })}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Input
                            value={o.description}
                            placeholder="Option description"
                            onChange={(e) => patch({ options: draft.options.map((x) => (x.id === o.id ? { ...x, description: e.target.value } : x)) })}
                          />
                          <label className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-zinc-400">
                            <Toggle size="sm" on={o.required} onClick={() => patch({ options: draft.options.map((x) => (x.id === o.id ? { ...x, required: !x.required } : x)) })} />
                            Required
                          </label>
                        </div>
                      </motion.div>
                    ))}
                    <AddButton label="Add option" onClick={() => patch({ options: [...draft.options, { id: uid(), name: `option${draft.options.length + 1}`, type: "string", description: "", required: false }] })} />
                  </div>
                )}

                {tab === "response" && (
                  <div className="space-y-4">
                    <Header icon={MessageSquare} title="Reply" desc="The text Veltrix sends back" />
                    <Field label="Response text" hint="Variables: {amount}, {user}, {server}">
                      <Textarea value={draft.response} onChange={(e) => patch({ response: e.target.value })} placeholder="What the bot replies with…" />
                    </Field>
                    <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-3.5">
                      <ToggleRow label="Attach embed" desc="Send the embed below alongside the reply" on={draft.embed.enabled} onClick={() => patchEmbed({ enabled: !draft.embed.enabled })} />
                    </div>
                    <Button variant="subtle" onClick={() => setTab("embed")}>
                      <Layers size={15} /> Open embed builder
                    </Button>
                  </div>
                )}

                {tab === "embed" && (
                  <EmbedEditor draft={draft} patchEmbed={patchEmbed} />
                )}
            </motion.div>
          </div>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-24 xl:h-fit">
          <div className="mb-2.5 flex items-center gap-2 px-1 text-[12px] font-semibold text-zinc-500">
            <Wand2 size={14} className="text-brand-400" /> Live preview · updates instantly
          </div>
          <DiscordPreview command={draft} botName={state.bot.name} />
          <div className="mt-3 flex flex-wrap gap-1.5 px-1">
            <Badge tone={draft.enabled ? "success" : "danger"}>{draft.enabled ? "Active" : "Disabled"}</Badge>
            <Badge>{draft.permission}</Badge>
            <Badge>{draft.cooldown}s cooldown</Badge>
            {draft.ephemeral && <Badge tone="brand">Ephemeral</Badge>}
            <Badge>
              <meta.icon size={11} style={{ color: meta.color }} /> {draft.category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedEditor({ draft, patchEmbed }: { draft: Command; patchEmbed: (p: Partial<Command["embed"]>) => void }) {
  const e = draft.embed;
  const fields = e.fields;
  const buttons = e.buttons;
  const upField = (id: string, p: Partial<EmbedField>) => patchEmbed({ fields: fields.map((f) => (f.id === id ? { ...f, ...p } : f)) });
  const upBtn = (id: string, p: Partial<EmbedButton>) => patchEmbed({ buttons: buttons.map((b) => (b.id === id ? { ...b, ...p } : b)) });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Author name"><Input value={e.author} onChange={(ev) => patchEmbed({ author: ev.target.value })} /></Field>
        <Field label="Author icon URL"><Input value={e.authorIcon} onChange={(ev) => patchEmbed({ authorIcon: ev.target.value })} placeholder="https://…" /></Field>
        <div className="sm:col-span-2"><Field label="Title"><Input value={e.title} onChange={(ev) => patchEmbed({ title: ev.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field label="Description"><Textarea value={e.description} onChange={(ev) => patchEmbed({ description: ev.target.value })} /></Field></div>
        <Field label="Accent color">
          <div className="flex items-center gap-2.5">
            <input type="color" value={e.color} onChange={(ev) => patchEmbed({ color: ev.target.value })} className="h-11 w-12 rounded-xl" />
            <Input value={e.color} onChange={(ev) => patchEmbed({ color: ev.target.value })} />
          </div>
        </Field>
        <Field label="Thumbnail URL"><Input value={e.thumbnail} onChange={(ev) => patchEmbed({ thumbnail: ev.target.value })} placeholder="https://…" /></Field>
        <div className="sm:col-span-2"><Field label="Image URL"><Input value={e.image} onChange={(ev) => patchEmbed({ image: ev.target.value })} placeholder="https://…" /></Field></div>
        <Field label="Footer text"><Input value={e.footer} onChange={(ev) => patchEmbed({ footer: ev.target.value })} /></Field>
        <Field label="Footer icon URL"><Input value={e.footerIcon} onChange={(ev) => patchEmbed({ footerIcon: ev.target.value })} placeholder="https://…" /></Field>
      </div>

      {/* Fields */}
      <div>
        <Header icon={ListTree} title="Fields" desc="Up to 25 — toggle inline for side-by-side" />
        <div className="space-y-2">
          {fields.map((f) => (
            <motion.div key={f.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/[.08] bg-white/[.02] p-3">
              <div className="flex items-center gap-2">
                <Input value={f.name} placeholder="Field name" onChange={(ev) => upField(f.id, { name: ev.target.value })} />
                <label className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-zinc-400">
                  <Toggle size="sm" on={f.inline} onClick={() => upField(f.id, { inline: !f.inline })} /> Inline
                </label>
                <button onClick={() => patchEmbed({ fields: fields.filter((x) => x.id !== f.id) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-2"><Input value={f.value} placeholder="Field value" onChange={(ev) => upField(f.id, { value: ev.target.value })} /></div>
            </motion.div>
          ))}
        </div>
        {fields.length === 0 && <Empty text="No fields yet." />}
        <div className="mt-2"><AddButton label="Add field" disabled={fields.length >= 25} onClick={() => patchEmbed({ fields: [...fields, { id: uid(), name: "Field", value: "Value", inline: false }] })} /></div>
      </div>

      {/* Buttons */}
      <div>
        <Header icon={ImageIcon} title="Buttons" desc="Up to 5 — link buttons need a URL" />
        <div className="space-y-2">
          {buttons.map((b) => (
            <motion.div key={b.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.02] p-3">
              <Input value={b.label} placeholder="Label" onChange={(ev) => upBtn(b.id, { label: ev.target.value })} />
              <Select value={b.style} className="max-w-[130px]" onChange={(ev) => upBtn(b.id, { style: ev.target.value as EmbedButton["style"] })}>
                {BUTTON_STYLES.map((s) => <option key={s}>{s}</option>)}
              </Select>
              <Input value={b.url} placeholder="URL" onChange={(ev) => upBtn(b.id, { url: ev.target.value })} />
              <button onClick={() => patchEmbed({ buttons: buttons.filter((x) => x.id !== b.id) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
        {buttons.length === 0 && <Empty text="No buttons yet." />}
        <div className="mt-2"><AddButton label="Add button" disabled={buttons.length >= 5} onClick={() => patchEmbed({ buttons: [...buttons, { id: uid(), label: "Button", style: "Primary", url: "" }] })} /></div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, on, onClick }: { label: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[13.5px] font-semibold">{label}</div>
        <div className="text-[12px] text-zinc-500">{desc}</div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

function Header({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="mb-1 flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.06] text-brand-300"><Icon size={15} /></span>
      <div>
        <div className="text-[14px] font-bold">{title}</div>
        <div className="text-[12px] text-zinc-500">{desc}</div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13px] text-zinc-500">{text}</div>;
}

function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[.015] py-3 text-[13px] font-semibold text-zinc-300 transition hover:border-brand-500/50 hover:bg-brand-500/[.06] hover:text-white disabled:opacity-40 disabled:pointer-events-none"
    >
      <Plus size={15} /> {label}
    </button>
  );
}
