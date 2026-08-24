import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { jsonBody, requiredText } from "../validation";

type HousekeepingApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = ApiVariables["operationalDatabase"];
type RoomRow = { id: string; room_number: string; room_type: string; status: string; price_cents: number };
type CaseRow = { id: string; room_id: string; status: string; priority: string; reason: string; assigned_to: string; reported_by_user_id: string | null; reported_at: string; resolution_note?: string | null; resolved_by_user_id?: string | null; resolved_at?: string | null; return_status?: string | null };
type DepartureRow = { booking_id: string; room_id: string; guest_name: string; booking_status: string; check_out: string };

const ROLE_CAPABILITIES: Record<string, ReadonlySet<string>> = {
  admin: new Set(["housekeeping.read", "housekeeping.write"]),
  ops: new Set(["housekeeping.read", "housekeeping.write"]),
  receptionist: new Set(),
  housekeeping: new Set(["housekeeping.read", "housekeeping.write"]),
};

function requireCapability(context: Context<{ Bindings: Env; Variables: ApiVariables }>, capability: string): void {
  if (!ROLE_CAPABILITIES[context.get("membership").role]?.has(capability)) throw ApiError.forbidden();
}

function roomStatus(status: string): string {
  return ({ AVAILABLE: "Available", OCCUPIED: "Occupied", DIRTY: "Dirty", CLEANING: "Cleaning", MAINTENANCE: "Maintenance", OUT_OF_ORDER: "OutOfOrder" } as Record<string, string>)[status] ?? status;
}

function caseView(row: CaseRow, hotelId: string) {
  return { id: row.id, hotel_id: hotelId, room_id: row.room_id, status: row.status === "OPEN" ? "Open" : "Resolved", priority: row.priority[0] + row.priority.slice(1).toLowerCase(), reason: row.reason, assigned_to: row.assigned_to, reported_by_user_id: row.reported_by_user_id, reported_at: row.reported_at, resolution_note: row.resolution_note ?? undefined, resolved_by_user_id: row.resolved_by_user_id ?? undefined, resolved_at: row.resolved_at ?? undefined, return_status: row.return_status ? roomStatus(row.return_status) : undefined };
}

function roomView(row: RoomRow, hotelId: string, maintenanceCase?: CaseRow, departure?: DepartureRow) {
  return { room_id: row.id, hotel_id: hotelId, room_number: row.room_number, room_type: row.room_type, room_status: roomStatus(row.status), turnover_today: Boolean(departure), departure_guest_name: departure?.guest_name, departure_booking_status: departure?.booking_status, departure: departure ? { booking_id: departure.booking_id, room_id: departure.room_id, room_number: row.room_number, room_type: row.room_type, room_status: roomStatus(row.status), guest_name: departure.guest_name, booking_status: departure.booking_status } : undefined, maintenance_case: maintenanceCase ? caseView(maintenanceCase, hotelId) : undefined };
}

async function findRoom(db: Db, id: string): Promise<RoomRow | null> { return db.prepare("SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE id = ?1").bind(id).first<RoomRow>(); }
async function findOpenCase(db: Db, roomId: string): Promise<CaseRow | null> { return db.prepare("SELECT id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at, resolution_note, resolved_by_user_id, resolved_at, return_status FROM maintenance_cases WHERE room_id = ?1 AND status = 'OPEN'").bind(roomId).first<CaseRow>(); }
function audit(db: Db, eventId: string, roomId: string, caseId: string | null, eventType: string, fromStatus: string, toStatus: string, context: Context<{ Bindings: Env; Variables: ApiVariables }>, details: Record<string, unknown>) {
  return db.prepare(`INSERT INTO housekeeping_events (id, room_id, maintenance_case_id, event_type, from_status, to_status, actor_subject, request_id, hotel_id, details_json, created_at) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11 WHERE changes() = 1`).bind(eventId, roomId, caseId, eventType, fromStatus, toStatus, context.get("identity").subject, context.get("requestId"), context.get("membership").hotelId, JSON.stringify(details), new Date().toISOString());
}

async function eventWasRecorded(db: Db, eventId: string): Promise<boolean> {
  return Boolean(await db.prepare("SELECT id FROM housekeeping_events WHERE id = ?1").bind(eventId).first<{ id: string }>());
}

export function createHousekeepingRoutes(): HousekeepingApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();
  app.get("/housekeeping/dirty", async (context) => {
    requireCapability(context, "housekeeping.read");
    const rows = await context.get("operationalDatabase").prepare("SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE status IN ('DIRTY', 'CLEANING') ORDER BY room_number").all<RoomRow>();
    return context.json(rows.results.map(row => ({ id: row.id, hotel_id: context.get("membership").hotelId, room_number: row.room_number, room_type: row.room_type, status: roomStatus(row.status), price_cents: row.price_cents })));
  });
  app.get("/housekeeping/board", async (context) => {
    requireCapability(context, "housekeeping.read");
    const date = context.req.query("date") ?? new Date().toISOString().slice(0, 10); const db = context.get("operationalDatabase");
    const rooms = await db.prepare("SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE status IN ('DIRTY', 'CLEANING', 'AVAILABLE', 'MAINTENANCE') ORDER BY room_number").all<RoomRow>();
    const departures = await db.prepare("SELECT b.id AS booking_id, b.room_id, g.full_name AS guest_name, b.status AS booking_status, b.check_out FROM bookings b JOIN guests g ON g.id = b.guest_id WHERE b.check_out = ?1 AND b.status NOT IN ('CANCELLED')").bind(date).all<DepartureRow>();
    const cases = await db.prepare("SELECT id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at, resolution_note, resolved_by_user_id, resolved_at, return_status FROM maintenance_cases WHERE status = 'OPEN'").all<CaseRow>();
    const departureByRoom = new Map(departures.results.map(item => [item.room_id, item])); const caseByRoom = new Map(cases.results.map(item => [item.room_id, item]));
    return context.json({ date, rooms: rooms.results.map(row => roomView(row, context.get("membership").hotelId, caseByRoom.get(row.id), departureByRoom.get(row.id))), departures_today: departures.results });
  });
  app.post("/housekeeping/:id/start", async (context) => transition(context, "DIRTY", "CLEANING", "CLEANING_START"));
  app.post("/housekeeping/:id/finish", async (context) => transition(context, "CLEANING", "AVAILABLE", "CLEANING_FINISH"));
  app.post("/housekeeping/:id/maintenance", async (context) => {
    requireCapability(context, "housekeeping.write"); const db = context.get("operationalDatabase"); const roomId = context.req.param("id"); const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const priority = requiredText(body.priority, "priority", 3, 10).toUpperCase(); if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) throw ApiError.badRequest("priority is invalid");
    const reason = requiredText(body.reason, "reason", 6, 250); const assignedTo = requiredText(body.assigned_to, "assigned_to", 2, 100); const caseId = crypto.randomUUID(); const now = new Date().toISOString();
    const room = await findRoom(db, roomId); if (!room) throw ApiError.notFound("Room not found"); if (!["AVAILABLE", "DIRTY", "CLEANING"].includes(room.status)) throw ApiError.conflict("Room cannot enter maintenance from its current state");
    const eventId = crypto.randomUUID();
    try { await db.batch([
      db.prepare("UPDATE rooms SET status = 'MAINTENANCE' WHERE id = ?1 AND status IN ('AVAILABLE', 'DIRTY', 'CLEANING')").bind(roomId),
      db.prepare("INSERT INTO maintenance_cases (id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at) SELECT ?1, ?2, 'OPEN', ?3, ?4, ?5, ?6, ?7 WHERE changes() = 1 AND EXISTS (SELECT 1 FROM rooms WHERE id = ?2 AND status = 'MAINTENANCE') AND NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE room_id = ?2 AND status = 'OPEN')").bind(caseId, roomId, priority, reason, assignedTo, context.get("identity").subject, now),
      audit(db, eventId, roomId, caseId, "MAINTENANCE_OPEN", room.status, "MAINTENANCE", context, { priority, reason, assigned_to: assignedTo }),
    ]); } catch { throw ApiError.conflict("Maintenance case could not be opened without changing the room"); }
    if (!(await eventWasRecorded(db, eventId))) throw ApiError.conflict("Maintenance case was not opened because the room changed concurrently");
    const opened = await db.prepare("SELECT id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at FROM maintenance_cases WHERE id = ?1").bind(caseId).first<CaseRow>(); if (!opened) throw ApiError.conflict("Maintenance case was not created"); return context.json(caseView(opened, context.get("membership").hotelId), 201);
  });
  app.post("/housekeeping/:id/dirty", async (context) => {
    requireCapability(context, "housekeeping.write"); const db = context.get("operationalDatabase"); const roomId = context.req.param("id"); const body = await jsonBody<Record<string, unknown>>(context.req.raw); const note = requiredText(body.resolution_note, "resolution_note", 6, 250); const room = await findRoom(db, roomId); if (!room) throw ApiError.notFound("Room not found"); if (room.status !== "MAINTENANCE") throw ApiError.conflict("Only maintenance rooms can return to dirty");
    const requestedCaseId = typeof body.case_id === "string" && body.case_id.trim() ? body.case_id.trim() : undefined;
    const open = requestedCaseId ? await db.prepare("SELECT id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at, resolution_note, resolved_by_user_id, resolved_at, return_status FROM maintenance_cases WHERE id = ?1 AND room_id = ?2 AND status = 'OPEN'").bind(requestedCaseId, roomId).first<CaseRow>() : await findOpenCase(db, roomId);
    const caseId = open?.id ?? (requestedCaseId ?? crypto.randomUUID()); const now = new Date().toISOString();
    const eventId = crypto.randomUUID();
    try { await db.batch([
      ...(open ? [] : [db.prepare("INSERT INTO maintenance_cases (id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at) SELECT ?1, ?2, 'OPEN', 'MEDIUM', 'Legacy maintenance room without an opening case', 'ops', ?3, ?4 WHERE EXISTS (SELECT 1 FROM rooms WHERE id = ?2 AND status = 'MAINTENANCE') AND NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE room_id = ?2 AND status = 'OPEN')").bind(caseId, roomId, context.get("identity").subject, now)]),
      db.prepare("UPDATE maintenance_cases SET status = 'RESOLVED', resolution_note = ?2, resolved_by_user_id = ?3, resolved_at = ?4, return_status = 'DIRTY' WHERE id = ?1 AND room_id = ?5 AND status = 'OPEN'").bind(caseId, note, context.get("identity").subject, now, roomId),
      db.prepare("UPDATE rooms SET status = 'DIRTY' WHERE id = ?1 AND status = 'MAINTENANCE' AND changes() = 1 AND NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE room_id = ?1 AND status = 'OPEN')").bind(roomId),
      audit(db, eventId, roomId, caseId, "MAINTENANCE_RESOLVE", "MAINTENANCE", "DIRTY", context, { resolution_note: note, legacy_recovery: !open }),
    ]); } catch { throw ApiError.conflict("Maintenance case could not be resolved without changing the room"); }
    if (!(await eventWasRecorded(db, eventId))) throw ApiError.conflict("Maintenance case was not resolved because the room changed concurrently");
    const resolved = await db.prepare("SELECT id, room_id, status, priority, reason, assigned_to, reported_by_user_id, reported_at, resolution_note, resolved_by_user_id, resolved_at, return_status FROM maintenance_cases WHERE id = ?1").bind(caseId).first<CaseRow>(); if (!resolved) throw ApiError.conflict("Maintenance case was not resolved"); return context.json(caseView(resolved, context.get("membership").hotelId));
  });
  return app;
}

async function transition(context: Context<{ Bindings: Env; Variables: ApiVariables }>, from: string, to: string, eventType: string) {
  requireCapability(context, "housekeeping.write"); const db = context.get("operationalDatabase"); const roomId = context.req.param("id"); if (!roomId) throw ApiError.notFound("Room not found"); const room = await findRoom(db, roomId); if (!room) throw ApiError.notFound("Room not found"); if (room.status !== from) throw ApiError.conflict(`Room must be ${from.toLowerCase()} before this transition`);
  const eventId = crypto.randomUUID();
  try { await db.batch([db.prepare("UPDATE rooms SET status = ?2 WHERE id = ?1 AND status = ?3").bind(roomId, to, from), audit(db, eventId, roomId, null, eventType, from, to, context, {})]); } catch { throw ApiError.conflict("Room transition failed without changing the room"); }
  if (!(await eventWasRecorded(db, eventId))) throw ApiError.conflict("Room transition was rejected because the room changed concurrently");
  return context.json({ room_id: roomId, status: roomStatus(to) });
}
