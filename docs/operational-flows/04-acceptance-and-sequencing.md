# 04 — Acceptance and sequencing

Status: `BINDING DEFINITION`; ordering refined by `04a-sequencing-refinement.md`.

## Evidence strategy

Each increment proves domain/API transition, invalid-state and stale/concurrency rejection, exact state, truthful audit, authorization, OpenAPI/client alignment, responsive browser journey and cross-module consequence. Green UI alone is insufficient.

UX-bearing increments additionally prove `21-app-interaction-contract.md`: persistent shell, focused task surfaces, filter/history continuity, product dialogs, feedback/focus and reduced-motion behavior.

## Representative operational scenarios

### A — Normal departure
Checked-in guest -> authoritative Billing review -> checkout -> booking checked out -> room DIRTY or MAINTENANCE -> downstream work -> cleaning -> AVAILABLE.

### B — Reassignment
Checked-in guest -> valid remaining-stay destination -> show destination/Billing consequence -> reason -> confirm -> atomic move/history/turnover/reconciliation.

### C — Blocking occupied incident
OCCUPIED -> BLOCKING case -> Reception attention -> explicit move/checkout -> MAINTENANCE -> resolve -> DIRTY -> clean -> AVAILABLE.

### D — Non-blocking incident
NON_BLOCKING on eligible state -> physical state unchanged -> advisory -> resolve with physical state unchanged.

### E — Arrival exceptions
No-show/cancellation preserve total and financial evidence; no automatic refund/penalty. Late arrival is contextual metadata.

### F — Stay extension
Checked-in -> later checkout -> added-night availability -> repricing/D11 preview -> confirm -> atomic inventory/date/Billing mutation.

### G — Checkout settlement
Settled requires authoritative valid Billing; pending-approved is explicit admin-only branch.

### H — D9 no-repricing regression
Guest/name/notes-only, late arrival, check-in, cancellation, no-show and checkout preserve stored total after catalog-price change. Priced mutations demonstrate the opposite.

### I — Late arrival
Valid explicit-offset future ETA inside hotel-local stay persists context; invalid time/note/state rejects without drift.

### J — App interaction continuity
Reception filters/search active -> open case -> open focused task -> navigate contextually to Room -> Back -> exact Reception filter/selection/list context restored. Destructive actions use product dialog, not native confirm. Mobile queue -> full-screen task -> success/back returns to preserved queue context. Refresh/conflict keeps known data visible.

## Sequence

`04a` is authoritative. Wave 0 prerequisites precede material UI growth. Wave 2.0 interaction primitives precede conversion of individual module flows to the new app-like model.

## Stop conditions

Return to definition/Human Gate if BUILD proposes new commercial policy, multiple simultaneous maintenance cases, split-stay/automatic relocation, cross-D1 atomicity, paid/production dependency, weakened lifecycle guards, unregistered source departure, hidden pricing side effect, or interaction behavior that contradicts `21`.

## Product simulation gate

Before acceptance execute the full `18-end-to-end-scope-matrix.md` synthetic shift, including scenarios A-J. Record context switches, confirmations, filter/selection loss, conflict recovery, Back/Forward continuity, operator-memory burden, next-action clarity and contracted mobile/tablet/desktop evidence.
