import { useEffect, useState } from "react";
import { API_BASE } from "./constants";
import type { BotStatus } from "./types";

export function useBotStatus(pollMs = 30000) {
  const [statuses, setStatuses] = useState<Record<string, BotStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bots/status`, { cache: "no-store" });
        const json = await res.json();
        if (!active || !json?.ok) return;
        setStatuses(json.data?.bots || {});
      } catch {
        /* keep baked-in catalog status */
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    const timer = window.setInterval(run, pollMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pollMs]);

  return { statuses, loading };
}
