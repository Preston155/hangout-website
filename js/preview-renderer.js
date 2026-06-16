/* Discord-style command preview renderer — Veltrix */

const PREVIEW_BOT_AVATAR = "assets/favicon-32.png?v=8";

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

function formatPreviewText(text) {
  if (!text) return "";
  let s = escPreview(text);
  s = s.replace(/```([\s\S]*?)```/g, '<pre class="d-codeblock"><code>$1</code></pre>');
  s = s.replace(/`([^`\n]+)`/g, '<code class="d-inline-code">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  s = s.replace(/__(.+?)__/g, "<u>$1</u>");
  s = s.replace(/~~(.+?)~~/g, "<s>$1</s>");
  s = s.replace(
    /@(everyone|here|[A-Za-z0-9_]{2,32})/g,
    '<span class="d-mention">@$1</span>',
  );
  s = s.replace(/\n/g, "<br>");
  return s;
}

function embedColor(color) {
  const c = String(color || "#5865f2").trim();
  return /^#?[0-9a-f]{6}$/i.test(c.replace("#", "")) ? (c.startsWith("#") ? c : `#${c}`) : "#5865f2";
}

function renderDiscordEmbedHtml(embed, compact) {
  if (!embed) return "";

  const color = embedColor(embed.color);
  const hasThumb = Boolean(embed.thumbnail?.url);
  const hasImage = Boolean(embed.image?.url);

  const fields = (embed.fields || [])
    .slice(0, compact ? 2 : undefined)
    .map(
      (f) =>
        `<div class="d-embed__field${f.inline ? " d-embed__field--inline" : ""}">
          <div class="d-embed__field-name">${escPreview(f.name)}</div>
          <div class="d-embed__field-value">${formatPreviewText(f.value)}</div>
        </div>`,
    )
    .join("");

  const buttons = compact
    ? ""
    : (embed.buttons || [])
        .map(
          (b) =>
            `<span class="d-btn d-btn--${escPreview(b.style || "secondary")}${b.disabled ? " d-btn--disabled" : ""}">${escPreview(b.label)}</span>`,
        )
        .join("");

  const selects = compact
    ? ""
    : (embed.select || [])
        .map(
          (s) =>
            `<div class="d-select"><span class="d-select__placeholder">${escPreview(s.placeholder || "Make a selection")}</span><span class="d-select__chevron" aria-hidden="true"></span></div>`,
        )
        .join("");

  const titleHtml = embed.title
    ? embed.url
      ? `<a class="d-embed__title d-embed__title--link" href="#" tabindex="-1">${escPreview(embed.title)}</a>`
      : `<div class="d-embed__title">${escPreview(embed.title)}</div>`
    : "";

  const footerIcon = embed.footer?.icon
    ? `<img class="d-embed__footer-icon" src="${escPreview(embed.footer.icon)}" alt="" />`
    : "";

  const footerTime = embed.footer?.timestamp || embed.timestamp
    ? `<span class="d-embed__footer-sep">•</span><span class="d-embed__footer-time">${escPreview(embed.footer?.timestamp || embed.timestamp)}</span>`
    : "";

  return `<div class="d-embed${compact ? " d-embed--compact" : ""}${hasThumb ? " d-embed--thumb" : ""}" style="--embed-color: ${escPreview(color)}">
    <div class="d-embed__grid">
      <div class="d-embed__main">
        ${
          embed.author
            ? `<div class="d-embed__author">${embed.author.icon !== false ? `<span class="d-embed__author-icon"${embed.author.iconUrl ? ` style="background-image:url('${escPreview(embed.author.iconUrl)}')"` : ""}></span>` : ""}<span>${escPreview(embed.author.name)}</span></div>`
            : ""
        }
        ${titleHtml}
        ${embed.description ? `<div class="d-embed__desc">${formatPreviewText(embed.description)}</div>` : ""}
        ${fields ? `<div class="d-embed__fields">${fields}</div>` : ""}
        ${
          hasImage && !compact
            ? `<div class="d-embed__image"><img src="${escPreview(embed.image.url)}" alt="" loading="lazy" /></div>`
            : ""
        }
        ${
          embed.footer
            ? `<div class="d-embed__footer">${footerIcon}<span>${escPreview(embed.footer.text)}</span>${footerTime}</div>`
            : footerTime
              ? `<div class="d-embed__footer">${footerTime.replace(/^<span class="d-embed__footer-sep">•<\/span>/, "")}</div>`
              : ""
        }
        ${buttons || selects ? `<div class="d-embed__actions">${buttons}${selects}</div>` : ""}
      </div>
      ${
        hasThumb
          ? `<div class="d-embed__thumb"><img src="${escPreview(embed.thumbnail.url)}" alt="" loading="lazy" /></div>`
          : ""
      }
    </div>
  </div>`;
}

function renderPreviewAvatar(isUser) {
  if (isUser) {
    return `<div class="d-preview__avatar d-preview__avatar--user" aria-hidden="true"><span class="d-preview__avatar-letter">Y</span></div>`;
  }
  return `<div class="d-preview__avatar d-preview__avatar--bot" aria-hidden="true"><img src="${PREVIEW_BOT_AVATAR}" alt="" width="40" height="40" decoding="async" /></div>`;
}

function renderPreviewStep(step, index) {
  if (step.type === "note") {
    return `<div class="d-preview__note">${formatPreviewText(step.text)}</div>`;
  }

  if (step.type === "deleted") {
    return `<div class="d-preview__deleted"><span class="d-preview__deleted-icon" aria-hidden="true">🗑</span> ${escPreview(step.text || "Message deleted")}</div>`;
  }

  if (step.type === "channel") {
    return `<div class="d-preview__channel"><span class="d-preview__channel-icon">#</span><span class="d-preview__channel-name">${escPreview(step.name)}</span><span class="d-preview__channel-meta">${escPreview(step.meta || "channel updated")}</span></div>`;
  }

  const isUser = step.type === "user";
  const author = isUser ? "You" : "Veltrix";
  const tag = isUser ? "" : `<span class="d-preview__bot-tag">BOT</span>`;
  const time = step.time || (index === 0 ? "Today at 12:00 PM" : "");
  const ephemeral = step.ephemeral
    ? `<div class="d-preview__ephemeral"><span class="d-preview__ephemeral-icon" aria-hidden="true">👁</span> Only you can see this <span class="d-preview__ephemeral-link">Dismiss message</span></div>`
    : "";

  let body = "";
  if (step.content) {
    body += `<div class="d-preview__text">${formatPreviewText(step.content)}</div>`;
  }
  if (step.embed) {
    body += renderDiscordEmbedHtml(step.embed);
  }
  if (step.reactions?.length) {
    body += `<div class="d-preview__reactions">${step.reactions
      .map((r) => {
        const parts = String(r).match(/^(\S+)\s*(\d+)?$/);
        const emoji = parts ? parts[1] : r;
        const count = parts?.[2] || "";
        return `<span class="d-preview__reaction"><span class="d-preview__reaction-emoji">${escPreview(emoji)}</span>${count ? `<span class="d-preview__reaction-count">${escPreview(count)}</span>` : ""}</span>`;
      })
      .join("")}</div>`;
  }

  return `<div class="d-preview__msg d-preview__msg--${isUser ? "user" : "bot"}">
    ${renderPreviewAvatar(isUser)}
    <div class="d-preview__content">
      <div class="d-preview__meta">
        <span class="d-preview__author">${escPreview(author)}</span>
        ${tag}
        ${time ? `<span class="d-preview__time">${escPreview(time)}</span>` : ""}
      </div>
      ${body}
      ${ephemeral}
    </div>
  </div>`;
}

function renderCommandPreview(preview, compact) {
  if (!preview) return "";

  if (compact) {
    const embed =
      preview.compactEmbed || (preview.steps || []).find((s) => s.embed)?.embed;
    if (embed) {
      return `<div class="card__preview"><div class="card__preview-chat">${renderDiscordEmbedHtml(embed, true)}</div></div>`;
    }
    return "";
  }

  const summary = preview.summary
    ? `<p class="d-preview__summary">${escPreview(preview.summary)}</p>`
    : "";

  const steps = (preview.steps || [])
    .map((s, i) => renderPreviewStep(s, i))
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
  const desc = (cmd.description || "").trim();

  const steps = [{ type: "user", content: invoke }];

  if (desc) {
    steps.push({
      type: "bot",
      embed: {
        color: type === "slash" ? "#5865f2" : "#3ba55d",
        author: { name: "Veltrix", iconUrl: PREVIEW_BOT_AVATAR },
        title: type === "slash" ? `/${cmd.name}` : cmd.name,
        description: desc,
        footer: { text: "City of Angels", timestamp: "Today at 12:00 PM" },
      },
    });
  } else {
    steps.push({
      type: "bot",
      content: `✅ Command executed — **${invoke}**`,
    });
  }

  if ((cmd.subcommands || []).length) {
    const lines = cmd.subcommands.map((s) => `• **${s.name}** — ${s.description || ""}`).join("\n");
    steps.push({ type: "note", text: `Subcommands:\n${lines}` });
  }

  return {
    summary: desc || `What happens when you use ${invoke}.`,
    compactEmbed: desc
      ? {
          color: type === "slash" ? "#5865f2" : "#3ba55d",
          author: { name: "Veltrix" },
          description: desc.length > 120 ? `${desc.slice(0, 117)}…` : desc,
        }
      : null,
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
