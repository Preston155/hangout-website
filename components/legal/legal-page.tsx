"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type LegalSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

export function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#07090f] text-white selection:bg-sky-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(56,189,248,.20),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(99,102,241,.20),transparent_30%),radial-gradient(circle_at_68%_88%,rgba(16,185,129,.10),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:70px_70px] opacity-20" />
      </div>

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#07090f]/76 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Button href="/" variant="ghost">
            <ArrowLeft size={16} />
            Back to dashboard
          </Button>
          <div className="hidden items-center gap-2 text-sm font-black text-white/70 sm:flex">
            <ShieldCheck size={17} className="text-sky-200" />
            PrestonHQ Legal
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-black uppercase tracking-[.22em] text-sky-100">
            PrestonHQ · City of Angels RP
          </div>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.075em] md:text-7xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/60">{description}</p>
          <p className="mt-4 text-sm font-bold text-white/42">Last Updated: {lastUpdated}</p>
        </motion.header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <motion.aside initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, delay: 0.05 }} className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Table of contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="block rounded-2xl border border-white/8 bg-black/20 px-3 py-2 font-bold text-white/58 transition hover:border-sky-300/25 hover:bg-sky-300/10 hover:text-white">
                    {section.title}
                  </a>
                ))}
              </CardContent>
            </Card>
          </motion.aside>

          <div className="space-y-5">
            {sections.map((section, index) => (
              <motion.div key={section.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.08 + index * 0.025 }}>
                <Card id={section.id} className="scroll-mt-24">
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets && (
                      <ul className="mt-3 grid gap-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-white/70">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <Card>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-white">Questions?</p>
                  <p>Contact PrestonHQ support for legal, privacy, or access requests.</p>
                </div>
                <a className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-sm font-black text-white/80 transition hover:border-sky-300/25 hover:bg-sky-300/10" href="mailto:support@prestonhq.com">
                  <Mail size={16} />
                  support@prestonhq.com
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© PrestonHQ. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms of Service</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
