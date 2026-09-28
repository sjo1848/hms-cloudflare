import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import app from "../../index";

const hotelMigrations = new URL("../../../schema/hotel-migrations/", import.meta.url);
const activeMiniflares: Miniflare[] = [];
afterAll(async () => { await Promise.all(activeMiniflares.splice(0).map((mf) => mf.dispose())); });

async function database(name: string) {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: { DB: name },
  }));
  activeMiniflares.push(mf);
  return mf.getD1Database("DB");
}

async function applyMigration(db: D1Database, name: string) {
  const sql = readFileSync(new URL(name, hotelMigrations), "utf8");
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
  if (buffer.trim()) throw new Error(`Unterminated migration ${name}`);
  for (const [index, statement] of statements.entries()) {
    try { await db.prepare(statement).run(); }
    catch (error) { throw new Error(`Migration ${name}, statement ${index + 1}: ${statement.slice(0, 160)}`, { cause: error }); }
  }
}

async function hotelDatabase(name: string, hotelId: string) {
  const db = await database(name);
  for (const migration of readdirSync(hotelMigrations).filter(file => /^\d{4}_.*\.sql$/.test(file)).sort()) {
    await applyMigration(db, migration);
  }
  await db.batch([
    db.prepare(`INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state)
      VALUES (?1,'101','Standard','AVAILABLE',10000,'READY','IN_SERVICE')`).bind(`${hotelId}-room`),
    db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES (?1,'102','Standard','AVAILABLE',12000,'READY','IN_SERVICE')").bind(`${hotelId}-room-2`),
  ]);
  return db;
}

async function controlDatabase(name: string) {
  const db = await database(name);
  await db.batch([
    db.prepare("CREATE TABLE network_memberships (access_subject TEXT PRIMARY KEY, role TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE access_identity_mappings (access_subject TEXT PRIMARY KEY, email TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE control_hotels (id TEXT PRIMARY KEY, operational_binding TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE hotel_admin_metadata (hotel_id TEXT PRIMARY KEY, timezone TEXT)"),
    db.prepare("CREATE TABLE hotel_memberships (access_subject TEXT NOT NULL, hotel_id TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("INSERT INTO access_identity_mappings VALUES ('desk','desk@example.test',1)"),
    db.prepare("INSERT INTO access_identity_mappings VALUES ('housekeeper','hk@example.test',1)"),
    db.prepare("INSERT INTO control_hotels VALUES ('hotel-a','HOTEL_DEMO_DB',1)"),
    db.prepare("INSERT INTO control_hotels VALUES ('hotel-b','HOTEL_SECOND_DB',1)"),
    db.prepare("INSERT INTO hotel_admin_metadata VALUES ('hotel-a','America/Argentina/Mendoza')"),
    db.prepare("INSERT INTO hotel_admin_metadata VALUES ('hotel-b','America/Argentina/Mendoza')"),
    db.prepare("INSERT INTO hotel_memberships VALUES ('desk','hotel-a','receptionist',1)"),
    db.prepare("INSERT INTO hotel_memberships VALUES ('desk','hotel-b','receptionist',1)"),
    db.prepare("INSERT INTO hotel_memberships VALUES ('housekeeper','hotel-a','housekeeping',1)"),
  ]);
  return db;
}

const control = { value: null as D1Database | null };
const hotels: { a: D1Database | null; b: D1Database | null } = { a: null, b: null };

async function setup(prefix: string) {
  const [controlDb, hotelA, hotelB] = await Promise.all([
    controlDatabase(`${prefix}-control`),
    hotelDatabase(`${prefix}-hotel-a`, "hotel-a"),
    hotelDatabase(`${prefix}-hotel-b`, "hotel-b"),
  ]);
  control.value = controlDb;
  hotels.a = hotelA;
  hotels.b = hotelB;
}

beforeAll(async () => setup("f08-recovery"), 30_000);

function request(path: string, body: unknown, options: { hotelId?: string; subject?: string; method?: string } = {}) {
  const hotelId = options.hotelId ?? "hotel-a";
  const subject = options.subject ?? "desk";
  return app.request(`http://127.0.0.1/api/v1${path}`, {
    method: options.method ?? "POST",
    headers: {
      "content-type": "application/json",
      "x-local-access-subject": subject,
      "x-local-access-email": subject === "housekeeper" ? "hk@example.test" : "desk@example.test",
      "x-hotel-id": hotelId,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, {
    ENVIRONMENT: "development",
    LOCAL_DEV_AUTH: "true",
    CONTROL_DB: control.value!,
    HOTEL_DEMO_DB: hotels.a!,
    HOTEL_SECOND_DB: hotels.b!,
  });
}

const tokenA = "f0800000-0000-4000-8000-000000000001";
const tokenB = "f0800000-0000-4000-8000-000000000002";
const tokenC = "f0800000-0000-4000-8000-000000000003";
const tokenD = "f0800000-0000-4000-8000-000000000006";
const tokenE = "f0800000-0000-4000-8000-000000000007";

function newGuestRequest(token: string, roomId = "hotel-a-room", checkIn = "2027-02-10") {
  const checkOut = new Date(`${checkIn}T00:00:00.000Z`);
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);
  return {
    operation_token: token,
    guest: { full_name: "Synthetic F0.8 Guest", email: `${token}@example.test`, phone: null },
    booking: { room_id: roomId, check_in: checkIn, check_out: checkOut.toISOString().slice(0, 10), notes: "Synthetic recovery" },
  };
}

async function counts(db: D1Database, token: string) {
  const operation = await db.prepare("SELECT guest_id,booking_id FROM reservation_creation_operations WHERE operation_token=?1").bind(token).first<{ guest_id: string; booking_id: string }>();
  const query = async (sql: string, id: string | null) => id
    ? Number((await db.prepare(sql).bind(id).first<{ count: number }>())?.count ?? -1)
    : 0;
  return {
    guests: await query("SELECT COUNT(*) AS count FROM guests WHERE id=?1", operation?.guest_id ?? null),
    operations: await query("SELECT COUNT(*) AS count FROM reservation_creation_operations WHERE operation_token=?1", token),
    bookings: await query("SELECT COUNT(*) AS count FROM bookings WHERE id=?1", operation?.booking_id ?? null),
    nights: await query("SELECT COUNT(*) AS count FROM room_inventory_nights WHERE booking_id=?1", operation?.booking_id ?? null),
    segments: await query("SELECT COUNT(*) AS count FROM booking_pricing_segments WHERE booking_id=?1", operation?.booking_id ?? null),
    events: await query("SELECT COUNT(*) AS count FROM reservation_creation_events WHERE operation_token=?1", token),
    agentEvents: await query("SELECT COUNT(*) AS count FROM agent_mutation_events WHERE booking_id=?1", operation?.booking_id ?? null),
    invoices: await query("SELECT COUNT(*) AS count FROM invoices WHERE booking_id=?1", operation?.booking_id ?? null),
    payments: await query("SELECT COUNT(*) AS count FROM payment_entries WHERE booking_id=?1", operation?.booking_id ?? null),
  };
}

describe("F0.8 recoverable guest + reservation creation on executing D1", () => {
  it("replays identical requests and response loss without a second booking; changed payload conflicts", async () => {
    const db = hotels.a!;
    const payload = newGuestRequest(tokenA);
    const firstResponses = await Promise.all([
      request("/reservation-creation-operations", payload),
      request("/reservation-creation-operations", payload),
    ]);
    expect(firstResponses.map(response => response.status).sort()).toEqual([200, 201]);
    const firstBody = await firstResponses[1].json() as { operation: { stage: string; guest_id: string; booking_id: string }; booking: { id: string; total_cents: number }; replayed: boolean };
    expect(firstBody).toMatchObject({ operation: { stage: "BOOKING_CREATED" }, booking: { total_cents: 20000 } });

    // Model response loss: discard the first successful result and retry the
    // exact same operation identity and semantic request.
    const retry = await request("/reservation-creation-operations", payload);
    expect(retry.status).toBe(200);
    const retryBody = await retry.json() as typeof firstBody;
    expect(retryBody).toMatchObject({ operation: { booking_id: firstBody.operation.booking_id, guest_id: firstBody.operation.guest_id, stage: "BOOKING_CREATED" }, booking: { id: firstBody.booking.id }, replayed: true });

    const changed = newGuestRequest(tokenA, "hotel-a-room-2");
    const conflict = await request("/reservation-creation-operations", changed);
    expect(conflict.status).toBe(409);
    expect(await counts(db, tokenA)).toEqual({ guests: 1, operations: 1, bookings: 1, nights: 2, segments: 1, events: 2, agentEvents: 0, invoices: 0, payments: 0 });
    const durable = await db.prepare("SELECT stage,booking_created_by_subject,booking_request_id,hotel_id FROM reservation_creation_operations WHERE operation_token=?1").bind(tokenA).first();
    expect(durable).toMatchObject({ stage: "BOOKING_CREATED", booking_created_by_subject: "desk", hotel_id: "hotel-a" });
  });

  it("keeps a created guest recoverable after booking conflict/response loss and resumes the same payload", async () => {
    const db = hotels.a!;
    await db.prepare("INSERT INTO guests (id,full_name,email,created_at) VALUES ('competing-guest','Competing Guest','competing@example.test','2027-01-01T00:00:00.000Z')").run();
    const competingBooking = await request("/bookings", {
      guest_id: "competing-guest",
      room_id: "hotel-a-room",
      check_in: "2027-02-12",
      check_out: "2027-02-13",
      notes: "Synthetic competing reservation",
    });
    expect(competingBooking.status).toBe(201);
    const payload = newGuestRequest(tokenB, "hotel-a-room", "2027-02-12");
    const lostStageResponse = await request("/reservation-creation-operations", payload);
    expect(lostStageResponse.status).toBe(409);
    // Intentionally do not read the conflict body; recovery must be discoverable
    // by tenant-scoped GET, not depend on a response reaching the browser.
    const pending = await request("/reservation-creation-operations", undefined, { method: "GET" });
    expect(pending.status).toBe(200);
    await expect(pending.json()).resolves.toMatchObject([{ operation_token: tokenB, stage: "GUEST_CREATED", guest_name: "Synthetic F0.8 Guest" }]);
    expect(await counts(db, tokenB)).toEqual({ guests: 1, operations: 1, bookings: 0, nights: 0, segments: 0, events: 1, agentEvents: 0, invoices: 0, payments: 0 });

    const competingBody = await competingBooking.clone().json() as { id: string };
    await db.prepare("UPDATE bookings SET status='CANCELLED' WHERE id=?1").bind(competingBody.id).run();
    await db.prepare("DELETE FROM room_inventory_nights WHERE booking_id=?1").bind(competingBody.id).run();
    const resumed = await request("/reservation-creation-operations", payload);
    expect(resumed.status).toBe(201);
    expect(await counts(db, tokenB)).toEqual({ guests: 1, operations: 1, bookings: 1, nights: 2, segments: 1, events: 2, agentEvents: 0, invoices: 0, payments: 0 });
    const resolvedRecoveryList = await request("/reservation-creation-operations", undefined, { method: "GET" });
    await expect(resolvedRecoveryList.json()).resolves.not.toContainEqual(expect.objectContaining({ operation_token: tokenB }));
  });

  it("allows one winner when the same token is raced with different payloads", async () => {
    const db = hotels.a!;
    const payloadA = newGuestRequest(tokenD, "hotel-a-room", "2027-02-20");
    const payloadB = newGuestRequest(tokenD, "hotel-a-room-2", "2027-02-22");
    payloadB.guest.email = `${tokenD}.other@example.test`;
    const responses = await Promise.all([
      request("/reservation-creation-operations", payloadA),
      request("/reservation-creation-operations", payloadB),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
    const winnerResponse = responses.find(response => response.status === 201)!;
    const conflictResponse = responses.find(response => response.status === 409)!;
    const winner = await winnerResponse.json() as { operation: { guest_id: string; booking_id: string; room_id: string; check_in: string } };
    const conflict = await conflictResponse.json() as { operation: { guest_id: string; booking_id: string; room_id: string; check_in: string } };
    expect(conflict.operation).toMatchObject({
      operation_token: tokenD,
      guest_id: winner.operation.guest_id,
      booking_id: winner.operation.booking_id,
      room_id: winner.operation.room_id,
      check_in: winner.operation.check_in,
    });
    const operation = await db.prepare("SELECT payload_hash,guest_id,booking_id,room_id,check_in FROM reservation_creation_operations WHERE operation_token=?1").bind(tokenD).first<{ guest_id: string; booking_id: string; room_id: string; check_in: string }>();
    expect(operation).toBeTruthy();
    const guestCount = Number((await db.prepare("SELECT COUNT(*) AS count FROM guests WHERE id IN (SELECT guest_id FROM reservation_creation_operations WHERE operation_token=?1)").bind(tokenD).first<{ count: number }>())?.count);
    expect(guestCount).toBe(1);
    expect(await counts(db, tokenD)).toEqual({ guests: 1, operations: 1, bookings: 1, nights: 2, segments: 1, events: 2, agentEvents: 0, invoices: 0, payments: 0 });
    expect(operation).toMatchObject({
      guest_id: winner.operation.guest_id,
      booking_id: winner.operation.booking_id,
      room_id: winner.operation.room_id,
      check_in: winner.operation.check_in,
    });
  });

  it("books against an existing guest without manufacturing a new guest", async () => {
    const db = hotels.a!;
    await db.prepare("INSERT INTO guests (id,full_name,email,created_at) VALUES ('existing-f08','Existing Guest','existing-f08@example.test','2027-01-01T00:00:00.000Z')").run();
    const payload = {
      operation_token: tokenE,
      guest_id: "existing-f08",
      booking: { room_id: "hotel-a-room", check_in: "2027-02-24", check_out: "2027-02-26", notes: "Existing guest" },
    };
    const response = await request("/reservation-creation-operations", payload);
    expect(response.status).toBe(201);
    const result = await response.json() as { operation: { stage: string; guest_id: string; guest_source?: string } };
    expect(result.operation).toMatchObject({ stage: "BOOKING_CREATED", guest_id: "existing-f08" });
    expect(await db.prepare("SELECT guest_source FROM reservation_creation_operations WHERE operation_token=?1").bind(tokenE).first()).toEqual({ guest_source: "EXISTING" });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM guests WHERE id='existing-f08'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT event_type FROM reservation_creation_events WHERE operation_token=?1 ORDER BY event_type").bind(tokenE).all()).toMatchObject({ results: [{ event_type: "BOOKING_CREATED" }] });
  });

  it("rolls back booking, claims, segment, stage and success event when the audit write fails", async () => {
    const db = hotels.a!;
    await db.prepare(`CREATE TRIGGER inject_f08_booking_event_failure BEFORE INSERT ON reservation_creation_events
      WHEN NEW.event_type='BOOKING_CREATED' BEGIN SELECT RAISE(ABORT,'injected F0.8 audit failure'); END`).run();
    const payload = newGuestRequest(tokenC, "hotel-a-room", "2027-02-14");
    const failure = await request("/reservation-creation-operations", payload);
    expect(failure.status).toBe(500);
    expect(await counts(db, tokenC)).toEqual({ guests: 1, operations: 1, bookings: 0, nights: 0, segments: 0, events: 1, agentEvents: 0, invoices: 0, payments: 0 });
    const pending = await db.prepare("SELECT stage FROM reservation_creation_operations WHERE operation_token=?1").bind(tokenC).first<{ stage: string }>();
    expect(pending?.stage).toBe("GUEST_CREATED");
    await db.prepare("DROP TRIGGER inject_f08_booking_event_failure").run();
    const retry = await request("/reservation-creation-operations", payload);
    expect(retry.status).toBe(201);
    expect(await counts(db, tokenC)).toEqual({ guests: 1, operations: 1, bookings: 1, nights: 2, segments: 1, events: 2, agentEvents: 0, invoices: 0, payments: 0 });
  });

  it("rolls back the guest and operation stage when initial guest audit fails", async () => {
    const db = hotels.a!;
    await db.prepare(`CREATE TRIGGER inject_f08_guest_event_failure BEFORE INSERT ON reservation_creation_events
      WHEN NEW.event_type='GUEST_CREATED' BEGIN SELECT RAISE(ABORT,'injected F0.8 guest audit failure'); END`).run();
    const payload = newGuestRequest("f0800000-0000-4000-8000-000000000008", "hotel-a-room", "2027-02-28");
    const failure = await request("/reservation-creation-operations", payload);
    expect(failure.status).toBe(500);
    expect(await db.prepare("SELECT COUNT(*) AS count FROM guests WHERE email=?1").bind(payload.guest.email).first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM reservation_creation_operations WHERE operation_token=?1").bind(payload.operation_token).first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM reservation_creation_events WHERE operation_token=?1").bind(payload.operation_token).first()).toEqual({ count: 0 });
    await db.prepare("DROP TRIGGER inject_f08_guest_event_failure").run();
    const retry = await request("/reservation-creation-operations", payload);
    expect(retry.status).toBe(201);
    expect(await counts(db, payload.operation_token)).toMatchObject({ guests: 1, operations: 1, bookings: 1, events: 2 });
  });

  it("fails closed for unauthorized and cross-hotel recovery and never merges email matches", async () => {
    const dbA = hotels.a!;
    const unauthorized = await request("/reservation-creation-operations", newGuestRequest("f0800000-0000-4000-8000-000000000099"), { subject: "housekeeper" });
    expect(unauthorized.status).toBe(403);
    const createToken = "f0800000-0000-4000-8000-000000000004";
    const createPayload = newGuestRequest(createToken, "hotel-a-room", "2027-02-16");
    const created = await request("/reservation-creation-operations", createPayload);
    expect(created.status).toBe(201);
    const foreignLookup = await request(`/reservation-creation-operations/${createToken}`, undefined, { hotelId: "hotel-b", method: "GET" });
    expect(foreignLookup.status).toBe(404);
    const foreignList = await request("/reservation-creation-operations", undefined, { hotelId: "hotel-b", method: "GET" });
    await expect(foreignList.json()).resolves.toEqual([]);

    const duplicateEmail = newGuestRequest("f0800000-0000-4000-8000-000000000005", "hotel-a-room", "2027-02-18");
    duplicateEmail.guest.email = newGuestRequest(tokenA).guest.email;
    const duplicate = await request("/reservation-creation-operations", duplicateEmail);
    expect(duplicate.status).toBe(409);
    expect(await counts(dbA, createToken)).toEqual({ guests: 1, operations: 1, bookings: 1, nights: 2, segments: 1, events: 2, agentEvents: 0, invoices: 0, payments: 0 });
    const tokenScopedToAnotherTenant = await request("/reservation-creation-operations", newGuestRequest(tokenA, "hotel-b-room"), { hotelId: "hotel-b" });
    expect(tokenScopedToAnotherTenant.status).toBe(201);
    const dbB = hotels.b!;
    expect(await counts(dbB, tokenA)).toEqual({ guests: 1, operations: 1, bookings: 1, nights: 2, segments: 1, events: 2, agentEvents: 0, invoices: 0, payments: 0 });
  });
});
