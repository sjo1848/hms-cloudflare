# CF-I04 REWORK-2 — External Independent Critic

Reviewed artifact: `22eb064c68e2793ef0d67dd984384f32f5a13873`
Reviewer: ChatGPT External Independent Critic
Verdict: `REWORK`
Human Gate: `NONE`
Diagnosis: `DOMAIN_PARITY_DEFECT + CONCURRENCY_DEFECT + EVIDENCE_DEFECT + UX_PARITY_DEFECT`

## Summary

REWORK-2 materially improves CF-I04. The final-event SQLite abort triggers are a stronger transactional boundary than post-commit `meta.changes` inspection; the lifetime reassignment-history uniqueness restriction was removed; the target UI now exposes a reception case queue/workspace instead of only flat booking cards; typed 409 observability was added; and a deterministic stale-checkout rollback regression exists.

However the exact artifact still does not satisfy the CF-I04 Task Contract, the source contract inventory or binding `CF-UX-PARITY-001`. The remaining work is routine repair within already-approved scope. No Human decision is required unless Codex proposes an intentional product redesign or another material change outside the accepted parity contract.

## Blocking findings

### P1 — Check-in parity lost the actual final guest count

The source HMS contract persists `check_in_guests_count: Option<i32>` and considers check-in complete only when the actual count is present and greater than zero, together with document/contact/stay confirmations. The accepted source mobile/desktop check-in UI collects the final guest count as a numeric value.

The target CF-I04 route instead accepts only `guest_count_confirmed: true`; the target booking schema has no persisted check-in guest-count field; and the lifecycle event records only a checklist label. This turns a source domain datum into a yes/no acknowledgement.

Required repair:
- preserve an actual positive final guest count in the CF-I04 check-in contract and persistence/audit surface;
- retain document/contact/stay confirmations and actor/time/request traceability;
- adapt the target reception UI and browser/API evidence accordingly;
- preserve optional source check-in reference where required by the source parity mapping, without expanding unrelated later scope.

### P1 — Checkout parity does not implement the required policy/reference semantics

The CF-I04 Task Contract explicitly requires checkout with the required `policy/reference`, charge review, room release and housekeeping handoff confirmations.

The source HMS persists `check_out_payment_policy` and `check_out_reference`. Valid policy values are `settled` or `pending-approved`; `pending-approved` requires a non-empty closing reference of sufficient length. The accepted source checkout UI exposes that choice and reference.

The target currently accepts only `payment_policy_accepted: true`, plus booleans for charge/release/handoff. No policy value or reference is persisted, and the lifecycle event hardcodes a generic accepted flag. This weakens domain semantics and cannot prove source parity.

Required repair:
- implement the accepted checkout policy value and reference semantics inside CF-I04;
- persist/audit the policy and reference with actor/time/request traceability;
- keep actual payment/settlement implementation in CF-I06 as intended; do not pull billing scope forward;
- add API/D1/browser evidence for `settled`, valid `pending-approved + reference`, and invalid pending-without-reference.

### P1 — Reassignment can still race with a newly-created room hold

The target room/hold/claim availability preflight happens before the reassignment batch. The new `lifecycle_reassign_atomic_guard` verifies booking status, old/new room states and existence of a new room-night claim, but it does **not** verify that no overlapping `room_holds` row exists at the final transactional boundary.

Concrete race:
1. reassignment preflight sees destination room available and unheld;
2. another request creates an overlapping hold before the reassignment batch (hold creation also sees no destination booking claim yet);
3. reassignment moves the booking, inserts claims, changes room states and inserts the event;
4. the final trigger sees `new_room = OCCUPIED`, `old_room = AVAILABLE` and a claim, so it accepts the operation despite the overlapping hold.

The result is a held room with an active booking claim, violating the accepted invariant that holds and bookings both block availability.

Required repair:
- include absence of overlapping destination holds in the in-batch/final transactional reassignment guard, using the booking stay range;
- add a deterministic hold-vs-reassignment race regression that proves one side loses cleanly and the final state never contains overlapping hold + booking claims.

### P1 — The required deterministic stale-reassignment regression is still missing

The previous Critic required deterministic stale-state regressions for both checkout and reassignment.

The new regression adds a controlled stale-checkout SQL transaction and an `A -> B -> A -> C` history test. Those are valuable. It does **not** add the requested deterministic destination-room invalidation or stale reassignment transaction test. The remaining concurrent HTTP reassignment test still accepts broad `{200,409}` outcomes and therefore does not force the failure interleaving.

Required repair:
- add a controlled stale reassignment test in which destination room state (or another transactional destination precondition) is invalidated after preflight assumptions and before final guard;
- assert exact rollback/preservation of booking room, old/new claims, both room states and lifecycle-event count.

### P1 — Mobile reception parity is still materially weaker than the accepted source interaction model

The desktop target is now closer to the source: it has a reception case queue, selected case and next-action sections. That is a meaningful improvement.

But `CF-UX-PARITY-001` also makes accepted responsive/mobile reception behavior binding. The source check-in UI at mobile widths is an explicit multi-step task flow (`Verificación → Datos/estadía → Habitación → Confirmar ingreso`) with progress, forward/back controls and gating per step. The target merely stacks the same generic checkbox form under the selected case.

That is a materially different mobile interaction model, not a technical Cloudflare adaptation.

Required repair:
- port/adapt the lifecycle-relevant mobile task flow from the source HMS for CF-I04 without importing billing/later scope;
- preserve the source semantics for check-in, reassignment and checkout at the contracted mobile widths;
- pixel-perfect reproduction is unnecessary, but workflow structure and task progression must remain recognizably the accepted HMS behavior.

### P1 — Responsive browser evidence still overstates what is exercised at 390/430/768/1024

At width 375 the script exercises the check-in validation/error/recovery, reassignment and checkout journey. At 390/430/768/1024 it changes the viewport, verifies the workspace/queue, clicks the guest and waits for `Selected case`.

That proves the shell is reachable but not that lifecycle controls remain usable at each required width. The evidence document currently says the browser lifecycle journey passes at all five widths, which is stronger than the script demonstrates.

Required repair:
- exercise lifecycle-relevant controls/next-action state at each contracted width, with enough interaction to prove the source-parity workspace is usable;
- make the evidence statement exactly match what is tested.

## Findings resolved or materially improved

- post-commit checkout/reassignment row-count checking is no longer the primary rollback mechanism;
- final lifecycle-event triggers can abort and roll back a D1 batch when room/booking state is inconsistent;
- the invalid lifetime `(booking,event_type,from_room_id)` uniqueness restriction is removed;
- valid repeated room history `A -> B -> A -> C` is regression-tested;
- deterministic stale-checkout rollback is regression-tested;
- reception now has a case-workspace/queue structure instead of only flat cards;
- a typed backend 409 is observable and recoverable in browser evidence;
- forbidden role / unknown binding / missing cross-tenant IDs remain fail-closed;
- `RUNTIME_CAPABILITY_FALLBACK` remains accurate;
- no paid/production/later-feature expansion was observed.

## Required next action

Under `PM-AUTONOMY-001`, Codex consumes this review directly and autonomously:

1. restore actual check-in guest-count semantics and persistence/audit parity;
2. restore checkout policy/reference semantics without pulling CF-I06 settlement implementation forward;
3. close the hold-vs-reassignment transactional race;
4. add deterministic stale-reassignment and hold-race regressions with exact final-state assertions;
5. finish lifecycle-relevant mobile/source UX parity rather than merely restyling the target shell;
6. make responsive browser evidence substantively exercise the lifecycle surface at 375/390/430/768/1024;
7. run full self-adversarial QA and complete validation;
8. publish a fresh immutable artifact and stop at the next Independent Critic boundary.

Do not advance to CF-I05 before a fresh CF-I04 PASS.
