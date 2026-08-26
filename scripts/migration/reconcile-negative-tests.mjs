#!/usr/bin/env node
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { join, resolve } from "node:path";

const persistTo = resolve(process.argv[2]);
const dbRoot = join(persistTo, "HOTEL_DEMO_DB", "v3", "d1", "miniflare-D1DatabaseObject");
const sqlite = readdirSync(dbRoot).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
assert(sqlite, "hotel database file missing");
const db = new DatabaseSync(join(dbRoot, sqlite));
const runReconcile = () => spawnSync(process.execPath, [resolve("scripts/migration/reconcile.mjs"), "--persist-to", persistTo], {
  encoding: "utf8",
  env: { ...process.env, CF_I09_ISOLATED_PERSISTENCE: "1" },
});
const booking = db.prepare("SELECT id, checked_in_at FROM bookings WHERE checked_in_at IS NOT NULL LIMIT 1").get();
assert(booking, "fixture requires a checked-in booking");
db.prepare("UPDATE bookings SET checked_in_at=? WHERE id=?").run("2099-01-01T00:00:00.000Z", booking.id);
assert.notEqual(runReconcile().status, 0, "timestamp tamper unexpectedly reconciled");
db.prepare("UPDATE bookings SET checked_in_at=? WHERE id=?").run(booking.checked_in_at, booking.id);
const event = db.prepare("SELECT id, actor_subject FROM lifecycle_events WHERE id=?").get(`migration:checkin:${booking.id}`);
assert(event, "fixture lifecycle event missing");
db.prepare("UPDATE lifecycle_events SET actor_subject=? WHERE id=?").run("tampered-actor", event.id);
assert.notEqual(runReconcile().status, 0, "lifecycle actor tamper unexpectedly reconciled");
db.prepare("UPDATE lifecycle_events SET actor_subject=? WHERE id=?").run(event.actor_subject, event.id);
db.close();
process.stdout.write("CF-I09 lifecycle reconciliation adversarial tamper tests: PASS\n");
