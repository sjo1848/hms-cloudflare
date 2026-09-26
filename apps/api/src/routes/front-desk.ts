import { Hono } from "hono";
import type { ApiVariables } from "../context";
import { hasCapability } from "../auth/capabilities";
import { ApiError } from "../errors";
import { bookingStatusView } from "../modules/bookings/domain";
import { hotelLocalDate } from "../time/hotel-time";

type FrontDeskApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type BookingRow = {
  id: string; guest_id: string; guest_name: string; room_id: string; room_number: string;
  check_in: string; check_out: string; status: string; total_cents: number; notes: string | null;
  room_status: string; maintenance_id: string | null; maintenance_impact: "BLOCKING" | "NON_BLOCKING" | null;
  maintenance_reason: string | null; maintenance_status: string | null;
};

type QueueClassification = {
  lane: "arrival" | "departure" | "in-house" | "reservation" | "finished" | "attention";
  reason: "departure-overdue" | "departure-today" | "arrival-overdue" | "arrival-today" | "upcoming-arrival" | "in-house" | "finished" | "review";
  attention: boolean;
  priority: number;
  date: string;
};

function classify(row: BookingRow, date: string): QueueClassification {
  const status = row.status.replace(/[\s_-]/g, "").toLowerCase();
  if (status === "checkedin") {
    if (row.check_out < date) return { lane: "departure", reason: "departure-overdue", attention: true, priority: 0, date: row.check_out };
    if (row.check_out === date) return { lane: "departure", reason: "departure-today", attention: true, priority: 10, date: row.check_out };
    return { lane: "in-house", reason: "in-house", attention: false, priority: 40, date: row.check_out };
  }
  if (status === "confirmed") {
    if (row.check_in < date) return { lane: "arrival", reason: "arrival-overdue", attention: true, priority: 5, date: row.check_in };
    if (row.check_in === date) return { lane: "arrival", reason: "arrival-today", attention: true, priority: 20, date: row.check_in };
    return { lane: "reservation", reason: "upcoming-arrival", attention: false, priority: 30, date: row.check_in };
  }
  if (["checkedout", "cancelled", "canceled"].includes(status)) {
    return { lane: "finished", reason: "finished", attention: false, priority: 90, date: row.check_out };
  }
  return { lane: "attention", reason: "review", attention: true, priority: 15, date: row.check_in };
}

const roomStatus = (status: string) => ({
  AVAILABLE: "Available", OCCUPIED: "Occupied", DIRTY: "Dirty", CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance", OUT_OF_ORDER: "OutOfOrder",
} as Record<string, string>)[status] ?? status;

function compareItems(left: { booking: { id: string; room_number: string; guest_name: string }; priority: number; date: string }, right: { booking: { id: string; room_number: string; guest_name: string }; priority: number; date: string }) {
  return left.priority - right.priority
    || left.date.localeCompare(right.date)
    || left.booking.room_number.localeCompare(right.booking.room_number, "es", { numeric: true })
    || left.booking.guest_name.localeCompare(right.booking.guest_name, "es")
    || left.booking.id.localeCompare(right.booking.id);
}

export function createFrontDeskRoutes(): FrontDeskApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();
  app.get("/front-desk/board", async context => {
    const membership = context.get("membership");
    if (!hasCapability(membership.role, "bookings.read")) throw ApiError.forbidden();
    const time = context.get("hotelTime");
    const date = time?.localDate ?? hotelLocalDate(membership.timeZone);
    const generatedAt = time?.nowIso ?? new Date().toISOString();
    const result = await context.get("operationalDatabase").prepare(
      `SELECT b.id, b.guest_id, g.full_name AS guest_name, b.room_id, r.room_number,
              b.check_in, b.check_out, b.status, b.total_cents, b.notes, r.status AS room_status,
              mc.id AS maintenance_id, mc.impact AS maintenance_impact,
              mc.reason AS maintenance_reason, mc.status AS maintenance_status
       FROM bookings b
       JOIN guests g ON g.id = b.guest_id
       JOIN rooms r ON r.id = b.room_id
       LEFT JOIN maintenance_cases mc ON mc.room_id = r.id AND mc.status = 'OPEN'`,
    ).all<BookingRow>();
    const items = result.results.map(row => {
      const queue = classify(row, date);
      return {
        booking: {
          id: row.id, guest_id: row.guest_id, guest_name: row.guest_name,
          room_id: row.room_id, room_number: row.room_number, check_in: row.check_in,
          check_out: row.check_out, status: bookingStatusView(row.status),
          total_cents: row.total_cents, notes: row.notes,
        },
        lane: queue.lane, reason: queue.reason, attention: queue.attention,
        priority: queue.priority, date: queue.date, room_status: roomStatus(row.room_status),
        maintenance_case: row.maintenance_id ? {
          id: row.maintenance_id, impact: row.maintenance_impact,
          reason: row.maintenance_reason, status: row.maintenance_status === "OPEN" ? "Open" : "Resolved",
        } : null,
      };
    }).sort(compareItems);
    return context.json({ date, generated_at: generatedAt, items });
  });
  return app;
}
