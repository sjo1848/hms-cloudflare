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
