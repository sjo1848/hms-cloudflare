import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AriaAttributes, MouseEvent, ReactNode } from "react";

type LocationState = { pathname: string; search: string; hash: string };
type PendingScroll = number | string | null;
type RouterValue = LocationState & { navigate: (to: string, options?: { replace?: boolean; historyState?: Record<string, unknown> }) => void };
const RouterContext = createContext<RouterValue | null>(null);
const SCROLL_KEY = "__hmsScrollY";
const LOADING_SELECTOR = ".shell-state[role='status'], .state-panel[role='status'], .loading-state, [aria-busy='true']";
const readLocation = (): LocationState => ({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash });
const currentHistoryState = (): Record<string, unknown> => window.history.state ?? {};

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>(readLocation);
  const pendingScrollRef = useRef<PendingScroll>(window.location.hash || null);
  useEffect(() => {
    const priorRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onPopState = (event: PopStateEvent) => {
      const saved = event.state?.[SCROLL_KEY];
      pendingScrollRef.current = typeof saved === "number" ? saved : window.location.hash || 0;
      setLocation(readLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => { window.removeEventListener("popstate", onPopState); window.history.scrollRestoration = priorRestoration; };
  }, []);
  useLayoutEffect(() => {
    const saved = pendingScrollRef.current;
    if (saved === null) return;
    let finished = false;
    let frame = 0;
    const mutation = new MutationObserver(attempt);
    const resize = new ResizeObserver(attempt);
    const done = (top?: number) => {
      pendingScrollRef.current = null;
      finished = true;
      mutation.disconnect();
      resize.disconnect();
      if (top !== undefined) window.scrollTo({ top });
    };
    const complete = () => {
      if (typeof saved === "string") {
        let id = saved.slice(1);
        try { id = decodeURIComponent(id); } catch { /* malformed fragment safely falls back to the top */ }
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView();
          done();
          return true;
        }
        if (document.querySelector(LOADING_SELECTOR)) return false;
        done();
        return true;
      }
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (max < saved && document.querySelector(LOADING_SELECTOR)) return false;
      done(Math.min(saved, max));
      return true;
    };
    function attempt() {
      if (finished || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; complete(); });
    }
    mutation.observe(document.body, { childList: true, subtree: true, attributes: true });
    resize.observe(document.documentElement);
    attempt();
    return () => {
      finished = true;
      if (frame) cancelAnimationFrame(frame);
      mutation.disconnect();
      resize.disconnect();
    };
  }, [location]);
  const navigate = useCallback((to: string, options?: { replace?: boolean; historyState?: Record<string, unknown> }) => {
    const url = new URL(to, window.location.origin);
    if (url.origin !== window.location.origin) { window.location.assign(url.href); return; }
    const next = url.pathname + url.search + url.hash;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (next === current) return;
    if (options?.replace) {
      window.history.replaceState(currentHistoryState(), "", next);
      pendingScrollRef.current = url.hash || null;
    }
    else {
      window.history.replaceState({ ...currentHistoryState(), [SCROLL_KEY]: window.scrollY }, "", current);
      window.history.pushState({ [SCROLL_KEY]: 0, ...options?.historyState }, "", next);
      pendingScrollRef.current = url.hash || 0;
    }
    setLocation(readLocation());
    if (!options?.replace && !url.hash) window.scrollTo({ top: 0 });
  }, []);
  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useAppRouter() {
  const value = useContext(RouterContext);
  if (!value) throw new Error("useAppRouter must be used inside RouterProvider");
  return value;
}

export function AppLink({ to, className, children, onNavigate, onBeforeNavigate, historyState, ...aria }: { to: string; className?: string; children: ReactNode; onNavigate?: () => void; onBeforeNavigate?: () => void; historyState?: Record<string, unknown> } & Pick<AriaAttributes, "aria-current">) {
  const { navigate } = useAppRouter();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onBeforeNavigate?.();
    navigate(to, { historyState });
    onNavigate?.();
  }
  return <a href={to} className={className} onClick={handleClick} {...aria}>{children}</a>;
}
