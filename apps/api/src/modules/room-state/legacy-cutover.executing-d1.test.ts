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

type SyntheticShadowRun = { status: "INCOMPLETE" | "STAGING" | "COMPLETE"; checkpoint: string; checksum: string | null; payload: string | null };

function shadowRowInsert(db: D1Database, report: Awaited<ReturnType<typeof mapLegacyRoomState>>, row: Awaited<ReturnType<typeof mapLegacyRoomState>>["rows"][number]) {
  return db.prepare("INSERT INTO f03_shadow_rows VALUES (?1,?2,?3,?4,?5,?6,?7) ON CONFLICT DO UPDATE SET classification=excluded.classification,readiness=excluded.readiness,sellability=excluded.sellability")
    .bind(report.hotel_id, report.source_digest, report.mapping_version, row.room_id, row.classification, row.readiness.state, row.date_range_sellability);
}

async function stageSyntheticShadowRows(db: D1Database, report: Awaited<ReturnType<typeof mapLegacyRoomState>>, injectFailure = false) {
  const inserts = report.rows.map(row => shadowRowInsert(db, report, row));
  const statements = injectFailure
    ? [inserts[0], db.prepare("INSERT INTO f03_injected_failure_table VALUES ('failure')"), ...inserts.slice(1)]
    : inserts;
  const result = await db.batch([
    ...statements,
    db.prepare("UPDATE f03_shadow_runs SET status='STAGING',checkpoint='SHADOW_ROWS_WRITTEN',checksum=?4,payload=?5 WHERE hotel_id=?1 AND source_digest=?2 AND mapping_version=?3 AND status='INCOMPLETE'")
      .bind(report.hotel_id, report.source_digest, report.mapping_version, report.report_checksum, JSON.stringify(report)),
  ]);
  if (result.at(-1)?.meta.changes !== 1) throw new Error("Synthetic shadow stage lost its INCOMPLETE run checkpoint");
}

async function resumeSyntheticShadow(
  db: D1Database,
  input: Parameters<typeof readLegacyRoomStateSnapshot>[1],
) {
  const report = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(db, input));
  const run = await db.prepare("SELECT status,checkpoint,checksum,payload FROM f03_shadow_runs WHERE hotel_id=?1 AND source_digest=?2 AND mapping_version=?3")
    .bind(report.hotel_id, report.source_digest, report.mapping_version).first<SyntheticShadowRun>();
  if (!run) throw new Error("Synthetic shadow run checkpoint is missing");
  if (run.status === "INCOMPLETE") {
    await stageSyntheticShadowRows(db, report);
    return report;
  }
  const persistedRows = await db.prepare("SELECT room_id,classification,readiness,sellability FROM f03_shadow_rows WHERE hotel_id=?1 AND source_digest=?2 AND mapping_version=?3 ORDER BY room_id")
    .bind(report.hotel_id, report.source_digest, report.mapping_version).all();
  const expectedRows = report.rows.map(row => ({ room_id: row.room_id, classification: row.classification, readiness: row.readiness.state, sellability: row.date_range_sellability }));
  if (JSON.stringify(persistedRows.results) !== JSON.stringify(expectedRows)) throw new Error("Synthetic shadow rows do not match the current deterministic report");
  if (run.status === "STAGING") {
    const completion = await db.prepare("UPDATE f03_shadow_runs SET status='COMPLETE',checkpoint='COMPLETE' WHERE hotel_id=?1 AND source_digest=?2 AND mapping_version=?3 AND status='STAGING' AND checksum=?4")
      .bind(report.hotel_id, report.source_digest, report.mapping_version, report.report_checksum).run();
    if (completion.meta.changes !== 1) throw new Error("Synthetic shadow completion lost its exact STAGING checkpoint");
  } else if (run.checksum !== report.report_checksum || run.checkpoint !== "COMPLETE") {
    throw new Error("Completed synthetic shadow report/checkpoint is inconsistent");
  }
  return report;
}

async function requestSyntheticActivationSimulation(
  db: D1Database,
  input: Parameters<typeof readLegacyRoomStateSnapshot>[1],
  expectedSourceDigest: string,
) {
  const current = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(db, input));
  const run = await db.prepare("SELECT status,checkpoint,checksum,payload FROM f03_shadow_runs WHERE hotel_id=?1 AND source_digest=?2 AND mapping_version=?3")
    .bind(current.hotel_id, expectedSourceDigest, current.mapping_version).first<SyntheticShadowRun>();
  if (current.source_digest !== expectedSourceDigest || run?.status !== "COMPLETE" || run.checksum !== current.report_checksum || run.checkpoint !== "COMPLETE") {
    return { allowed: false as const, reason: "STALE_OR_INCOMPLETE_SHADOW" };
  }
  await db.prepare("INSERT INTO f03_shadow_activation_simulations (hotel_id,source_digest,mapping_version,report_checksum,decision) VALUES (?1,?2,?3,?4,'SIMULATED_ALLOWED')")
    .bind(current.hotel_id, current.source_digest, current.mapping_version, current.report_checksum).run();
  return { allowed: true as const, reason: "SYNTHETIC_GUARD_ACCEPTED" };
}

async function syntheticShadowSideEffects(db: D1Database) {
  const [runs, rows, simulatedApprovals, housekeepingEvents, lifecycleEvents] = await Promise.all([
    db.prepare("SELECT * FROM f03_shadow_runs ORDER BY hotel_id,source_digest,mapping_version").all(),
    db.prepare("SELECT * FROM f03_shadow_rows ORDER BY hotel_id,source_digest,mapping_version,room_id").all(),
    db.prepare("SELECT * FROM f03_shadow_activation_simulations ORDER BY hotel_id,source_digest,mapping_version").all(),
    db.prepare("SELECT * FROM housekeeping_events ORDER BY id").all(),
    db.prepare("SELECT * FROM lifecycle_events ORDER BY id").all(),
  ]);
  return { runs: runs.results, rows: rows.results, simulatedApprovals: simulatedApprovals.results, housekeepingEvents: housekeepingEvents.results, lifecycleEvents: lifecycleEvents.results };
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
      db.prepare("CREATE TABLE f03_shadow_runs (hotel_id TEXT NOT NULL, source_digest TEXT NOT NULL, mapping_version TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('INCOMPLETE','STAGING','COMPLETE')), checkpoint TEXT NOT NULL, checksum TEXT, payload TEXT, PRIMARY KEY(hotel_id,source_digest,mapping_version))"),
      db.prepare("CREATE TABLE f03_shadow_rows (hotel_id TEXT NOT NULL, source_digest TEXT NOT NULL, mapping_version TEXT NOT NULL, room_id TEXT NOT NULL, classification TEXT NOT NULL, readiness TEXT NOT NULL, sellability TEXT NOT NULL, PRIMARY KEY(hotel_id,source_digest,mapping_version,room_id))"),
      db.prepare("CREATE TABLE f03_shadow_activation_simulations (hotel_id TEXT NOT NULL, source_digest TEXT NOT NULL, mapping_version TEXT NOT NULL, report_checksum TEXT NOT NULL, decision TEXT NOT NULL, PRIMARY KEY(hotel_id,source_digest,mapping_version))"),
    ]);
    const migrationDigest = sha256(paths.map(path => readFileSync(path, "utf8")).join("\n"));
    const schemaRows = await db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all<{ type: string; name: string; sql: string | null }>();
    const schemaDigest = sha256(JSON.stringify(schemaRows.results));
    const input = { hotel_id: "hotel-synthetic-a", hotel_local_date: date, sellability_range: { start_date: "2026-10-01", end_date: "2026-10-03" }, source_schema_digest: schemaDigest, source_migration_digest: migrationDigest };
    // Pinned against the complete current chain, including F0.8's additive
    // reservation recovery schema; each digest is intentionally recomputed when
    // the forward migration set changes.
    expect(schemaDigest).toBe("e07f44d24dcb3c39b4f978078a9a6bbb870ced3e79f89a8c1b5ea8117eecfe89");
    expect(migrationDigest).toBe("7d43cebbe52f9d186d90c256f5a03d222b217ea742ae27c9911436813c753d0b");
    const snapshot = await readLegacyRoomStateSnapshot(db, input);
    const report = await mapLegacyRoomState(snapshot);
    expect(report.source_digest).toBe("a6eb2714a29767770ef5b9a30e16d5ac649ca3ddd604ad6d07749015a08269af");
    expect(report.report_checksum).toBe("29cb0114519445ce9862036cd16887051754d2011619afd378518f3fc4e33059");
    expect(report).toMatchObject({ input_room_count: 2, output_room_count: 2, accounted_input_record_count: report.input_record_count });
    expect(report.rows.map(row => [row.room_id, row.classification, row.readiness.state, row.date_range_sellability])).toEqual([
      ["ready-room", "MAPPED", "READY_FOR_ARRIVAL", "SELLABLE"],
      ["unknown-room", "REVIEW_REQUIRED", "UNRESOLVED", "UNRESOLVED"],
    ]);

    const canonicalBefore = (await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all()).results;
    await db.prepare("INSERT INTO f03_shadow_runs (hotel_id,source_digest,mapping_version,status,checkpoint,checksum,payload) VALUES (?1,?2,?3,'INCOMPLETE','SOURCE_SNAPSHOT_CAPTURED',NULL,NULL)")
      .bind(report.hotel_id, report.source_digest, report.mapping_version).run();
    // Simulate process loss after the first durable per-hotel checkpoint.
    expect(await db.prepare("SELECT status,checkpoint FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "INCOMPLETE", checkpoint: "SOURCE_SNAPSHOT_CAPTURED" });
    expect((await db.prepare("SELECT * FROM f03_shadow_rows").all()).results).toEqual([]);

    // Inject a failure after one row statement but before the STAGING checkpoint; D1 rolls back the row and status together.
    await expect(stageSyntheticShadowRows(db, report, true)).rejects.toThrow();
    expect((await db.prepare("SELECT * FROM f03_shadow_rows").all()).results).toEqual([]);
    expect(await db.prepare("SELECT status,checkpoint FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "INCOMPLETE", checkpoint: "SOURCE_SNAPSHOT_CAPTURED" });

    // Restart through the recovery helper from SOURCE_SNAPSHOT_CAPTURED and durably commit the second checkpoint.
    const resumedFromSnapshot = await resumeSyntheticShadow(db, input);
    expect(resumedFromSnapshot.report_checksum).toBe(report.report_checksum);
    expect(await db.prepare("SELECT status,checkpoint FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "STAGING", checkpoint: "SHADOW_ROWS_WRITTEN" });
    expect((await db.prepare("SELECT COUNT(*) AS count FROM f03_shadow_rows").first())).toEqual({ count: 2 });
    const replay = await resumeSyntheticShadow(db, input); // process loss after SHADOW_ROWS_WRITTEN; a second restart verifies rows and advances to COMPLETE
    expect(replay.report_checksum).toBe(report.report_checksum);
    expect(await db.prepare("SELECT status,checkpoint,checksum FROM f03_shadow_runs WHERE hotel_id=?1").bind(report.hotel_id).first()).toEqual({ status: "COMPLETE", checkpoint: "COMPLETE", checksum: report.report_checksum });

    // Simulate process loss after the final checkpoint; same-source restart must be idempotent.
    const replayAgain = await resumeSyntheticShadow(db, input);
    expect(replayAgain.report_checksum).toBe(report.report_checksum);
    expect((await db.prepare("SELECT COUNT(*) AS count FROM f03_shadow_rows").first())).toEqual({ count: 2 });
    expect((await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all()).results).toEqual(canonicalBefore);

    // A current digest can pass the synthetic gate, but only a test-scoped marker is written; canonical room/event rows remain read-only.
    expect(await requestSyntheticActivationSimulation(db, input, report.source_digest)).toEqual({ allowed: true, reason: "SYNTHETIC_GUARD_ACCEPTED" });
    expect((await db.prepare("SELECT COUNT(*) AS count FROM f03_shadow_activation_simulations").first())).toEqual({ count: 1 });
    expect((await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all()).results).toEqual(canonicalBefore);

    // Deliberate synthetic source drift makes the old completed report stale.
    await db.prepare("UPDATE rooms SET service_state='OUT_OF_ORDER' WHERE id='ready-room'").run();
    const drifted = await mapLegacyRoomState(await readLegacyRoomStateSnapshot(db, input));
    expect(drifted.source_digest).not.toBe(report.source_digest);
    expect(drifted.rows.find(row => row.room_id === "ready-room")?.date_range_sellability).toBe("NOT_SELLABLE");
    const canonicalAtStaleRequest = (await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all()).results;
    const sideEffectsBeforeStaleRequest = await syntheticShadowSideEffects(db);
    expect(await requestSyntheticActivationSimulation(db, input, report.source_digest)).toEqual({ allowed: false, reason: "STALE_OR_INCOMPLETE_SHADOW" });
    expect(await syntheticShadowSideEffects(db)).toEqual(sideEffectsBeforeStaleRequest);
    expect((await db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all()).results).toEqual(canonicalAtStaleRequest);
    expect((await db.prepare("SELECT status,checkpoint FROM f03_shadow_runs WHERE hotel_id=?1 AND source_digest=?2").bind(report.hotel_id, report.source_digest).first()).status).toBe("COMPLETE");
    // The only canonical change is the deliberate synthetic service-state drift itself.
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='unknown-room'").first()).toEqual({ status: "AVAILABLE", housekeeping_state: null, service_state: null, room_state_version: 0 });
    await db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('case-a','unknown-room','OPEN','NON_BLOCKING','MEDIUM','synthetic issue','operator','2026-09-27T12:00:00.000Z')").run();
    await expect(db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('case-b','unknown-room','OPEN','BLOCKING','HIGH','duplicate synthetic issue','operator','2026-09-27T12:01:00.000Z')").run()).rejects.toThrow();
    const openCases = await db.prepare("SELECT id,status FROM maintenance_cases WHERE room_id='unknown-room'").all<{ id: string; status: string }>();
    expect(openCases.results).toEqual([{ id: "case-a", status: "OPEN" }]);
  }, 30_000);

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
  }, 30_000);

});
