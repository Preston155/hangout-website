import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export function Button({ href, children, variant = "primary", className = "", ...props }: ButtonProps) {
  const styles =
    variant === "ghost"
      ? "border-white/10 bg-white/[.055] text-white/75 hover:border-white/18 hover:bg-white/[.08]"
      : "border-sky-300/25 bg-sky-300 text-black hover:bg-sky-200";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5 ${styles} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
