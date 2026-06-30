import { motion } from "framer-motion";
import type { Command } from "../types";
import { safeUrl } from "../constants";

const btnStyle: Record<string, string> = {
  Primary: "bg-[#5865f2]",
  Secondary: "bg-[#4e5058]",
  Success: "bg-[#248046]",
  Danger: "bg-[#da373c]",
  Link: "bg-[#4e5058]",
};

export function DiscordPreview({ command, botName, showSlash = true }: { command: Command; botName: string; showSlash?: boolean }) {
  const e = command.embed;
  const initial = (botName || "V")[0]?.toUpperCase() ?? "V";
  const args = command.options.filter((o) => o.name).map((o) => `${o.name}${o.required ? "" : "?"}:`);
  const fields = e.fields.filter((f) => f.name || f.value);
  const buttons = e.buttons.filter((b) => b.label);
  const thumb = safeUrl(e.thumbnail);
  const image = safeUrl(e.image);
  const authorIcon = safeUrl(e.authorIcon);
  const footerIcon = safeUrl(e.footerIcon);

  return (
    <div className="rounded-2xl border border-black/40 bg-[#313338] p-4 shadow-card">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#949ba4]">Live Discord preview</div>

      {showSlash && (
        <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-[#383a40] p-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5865f2] to-[#8b5cf6] text-xs font-black text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white">
              <span className="rounded bg-[#5865f2]/15 px-1.5 py-0.5 font-semibold text-[#a8c7fa]">/{command.name || "command"}</span>{" "}
              {args.map((a, i) => (
                <span key={i} className="text-[13px] text-[#a8c7fa]">{a} </span>
              ))}
            </div>
            <div className="mt-1 text-[13px] leading-snug text-[#b5bac1]">{command.description || "No description"}</div>
          </div>
        </div>
      )}

      <motion.div layout className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5865f2] to-[#8b5cf6] font-black text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{botName}</span>
            <span className="rounded bg-[#5865f2] px-1.5 py-px text-[10px] font-bold text-white">APP</span>
            <span className="text-[11px] text-[#949ba4]">today at 12:00</span>
          </div>

          {command.response && <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">{command.response}</div>}

          {e.enabled && (e.title || e.description || fields.length || image || e.author) && (
            <motion.div
              layout
              className="mt-1.5 max-w-[460px] overflow-hidden rounded-md bg-[#2b2d31] p-3.5"
              style={{ borderLeft: `4px solid ${e.color || "#6366f1"}` }}
            >
              {thumb && <img src={thumb} alt="" className="float-right ml-3 h-16 w-16 rounded-lg object-cover" />}
              {e.author && (
                <div className="mb-1.5 flex items-center gap-2">
                  {authorIcon && <img src={authorIcon} alt="" className="h-6 w-6 rounded-full" />}
                  <span className="text-[13px] font-semibold text-white">{e.author}</span>
                </div>
              )}
              {e.title && <div className="mb-1.5 font-bold text-white">{e.title}</div>}
              {e.description && <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">{e.description}</div>}
              {fields.length > 0 && (
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {fields.map((f) => (
                    <div key={f.id} className={f.inline ? "min-w-0" : "col-span-3"}>
                      <div className="text-[13px] font-semibold text-white">{f.name}</div>
                      <div className="whitespace-pre-wrap text-[13px] text-[#dbdee1]">{f.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {image && <img src={image} alt="" className="mt-3 w-full rounded-lg object-cover" />}
              {e.footer && (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-[#949ba4]">
                  {footerIcon && <img src={footerIcon} alt="" className="h-4 w-4 rounded-full" />}
                  <span>{e.footer}</span>
                </div>
              )}
            </motion.div>
          )}

          {buttons.length > 0 && (
            <div className="mt-2 flex max-w-[460px] flex-wrap gap-2">
              {buttons.map((b) => (
                <span key={b.id} className={`rounded-md px-3.5 py-2 text-[13px] font-semibold text-white ${btnStyle[b.style] || btnStyle.Primary}`}>
                  {b.label}
                  {b.style === "Link" && " ↗"}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
