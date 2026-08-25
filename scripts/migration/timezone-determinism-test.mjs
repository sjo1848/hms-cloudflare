import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildHotelSql,
  digestFixture,
  loadFixture,
  validateFixture,
} from "./migration-core.mjs";

if (process.argv.includes("--child")) {
  const fixture = await loadFixture();
  // PostgreSQL TIMESTAMP (no zone) must mean UTC regardless of host TZ.
  fixture.bookings[1].checked_in_at = "2026-08-24T12:34:56.789";
  fixture.bookings[1].late_arrival_recorded_at = "2026-08-24T08:00:00";
  // PostgreSQL TIMESTAMPTZ retains the instant represented by its offset.
  fixture.bookings[1].created_at = "2026-08-02T14:00:00-03:00";
  validateFixture(fixture);
  const hotelId = fixture.hotels[0].id;
  const sql = buildHotelSql(fixture, hotelId, digestFixture(fixture));
  assert.match(sql, /2026-08-24T12:34:56\.789Z/);
  assert.match(sql, /2026-08-24T08:00:00\.000Z/);
  assert.match(sql, /2026-08-02T17:00:00\.000Z/);
  process.stdout.write(`${createHash("sha256").update(sql).digest("hex")}\n`);
} else {
  const path = fileURLToPath(import.meta.url);
  const hashFor = (timezone) => {
    const result = spawnSync(process.execPath, [path, "--child"], {
      encoding: "utf8",
      env: { ...process.env, TZ: timezone },
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const utcHash = hashFor("UTC");
  const buenosAiresHash = hashFor("America/Argentina/Buenos_Aires");
  assert.equal(utcHash, buenosAiresHash);
  process.stdout.write(
    `CF-I09 timezone-independent SQL hash ${utcHash}: PASS\n`,
  );
}
