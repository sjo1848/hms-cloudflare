import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
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
  wranglerRun(["d1", "migrations", "apply", binding, "--persist-to", persistPath(binding, persistTo)]);
}

export function executeFile(binding, persistTo, file) {
  const dbRoot = join(persistPath(binding, persistTo), "v3", "d1", "miniflare-D1DatabaseObject");
  try {
    const sqlite = readdirSync(dbRoot).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
    if (sqlite) {
      const db = new DatabaseSync(join(dbRoot, sqlite));
      db.exec(readFileSync(file, "utf8"));
      db.close();
      return;
    }
  } catch {
    // Fall through to Wrangler when the local database has not initialized.
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
    const file = readdirSync(dbRoot).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
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
