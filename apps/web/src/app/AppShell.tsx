import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import { GuestsPage } from "../features/guests/GuestsPage";
import { HousekeepingPage } from "../features/housekeeping/HousekeepingPage";
import { NetworkPage } from "../features/network/NetworkPage";
import { ReceptionPage } from "../features/reception/ReceptionPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { RoomsPage } from "../features/rooms/RoomsPage";
import { UsersPage } from "../features/users/UsersPage";
import { LocalDevIdentitySelector } from "./LocalDevIdentitySelector";
import { navigation, navigationGroups, isMobilePrimary, pageFromPath, visibleNavigation } from "./navigation";
import type { NavigationItem, PageKey } from "./navigation";
import { AppLink, useAppRouter } from "./router";
import { useI18n } from "../i18n";
import { LanguageSelector } from "./LanguageSelector";
import { AUTHORIZATION_STALE_EVENT, CapabilitiesContext, EMPTY_CAPABILITIES } from "./capabilities";
import type { EffectiveCapabilities } from "./capabilities";

type ActiveAuth = {
  subject: string;
  email: string;
  hotel_id: string | null;
  hotel_name: string | null;
  capabilities: { hotel: string[]; network: string[] };
};
type AuthState = "loading" | "ready" | "error";
type AuthFlight = { identityVersion: number; promise: Promise<void>; invalidated: boolean };

function markAuthFlightInvalidated(ref: { current: AuthFlight | null }, promise: Promise<void>) {
  const current = ref.current;
  if (current?.promise === promise) current.invalidated = true;
}

const pageComponents: Record<PageKey, ReactNode> = {
  bookings: <ReceptionPage />,
  rooms: <RoomsPage />,
  housekeeping: <HousekeepingPage />,
  guests: <GuestsPage />,
  reports: <ReportsPage />,
  users: <UsersPage />,
  network: <NetworkPage />,
};

export function AppShell() {
  const { t } = useI18n();
  const { pathname, search } = useAppRouter();
  const [identityVersion, setIdentityVersion] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [activeAuth, setActiveAuth] = useState<ActiveAuth | null>(null);
  const capabilities: EffectiveCapabilities = activeAuth?.capabilities ?? EMPTY_CAPABILITIES;
  const mobileNavRef = useRef<HTMLDialogElement | null>(null);
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const requestGenerationRef = useRef(0);
  const authFlightRef = useRef<AuthFlight | null>(null);

  const refreshAuth = useCallback((clearCurrent = false): Promise<void> => {
    const identityVersionForRequest = identityVersion;
    if (clearCurrent) {
      setActiveAuth(null);
      setAuthState("loading");
    }
    if (authFlightRef.current?.identityVersion === identityVersionForRequest) return authFlightRef.current.promise;
    const generation = ++requestGenerationRef.current;
    const promise = api<ActiveAuth>("/auth/me").then(auth => {
      if (generation !== requestGenerationRef.current) return;
      setActiveAuth(auth);
      setAuthState("ready");
    }).catch(() => {
      if (generation !== requestGenerationRef.current) return;
      setActiveAuth(null);
      setAuthState("error");
    }).finally(() => {
      if (authFlightRef.current?.promise === promise) authFlightRef.current = null;
    });
    authFlightRef.current = { identityVersion: identityVersionForRequest, promise, invalidated: false };
    return promise;
  }, [identityVersion]);

  useEffect(() => { void refreshAuth(true); }, [identityVersion, refreshAuth]);
  useEffect(() => {
    const refresh = () => {
      if (authFlightRef.current?.invalidated) return;
      setActiveAuth(null);
      setAuthState("loading");
      authFlightRef.current = null;
      requestGenerationRef.current += 1;
      const promise = refreshAuth();
      markAuthFlightInvalidated(authFlightRef, promise);
    };
    window.addEventListener(AUTHORIZATION_STALE_EVENT, refresh);
    return () => window.removeEventListener(AUTHORIZATION_STALE_EVENT, refresh);
  }, [refreshAuth]);

  const page = pageFromPath(pathname);
  const nav = visibleNavigation(capabilities);
  const selectedItem = page ? nav.find(item => item[0] === page) : undefined;
  const activeLabel = t(selectedItem?.[2] ?? (page ? navigation.find(item => item[0] === page)?.[2] : "shell.notFoundTitle") ?? "shell.notFoundTitle");
  const hotelLabel = activeAuth?.hotel_name ?? (activeAuth?.hotel_id ? "Hotel" : t("shell.noHotel"));
  const userLabel = activeAuth?.email ?? activeAuth?.subject ?? "";

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    requestAnimationFrame(() => {
      const target = window.matchMedia("(max-width: 900px)").matches ? moreTriggerRef.current : document.querySelector<HTMLElement>(".desktop-sidebar a.active");
      target?.focus();
    });
  }, []);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnDesktop = () => { if (window.innerWidth > 900) closeMobileNav(); };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, [mobileNavOpen, closeMobileNav]);

  const navLinks = (items: NavigationItem[], close = false) => items.map(([key, href, label]) =>
    <AppLink key={key} className={page === key ? "active" : ""} aria-current={page === key ? "page" : undefined} to={href} onNavigate={close ? closeMobileNav : undefined}>
      <strong>{t(label)}</strong>
    </AppLink>,
  );
  const groupedNavigation = (items: NavigationItem[], close = false, includePrimary = true) => navigationGroups.map(group => {
    const groupItems = items.filter(item => item[4] === group && (includePrimary || !isMobilePrimary(item[0])));
    if (!groupItems.length) return null;
    return <section className={`nav-group nav-group-${group}`} key={group} aria-label={t(`shell.group.${group}`)}>
      <h2>{t(`shell.group.${group}`)}</h2><nav>{navLinks(groupItems, close)}</nav>
    </section>;
  });

  useLayoutEffect(() => {
    const dialog = mobileNavRef.current;
    if (!dialog) return;
    if (mobileNavOpen) {
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLElement>("a, button")?.focus();
      const onCancel = (event: Event) => { event.preventDefault(); closeMobileNav(); };
      dialog.addEventListener("cancel", onCancel);
      return () => dialog.removeEventListener("cancel", onCancel);
    }
    if (dialog.open) dialog.close();
  }, [mobileNavOpen, closeMobileNav]);

  let routeContent: ReactNode;
  if (authState === "loading") routeContent = <section className="shell-state" role="status"><h2>{t("shell.loadingContext")}</h2><p>{t("shell.loadingCapabilities")}</p></section>;
  else if (authState === "error") routeContent = <section className="shell-state shell-state-error" role="alert"><h2>{t("shell.contextUnavailable")}</h2><p>{t("shell.contextUnavailableDescription")}</p><button type="button" onClick={() => void refreshAuth(true)}>{t("common.retry")}</button></section>;
  else if (!page) routeContent = <section className="shell-state" role="status"><h2>{t("shell.notFoundTitle")}</h2><p>{t("shell.notFoundDescription")}</p>{nav.find(item => item[0] === "bookings") && <AppLink to="/bookings">{t("shell.returnReception")}</AppLink>}</section>;
  else if (!selectedItem) routeContent = <section className="shell-state shell-state-denied" role="status"><h2>{t("shell.routeUnavailable")}</h2><p>{t("shell.routeUnavailableDescription")}</p><nav aria-label={t("shell.authorizedDestinations")}>{navLinks(nav)}</nav></section>;
  else routeContent = pageComponents[page];

  return <CapabilitiesContext.Provider value={capabilities}>
    <div className="app-shell">
      <aside className="desktop-sidebar" aria-label={t("shell.mainNav")}>
        <AppLink className="brand" to="/bookings"><span className="brand-mark">H</span><span><strong>HMS</strong><small>Elite</small></span></AppLink>
        {groupedNavigation(nav)}
        <div className="sidebar-footer"><span className="status-dot" /> {hotelLabel}<small>{userLabel}</small></div>
      </aside>
      <main className="app-main">
        <header className="app-header">
          <div className="desktop-heading"><p className="eyebrow">{t("shell.hotelOperations")}</p><h1>{activeLabel}</h1></div>
          <div className="mobile-heading"><div><p className="eyebrow">HMS Elite</p><h1>{activeLabel}</h1></div></div>
          <div className="header-context" aria-live="polite"><strong>{hotelLabel}</strong>{userLabel && <small>{userLabel}</small>}</div>
          <LanguageSelector />
        </header>
        <div className="app-content" data-hotel-capabilities={capabilities.hotel.join(" ")}>
          <LocalDevIdentitySelector onChange={() => { setActiveAuth(null); setAuthState("loading"); setIdentityVersion(value => value + 1); }} />
          <div key={identityVersion}>{routeContent}</div>
        </div>
      </main>
      <nav className="mobile-primary-nav" aria-label={t("shell.mobilePrimaryNav")}>
        {nav.filter(item => isMobilePrimary(item[0])).map(([key, href, label]) =>
          <AppLink key={key} to={href} className={page === key ? "active" : ""} aria-current={page === key ? "page" : undefined}><span>{t(label)}</span></AppLink>,
        )}
        <button ref={moreTriggerRef} type="button" aria-expanded={mobileNavOpen} aria-controls="mobile-more-navigation" onClick={() => setMobileNavOpen(true)}>{t("shell.more")}</button>
      </nav>
      {mobileNavOpen && <dialog id="mobile-more-navigation" ref={mobileNavRef} className="mobile-nav" aria-label={t("shell.moreNavigation")} onClick={event => { if (event.target === event.currentTarget) closeMobileNav(); }}>
        <div className="mobile-nav-heading"><div><p className="eyebrow">{t("shell.more")}</p><h2>{t("shell.moreNavigation")}</h2></div><button type="button" className="close-nav" aria-label={t("shell.closeNav")} onClick={closeMobileNav}>×</button></div>
        {groupedNavigation(nav, true, false)}
        {!nav.some(item => !isMobilePrimary(item[0])) && <p>{t("shell.noMoreDestinations")}</p>}
        <p className="sidebar-footer">{hotelLabel}<small>{userLabel}</small></p>
      </dialog>}
    </div>
  </CapabilitiesContext.Provider>;
}
