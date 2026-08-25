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

No remote, paid, production, or real-data operation was performed.
