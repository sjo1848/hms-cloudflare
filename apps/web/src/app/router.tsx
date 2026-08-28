import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

type LocationState = { pathname: string; search: string };
type RouterValue = LocationState & { navigate: (to: string, options?: { replace?: boolean }) => void };
const RouterContext = createContext<RouterValue | null>(null);
const readLocation = (): LocationState => ({ pathname: window.location.pathname, search: window.location.search });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>(readLocation);
  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    if (url.origin !== window.location.origin) { window.location.assign(url.href); return; }
    const next = url.pathname + url.search + url.hash;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (next === current) return;
    if (options?.replace) window.history.replaceState({}, "", next);
    else window.history.pushState({}, "", next);
    setLocation(readLocation());
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useAppRouter() {
  const value = useContext(RouterContext);
  if (!value) throw new Error("useAppRouter must be used inside RouterProvider");
  return value;
}

export function AppLink({ to, className, children, onNavigate }: { to: string; className?: string; children: ReactNode; onNavigate?: () => void }) {
  const { navigate } = useAppRouter();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
    onNavigate?.();
  }
  return <a href={to} className={className} onClick={handleClick}>{children}</a>;
}
