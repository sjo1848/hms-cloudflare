# 04 — Acceptance and sequencing

Status: `BINDING DEFINITION`; implementation ordering is refined by `04a-sequencing-refinement.md`.

## Acceptance strategy

Each future implementation increment must prove the domain transition first, then browser workflow, then cross-module continuity. Green UI tests alone are insufficient.

Minimum evidence per P0 flow:

- positive API/domain path;
- invalid-state rejection;
- deterministic stale/concurrency rejection;
- exact DB/state assertions;
- truthful audit/event assertion;
- responsive browser journey at contracted widths;
- source-parity assertion for any migrated behavior;
- cross-surface consequence where applicable.

## End-to-end operational scenarios

### A — Normal departure

Checked-in guest -> review authoritative balance/charges -> confirm room vacated -> checkout -> booking checked out -> room dirty -> housekeeping sees room -> clean -> available -> Reception revalidation sees room ready.

### B — Reassignment without blocking maintenance

Checked-in guest in 101 -> select valid 104 for remaining stay -> confirm -> booking/current room becomes 104 -> 104 occupied -> 101 dirty -> housekeeping cleans 101 -> 101 available. Past inventory nights remain traceable to 101.

### C — Blocking occupied incident

Guest in 102 -> open urgent `BLOCKING` maintenance case -> Reception attention/relocation -> reassign to 105 -> 102 maintenance -> resolve -> 102 dirty -> clean -> available.

### D — Non-blocking occupied incident

Guest remains in 103 -> open `NON_BLOCKING` case -> booking/room remain occupied -> resolve -> room remains occupied -> later normal checkout sends room dirty.

### E — Arrival exception / no-show

Confirmed arrival reaches its hotel-local arrival date and never occupies the room -> no-show is eligible according to accepted source parity -> booking no-show -> inventory released -> physical room unchanged -> arrival disappears -> availability refreshes. Cancellation remains a separate terminal operator choice while booking is still confirmed. No automatic money mutation is inferred.

### F — Stay extension

Checked-in guest requests later checkout -> added interval available -> `HG-FIN-001` pricing policy applied -> extension commits atomically -> booking remains checked in -> room remains occupied -> added inventory claimed -> invoice/balance reconciled.

Conflict variant: any added-night or concurrent Billing conflict rejects with zero partial mutation.

### G — Checkout settlement parity

Reception selects `settled` -> backend verifies authoritative account is fully paid -> checkout succeeds only when source financial invariant is true. Positive balance requires the governed `pending-approved` path with reference/override capability. UI declaration alone cannot bypass this rule.

## Required implementation sequence

Use `04a-sequencing-refinement.md` as the authoritative wave order. Wave 0 prerequisites precede material feature UI growth. Every Wave 1 domain item gets a bounded Task Contract and independent review.

## Stop conditions

Return to analysis/Human Gate if implementation discovers a new financial policy, need for multiple simultaneous maintenance cases, split-stay/multi-room extension, cross-D1 atomicity, paid/production dependency, UX that weakens backend lifecycle guards, or a proposed calendar cutoff absent from accepted source/product decisions.

## Product simulation gate

Before the workflow pass is accepted, execute a synthetic hotel shift covering scenarios A–G and record module switches, confirmations, stale/conflict outcomes, hidden-memory burden and whether the next actionable case is obvious.

The target is not minimum clicks at any cost. It is minimum unnecessary context switching while preserving explicit high-risk confirmations and accepted business semantics.