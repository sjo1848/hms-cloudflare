import { afterEach, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1LifecycleRepository } from "./d1-lifecycle-repository";
import { claimDates, type LifecycleBooking } from "./domain";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map(mf => mf.dispose())));

async function applyMigration(db: D1Database, path: string) {
  const sql = readFileSync(path, "utf8");
  const statements: string[] = [];
  let buffer = "";
  let inTrigger = false;
  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    const startsTrigger = !inTrigger && /^CREATE TRIGGER\b/i.test(line);
    if (startsTrigger) inTrigger = true;
    buffer += `${rawLine}\n`;
    if ((inTrigger && (line === "END;" || (startsTrigger && /\bEND;\s*$/.test(line)))) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim());
      buffer = "";
      inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration: ${path}`);
  for (const [index, statement] of statements.entries()) {
    try { await db.prepare(statement).run(); }
    catch (error) { throw new Error(`Migration ${path}, statement ${index + 1}: ${statement.slice(0, 240)}`, { cause: error }); }
  }
}

async function database(name: string) {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: { DB: name },
  }));
  miniflares.push(mf);
  const db = await mf.getD1Database("DB");
  const migrationDirectory = new URL("../../../schema/hotel-migrations/", import.meta.url);
  const migrations = readdirSync(migrationDirectory).filter(file => file.endsWith(".sql")).sort();
  for (const migration of migrations) await applyMigration(db, join(migrationDirectory.pathname, migration));
  return db;
}

const actor = { subject: "synthetic-operator", requestId: "synthetic-reassign", hotelId: "hotel-a" };

async function seedBooking(db: D1Database, id: string, roomId: string, checkIn: string, checkOut: string, rooms: string[]) {
  await db.prepare("INSERT INTO guests (id,full_name,email,phone,created_at) VALUES (?1,?2,?3,NULL,?4)")
    .bind(`guest-${id}`, `Guest ${id}`, `${id}@example.test`, "2026-09-27T12:00:00.000Z").run();
  for (const [index, room] of rooms.entries()) {
    const occupied = room === roomId;
    await db.prepare(`INSERT OR IGNORE INTO rooms
      (id,room_number,room_type,status,price_cents,housekeeping_state,service_state,room_state_version)
      VALUES (?1,?2,'STANDARD',?3,10000,?4,'IN_SERVICE',0)`)
      .bind(room, room, occupied ? "OCCUPIED" : "AVAILABLE", "READY").run();
  }
  await db.prepare(`INSERT INTO bookings
    (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES (?1,?2,?3,?4,?5,'CHECKED_IN',70000,'2026-09-20T12:00:00.000Z','2026-09-20T12:00:00.000Z')`)
    .bind(id, `guest-${id}`, roomId, checkIn, checkOut).run();
  await db.batch(claimDates(checkIn, checkOut).map(date =>
    db.prepare("INSERT INTO room_inventory_nights(room_id,stay_date,booking_id) VALUES (?1,?2,?3)").bind(roomId, date, id)));
}

async function booking(db: D1Database, id: string): Promise<LifecycleBooking> {
  return (await db.prepare("SELECT id,room_id,check_in,check_out,status FROM bookings WHERE id=?1").bind(id).first<LifecycleBooking>())!;
}

async function snapshot(db: D1Database, bookingId: string, roomIds: string[]) {
  const rows = await Promise.all([
    db.prepare("SELECT id,room_id,check_in,check_out,status,total_cents,updated_at FROM bookings WHERE id=?1").bind(bookingId).first(),
    ...roomIds.map(id => db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id=?1").bind(id).first()),
    db.prepare("SELECT room_id,stay_date FROM room_inventory_nights WHERE booking_id=?1 ORDER BY stay_date,room_id").bind(bookingId).all(),
    db.prepare("SELECT id,event_type,from_room_id,actor_subject,request_id,hotel_id,details_json FROM lifecycle_events WHERE booking_id=?1 ORDER BY rowid").bind(bookingId).all(),
    db.prepare("SELECT id,event_type,details_json FROM financial_events WHERE booking_id=?1 ORDER BY rowid").bind(bookingId).all(),
    db.prepare("SELECT id,amount_cents,paid_amount_cents,status FROM invoices WHERE booking_id=?1").bind(bookingId).all(),
    db.prepare("SELECT id,amount_cents,payment_method,payment_reference FROM payment_entries WHERE booking_id=?1 ORDER BY id").bind(bookingId).all(),
    db.prepare("SELECT id,amount_cents FROM extra_charges WHERE booking_id=?1 ORDER BY id").bind(bookingId).all(),
  ]);
  return rows.map(row => "results" in (row as object) ? (row as { results: unknown[] }).results : row);
}

describe("F0.4 reassignment interval on executing D1", () => {
  it("preserves elapsed claims and billing through repeated reassignment, with versioned room dimensions and truthful history", async () => {
    const db = await database(`reassign-repeat-${crypto.randomUUID()}`);
    await seedBooking(db, "stay-1", "room-a", "2026-09-20", "2026-09-27", ["room-a", "room-b", "room-c"]);
    await db.prepare(`INSERT INTO maintenance_cases
      (id,room_id,status,impact,priority,reason,assigned_to,reported_by_user_id,reported_at)
      VALUES ('advisory-b','room-b','OPEN','NON_BLOCKING','LOW','Lamp advisory','ops','operator','2026-09-26T10:00:00Z')`).run();

    const first = await new D1LifecycleRepository(db).reassign(await booking(db, "stay-1"), "room-b", "Guest requested move", "2026-09-24", actor);
    expect(first).toMatchObject({ ok: true, reassignment: {
      oldRoomId: "room-a", newRoomId: "room-b", hotelLocalDate: "2026-09-24", effectiveDate: "2026-09-24",
      remainingInterval: { startDate: "2026-09-24", endDateExclusive: "2026-09-27" }, totalCents: 70000,
    } });
    expect(await db.prepare("SELECT room_id,stay_date FROM room_inventory_nights WHERE booking_id='stay-1' ORDER BY stay_date,room_id").all()).toMatchObject({ results: [
      { room_id: "room-a", stay_date: "2026-09-20" }, { room_id: "room-a", stay_date: "2026-09-21" },
      { room_id: "room-a", stay_date: "2026-09-22" }, { room_id: "room-a", stay_date: "2026-09-23" },
      { room_id: "room-b", stay_date: "2026-09-24" }, { room_id: "room-b", stay_date: "2026-09-25" },
      { room_id: "room-b", stay_date: "2026-09-26" },
    ] });
    expect(await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id IN ('room-a','room-b') ORDER BY id").all()).toMatchObject({ results: [
      { id: "room-a", status: "DIRTY", housekeeping_state: "DIRTY", service_state: "IN_SERVICE", room_state_version: 1 },
      { id: "room-b", status: "OCCUPIED", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 1 },
    ] });
    const firstEvent = await db.prepare("SELECT actor_subject,request_id,hotel_id,details_json FROM lifecycle_events WHERE booking_id='stay-1' AND event_type='REASSIGN'").first<any>();
    expect(firstEvent).toMatchObject({ actor_subject: actor.subject, request_id: actor.requestId, hotel_id: actor.hotelId });
    expect(JSON.parse(firstEvent.details_json)).toMatchObject({
      from_room_id: "room-a", to_room_id: "room-b", hotel_local_date: "2026-09-24", effective_date: "2026-09-24",
      assignment_start_date: "2026-09-20", reason: "Guest requested move", old_total_cents: 70000, new_total_cents: 70000,
      old_room_version_before: 0, old_room_version_after: 1, new_room_version_before: 0, new_room_version_after: 1,
    });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM financial_events WHERE booking_id='stay-1'").first()).toEqual({ count: 0 });

    expect(await db.prepare(`SELECT b.room_id,b.check_in,
      (SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e WHERE e.booking_id=b.id AND e.event_type='REASSIGN'
        AND json_extract(e.details_json,'$.to_room_id')=b.room_id ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1) AS derived_start,
      (SELECT json_extract(e.details_json,'$.to_room_id') FROM lifecycle_events e WHERE e.booking_id=b.id AND e.event_type='REASSIGN'
        ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1) AS event_target
      FROM bookings b WHERE b.id='stay-1'`).first()).toEqual({ room_id: "room-b", check_in: "2026-09-20", derived_start: "2026-09-24", event_target: "room-b" });

    const second = await new D1LifecycleRepository(db).reassign(await booking(db, "stay-1"), "room-c", "Room issue reported", "2026-09-25", { ...actor, requestId: "synthetic-reassign-2" });
    expect(second).toMatchObject({ ok: true, reassignment: { oldRoomId: "room-b", newRoomId: "room-c", effectiveDate: "2026-09-25" } });
    expect(await db.prepare("SELECT room_id,stay_date FROM room_inventory_nights WHERE booking_id='stay-1' ORDER BY stay_date,room_id").all()).toMatchObject({ results: [
      { room_id: "room-a", stay_date: "2026-09-20" }, { room_id: "room-a", stay_date: "2026-09-21" },
      { room_id: "room-a", stay_date: "2026-09-22" }, { room_id: "room-a", stay_date: "2026-09-23" },
      { room_id: "room-b", stay_date: "2026-09-24" },
      { room_id: "room-c", stay_date: "2026-09-25" }, { room_id: "room-c", stay_date: "2026-09-26" },
    ] });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='stay-1' AND event_type='REASSIGN'").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='stay-1'").first()).toEqual({ total_cents: 70000 });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM financial_events WHERE booking_id='stay-1'").first()).toEqual({ count: 0 });
  }, 20_000);

  it("uses check-in as the effective date before/equal arrival and rejects checkout overrun without drift", async () => {
    const db = await database(`reassign-boundary-${crypto.randomUUID()}`);
    await seedBooking(db, "same-day", "room-a", "2026-10-01", "2026-10-03", ["room-a", "room-b", "room-c"]);
    const before = await new D1LifecycleRepository(db).reassign(await booking(db, "same-day"), "room-b", "Arrival day change", "2026-09-30", actor);
    expect(before).toMatchObject({ ok: true, reassignment: { effectiveDate: "2026-10-01", hotelLocalDate: "2026-09-30" } });
    const sameDay = await new D1LifecycleRepository(db).reassign(await booking(db, "same-day"), "room-c", "Same day second move", "2026-10-01", { ...actor, requestId: "same-day-2" });
    expect(sameDay).toMatchObject({ ok: true, reassignment: { effectiveDate: "2026-10-01" } });
    const beforeOverrun = await snapshot(db, "same-day", ["room-a", "room-b", "room-c"]);
    const overrun = await new D1LifecycleRepository(db).reassign(await booking(db, "same-day"), "room-b", "After checkout", "2026-10-03", actor);
    expect(overrun.ok).toBe(false);
    expect(await snapshot(db, "same-day", ["room-a", "room-b", "room-c"])).toEqual(beforeOverrun);
  }, 20_000);

  it("rejects BLOCKING/unresolved destinations and ledger mismatch with zero business drift", async () => {
    const db = await database(`reassign-reject-${crypto.randomUUID()}`);
    await seedBooking(db, "stay-2", "room-a", "2026-11-01", "2026-11-04", ["room-a", "room-b", "room-c"]);
    await db.prepare(`INSERT INTO maintenance_cases
      (id,room_id,status,impact,priority,reason,assigned_to,reported_by_user_id,reported_at)
      VALUES ('block-b','room-b','OPEN','BLOCKING','HIGH','Room is unsafe','ops','operator','2026-09-26T10:00:00Z')`).run();
    await db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state,room_state_version) VALUES ('room-d','104','STANDARD','AVAILABLE',10000,NULL,'IN_SERVICE',0)").run();
    const repo = new D1LifecycleRepository(db);
    const before = await snapshot(db, "stay-2", ["room-a", "room-b", "room-c", "room-d"]);
    expect((await repo.reassign(await booking(db, "stay-2"), "room-b", "Blocking room", "2026-11-02", actor)).ok).toBe(false);
    expect((await repo.reassign(await booking(db, "stay-2"), "room-d", "Unknown readiness", "2026-11-02", actor)).ok).toBe(false);
    expect(await snapshot(db, "stay-2", ["room-a", "room-b", "room-c", "room-d"])).toEqual(before);

    await db.prepare("INSERT INTO invoices (id,booking_id,amount_cents,paid_amount_cents,status,created_at) VALUES ('invoice-2','stay-2',70000,5000,'PENDING','2026-09-27T00:00:00Z')").run();
    await db.prepare("INSERT INTO payment_entries (id,invoice_id,booking_id,amount_cents,payment_method,received_by_user_id,received_at) VALUES ('entry-2','invoice-2','stay-2',4000,'CASH','operator','2026-09-27T00:00:00Z')").run();
    const beforeMismatch = await snapshot(db, "stay-2", ["room-a", "room-b", "room-c", "room-d"]);
    expect((await repo.reassign(await booking(db, "stay-2"), "room-c", "Ledger mismatch", "2026-11-02", actor)).ok).toBe(false);
    expect(await snapshot(db, "stay-2", ["room-a", "room-b", "room-c", "room-d"])).toEqual(beforeMismatch);
  }, 20_000);

  it("marks the vacated source DIRTY while preserving unresolved unrelated source dimensions", async () => {
    const db = await database(`reassign-unresolved-source-${crypto.randomUUID()}`);
    await seedBooking(db, "unresolved-source", "room-a", "2027-04-01", "2027-04-04", ["room-a", "room-b"]);
    await db.prepare("UPDATE rooms SET housekeeping_state=NULL,service_state=NULL WHERE id='room-a'").run();
    const result = await new D1LifecycleRepository(db).reassign(await booking(db, "unresolved-source"), "room-b", "Safe source handoff", "2027-04-02", actor);
    expect(result.ok).toBe(true);
    expect(await db.prepare("SELECT status,housekeeping_state,service_state FROM rooms WHERE id='room-a'").first())
      .toEqual({ status: "DIRTY", housekeeping_state: "DIRTY", service_state: null });
    const event = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='unresolved-source' AND event_type='REASSIGN'").first<{ details_json: string }>();
    expect(JSON.parse(event!.details_json)).toMatchObject({ old_housekeeping_state_before: null, old_housekeeping_state_after: "DIRTY", old_service_state_before: null, old_service_state_after: null });
  }, 20_000);

  it("rolls back every earlier write if the final reassignment event is rejected", async () => {
    const db = await database(`reassign-rollback-${crypto.randomUUID()}`);
    await seedBooking(db, "stay-3", "room-a", "2026-12-01", "2026-12-04", ["room-a", "room-b"]);
    const before = await snapshot(db, "stay-3", ["room-a", "room-b"]);
    await db.prepare(`CREATE TRIGGER reject_reassign BEFORE INSERT ON lifecycle_events
      WHEN NEW.event_type='REASSIGN' BEGIN SELECT RAISE(ABORT,'injected audit failure'); END`).run();
    expect((await new D1LifecycleRepository(db).reassign(await booking(db, "stay-3"), "room-b", "Trigger rollback", "2026-12-02", actor)).ok).toBe(false);
    expect(await snapshot(db, "stay-3", ["room-a", "room-b"])).toEqual(before);
  }, 20_000);

  it("allows only one same-booking/same-destination concurrent winner", async () => {
    const db = await database(`reassign-same-booking-race-${crypto.randomUUID()}`);
    await seedBooking(db, "race-stay", "room-a", "2027-01-01", "2027-01-05", ["room-a", "room-b", "room-c"]);
    const stale = await booking(db, "race-stay");
    const before = await snapshot(db, "race-stay", ["room-a", "room-b", "room-c"]);
    const results = await Promise.all([
      new D1LifecycleRepository(db).reassign(stale, "room-b", "Concurrent target B", "2027-01-02", { ...actor, requestId: "race-b" }),
      new D1LifecycleRepository(db).reassign(stale, "room-b", "Concurrent target B", "2027-01-02", { ...actor, requestId: "race-b-duplicate" }),
    ]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(await db.prepare("SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='race-stay' AND event_type='REASSIGN'").first()).toEqual({ count: 1 });
    const after = await snapshot(db, "race-stay", ["room-a", "room-b", "room-c"]);
    expect(after[0]).not.toEqual(before[0]);
    expect(await db.prepare("SELECT COUNT(*) AS count FROM room_inventory_nights WHERE booking_id='race-stay'").first()).toEqual({ count: 4 });
  }, 20_000);

  it("allows only one of two bookings to win a shared destination", async () => {
    const db = await database(`reassign-shared-destination-race-${crypto.randomUUID()}`);
    await seedBooking(db, "race-stay-a", "room-a", "2027-02-01", "2027-02-05", ["room-a", "room-shared"]);
    await seedBooking(db, "race-stay-b", "room-b", "2027-02-01", "2027-02-05", ["room-b", "room-shared"]);
    const beforeA = await snapshot(db, "race-stay-a", ["room-a", "room-shared"]);
    const beforeB = await snapshot(db, "race-stay-b", ["room-b", "room-shared"]);
    const results = await Promise.all([
      new D1LifecycleRepository(db).reassign(await booking(db, "race-stay-a"), "room-shared", "Shared destination race", "2027-02-02", { ...actor, requestId: "race-a" }),
      new D1LifecycleRepository(db).reassign(await booking(db, "race-stay-b"), "room-shared", "Shared destination race", "2027-02-02", { ...actor, requestId: "race-b" }),
    ]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    const [a, b] = await Promise.all([booking(db, "race-stay-a"), booking(db, "race-stay-b")]);
    const winner = a.room_id === "room-shared" ? "race-stay-a" : "race-stay-b";
    const loser = winner === "race-stay-a" ? "race-stay-b" : "race-stay-a";
    expect(a.room_id === "room-shared" || b.room_id === "room-shared").toBe(true);
    expect(await db.prepare("SELECT COUNT(*) AS count FROM lifecycle_events WHERE event_type='REASSIGN'").first()).toEqual({ count: 1 });
    const loserAfter = await snapshot(db, loser, loser === "race-stay-a" ? ["room-a", "room-shared"] : ["room-b", "room-shared"]);
    expect(loserAfter[0]).toEqual(loser === "race-stay-a" ? beforeA[0] : beforeB[0]);
    expect(loserAfter[1]).toEqual(loser === "race-stay-a" ? beforeA[1] : beforeB[1]);
    expect(loserAfter[3]).toEqual(loser === "race-stay-a" ? beforeA[3] : beforeB[3]);
    expect(loserAfter[4]).toEqual(loser === "race-stay-a" ? beforeA[4] : beforeB[4]);
    expect(winner).not.toBe(loser);
  }, 20_000);

  it("rejects an equal-count wrong-date source claim between snapshot and batch", async () => {
    const db = await database(`reassign-source-claim-race-${crypto.randomUUID()}`);
    await seedBooking(db, "claim-race", "room-a", "2027-03-01", "2027-03-05", ["room-a", "room-b"]);
    const before = await snapshot(db, "claim-race", ["room-a", "room-b"]);
    let stateAfterConcurrentChange: unknown[] | undefined;
    const interleavedDb = {
      prepare: db.prepare.bind(db),
      batch: async (statements: D1PreparedStatement[]) => {
        await db.prepare("UPDATE room_inventory_nights SET stay_date='2027-03-09' WHERE booking_id='claim-race' AND room_id='room-a' AND stay_date='2027-03-03'").run();
        stateAfterConcurrentChange = await snapshot(db, "claim-race", ["room-a", "room-b"]);
        return db.batch(statements);
      },
    } as unknown as D1Database;
    const result = await new D1LifecycleRepository(interleavedDb).reassign(await booking(db, "claim-race"), "room-b", "Concurrent claim change", "2027-03-02", actor);
    expect(result.ok).toBe(false);
    expect(stateAfterConcurrentChange).toBeDefined();
    expect(await snapshot(db, "claim-race", ["room-a", "room-b"])).toEqual(stateAfterConcurrentChange);
    expect(before[0]).toEqual(stateAfterConcurrentChange![0]);
    expect(stateAfterConcurrentChange![3]).toContainEqual({ room_id: "room-a", stay_date: "2027-03-09" });
  }, 20_000);

  it("rejects a destination room visible-state ABA using its advanced version", async () => {
    const db = await database(`reassign-room-aba-${crypto.randomUUID()}`);
    await seedBooking(db, "room-aba", "room-a", "2027-03-10", "2027-03-14", ["room-a", "room-b"]);
    const before = await snapshot(db, "room-aba", ["room-a", "room-b"]);
    let stateAfterAba: unknown[] | undefined;
    const interleavedDb = {
      prepare: db.prepare.bind(db),
      batch: async (statements: D1PreparedStatement[]) => {
        await db.prepare("UPDATE rooms SET status='OUT_OF_ORDER',room_state_version=room_state_version+1 WHERE id='room-b' AND status='AVAILABLE'").run();
        await db.prepare("UPDATE rooms SET status='AVAILABLE',room_state_version=room_state_version+1 WHERE id='room-b' AND status='OUT_OF_ORDER'").run();
        stateAfterAba = await snapshot(db, "room-aba", ["room-a", "room-b"]);
        return db.batch(statements);
      },
    } as unknown as D1Database;
    const result = await new D1LifecycleRepository(interleavedDb).reassign(await booking(db, "room-aba"), "room-b", "Room state ABA", "2027-03-11", actor);
    expect(result.ok).toBe(false);
    expect(stateAfterAba).toBeDefined();
    expect(stateAfterAba![2]).toMatchObject({ status: "AVAILABLE", room_state_version: 2 });
    expect(stateAfterAba![0]).toEqual(before[0]);
    expect(stateAfterAba![3]).toEqual(before[3]);
    expect(await snapshot(db, "room-aba", ["room-a", "room-b"])).toEqual(stateAfterAba);
  }, 20_000);
});
