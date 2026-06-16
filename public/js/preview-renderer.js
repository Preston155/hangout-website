/* Discord-style command preview renderer — Veltrix */

function escPreview(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function previewCopyText(cmd) {
  const type = cmd.type || "system";
  if (type === "slash") return `/${cmd.name}`;
  if (type === "prefix") {
    const base = cmd.usage ? cmd.usage.split(" ")[0] : `.${cmd.name}`;
    return base.startsWith(".") ? base : `.${base}`;
  }
  return cmd.name;
}

function previewKey(cmd, catId) {
  return `${catId}:${cmd.name}:${cmd.type || "system"}`;
}

function previewLookupKey(cmd, catId) {
  return `${cmd.type || "prefix"}:${cmd.name}`;
}

function isPreviewableCommand(cmd) {
  const type = cmd.type || "system";
  if (type !== "slash" && type !== "prefix") return false;
  if (!/^[\w.-]+$/i.test(cmd.name) || cmd.name.length > 40) return false;
  return true;
}

function renderDiscordEmbedHtml(embed, compact) {
  if (!embed) return "";
  const color = embed.color || "#2b7fff";
  const fields = (embed.fields || [])
    .slice(0, compact ? 2 : undefined)
    .map(
      (f) =>
        `<div class="d-embed__field${f.inline ? " d-embed__field--inline" : ""}">
          <div class="d-embed__field-name">${escPreview(f.name)}</div>
          <div class="d-embed__field-value">${escPreview(f.value)}</div>
        </div>`,
    )
    .join("");

  const buttons = compact
    ? ""
    : (embed.buttons || [])
        .map((b) => `<span class="d-btn d-btn--${escPreview(b.style || "secondary")}">${escPreview(b.label)}</span>`)
        .join("");

  const selects = compact
    ? ""
    : (embed.select || [])
        .map((s) => `<div class="d-select"><span class="d-select__placeholder">${escPreview(s.placeholder || "Select…")}</span></div>`)
        .join("");

  return `<div class="d-embed${compact ? " d-embed--compact" : ""}" style="--embed-color: ${escPreview(color)}">
    ${
      embed.author
        ? `<div class="d-embed__author">${embed.author.icon !== false ? `<span class="d-embed__author-icon"></span>` : ""}<span>${escPreview(embed.author.name)}</span></div>`
        : ""
    }
    ${embed.title ? `<div class="d-embed__title">${escPreview(embed.title)}</div>` : ""}
    ${embed.descPreviewription ? `<div class="d-embed__descPreview">${escPreview(embed.descPreviewription)}</div>` : ""}
    ${fields ? `<div class="d-embed__fields">${fields}</div>` : ""}
    ${embed.footer ? `<div class="d-embed__footer">${escPreview(embed.footer.text)}</div>` : ""}
    ${buttons ? `<div class="d-embed__buttons">${buttons}</div>` : ""}
    ${selects ? `<div class="d-embed__buttons">${selects}</div>` : ""}
  </div>`;
}

function renderPreviewStep(step) {
  if (step.type === "note") {
    return `<div class="d-preview__note">${formatPreviewText(step.text)}</div>`;
  }

  if (step.type === "deleted") {
    return `<div class="d-preview__deleted"><span>🗑️</span> ${escPreview(step.text || "Message deleted")}</div>`;
  }

  if (step.type === "channel") {
    return `<div class="d-preview__channel"><span class="d-preview__channel-icon">#</span><span>${escPreview(step.name)}</span><span class="d-preview__channel-meta">${escPreview(step.meta || "channel updated")}</span></div>`;
  }

  const isUser = step.type === "user";
  const author = isUser ? "You" : "Veltrix";
  const tag = isUser ? "" : `<span class="d-preview__bot-tag">BOT</span>`;
  const ephemeral = step.ephemeral ? `<span class="d-preview__ephemeral">Only you can see this</span>` : "";

  let body = "";
  if (step.content) {
    body += `<div class="d-preview__text">${formatPreviewText(step.content)}</div>`;
  }
  if (step.embed) {
    body += renderDiscordEmbedHtml(step.embed);
  }
  if (step.reactions?.length) {
    body += `<div class="d-preview__reactions">${step.reactions.map((r) => `<span class="d-preview__reaction">${escPreview(r)}</span>`).join("")}</div>`;
  }

  return `<div class="d-preview__msg d-preview__msg--${isUser ? "user" : "bot"}">
    <div class="d-preview__avatar d-preview__avatar--${isUser ? "user" : "bot"}"></div>
    <div class="d-preview__bubble">
      <div class="d-preview__meta">${escPreview(author)} ${tag}${ephemeral}</div>
      ${body}
    </div>
  </div>`;
}

function formatPreviewText(text) {
  return escPreview(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function renderCommandPreview(preview, compact) {
  if (!preview) return "";

  if (compact && preview.compactEmbed) {
    return `<div class="card__preview">${renderDiscordEmbedHtml(preview.compactEmbed, true)}</div>`;
  }

  const summary = preview.summary
    ? `<p class="d-preview__summary">${escPreview(preview.summary)}</p>`
    : "";

  const steps = (preview.steps || [])
    .map((s) => renderPreviewStep(s))
    .join("");

  const effects = (preview.effects || []).length
    ? `<ul class="d-preview__effects">${preview.effects.map((e) => `<li>${escPreview(e)}</li>`).join("")}</ul>`
    : "";

  return `<div class="d-preview">
    ${summary}
    <div class="d-preview__chat">${steps}</div>
    ${effects}
  </div>`;
}

function buildFallbackPreview(cmd, catId) {
  const type = cmd.type || "prefix";
  const invoke = previewCopyText(cmd);
  const descPreview = (cmd.descPreviewription || "").trim();

  const steps = [{ type: "user", content: invoke }];

  if (descPreview) {
    steps.push({
      type: "bot",
      embed: {
        color: type === "slash" ? "#5865f2" : "#3ba55d",
        author: { name: "Veltrix · City of Angels" },
        title: cmd.name,
        descPreviewription: descPreview,
        footer: { text: invoke },
      },
    });
  } else {
    steps.push({
      type: "bot",
      content: `Runs **${invoke}** in this server.`,
    });
  }

  if ((cmd.subcommands || []).length) {
    const lines = cmd.subcommands.map((s) => `• **${s.name}** — ${s.descPreviewription || ""}`).join("\n");
    steps.push({ type: "note", text: `Subcommands:\n${lines}` });
  }

  return {
    summary: descPreview || `What happens when you use ${invoke}.`,
    steps,
  };
}

function resolveCommandPreview(cmd, catId, store) {
  if (!isPreviewableCommand(cmd)) return null;

  const key = previewKey(cmd, catId);
  const alt = previewLookupKey(cmd, catId);
  const custom = store?.[key] || store?.[alt];

  if (custom) return custom;
  return buildFallbackPreview(cmd, catId);
}
