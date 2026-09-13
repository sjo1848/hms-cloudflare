# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`.
Canonical authority: master, transition matrix, E2E matrix, API map, departure register, maintenance RBAC and operational invariants.

## Binding decisions

1. Physical room state, future sellability and immediate readiness are distinct.
2. Occupied vacancy never skips turnover: DIRTY unless open BLOCKING maintenance requires MAINTENANCE.
3. Maintenance is independent case impact `NON_BLOCKING | BLOCKING`; NON_BLOCKING is state-preserving/advisory; BLOCKING prevents new occupancy. V1 one open case/room.
4. Maintenance RBAC: admin/ops/housekeeping read-report-resolve; receptionist read-report/escalate not resolve; saas_admin none. Cleaning remains housekeeping.write.
5. Reassignment moves only remaining nights from `max(check_in,hotel_local_date)`, preserves history, requires reason min 6, rejects overrun until extension/checkout, and uses destination-current-price repricing + invoice reconciliation.
6. No-show: CONFIRMED, never occupied, local date >= check_in, reason min 6; release inventory; room unchanged.
7. Check-in/cancellation receive no new calendar cutoff. Hotel-local date is server-derived from persisted IANA timezone for genuine date predicates.
8. Extension is explicit, forward-only, all-added-nights atomic and uses current-room repricing + invoice reconciliation.
9. Late arrival is CONFIRMED context through existing booking PATCH/front_desk ETA+note; note min 6/max 250; actor/time/audit; no room/inventory/Billing mutation.
10. Late-arrival ETA wire is RFC3339/ISO-8601 with explicit Z/offset. Server parses an absolute instant, converts to hotel timezone, validates hotel-local ETA date in `[check_in,check_out)`, and rejects timezone-less input. This is D10.
11. Front-desk board is canonical Reception read model and requires bookings.read: admin/ops/receptionist allow; housekeeping/saas_admin deny.
12. Reception-selected booking governs embedded Billing; post-action preserves filter/search and continues by deterministic board priority.
13. Payments are immutable evidence. A total-changing operation reconciles invoice atomically; stale PAID is forbidden.
14. Settlement: `settled` means fully paid; positive balance requires pending-approved reference + admin-only checkout override.
15. Pricing mutation boundary (D9): only reservation room/date changes, reassignment, extension, extra charges or future explicitly priced commands may alter booking total. Guest/name/ordinary notes-only, check-in, cancellation, no-show, late arrival and checkout preserve stored total. Checkout may alter invoice/settlement state against that total but cannot reprice accommodation.
16. Cancellation/no-show preserve total and payment/invoice evidence; no automatic refund/penalty/retention.
17. API ownership follows `19`; generic PATCH/direct room status cannot bypass checked-in lifecycle/maintenance commands. Late arrival is the defined confirmed-booking metadata use of PATCH.
18. Inline guest+reservation is atomic; standalone guest creation remains separate intent.
19. Backend enforces material reasons/notes. New API surface, date-time format and pricing effects align OpenAPI/client before browser acceptance.
20. Freshness uses post-mutation/focus/context-entry refresh + modest visible polling; WebSockets not required.
21. Before material UI growth raw generated JS <=300000 without raising 320000 budget.
22. Success audit exists iff authoritative mutation wins.
23. Only departures listed in `20-intentional-target-departures.md` are authorized; unregistered divergence blocks BUILD.

## Human Gates

None remain open for the defined wave. Earlier financial gates were closed by source evidence; D9 and D10 are registered correctness/interoperability hardenings.

## Deferred

Frozen contracted rate for actual priced room/date mutations; new arrival cutoffs; automatic refund/retention/penalty; split stay/automatic relocation; multiple maintenance cases; richer SLA/category; paid realtime; production/cutover/real-data migration.

## Implementation latitude after phase exit

BUILD may choose internal module/SQL/component organization and tune low-cost polling. It may not alter states, transitions, pricing boundary/formulas, ETA wire semantics, evidence, RBAC, route ownership, registered departures, cross-module consequences or acceptance criteria without a new decision.