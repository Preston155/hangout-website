/** Custom toast + confirm — no browser alert/confirm/prompt */
const Toast = {
  stack: null,
  init() {
    this.stack = document.getElementById("toastStack");
  },
  show(message, type = "info", duration = 2200) {
    if (!this.stack) this.init();
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__icon">${type === "error" ? "✕" : type === "success" ? "✓" : "ℹ"}</span><span class="toast__text">${message}</span>`;
    this.stack.append(el);
    requestAnimationFrame(() => el.classList.add("toast--visible"));
    setTimeout(() => {
      el.classList.remove("toast--visible");
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
  error(msg) {
    this.show(msg, "error", 3200);
  },
  success(msg) {
    this.show(msg, "success");
  },
  info(msg) {
    this.show(msg, "info");
  },
};

const Confirm = {
  modal: null,
  message: null,
  resolve: null,
  init() {
    this.modal = document.getElementById("confirmModal");
    this.message = document.getElementById("confirmMessage");
    document.getElementById("confirmOk")?.addEventListener("click", () => this.close(true));
    document.getElementById("confirmCancel")?.addEventListener("click", () => this.close(false));
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close(false);
    });
  },
  ask(message, { confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false } = {}) {
    if (!this.modal) this.init();
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.message.textContent = message;
      const okBtn = document.getElementById("confirmOk");
      const cancelBtn = document.getElementById("confirmCancel");
      if (okBtn) {
        okBtn.textContent = confirmLabel;
        okBtn.classList.toggle("btn-danger", danger);
      }
      if (cancelBtn) cancelBtn.textContent = cancelLabel;
      this.modal.showModal();
    });
  },
  close(result) {
    this.modal?.close();
    this.resolve?.(result);
    this.resolve = null;
  },
};

const ContextMenu = {
  layer: null,
  submenuTimer: null,

  init() {
    if (this.layer) return;
    this.layer = document.createElement("div");
    this.layer.id = "contextMenuLayer";
    this.layer.className = "ctx-layer hidden";
    this.layer.setAttribute("role", "presentation");
    document.body.appendChild(this.layer);

    document.addEventListener("mousedown", (e) => {
      if (e.button === 2) return;
      if (!this.layer.classList.contains("hidden") && !this.layer.contains(e.target)) {
        this.close();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
    window.addEventListener("scroll", () => this.close(), true);
    window.addEventListener("resize", () => this.close());
  },

  close() {
    clearTimeout(this.submenuTimer);
    this.layer?.classList.add("hidden");
    if (this.layer) this.layer.innerHTML = "";
  },

  open(x, y, items) {
    this.init();
    requestAnimationFrame(() => {
      this.close();
      this.layer.classList.remove("hidden");

      const menu = this.renderMenu(items);
      menu.classList.add("ctx-menu--root");
      menu.style.position = "fixed";
      this.layer.append(menu);
      this.positionMenu(menu, x, y);
    });
  },

  positionMenu(el, x, y) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      let left = x;
      let top = y;
      if (rect.right > window.innerWidth - pad) left = window.innerWidth - rect.width - pad;
      if (rect.bottom > window.innerHeight - pad) top = window.innerHeight - rect.height - pad;
      if (left < pad) left = pad;
      if (top < pad) top = pad;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    });
  },

  positionSubmenu(row, submenu) {
    const rect = row.getBoundingClientRect();
    let left = rect.right - 4;
    let top = rect.top - 6;
    submenu.style.left = `${left}px`;
    submenu.style.top = `${top}px`;
    requestAnimationFrame(() => {
      const subRect = submenu.getBoundingClientRect();
      if (subRect.right > window.innerWidth - 8) left = rect.left - subRect.width + 4;
      if (subRect.bottom > window.innerHeight - 8) top = window.innerHeight - subRect.height - 8;
      submenu.style.left = `${left}px`;
      submenu.style.top = `${top}px`;
    });
  },

  renderMenu(items) {
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    menu.setAttribute("role", "menu");
    items.forEach((item) => menu.appendChild(this.renderItem(item)));
    return menu;
  },

  renderItem(item) {
    if (item.type === "separator") {
      const sep = document.createElement("div");
      sep.className = "ctx-menu__separator";
      sep.setAttribute("role", "separator");
      return sep;
    }

    const row = document.createElement("button");
    row.type = "button";
    row.className = "ctx-menu__item";
    row.setAttribute("role", "menuitem");
    if (item.disabled) {
      row.classList.add("ctx-menu__item--disabled");
      row.disabled = true;
    }
    if (item.danger) row.classList.add("ctx-menu__item--danger");

    const body = document.createElement("span");
    body.className = "ctx-menu__body";
    const label = document.createElement("span");
    label.className = "ctx-menu__label";
    label.textContent = item.label;
    body.append(label);
    if (item.sublabel) {
      const sub = document.createElement("span");
      sub.className = "ctx-menu__sublabel";
      sub.textContent = item.sublabel;
      body.append(sub);
    }
    row.append(body);

    if (item.type === "checkbox") {
      row.classList.add("ctx-menu__item--checkbox");
      const box = document.createElement("span");
      box.className = "ctx-menu__check";
      if (item.checked) box.classList.add("ctx-menu__check--on");
      row.append(box);
      if (!item.disabled) {
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          item.action?.(!item.checked);
          this.close();
        });
      }
      return row;
    }

    if (item.type === "submenu") {
      row.classList.add("ctx-menu__item--submenu");
      const arrow = document.createElement("span");
      arrow.className = "ctx-menu__arrow";
      arrow.textContent = "›";
      row.append(arrow);

      const submenu = this.renderMenu(item.children || []);
      submenu.classList.add("ctx-menu--sub");
      submenu.style.position = "fixed";

      row.addEventListener("mouseenter", () => {
        clearTimeout(this.submenuTimer);
        this.layer.querySelectorAll(".ctx-menu--sub").forEach((m) => m.remove());
        this.layer.append(submenu);
        this.positionSubmenu(row, submenu);
      });
      row.addEventListener("mouseleave", () => {
        this.submenuTimer = setTimeout(() => {
          if (!submenu.matches(":hover")) submenu.remove();
        }, 140);
      });
      submenu.addEventListener("mouseleave", () => {
        this.submenuTimer = setTimeout(() => submenu.remove(), 140);
      });
      return row;
    }

    if (!item.disabled) {
      row.addEventListener("click", (e) => {
        e.stopPropagation();
        item.action?.();
        this.close();
      });
    }
    return row;
  },
};

window.Toast = Toast;
window.Confirm = Confirm;
window.ContextMenu = ContextMenu;
