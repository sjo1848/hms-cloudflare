import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { api } from "../shared/api";
import { GuestsPage } from "../features/guests/GuestsPage";
import { HousekeepingPage } from "../features/housekeeping/HousekeepingPage";
import { NetworkPage } from "../features/network/NetworkPage";
import { ReceptionPage } from "../features/reception/ReceptionPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { RoomsPage } from "../features/rooms/RoomsPage";
import { UsersPage } from "../features/users/UsersPage";
import { LocalDevIdentitySelector } from "./LocalDevIdentitySelector";
import { navigation, pageFromPath } from "./navigation";
import { AppLink, useAppRouter } from "./router";

type ActiveAuth = { hotel_id: string | null; hotel_name: string | null };
const hotelLabels: Record<string, string> = {
  "10000000-0000-0000-0000-000000000001": "Hotel Norte",
  "20000000-0000-0000-0000-000000000002": "Hotel Sur",
};

export function AppShell() {
  const { pathname } = useAppRouter();
  const [identityVersion, setIdentityVersion] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeHotelLabel, setActiveHotelLabel] = useState("Cargando…");
  const mobileNavRef = useRef<HTMLDialogElement | null>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeHotelRequestRef = useRef(0);
  const page = pageFromPath(pathname);
  const activeLabel = navigation.find(([key]) => key === page)?.[2] ?? "Recepción";
  function closeMobileNav() { setMobileNavOpen(false); requestAnimationFrame(() => mobileMenuTriggerRef.current?.focus()); }
  useEffect(() => {
    const requestId = ++activeHotelRequestRef.current;
    setActiveHotelLabel("Cargando…");
    void api<ActiveAuth>("/auth/me").then(({ hotel_id, hotel_name }) => {
      if (requestId === activeHotelRequestRef.current) setActiveHotelLabel(hotel_name ?? hotelLabels[hotel_id ?? ""] ?? "Hotel");
    }).catch(() => { if (requestId === activeHotelRequestRef.current) setActiveHotelLabel("Hotel"); });
  }, [identityVersion]);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnDesktop = () => { if (window.innerWidth > 900) closeMobileNav(); };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, [mobileNavOpen]);
  const content = page === "rooms" ? <RoomsPage /> : page === "guests" ? <GuestsPage /> : page === "housekeeping" ? <HousekeepingPage /> : page === "users" ? <UsersPage /> : page === "network" ? <NetworkPage /> : page === "reports" ? <ReportsPage /> : <ReceptionPage />;
  const navLinks = (close = false) => navigation.map(([key, href, label, description]) => <AppLink key={key} className={page === key ? "active" : ""} to={href} onNavigate={close ? closeMobileNav : undefined}><strong>{label}</strong><small>{description}</small></AppLink>);
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
  }, [mobileNavOpen]);
  function trapMobileNavFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a, button")).filter(element => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <div className="app-shell"><aside className="desktop-sidebar" aria-label="Navegación principal"><AppLink className="brand" to="/bookings"><span className="brand-mark">H</span><span><strong>HMS</strong><small>Elite</small></span></AppLink><p className="nav-label">Operación</p><nav>{navLinks()}</nav><div className="sidebar-footer"><span className="status-dot" /> Staging · Access activo</div></aside><main className="app-main"><header className="app-header"><div className="mobile-heading"><button ref={mobileMenuTriggerRef} className="menu-trigger" type="button" aria-label="Abrir navegación" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>☰</button><div><p className="eyebrow">HMS Elite</p><h1>{activeLabel}</h1></div></div><div className="desktop-heading"><p className="eyebrow">Hotel operations</p><h1>{activeLabel}</h1></div><span className="header-context">{activeHotelLabel} · Operación</span></header><div className="app-content"><LocalDevIdentitySelector onChange={() => setIdentityVersion(value => value + 1)} /><div key={identityVersion}>{content}</div></div></main>{mobileNavOpen && <dialog ref={mobileNavRef} className="mobile-nav" aria-label="Navegación móvil" onKeyDown={trapMobileNavFocus} onClick={event => { if (event.target === event.currentTarget) closeMobileNav(); }}><div className="mobile-nav-heading"><AppLink className="brand" to="/bookings" onNavigate={closeMobileNav}><span className="brand-mark">H</span><span><strong>HMS</strong><small>Elite</small></span></AppLink><button type="button" className="close-nav" aria-label="Cerrar navegación" onClick={closeMobileNav}>×</button></div><nav>{navLinks(true)}</nav><p className="sidebar-footer"><span className="status-dot" /> {activeHotelLabel} · Access activo</p></dialog>}</div>;
}
