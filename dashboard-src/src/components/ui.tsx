import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "ghost" | "subtle" | "danger" | "outline";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-br from-brand-500 to-brand-violet shadow-[0_10px_30px_-10px_rgba(99,102,241,.7)] hover:brightness-110",
  ghost: "text-zinc-300 hover:text-white hover:bg-white/[.06]",
  subtle: "text-zinc-100 bg-white/[.06] border border-white/10 hover:bg-white/[.1]",
  outline: "text-zinc-200 border border-white/12 hover:bg-white/[.05]",
  danger: "text-rose-200 bg-rose-500/12 border border-rose-500/25 hover:bg-rose-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  icon: "h-9 w-9 rounded-xl justify-center",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

export function Button({ variant = "subtle", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cx(
        "inline-flex items-center justify-center font-semibold select-none focus-ring transition-colors disabled:opacity-50 disabled:pointer-events-none",
        sizes[size],
        variants[variant],
        className
      )}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}

export function Toggle({ on, onClick, size = "md" }: { on: boolean; onClick?: () => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? 36 : 46;
  const h = size === "sm" ? 20 : 26;
  const k = h - 6;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cx("relative shrink-0 rounded-full transition-colors focus-ring", on ? "bg-emerald-500" : "bg-white/12")}
      style={{ width: w, height: h }}
      aria-pressed={on}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className="absolute top-[3px] rounded-full bg-white shadow"
        style={{ width: k, height: k, left: on ? w - k - 3 : 3 }}
      />
    </button>
  );
}

export function Badge({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "success" | "danger" | "brand" }) {
  const tones = {
    default: "bg-white/[.06] border-white/10 text-zinc-300",
    success: "bg-emerald-500/12 border-emerald-500/25 text-emerald-300",
    danger: "bg-rose-500/12 border-rose-500/25 text-rose-300",
    brand: "bg-brand-500/15 border-brand-500/30 text-brand-300",
  } as const;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="text-[12.5px] font-medium text-zinc-400">{children}</span>;
}

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-brand-500/60 focus:bg-white/[.05] focus:shadow-[0_0_0_4px_rgba(99,102,241,.12)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(fieldBase, "min-h-[96px] resize-y leading-relaxed", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(fieldBase, "cursor-pointer appearance-none bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-9", props.className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 5 4 4 4-4'/%3E%3C/svg%3E\")", ...props.style }}
    >
      {props.children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="panel relative z-10 w-full max-w-lg p-6"
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

let toastFn: ((msg: string) => void) | null = null;
export function setToastHandler(fn: (msg: string) => void) {
  toastFn = fn;
}
export function toast(msg: string) {
  toastFn?.(msg);
}
