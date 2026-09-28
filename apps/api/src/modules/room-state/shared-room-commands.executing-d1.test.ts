import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import type { ApiVariables } from "../../context";
import { ApiError } from "../../errors";
import { createHousekeepingRoutes } from "../../routes/housekeeping";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map((mf) => mf.dispose())));

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
  for (const statement of statements) await db.prepare(statement).run();
}

describe("F0.2 shared room commands on executing D1", () => {
  it("preserves dimensions through blocking maintenance and cleaning, resolves to current housekeeping state, and rejects stale K1", async () => {
    const mf = new Miniflare(convertV4MiniflareOptions({
      script: "export default { fetch() { return new Response('ok') } }",
      modules: true,
      d1Databases: { DB: "shared-room-commands-f02" },
    }));
    miniflares.push(mf);
    const db = await mf.getD1Database("DB");
    await db.batch([
      db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, room_type TEXT NOT NULL, status TEXT NOT NULL, price_cents INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, check_out TEXT NOT NULL DEFAULT '2026-10-01', status TEXT NOT NULL)"),
      db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, event_type TEXT NOT NULL, from_room_id TEXT, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE room_inventory_nights (room_id TEXT NOT NULL, stay_date TEXT NOT NULL, booking_id TEXT NOT NULL, PRIMARY KEY(room_id,stay_date))"),
      db.prepare("CREATE TABLE room_holds (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL)"),
      db.prepare("CREATE TABLE financial_events (id TEXT PRIMARY KEY, booking_id TEXT, event_type TEXT NOT NULL, details_json TEXT NOT NULL)"),
    ]);
    await applyMigration(db, "../../../schema/hotel-migrations/0009_housekeeping_maintenance.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0020_maintenance_impact.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0021_reassignment_remaining_nights.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0022_room_state_dimensions.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0023_room_state_command_guards.sql");
    await db.batch([
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES ('room-a','101','Standard','DIRTY',10000,'DIRTY','IN_SERVICE')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES ('room-b','102','Standard','AVAILABLE',10000,'READY','IN_SERVICE')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES ('room-c','103','Standard','DIRTY',10000,'DIRTY','IN_SERVICE')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES ('room-d','104','Standard','MAINTENANCE',10000,'READY','IN_SERVICE')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES ('room-race','105','Standard','DIRTY',10000,'DIRTY','IN_SERVICE')"),
      db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('legacy-nonblocking','room-d','OPEN','NON_BLOCKING','LOW','Legacy mixed room evidence','maintenance','2026-09-27T12:00:00.000Z')"),
    ]);

    const app = new Hono<{ Variables: ApiVariables }>();
    let role = "admin";
    app.use("*", async (context, next) => {
      context.set("membership", { hotelId: "hotel-synthetic", role, email: "ops@example.test", operationalBinding: "HOTEL_DEMO_DB", timeZone: "America/Argentina/Mendoza" });
      context.set("operationalDatabase", db);
      context.set("identity", { subject: "operator-synthetic", email: "ops@example.test" });
      context.set("requestId", `request-${crypto.randomUUID()}`);
      await next();
    });
    app.onError((error, context) => error instanceof ApiError
      ? context.json({ error: { code: error.code, message: error.message } }, error.status)
      : context.json({ error: { code: "INTERNAL_ERROR" } }, 500));
    app.route("/api/v1", createHousekeepingRoutes());
    const post = (path: string, body: Record<string, unknown> = {}) => app.request(`/api/v1${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    expect((await post("/housekeeping/room-a/start")).status).toBe(200);
    const opened = await post("/housekeeping/room-a/maintenance", { reason: "Leak by window", priority: "HIGH", assigned_to: "maintenance", impact: "BLOCKING" });
    expect(opened.status).toBe(201);
    const caseView = await opened.json() as { id: string };
    const openEvent = await db.prepare("SELECT event_type,actor_subject,request_id,hotel_id,details_json FROM housekeeping_events WHERE event_type='MAINTENANCE_OPEN'").first<any>();
    expect(openEvent).toMatchObject({ event_type: "MAINTENANCE_OPEN", actor_subject: "operator-synthetic", hotel_id: "hotel-synthetic" });
    expect(openEvent.request_id).toMatch(/^request-/);
    expect(JSON.parse(String(openEvent.details_json))).toMatchObject({ impact: "BLOCKING", room_state_version_before: 1, room_state_version_after: 2, housekeeping_state_after: "CLEANING", service_state_after: "IN_SERVICE" });
    const finish = await post("/housekeeping/room-a/finish");
    expect(finish.status).toBe(200);
    const afterFinish = await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-a'").first();
    expect(afterFinish).toEqual({ status: "MAINTENANCE", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 3 });
    expect(await db.prepare("SELECT status,impact FROM maintenance_cases WHERE id=?1").bind(caseView.id).first()).toEqual({ status: "OPEN", impact: "BLOCKING" });
    const finishEvent = await db.prepare("SELECT event_type,from_status,to_status,details_json FROM housekeeping_events WHERE event_type='CLEANING_FINISH'").first<any>();
    expect(finishEvent).toMatchObject({ event_type: "CLEANING_FINISH", from_status: "CLEANING", to_status: "MAINTENANCE" });
    expect(JSON.parse(String(finishEvent.details_json))).toMatchObject({ housekeeping_state_before: "CLEANING", housekeeping_state_after: "READY", maintenance_impact_before: "BLOCKING", maintenance_impact_after: "BLOCKING", service_state_before: "IN_SERVICE", service_state_after: "IN_SERVICE", occupancy_before: "VACANT", occupancy_after: "VACANT" });

    const eventCountBeforeDeniedResolve = await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first<{ count: number }>();
    role = "receptionist";
    expect((await post(`/housekeeping/room-a/maintenance/${caseView.id}/resolve`, { resolution_note: "Unauthorized attempt" })).status).toBe(403);
    expect(await db.prepare("SELECT status,impact FROM maintenance_cases WHERE id=?1").bind(caseView.id).first()).toEqual({ status: "OPEN", impact: "BLOCKING" });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first()).toEqual(eventCountBeforeDeniedResolve);
    role = "admin";
    const resolved = await post(`/housekeeping/room-a/maintenance/${caseView.id}/resolve`, { resolution_note: "Repair is complete" });
    expect(resolved.status).toBe(200);
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-a'").first()).toEqual({ status: "AVAILABLE", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 4 });
    expect(await db.prepare("SELECT status,impact,return_status FROM maintenance_cases WHERE id=?1").bind(caseView.id).first()).toEqual({ status: "RESOLVED", impact: "BLOCKING", return_status: "AVAILABLE" });

    const advisory = await post("/housekeeping/room-b/maintenance", { reason: "Lamp flickers", priority: "LOW", assigned_to: "maintenance", impact: "NON_BLOCKING" });
    expect(advisory.status).toBe(201);
    const advisoryCase = await advisory.json() as { id: string };
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-b'").first()).toEqual({ status: "AVAILABLE", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 1 });

    const k1Resolved = await post(`/housekeeping/room-b/maintenance/${advisoryCase.id}/resolve`, { resolution_note: "Old case resolved" });
    expect(k1Resolved.status).toBe(200);
    const k2 = await post("/housekeeping/room-b/maintenance", { reason: "New lamp issue", priority: "MEDIUM", assigned_to: "maintenance", impact: "NON_BLOCKING" });
    expect(k2.status).toBe(201);
    const replacement = await k2.json() as { id: string };
    const eventCountBeforeStale = await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first<{ count: number }>();
    const staleK1 = await post(`/housekeeping/room-b/maintenance/${advisoryCase.id}/resolve`, { resolution_note: "Stale resolution" });
    expect(staleK1.status).toBe(409);
    expect(await db.prepare("SELECT id,status,impact FROM maintenance_cases WHERE room_id='room-b' AND status='OPEN'").first()).toEqual({ id: replacement.id, status: "OPEN", impact: "NON_BLOCKING" });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first()).toEqual(eventCountBeforeStale);

    const unresolvedEvents = await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first<{ count: number }>();
    expect((await post("/housekeeping/room-d/maintenance/legacy-nonblocking/resolve", { resolution_note: "Resolve legacy case" })).status).toBe(409);
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-d'").first()).toEqual({ status: "MAINTENANCE", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 0 });
    expect(await db.prepare("SELECT status,impact FROM maintenance_cases WHERE id='legacy-nonblocking'").first()).toEqual({ status: "OPEN", impact: "NON_BLOCKING" });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events").first()).toEqual(unresolvedEvents);

    const successfulEvents = await db.prepare("SELECT event_type,actor_subject,request_id,hotel_id FROM housekeeping_events ORDER BY rowid").all<any>();
    expect(successfulEvents.results.map((event) => event.event_type)).toEqual(["CLEANING_START", "MAINTENANCE_OPEN", "CLEANING_FINISH", "MAINTENANCE_RESOLVE", "MAINTENANCE_OPEN", "MAINTENANCE_RESOLVE", "MAINTENANCE_OPEN"]);
    expect(successfulEvents.results.every((event) => event.actor_subject === "operator-synthetic" && event.hotel_id === "hotel-synthetic" && event.request_id.startsWith("request-"))).toBe(true);

    const raceResults = await Promise.all([
      post("/housekeeping/room-race/start"),
      post("/housekeeping/room-race/start"),
    ]);
    expect(raceResults.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(await db.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='room-race'").first()).toEqual({ status: "CLEANING", housekeeping_state: "CLEANING", room_state_version: 1 });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events WHERE room_id='room-race' AND event_type='CLEANING_START' AND json_extract(details_json,'$.room_state_version_after')=1").first()).toEqual({ count: 1 });

    await db.batch([
      db.prepare("UPDATE rooms SET status='CLEANING',housekeeping_state='CLEANING',room_state_version=1 WHERE id='room-c' AND room_state_version=0"),
      db.prepare("UPDATE rooms SET status='DIRTY',housekeeping_state='DIRTY',room_state_version=2 WHERE id='room-c' AND room_state_version=1"),
    ]);
    await expect(db.batch([
      db.prepare("UPDATE rooms SET status='CLEANING',housekeeping_state='CLEANING',room_state_version=1 WHERE id='room-c' AND room_state_version=0"),
      db.prepare("INSERT INTO housekeeping_events (id,room_id,event_type,from_status,to_status,actor_subject,request_id,hotel_id,details_json,created_at) VALUES ('stale-aba-event','room-c','CLEANING_START','DIRTY','CLEANING','operator-synthetic','stale-request','hotel-synthetic','{\"room_state_version_before\":0,\"room_state_version_after\":1,\"service_state_after\":\"IN_SERVICE\",\"maintenance_open_case_count\":0}','2026-09-27T12:00:00.000Z')"),
    ])).rejects.toThrow();
    expect(await db.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='room-c'").first()).toEqual({ status: "DIRTY", housekeeping_state: "DIRTY", room_state_version: 2 });
    expect(await db.prepare("SELECT COUNT(*) AS count FROM housekeeping_events WHERE id='stale-aba-event'").first()).toEqual({ count: 0 });
  });
});
