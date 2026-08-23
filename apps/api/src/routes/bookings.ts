import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { dateRange, jsonBody, requiredText } from "../validation";

type BookingApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = ApiVariables["operationalDatabase"];
type BookingRow = {
  id: string; guest_id: string; guest_name: string; guest_email: string;
  room_id: string; room_number: string; room_type: string; price_cents: number;
  check_in: string; check_out: string; status: string; total_cents: number;
  notes: string | null; created_at: string; updated_at: string;
};

const ROLE_CAPABILITIES: Record<string, ReadonlySet<string>> = {
  admin: new Set(["bookings.read", "bookings.write", "rooms.search"]),
  ops: new Set(["bookings.read", "bookings.write", "rooms.search"]),
  receptionist: new Set(["bookings.read", "bookings.write", "rooms.search"]),
  housekeeping: new Set(),
};

function requireCapability(context: Context<{ Bindings: Env; Variables: ApiVariables }>, capability: string): void {
  if (!ROLE_CAPABILITIES[context.get("membership").role]?.has(capability)) throw ApiError.forbidden();
}

function nights(start: string, end: string): string[] {
  const result: string[] = [];
  for (let cursor = new Date(`${start}T00:00:00.000Z`); cursor < new Date(`${end}T00:00:00.000Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    result.push(cursor.toISOString().slice(0, 10));
  }
  return result;
}

function view(row: BookingRow, hotelId: string) {
  return {
    id: row.id, hotel_id: hotelId, guest_id: row.guest_id, guest_name: row.guest_name,
    guest_email: row.guest_email, room_id: row.room_id, room_number: row.room_number,
    room_type: row.room_type, check_in: row.check_in, check_out: row.check_out,
    status: row.status === "CONFIRMED" ? "Confirmed" : "Cancelled",
    total_cents: row.total_cents, notes: row.notes, created_at: row.created_at, updated_at: row.updated_at,
  };
}

const bookingSelect = `SELECT b.id, b.guest_id, g.full_name AS guest_name, g.email AS guest_email,
  b.room_id, r.room_number, r.room_type, r.price_cents, b.check_in, b.check_out,
  b.status, b.total_cents, b.notes, b.created_at, b.updated_at
  FROM bookings AS b JOIN guests AS g ON g.id = b.guest_id JOIN rooms AS r ON r.id = b.room_id`;

async function findBooking(database: Db, id: string): Promise<BookingRow | null> {
  return database.prepare(`${bookingSelect} WHERE b.id = ?1`).bind(id).first<BookingRow>();
}

async function validateReferences(database: Db, guestId: string, roomId: string, range: { start: string; end: string }): Promise<{ priceCents: number }> {
  const refs = await database.prepare(
    `SELECT r.price_cents FROM rooms AS r JOIN guests AS g ON g.id = ?1
     WHERE r.id = ?2 AND NOT EXISTS (
       SELECT 1 FROM room_holds AS h WHERE h.room_id = r.id AND h.start_date < ?4 AND h.end_date > ?3
     )`,
  ).bind(guestId, roomId, range.start, range.end).first<{ price_cents: number }>();
  if (!refs) throw ApiError.conflict("Guest, room or availability is invalid");
  return { priceCents: refs.price_cents };
}

function claimStatements(database: Db, bookingId: string, roomId: string, claimNights: string[]) {
  return claimNights.map((stayDate) => database.prepare(
    "INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) VALUES (?1, ?2, ?3)",
  ).bind(roomId, stayDate, bookingId));
}

export function createBookingRoutes(): BookingApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

  app.get("/bookings", async (context) => {
    requireCapability(context, "bookings.read");
    const status = context.req.query("status");
    const query = `${bookingSelect}${status ? " WHERE b.status = ?1" : ""} ORDER BY b.check_in, b.created_at DESC`;
    const statement = status ? context.get("operationalDatabase").prepare(query).bind(status) : context.get("operationalDatabase").prepare(query);
    const rows = await statement.all<BookingRow>();
    return context.json(rows.results.map((row) => view(row, context.get("membership").hotelId)));
  });

  app.post("/bookings", async (context) => {
    requireCapability(context, "bookings.write");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const guestId = requiredText(body.guest_id, "guest_id", 1, 100);
    const roomId = requiredText(body.room_id, "room_id", 1, 100);
    const range = dateRange(body.check_in, body.check_out);
    const notes = body.notes == null ? null : requiredText(body.notes, "notes", 1, 500);
    const refs = await validateReferences(context.get("operationalDatabase"), guestId, roomId, range);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const totalCents = refs.priceCents * nights(range.start, range.end).length;
    try {
      await context.get("operationalDatabase").batch([
        context.get("operationalDatabase").prepare(
          `INSERT INTO bookings (id, guest_id, room_id, check_in, check_out, status, total_cents, notes, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, 'CONFIRMED', ?6, ?7, ?8, ?8)`,
        ).bind(id, guestId, roomId, range.start, range.end, totalCents, notes, now),
        ...claimStatements(context.get("operationalDatabase"), id, roomId, nights(range.start, range.end)),
      ]);
    } catch {
      throw ApiError.conflict("Room is unavailable for one or more nights");
    }
    const row = await findBooking(context.get("operationalDatabase"), id);
    if (!row) throw ApiError.notFound("Booking was not created");
    return context.json(view(row, context.get("membership").hotelId), 201);
  });

  app.get("/bookings/:id", async (context) => {
    requireCapability(context, "bookings.read");
    const row = await findBooking(context.get("operationalDatabase"), context.req.param("id"));
    if (!row) throw ApiError.notFound("Booking not found");
    return context.json(view(row, context.get("membership").hotelId));
  });

  app.patch("/bookings/:id", async (context) => {
    requireCapability(context, "bookings.write");
    const database = context.get("operationalDatabase");
    const id = context.req.param("id");
    const current = await findBooking(database, id);
    if (!current) throw ApiError.notFound("Booking not found");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const status = body.status == null ? current.status : requiredText(body.status, "status", 1, 20).toUpperCase();
    if (!["CONFIRMED", "CANCELLED"].includes(status)) throw ApiError.badRequest("Only confirmation or cancellation is supported in this increment");
    if (status === "CANCELLED") {
      await database.batch([
        database.prepare("UPDATE bookings SET status = 'CANCELLED', updated_at = ?2 WHERE id = ?1 AND status <> 'CANCELLED'").bind(id, new Date().toISOString()),
        database.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1").bind(id),
      ]);
    } else {
      const guestId = body.guest_id == null ? current.guest_id : requiredText(body.guest_id, "guest_id", 1, 100);
      const roomId = body.room_id == null ? current.room_id : requiredText(body.room_id, "room_id", 1, 100);
      const range = dateRange(body.check_in ?? current.check_in, body.check_out ?? current.check_out);
      const notes = body.notes == null ? current.notes : requiredText(body.notes, "notes", 1, 500);
      const refs = await validateReferences(database, guestId, roomId, range);
      const claimNights = nights(range.start, range.end);
      const now = new Date().toISOString();
      try {
        await database.batch([
          database.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1").bind(id),
          database.prepare(
            `UPDATE bookings SET guest_id = ?2, room_id = ?3, check_in = ?4, check_out = ?5, status = 'CONFIRMED', total_cents = ?6, notes = ?7, updated_at = ?8 WHERE id = ?1`,
          ).bind(id, guestId, roomId, range.start, range.end, refs.priceCents * claimNights.length, notes, now),
          ...claimStatements(database, id, roomId, claimNights),
        ]);
      } catch {
        throw ApiError.conflict("Room is unavailable for one or more nights");
      }
    }
    const row = await findBooking(database, id);
    if (!row) throw ApiError.notFound("Booking not found");
    return context.json(view(row, context.get("membership").hotelId));
  });

  return app;
}

export { nights };
