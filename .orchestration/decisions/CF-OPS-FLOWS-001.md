# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`

Canonical authority: `00-master-definition.md`, `16-target-transition-matrix.md`, `18-end-to-end-scope-matrix.md`, `19-api-command-contract-map.md`, `20-intentional-target-departures.md`, `05-maintenance-data-rbac.md`, and `.orchestration/OPERATIONAL-INVARIANTS.md`.

## Binding decisions

1. Physical room state, future sellability and immediate readiness are different facts.
2. A room actually occupied never goes directly to AVAILABLE on checkout/reassignment; normal vacancy is DIRTY unless an open BLOCKING maintenance case requires MAINTENANCE.
3. Maintenance impact is `NON_BLOCKING | BLOCKING`, independent of room state and priority. V1 keeps one open case per room.
4. `NON_BLOCKING` may be opened on OCCUPIED, AVAILABLE, DIRTY or CLEANING and never independently changes physical state or blocks sale/readiness.
5. `BLOCKING` prevents new occupancy; occupied guest remains until explicit reassign/checkout; vacant eligible state becomes MAINTENANCE; resolution from MAINTENANCE returns DIRTY.
6. Maintenance RBAC: admin/ops/housekeeping read-report-resolve; receptionist read-report/escalate but not resolve; saas_admin none. Cleaning remains under `housekeeping.write`.
7. Reassignment moves only remaining inventory from `effective_date=max(check_in,hotel_local_date)`, preserves history, requires reason min 6 and rejects overrun stays until extension/checkout.
8. Reassignment pricing preserves source semantics: total stay nights × destination current price + extras, with invoice reconciliation.
9. No-show is distinct from cancellation; eligible from `hotel_local_date >= check_in`; releases inventory; never dirties a never-occupied room.
10. Check-in and cancellation receive no new calendar cutoff.
11. Hotel-local date is server-derived from persisted IANA timezone for genuine date predicates.
12. Stay extension is explicit, forward-only, all-added-nights atomic, source repricing + invoice reconciliation.
13. Late arrival remains context on `CONFIRMED`, not a lifecycle state. Canonical write is existing `PATCH /api/v1/bookings/:id` with `front_desk.late_arrival_eta` and `late_arrival_note`; ETA future and hotel-local date inside stay; note min 6/max 250; actor/time/audit persisted; no room/inventory/Billing mutation.
14. `GET /api/v1/front-desk/board` is the canonical Reception read model and requires `bookings.read`; admin/ops/receptionist allowed, housekeeping/saas_admin denied.
15. Reception-selected `booking_id` governs embedded Billing; post-action flow preserves filters/search and continues by deterministic board priority.
16. Payments remain immutable evidence; booking total/invoice stay consistent. `settled` requires full payment; `pending-approved` requires accepted reference and admin-only `bookings.checkout.override`.
17. API ownership follows `19`; generic PATCH/direct room-status writes cannot bypass canonical checked-in lifecycle/maintenance commands.
18. Inline new guest + reservation is one atomic command; standalone guest creation remains explicit separate intent.
19. Material evidence is backend-enforced: terminal reason min 6, reassignment reason min 6, maintenance escalation/resolution notes min 6, late-arrival note min 6.
20. Frontend/API/OpenAPI/client contracts must align before browser acceptance.
21. Freshness uses post-mutation refresh, focus/context-entry revalidation and modest visible-screen polling; WebSockets are not required.
22. Before material UI growth raw generated JS must be `<=300000` without raising the 320000 budget.
23. Successful lifecycle/maintenance operations emit truthful audit only when the authoritative mutation wins.
24. The only source departures authorized are those registered in `20-intentional-target-departures.md`; unregistered divergence blocks BUILD.

## Human Gates

None remain open for the defined operational-flow wave. Earlier financial gates were closed by accepted source evidence.

## Deferred product decisions

Frozen/contracted nightly pricing; new check-in/cancellation/no-show cutoffs; automatic refund/retention/penalty; split stay/automatic relocation; multiple simultaneous maintenance cases; richer maintenance SLA/category model; paid push/WebSockets; production/cutover/real-data migration.

## Implementation latitude after phase exit

BUILD may choose internal module/file/SQL/component organization and tune the low-cost polling interval. It may not alter binding states, transitions, pricing, evidence, RBAC, route ownership, source-departure register, cross-module consequences or acceptance criteria without a new decision.