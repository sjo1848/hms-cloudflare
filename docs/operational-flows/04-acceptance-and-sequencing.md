# 04 — Acceptance and sequencing

Status: `BINDING DEFINITION`; ordering refined by `04a-sequencing-refinement.md`.

## Evidence strategy

Each increment proves domain/API transition, invalid-state and stale/concurrency rejection, exact state, truthful audit, authorization, OpenAPI/client alignment, responsive browser journey and cross-module consequence. Green UI alone is insufficient.

## Representative operational scenarios

### A — Normal departure
Checked-in guest -> authoritative Billing review -> checkout -> booking checked out -> room DIRTY (or MAINTENANCE with blocking case) -> downstream work -> cleaning -> AVAILABLE. Checkout settlement uses stored authoritative booking total and does not reprice accommodation under D9.

### B — Reassignment
Checked-in guest -> valid destination for remaining stay -> show destination-price consequence -> confirm -> remaining inventory moves; destination OCCUPIED; old room DIRTY/MAINTENANCE; history preserved; booking total/invoice reconciled; downstream turnover completes.

### C — Blocking occupied incident
Guest OCCUPIED -> BLOCKING case -> relocation attention -> explicit reassignment -> old room MAINTENANCE -> resolve -> DIRTY -> clean -> AVAILABLE. No automatic guest move.

### D — Non-blocking incident
Open NON_BLOCKING on OCCUPIED, AVAILABLE, DIRTY or CLEANING -> physical state unchanged -> advisory case -> resolve with physical state unchanged. On AVAILABLE the case does not independently remove sellability/readiness.

### E — Arrival exceptions
No-show from hotel-local arrival date: CONFIRMED never occupied -> NO_SHOW -> inventory release -> room unchanged -> **booking total unchanged** -> financial evidence preserved. Cancellation is separate CONFIRMED terminal intent and likewise preserves total; neither adds automatic refund/penalty.

### F — Stay extension
Checked-in guest -> later checkout -> added nights free -> display source pricing result (`total nights × current room price + extras`) -> confirm -> dates/inventory/total/invoice atomic. Conflict rolls all parts back.

### G — Checkout settlement
`settled` succeeds only when authoritative account is fully paid. Positive balance uses pending-approved + reference + admin-only override. Catalog price changes after booking do not cause checkout repricing; validation uses the stored authoritative total.

### H — Metadata/state no-repricing regression
After reservation creation, change the room catalog price, then independently:
- edit only guest/name/ordinary notes;
- record/rerecord late arrival;
- check in;
- cancel;
- mark no-show;
- checkout.

Each state/evidence-only action preserves the stored booking total (and invoice amount where one exists), except checkout may alter settlement/invoice lifecycle against that same total. By contrast a room/date edit, reassignment, extension or extra charge demonstrates the defined pricing mutation and invoice reconciliation.

### I — Late arrival
Confirmed booking -> valid future ETA whose hotel-local date is inside stay + note min 6 -> persist front-desk metadata/actor/time/audit -> remains CONFIRMED -> board shows context. Past/out-of-stay ETA, short note or non-confirmed booking rejects without state/financial drift.

## Sequence

`04a-sequencing-refinement.md` is authoritative. Wave 0 prerequisites precede material UI growth. Every Wave 1 state-changing domain item gets a bounded Task Contract and independent review.

## Stop conditions

Return to definition/Human Gate if BUILD proposes new commercial policy, multiple simultaneous maintenance cases, split-stay/automatic relocation, cross-D1 atomicity, paid/production dependency, weakened lifecycle guards, unregistered source departure, or hidden pricing side effect.

## Product simulation gate

Before acceptance execute the full `18-end-to-end-scope-matrix.md` synthetic shift, including scenarios A-I, and record context switches, confirmations, conflict recovery, operator-memory burden, next-action clarity and contracted mobile/desktop evidence.