import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./constants";

export interface HealthData {
  botReady: boolean;
  botUser: string | null;
  guildCount: number;
  uptime: number;
}

export interface HealthState {
  loading: boolean;
  online: boolean;
  latency: number | null;
  data: HealthData | null;
  checkedAt: number | null;
}

export function useHealth(pollMs = 20000): HealthState {
  const [state, setState] = useState<HealthState>({
    loading: true,
    online: false,
    latency: null,
    data: null,
    checkedAt: null,
  });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const started = performance.now();
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
        const latency = Math.round(performance.now() - started);
        const json = await res.json();
        if (!active) return;
        if (json && json.ok) {
          setState({ loading: false, online: !!json.data.botReady, latency, data: json.data, checkedAt: Date.now() });
        } else {
          setState({ loading: false, online: false, latency, data: null, checkedAt: Date.now() });
        }
      } catch {
        if (!active) return;
        setState({ loading: false, online: false, latency: null, data: null, checkedAt: Date.now() });
      }
    };

    run();
    timer.current = window.setInterval(run, pollMs);
    return () => {
      active = false;
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [pollMs]);

  return state;
}
