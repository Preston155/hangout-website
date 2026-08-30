"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";

export type LegalSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalPage({ title, description, lastUpdated, sections }: LegalPageProps) {
  const isPrivacy = title.toLowerCase().includes("privacy");

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-[#f4f4f2] selection:bg-[#f4f4f2] selection:text-[#0b0b0c]">
      <header className="border-b border-white/[0.11]">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[-0.01em] text-white">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-white text-xs font-black text-black">P</span>
            PrestonHQ
          </a>

          <nav aria-label="Legal navigation" className="flex items-center gap-1 text-sm text-white/55">
            <a href="/terms" aria-current={!isPrivacy ? "page" : undefined} className={`px-3 py-2 transition hover:text-white ${!isPrivacy ? "text-white" : ""}`}>
              Terms
            </a>
            <a href="/privacy" aria-current={isPrivacy ? "page" : undefined} className={`px-3 py-2 transition hover:text-white ${isPrivacy ? "text-white" : ""}`}>
              Privacy
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to dashboard
        </a>

        <div className="mt-12 max-w-3xl sm:mt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Legal / PrestonHQ</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">{description}</p>
          <p className="mt-7 font-mono text-xs text-white/35">Last updated {lastUpdated}</p>
        </div>

        <div className="mt-14 grid gap-12 border-t border-white/[0.11] pt-10 lg:grid-cols-[220px_minmax(0,720px)] lg:gap-20">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/35">On this page</p>
            <ol className="space-y-1 border-l border-white/[0.12]">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="group flex gap-3 border-l border-transparent py-1.5 pl-4 text-sm leading-5 text-white/45 transition hover:border-white/70 hover:text-white">
                    <span className="font-mono text-[10px] text-white/25 group-hover:text-white/50">{String(index + 1).padStart(2, "0")}</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article>
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-8 border-b border-white/[0.1] py-10 first:pt-0 last:border-0">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] text-white/25">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{section.title}</h2>
                </div>

                <div className="mt-5 space-y-4 text-[15px] leading-7 text-white/58 sm:text-base sm:leading-8">
                  {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets && (
                    <ul className="mt-5 space-y-3 border-l border-white/[0.14] pl-5">
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            <div className="mt-12 flex flex-col justify-between gap-5 border-t border-white/[0.11] pt-8 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Questions about this policy?</p>
                <p className="mt-1 text-sm text-white/40">We’ll help with legal, privacy, or account requests.</p>
              </div>
              <a href="mailto:support@prestonhq.com" className="inline-flex items-center gap-2 self-start border-b border-white/35 pb-1 text-sm font-medium text-white transition hover:border-white/80">
                support@prestonhq.com
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </div>

      <footer className="border-t border-white/[0.11]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-7 text-xs text-white/32 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} PrestonHQ</p>
          <p>Built for authorized staff operations.</p>
        </div>
      </footer>
    </main>
  );
}
