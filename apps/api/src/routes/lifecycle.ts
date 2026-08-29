import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { jsonBody, requiredText } from "../validation";
import { hasCapability } from "../auth/capabilities";

type LifecycleApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = ApiVariables["operationalDatabase"];
type LifecycleBody = Record<string, unknown>;

function requireLifecycle(context: Context<{ Bindings: Env; Variables: ApiVariables }>): void {
  if (!hasCapability(context.get("membership").role, "bookings.write")) throw ApiError.forbidden();
}

function requiredConfirmation(body: LifecycleBody, field: string): void {
  if (body[field] !== true) throw ApiError.badRequest(`${field} must be confirmed`);
}

function positiveCount(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 100) throw ApiError.badRequest("check_in_guests_count must be a positive integer");
  return value as number;
}

function claimDates(start: string, end: string): string[] {
  const result: string[] = [];
  for (let cursor = new Date(`${start}T00:00:00.000Z`); cursor < new Date(`${end}T00:00:00.000Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) result.push(cursor.toISOString().slice(0, 10));
  return result;
}

async function booking(db: Db, id: string): Promise<{ id: string; room_id: string; check_in: string; check_out: string; status: string } | null> {
  return db.prepare("SELECT id, room_id, check_in, check_out, status FROM bookings WHERE id = ?1").bind(id).first();
}

function event(db: Db, bookingId: string, eventType: string, context: Context<{ Bindings: Env; Variables: ApiVariables }>, details: LifecycleBody) {
  return db.prepare(`INSERT INTO lifecycle_events
    (id, booking_id, event_type, actor_subject, request_id, hotel_id, details_json, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`).bind(
    crypto.randomUUID(), bookingId, eventType, context.get("identity").subject, context.get("requestId"),
    context.get("membership").hotelId, JSON.stringify(details), new Date().toISOString(),
  );
}

export function createLifecycleRoutes(): LifecycleApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

  app.post("/bookings/:id/check-in", async (context) => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw);
    for (const field of ["document_verified", "contact_confirmed", "stay_confirmed"]) requiredConfirmation(body, field);
    const guestCount = positiveCount(body.check_in_guests_count);
    const id = context.req.param("id"); const db = context.get("operationalDatabase"); const current = await booking(db, id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CONFIRMED") throw ApiError.conflict("Only confirmed bookings can be checked in");
    const now = new Date().toISOString();
    let results: Array<{ meta: { changes: number } }>;
    try {
      results = await db.batch([
        db.prepare("UPDATE bookings SET status = 'CHECKED_IN', check_in_guests_count = ?4, checked_in_at = ?2, checked_in_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CONFIRMED' AND EXISTS (SELECT 1 FROM rooms WHERE id = ?5 AND status = 'AVAILABLE')").bind(id, now, context.get("identity").subject, guestCount, current.room_id),
        db.prepare("UPDATE rooms SET status = 'OCCUPIED' WHERE id = ?1 AND status = 'AVAILABLE' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(current.room_id, id),
        db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) SELECT ?1, ?2, 'CHECK_IN', ?3, ?4, ?5, ?6, ?7, ?8 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?3)").bind(crypto.randomUUID(), id, current.room_id, context.get("identity").subject, context.get("requestId"), context.get("membership").hotelId, JSON.stringify({ checklist: ["document_verified", "contact_confirmed", "stay_confirmed"], check_in_guests_count: guestCount }), now),
      ]);
    } catch { throw ApiError.conflict("Booking became unavailable during check-in"); }
    if (results[0]?.meta.changes !== 1 || results[1]?.meta.changes !== 1 || results[2]?.meta.changes !== 1) throw ApiError.conflict("Booking became unavailable during check-in");
    return context.json({ id, status: "CheckedIn", room_status: "Occupied" });
  });

  app.post("/bookings/:id/reassign", async (context) => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw); const roomId = requiredText(body.room_id, "room_id", 1, 100);
    const id = context.req.param("id"); const db = context.get("operationalDatabase"); const current = await booking(db, id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CHECKED_IN") throw ApiError.conflict("Only checked-in bookings can be reassigned");
    if (roomId === current.room_id) throw ApiError.badRequest("room_id must change");
    const target = await db.prepare(`SELECT r.id FROM rooms AS r
      WHERE r.id = ?1 AND r.status = 'AVAILABLE'
      AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id = r.id AND h.start_date < ?3 AND h.end_date > ?2)
      AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.room_id = r.id AND n.stay_date >= ?2 AND n.stay_date < ?3)`)
      .bind(roomId, current.check_in, current.check_out).first<{ id: string }>();
    if (!target) throw ApiError.conflict("Destination room is unavailable");
    const dates = claimDates(current.check_in, current.check_out); const now = new Date().toISOString();
    try {
      await db.batch([
        db.prepare("UPDATE bookings SET room_id = ?2, updated_at = ?3 WHERE id = ?1 AND status = 'CHECKED_IN' AND room_id = ?4").bind(id, roomId, now, current.room_id),
        db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CHECKED_IN' AND room_id = ?2)").bind(id, roomId),
        ...dates.map((date) => db.prepare("INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?3 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(roomId, date, id)),
        db.prepare("UPDATE rooms SET status = 'AVAILABLE' WHERE id = ?1 AND status = 'OCCUPIED' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?3)").bind(current.room_id, id, roomId),
        db.prepare("UPDATE rooms SET status = 'OCCUPIED' WHERE id = ?1 AND status = 'AVAILABLE' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(roomId, id),
        db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) VALUES (?1, ?2, 'REASSIGN', ?3, ?4, ?5, ?6, ?7, ?8)").bind(crypto.randomUUID(), id, current.room_id, context.get("identity").subject, context.get("requestId"), context.get("membership").hotelId, JSON.stringify({ from_room_id: current.room_id, to_room_id: roomId }), now),
      ]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.conflict("Room reassignment failed without changing the booking");
    }
    return context.json({ id, status: "CheckedIn", room_id: roomId, room_status: "Occupied" });
  });

  app.post("/bookings/:id/check-out", async (context) => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw);
    for (const field of ["charge_reviewed", "release_confirmed", "handoff_confirmed"]) requiredConfirmation(body, field);
    const policy = requiredText(body.check_out_payment_policy, "check_out_payment_policy", 1, 30);
    if (!["settled", "pending-approved"].includes(policy)) throw ApiError.badRequest("check_out_payment_policy is invalid");
    if (policy === "pending-approved" && !hasCapability(context.get("membership").role, "bookings.checkout.override")) throw ApiError.forbidden();
    const referenceInput = body.check_out_reference;
    const reference = referenceInput == null || (typeof referenceInput === "string" && referenceInput.trim() === "")
      ? null
      : requiredText(referenceInput, "check_out_reference", 3, 120);
    if (policy === "pending-approved" && (!reference || reference.trim().length < 6)) throw ApiError.badRequest("check_out_reference must be at least 6 characters for pending-approved");
    const id = context.req.param("id"); const db = context.get("operationalDatabase"); const current = await booking(db, id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CHECKED_IN") throw ApiError.conflict("Only checked-in bookings can be checked out");
    const now = new Date().toISOString();
    try {
      await db.batch([
        db.prepare("UPDATE bookings SET status = 'CHECKED_OUT', check_out_payment_policy = ?4, check_out_reference = ?5, checked_out_at = ?2, checked_out_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CHECKED_IN'").bind(id, now, context.get("identity").subject, policy, reference),
        db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CHECKED_OUT' AND room_id = ?2)").bind(id, current.room_id),
        db.prepare("UPDATE rooms SET status = 'DIRTY' WHERE id = ?1 AND status = 'OCCUPIED' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_OUT' AND room_id = ?1)").bind(current.room_id, id),
        db.prepare("INSERT OR IGNORE INTO invoices (id, booking_id, amount_cents, created_at) SELECT ?1, id, total_cents, ?2 FROM bookings WHERE id = ?3 AND status = 'CHECKED_OUT'").bind(crypto.randomUUID(), now, id),
        db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) VALUES (?1, ?2, 'CHECK_OUT', ?3, ?4, ?5, ?6, ?7, ?8)").bind(crypto.randomUUID(), id, current.room_id, context.get("identity").subject, context.get("requestId"), context.get("membership").hotelId, JSON.stringify({ handoff: "housekeeping", check_out_payment_policy: policy, check_out_reference: reference, charge_reviewed: true, release_confirmed: true }), now),
      ]);
    } catch { throw ApiError.conflict("Booking became unavailable during checkout"); }
    return context.json({ id, status: "CheckedOut", room_status: "Dirty", housekeeping_handoff: true });
  });
  return app;
}
