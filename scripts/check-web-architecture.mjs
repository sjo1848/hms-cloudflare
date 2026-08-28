import { readFileSync, existsSync } from "node:fs";

const required = [
  "apps/web/src/App.tsx",
  "apps/web/src/app/AppShell.tsx",
  "apps/web/src/app/router.tsx",
  "apps/web/src/app/navigation.ts",
  "apps/web/src/api/client.ts",
  "apps/web/src/domain/types.ts",
  "apps/web/src/components/AsyncState.tsx",
  "apps/web/src/components/StatusBadge.tsx",
  "apps/web/src/features/reception/ReceptionPage.tsx",
  "apps/web/src/features/billing/BillingWorkspace.tsx",
  "apps/web/src/features/rooms/RoomsPage.tsx",
  "apps/web/src/features/guests/GuestsPage.tsx",
  "apps/web/src/features/housekeeping/HousekeepingPage.tsx",
  "apps/web/src/features/reports/ReportsPage.tsx",
  "apps/web/src/features/users/UsersPage.tsx",
  "apps/web/src/features/network/NetworkPage.tsx",
];
for (const path of required) if (!existsSync(path)) throw new Error(`Architecture boundary missing: ${path}`);
if (existsSync("apps/web/src/shared/api.ts")) throw new Error("HTTP client leaked outside api/ boundary");

const app = readFileSync("apps/web/src/App.tsx", "utf8");
for (const forbidden of ["function Rooms", "function Guests", "function Bookings", "function Housekeeping", "function Reports", "function UsersAdmin", "function NetworkAdmin", "fetch(`/api/v1"]) {
  if (app.includes(forbidden)) throw new Error(`App.tsx regained feature/domain responsibility: ${forbidden}`);
}

const shell = readFileSync("apps/web/src/app/AppShell.tsx", "utf8");
if (!shell.includes("AppLink") || !shell.includes("pageFromPath")) throw new Error("App shell must delegate navigation to the client router");
if (/href=["']\/(bookings|rooms|guests|housekeeping|reports|users|network)/.test(shell)) throw new Error("App shell contains full-document internal navigation");

const router = readFileSync("apps/web/src/app/router.tsx", "utf8");
for (const requiredRouterBehavior of ["history.pushState", "popstate", "event.preventDefault()"] ) {
  if (!router.includes(requiredRouterBehavior)) throw new Error(`Client router missing behavior: ${requiredRouterBehavior}`);
}

const apiClient = readFileSync("apps/web/src/api/client.ts", "utf8");
if (!apiClient.includes("export async function api") || !apiClient.includes("fetch(`/api/v1")) throw new Error("api/ must own the shared HTTP client");

const reception = readFileSync("apps/web/src/features/reception/ReceptionPage.tsx", "utf8");
if (!reception.includes("BillingWorkspace")) throw new Error("Reception must compose the billing feature boundary");
for (const forbidden of ["function BillingPanel", "function CashBalancePanel", "type CashBalance ="]) {
  if (reception.includes(forbidden)) throw new Error(`Reception regained finance responsibility: ${forbidden}`);
}

const billing = readFileSync("apps/web/src/features/billing/BillingWorkspace.tsx", "utf8");
if (!billing.includes("function BillingPanel") || !billing.includes("function CashBalancePanel")) throw new Error("Billing workspace must own payment and cash-shift surfaces");

const rooms = readFileSync("apps/web/src/features/rooms/RoomsPage.tsx", "utf8");
const guests = readFileSync("apps/web/src/features/guests/GuestsPage.tsx", "utf8");
const housekeeping = readFileSync("apps/web/src/features/housekeeping/HousekeepingPage.tsx", "utf8");
if (!rooms.includes("<AsyncState") || !guests.includes("<AsyncState")) throw new Error("AsyncState must represent demonstrated cross-feature reuse");
const statusBadgeConsumers = [rooms, reception, housekeeping].filter(content => content.includes("<StatusBadge")).length;
if (statusBadgeConsumers < 2) throw new Error("StatusBadge is not genuinely reused across features");
if (housekeeping.includes("HousekeepingLegacy") || housekeeping.includes("ReworkLegacy")) throw new Error("Legacy housekeeping implementations leaked into active feature module");

console.log(JSON.stringify({ architectureFitness: "PASS", boundaries: required.length, clientNavigation: true, billingBoundary: true, sharedUiReuse: true }));
