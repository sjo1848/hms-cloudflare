import { existsSync, readFileSync } from "node:fs";

const required = [
  "apps/web/src/features/reception/model.ts",
  "apps/web/src/features/reception/reception-api.ts",
  "apps/web/src/features/reception/useReceptionWorkspace.ts",
  "apps/web/src/features/housekeeping/model.ts",
  "apps/web/src/features/housekeeping/housekeeping-api.ts",
  "apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts",
  "apps/api/src/modules/bookings/domain.ts",
  "apps/api/src/modules/bookings/ports.ts",
  "apps/api/src/modules/bookings/d1-booking-repository.ts",
  "apps/api/src/modules/lifecycle/domain.ts",
  "apps/api/src/modules/lifecycle/ports.ts",
  "apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts",
  "apps/api/src/modules/billing/domain.ts",
  "apps/api/src/modules/billing/ports.ts",
  "apps/api/src/modules/billing/d1-payment-repository.ts",
  "apps/api/src/modules/analytics/network-metrics.ts",
  "apps/api/schema/hotel-migrations/0017_reporting_indexes.sql",
  ".orchestration/decisions/CF-WEB-STACK-002.md",
];
for (const path of required) if (!existsSync(path)) throw new Error(`Architecture Hardening II boundary missing: ${path}`);

const receptionPage = readFileSync("apps/web/src/features/reception/ReceptionPage.tsx", "utf8");
if (!receptionPage.includes("useReceptionWorkspace")) throw new Error("ReceptionPage must delegate orchestration to useReceptionWorkspace");
if (receptionPage.includes("api<") || receptionPage.includes("api(")) throw new Error("ReceptionPage may not call the HTTP client directly");

const housekeepingPage = readFileSync("apps/web/src/features/housekeeping/HousekeepingPage.tsx", "utf8");
if (!housekeepingPage.includes("useHousekeepingWorkspace")) throw new Error("HousekeepingPage must delegate orchestration to useHousekeepingWorkspace");
if (housekeepingPage.includes("api<") || housekeepingPage.includes("api(")) throw new Error("HousekeepingPage may not call the HTTP client directly");

for (const [path, requiredImport] of [
  ["apps/web/src/features/reception/reception-api.ts", "../../api/client"],
  ["apps/web/src/features/housekeeping/housekeeping-api.ts", "../../api/client"],
]) {
  const content = readFileSync(path, "utf8");
  if (!content.includes(requiredImport)) throw new Error(`${path} must own its feature HTTP adapter`);
}

const routeBoundaries = [
  ["apps/api/src/routes/bookings.ts", "D1BookingRepository", true],
  ["apps/api/src/routes/lifecycle.ts", "D1LifecycleRepository", true],
  ["apps/api/src/routes/billing.ts", "D1PaymentRepository", false],
];
for (const [path, adapter, noSql] of routeBoundaries) {
  const content = readFileSync(path, "utf8");
  if (!content.includes(adapter)) throw new Error(`${path} must depend on ${adapter}`);
  if (noSql && content.includes(".prepare(")) throw new Error(`${path} regained direct D1 SQL responsibility`);
}

for (const path of [
  "apps/api/src/modules/bookings/domain.ts",
  "apps/api/src/modules/bookings/ports.ts",
  "apps/api/src/modules/lifecycle/domain.ts",
  "apps/api/src/modules/lifecycle/ports.ts",
  "apps/api/src/modules/billing/domain.ts",
  "apps/api/src/modules/billing/ports.ts",
]) {
  const content = readFileSync(path, "utf8");
  for (const forbidden of ["from \"hono\"", "ApiError", "../../routing", "room-availability", "D1Database", ".prepare("]) {
    if (content.includes(forbidden)) throw new Error(`${path} depends on infrastructure/transport: ${forbidden}`);
  }
}

const bookingAdapter = readFileSync("apps/api/src/modules/bookings/d1-booking-repository.ts", "utf8");
if (!bookingAdapter.includes("OperationalDatabase") || !bookingAdapter.includes("ADVANCE_RESERVABLE_ROOM_SQL") || !bookingAdapter.includes("room_inventory_nights")) throw new Error("D1 booking adapter must own reservation inventory persistence details");
const lifecycleAdapter = readFileSync("apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts", "utf8");
if (!lifecycleAdapter.includes("OperationalDatabase") || !lifecycleAdapter.includes("lifecycle_events") || !lifecycleAdapter.includes("room_inventory_nights")) throw new Error("D1 lifecycle adapter must own lifecycle/inventory atomic persistence");
const billingAdapter = readFileSync("apps/api/src/modules/billing/d1-payment-repository.ts", "utf8");
if (!billingAdapter.includes("OperationalDatabase") || !billingAdapter.includes("payment_entries") || !billingAdapter.includes("financial_events")) throw new Error("D1 payment adapter must own payment transaction persistence");

const analytics = readFileSync("apps/api/src/routes/analytics.ts", "utf8");
if (!analytics.includes("loadNetworkHotelMetrics")) throw new Error("Network KPI route must use the optimized tenant metrics boundary");
if (analytics.includes("hotelMetrics(configuredDb(context.env, hotel.operational_binding), range)")) throw new Error("Network KPI regressed to the multi-query per-tenant path");

const reportingIndexes = readFileSync("apps/api/schema/hotel-migrations/0017_reporting_indexes.sql", "utf8");
if (!reportingIndexes.includes("idx_bookings_status_checkout") || !reportingIndexes.includes("status, check_out")) throw new Error("Checkout reporting index is missing");

console.log(JSON.stringify({
  architectureFitnessII: "PASS",
  featureOrchestrationBoundaries: ["reception", "housekeeping"],
  hexagonalBoundaries: ["bookings+reservation-inventory", "lifecycle", "billing-payment"],
  networkKpiSingleQueryBoundary: true,
  reportingIndexContract: true,
}));
