# CF-I04 — External Independent Critic

Reviewed implementation artifact: `32b5070dbd80b4b4d3667fe45573f8851cb60a7c`
Published state head before review: `855d0515716949284309da000e99c8037a113b27`
Reviewer: ChatGPT External Independent Critic
Verdict: `REWORK`
Human Gate: `NONE`
Diagnosis: `EXECUTION_DEFECT + EVIDENCE_DEFECT`

## What is correct

- Reception lifecycle is implemented as explicit domain endpoints rather than generic status CRUD.
- Check-in requires the four accepted confirmations and records actor/request/hotel lifecycle trace data.
- Reassignment validates destination room/holds/claims before the mutation candidate.
- Checkout records the transition, releases claims and hands the room to DIRTY on the ordinary success path.
- `RUNTIME_CAPABILITY_FALLBACK` is explicit; no false specialist execution is claimed.
- The ordinary D1/API lifecycle journey and persisted browser reassignment/checkout journey are useful evidence.

## Blocking findings

### P1 — Post-batch `changes` guards cannot guarantee lifecycle rollback and permit state corruption under concurrency

D1 `batch()` rolls back when a statement fails. A guarded `UPDATE` that affects zero rows is still a successful SQL statement. CF-I04 checks critical `meta.changes` only after `await db.batch(...)` has completed.

This violates the Task Contract requirement that lifecycle operations remain atomic and that failed/conflicting mutations leave no partial state.

Concrete failure modes:

1. **Concurrent reassignment can corrupt booking/claims/room state.** Two requests may both read booking A as `CHECKED_IN` in room A. If request 1 reassigns A→B, request 2 A→C can later execute a batch where the guarded booking UPDATE affects 0 rows, but the following unconditional claim DELETE removes request 1's B claims, new C claims are inserted, room C is marked OCCUPIED and a lifecycle event is written. The route then observes `results[0].meta.changes !== 1` and returns 409 after the mutations have already committed. Booking can remain on B while claims point to C.
2. **Check-in can strand room state/audit after a stale booking guard.** If a confirmed booking is cancelled or otherwise invalidated after the pre-read but before the batch, the guarded booking transition can affect 0 rows while a room UPDATE and lifecycle event still succeed; the route then returns 409 after committed side effects.
3. **Checkout can return conflict after committed lifecycle mutations** when the booking update and room-state update do not agree under a concurrent transition, because the post-batch check cannot retroactively roll back a successful batch.

Required repair:
- make concurrency preconditions fail *inside* the D1 transaction rather than only inspecting zero-row results after commit;
- no destructive statement may execute when the lifecycle transition guard is stale;
- use SQL constraints/guards or an explicit D1 transaction-safe mechanism that causes the batch itself to fail and roll back on invariant violation;
- add repeatable regression cases for stale/zero-row check-in, concurrent reassignment, and checkout invalidation proving booking, claims, room states and lifecycle events remain unchanged after conflict.

### P1 — Current D1/API regression does not exercise the concurrency/zero-row atomicity cases required by the contract

`npm run test:cf-i04` aliases `scripts/cf-i03-regression.sh`. That script does contain ordinary CF-I04 lifecycle coverage, but its failed reassignment is rejected during the preflight hold check. It does not invalidate state between the pre-read and the batch and therefore does not test the post-batch guard defect above.

Required repair:
- persist executable adversarial regression that forces stale lifecycle guards / conflicting mutation ordering and verifies complete preservation of booking, old/new claims, room states and lifecycle event count;
- keep ordinary checklist, hold, success, checkout and CF-I03 regression coverage.

### P1 — Required browser acceptance evidence is incomplete

The CF-I04 Task Contract requires browser-testable walk-in/check-in, reassignment and checkout plus accepted widths `375/390/430/768/1024` and observable validation/error/success states. `scripts/cf-i04-browser-regression.mjs` starts from an already `CheckedIn` booking, exercises reassignment and checkout only, and does not set or iterate the required viewport widths.

Required repair:
- browser evidence must include the check-in checklist journey from `Confirmed` to `CheckedIn`;
- exercise the required responsive widths `375`, `390`, `430`, `768`, and `1024`;
- assert lifecycle validation/error and success surfaces, not only that POST calls occurred;
- preserve the existing reassignment and checkout journey.

### P1 — Lifecycle-specific authorization / tenant adversarial evidence is not demonstrated

The Task Contract explicitly requires QA/security evidence that forbidden roles, unknown bindings and cross-tenant lifecycle IDs fail closed. The current lifecycle regression uses one authorized admin membership and does not exercise forbidden lifecycle calls or a second tenant context.

The implementation benefits from the existing routing boundary, but inherited architecture is not sufficient evidence for this increment's required acceptance.

Required repair:
- add lifecycle-specific forbidden-role evidence;
- add unknown-binding and/or second-hotel lifecycle reference attempts showing fail-closed behavior;
- verify rejected attempts produce no lifecycle events or operational mutation.

## Non-blocking observations

- `test:cf-i04` currently aliases the historical `cf-i03-regression.sh`; after repair, prefer a CF-I04-named harness or a clearly composed regression command so evidence ownership remains obvious.
- `0005_reception_lifecycle.sql` again uses `PRAGMA foreign_keys = OFF/ON`; follow the existing D1 migration note and prefer D1-compatible deferral/no toggle when appropriate.

## Method verdict

This is routine technical REWORK, not a Human Gate. No product intent, cost, architecture, irreversible-risk or scope decision is required.

Under the autonomous execution policy, Codex should consume this review directly, repair CF-I04, run adversarial QA/browser/full validation, publish the next immutable artifact, and stop only at the next Independent Critic boundary (or a legitimate Human Gate/blocker/Product Acceptance boundary). The Human must not be used as a message bus or asked to approve this routine repair.

Do not advance to CF-I05 until CF-I04 obtains Independent Critic PASS.
