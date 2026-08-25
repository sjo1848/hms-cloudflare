import { Hono } from "hono";
import type { ApiVariables } from "../context";
import { hasCapability } from "../auth/capabilities";
import { ApiError } from "../errors";
import { isoDate } from "../validation";
import type { OperationalDatabase } from "../routing";

type AnalyticsApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = OperationalDatabase;
type DateRange = { start: string; end: string };

function hotelCapability(context: any, capability: string): void { if (!hasCapability(context.get("membership").role, capability)) throw ApiError.forbidden(); }
function optionalRange(context: any): DateRange {
  const end = context.req.query("end") ?? new Date().toISOString().slice(0, 10);
  const start = context.req.query("start") ?? new Date(Date.parse(`${end}T00:00:00Z`) - 30 * 86400000).toISOString().slice(0, 10);
  const normalized = { start: isoDate(start, "start"), end: isoDate(end, "end") };
  if (normalized.end < normalized.start) throw ApiError.badRequest("end must be on or after start");
  return normalized;
}
function today(): string { return new Date().toISOString().slice(0, 10); }
function monthStart(value: string): string { return `${value.slice(0, 8)}01`; }
function derived(occupancyRate: number, revenue: number, activeBookings: number) { const adr = activeBookings > 0 ? Math.trunc(revenue / activeBookings) : 0; return { adr_cents: adr, rev_par_cents: Math.trunc((occupancyRate * adr) / 100) }; }

async function dashboard(db: Db) {
  const now = today(); const month = monthStart(now);
  const row = await db.prepare(`SELECT
    (SELECT COALESCE(SUM(total_cents),0) FROM bookings WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in >= ?1) AS revenue_month_cents,
    (SELECT COUNT(*) FROM bookings WHERE status='CONFIRMED' AND check_in=?2) AS today_check_ins,
    (SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN')) AS active_bookings_count,
    (SELECT COUNT(*) FROM rooms) AS total_rooms,
    (SELECT COUNT(DISTINCT room_id) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in <= ?2 AND check_out > ?2) AS occupied_rooms,
    (SELECT COUNT(*) FROM bookings WHERE status='CONFIRMED' AND check_in=?2) AS arrivals_count,
    (SELECT COUNT(*) FROM bookings WHERE status='CHECKED_IN' AND check_out=?2) AS departures_count`).bind(month, now).first<any>();
  const occupancyRate = Number(row?.total_rooms ?? 0) === 0 ? 0 : (Number(row.occupied_rooms) * 100) / Number(row.total_rooms);
  return { revenue_month_cents: Number(row?.revenue_month_cents ?? 0), occupancy_rate: occupancyRate, today_check_ins: Number(row?.today_check_ins ?? 0), active_bookings_count: Number(row?.active_bookings_count ?? 0), arrivals_today_count: Number(row?.arrivals_count ?? 0), departures_today_count: Number(row?.departures_count ?? 0), ...derived(occupancyRate, Number(row?.revenue_month_cents ?? 0), Number(row?.active_bookings_count ?? 0)) };
}
async function hotelMetrics(db: Db, range: DateRange) {
  const summary = await dashboard(db);
  const revenue = await db.prepare("SELECT COALESCE(SUM(total_cents),0) AS total FROM bookings WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in >= ?1 AND check_in <= ?2").bind(range.start, range.end).first<{ total: number }>();
  const rows = await db.prepare(`WITH RECURSIVE days(day) AS (SELECT ?1 UNION ALL SELECT date(day,'+1 day') FROM days WHERE day < ?2) SELECT day AS date, (SELECT COUNT(DISTINCT b.room_id) FROM bookings b WHERE b.status IN ('CONFIRMED','CHECKED_IN') AND b.check_in <= days.day AND b.check_out > days.day) AS occupied_rooms, (SELECT COUNT(*) FROM rooms) AS total_rooms FROM days ORDER BY day`).bind(range.start, range.end).all<{ date: string; occupied_rooms: number; total_rooms: number }>();
  return { dashboard: summary, revenue_cents: Number(revenue?.total ?? 0), occupancy: rows.results.map((row) => ({ date: row.date, occupied_rooms: Number(row.occupied_rooms ?? 0), total_rooms: Number(row.total_rooms ?? 0), occupancy_rate: Number(row.total_rooms ?? 0) === 0 ? 0 : (Number(row.occupied_rooms) * 100) / Number(row.total_rooms) })) };
}
function configuredDb(env: Env, binding: string): Db { if (!["HOTEL_DEMO_DB", "HOTEL_SECOND_DB"].includes(binding)) throw ApiError.unavailable("Operational hotel binding unavailable"); const db = (env as unknown as Record<string, unknown>)[binding]; if (!db || typeof db !== "object") throw ApiError.unavailable("Operational hotel binding unavailable"); return db as Db; }

export function createAnalyticsRoutes(): AnalyticsApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();
  app.get("/analytics/kpis", async (context) => { hotelCapability(context, "analytics.kpis.read"); return context.json(await dashboard(context.get("operationalDatabase"))); });
  app.get("/reports/revenue", async (context) => { hotelCapability(context, "reports.revenue.read"); const range = optionalRange(context); const result = await context.get("operationalDatabase").prepare("SELECT check_in AS date, COALESCE(SUM(total_cents),0) AS revenue_cents FROM bookings WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in >= ?1 AND check_in <= ?2 GROUP BY check_in ORDER BY check_in").bind(range.start, range.end).all(); return context.json(result.results); });
  app.get("/reports/occupancy", async (context) => { hotelCapability(context, "reports.occupancy.read"); return context.json((await hotelMetrics(context.get("operationalDatabase"), optionalRange(context))).occupancy); });
  app.get("/hotels/network-kpis", async (context) => { if (!hasCapability(context.get("networkRole") ?? "", "saas.hotels.read")) throw ApiError.forbidden(); const range = optionalRange(context); const hotels = await context.env.CONTROL_DB.prepare("SELECT h.id,h.slug,h.operational_binding,COALESCE(m.name,'') AS name,m.plan_tier FROM control_hotels h LEFT JOIN hotel_admin_metadata m ON m.hotel_id=h.id WHERE h.active=1 ORDER BY h.slug").all<any>(); const rows = []; for (const hotel of hotels.results) { const metrics = await hotelMetrics(configuredDb(context.env, hotel.operational_binding), range); rows.push({ hotel_id: hotel.id, hotel_name: hotel.name, plan_tier: hotel.plan_tier ?? "BASIC", occupancy_rate: metrics.dashboard.occupancy_rate, active_bookings_count: metrics.dashboard.active_bookings_count, revenue_cents: metrics.revenue_cents, adr_cents: metrics.dashboard.adr_cents, rev_par_cents: metrics.dashboard.rev_par_cents }); } rows.sort((a, b) => b.revenue_cents - a.revenue_cents || a.hotel_id.localeCompare(b.hotel_id)); return context.json({ start: range.start, end: range.end, total_hotels: rows.length, total_active_bookings: rows.reduce((s, r) => s + r.active_bookings_count, 0), total_revenue_cents: rows.reduce((s, r) => s + r.revenue_cents, 0), average_occupancy_rate: rows.length ? rows.reduce((s, r) => s + r.occupancy_rate, 0) / rows.length : 0, hotels: rows }); });
  return app;
}
