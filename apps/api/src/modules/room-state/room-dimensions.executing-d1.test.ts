import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { Hono } from "hono";
import { ROOM_DIMENSION_SELECT, roomOperationalReadModel, type RoomDimensionRow } from "./read-model";
import { createInventoryRoutes } from "../../routes/inventory";
import type { ApiVariables } from "../../context";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map((mf) => mf.dispose())));

describe("F0.1 additive room dimension migration on executing D1", () => {
  it("preserves legacy data and leaves unreconstructable dimensions unresolved", async () => {
    const mf = new Miniflare(convertV4MiniflareOptions({
      script: "export default { fetch() { return new Response('ok') } }",
      modules: true,
      d1Databases: { DB: "room-dimensions-f01" },
    }));
    miniflares.push(mf);
    const db = await mf.getD1Database("DB");
    await db.batch([
      db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, room_type TEXT NOT NULL, status TEXT NOT NULL, price_cents INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL)"),
      db.prepare("CREATE TABLE maintenance_cases (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, impact TEXT NOT NULL)"),
    ]);
    await db.batch([
      db.prepare("INSERT INTO rooms VALUES ('legacy-available', '101', 'Standard', 'AVAILABLE', 10000)"),
      db.prepare("INSERT INTO rooms VALUES ('legacy-maintenance', '102', 'Standard', 'MAINTENANCE', 10000)"),
      db.prepare("INSERT INTO rooms VALUES ('occupied-blocking', '103', 'Standard', 'OCCUPIED', 10000)"),
    ]);

    const migration = readFileSync(new URL("../../../schema/hotel-migrations/0022_room_state_dimensions.sql", import.meta.url), "utf8");
    for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
      await db.prepare(statement).run();
    }

    const rows = await db.prepare("SELECT id, status, housekeeping_state, service_state FROM rooms ORDER BY id").all();
    expect(rows.results).toEqual([
      { id: "legacy-available", status: "AVAILABLE", housekeeping_state: null, service_state: null },
      { id: "legacy-maintenance", status: "MAINTENANCE", housekeeping_state: null, service_state: null },
      { id: "occupied-blocking", status: "OCCUPIED", housekeeping_state: null, service_state: null },
    ]);

    await expect(db.prepare("UPDATE rooms SET housekeeping_state='MAINTENANCE' WHERE id='legacy-available'").run()).rejects.toThrow();
    await expect(db.prepare("UPDATE rooms SET service_state='AVAILABLE' WHERE id='legacy-available'").run()).rejects.toThrow();
    await db.prepare("UPDATE rooms SET housekeeping_state='READY', service_state='IN_SERVICE' WHERE id='legacy-available'").run();
    expect(await db.prepare("SELECT housekeeping_state, service_state FROM rooms WHERE id='legacy-available'").first()).toEqual({
      housekeeping_state: "READY", service_state: "IN_SERVICE",
    });

    await db.batch([
      db.prepare("UPDATE rooms SET housekeeping_state='READY', service_state='IN_SERVICE' WHERE id='occupied-blocking'"),
      db.prepare("INSERT INTO bookings VALUES ('stay-103', 'occupied-blocking', 'CHECKED_IN')"),
      db.prepare("INSERT INTO maintenance_cases VALUES ('case-103', 'occupied-blocking', 'OPEN', 'BLOCKING')"),
    ]);
    const projected = await db.prepare(
      `SELECT ${ROOM_DIMENSION_SELECT} FROM rooms AS r WHERE r.id='occupied-blocking'`,
    ).first<RoomDimensionRow>();
    expect(projected).not.toBeNull();
    expect(roomOperationalReadModel(projected!)).toEqual({
      occupancy: "OCCUPIED", housekeeping: "READY", maintenanceImpact: "BLOCKING", serviceState: "IN_SERVICE",
      readiness: { state: "NOT_READY", reasons: ["ROOM_OCCUPIED", "BLOCKING_MAINTENANCE_OPEN"] },
    });

    await db.batch([
      db.prepare("UPDATE rooms SET housekeeping_state='READY', service_state='IN_SERVICE' WHERE id='legacy-maintenance'"),
      db.prepare("INSERT INTO maintenance_cases VALUES ('contradictory-case', 'legacy-maintenance', 'OPEN', 'NON_BLOCKING')"),
    ]);
    const contradictory = await db.prepare(
      `SELECT ${ROOM_DIMENSION_SELECT} FROM rooms AS r WHERE r.id='legacy-maintenance'`,
    ).first<RoomDimensionRow>();
    expect(roomOperationalReadModel(contradictory!)).toMatchObject({
      housekeeping: "READY", maintenanceImpact: "UNRESOLVED", serviceState: "IN_SERVICE",
      readiness: { state: "UNRESOLVED", reasons: ["MAINTENANCE_IMPACT_UNRESOLVED"] },
    });

    const app = new Hono<{ Variables: ApiVariables }>();
    app.use("*", async (context, next) => {
      context.set("membership", { hotelId: "hotel-synthetic", role: "admin", email: "ops@example.test", operationalBinding: "HOTEL_DEMO_DB", timeZone: "America/Argentina/Mendoza" });
      context.set("operationalDatabase", db);
      context.set("identity", { subject: "operator-synthetic", email: "ops@example.test" });
      context.set("requestId", "request-synthetic");
      await next();
    });
    app.route("/api/v1", createInventoryRoutes());
    const response = await app.request("/api/v1/rooms");
    expect(response.status).toBe(200);
    const body = await response.json() as Array<Record<string, any>>;
    const legacyMaintenance = body.find((room) => room.id === "legacy-maintenance");
    expect(legacyMaintenance).toMatchObject({
      status: "Maintenance",
      operational_state: {
        occupancy: "VACANT",
        housekeeping: "READY",
        maintenanceImpact: "UNRESOLVED",
        serviceState: "IN_SERVICE",
        readiness: { state: "UNRESOLVED", reasons: ["MAINTENANCE_IMPACT_UNRESOLVED"] },
      },
    });
  });
});
