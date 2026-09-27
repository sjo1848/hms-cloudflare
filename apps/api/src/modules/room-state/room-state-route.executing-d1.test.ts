import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import app from "../../index";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map((mf) => mf.dispose())));

async function database(name: string) {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: { DB: name },
  }));
  miniflares.push(mf);
  return mf.getD1Database("DB");
}

async function applyMigration(db: D1Database, migrationPath: string) {
  const sql = readFileSync(new URL(migrationPath, import.meta.url), "utf8");
  const statements: string[] = [];
  let buffer = "";
  let inTrigger = false;
  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    if (!inTrigger && /^CREATE TRIGGER\b/i.test(line)) inTrigger = true;
    buffer += `${rawLine}\n`;
    if ((inTrigger && /^END;$/i.test(line)) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim());
      buffer = "";
      inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration: ${migrationPath}`);
  if (statements.length) await db.batch(statements.map((statement) => db.prepare(statement)));
}

describe("room dimension read API tenant and capability boundaries on executing D1", () => {
  it("returns only the selected hotel's canonical room projection and denies unauthorized roles", async () => {
    const control = await database("room-state-control");
    const hotelA = await database("room-state-hotel-a");
    const hotelB = await database("room-state-hotel-b");
    await control.batch([
      control.prepare("CREATE TABLE network_memberships (access_subject TEXT PRIMARY KEY, role TEXT NOT NULL, active INTEGER NOT NULL)"),
      control.prepare("CREATE TABLE access_identity_mappings (access_subject TEXT PRIMARY KEY, email TEXT NOT NULL, active INTEGER NOT NULL)"),
      control.prepare("CREATE TABLE control_hotels (id TEXT PRIMARY KEY, operational_binding TEXT NOT NULL, active INTEGER NOT NULL)"),
      control.prepare("CREATE TABLE hotel_admin_metadata (hotel_id TEXT PRIMARY KEY, timezone TEXT)"),
      control.prepare("CREATE TABLE hotel_memberships (access_subject TEXT NOT NULL, hotel_id TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL)"),
      control.prepare("INSERT INTO access_identity_mappings VALUES ('desk', 'desk@example.test', 1)"),
      control.prepare("INSERT INTO access_identity_mappings VALUES ('housekeeper', 'hk@example.test', 1)"),
      control.prepare("INSERT INTO control_hotels VALUES ('hotel-a', 'HOTEL_DEMO_DB', 1)"),
      control.prepare("INSERT INTO control_hotels VALUES ('hotel-b', 'HOTEL_SECOND_DB', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('desk', 'hotel-a', 'receptionist', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('desk', 'hotel-b', 'receptionist', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('housekeeper', 'hotel-a', 'housekeeping', 1)"),
    ]);

    const setupHotel = async (db: D1Database, id: string, number: string) => {
      await db.batch([
        db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, room_type TEXT NOT NULL, status TEXT NOT NULL, price_cents INTEGER NOT NULL)"),
        db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL)"),
        db.prepare("CREATE TABLE maintenance_cases (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, impact TEXT NOT NULL, return_status TEXT)"),
        db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, booking_id TEXT, event_type TEXT NOT NULL, from_room_id TEXT, details_json TEXT NOT NULL)"),
        db.prepare("CREATE TABLE housekeeping_events (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, maintenance_case_id TEXT, event_type TEXT NOT NULL, from_status TEXT NOT NULL, to_status TEXT NOT NULL, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
        db.prepare("CREATE TABLE room_holds (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, hold_type TEXT NOT NULL, reason TEXT NOT NULL, created_by_user_id TEXT, created_at TEXT NOT NULL)"),
        db.prepare("CREATE TABLE room_inventory_nights (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, booking_id TEXT NOT NULL, stay_date TEXT NOT NULL)"),
        db.prepare("INSERT INTO rooms VALUES (?1, ?2, 'Standard', 'AVAILABLE', 10000)").bind(id, number),
      ]);
      await applyMigration(db, "../../../schema/hotel-migrations/0022_room_state_dimensions.sql");
      await applyMigration(db, "../../../schema/hotel-migrations/0023_room_state_command_guards.sql");
    };
    await setupHotel(hotelA, "room-a", "A-1");
    await setupHotel(hotelB, "room-b", "B-1");

    const request = (hotelId: string, subject = "desk", email = "desk@example.test", path = "/rooms", method = "GET") => app.request(`http://127.0.0.1/api/v1${path}`, {
      method,
      headers: {
        "x-local-access-subject": subject,
        "x-local-access-email": email,
        "x-hotel-id": hotelId,
      },
    }, {
      ENVIRONMENT: "development",
      LOCAL_DEV_AUTH: "true",
      CONTROL_DB: control,
      HOTEL_DEMO_DB: hotelA,
      HOTEL_SECOND_DB: hotelB,
    });

    const allowedA = await request("hotel-a", "desk", "desk@example.test", "/rooms");
    expect(allowedA.status).toBe(200);
    const roomsA = await allowedA.json() as Array<Record<string, any>>;
    expect(roomsA.map((room) => room.id)).toEqual(["room-a"]);
    expect(roomsA[0].operational_state).toMatchObject({
      occupancy: "VACANT", housekeeping: "UNRESOLVED", maintenanceImpact: "NONE", serviceState: "UNRESOLVED",
      readiness: { state: "UNRESOLVED" },
    });
    expect(roomsA[0].date_range_sellability).toEqual({ state: "UNRESOLVED", reason: "DATE_RANGE_NOT_EVALUATED" });

    const allowedB = await request("hotel-b", "desk", "desk@example.test", "/rooms");
    expect(allowedB.status).toBe(200);
    await expect(allowedB.json()).resolves.toMatchObject([{ id: "room-b", hotel_id: "hotel-b" }]);

    const denied = await request("hotel-a", "housekeeper", "hk@example.test", "/rooms");
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });

    const unknownHotel = await request("hotel-unknown");
    expect(unknownHotel.status).toBe(403);

    await hotelA.prepare("UPDATE rooms SET status='DIRTY',housekeeping_state='DIRTY',service_state='IN_SERVICE' WHERE id='room-a'").run();
    await hotelB.prepare("UPDATE rooms SET status='DIRTY',housekeeping_state='DIRTY',service_state='IN_SERVICE' WHERE id='room-b'").run();
    const crossTenantWrite = await request("hotel-a", "housekeeper", "hk@example.test", "/housekeeping/room-b/start", "POST");
    expect(crossTenantWrite.status).toBe(404);
    expect(await hotelB.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='room-b'").first()).toEqual({ status: "DIRTY", housekeeping_state: "DIRTY", room_state_version: 0 });
    expect(await hotelB.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first()).toEqual({ count: 0 });

    const ownTenantWrite = await request("hotel-a", "housekeeper", "hk@example.test", "/housekeeping/room-a/start", "POST");
    expect(ownTenantWrite.status).toBe(200);
    expect(await hotelA.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='room-a'").first()).toEqual({ status: "CLEANING", housekeeping_state: "CLEANING", room_state_version: 1 });
    const event = await hotelA.prepare("SELECT event_type,actor_subject,hotel_id,request_id,details_json FROM housekeeping_events").first<any>();
    expect(event).toMatchObject({ event_type: "CLEANING_START", actor_subject: "housekeeper", hotel_id: "hotel-a" });
    expect(event.request_id).toBeTruthy();
    expect(JSON.parse(String(event.details_json))).toMatchObject({
      occupancy_before: "VACANT", occupancy_after: "VACANT",
      housekeeping_state_before: "DIRTY", housekeeping_state_after: "CLEANING",
      maintenance_impact_before: "NONE", maintenance_impact_after: "NONE",
      service_state_before: "IN_SERVICE", service_state_after: "IN_SERVICE",
      room_state_version_before: 0, room_state_version_after: 1,
    });

    await expect(hotelA.prepare(`INSERT INTO housekeeping_events
      (id,room_id,maintenance_case_id,event_type,from_status,to_status,actor_subject,request_id,hotel_id,details_json,created_at)
      VALUES ('bad-event','room-a',NULL,'CLEANING_START','READY','CLEANING','housekeeper','invalid-request','hotel-a','{}','2026-09-27T12:00:00.000Z')`).run()).rejects.toThrow();
    expect(await hotelA.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first()).toEqual({ count: 1 });

    const deniedResolve = await request("hotel-a", "desk", "desk@example.test", "/housekeeping/room-a/maintenance/legacy-case/resolve", "POST");
    expect(deniedResolve.status).toBe(403);
    expect(await hotelA.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='room-a'").first()).toEqual({ status: "CLEANING", housekeeping_state: "CLEANING", room_state_version: 1 });
    expect(await hotelA.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first()).toEqual({ count: 1 });
  });
});
