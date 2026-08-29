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

const bookingRoute = readFileSync("apps/api/src/routes/bookings.ts", "utf8");
if (!bookingRoute.includes("D1BookingRepository")) throw new Error("Booking route must depend on the booking persistence port adapter");
if (bookingRoute.includes(".prepare(")) throw new Error("Booking route regained direct D1 SQL responsibility");

for (const path of ["apps/api/src/modules/bookings/domain.ts", "apps/api/src/modules/bookings/ports.ts"]) {
  const content = readFileSync(path, "utf8");
  for (const forbidden of ["from \"hono\"", "../errors", "../../routing", "room-availability", "D1Database"]) {
    if (content.includes(forbidden)) throw new Error(`${path} depends on infrastructure/transport: ${forbidden}`);
  }
}

const d1Repository = readFileSync("apps/api/src/modules/bookings/d1-booking-repository.ts", "utf8");
if (!d1Repository.includes("OperationalDatabase") || !d1Repository.includes("ADVANCE_RESERVABLE_ROOM_SQL")) throw new Error("D1 booking adapter must own Cloudflare persistence details");

const analytics = readFileSync("apps/api/src/routes/analytics.ts", "utf8");
if (!analytics.includes("loadNetworkHotelMetrics")) throw new Error("Network KPI route must use the optimized tenant metrics boundary");
if (analytics.includes("hotelMetrics(configuredDb(context.env, hotel.operational_binding), range)")) throw new Error("Network KPI regressed to the multi-query per-tenant path");

const reportingIndexes = readFileSync("apps/api/schema/hotel-migrations/0017_reporting_indexes.sql", "utf8");
if (!reportingIndexes.includes("idx_bookings_status_checkout") || !reportingIndexes.includes("status, check_out")) throw new Error("Checkout reporting index is missing");

console.log(JSON.stringify({
  architectureFitnessII: "PASS",
  featureOrchestrationBoundaries: ["reception", "housekeeping"],
  bookingHexagonalBoundary: true,
  networkKpiSingleQueryBoundary: true,
  reportingIndexContract: true,
}));
