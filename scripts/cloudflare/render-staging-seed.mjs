#!/usr/bin/env node
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildControlSql,
  buildHotelSql,
  loadFixture,
  validateFixture,
} from "../migration/migration-core.mjs";
import { BINDINGS } from "../migration/source-target-map.mjs";

const output = resolve(process.argv[2] ?? ".staging-seed");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const fixture = await loadFixture();
const { source_digest: sourceDigest } = validateFixture(fixture);
await writeFile(`${output}/CONTROL_DB.sql`, buildControlSql(fixture, sourceDigest), { mode: 0o600 });
for (const hotel of fixture.hotels) {
  const binding = BINDINGS[hotel.id];
  if (!binding) throw new Error(`missing D1 binding for hotel ${hotel.id}`);
  await writeFile(`${output}/${binding}.sql`, buildHotelSql(fixture, hotel.id, sourceDigest), { mode: 0o600 });
}
process.stdout.write(`STAGING_SEED_RENDERED: ${output}\n`);
