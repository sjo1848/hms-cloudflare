import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const wrangler = resolve("node_modules/.bin/wrangler");
const config = resolve("apps/api/wrangler.jsonc");

export function wranglerRun(args, { capture = false } = {}) {
  const result = spawnSync(wrangler, [...args, "--local", "--config", config], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.status !== 0) throw new Error(`WRANGLER_LOCAL_FAILED: ${args.slice(0, 4).join(" ")}${capture ? `: ${result.stderr.trim()}` : ""}`);
  return result.stdout;
}

export function applyMigrations(binding, persistTo) {
  wranglerRun(["d1", "migrations", "apply", binding, "--persist-to", persistTo]);
}

export function executeFile(binding, persistTo, file) {
  wranglerRun(["d1", "execute", binding, "--persist-to", persistTo, "--file", file, "--yes"]);
}

export function query(binding, persistTo, sql) {
  const stdout = wranglerRun(["d1", "execute", binding, "--persist-to", persistTo, "--command", sql, "--json"], { capture: true });
  const payload = JSON.parse(stdout);
  if (!Array.isArray(payload) || payload.some((entry) => entry.success !== true)) throw new Error(`D1_QUERY_FAILED: ${binding}`);
  return payload;
}
