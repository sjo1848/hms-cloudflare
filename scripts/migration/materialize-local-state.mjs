#!/usr/bin/env node
// The migration runner uses one persistence directory per D1 binding to avoid
// Wrangler/Miniflare's repeated-process lock contention.  Wrangler dev, on
// the other hand, owns all bindings in one process and expects its normal
// shared persistence root.  Materialise the completed databases into that
// root before starting the Worker; this keeps both paths on the same bytes.
import { mkdir, readdir, copyFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(process.argv[2] ?? "apps/api/.wrangler/state");
const destination = resolve(process.argv[3] ?? root);
const bindings = ["CONTROL_DB", "HOTEL_DEMO_DB", "HOTEL_SECOND_DB"];
const target = join(destination, "v3", "d1", "miniflare-D1DatabaseObject");
await mkdir(target, { recursive: true });

for (const binding of bindings) {
  const source = join(root, binding, "v3", "d1", "miniflare-D1DatabaseObject");
  const files = (await readdir(source)).filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
  if (files.length !== 1) throw new Error(`LOCAL_STATE_MATERIALIZE_FAILED: expected one database for ${binding}, found ${files.length}`);
  // Only the main database file is copied.  WAL/SHM sidecars are process
  // state and must not be carried into the single-process Worker runtime.
  const sourceFile = join(source, files[0]);
  const sourceDb = new DatabaseSync(sourceFile);
  sourceDb.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  sourceDb.close();
  await rm(join(target, files[0]), { force: true });
  await copyFile(sourceFile, join(target, files[0]));
}

process.stdout.write(`LOCAL_STATE_MATERIALIZED: ${root}\n`);
