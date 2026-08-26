import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Invoke Wrangler's real Node entrypoint. The .bin shell shim leaves the
// Miniflare child attached to a synchronous parent on repeated D1 calls,
// which can hang the third binding. Direct exec gives each child a clean
// lifecycle while retaining the same installed Wrangler version.
const wrangler = resolve("node_modules/wrangler/wrangler-dist/cli.js");
const configs = {
  CONTROL_DB: resolve("apps/api/wrangler.control-local.jsonc"),
  HOTEL_DEMO_DB: resolve("apps/api/wrangler.hotel-local.jsonc"),
  HOTEL_SECOND_DB: resolve("apps/api/wrangler.hotel-second-local.jsonc"),
};
const databaseFiles = {
  CONTROL_DB: "a36f84ea60804f30bb0c7f7cad9f5336a6cca0165abdab8b9241d93dbf0b6006.sqlite",
  HOTEL_DEMO_DB: "3dd27f64a8e6b7092b4dc42ea2a5f93d01d65d27a0f4927b2e4bc344a6a2f6f6.sqlite",
  HOTEL_SECOND_DB: "374ae31b0276edfb52cf0c3fe3f8b1712cac94c97c4f163773aedbe6cbf2938e.sqlite",
};
const migrations = {
  CONTROL_DB: "apps/api/schema/control-migrations",
  HOTEL_DEMO_DB: "apps/api/schema/hotel-migrations",
  HOTEL_SECOND_DB: "apps/api/schema/hotel-migrations",
};

// Miniflare's local persistence lock is process-wide for a directory.  A
// migration rehearsal invokes Wrangler once per D1 binding; keeping each
// binding in its own stable subdirectory avoids cross-binding lock
// contention while preserving a single caller-owned persistence root.
export function persistPath(binding, persistTo) {
  return process.env.CF_I09_ISOLATED_PERSISTENCE === "1"
    ? resolve(persistTo, binding)
    : resolve(persistTo);
}

export function wranglerRun(args, { capture = false } = {}) {
  const binding = args[1] === "migrations" ? args[3] : args[2];
  const config = configs[binding] ?? resolve("apps/api/wrangler.jsonc");
  const result = spawnSync(process.execPath, [wrangler, ...args, "--local", "--config", config], {
    encoding: "utf8",
    // Keep Wrangler's very verbose migration progress off the parent stream.
    // This also prevents the synchronous runner from deadlocking on a full
    // inherited PTY/pipe while Miniflare is still flushing its local state.
    stdio: capture ? ["ignore", "pipe", "pipe"] : "ignore",
  });
  if (result.status !== 0) throw new Error(`WRANGLER_LOCAL_FAILED: ${args.slice(0, 4).join(" ")}${capture ? `: ${result.stderr.trim()}` : ""}`);
  return result.stdout;
}

export function applyMigrations(binding, persistTo) {
  // Applying migrations through three sequential Wrangler/Miniflare
  // processes is the known 4.125 shared-persistence hang. D1's local store
  // is SQLite, so apply the checked-in migration files directly and leave
  // Wrangler only for the single-process Worker runtime.
  const root = persistPath(binding, persistTo);
  const dbRoot = join(root, "v3", "d1", "miniflare-D1DatabaseObject");
  mkdirSync(dbRoot, { recursive: true });
  const db = new DatabaseSync(join(dbRoot, databaseFiles[binding]));
  db.exec("CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)");
  const applied = new Set(db.prepare("SELECT id FROM d1_migrations").all().map((row) => Number(row.id)));
  const files = readdirSync(resolve(migrations[binding])).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
  for (const name of files) {
    const id = Number(name.slice(0, 4));
    if (applied.has(id)) continue;
    db.exec(readFileSync(resolve(migrations[binding], name), "utf8"));
    db.prepare("INSERT INTO d1_migrations (id,name,applied_at) VALUES (?,?,datetime('now'))").run(id, name);
  }
  db.close();
}

export function executeFile(binding, persistTo, file) {
  const dbRoot = join(persistPath(binding, persistTo), "v3", "d1", "miniflare-D1DatabaseObject");
  try {
    const sqlite = databaseFiles[binding] ?? readdirSync(dbRoot).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
    if (sqlite) {
      const db = new DatabaseSync(join(dbRoot, sqlite));
      db.exec(readFileSync(file, "utf8"));
      db.close();
      return;
    }
  } catch (error) {
    if (error?.code === "ERR_INVALID_ARG_TYPE" || error?.code === "ENOENT") {
      // Fall through to Wrangler when the local database has not initialized.
    } else {
      throw error;
    }
  }
  wranglerRun(["d1", "execute", binding, "--persist-to", persistPath(binding, persistTo), "--file", file, "--yes"]);
}

export function query(binding, persistTo, sql) {
  // D1 read commands are pure SELECTs in rehearsal/reconciliation. Read the
  // binding's isolated SQLite file directly so repeated queries do not keep
  // Miniflare workers alive in the same Node parent (the Wrangler CLI 4.125
  // shim otherwise hangs on the second captured query).
  const dbRoot = join(persistPath(binding, persistTo), "v3", "d1", "miniflare-D1DatabaseObject");
  try {
    const file = databaseFiles[binding] ?? readdirSync(dbRoot).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
    if (file) {
      const db = new DatabaseSync(join(dbRoot, file));
      const results = db.prepare(sql).all();
      db.close();
      return [{ results, success: true, meta: { duration: 0 } }];
    }
  } catch {
    // Fall through to Wrangler for a not-yet-created database or unsupported
    // local layout; the normal error path remains explicit below.
  }
  const stdout = wranglerRun(["d1", "execute", binding, "--persist-to", persistPath(binding, persistTo), "--command", sql, "--json"], { capture: true });
  const payload = JSON.parse(stdout);
  if (!Array.isArray(payload) || payload.some((entry) => entry.success !== true)) throw new Error(`D1_QUERY_FAILED: ${binding}`);
  return payload;
}
