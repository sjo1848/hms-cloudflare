# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`.
Canonical authority: master, E2E matrix, API map, departure register, app interaction contract, transition matrix, maintenance RBAC and operational invariants.

## Binding decisions
1. Physical room state, future sellability and immediate readiness are distinct.
2. Occupied vacancy never skips turnover: DIRTY unless open BLOCKING maintenance requires MAINTENANCE.
3. Maintenance is independent `NON_BLOCKING | BLOCKING`; V1 one open case/room.
4. Maintenance RBAC is binding; receptionist cannot resolve; cleaning remains housekeeping.write.
5. Reassignment moves only remaining nights, preserves history, requires reason, rejects overrun until extension/checkout and uses destination repricing + D11.
6. No-show/cancellation/check-in timing follows canonical parity/hardening rules.
7. Genuine date predicates use persisted hotel IANA timezone.
8. Extension is explicit, forward-only, atomic and uses current-room repricing + D11.
9. Late arrival is CONFIRMED context; D10 owns explicit-offset ETA semantics.
10. Front-desk board is canonical Reception read model with binding RBAC.
11. Reception-selected booking governs embedded Billing and post-action continuation.
12. D9 is the closed pricing boundary.
13. D11 is the single invoice-reconciliation decision; paid amount equals immutable payment ledger after successful payment/reconciliation; repricing creates no payment evidence; mismatch/VOIDED fails closed.
14. Checkout uses authoritative D11 truth; pending-balance override is admin-only.
15. Cancellation/no-show preserve financial evidence without automatic disposition.
16. API ownership follows `19`; generic/direct state bypass is forbidden.
17. Inline guest+reservation is atomic.
18. Backend evidence/OpenAPI/client alignment is mandatory.
19. Freshness uses mutation/focus/context-entry refresh + modest polling.
20. Raw generated JS <=300000 before material UI growth.
21. Success audit exists iff authoritative mutation wins.
22. Only departures in `20` are authorized.
23. App interaction follows `21-app-interaction-contract.md` and `CF-OPS-UX-001`: persistent shell, focused task surfaces, product dialogs, filter/history continuity, selected-context Billing, accessible short motion and responsive master/detail/focused-task behavior are binding product semantics.

## Human Gates

None open while UX definition is being reconciled. A7/B7 external-critic gate is superseded by the explicit UX scope expansion and must not be used as final authorization.

## Deferred

Frozen-rate redesign; new arrival cutoffs; automatic credit disposition; explicit VOIDED recovery; split stay/automatic relocation; multiple maintenance cases; richer SLA/category; paid realtime; production/cutover/real-data migration.

## Implementation latitude after phase exit

BUILD may choose internal module/SQL/component organization and low-cost implementation details. It may not alter states, transitions, pricing/D11, ETA, RBAC, route ownership, registered departures, cross-module consequences, interaction taxonomy/history/filter semantics or acceptance criteria without a new decision.
