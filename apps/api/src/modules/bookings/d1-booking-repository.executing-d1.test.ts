import { afterEach, describe, expect, it } from "vitest";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1BookingRepository } from "./d1-booking-repository";
import type { BookingMutationProvenance } from "./domain";
import type { OperationalDatabase } from "../../routing";

const bookingId = "aaaaaaaa-aaaa-5aaa-8aaa-aaaaaaaaaaaa";
const roomId = "room-agent-race";
const now = "2026-08-30T03:30:00.000Z";
const provenance: BookingMutationProvenance = {
  tenantId: "hotel-demo",
  hotelId: "10000000-0000-0000-0000-000000000001",
  actorId: "visitor-demo",
  sessionId: "session-race-proof",
  traceId: "trace-race-proof",
};

const activeMiniflares: Miniflare[] = [];
afterEach(async () => { await Promise.all(activeMiniflares.splice(0).map((mf) => mf.dispose())); });

async function executingDatabase() {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: { DB: "agent-race-proof-db" },
  }));
  activeMiniflares.push(mf);
  const db = await mf.getD1Database("DB");
  // Execute DDL as complete prepared statements. D1's exec() line-oriented
  // parser is intentionally not part of the behavior under test here.
  await db.batch([
    db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE room_inventory_nights (room_id TEXT NOT NULL, stay_date TEXT NOT NULL, booking_id TEXT NOT NULL, PRIMARY KEY (room_id, stay_date))"),
    db.prepare("CREATE TABLE agent_mutation_events (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, action TEXT NOT NULL, tenant_id TEXT NOT NULL, hotel_id TEXT NOT NULL, actor_id TEXT NOT NULL, session_id TEXT NOT NULL, trace_id TEXT NOT NULL, created_at TEXT NOT NULL)"),
  ]);
  return db;
}

async function seedConfirmedBooking(db: D1Database) {
  await db.prepare("INSERT INTO bookings (id, room_id, status, updated_at) VALUES (?1, ?2, 'CONFIRMED', ?3)").bind(bookingId, roomId, "2026-08-30T03:00:00.000Z").run();
  await db.batch([
    db.prepare("INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) VALUES (?1, ?2, ?3)").bind(roomId, "2027-02-10", bookingId),
    db.prepare("INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) VALUES (?1, ?2, ?3)").bind(roomId, "2027-02-11", bookingId),
  ]);
}

async function durableState(db: D1Database) {
  const booking = await db.prepare("SELECT status, updated_at FROM bookings WHERE id = ?1").bind(bookingId).first<{ status: string; updated_at: string }>();
  const inventory = await db.prepare("SELECT COUNT(*) AS count FROM room_inventory_nights WHERE booking_id = ?1").bind(bookingId).first<{ count: number }>();
  const events = await db.prepare(`SELECT id, booking_id, action, tenant_id, hotel_id, actor_id, session_id, trace_id, created_at
    FROM agent_mutation_events WHERE booking_id = ?1 ORDER BY created_at`).bind(bookingId).all<{
      id: string; booking_id: string; action: string; tenant_id: string; hotel_id: string;
      actor_id: string; session_id: string; trace_id: string; created_at: string;
    }>();
  return { booking, inventory: Number(inventory?.count ?? -1), events: events.results };
}

describe("D1BookingRepository cancellation attribution on executing D1", () => {
  it("persists exactly one ACP CANCEL event when ACP wins the CONFIRMED transition", async () => {
    const db = await executingDatabase(); await seedConfirmedBooking(db);
    const repository = new D1BookingRepository(db as unknown as OperationalDatabase);
    const result = await repository.cancel(bookingId, now, provenance);
    expect(result.meta.changes).toBe(1);
    const state = await durableState(db);
    expect(state.booking).toEqual({ status: "CANCELLED", updated_at: now });
    expect(state.inventory).toBe(0);
    expect(state.events).toEqual([{
      id: `${bookingId}:CANCEL`, booking_id: bookingId, action: "CANCEL",
      tenant_id: provenance.tenantId, hotel_id: provenance.hotelId, actor_id: provenance.actorId,
      session_id: provenance.sessionId, trace_id: provenance.traceId, created_at: now,
    }]);
  });

  it("persists zero ACP CANCEL events when an ordinary cancellation wins before the ACP D1 batch", async () => {
    const db = await executingDatabase(); await seedConfirmedBooking(db);
    const ordinaryWinnerAt = "2026-08-30T03:29:59.000Z";
    const ordinaryWinner = await db.prepare("UPDATE bookings SET status = 'CANCELLED', updated_at = ?2 WHERE id = ?1 AND status = 'CONFIRMED'").bind(bookingId, ordinaryWinnerAt).run();
    expect(ordinaryWinner.meta.changes).toBe(1);
    await db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CANCELLED')").bind(bookingId).run();

    const repository = new D1BookingRepository(db as unknown as OperationalDatabase);
    const losingAcp = await repository.cancel(bookingId, now, provenance);
    expect(losingAcp.meta.changes).toBe(0);
    const state = await durableState(db);
    expect(state.booking).toEqual({ status: "CANCELLED", updated_at: ordinaryWinnerAt });
    expect(state.inventory).toBe(0);
    expect(state.events).toEqual([]);
  });
});
