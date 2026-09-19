# 04A — Implementation sequencing refinement

Status: `BINDING`; supersedes older numeric order where different.

## Wave 0 — prerequisites
0.1 **JS headroom** — total generated raw JS `<=300000` without raising budget or removing accepted behavior.

0.2 **Hotel operational timezone/instant** — persisted IANA timezone, trusted context, hotel-local date and D10 instant parsing.

0.3 **Billing reconciliation foundation** — shared D9/D11 schema/helper semantics and payment-ledger correlation. No feature UI authorization.

## Wave 1 — domain correctness
1.1 Reassignment remaining-night semantics + old-room turnover + destination repricing through shared D11.

1.2 Occupied maintenance schema/events/capabilities + vacancy behavior.

1.3 Arrival exceptions: no-show, cancellation/check-in parity, late-arrival D10 and D9 no-repricing.

1.4 Stay extension + source pricing through shared D11.

## Wave 2 — app interaction + operational workspace
2.0 **Interaction foundation** — small reusable primitives: persistent-shell transition behavior, drawer/full-screen-sheet, confirmation dialog, toast/banner, skeleton/refresh state, dirty-close guard, focus return, reduced-motion and filter/history helpers. No heavy UI/animation framework.

2.1 Front-desk board: authoritative queue/readiness/blockers/priority/Billing context.

2.2 Reception focused-task UX: queue/master-detail, reservation sheet, check-in stepper, late-arrival quick dialog, cancellation/no-show dialog, reassignment/extension/checkout drawers and next-case continuation.

2.3 Reception-selected Billing coupling; remove independent booking reselection inside Reception.

2.4 Atomic inline guest + reservation UX.

2.5 Rooms/Guests/Housekeeping master-detail, filters, contextual navigation and Back/Forward continuity.

2.6 Cross-module refresh/focus polling and stale-conflict recovery without filter/context loss.

## Wave 3 — optimization and full acceptance
Performance/code splitting after budget compliance; remaining polish; complete keyboard/focus and synthetic hotel-shift acceptance including `21-app-interaction-contract.md` scenarios and D9-D11 regression matrix.

## Review rule
Each Wave 0/1 state/accounting foundation gets bounded Task Contract + independent critique. Wave 2.0 is a bounded UI-foundation contract and cannot silently redesign domain semantics. Do not combine all migrations/endpoints/workspaces in one large PR.
