import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import app from "../../index";
import { ROLE_CAPABILITIES } from "../../auth/capabilities";

const miniflares: Miniflare[] = [];
afterEach(async () => {
  delete ROLE_CAPABILITIES.__test_rooms_read_without_search;
  await Promise.all(miniflares.splice(0).map((mf) => mf.dispose()));
});

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
      control.prepare("INSERT INTO access_identity_mappings VALUES ('admin', 'admin@example.test', 1)"),
      control.prepare("INSERT INTO access_identity_mappings VALUES ('room-reader', 'room-reader@example.test', 1)"),
      control.prepare("INSERT INTO control_hotels VALUES ('hotel-a', 'HOTEL_DEMO_DB', 1)"),
      control.prepare("INSERT INTO control_hotels VALUES ('hotel-b', 'HOTEL_SECOND_DB', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('desk', 'hotel-a', 'receptionist', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('desk', 'hotel-b', 'receptionist', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('housekeeper', 'hotel-a', 'housekeeping', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('admin', 'hotel-a', 'admin', 1)"),
      control.prepare("INSERT INTO hotel_memberships VALUES ('room-reader', 'hotel-a', '__test_rooms_read_without_search', 1)"),
    ]);

    const setupHotel = async (db: D1Database, id: string, number: string) => {
      await db.batch([
        db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL UNIQUE, room_type TEXT NOT NULL, status TEXT NOT NULL, price_cents INTEGER NOT NULL)"),
        db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL)"),
        db.prepare("CREATE TABLE maintenance_cases (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, impact TEXT NOT NULL, return_status TEXT)"),
        db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, booking_id TEXT, event_type TEXT NOT NULL, from_room_id TEXT, details_json TEXT NOT NULL)"),
        db.prepare("CREATE TABLE housekeeping_events (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, maintenance_case_id TEXT, event_type TEXT NOT NULL, from_status TEXT NOT NULL, to_status TEXT NOT NULL, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
        db.prepare("CREATE TABLE room_holds (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, hold_type TEXT NOT NULL, reason TEXT NOT NULL, created_by_user_id TEXT, created_at TEXT NOT NULL)"),
        db.prepare("CREATE TABLE room_inventory_nights (room_id TEXT NOT NULL, booking_id TEXT NOT NULL, stay_date TEXT NOT NULL, PRIMARY KEY (room_id, stay_date))"),
        db.prepare("INSERT INTO rooms VALUES (?1, ?2, 'Standard', 'AVAILABLE', 10000)").bind(id, number),
      ]);
      await db.prepare("CREATE INDEX idx_room_holds_room_dates ON room_holds (room_id, start_date, end_date)").run();
      await applyMigration(db, "../../../schema/hotel-migrations/0022_room_state_dimensions.sql");
      await applyMigration(db, "../../../schema/hotel-migrations/0023_room_state_command_guards.sql");
    };
    await setupHotel(hotelA, "room-a", "A-1");
    await setupHotel(hotelB, "room-b", "B-1");

    const request = (hotelId: string, subject = "desk", email = "desk@example.test", path = "/rooms", method = "GET", body?: Record<string, unknown>) => app.request(`http://127.0.0.1/api/v1${path}`, {
      method,
      headers: {
        "x-local-access-subject": subject,
        "x-local-access-email": email,
        "x-hotel-id": hotelId,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
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

    // Test-only role: isolate the route's extra rooms.search requirement without
    // changing the production role/capability policy.
    ROLE_CAPABILITIES.__test_rooms_read_without_search = new Set(["rooms.read"]);
    const readOnlyRoomBoard = await request("hotel-a", "room-reader", "room-reader@example.test", "/rooms");
    expect(readOnlyRoomBoard.status).toBe(200);
    const deniedRangeForReadOnly = await request("hotel-a", "room-reader", "room-reader@example.test", "/rooms?start=2050-01-01&end=2050-01-03");
    expect(deniedRangeForReadOnly.status).toBe(403);
    await expect(deniedRangeForReadOnly.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });

    const allowedB = await request("hotel-b", "desk", "desk@example.test", "/rooms");
    expect(allowedB.status).toBe(200);
    await expect(allowedB.json()).resolves.toMatchObject([{ id: "room-b", hotel_id: "hotel-b" }]);

    const denied = await request("hotel-a", "housekeeper", "hk@example.test", "/rooms");
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });

    const unknownHotel = await request("hotel-unknown");
    expect(unknownHotel.status).toBe(403);

    const rangeUrl = "/rooms?start=2050-01-01&end=2050-01-03";
    const unresolvedRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    expect(unresolvedRange.status).toBe(200);
    await expect(unresolvedRange.json()).resolves.toMatchObject([{
      id: "room-a",
      date_range_sellability: { state: "UNRESOLVED", reason: "SERVICE_STATE_UNRESOLVED" },
    }]);
    await hotelA.prepare("UPDATE rooms SET housekeeping_state='READY',service_state='IN_SERVICE' WHERE id='room-a'").run();
    const sellableRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    await expect(sellableRange.json()).resolves.toMatchObject([{
      id: "room-a",
      operational_state: { occupancy: "VACANT", housekeeping: "READY", serviceState: "IN_SERVICE", readiness: { state: "READY_FOR_ARRIVAL" } },
      date_range_sellability: { state: "SELLABLE", reason: "INTERVAL_CLEAR" },
    }]);

    await hotelA.prepare("INSERT INTO room_holds(id,room_id,start_date,end_date,hold_type,reason,created_by_user_id,created_at) VALUES ('hold-range','room-a','2050-01-02','2050-01-03','Other','planned hold','desk','2049-12-01T00:00:00.000Z')").run();
    const heldRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    await expect(heldRange.json()).resolves.toMatchObject([{ date_range_sellability: { state: "NOT_SELLABLE", reason: "OVERLAPPING_HOLD" } }]);
    await hotelA.prepare("DELETE FROM room_holds WHERE id='hold-range'").run();

    await hotelA.prepare("INSERT INTO room_inventory_nights(room_id,booking_id,stay_date) VALUES ('room-a','booking-range','2050-01-02')").run();
    const claimedRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    await expect(claimedRange.json()).resolves.toMatchObject([{ date_range_sellability: { state: "NOT_SELLABLE", reason: "OVERLAPPING_ROOM_NIGHT" } }]);
    await hotelA.prepare("DELETE FROM room_inventory_nights WHERE room_id='room-a' AND stay_date='2050-01-02'").run();

    await hotelA.prepare("INSERT INTO maintenance_cases(id,room_id,status,impact) VALUES ('case-range','room-a','OPEN','NON_BLOCKING')").run();
    const advisoryRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    await expect(advisoryRange.json()).resolves.toMatchObject([{ operational_state: { maintenanceImpact: "NON_BLOCKING" }, date_range_sellability: { state: "SELLABLE" } }]);
    await hotelA.prepare("UPDATE maintenance_cases SET impact='BLOCKING' WHERE id='case-range'").run();
    const blockedRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    await expect(blockedRange.json()).resolves.toMatchObject([{ operational_state: { maintenanceImpact: "BLOCKING", housekeeping: "READY" }, date_range_sellability: { state: "NOT_SELLABLE", reason: "BLOCKING_MAINTENANCE" } }]);
    await hotelA.prepare("DELETE FROM maintenance_cases WHERE id='case-range'").run();
    await hotelA.prepare("UPDATE rooms SET status='MAINTENANCE' WHERE id='room-a'").run();
    const unresolvedMaintenanceRange = await request("hotel-a", "desk", "desk@example.test", rangeUrl);
    await expect(unresolvedMaintenanceRange.json()).resolves.toMatchObject([{ operational_state: { maintenanceImpact: "UNRESOLVED" }, date_range_sellability: { state: "UNRESOLVED", reason: "MAINTENANCE_IMPACT_UNRESOLVED" } }]);
    await hotelA.prepare("UPDATE rooms SET status='AVAILABLE' WHERE id='room-a'").run();
    const touchingRange = await request("hotel-a", "desk", "desk@example.test", "/rooms?start=2050-01-03&end=2050-01-04");
    await expect(touchingRange.json()).resolves.toMatchObject([{ date_range_sellability: { state: "SELLABLE", reason: "INTERVAL_CLEAR" } }]);
    const invalidRange = await request("hotel-a", "desk", "desk@example.test", "/rooms?start=2050-01-03&end=2050-01-03");
    expect(invalidRange.status).toBe(400);
    const rangeOtherHotel = await request("hotel-b", "desk", "desk@example.test", rangeUrl);
    await expect(rangeOtherHotel.json()).resolves.toMatchObject([{ id: "room-b", hotel_id: "hotel-b", date_range_sellability: { state: "UNRESOLVED" } }]);

    const beforeMetadataDenial = await hotelA.prepare("SELECT room_number,room_type,price_cents,status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-a'").first<any>();
    const deniedMetadataEdit = await request("hotel-a", "desk", "desk@example.test", "/rooms/room-a", "PATCH", {
      room_number: "A-9", room_type: "Suite", price_cents: 15000,
    });
    expect(deniedMetadataEdit.status).toBe(403);
    expect(await hotelA.prepare("SELECT room_number,room_type,price_cents,status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-a'").first()).toEqual(beforeMetadataDenial);

    const createdRoom = await request("hotel-a", "admin", "admin@example.test", "/rooms", "POST", {
      room_number: "A-2", room_type: "Deluxe", price_cents: 12000,
    });
    expect(createdRoom.status).toBe(201);
    const createdRoomBody = await createdRoom.json() as { id: string; room_number: string; price_cents: number; operational_state: { housekeeping: string; serviceState: string } };
    expect(createdRoomBody).toMatchObject({ room_number: "A-2", price_cents: 12000, operational_state: { housekeeping: "UNRESOLVED", serviceState: "UNRESOLVED" } });
    const duplicateRoom = await request("hotel-a", "admin", "admin@example.test", "/rooms", "POST", {
      room_number: "A-2", room_type: "Duplicate", price_cents: 12000,
    });
    expect(duplicateRoom.status).toBe(409);
    const invalidRoomRate = await request("hotel-a", "admin", "admin@example.test", "/rooms", "POST", {
      room_number: "A-3", room_type: "Standard", price_cents: -1,
    });
    expect(invalidRoomRate.status).toBe(400);

    const editedRoom = await request("hotel-a", "admin", "admin@example.test", "/rooms/room-a", "PATCH", {
      room_number: "A-1A", room_type: "Suite", price_cents: 15500,
    });
    expect(editedRoom.status).toBe(200);
    const afterMetadataEdit = await hotelA.prepare("SELECT room_number,room_type,price_cents,status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-a'").first<any>();
    expect(afterMetadataEdit).toMatchObject({ room_number: "A-1A", room_type: "Suite", price_cents: 15500 });
    expect(afterMetadataEdit).toMatchObject({ status: beforeMetadataDenial.status, housekeeping_state: beforeMetadataDenial.housekeeping_state, service_state: beforeMetadataDenial.service_state, room_state_version: beforeMetadataDenial.room_state_version });
    const invalidRateEdit = await request("hotel-a", "admin", "admin@example.test", "/rooms/room-a", "PATCH", {
      room_number: "A-1A", room_type: "Suite", price_cents: -1,
    });
    expect(invalidRateEdit.status).toBe(400);
    expect(await hotelA.prepare("SELECT room_number,room_type,price_cents,status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-a'").first()).toEqual(afterMetadataEdit);

    const intervalPlan = await hotelA.prepare(`EXPLAIN QUERY PLAN SELECT r.id FROM rooms AS r
      WHERE EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.room_id=r.id AND n.stay_date>=?1 AND n.stay_date<?2)
         OR EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id=r.id AND h.start_date<?2 AND h.end_date>?1)`)
      .bind("2050-01-01", "2050-01-03").all<{ detail: string }>();
    const intervalPlanText = intervalPlan.results.map(row => row.detail).join(" ");
    expect(intervalPlanText).toContain("sqlite_autoindex_room_inventory_nights_1 (room_id=? AND stay_date>? AND stay_date<?)");
    expect(intervalPlanText).toContain("idx_room_holds_room_dates");

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

    const holdPath = "/rooms/room-a/holds";
    const holdDraft = { start_date: "2050-02-01", end_date: "2050-02-03", hold_type: "Vip", reason: "Synthetic D1 hold" };
    const deniedHoldWrite = await request("hotel-a", "desk", "desk@example.test", holdPath, "POST", holdDraft);
    expect(deniedHoldWrite.status).toBe(403);
    expect(await hotelA.prepare("SELECT COUNT(*) AS count FROM room_holds").first()).toEqual({ count: 0 });

    const createdHold = await request("hotel-a", "admin", "admin@example.test", holdPath, "POST", holdDraft);
    expect(createdHold.status).toBe(201);
    const hold = await createdHold.json() as { id: string; hold_type: string };
    expect(hold.hold_type).toBe("Vip");
    const secondHold = await request("hotel-a", "admin", "admin@example.test", holdPath, "POST", {
      start_date: "2050-04-01", end_date: "2050-04-03", hold_type: "Other", reason: "Second hold",
    });
    expect(secondHold.status).toBe(201);
    const secondHoldId = (await secondHold.json() as { id: string }).id;
    const overlapHold = await request("hotel-a", "admin", "admin@example.test", holdPath, "POST", {
      start_date: "2050-02-02", end_date: "2050-02-04", hold_type: "Other", reason: "Overlapping hold",
    });
    expect(overlapHold.status).toBe(409);
    const conflictingEdit = await request("hotel-a", "admin", "admin@example.test", `${holdPath}/${hold.id}`, "PATCH", {
      start_date: "2050-04-02", end_date: "2050-04-04", hold_type: "Compliance", reason: "Overlapping edit",
    });
    expect(conflictingEdit.status).toBe(409);
    const editedHold = await request("hotel-a", "admin", "admin@example.test", `${holdPath}/${hold.id}`, "PATCH", {
      start_date: "2050-03-01", end_date: "2050-03-02", hold_type: "Compliance", reason: "Edited D1 hold",
    });
    expect(editedHold.status).toBe(200);
    await expect(editedHold.json()).resolves.toMatchObject({ id: hold.id, hold_type: "Compliance", reason: "Edited D1 hold" });
    const deletedHold = await request("hotel-a", "admin", "admin@example.test", `${holdPath}/${hold.id}`, "DELETE");
    expect(deletedHold.status).toBe(200);
    const deletedSecondHold = await request("hotel-a", "admin", "admin@example.test", `${holdPath}/${secondHoldId}`, "DELETE");
    expect(deletedSecondHold.status).toBe(200);
    expect(await hotelA.prepare("SELECT COUNT(*) AS count FROM room_holds").first()).toEqual({ count: 0 });
  });
});
