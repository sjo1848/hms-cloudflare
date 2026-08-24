import { Hono } from "hono";
import type { ApiVariables } from "../context";
import { hasCapability } from "../auth/capabilities";
import { ApiError } from "../errors";
import { dateRange } from "../validation";
import type { OperationalDatabase } from "../routing";

type AnalyticsApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = OperationalDatabase;

function hotelCapability(context: any, capability: string): void {
  if (!hasCapability(context.get("membership").role, capability)) throw ApiError.forbidden();
}

function params(context: any): { start: string; end: string } {
  const start = context.req.query("start");
  const end = context.req.query("end");
  if (!start || !end) throw ApiError.badRequest("start and end are required");
  return dateRange(start, end);
}

function metrics(row: { revenue_cents?: number | null; active_bookings?: number | null; occupied_nights?: number | null; room_count?: number | null; days: number }) {
  const revenue = Number(row.revenue_cents ?? 0);
  const activeBookings = Number(row.active_bookings ?? 0);
  const occupiedNights = Number(row.occupied_nights ?? 0);
  const roomCount = Number(row.room_count ?? 0);
  const availableNights = roomCount * row.days;
  const occupancyRate = availableNights === 0 ? 0 : Number(((occupiedNights * 100) / availableNights).toFixed(2));
  const adrCents = occupiedNights === 0 ? 0 : Math.round(revenue / occupiedNights);
  const revparCents = availableNights === 0 ? 0 : Math.round(revenue / availableNights);
  return { revenue_cents: revenue, active_bookings: activeBookings, occupied_nights: occupiedNights, available_nights: availableNights, occupancy_rate: occupancyRate, adr_cents: adrCents, revpar_cents: revparCents };
}

async function hotelMetrics(db: Db, start: string, end: string) {
  const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
  const row = await db.prepare(`
    SELECT
      (SELECT COALESCE(SUM(b.total_cents),0) FROM bookings b WHERE b.status <> 'CANCELLED' AND b.check_in >= ?1 AND b.check_in < ?2) AS revenue_cents,
      (SELECT COUNT(*) FROM bookings b WHERE b.status IN ('CONFIRMED','CHECKED_IN') AND b.check_in < ?2 AND b.check_out > ?1) AS active_bookings,
      (SELECT COUNT(*) FROM room_inventory_nights n JOIN bookings b ON b.id=n.booking_id WHERE b.status <> 'CANCELLED' AND n.stay_date >= ?1 AND n.stay_date < ?2) AS occupied_nights,
      (SELECT COUNT(*) FROM rooms WHERE status <> 'OUT_OF_ORDER') AS room_count`).bind(start, end).first<{ revenue_cents: number; active_bookings: number; occupied_nights: number; room_count: number }>();
  return metrics({ ...row, days });
}

function configuredDb(env: Env, binding: string): Db {
  if (!/^[A-Z0-9_]+$/.test(binding) || !["HOTEL_DEMO_DB", "HOTEL_SECOND_DB"].includes(binding)) throw ApiError.unavailable("Operational hotel binding unavailable");
  const db = (env as unknown as Record<string, unknown>)[binding];
  if (!db || typeof db !== "object") throw ApiError.unavailable("Operational hotel binding unavailable");
  return db as Db;
}

export function createAnalyticsRoutes(): AnalyticsApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();
  app.get("/analytics/kpis", async (context) => {
    hotelCapability(context, "analytics.kpis.read");
    const range = params(context);
    return context.json({ ...await hotelMetrics(context.get("operationalDatabase"), range.start, range.end), start: range.start, end: range.end });
  });
  app.get("/reports/revenue", async (context) => {
    hotelCapability(context, "reports.revenue.read");
    const range = params(context);
    const rows = await context.get("operationalDatabase").prepare("SELECT check_in AS date, COALESCE(SUM(total_cents),0) AS revenue_cents, COUNT(*) AS booking_count FROM bookings WHERE status <> 'CANCELLED' AND check_in >= ?1 AND check_in < ?2 GROUP BY check_in ORDER BY check_in").bind(range.start, range.end).all();
    return context.json({ start: range.start, end: range.end, rows: rows.results, total_revenue_cents: rows.results.reduce((sum, row) => sum + Number((row as { revenue_cents: number }).revenue_cents), 0) });
  });
  app.get("/reports/occupancy", async (context) => {
    hotelCapability(context, "reports.occupancy.read");
    const range = params(context);
    const result = await hotelMetrics(context.get("operationalDatabase"), range.start, range.end);
    return context.json({ start: range.start, end: range.end, occupied_nights: result.occupied_nights, available_nights: result.available_nights, occupancy_rate: result.occupancy_rate, adr_cents: result.adr_cents, revpar_cents: result.revpar_cents });
  });
  app.get("/hotels/network-kpis", async (context) => {
    if (!hasCapability(context.get("networkRole") ?? "", "saas.hotels.read")) throw ApiError.forbidden();
    const range = params(context);
    const hotels = await context.env.CONTROL_DB.prepare("SELECT h.id,h.slug,h.operational_binding,h.active,COALESCE(m.name,'') AS name,m.plan_tier FROM control_hotels h LEFT JOIN hotel_admin_metadata m ON m.hotel_id=h.id WHERE h.active=1 ORDER BY h.slug").all<{ id: string; slug: string; operational_binding: string; active: number; name: string; plan_tier: string | null }>();
    const rows = [];
    for (const hotel of hotels.results) {
      const values = await hotelMetrics(configuredDb(context.env, hotel.operational_binding), range.start, range.end);
      rows.push({ hotel_id: hotel.id, slug: hotel.slug, name: hotel.name, plan_tier: hotel.plan_tier ?? "BASIC", operational_binding: hotel.operational_binding, ...values });
    }
    rows.sort((a, b) => b.revenue_cents - a.revenue_cents || a.slug.localeCompare(b.slug));
    const totalHotels = rows.length;
    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue_cents, 0);
    const totalActive = rows.reduce((sum, row) => sum + row.active_bookings, 0);
    const totalOccupied = rows.reduce((sum, row) => sum + row.occupied_nights, 0);
    const totalAvailable = rows.reduce((sum, row) => sum + row.available_nights, 0);
    return context.json({ start: range.start, end: range.end, total_hotels: totalHotels, active_hotels: totalHotels, active_bookings: totalActive, revenue_cents: totalRevenue, average_occupancy_rate: totalAvailable === 0 ? 0 : Number(((totalOccupied * 100) / totalAvailable).toFixed(2)), rows });
  });
  return app;
}
