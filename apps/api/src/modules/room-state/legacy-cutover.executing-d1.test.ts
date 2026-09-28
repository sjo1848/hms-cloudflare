import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { mapLegacyRoomState, readLegacyRoomStateSnapshot } from "./legacy-cutover";

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
    if ((inTrigger && (line === "END;" || (startsTrigger && /\bEND;\s*$/i.test(line)))) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim());
      buffer = "";
      inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration ${path}`);
  for (const [index, statement] of statements.entries()) {
    try { await db.prepare(statement).run(); }
    catch (error) { throw new Error(`Migration statement ${index + 1}/${statements.length} failed in ${path}: ${statement.slice(0, 180)}`, { cause: error }); }
  }
}

async function createHotelDatabase(name: string) {
  const mf = new Miniflare(convertV4MiniflareOptions({ script: "export default { fetch() { return new Response('ok') } }", modules: true, d1Databases: { DB: name } }));
  miniflares.push(mf);
  const db = await mf.getD1Database("DB");
  const migrationDir = new URL("../../../schema/hotel-migrations/", import.meta.url);
  const paths = readdirSync(migrationDir).filter(name => name.endsWith(".sql")).sort().map(name => join(migrationDir.pathname, name));
  for (const path of paths) await applyMigration(db, path);
  return { db, paths };
}

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

describe("F0.3 synthetic room-state shadow rehearsal on executing D1", () => {
  // This case applies the entire hotel migration chain and then exercises an interrupted/replayed D1 batch.
  // Keep the larger allowance local to this integration case; the repository-wide Vitest timeout stays unchanged.
  it("accounts source rows, preserves canonical data, resumes interrupted shadow mapping, rejects drift, and replays idempotently", async () => {
    const { db, paths } = await createHotelDatabase("f03-cutover-hotel-a");
    const date = "2026-09-27";
    await db.batch([
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES ('ready-room','101','STANDARD','AVAILABLE',12000,'READY','IN_SERVICE')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('unknown-room','102','STANDARD','AVAILABLE',12000)"),
      db.prepare("CREATE TABLE f03_shadow_runs (hotel_id TEXT NOT NULL, source_digest TEXT NOT NULL, mapping_version TEXT NOT NULL, status TEXT NOT NULL, checksum TEXT, payload TEXT, PRIMARY KEY(hotel_id,source_digest,mapping_version))"),
      db.prepare("CREATE TABLE f03_shadow_rows (hotel_id TEXT NOT NULL, source_digest TEXT NOT NULL, mapping_version TEXT NOT NULL, room_id TEXT NOT NULL, classification TEXT NOT NULL, readiness TEXT NOT NULL, sellability TEXT NOT NULL, PRIMARY KEY(hotel_id,source_digest,mapping_version,room_id))"),
    ]);
    const migrationDigest = sha256(paths.map(path => readFileSync(path, "utf8")).join("\n"));
    const schemaRows = await db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all<{ type: string; name: string; sql: string | null }>();
    const schemaDigest = sha256(JSON.stringify(schemaRows.results));
    const input = { hotel_id: "hotel-synthetic-a", hotel_local_date: date, sellability_range: { start_date: "2026-10-01", end_date: "2026-10-03" }, source_schema_digest: schemaDigest, source_migration_digest: migrationDigest };
    expect(schemaDigest).toBe("5eacbc95ee0f4db1842ad333075cbd87626a7b62339f0ea13dbbaa402a240672");
    expect(migrationDigest).toBe("051e64cb87d925427f20c04b69bf61a3b5a7bb58e5a2a8c938e201e2d5fda976");
    const snapshot = await readLegacyRoomStateSnapshot(db, input);
    const report = await mapLegacyRoomState(snapshot);
    expect(report.source_digest).toBe("7ad97a67e3df98cfe5148ce097ca2ec511628219362850785013088e2b60d355");
    expect(report.report_checksum).toBe("863e235a178d2a7b60e376d3738dc8ab40e71ba89e46b717b36bb87637537359");
    expect(report).toMatchObject({ input_room_count: 2, output_room_count: 2, accounted_input_record_count: report.input_record_count });
    expect(report.rows.map(row => [row.room_id, row.classification, row.readiness.state, row.date_range_sellability])).toEqual([
      ["ready-room", "MAPPED", "READY_FOR_ARRIVAL", "SELLABLE"],
      ["unknown-room", "REVIEW_REQUIRED", "UNRESOLVED", "UNRESOLVED"],
    ]);

    const canonicalBefore = await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all();
    await db.prepare("INSERT INTO f03_shadow_runs VALUES (?1,?2,?3,'INCOMPLETE',NULL,NULL)").bind(report.hotel_id, report.source_digest, report.mapping_version).run();
    // Inject process loss after the per-hotel checkpoint was durably marked incomplete.
    expect(await db.prepare("SELECT status FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "INCOMPLETE" });
    const firstShadowRow = report.rows[0];
    await expect(db.batch([
      db.prepare("INSERT INTO f03_shadow_rows VALUES (?1,?2,?3,?4,?5,?6,?7)")
        .bind(report.hotel_id, report.source_digest, report.mapping_version, firstShadowRow.room_id, firstShadowRow.classification, firstShadowRow.readiness.state, firstShadowRow.date_range_sellability),
      db.prepare("INSERT INTO f03_injected_failure_table VALUES ('failure')"),
    ])).rejects.toThrow();
    expect(await db.prepare("SELECT COUNT(*) AS count FROM f03_shadow_rows").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT status FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "INCOMPLETE" });
    const replay = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(db, input));
    expect(replay.report_checksum).toBe(report.report_checksum);
    await db.batch([
      ...replay.rows.map(row => db.prepare("INSERT INTO f03_shadow_rows VALUES (?1,?2,?3,?4,?5,?6,?7) ON CONFLICT DO UPDATE SET classification=excluded.classification,readiness=excluded.readiness,sellability=excluded.sellability")
        .bind(replay.hotel_id, replay.source_digest, replay.mapping_version, row.room_id, row.classification, row.readiness.state, row.date_range_sellability)),
      db.prepare("UPDATE f03_shadow_runs SET status='COMPLETE',checksum=?4,payload=?5 WHERE hotel_id=?1 AND source_digest=?2 AND mapping_version=?3")
        .bind(replay.hotel_id, replay.source_digest, replay.mapping_version, replay.report_checksum, JSON.stringify(replay)),
    ]);
    const replayAgain = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(db, input));
    expect(replayAgain.report_checksum).toBe(replay.report_checksum);
    expect(await db.prepare("SELECT COUNT(*) AS count FROM f03_shadow_rows").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT status,checksum FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "COMPLETE", checksum: report.report_checksum });

    await db.prepare("UPDATE rooms SET service_state='OUT_OF_ORDER' WHERE id='ready-room'").run();
    const drifted = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(db, input));
    expect(drifted.source_digest).not.toBe(report.source_digest);
    expect(drifted.rows.find(row => row.room_id === "ready-room")?.date_range_sellability).toBe("NOT_SELLABLE");
    const activationGuard = (shadowDigest: string, currentDigest: string) => shadowDigest === currentDigest;
    expect(activationGuard(report.source_digest, drifted.source_digest)).toBe(false);
    expect(await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all()).not.toEqual(canonicalBefore);
    expect(await db.prepare("SELECT status FROM f03_shadow_runs WHERE hotel_id=?1 AND source_digest=?2").bind(report.hotel_id, report.source_digest).first()).toEqual({ status: "COMPLETE" });
    // The only changed canonical value is the deliberate synthetic source-drift mutation.
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='unknown-room'").first()).toEqual({ status: "AVAILABLE", housekeeping_state: null, service_state: null, room_state_version: 0 });
    await db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('case-a','unknown-room','OPEN','NON_BLOCKING','MEDIUM','synthetic issue','operator','2026-09-27T12:00:00.000Z')").run();
    await expect(db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('case-b','unknown-room','OPEN','BLOCKING','HIGH','duplicate synthetic issue','operator','2026-09-27T12:01:00.000Z')").run()).rejects.toThrow();
    const openCases = await db.prepare("SELECT id,status FROM maintenance_cases WHERE room_id='unknown-room'").all<{ id: string; status: string }>();
    expect(openCases.results).toEqual([{ id: "case-a", status: "OPEN" }]);
  }, 10_000);

  it("keeps separate synthetic hotel D1 checkpoints isolated", async () => {
    const createMinimalHotel = async (name: string, roomNumber: string) => {
      const mf = new Miniflare(convertV4MiniflareOptions({ script: "export default { fetch() { return new Response('ok') } }", modules: true, d1Databases: { DB: name } }));
      miniflares.push(mf);
      const db = await mf.getD1Database("DB");
      await db.batch([
        db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, status TEXT NOT NULL, housekeeping_state TEXT, service_state TEXT, room_state_version INTEGER NOT NULL)"),
        db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL)"),
        db.prepare("CREATE TABLE room_inventory_nights (room_id TEXT NOT NULL, stay_date TEXT NOT NULL, booking_id TEXT NOT NULL)"),
        db.prepare("CREATE TABLE room_holds (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL)"),
        db.prepare("CREATE TABLE maintenance_cases (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, status TEXT NOT NULL, impact TEXT NOT NULL)"),
        db.prepare("CREATE TABLE housekeeping_events (id TEXT PRIMARY KEY, hotel_id TEXT NOT NULL, room_id TEXT NOT NULL, event_type TEXT NOT NULL, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, created_at TEXT NOT NULL, details_json TEXT NOT NULL)"),
        db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, hotel_id TEXT NOT NULL, booking_id TEXT NOT NULL, from_room_id TEXT, event_type TEXT NOT NULL, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, created_at TEXT NOT NULL, details_json TEXT NOT NULL)"),
        db.prepare("INSERT INTO rooms VALUES ('same-room-id',?1,'AVAILABLE',NULL,NULL,0)").bind(roomNumber),
      ]);
      return db;
    };
    const a = await createMinimalHotel("f03-isolated-hotel-a", "A-1");
    const b = await createMinimalHotel("f03-isolated-hotel-b", "B-1");
    const input = { hotel_local_date: "2026-09-27", sellability_range: { start_date: "2026-10-01", end_date: "2026-10-02" }, source_schema_digest: "synthetic-schema", source_migration_digest: "synthetic-migrations" };
    const reportA = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(a, { ...input, hotel_id: "hotel-a" }));
    const reportB = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(b, { ...input, hotel_id: "hotel-b" }));
    expect(reportA.source_digest).not.toBe(reportB.source_digest);
    expect(reportA.rows[0].hotel_id).toBe("hotel-a");
    expect(reportB.rows[0].hotel_id).toBe("hotel-b");
    expect(await a.prepare("SELECT room_number FROM rooms WHERE id='same-room-id'").first()).toEqual({ room_number: "A-1" });
    expect(await b.prepare("SELECT room_number FROM rooms WHERE id='same-room-id'").first()).toEqual({ room_number: "B-1" });
  });

});
