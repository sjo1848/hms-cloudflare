#!/usr/bin/env node

// Read-only audit of the pinned source migration set.  The source repository is
// intentionally not vendored into the target; pass its checkout root explicitly.
// This prevents a target schema grep from being mistaken for a source audit.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const baseline = "4df56a6217caab611f2f5fcbd98bde8386bb5629";
const sourceRoot = process.argv[2] ?? process.env.HMS_SOURCE_ROOT;
if (!sourceRoot) {
  console.error("usage: node scripts/migration/nullable-actor-audit.mjs <source-checkout-root>");
  process.exit(2);
}

const expected = new Map([
  ["0001", ["audit_events.user_id", "refresh_tokens.user_id"]],
  ["0009", ["cash_closures.user_id"]],
  ["0020", ["room_holds.created_by_user_id"]],
  ["0022", ["bookings.checked_in_by_user_id", "bookings.checked_out_by_user_id"]],
  ["0024", ["payment_entries.received_by_user_id"]],
  ["0026", ["bookings.terminal_recorded_by_user_id", "bookings.late_arrival_recorded_by_user_id"]],
  ["0027", ["maintenance_cases.reported_by_user_id", "maintenance_cases.resolved_by_user_id"]],
  ["0028", ["maintenance_cases.reported_by_user_id"]],
]);

const fileFor = (n) => join(sourceRoot, "backend", "migrations", `${n}_`);
const files = new Map();
for (let i = 1; i <= 30; i += 1) {
  const n = String(i).padStart(4, "0");
  const { stdout } = await import("node:child_process").then(({ execFileSync }) => ({
    stdout: execFileSync("find", [join(sourceRoot, "backend", "migrations"), "-maxdepth", "1", "-name", `${n}_*.sql`], { encoding: "utf8" }).trim(),
  }));
  if (!stdout) throw new Error(`missing source migration ${n} at pinned baseline ${baseline}`);
  files.set(n, stdout);
}

const read = async (path) => readFile(path, "utf8");
for (const [n, surfaces] of expected) {
  const sql = await read(files.get(n));
  for (const surface of surfaces) {
    const [, table, column] = surface.match(/^([^\.]+)\.(.+)$/);
    if (!new RegExp(`\\b${table}\\b`, "i").test(sql) || !new RegExp(`\\b${column}\\b`, "i").test(sql)) {
      throw new Error(`${n}: expected source surface ${surface} not found in ${files.get(n)}`);
    }
  }
}

const sql0022 = await read(files.get("0022"));
const sql0026 = await read(files.get("0026"));
const sql0028 = await read(files.get("0028"));
if (!/checked_in_by_user_id\s+UUID\s*,[\s\S]*checked_out_by_user_id\s+UUID/i.test(sql0022)) {
  throw new Error("0022: lifecycle actor columns are not nullable UUIDs");
}
if (!/terminal_recorded_by_user_id\s+UUID[\s\S]*late_arrival_recorded_by_user_id\s+UUID/i.test(sql0026)) {
  throw new Error("0026: arrival-exception actor columns are not nullable UUIDs");
}
if (!/reported_by_user_id\s+DROP\s+NOT\s+NULL/i.test(sql0028)) {
  throw new Error("0028: legacy maintenance reporter relaxation is missing");
}

console.log(JSON.stringify({ status: "PASS", source_baseline: baseline, migrations: 30, actor_surface_migrations: [...expected.keys()] }));
