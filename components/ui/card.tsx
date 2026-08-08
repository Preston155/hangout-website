import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={`rounded-[2rem] border border-white/10 bg-white/[.055] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return <h2 className={`text-2xl font-black tracking-[-.04em] text-white ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`space-y-3 text-sm leading-7 text-white/62 ${className}`}>{children}</div>;
}
