import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Staff Login | PrestonHQ",
  description: "Discord staff login for PrestonHQ, the private City of Angels RP ER:LC moderation dashboard.",
  openGraph: {
    title: "Staff Login | PrestonHQ",
    description: "Authorized City of Angels RP staff login for PrestonHQ.",
    siteName: "PrestonHQ",
    type: "website",
    url: "https://prestonhq.com/login",
  },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#07090f] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(56,189,248,.20),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(99,102,241,.20),transparent_30%),radial-gradient(circle_at_68%_88%,rgba(16,185,129,.10),transparent_38%)]" />
      </div>
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-400 text-black">
            <Lock />
          </div>
          <CardTitle className="text-4xl">Staff Login</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            PrestonHQ is restricted to authorized City of Angels RP staff. Discord authentication is used to verify identity,
            staff roles, and dashboard permissions.
          </p>
          <Button href="/" className="mt-5 w-full">
            <ShieldCheck size={16} />
            Continue with Discord
          </Button>
          <p className="mt-4 text-center text-xs text-white/42">
            By continuing, you agree to the{" "}
            <a href="/terms" className="text-sky-200 hover:text-white">Terms of Service</a>
            {" "}and acknowledge the{" "}
            <a href="/privacy" className="text-sky-200 hover:text-white">Privacy Policy</a>.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
