import type { OperationalDatabase } from "../../routing";

export type NetworkDateRange = { start: string; end: string };
export type NetworkHotelMetrics = {
  occupancy_rate: number;
  active_bookings_count: number;
  revenue_cents: number;
  adr_cents: number;
  rev_par_cents: number;
};

export async function loadNetworkHotelMetrics(
  db: OperationalDatabase,
  range: NetworkDateRange,
  today: string,
  currentMonthStart: string,
): Promise<NetworkHotelMetrics> {
  const row = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM rooms) AS total_rooms,
    (SELECT COUNT(DISTINCT room_id) FROM bookings
      WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in <= ?3 AND check_out > ?3) AS occupied_rooms,
    (SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN')) AS active_bookings_count,
    (SELECT COALESCE(SUM(total_cents),0) FROM bookings
      WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in >= ?1 AND check_in <= ?2) AS revenue_cents,
    (SELECT COALESCE(SUM(total_cents),0) FROM bookings
      WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in >= ?4) AS revenue_month_cents`)
    .bind(range.start, range.end, today, currentMonthStart)
    .first<{
      total_rooms: number;
      occupied_rooms: number;
      active_bookings_count: number;
      revenue_cents: number;
      revenue_month_cents: number;
    }>();

  const totalRooms = Number(row?.total_rooms ?? 0);
  const occupiedRooms = Number(row?.occupied_rooms ?? 0);
  const activeBookings = Number(row?.active_bookings_count ?? 0);
  const rangeRevenue = Number(row?.revenue_cents ?? 0);
  const monthRevenue = Number(row?.revenue_month_cents ?? 0);
  const occupancyRate = totalRooms === 0 ? 0 : (occupiedRooms * 100) / totalRooms;
  const adr = activeBookings > 0 ? Math.trunc(monthRevenue / activeBookings) : 0;
  return {
    occupancy_rate: occupancyRate,
    active_bookings_count: activeBookings,
    revenue_cents: rangeRevenue,
    adr_cents: adr,
    rev_par_cents: Math.trunc((occupancyRate * adr) / 100),
  };
}
