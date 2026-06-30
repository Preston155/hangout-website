import { useCallback, useEffect, useState } from "react";

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const segments = path.split("/").filter(Boolean);
  return { path, segments, query: new URLSearchParams(window.location.search) };
}

let listeners: Array<() => void> = [];

export function navigate(to: string) {
  window.history.pushState({}, "", to);
  listeners.forEach((l) => l());
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parse);

  const update = useCallback(() => setRoute(parse()), []);

  useEffect(() => {
    listeners.push(update);
    window.addEventListener("popstate", update);
    return () => {
      listeners = listeners.filter((l) => l !== update);
      window.removeEventListener("popstate", update);
    };
  }, [update]);

  return route;
}
