# 04A — Implementation sequencing refinement

Status: `BINDING`; supersedes older numeric order where different.

## Wave 0 — prerequisites
0.1 **JS headroom** — total generated raw JS `<=300000` without raising budget or removing accepted behavior.

0.2 **Hotel operational timezone/instant** — persist valid IANA timezone, expose trusted context, derive hotel-local date, and support D10 absolute-instant parsing.

0.3 **Billing reconciliation foundation** — implement the shared D9/D11 distinction and forward schema/reconciliation support required by later priced commands. Historical migrations remain immutable. This foundation may be its own small Task Contract; it does not authorize feature UI.

## Wave 1 — domain correctness
1.1 Reassignment remaining-night semantics + old-room turnover + destination repricing through shared D11 reconciliation.

1.2 Occupied maintenance schema/events/capabilities + checkout/reassignment vacancy behavior.

1.3 Arrival-exception parity: no-show, cancellation/check-in parity, late-arrival D10 wire, and target evidence hardening. These state/evidence commands preserve booking total under D9.

1.4 Checked-in stay extension + source pricing through shared D11 reconciliation.

## Wave 2 — operational read/context
2.1 Front-desk board: temporal classification, readiness, maintenance blockers, deterministic priority and D11 Billing context where shown.

2.2 Reception lifecycle UI: readiness, no-show, late arrival, extension, maintenance report, reassignment consequences, next-case continuation.

2.3 Reception-selected Billing coupling.

2.4 Atomic inline guest + reservation.

2.5 Contextual navigation and focus/interval revalidation.

## Wave 3 — optimization and acceptance
Performance/code splitting after total-budget compliance; keyboard/focus refinements; full synthetic hotel-shift acceptance including D9-D11 regression matrix.

## Review rule
Each Wave 0/1 state or accounting foundation gets a bounded Task Contract and independent critique. Do not combine all migrations/endpoints in one large implementation PR.