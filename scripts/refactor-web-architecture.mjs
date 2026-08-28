import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const srcPath = join(root, "apps/web/src/App.tsx");
const source = readFileSync(srcPath, "utf8");

function index(marker) {
  const value = source.indexOf(marker);
  if (value < 0) throw new Error(`Missing marker: ${marker}`);
  return value;
}
function slice(start, end) { return source.slice(index(start), index(end)); }
function write(relative, content) {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.trimEnd() + "\n");
}
function exportFunction(block, from, to) { return block.replace(from, `export function ${to}()`); }

const domainNames = ["Room", "Guest", "Hold", "Booking", "Invoice", "Payment", "ExtraCharge"];
const domainTypes = domainNames.map(name => {
  const match = source.match(new RegExp(`^type ${name} = .*;$`, "m"));
  if (!match) throw new Error(`Missing domain type ${name}`);
  return match[0].replace(/^type /, "export type ");
}).join("\n");
write("apps/web/src/domain/types.ts", domainTypes);

write("apps/web/src/shared/api.ts", `export type LocalDevProfile = { label: string; subject: string; email: string; hotelId: string };

export const localAcceptanceEnabled = import.meta.env.DEV && import.meta.env.VITE_LOCAL_ACCEPTANCE_AUTH === "true";
export const localDevProfiles: LocalDevProfile[] = localAcceptanceEnabled ? [
  { label: "Hotel Norte · Admin / Network", subject: "source-user:14000000-0000-0000-0000-000000000001", email: "ana-admin@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
  { label: "Hotel Norte · Reception", subject: "source-user:14000000-0000-0000-0000-000000000002", email: "leo-reception@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
  { label: "Hotel Sur · Operations", subject: "source-user:24000000-0000-0000-0000-000000000001", email: "sol-ops@migration.invalid", hotelId: "20000000-0000-0000-0000-000000000002" },
  { label: "Hotel Sur · Housekeeping", subject: "source-user:24000000-0000-0000-0000-000000000002", email: "max-housekeeping@migration.invalid", hotelId: "20000000-0000-0000-0000-000000000002" },
  { label: "Network · SaaS Admin", subject: "source-user:14000000-0000-0000-0000-000000000003", email: "saas-admin@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
] : [];

const initialLocalProfileIndex = typeof window === "undefined" ? 0 : Number(window.localStorage.getItem("hms-local-acceptance-profile") ?? 0);
let activeLocalDevProfile = localDevProfiles[initialLocalProfileIndex] ?? localDevProfiles[0];

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = "ApiError"; this.status = status; }
}

export function getActiveLocalProfileIndex() {
  return Math.max(0, localDevProfiles.indexOf(activeLocalDevProfile));
}
export function setActiveLocalProfileIndex(index: number) {
  activeLocalDevProfile = localDevProfiles[index] ?? localDevProfiles[0];
  window.localStorage.setItem("hms-local-acceptance-profile", String(index));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (activeLocalDevProfile) {
    headers.set("x-local-access-subject", activeLocalDevProfile.subject);
    headers.set("x-local-access-email", activeLocalDevProfile.email);
    headers.set("x-hotel-id", activeLocalDevProfile.hotelId);
  }
  const response = await fetch(\`/api/v1\${path}\`, { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new ApiError(payload?.error?.message ?? \`Request failed (\${response.status})\`, response.status);
  }
  return response.json();
}`);

const rooms = exportFunction(slice("function Rooms()", "function Guests()"), "function Rooms()", "RoomsPage");
write("apps/web/src/features/rooms/RoomsPage.tsx", `import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../shared/api";
import type { Hold, Room } from "../../domain/types";

${rooms}`);

const guests = exportFunction(slice("function Guests()", "type AdminUser"), "function Guests()", "GuestsPage");
write("apps/web/src/features/guests/GuestsPage.tsx", `import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../shared/api";
import type { Guest } from "../../domain/types";

${guests}`);

let users = slice("type AdminUser", "type NetworkKpis");
users = users.replace(/^type AdminHotel = .*;\n/m, "");
users = users.replace("function UsersAdmin()", "export function UsersPage()");
write("apps/web/src/features/users/UsersPage.tsx", `import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../shared/api";

${users}`);

const adminHotel = source.match(/^type AdminHotel = .*;$/m)?.[0];
if (!adminHotel) throw new Error("Missing AdminHotel type");
let network = slice("type NetworkKpis", "type ReportRange").replace("function NetworkAdmin()", "export function NetworkPage()");
write("apps/web/src/features/network/NetworkPage.tsx", `import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../shared/api";

${adminHotel}\n${network}`);

let reports = slice("type ReportRange", "const checkInSteps").replace("function Reports()", "export function ReportsPage()");
write("apps/web/src/features/reports/ReportsPage.tsx", `import { useEffect, useState } from "react";
import { api } from "../../shared/api";

${reports}`);

const reception = slice("const checkInSteps", "type MaintenanceCase");
write("apps/web/src/features/reception/ReceptionPage.tsx", `import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, api } from "../../shared/api";
import type { Booking, ExtraCharge, Guest, Invoice, Payment, Room } from "../../domain/types";

${reception}
export function ReceptionPage() {
  return <><Bookings /><BillingPanel /><CashBalancePanel /></>;
}`);

const housekeepingPrefix = slice("type MaintenanceCase", "// Retained only as a migration reference");
const housekeepingActive = slice("function HousekeepingRework()", "type HousekeepingDraft").replace("function HousekeepingRework()", "export function HousekeepingPage()");
const housekeepingDraft = slice("type HousekeepingDraft", "function HousekeepingReworkLegacyFocused()");
write("apps/web/src/features/housekeeping/HousekeepingPage.tsx", `import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "../../shared/api";

${housekeepingPrefix}
${housekeepingDraft}
${housekeepingActive}`);

write("apps/web/src/app/router.tsx", `import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
}`);

write("apps/web/src/app/LocalDevIdentitySelector.tsx", `import { getActiveLocalProfileIndex, localAcceptanceEnabled, localDevProfiles, setActiveLocalProfileIndex } from "../shared/api";

export function LocalDevIdentitySelector({ onChange }: { onChange: () => void }) {
  if (!localAcceptanceEnabled) return null;
  return <aside className="local-dev-identity" aria-label="Local acceptance identity"><strong>Local acceptance identity</strong><label>Profile <select aria-label="Local acceptance profile" value={String(getActiveLocalProfileIndex())} onChange={event => { setActiveLocalProfileIndex(Number(event.target.value)); onChange(); }}>{localDevProfiles.map((profile, index) => <option value={index} key={profile.subject}>{profile.label}</option>)}</select></label><small>Synthetic fixture only · not persisted</small></aside>;
}`);

write("apps/web/src/app/navigation.ts", `export const navigation = [
  ["bookings", "/bookings", "Recepción", "Llegadas, salidas y cobros"],
  ["rooms", "/rooms", "Habitaciones", "Inventario y disponibilidad"],
  ["guests", "/guests", "Huéspedes", "Fichas y contactos"],
  ["housekeeping", "/housekeeping", "Housekeeping", "Limpieza y handoff"],
  ["reports", "/reports", "Reportes", "Ocupación e ingresos"],
  ["users", "/users", "Usuarios", "Accesos y roles"],
  ["network", "/network", "Red", "Operación multi-hotel"],
] as const;

export type PageKey = typeof navigation[number][0];
export function pageFromPath(pathname: string): PageKey {
  if (pathname.startsWith("/guests")) return "guests";
  if (pathname.startsWith("/rooms")) return "rooms";
  if (pathname.startsWith("/housekeeping")) return "housekeeping";
  if (pathname.startsWith("/users")) return "users";
  if (pathname.startsWith("/network")) return "network";
  if (pathname.startsWith("/reports")) return "reports";
  return "bookings";
}`);

write("apps/web/src/app/AppShell.tsx", `import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
}`);

write("apps/web/src/App.tsx", `import { AppShell } from "./app/AppShell";
import { RouterProvider } from "./app/router";

export function App() {
  return <RouterProvider><AppShell /></RouterProvider>;
}`);

console.log("Web architecture refactor generated successfully");
