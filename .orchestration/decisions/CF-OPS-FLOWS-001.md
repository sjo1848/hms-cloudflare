# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`
Canonical summary: `docs/operational-flows/00-master-definition.md`
Canonical E2E scope: `docs/operational-flows/18-end-to-end-scope-matrix.md`
Canonical API map: `docs/operational-flows/19-api-command-contract-map.md`

## Binding decisions

1. Room physical state, future sellability and immediate readiness are distinct concepts.
2. Vacating a room that was occupied never makes it directly `AVAILABLE`.
3. Maintenance is a case independent from room physical state; impact values are `NON_BLOCKING | BLOCKING`, separate from priority.
4. `NON_BLOCKING` is advisory and does not itself change physical room state or block sale.
5. `BLOCKING` excludes new occupancy. If already occupied, guest remains until explicit relocation/checkout; after vacancy the room is `MAINTENANCE` until resolved, then `DIRTY` before cleaning.
6. V1 preserves one open maintenance case per room; escalation to `BLOCKING` is explicit.
7. Reassignment of a checked-in stay moves only remaining inventory from `effective_date=max(check_in, hotel_local_date)` through checkout; historical room-night ownership is not rewritten.
8. Accepted source reassignment pricing is preserved: booking accommodation is recalculated using total stay nights × destination room current price, then extra charges are added; any existing invoice is reconciled.
9. `NO_SHOW` is distinct from cancellation, is eligible from hotel-local arrival date (`hotel_local_date >= check_in`), releases reservation inventory and does not dirty a room that was never occupied.
10. Accepted source lifecycle timing is preserved: no new calendar-day cutoff is added to `CONFIRMED -> CHECKED_IN` or `CONFIRMED -> CANCELLED`. Formal check-in requires accepted checklist and immediate room readiness; cancellation requires accepted terminal evidence.
11. All genuinely date-sensitive rules use server-derived hotel-local operational date from a persisted IANA timezone.
12. Checked-in extension is an explicit lifecycle command; it extends checkout forward and claims every added night atomically. Source-parity pricing recalculates total accommodation as total stay nights × current room price, then adds extra charges and reconciles invoice. Shortening is checkout. Split-stay/auto-relocation is deferred.
13. Reception shows readiness/blockers before check-in and controls embedded Billing selection by the same `booking_id`.
14. Checkout/reassignment handoff is represented by resulting room state: `DIRTY` routes to Housekeeping; open blocking maintenance routes to Maintenance.
15. Successful Reception actions preserve filter/search, reload authoritative data and continue to the next item according to queue priority.
16. Stable-ID query parameters preserve navigation context only; they never authorize data access.
17. Freshness v1 uses refresh-after-mutation, focus revalidation and modest visible-screen polling; WebSockets are not required by current evidence.
18. Before material UI growth, total generated raw JS must be reduced to `<=300000` without raising the existing 320000 budget or removing accepted behavior.
19. Payment entries remain immutable evidence; any authoritative increase in booking total must reconcile an existing invoice in the same logical operation.
20. Accepted checkout financial semantics are binding: `settled` requires a fully paid account; `pending-approved` is the governed positive-balance exception with accepted reference/override requirements.
21. Human cancellation, no-show, extension, reassignment and checkout emit truthful lifecycle/audit evidence only when the authoritative mutation wins.
22. Maintenance RBAC is binding: admin/ops/housekeeping read-report-resolve; receptionist read-report only; saas_admin none. `maintenance.report` may escalate `NON_BLOCKING -> BLOCKING`; `maintenance.resolve` is required to close a case. Cleaning remains governed separately by `housekeeping.write`.
23. `bookings.checkout.override` remains admin-only. Refactoring lifecycle routes must not broaden this authority.
24. API ownership is binding to `19-api-command-contract-map.md`: preserve/harden existing check-in/reassign/check-out routes; keep confirmed-booking cancellation on existing update path; add explicit no-show and extend-stay commands; preserve/extend `/api/v1/front-desk/board`; expand maintenance-open and add explicit escalate/resolve commands.
25. The legacy `/housekeeping/:id/dirty` route is compatibility-only for the historical blocking `MAINTENANCE -> DIRTY` resolution path. New UI uses the canonical maintenance resolve command.
26. Generic booking PATCH must not become a backdoor for checked-in lifecycle transitions.
27. New/additive API contracts must be reflected in OpenAPI/client types before browser acceptance.

## Human Gates

None remain open in this definition package. Previously proposed financial gates were closed by accepted source evidence: pricing behavior for booking date/room updates and checkout settlement semantics are observable and contractual.

## Deferred product decisions

Any intentional departure from accepted source behavior requires explicit product authorization, including contracted/frozen nightly-rate pricing, early/late check-in cutoff, cancellation cutoff, configurable no-show hour, automated refund/retention/penalty, split-stay extension, multiple simultaneous maintenance cases, richer maintenance SLA/category model, push/WebSocket infrastructure or production/cutover changes.

## Implementation latitude after phase exit

Once authorized, BUILD may choose internal module/file layout, helpers, SQL organization, component decomposition and exact low-cost polling interval. It may not change the binding states, transitions, pricing semantics, RBAC mapping, canonical API ownership, cross-module consequences or acceptance requirements without a new decision.