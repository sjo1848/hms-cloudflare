#!/usr/bin/env node
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { BINDINGS, REHEARSAL_ID } from "./source-target-map.mjs";
import { buildControlSql, buildHotelSql, loadFixture, validateFixture } from "./migration-core.mjs";
import { applyMigrations, executeFile, query } from "./wrangler-local.mjs";

function options(argv) {
  const result = { persistTo: resolve("apps/api/.wrangler/state"), fixture: null, failAfterControl: false };
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === "--persist-to") result.persistTo = resolve(argv[++index]);
    else if (argv[index] === "--fixture") result.fixture = resolve(argv[++index]);
    else if (argv[index] === "--fail-after-control") result.failAfterControl = true;
    else throw new Error(`unknown argument ${argv[index]}`);
  }
  return result;
}

async function main() {
  const selected = options(process.argv.slice(2));
  const fixture = await loadFixture(selected.fixture);
  const { source_digest: sourceDigest } = validateFixture(fixture);
  const bindings = ["CONTROL_DB", ...Object.values(BINDINGS)];
  for (const binding of bindings) applyMigrations(binding, selected.persistTo);
  const prior = bindings.map((binding) => {
    const rows = query(binding, selected.persistTo, `SELECT COUNT(*) AS count FROM migration_rehearsals WHERE rehearsal_id='${REHEARSAL_ID}'`);
    return { binding, count: Number(rows[0].results[0].count) };
  });
  if (prior.some((row) => row.count !== 0)) throw new Error(`MIGRATION_REPLAY_REFUSED_BEFORE_BUSINESS_MUTATION: ${prior.map((x) => `${x.binding}=${x.count}`).join(",")}`);
  const work = await mkdtemp(join(tmpdir(), "hms-cf-i09-"));
  const controlFile = join(work, "control.sql");
  await writeFile(controlFile, buildControlSql(fixture, sourceDigest), { mode: 0o600 });
  executeFile("CONTROL_DB", selected.persistTo, controlFile);
  if (selected.failAfterControl) throw new Error("INJECTED_MIGRATION_FAILURE_AFTER_CONTROL: partial run is not reconciled or successful");
  for (const hotel of [...fixture.hotels].sort((a, b) => a.id.localeCompare(b.id))) {
    const file = join(work, `${BINDINGS[hotel.id]}.sql`);
    await writeFile(file, buildHotelSql(fixture, hotel.id, sourceDigest), { mode: 0o600 });
    executeFile(BINDINGS[hotel.id], selected.persistTo, file);
  }
  process.stdout.write(`${JSON.stringify({ status: "APPLIED", rehearsal_id: REHEARSAL_ID, source_digest: sourceDigest, bindings })}\n`);
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
