# CF-I05 REWORK-1 — External Independent Critic

Reviewed artifact: `14915f79c77ca688cafd5e50da4398b0cf57d113`  
Reviewer: ChatGPT External Independent Critic  
Verdict: `REWORK`  
Human Gate: `NONE`  
Diagnosis: `ABA_CONCURRENCY_DEFECT + MOBILE_UX_PARITY_DEFECT + EVIDENCE_OVERCLAIM`

## Summary

REWORK-1 materially improves CF-I05. The simple stale/concurrent cleaning and maintenance-resolution races are now rejected with one durable event, legacy recovery retains reporter/resolver ownership, the active UI is queue-oriented with per-room drafts, and a committed local API/D1-backed browser harness exists.

The artifact still cannot PASS because one aggregate-state ABA race remains in maintenance resolution, the mobile interaction model still does not preserve the accepted source focused-task behavior, and the browser evidence claims more than the committed harness proves. These are bounded routine repairs. No Human Gate is required and CF-I06 remains unauthorized until a fresh CF-I05 PASS.

## Blocking findings

### P1 — Stale resolver can mutate a new maintenance cycle after ABA re-entry

`POST /housekeeping/:id/dirty` pre-reads the current room and open maintenance case outside the D1 batch, then the batch:

1. conditionally resolves the pre-read case;
2. conditionally changes any `MAINTENANCE` room with that ID to `DIRTY`;
3. inserts `MAINTENANCE_RESOLVE` when the immediately preceding room UPDATE changed one row.

The room UPDATE is not correlated to the same maintenance case that this request actually resolved.

A valid serialized interleaving is:

1. stale request B reads room `MAINTENANCE` with open case K1;
2. request A resolves K1 and returns the room to `DIRTY`;
3. request C opens a new maintenance case K2 and moves the same room back to `MAINTENANCE`;
4. B's batch runs: K1 UPDATE affects 0 rows because K1 is already resolved; the room UPDATE succeeds because the room is again `MAINTENANCE`; event gating sees `changes()=1` and inserts a resolve event referencing K1;
5. the existing trigger accepts it because the room is `DIRTY` and K1 is `RESOLVED`; it does not reject the still-open K2.

Result: B can return success, the room becomes `DIRTY`, and the newer K2 remains `OPEN`. This breaks the contract requirement that case resolution and room transition represent the same atomic business operation.

Required repair:
- correlate the room transition and final event to the exact case resolution won by the current operation, not merely to room state;
- ensure a stale resolver cannot close/transition across a newer open case or an ABA `MAINTENANCE -> DIRTY -> MAINTENANCE` cycle;
- add a deterministic regression for K1 resolve -> K2 reopen -> stale K1 resolve attempt, asserting K2 remains OPEN, room remains MAINTENANCE, K1 is unchanged, no extra resolve event is created and stale request/operation does not succeed;
- refine `INV-ATOMIC-001` / Pre-Critic mutation sweep so multi-entity mutations test identity/version/correlation and ABA re-entry, not only zero-row races with the same final state.

### P1 — Mobile Housekeeping still does not preserve the accepted focused-task interaction model

The source HMS mobile Housekeeping surface exposes a `Siguiente tarea` region with an explicit `Abrir` action. Selecting it opens the room task in a bottom `Sheet`/dialog; the queue remains a queue and the selected task becomes a focused mobile workspace.

The target now has the right high-level queue -> selected-room structure on desktop, but below 768px it simply stacks the queue and room workspace in one document. Its `Siguiente tarea` button only cycles `selectedId`; it does not open/focus a distinct task surface or move the operator into the selected task. With a long queue, the actual controls remain below the queue.

This is still a material mobile interaction departure under `CF-UX-PARITY-001` / `INV-UX-001`, not a pixel-level difference.

Required repair:
- preserve an operationally equivalent mobile focused-task transition: `Siguiente tarea` and room selection must open/focus the selected room workspace rather than merely changing hidden selection state above a stacked page;
- a bottom sheet/dialog is acceptable and closest to source, but another implementation is acceptable if it preserves the same operational semantics, focus/close behavior and direct access to the relevant action;
- add browser assertions at mobile widths proving `Siguiente tarea`/room selection enters the focused task and returns focus/queue behavior correctly.

### P1 — Browser evidence still overclaims contract coverage

The committed Playwright harness is a major improvement and is genuinely integrated with the local API/D1. However:

- it does not test per-room draft isolation even though the Task Contract explicitly requires browser proof that drafts do not leak/reset incorrectly;
- it distributes one or two operations across the five widths and treats `Siguiente tarea` + no-overflow as sufficient responsive evidence, but does not prove the source-like mobile focused-task behavior;
- the invariant evidence marks `INV-RESP-001`, `INV-UX-001` and the Pre-Critic Browser/UX sweeps `PASS` more strongly than the executable assertions justify.

Required repair:
- add a two-room browser scenario: enter a draft for room A, switch/open room B, prove B does not contain A's reason/owner/resolution, return to A and verify the intended retained/reset semantics; also verify success/clear resets only the intended room;
- exercise and assert the focused mobile task entry/close behavior at 375/390/430, and material desktop controls at 768/1024;
- keep evidence language exactly aligned with what the script asserts.

## Findings accepted in REWORK-1

- Simple concurrent `start` and `finish` requests now resolve as one success/one conflict with one event.
- Simple concurrent resolution of the same current case is no longer allowed to duplicate the resolve event.
- Legacy synthesized maintenance recovery now stores `reported_by_user_id` and resolver ownership.
- Per-room draft state is keyed by room ID in the active target implementation rather than globally shared.
- Active desktop information architecture is queue -> selected room -> focused workspace instead of the prior flat card board.
- The committed browser harness is real local API/D1-backed; prior mocked-only evidence was removed.
- Backend housekeeping capability enforcement remains fail-closed for receptionist; routing tests fail closed for unknown bindings / unauthorized hotel membership selection.
- Scope remains bounded to CF-I05; no billing, production, remote D1, real-data or paid-resource work entered the artifact.
- Full regression/build/type/Wrangler claims are plausible and no contradictory code diff was found outside the findings above.

## Required next action

Under `PM-AUTONOMY-001`, this is routine autonomous REWORK-2:

1. repair exact-case/room correlation for maintenance resolve including ABA re-entry;
2. add deterministic K1 -> resolve -> K2 reopen -> stale-K1 regression with exact state/event assertions;
3. restore source-equivalent mobile focused-task semantics for `Siguiente tarea` and room selection;
4. add browser proof for mobile focus/open/close and per-room draft isolation/reset;
5. update invariant and Pre-Critic evidence so claims match executable proof;
6. run complete CF-I03/CF-I04/CF-I05 regressions, browser, tests, build, types, Wrangler dry-runs and diff checks;
7. publish one fresh immutable CF-I05 artifact with `external_review.required=true` and stop at Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.
