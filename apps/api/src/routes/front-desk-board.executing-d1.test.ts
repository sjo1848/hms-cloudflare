import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import app from "../index";

const activeMiniflares: Miniflare[] = [];
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(activeMiniflares.splice(0).map(mf => mf.dispose()));
});

async function database(name: string) {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: { DB: name },
  }));
  activeMiniflares.push(mf);
  return mf.getD1Database("DB");
}

async function seedOperationalSchema(db: D1Database) {
  await db.batch([
    db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, status TEXT NOT NULL, room_type TEXT NOT NULL DEFAULT 'STANDARD', price_cents INTEGER NOT NULL DEFAULT 10000)"),
    db.prepare("CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT)"),
    db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, guest_id TEXT NOT NULL, room_id TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL, status TEXT NOT NULL, total_cents INTEGER NOT NULL, notes TEXT, created_at TEXT, updated_at TEXT)"),
    db.prepare("CREATE TABLE maintenance_cases (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, impact TEXT NOT NULL, reason TEXT NOT NULL)"),
  ]);
}

async function setupControl(db: D1Database) {
  await db.batch([
    db.prepare("CREATE TABLE network_memberships (access_subject TEXT PRIMARY KEY, role TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE access_identity_mappings (access_subject TEXT PRIMARY KEY, email TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE control_hotels (id TEXT PRIMARY KEY, operational_binding TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE hotel_admin_metadata (hotel_id TEXT PRIMARY KEY, timezone TEXT)"),
    db.prepare("CREATE TABLE hotel_memberships (access_subject TEXT NOT NULL, hotel_id TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL)"),
    db.prepare("INSERT INTO access_identity_mappings VALUES ('frontdesk', 'desk@example.test', 1)"),
    db.prepare("INSERT INTO access_identity_mappings VALUES ('housekeeper', 'housekeeper@example.test', 1)"),
    db.prepare("INSERT INTO control_hotels VALUES ('hotel-a', 'HOTEL_DEMO_DB', 1)"),
    db.prepare("INSERT INTO control_hotels VALUES ('hotel-b', 'HOTEL_SECOND_DB', 1)"),
    db.prepare("INSERT INTO hotel_admin_metadata VALUES ('hotel-a', 'America/Los_Angeles')"),
    db.prepare("INSERT INTO hotel_admin_metadata VALUES ('hotel-b', 'America/Argentina/Buenos_Aires')"),
    db.prepare("INSERT INTO hotel_memberships VALUES ('frontdesk', 'hotel-a', 'receptionist', 1)"),
    db.prepare("INSERT INTO hotel_memberships VALUES ('frontdesk', 'hotel-b', 'receptionist', 1)"),
    db.prepare("INSERT INTO hotel_memberships VALUES ('housekeeper', 'hotel-b', 'housekeeping', 1)"),
  ]);
}

function request(hotelId = "hotel-a", subject = "frontdesk", email = "desk@example.test") {
  return app.request("http://127.0.0.1/api/v1/front-desk/board", {
    headers: {
      "x-local-access-subject": subject,
      "x-local-access-email": email,
      "x-hotel-id": hotelId,
    },
  }, {
    ENVIRONMENT: "development",
    LOCAL_DEV_AUTH: "true",
    CONTROL_DB: controlDb,
    HOTEL_DEMO_DB: hotelDemoDb,
    HOTEL_SECOND_DB: hotelSecondDb,
  });
}

let controlDb: D1Database;
let hotelDemoDb: D1Database;
let hotelSecondDb: D1Database;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-01T01:00:00.000Z"));
  controlDb = await database("front-desk-control");
  hotelDemoDb = await database("front-desk-hotel-a");
  hotelSecondDb = await database("front-desk-hotel-b");
  await setupControl(controlDb);
  await seedOperationalSchema(hotelDemoDb);
  await seedOperationalSchema(hotelSecondDb);
});

describe("GET /api/v1/front-desk/board on executing D1", () => {
  it("returns hotel-local date, canonical order, room readiness, and both maintenance impacts", async () => {
    await hotelDemoDb.batch([
      hotelDemoDb.prepare("INSERT INTO guests (id,full_name) VALUES ('g-today', 'Ana Today')"),
      hotelDemoDb.prepare("INSERT INTO guests (id,full_name) VALUES ('g-overdue', 'Zoe Overdue')"),
      hotelDemoDb.prepare("INSERT INTO guests (id,full_name) VALUES ('g-departure', 'Drew Departure')"),
      hotelDemoDb.prepare("INSERT INTO guests (id,full_name) VALUES ('g-upcoming', 'Uma Upcoming')"),
      hotelDemoDb.prepare("INSERT INTO rooms (id, room_number, status) VALUES ('r-today', '2', 'MAINTENANCE')"),
      hotelDemoDb.prepare("INSERT INTO rooms (id, room_number, status) VALUES ('r-overdue', '10', 'AVAILABLE')"),
      hotelDemoDb.prepare("INSERT INTO rooms (id, room_number, status) VALUES ('r-departure', '1', 'OCCUPIED')"),
      hotelDemoDb.prepare("INSERT INTO rooms (id, room_number, status) VALUES ('r-upcoming', '3', 'AVAILABLE')"),
      // Insert order and identifiers intentionally disagree with operational priority.
      hotelDemoDb.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,notes) VALUES ('z-today', 'g-today', 'r-today', '2026-03-31', '2026-04-03', 'CONFIRMED', 30000, NULL)"),
      hotelDemoDb.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,notes) VALUES ('a-upcoming', 'g-upcoming', 'r-upcoming', '2026-04-02', '2026-04-04', 'CONFIRMED', 20000, 'quiet room')"),
      hotelDemoDb.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,notes) VALUES ('m-overdue', 'g-overdue', 'r-overdue', '2026-03-30', '2026-04-02', 'CONFIRMED', 20000, NULL)"),
      hotelDemoDb.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,notes) VALUES ('b-departure', 'g-departure', 'r-departure', '2026-03-29', '2026-03-30', 'CHECKED_IN', 10000, NULL)"),
      hotelDemoDb.prepare("INSERT INTO maintenance_cases VALUES ('case-block', 'r-today', 'OPEN', 'BLOCKING', 'Heating is unsafe')"),
      hotelDemoDb.prepare("INSERT INTO maintenance_cases VALUES ('case-advisory', 'r-upcoming', 'OPEN', 'NON_BLOCKING', 'Lamp needs replacement')"),
    ]);

    const response = await request();
    expect(response.status).toBe(200);
    const body = await response.json() as { date: string; generated_at: string; items: Array<Record<string, any>> };
    expect(body.date).toBe("2026-03-31");
    expect(body.generated_at).toBe("2026-04-01T01:00:00.000Z");
    expect(body.items.map(item => item.booking.id)).toEqual(["b-departure", "m-overdue", "z-today", "a-upcoming"]);
    expect(body.items[0]).toMatchObject({ lane: "departure", reason: "departure-overdue", priority: 0, room_status: "Occupied", maintenance_case: null });
    expect(body.items[1]).toMatchObject({ lane: "arrival", reason: "arrival-overdue", priority: 5, room_status: "Available", maintenance_case: null });
    expect(body.items[2]).toMatchObject({
      lane: "arrival", reason: "arrival-today", priority: 20, room_status: "Maintenance",
      maintenance_case: { id: "case-block", impact: "BLOCKING", reason: "Heating is unsafe", status: "Open" },
    });
    expect(body.items[3]).toMatchObject({
      lane: "reservation", reason: "upcoming-arrival", priority: 30, room_status: "Available",
      maintenance_case: { id: "case-advisory", impact: "NON_BLOCKING", reason: "Lamp needs replacement", status: "Open" },
    });
    expect(body.items[2].booking).toEqual({
      id: "z-today", guest_id: "g-today", guest_name: "Ana Today", room_id: "r-today", room_number: "2",
      check_in: "2026-03-31", check_out: "2026-04-03", status: "Confirmed", total_cents: 30000, notes: null,
    });
  });

  it("enforces bookings.read and selects only the authorized hotel's operational D1", async () => {
    await hotelDemoDb.batch([
      hotelDemoDb.prepare("INSERT INTO guests (id,full_name) VALUES ('guest-a', 'Hotel A Guest')"),
      hotelDemoDb.prepare("INSERT INTO rooms (id, room_number, status) VALUES ('room-a', '1', 'AVAILABLE')"),
      hotelDemoDb.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,notes) VALUES ('booking-a', 'guest-a', 'room-a', '2026-03-31', '2026-04-01', 'CONFIRMED', 10000, NULL)"),
    ]);
    await hotelSecondDb.batch([
      hotelSecondDb.prepare("INSERT INTO guests (id,full_name) VALUES ('guest-b', 'Hotel B Guest')"),
      hotelSecondDb.prepare("INSERT INTO rooms (id, room_number, status) VALUES ('room-b', '1', 'AVAILABLE')"),
      hotelSecondDb.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,notes) VALUES ('booking-b', 'guest-b', 'room-b', '2026-03-31', '2026-04-01', 'CONFIRMED', 10000, NULL)"),
    ]);

    const allowed = await request("hotel-a");
    expect(allowed.status).toBe(200);
    await expect(allowed.json()).resolves.toMatchObject({ items: [{ booking: { id: "booking-a" } }] });

    const otherTenant = await request("hotel-b");
    expect(otherTenant.status).toBe(200);
    await expect(otherTenant.json()).resolves.toMatchObject({ items: [{ booking: { id: "booking-b" } }] });

    const denied = await request("hotel-b", "housekeeper", "housekeeper@example.test");
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });

    const deniedCheckIn = await app.request("http://127.0.0.1/api/v1/bookings/booking-b/check-in", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-local-access-subject": "housekeeper",
        "x-local-access-email": "housekeeper@example.test",
        "x-hotel-id": "hotel-b",
      },
      body: JSON.stringify({ check_in_guests_count: 2, document_verified: true, contact_confirmed: true, stay_confirmed: true }),
    }, {
      ENVIRONMENT: "development", LOCAL_DEV_AUTH: "true", CONTROL_DB: controlDb,
      HOTEL_DEMO_DB: hotelDemoDb, HOTEL_SECOND_DB: hotelSecondDb,
    });
    expect(deniedCheckIn.status).toBe(403);
    await expect(hotelSecondDb.prepare("SELECT status FROM bookings WHERE id='booking-b'").first()).resolves.toMatchObject({ status: "CONFIRMED" });

    const bypass = await app.request("http://127.0.0.1/api/v1/bookings/booking-a", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-local-access-subject": "frontdesk",
        "x-local-access-email": "desk@example.test",
        "x-hotel-id": "hotel-a",
      },
      body: JSON.stringify({ status: "CHECKED_IN" }),
    }, {
      ENVIRONMENT: "development", LOCAL_DEV_AUTH: "true", CONTROL_DB: controlDb,
      HOTEL_DEMO_DB: hotelDemoDb, HOTEL_SECOND_DB: hotelSecondDb,
    });
    expect(bypass.status).toBe(400);
    await expect(hotelDemoDb.prepare("SELECT status FROM bookings WHERE id='booking-a'").first()).resolves.toMatchObject({ status: "CONFIRMED" });
  });
});
