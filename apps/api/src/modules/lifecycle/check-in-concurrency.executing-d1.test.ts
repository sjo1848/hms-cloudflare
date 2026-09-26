import { afterEach, describe, expect, it } from "vitest";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1LifecycleRepository } from "./d1-lifecycle-repository";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map(mf => mf.dispose())));

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
      db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, status TEXT NOT NULL)"),
      db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, check_in_guests_count INTEGER, checked_in_at TEXT, checked_in_by TEXT, updated_at TEXT)"),
      db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, event_type TEXT NOT NULL, from_room_id TEXT, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
      // The deployed 0006 lifecycle guard is part of the operation's atomic contract.
      db.prepare("CREATE UNIQUE INDEX idx_lifecycle_events_checkin_once ON lifecycle_events(booking_id, event_type) WHERE event_type IN ('CHECK_IN', 'CHECK_OUT')"),
      db.prepare("INSERT INTO rooms VALUES ('room-1', 'AVAILABLE')"),
      db.prepare("INSERT INTO bookings (id, room_id, status) VALUES ('booking-1', 'room-1', 'CONFIRMED')"),
    ]);
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
    expect(JSON.parse(String(events.results[0].details_json))).toMatchObject({ check_in_guests_count: winner.guests });
  });
});
