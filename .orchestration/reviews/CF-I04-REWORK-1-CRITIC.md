# CF-I04 REWORK-1 — External Independent Critic

Reviewed artifact: `88c8361bae2148f682947bba1976a41404db9212`
Reviewer: ChatGPT External Independent Critic
Verdict: `REWORK`
Human Gate: `NONE`
Diagnosis: `EXECUTION_DEFECT + EVIDENCE_DEFECT + UX_PARITY_DEFECT`

## Summary

REWORK-1 materially improved the original artifact: stale reassignment side effects are better chained to booking state, lifecycle-specific authorization/unknown-binding checks exist, check-in is now browser exercised, responsive widths are at least touched, and a named CF-I04 regression harness exists. However the artifact still does not satisfy the CF-I04 contract or binding `CF-UX-PARITY-001`.

The remaining work is routine technical/product-parity repair inside already-approved scope. It does not require a Human Gate unless Codex proposes an intentional material redesign of the accepted source UX.

## Blocking findings

### P1 — Checkout can still commit a partial business operation before returning 409

`apps/api/src/routes/lifecycle.ts` still relies on post-`D1.batch()` row-count inspection for checkout.

Current order:
1. booking `CHECKED_IN -> CHECKED_OUT` guarded only by booking status;
2. claims are deleted if the booking is now checked out;
3. room is changed `OCCUPIED -> DIRTY` only if room state still matches;
4. lifecycle event is inserted if booking is checked out;
5. only after the batch commits does the route inspect `results[2].meta.changes`.

Failure case: after the pre-read, the room state changes from `OCCUPIED` to another state while the booking remains `CHECKED_IN`. The booking update can succeed, claims can be deleted, the room update can affect zero rows, and the lifecycle event can be inserted. Because zero-row UPDATE is not a SQL error, the D1 batch may commit; the route then returns 409 after the partial checkout has already happened.

Required repair:
- make the booking+room checkout preconditions fail **inside** the transactional batch;
- no booking transition, claim deletion or lifecycle event may commit when the room transition cannot complete;
- add deterministic regression proving complete preservation of booking status, claims, room state and lifecycle-event count when the room-state guard becomes stale.

### P1 — Reassignment does not revalidate destination room availability atomically

Destination room availability is checked before the batch, but the first transactional booking UPDATE does not require the destination room to remain `AVAILABLE`.

Failure case: target room is `AVAILABLE` during preflight, then changes to `MAINTENANCE` or another non-available state without a room-night claim/hold before the batch. The booking can move to the target, old claims can be replaced, the old room can be released, target room UPDATE can affect zero rows, and the event can still be inserted. The route currently only requires the booking UPDATE and event INSERT row counts to equal one, so this path can even return success while the target room was never occupied.

Required repair:
- validate target room state/availability inside the same transactional guard that authorizes the reassignment;
- a stale destination-room precondition must abort the batch, not produce a zero-row room update after other mutations;
- add deterministic regression for target-room invalidation between preflight and mutation.

### P1 — Concurrent curl tests are not deterministic stale-guard tests

The regression launches concurrent HTTP requests and accepts broad result sets (`200` or `409`). That demonstrates concurrent activity but does not guarantee the specific stale interleaving required by the prior Critic.

A race test that sometimes serializes cleanly cannot prove the stale/zero-row failure path is safe. This is why the room-state defects above remain possible while the regression is green.

Required repair:
- add a deterministic test seam/fixture that forces the relevant state change after pre-read and before transactional mutation, or test the transactional SQL guard directly under a controlled stale state;
- assert exact expected outcomes and complete state preservation, not merely that each response belongs to `{200,409}`.

### P1 — CF-UX-PARITY-001 is not satisfied by the current reception frontend

Binding decision `CF-UX-PARITY-001` makes the accepted source HMS the UX canon for the migration. The current target `apps/web/src/App.tsx` is still a newly invented flat interface: `Rooms / Guests / Bookings`, flat cards/forms, lifecycle forms appended under a selected booking, English labels, and browser-native/form-level interaction.

The accepted source HMS reception uses a `BookingCaseWorkspace` with explicit case-workspace structure, status/next-action semantics, operation-focused navigation/tabs, queue/case navigation, mobile task behavior and source interaction patterns. Pixel-perfect copying is not required, and CF-I04 must not pull billing/CF-I06 into scope; however the relevant Reception Lifecycle surface must be ported/adapted from the accepted source experience rather than replaced by a second HMS UX.

Required repair:
- use the source reception/case workspace as the parity reference for CF-I04 user-visible lifecycle behavior;
- preserve the lifecycle-relevant information architecture, interaction semantics, primary-action/checklist flow and mobile behavior without introducing billing or later increment scope;
- do not redesign navigation/workflow for implementation convenience;
- if Codex believes a material departure from source UX is desirable or necessary, stop and surface that proposal for `HUMAN_GATE` classification instead of silently implementing it.

### P1 — Browser evidence overstates responsive and error coverage

`scripts/cf-i04-browser-regression.mjs` performs the lifecycle journey at width 375, then only changes the viewport to 390/430/768/1024 and waits for the `Bookings` heading. That does not demonstrate that the contracted lifecycle controls remain usable at those widths.

The script also verifies required-checkbox prevention by checking that no API call occurred, but it does not exercise a lifecycle API error and assert the observable typed-error surface required by the contract.

The evidence document therefore overstates the claim that the reception lifecycle journey passed at all five widths with validation/error/success coverage.

Required repair:
- at each contracted width, exercise enough of the actual source-parity reception surface to prove the lifecycle workspace/controls are reachable and usable;
- include an observable lifecycle backend error state and recovery/success assertion;
- ensure the evidence document describes exactly what the browser script proves.

### P2 — Lifetime `from_room_id` uniqueness introduces an unauthorized lifecycle restriction

Migration `0006_lifecycle_transition_guards.sql` creates a unique index on `(booking_id, event_type, from_room_id)` for `REASSIGN`.

This blocks a legitimate sequence such as `A -> B -> A -> C`, because the second departure from room A conflicts with the historical `A -> B` reassignment event. The Task Contract/source parity does not define a "may leave each room only once" rule.

Required repair:
- remove the lifetime semantic coupling between historical audit events and concurrency control;
- use a concurrency guard/version/transactional precondition that prevents stale simultaneous reassignment without forbidding later legitimate lifecycle sequences;
- add regression covering return-to-prior-room followed by a later reassignment.

## Findings considered resolved enough for this cycle

- lifecycle routes remain explicit domain operations rather than generic status PATCH;
- forbidden housekeeping role is lifecycle-tested;
- unknown hotel binding is tested fail-closed;
- ordinary checklist/check-in/reassignment/checkout success paths exist;
- actor/request/hotel lifecycle trace remains present;
- `RUNTIME_CAPABILITY_FALLBACK` is accurately recorded;
- no billing/standalone-housekeeping/paid/production expansion was observed.

## Required next action

Under `PM-AUTONOMY-001`, Codex consumes this review directly and autonomously:

1. redesign the D1 lifecycle transaction guard so stale booking/room/destination preconditions abort inside the batch;
2. replace the lifetime reassignment-event uniqueness guard with a concurrency mechanism that preserves valid repeated room-history semantics;
3. add deterministic stale-state regressions for checkout and reassignment plus the legitimate `A -> B -> A -> C` sequence;
4. port/adapt the CF-I04 Reception Lifecycle UI toward the accepted source HMS case-workspace interaction model under `CF-UX-PARITY-001`, without pulling later increment scope forward;
5. make responsive/browser evidence exercise the real lifecycle surface at 375/390/430/768/1024 and include typed-error observability;
6. run full self-adversarial QA and validation;
7. publish a fresh immutable artifact and stop at the next Independent Critic boundary.

Do not advance to CF-I05 before a fresh CF-I04 PASS.
