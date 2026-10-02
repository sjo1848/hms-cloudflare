# Staging Preflight Executing-D1 Timeout Repair Evidence

Controller direction: Issue #52, `CONTROLLER_DECISION: BOUNDED_REWORK_THEN_RESUME_STAGING`.

Exact diagnostic base: `2c3b366e4a0e37b66cdbf5743b01713fe21e059a`.

The source worktree was clean and detached at the exact base before diagnosis. No product/API/domain/schema files were edited. Both tests were run serially as separate Vitest processes using `--maxWorkers=1 --testTimeout=20000`, three consecutive executions each. “Vitest test” is the test duration reported by Vitest; “process” is wall time including CLI startup. `fetch failed` was absent in all six logs.

| Test | Run | Result | Vitest test duration | Process wall time | `fetch failed` |
|---|---:|---|---:|---:|---|
| `room-state-route.executing-d1.test.ts` | 1 | PASS | 8.079 s | 22.597 s | No |
| `room-state-route.executing-d1.test.ts` | 2 | PASS | 5.088 s | 8.944 s | No |
| `room-state-route.executing-d1.test.ts` | 3 | PASS | 4.409 s | 7.257 s | No |
| `shared-room-commands.executing-d1.test.ts` | 1 | PASS | 2.634 s | 5.130 s | No |
| `shared-room-commands.executing-d1.test.ts` | 2 | PASS | 2.504 s | 4.847 s | No |
| `shared-room-commands.executing-d1.test.ts` | 3 | PASS | 3.276 s | 5.794 s | No |

Exact logs are in the external temporary directory `/tmp/hms-staging-d1-recheck/` and are not part of the repository. The route test consistently needs more than the default 5 s under two diagnostic runs; all six complete successfully without functional/runtime errors when given 20 s. This supports a test-harness timeout-only diagnosis, not a Rooms product failure.

Authorized next step: add explicit 15 s timeout annotations only to the two identified test declarations, with all assertions and behavior unchanged; repeat both tests three times and rerun the complete `npm run check`. No staging deployment has been initiated.

## Post-repair verification

The only code edits are the explicit `15_000` ms per-test arguments on the same two test declarations. No global timeout, assertion, fixture, setup, product code or schema changed.

| Test | Run | Result | Vitest test duration | Process wall time | `fetch failed` |
|---|---:|---|---:|---:|---|
| `room-state-route.executing-d1.test.ts` | 1 | PASS | 4.242 s | 7.074 s | No |
| `room-state-route.executing-d1.test.ts` | 2 | PASS | 4.256 s | 7.026 s | No |
| `room-state-route.executing-d1.test.ts` | 3 | PASS | 5.250 s | 8.028 s | No |
| `shared-room-commands.executing-d1.test.ts` | 1 | PASS | 2.992 s | 5.588 s | No |
| `shared-room-commands.executing-d1.test.ts` | 2 | PASS | 2.970 s | 5.412 s | No |
| `shared-room-commands.executing-d1.test.ts` | 3 | PASS | 2.873 s | 5.434 s | No |

Full check attempt 1: `npm run check` did not pass on this loaded run. Two unrelated executing-D1 limits expired (reassignment ABA at its existing 20 s test timeout, and reservation-creation `beforeAll` at its existing 30 s hook timeout). The two repaired tests both passed during that attempt. No edits were made to those unrelated tests. Full check attempt 2: `npm run check` PASS, 35/35 files and 175/175 tests, including all seven reservation-creation tests and all fourteen reassignment tests; Vitest duration 119.29 s. Global test/hook timeouts were unchanged. This confirms the unrelated first-attempt limits were transient runner-load timeouts, not reproducible assertion failures.

Staging remains unmoved. Continue with the other required staging preflight gates; any failing gate blocks advancing `acceptance/staging`.

## Remaining local staging preflight gates

All commands ran on the repair branch descended from the authorized source SHA, with only the test timeout annotations and this orchestration contract/evidence added:

- `npm ci`: PASS (from exact-source preflight; no dependency manifests/lockfiles changed).
- `npm run check`: PASS on second full run, 35 files / 175 tests; first full run's unrelated resource timeouts and successful rerun are recorded above.
- `npm run web:build`: PASS; Vite production build completed. Output: JS 338,266 B raw / 95,036 B gzip; CSS 56,587 B raw / 10,490 B gzip.
- `npm run architecture:fitness`: PASS after the build (architecture I/II, i18n coverage and budgets). An initial invocation before `web:build` failed because `apps/web/dist/assets` did not exist; the CI-defined order (build then fitness) passed.
- `npm run types:check`: PASS; API and Web Wrangler types are up to date.
- `npm run test:d1-query-plan`: PASS; arrival index `idx_bookings_status`, checkout index `idx_bookings_status_checkout`, inventory keyed.
- `npm run wrangler:dry-run`: PASS for API and ordinary Web Workers.
- `npx wrangler deploy --dry-run -c apps/web/wrangler.staging.jsonc`: PASS for staging Web Worker.
- Staging API config renderer plus `npx wrangler deploy --dry-run --config apps/api/wrangler.staging.generated.jsonc`: PASS with dummy D1 IDs and dummy Access audience. Output showed only `hms-control-staging`, `hms-hotel-demo-staging`, and `hms-hotel-second-staging` bindings and staging auth flags; no network deploy occurred.

The authorization's source bundle baseline is JS 338,266 B raw / 95,036 B gzip and CSS 56,587 B raw / 10,490 B gzip. Result is identical (delta 0 B / 0% for each measurement); the change is test timeouts and orchestration evidence only. Active ceilings pass: JS 350,000 / 100,000 B and CSS 60,000 / 15,000 B.

No credentials were inspected or used by these dry-runs. No remote migration, D1, Access application, Worker, or staging data was changed. The final pre-push check must still verify the staging ref is unchanged, exact descendant ancestry, clean repair worktree, and exact repaired SHA.
