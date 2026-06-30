import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button, toast } from "../components/ui";
import { navigate } from "../router";
import { useStore } from "../store";

export function Login() {
  const { setState, log } = useStore();

  const doLogin = () => {
    setState((p) => ({ ...p, user: { name: "Preston", id: "805501165981794305" } }));
    log("Auth", "Signed in with Discord", "success");
    toast("Welcome back, Preston");
    navigate("/dashboard");
  };

  return (
    <div className="grid min-h-screen place-items-center p-5">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="panel w-full max-w-md p-8 text-center"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl brand-grad text-3xl font-black text-[#0b0b10] shadow-[0_20px_50px_-18px_rgba(139,92,246,.9)]">
          P
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Login with Discord</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
          Authorize PrestonHQ to manage your connected bots. Local access is enabled now; full Discord OAuth is wired in the production app.
        </p>
        <Button variant="primary" className="mt-6 h-12 w-full text-[15px]" onClick={doLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.5c1.7.4 2.5.9 3.4 1.6a13.3 13.3 0 0 0-10-.5c-.5.2-.8.3-.8.3s.8-.5 2.6-1L10 3a19.8 19.8 0 0 0-5 1.4C2 8.9 1.4 13.3 1.7 17.6a20 20 0 0 0 6 3l.5-.7c-1-.3-1.8-.7-2.6-1.2l.6-.4a14.2 14.2 0 0 0 12 0l.6.4c-.8.5-1.7.9-2.6 1.2l.5.7a20 20 0 0 0 6-3c.4-5-.6-9.3-2.5-13.2ZM8.5 15c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/></svg>
          Continue with Discord
        </Button>
        <button onClick={() => navigate("/")} className="mx-auto mt-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-300">
          <ArrowLeft size={14} /> Back to home
        </button>
      </motion.div>
    </div>
  );
}
