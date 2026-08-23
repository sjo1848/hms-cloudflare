import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { dateRange, email, integerCents, isoDate, jsonBody, requiredText } from "../validation";

type InventoryApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;

type RoomRow = {
  id: string;
  room_number: string;
  room_type: string;
  status: string;
  price_cents: number;
};

type GuestRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

type HoldRow = {
  id: string;
  room_id: string;
  room_number?: string;
  room_type?: string;
  start_date: string;
  end_date: string;
  hold_type: string;
  reason: string;
  created_by_user_id: string | null;
  created_at: string;
};

const ROLE_CAPABILITIES: Record<string, ReadonlySet<string>> = {
  admin: new Set(["rooms.read", "rooms.write", "rooms.search", "guests.read", "guests.write"]),
  ops: new Set(["rooms.read", "rooms.search", "guests.read", "guests.write"]),
  receptionist: new Set(["rooms.read", "rooms.search", "guests.read", "guests.write"]),
  housekeeping: new Set(),
};

function requireCapability(
  context: Context<{ Bindings: Env; Variables: ApiVariables }>,
  capability: string,
): void {
  const role = context.get("membership").role;
  if (!ROLE_CAPABILITIES[role]?.has(capability)) {
    throw ApiError.forbidden();
  }
}

function roomView(row: RoomRow, hotelId: string) {
  return {
    id: row.id,
    hotel_id: hotelId,
    room_number: row.room_number,
    room_type: row.room_type,
    status: ({ AVAILABLE: "Available", OCCUPIED: "Occupied", OUT_OF_ORDER: "OutOfOrder" } as Record<string, string>)[row.status] ?? row.status,
    price_cents: row.price_cents,
  };
}

function holdView(row: HoldRow, hotelId: string) {
  return {
    id: row.id,
    hotel_id: hotelId,
    room_id: row.room_id,
    start_date: row.start_date,
    end_date: row.end_date,
    hold_type: row.hold_type,
    reason: row.reason,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
  };
}

export function createInventoryRoutes(): InventoryApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

  app.get("/rooms", async (context) => {
    requireCapability(context, "rooms.read");
    const rows = await context.get("operationalDatabase").prepare(
      "SELECT id, room_number, room_type, status, price_cents FROM rooms ORDER BY room_number",
    ).all<RoomRow>();
    return context.json(rows.results.map((row) => roomView(row, context.get("membership").hotelId)));
  });

  app.post("/rooms", async (context) => {
    requireCapability(context, "rooms.write");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const roomNumber = requiredText(body.room_number, "room_number", 1, 10);
    const roomType = requiredText(body.room_type, "room_type", 1, 50);
    const priceCents = integerCents(body.price_cents, "price_cents");
    const id = crypto.randomUUID();
    try {
      await context.get("operationalDatabase").prepare(
        "INSERT INTO rooms (id, room_number, room_type, status, price_cents) VALUES (?1, ?2, ?3, 'AVAILABLE', ?4)",
      ).bind(id, roomNumber, roomType, String(priceCents)).run();
    } catch {
      throw ApiError.conflict("Room number already exists");
    }
    const row = await context.get("operationalDatabase").prepare(
      "SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE id = ?1",
    ).bind(id).first<RoomRow>();
    if (!row) throw ApiError.notFound("Room was not created");
    return context.json(roomView(row, context.get("membership").hotelId), 201);
  });

  app.get("/rooms/available", async (context) => {
    requireCapability(context, "rooms.search");
    const range = dateRange(context.req.query("start"), context.req.query("end"));
    const rows = await context.get("operationalDatabase").prepare(
      `SELECT r.id, r.room_number, r.room_type, r.status, r.price_cents
       FROM rooms AS r
       WHERE r.status = 'AVAILABLE'
       AND NOT EXISTS (
         SELECT 1 FROM room_holds AS h
         WHERE h.room_id = r.id AND h.start_date < ?2 AND h.end_date > ?1
       )
       AND NOT EXISTS (
         SELECT 1 FROM room_inventory_nights AS n
         WHERE n.room_id = r.id AND n.stay_date >= ?1 AND n.stay_date < ?2
       )
       ORDER BY r.room_number`,
    ).bind(range.start, range.end).all<RoomRow>();
    return context.json(rows.results.map((row) => roomView(row, context.get("membership").hotelId)));
  });

  app.get("/rooms/holds/board", async (context) => {
    requireCapability(context, "rooms.read");
    const startInput = context.req.query("start");
    const endInput = context.req.query("end");
    const range = startInput || endInput
      ? dateRange(startInput ?? "0001-01-01", endInput ?? "9999-12-31")
      : undefined;
    const statement = range
      ? context.get("operationalDatabase").prepare(
          `SELECT h.id, h.room_id, r.room_number, r.room_type, h.start_date, h.end_date,
                  h.hold_type, h.reason, h.created_by_user_id, h.created_at
           FROM room_holds AS h JOIN rooms AS r ON r.id = h.room_id
           WHERE h.start_date < ?2 AND h.end_date > ?1 ORDER BY h.start_date, r.room_number`,
        ).bind(range.start, range.end)
      : context.get("operationalDatabase").prepare(
          `SELECT h.id, h.room_id, r.room_number, r.room_type, h.start_date, h.end_date,
                  h.hold_type, h.reason, h.created_by_user_id, h.created_at
           FROM room_holds AS h JOIN rooms AS r ON r.id = h.room_id
           ORDER BY h.start_date, r.room_number`,
        );
    const rows = await statement.all<HoldRow>();
    return context.json(rows.results.map((row) => ({
      hold_id: row.id,
      room_id: row.room_id,
      room_number: row.room_number,
      room_type: row.room_type,
      start_date: row.start_date,
      end_date: row.end_date,
      hold_type: row.hold_type,
      reason: row.reason,
      created_at: row.created_at,
    })));
  });

  app.get("/rooms/:id", async (context) => {
    requireCapability(context, "rooms.read");
    const row = await context.get("operationalDatabase").prepare(
      "SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE id = ?1",
    ).bind(context.req.param("id")).first<RoomRow>();
    if (!row) throw ApiError.notFound("Room not found");
    return context.json(roomView(row, context.get("membership").hotelId));
  });

  app.patch("/rooms/:id", async (context) => {
    requireCapability(context, "rooms.write");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const roomNumber = requiredText(body.room_number, "room_number", 1, 10);
    const roomType = requiredText(body.room_type, "room_type", 1, 50);
    const priceCents = integerCents(body.price_cents, "price_cents");
    try {
      const result = await context.get("operationalDatabase").prepare(
        "UPDATE rooms SET room_number = ?2, room_type = ?3, price_cents = ?4 WHERE id = ?1",
      ).bind(context.req.param("id"), roomNumber, roomType, String(priceCents)).run();
      if (result.meta.changes !== 1) throw ApiError.notFound("Room not found");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.conflict("Room number already exists");
    }
    const row = await context.get("operationalDatabase").prepare(
      "SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE id = ?1",
    ).bind(context.req.param("id")).first<RoomRow>();
    if (!row) throw ApiError.notFound("Room not found");
    return context.json(roomView(row, context.get("membership").hotelId));
  });

  app.get("/rooms/:id/holds", async (context) => {
    requireCapability(context, "rooms.read");
    const roomId = context.req.param("id");
    const room = await context.get("operationalDatabase").prepare("SELECT id FROM rooms WHERE id = ?1").bind(roomId).first<{ id: string }>();
    if (!room) throw ApiError.notFound("Room not found");
    const rows = await context.get("operationalDatabase").prepare(
      "SELECT id, room_id, start_date, end_date, hold_type, reason, created_by_user_id, created_at FROM room_holds WHERE room_id = ?1 ORDER BY start_date",
    ).bind(roomId).all<HoldRow>();
    return context.json(rows.results.map((row) => holdView(row, context.get("membership").hotelId)));
  });

  app.post("/rooms/:id/holds", async (context) => {
    requireCapability(context, "rooms.write");
    const roomId = context.req.param("id");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const range = dateRange(body.start_date, body.end_date);
    const holdType = requiredText(body.hold_type, "hold_type", 1, 30);
    const allowedTypes = new Set(["Vip", "Maintenance", "Owner", "Compliance", "Commercial", "Other"]);
    if (!allowedTypes.has(holdType)) throw ApiError.badRequest("hold_type is invalid");
    const reason = requiredText(body.reason, "reason", 4, 250);
    const id = crypto.randomUUID();
    const row = await context.get("operationalDatabase").prepare(
      `INSERT INTO room_holds (id, room_id, start_date, end_date, hold_type, reason, created_by_user_id, created_at)
       SELECT ?1, r.id, ?2, ?3, ?4, ?5, ?6, ?7 FROM rooms AS r
       WHERE r.id = ?8 AND NOT EXISTS (
         SELECT 1 FROM room_holds AS h
         WHERE h.room_id = ?8 AND h.start_date < ?3 AND h.end_date > ?2
       )
       RETURNING id, room_id, start_date, end_date, hold_type, reason, created_by_user_id, created_at`,
    ).bind(id, range.start, range.end, holdType, reason, context.get("identity").subject, new Date().toISOString(), roomId).first<HoldRow>();
    if (!row) {
      const room = await context.get("operationalDatabase").prepare("SELECT id FROM rooms WHERE id = ?1").bind(roomId).first<{ id: string }>();
      if (!room) throw ApiError.notFound("Room not found");
      throw ApiError.conflict("Room hold overlaps an existing hold");
    }
    return context.json(holdView(row, context.get("membership").hotelId), 201);
  });

  app.patch("/rooms/:id/holds/:hold_id", async (context) => {
    requireCapability(context, "rooms.write");
    const roomId = context.req.param("id");
    const holdId = context.req.param("hold_id");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const range = dateRange(body.start_date, body.end_date);
    const holdType = requiredText(body.hold_type, "hold_type", 1, 30);
    const allowedTypes = new Set(["Vip", "Maintenance", "Owner", "Compliance", "Commercial", "Other"]);
    if (!allowedTypes.has(holdType)) throw ApiError.badRequest("hold_type is invalid");
    const reason = requiredText(body.reason, "reason", 4, 250);
    const existing = await context.get("operationalDatabase").prepare(
      "SELECT id FROM room_holds WHERE id = ?1 AND room_id = ?2",
    ).bind(holdId, roomId).first<{ id: string }>();
    if (!existing) throw ApiError.notFound("Hold not found");
    const row = await context.get("operationalDatabase").prepare(
      `UPDATE room_holds SET start_date = ?3, end_date = ?4, hold_type = ?5, reason = ?6
       WHERE id = ?1 AND room_id = ?2 AND NOT EXISTS (
         SELECT 1 FROM room_holds AS h
         WHERE h.room_id = ?2 AND h.id <> ?1 AND h.start_date < ?4 AND h.end_date > ?3
       )
       RETURNING id, room_id, start_date, end_date, hold_type, reason, created_by_user_id, created_at`,
    ).bind(holdId, roomId, range.start, range.end, holdType, reason).first<HoldRow>();
    if (!row) throw ApiError.conflict("Hold overlaps an existing hold");
    return context.json(holdView(row, context.get("membership").hotelId));
  });

  app.delete("/rooms/:id/holds/:hold_id", async (context) => {
    requireCapability(context, "rooms.write");
    const result = await context.get("operationalDatabase").prepare(
      "DELETE FROM room_holds WHERE id = ?1 AND room_id = ?2",
    ).bind(context.req.param("hold_id"), context.req.param("id")).run();
    if (result.meta.changes !== 1) throw ApiError.notFound("Hold not found");
    return context.json({ status: "ok" });
  });

  app.get("/guests", async (context) => {
    requireCapability(context, "guests.read");
    const rows = await context.get("operationalDatabase").prepare(
      "SELECT id, full_name, email, phone, created_at FROM guests ORDER BY full_name",
    ).all<GuestRow>();
    return context.json(rows.results.map((row) => ({ ...row, hotel_id: context.get("membership").hotelId })));
  });

  app.post("/guests", async (context) => {
    requireCapability(context, "guests.write");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const fullName = requiredText(body.full_name, "full_name", 2, 120);
    const guestEmail = email(body.email);
    const phone = body.phone == null ? null : requiredText(body.phone, "phone", 3, 50);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    try {
      await context.get("operationalDatabase").prepare(
        "INSERT INTO guests (id, full_name, email, phone, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
      ).bind(id, fullName, guestEmail, phone, createdAt).run();
    } catch {
      throw ApiError.conflict("Guest email already exists");
    }
    return context.json({
      id,
      hotel_id: context.get("membership").hotelId,
      full_name: fullName,
      email: guestEmail,
      phone,
      created_at: createdAt,
    });
  });

  return app;
}
