# CF-I09 runtime isolation log

Recorded 2026-08-25 before any Artifact A2 publication.

| Component | Observed value |
|---|---|
| Node | v24.18.0 |
| npm | 12.0.2 |
| Wrangler | 4.125.0 |
| Miniflare | 5.20260820.0-alpha |
| workerd | 1.20260820.1 |
| Host | Linux 6.12.95+deb13-amd64 x86_64 |

## Isolation results

- Fresh D1 persist directory, `HOTEL_SECOND_DB`, 14 migrations: PASS in 11 seconds.
- Fresh D1 persist directory, `SELECT 1`: PASS in 4 seconds.
- Fresh D1 persist directory, full `rehearse.mjs` across CONTROL_DB + HOTEL_DEMO_DB + HOTEL_SECOND_DB: PASS in 46 seconds under Wrangler 4.125.0.
- No Wrangler version bisect was started because the current version passes the minimal and isolated full rehearsal. The earlier hang is therefore being investigated as shared-persistence/process contention, not yet attributed to Wrangler.
- Full `test-rehearsal.sh` with a clean temporary persist directory and a 600-second outer timeout: PASS (preflight, timezone, clean/replay/partial/reconcile determinism and migration Vitest 2/2).
- `npm run check`, `npm run types:check`, `npm run web:build`: PASS (24 tests, generated types and production build).
- Inherited CF-I03, CF-I04, CF-I05, CF-I06, CF-I07 and CF-I08 API regressions: PASS.
- The first integrated smoke attempt exposed a stale acceptance expectation: the browser used an ordinary hotel admin for network-only routes. The acceptance profile now explicitly includes `Network · SaaS Admin`, persists the selected local profile across navigation, and the clean browser/API smoke rerun passes.

No remote, paid, production, or real-data operation was performed.

## REWORK-2 bounded diagnosis (2026-08-25)

- Fresh single-binding `d1 migrations apply` plus `SELECT 1` remains PASS under Wrangler 4.125.0.
- Fresh three-binding runs were initially non-deterministic under the installed runtime: repeated Wrangler child invocations shared a process-wide Miniflare lock. The runner now invokes Wrangler's real Node entrypoint and, for focal rehearsal, uses stable binding-local persistence roots and one-binding configs. A clean three-binding rehearsal and exact reconciliation complete successfully.
- The same behavior reproduces with direct `node_modules/.bin/wrangler` invocations, so it is not caused by the migration SQL or the Node wrapper alone. It is isolated to shared Miniflare persistence across three D1 bindings in the installed runtime.
- Node `v24.18.0`, npm `12.0.2`, Wrangler `4.125.0`, Miniflare `5.20260820.0-alpha`, workerd `1.20260820.1` were recorded from the active installation. `npx wrangler@4.124.0` and `@4.126.0` could not be fetched within a 30-second bounded attempt, so no version claim is made.
- The workaround is limited to local rehearsal tooling; product bindings and topology remain unchanged. No remote, paid, production or real-data operation was performed.
