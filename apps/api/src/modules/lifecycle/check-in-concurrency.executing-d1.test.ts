import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1LifecycleRepository } from "./d1-lifecycle-repository";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map(mf => mf.dispose())));

async function applyMigration(db: D1Database, migrationPath: string) {
  const sql = readFileSync(new URL(migrationPath, import.meta.url), "utf8");
  const statements: string[] = [];
  let buffer = "";
  let inTrigger = false;
  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    const startsTrigger = !inTrigger && /^CREATE TRIGGER\b/i.test(line);
    if (startsTrigger) inTrigger = true;
    buffer += `${rawLine}\n`;
    if ((inTrigger && (/^END;$/i.test(line) || (startsTrigger && /\bEND;\s*$/i.test(line)))) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim());
      buffer = "";
      inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration: ${migrationPath}`);
  for (const [index, statement] of statements.entries()) {
    try { await db.prepare(statement).run(); }
    catch (error) { throw new Error(`Migration ${migrationPath}, statement ${index + 1}: ${statement.slice(0, 240)}`, { cause: error }); }
  }
}

describe("check-in exact-winner guard on executing D1", () => {
  it("rejects a stale concurrent attempt without a second event or partial state", async () => {
    const mf = new Miniflare(convertV4MiniflareOptions({
      script: "export default { fetch() { return new Response('ok') } }",
      modules: true,
      d1Databases: { DB: "check-in-race" },
    }));
    miniflares.push(mf);
    const db = await mf.getD1Database("DB");
    await db.batch([
      db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, room_type TEXT NOT NULL, status TEXT NOT NULL, price_cents INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, guest_id TEXT NOT NULL, room_id TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL, status TEXT NOT NULL, total_cents INTEGER NOT NULL DEFAULT 0, notes TEXT, checked_in_at TEXT, checked_in_by TEXT, checked_out_at TEXT, checked_out_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, check_in_guests_count INTEGER, check_out_payment_policy TEXT, check_out_reference TEXT)"),
      db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, event_type TEXT NOT NULL, from_room_id TEXT, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE room_inventory_nights (room_id TEXT NOT NULL, stay_date TEXT NOT NULL, booking_id TEXT NOT NULL, PRIMARY KEY(room_id,stay_date))"),
      db.prepare("CREATE TABLE room_holds (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL)"),
      db.prepare("CREATE TABLE extra_charges (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, description TEXT, amount_cents INTEGER NOT NULL, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE invoices (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, amount_cents INTEGER NOT NULL, paid_amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'PENDING', created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE financial_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, booking_id TEXT, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
      // The deployed 0006 lifecycle guard is part of the operation's atomic contract.
      db.prepare("CREATE UNIQUE INDEX idx_lifecycle_events_checkin_once ON lifecycle_events(booking_id, event_type) WHERE event_type IN ('CHECK_IN', 'CHECK_OUT')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('room-1','101','Standard','AVAILABLE',10000)"),
      db.prepare("INSERT INTO guests VALUES ('guest-1','Synthetic Guest','guest@example.test',NULL,'2026-09-26T12:00:00.000Z')"),
      db.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,created_at,updated_at) VALUES ('booking-1','guest-1','room-1','2026-09-26','2026-09-27','CONFIRMED','2026-09-26T12:00:00.000Z','2026-09-26T12:00:00.000Z')"),
    ]);
    await applyMigration(db, "../../../schema/hotel-migrations/0007_lifecycle_atomic_guards.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0009_housekeeping_maintenance.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0013_noshow_reporting_parity.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0020_maintenance_impact.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0021_reassignment_remaining_nights.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0022_room_state_dimensions.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0023_room_state_command_guards.sql");
    await db.prepare("UPDATE rooms SET housekeeping_state='READY',service_state='IN_SERVICE' WHERE id='room-1'").run();
    const repository = new D1LifecycleRepository(db);
    const stale = { id: "booking-1", room_id: "room-1", status: "CONFIRMED", check_in: "2026-09-26", check_out: "2026-09-27" } as const;
    const attempts = await Promise.allSettled([
      repository.checkIn(stale, 1, { subject: "actor-one", requestId: "request-one", hotelId: "hotel-a" }),
      repository.checkIn(stale, 2, { subject: "actor-two", requestId: "request-two", hotelId: "hotel-a" }),
    ]);
    const winners = attempts.map((attempt, index) => attempt.status === "fulfilled" && attempt.value.ok ? index : -1).filter(index => index >= 0);
    expect(winners).toHaveLength(1);
    const winner = winners[0] === 0
      ? { subject: "actor-one", requestId: "request-one", guests: 1 }
      : { subject: "actor-two", requestId: "request-two", guests: 2 };
    const booking = await db.prepare("SELECT status, check_in_guests_count, checked_in_by FROM bookings WHERE id='booking-1'").first();
    const room = await db.prepare("SELECT status FROM rooms WHERE id='room-1'").first();
    const events = await db.prepare("SELECT actor_subject, request_id, hotel_id, details_json FROM lifecycle_events WHERE booking_id='booking-1'").all();
    expect(booking).toMatchObject({ status: "CHECKED_IN", check_in_guests_count: winner.guests, checked_in_by: winner.subject });
    expect(room).toMatchObject({ status: "OCCUPIED" });
    expect(events.results).toHaveLength(1);
    expect(events.results[0]).toMatchObject({ actor_subject: winner.subject, request_id: winner.requestId, hotel_id: "hotel-a" });
    expect(JSON.parse(String(events.results[0].details_json))).toMatchObject({
      check_in_guests_count: winner.guests,
      occupancy_before: "VACANT", occupancy_after: "OCCUPIED",
      housekeeping_state_before: "READY", housekeeping_state_after: "READY",
      maintenance_impact_before: "NONE", maintenance_impact_after: "NONE",
      service_state_before: "IN_SERVICE", service_state_after: "IN_SERVICE",
      room_state_version_before: 0, room_state_version_after: 1,
    });

    await db.batch([
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state,room_state_version) VALUES ('room-2','102','Standard','AVAILABLE',10000,'READY','IN_SERVICE',0)"),
      db.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES ('booking-2','guest-1','room-2','2026-09-26','2026-09-28','CONFIRMED',0,'2026-09-26T12:00:00.000Z','2026-09-26T12:00:00.000Z')"),
      db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('advisory-room-2','room-2','OPEN','NON_BLOCKING','LOW','Advisory issue','ops','2026-09-26T12:00:00.000Z')"),
    ]);
    const advisoryCheckin = await repository.checkIn({ ...stale, id: "booking-2", room_id: "room-2", check_out: "2026-09-28" }, 1, { subject: "actor-advisory", requestId: "request-advisory", hotelId: "hotel-a" });
    expect(advisoryCheckin.ok).toBe(true);
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-2'").first()).toEqual({ status: "OCCUPIED", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 1 });
    expect(await db.prepare("SELECT status,impact FROM maintenance_cases WHERE id='advisory-room-2'").first()).toEqual({ status: "OPEN", impact: "NON_BLOCKING" });
    const advisoryEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='booking-2' AND event_type='CHECK_IN'").first<{ details_json: string }>();
    expect(JSON.parse(advisoryEvent!.details_json)).toMatchObject({ maintenance_impact_before: "NON_BLOCKING", maintenance_impact_after: "NON_BLOCKING", housekeeping_state_before: "READY", housekeeping_state_after: "READY" });

    await db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('block-room-1','room-1','OPEN','BLOCKING','HIGH','Synthetic blocker','ops','2026-09-26T12:00:00.000Z')").run();
    const checkedIn = { ...stale, status: "CHECKED_IN" };
    const checkoutActor = winner.subject === "actor-one"
      ? { subject: "actor-one", requestId: "checkout-one", hotelId: "hotel-a" }
      : { subject: "actor-two", requestId: "checkout-two", hotelId: "hotel-a" };
    const checkedOut = await repository.checkout(checkedIn, "pending-approved", "ref-123456", checkoutActor);
    expect(checkedOut.ok).toBe(true);
    const finalBooking = await db.prepare("SELECT status FROM bookings WHERE id='booking-1'").first();
    const finalRoom = await db.prepare("SELECT status, housekeeping_state, service_state, room_state_version FROM rooms WHERE id='room-1'").first();
    const blockingCase = await db.prepare("SELECT status, impact FROM maintenance_cases WHERE id='block-room-1'").first();
    const checkoutEvent = await db.prepare("SELECT event_type, actor_subject, request_id, hotel_id, details_json FROM lifecycle_events WHERE event_type='CHECK_OUT'").first<any>();
    expect(finalBooking).toEqual({ status: "CHECKED_OUT" });
    expect(finalRoom).toEqual({ status: "MAINTENANCE", housekeeping_state: "DIRTY", service_state: "IN_SERVICE", room_state_version: 2 });
    expect(blockingCase).toEqual({ status: "OPEN", impact: "BLOCKING" });
    expect(checkoutEvent).toMatchObject({ event_type: "CHECK_OUT", actor_subject: checkoutActor.subject, request_id: checkoutActor.requestId, hotel_id: "hotel-a" });
    expect(JSON.parse(String(checkoutEvent.details_json))).toMatchObject({ service_state_before: "IN_SERVICE", service_state_after: "IN_SERVICE", maintenance_open_case_count_before: 1, maintenance_open_case_count_after: 1, room_state_version_before: 1, room_state_version_after: 2 });
  });
});
