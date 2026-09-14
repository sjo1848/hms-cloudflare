# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`.
Canonical authority: master, transition matrix, E2E matrix, API map, departure register, maintenance RBAC and operational invariants.

## Binding decisions
1. Physical room state, future sellability and immediate readiness are distinct.
2. Occupied vacancy never skips turnover: DIRTY unless open BLOCKING maintenance requires MAINTENANCE.
3. Maintenance is independent case impact `NON_BLOCKING | BLOCKING`; V1 one open case/room.
4. Maintenance RBAC is binding; receptionist cannot resolve; cleaning remains housekeeping.write.
5. Reassignment moves only remaining nights, preserves history, requires reason, rejects overrun until extension/checkout, and uses destination repricing plus canonical Billing reconciliation.
6. No-show: CONFIRMED, never occupied, hotel-local date >= check_in, reason required; release inventory; room/total unchanged.
7. Check-in/cancellation receive no new calendar cutoff. Genuine date predicates use persisted IANA hotel timezone.
8. Extension is explicit, forward-only, all-added-nights atomic and uses current-room repricing plus canonical Billing reconciliation.
9. Late arrival is CONFIRMED context through booking PATCH; D10 owns explicit-offset ETA semantics.
10. Front-desk board is canonical Reception read model and requires bookings.read for admin/ops/receptionist only.
11. Reception-selected booking governs embedded Billing and post-action continuation.
12. D9 is the closed-set pricing boundary: only expressly priced operations may change booking total; state/evidence-only writes preserve it.
13. D11 is the single invoice-reconciliation decision for every priced operation. It governs prior-payment edge cases, derived Billing values, status/timestamp outcomes, required schema compatibility, and fail-closed handling of ineligible invoice state. Commands may not define local alternatives.
14. Checkout uses authoritative D11 Billing truth and never reprices accommodation; positive-balance override remains admin-only.
15. Cancellation/no-show preserve existing financial evidence and add no automatic disposition.
16. API ownership follows `19`; generic PATCH/direct room status cannot bypass lifecycle/maintenance commands.
17. Inline guest+reservation is one atomic intent.
18. Backend enforces material evidence; OpenAPI/client must match routes, date-time and Billing effects.
19. Freshness uses mutation/focus/context-entry refresh plus modest visible polling.
20. Before material UI growth raw generated JS <=300000 without raising the 320000 budget.
21. Success audit exists iff authoritative mutation wins.
22. Only departures listed in `20-intentional-target-departures.md` are authorized.

## Human Gates
None remain open for this definition. D9-D11 are registered correctness/accounting decisions for the target wave.

## Deferred
Frozen contracted-rate redesign; new arrival cutoffs; separate treatment of D11 derived credit; explicit VOIDED recovery workflow; split stay/automatic relocation; multiple maintenance cases; richer SLA/category; paid realtime; production/cutover/real-data migration.

## Implementation latitude after phase exit
BUILD may choose internal module/SQL/component organization and tune low-cost polling. It may not alter states, transitions, pricing boundary/formulas, D11 outcomes, ETA semantics, evidence, RBAC, route ownership, registered departures, cross-module consequences or acceptance criteria without a new decision.