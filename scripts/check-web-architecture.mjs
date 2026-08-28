import { readFileSync, existsSync } from "node:fs";

const required = [
  "apps/web/src/App.tsx",
  "apps/web/src/app/AppShell.tsx",
  "apps/web/src/app/router.tsx",
  "apps/web/src/app/navigation.ts",
  "apps/web/src/shared/api.ts",
  "apps/web/src/domain/types.ts",
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

const reception = readFileSync("apps/web/src/features/reception/ReceptionPage.tsx", "utf8");
if (!reception.includes("BillingWorkspace")) throw new Error("Reception must compose the billing feature boundary");
for (const forbidden of ["function BillingPanel", "function CashBalancePanel", "type CashBalance ="]) {
  if (reception.includes(forbidden)) throw new Error(`Reception regained finance responsibility: ${forbidden}`);
}

const billing = readFileSync("apps/web/src/features/billing/BillingWorkspace.tsx", "utf8");
if (!billing.includes("function BillingPanel") || !billing.includes("function CashBalancePanel")) throw new Error("Billing workspace must own payment and cash-shift surfaces");

const housekeeping = readFileSync("apps/web/src/features/housekeeping/HousekeepingPage.tsx", "utf8");
if (housekeeping.includes("HousekeepingLegacy") || housekeeping.includes("ReworkLegacy")) throw new Error("Legacy housekeeping implementations leaked into active feature module");

console.log(JSON.stringify({ architectureFitness: "PASS", boundaries: required.length, clientNavigation: true, billingBoundary: true }));
