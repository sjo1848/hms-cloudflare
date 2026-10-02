# HMS Staging Preflight — Executing-D1 Timeout Repair Contract

Status: `FROZEN BEFORE TEST EDITS`

## Authority and base

- Controller decision: `BOUNDED_REWORK_THEN_RESUME_STAGING` in Issue #52.
- Authorized source checkpoint: `2c3b366e4a0e37b66cdbf5743b01713fe21e059a`.
- Purpose: distinguish default Vitest timeout exhaustion from a Rooms runtime defect and, only after repeated diagnostic passes, prevent these integration tests from being falsely failed by the 5 s default.

## Scope

Only these executing-D1 test files may change:

- `apps/api/src/modules/room-state/room-state-route.executing-d1.test.ts`
- `apps/api/src/modules/room-state/shared-room-commands.executing-d1.test.ts`

If the six diagnostic executions all pass without `fetch failed`, set an explicit 15 s timeout on only the identified test(s). Do not change assertions, setup, fixtures, product/API/domain/schema code, global Vitest configuration, application code or budgets. If a functional assertion/runtime failure or `fetch failed` occurs under the temporary 20 s diagnostic timeout, stop with `STAGING_DEPLOY_GATE_REQUIRED_RUNTIME_FAILURE` and do not apply the timeout repair.

## Acceptance

1. Each identified test passes three consecutive isolated executions with `--maxWorkers=1 --testTimeout=20000` and no `fetch failed` output.
2. After the bounded timeout annotation, both tests pass three consecutive isolated executions with `--maxWorkers=1`.
3. `npm run check` passes with the unchanged global Vitest timeout.
4. The final diff contains only this contract/evidence plus the two named test files; assertions and runtime behavior are byte-for-byte unchanged apart from timeout annotations.
5. This repair alone does not authorize staging movement. All remaining staging preflight gates and ancestry checks must pass first.

## Diagnostic results before edit

Recorded in `.orchestration/evidence/HMS-STAGING-PREFLIGHT-D1-TIMEOUT-REPAIR-001.md` before any test edit.
