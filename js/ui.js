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

window.Toast = Toast;
window.Confirm = Confirm;
