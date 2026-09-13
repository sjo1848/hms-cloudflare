# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`
Canonical summary: `docs/operational-flows/00-master-definition.md`
Canonical E2E scope: `docs/operational-flows/18-end-to-end-scope-matrix.md`
Canonical API map: `docs/operational-flows/19-api-command-contract-map.md`
Authorized source departures: `docs/operational-flows/20-intentional-target-departures.md`

## Binding decisions

1. Room physical state, future sellability and immediate readiness are distinct concepts.
2. Vacating a room that was occupied never makes it directly `AVAILABLE`.
3. Maintenance is a case independent from room physical state; impact values are `NON_BLOCKING | BLOCKING`, separate from priority.
4. `NON_BLOCKING` is advisory and does not itself change physical room state or block sale.
5. `BLOCKING` excludes new occupancy. If already occupied, guest remains until explicit relocation/checkout; after vacancy the room is `MAINTENANCE` until resolved, then `DIRTY` before cleaning.
6. V1 preserves one open maintenance case per room; escalation to `BLOCKING` is explicit.
7. Reassignment moves only remaining inventory from `effective_date=max(check_in, hotel_local_date)` through checkout; historical room-night ownership is not rewritten.
8. Source reassignment pricing is preserved: total stay nights × destination room current price + extra charges; existing invoice is reconciled.
9. `NO_SHOW` is distinct from cancellation, eligible when `hotel_local_date >= check_in`, releases inventory and does not dirty a never-occupied room.
10. No new calendar cutoff is added to `CONFIRMED -> CHECKED_IN` or `CONFIRMED -> CANCELLED`. Formal check-in requires accepted evidence/readiness; cancellation requires terminal evidence.
11. Genuinely date-sensitive rules use server-derived hotel-local date from persisted IANA timezone.
12. Checked-in extension is explicit; it extends checkout forward, claims all added nights atomically, applies source repricing and reconciles invoice. Shortening is checkout. Split-stay/auto-relocation is deferred.
13. Reception shows readiness/blockers before check-in and selected `booking_id` controls embedded Billing.
14. Checkout/reassignment handoff follows resulting room state: `DIRTY` -> Housekeeping; open blocking maintenance -> Maintenance.
15. Successful Reception actions preserve search/filter, reload authoritative data and continue by deterministic queue priority.
16. Stable-ID query params preserve context only; never authorization.
17. Freshness v1 uses post-mutation refresh, focus/context-entry revalidation and modest visible-screen polling; WebSockets are not required.
18. Before material UI growth, total generated raw JS must be `<=300000` without raising the 320000 budget or removing accepted behavior.
19. Payment entries remain immutable evidence; any authoritative booking-total change reconciles an existing invoice in the same logical operation.
20. `settled` requires fully paid account; `pending-approved` is the governed exception with accepted reference and override requirements.
21. Cancellation, no-show, extension, reassignment, checkout and maintenance emit success evidence only when the authoritative mutation wins.
22. Maintenance RBAC is binding: admin/ops/housekeeping read-report-resolve; receptionist read-report only; saas_admin none. `maintenance.report` can open/escalate; `maintenance.resolve` closes. Cleaning remains `housekeeping.write`.
23. `bookings.checkout.override` remains admin-only.
24. API ownership is binding to `19`: preserve/harden check-in/reassign/check-out; keep confirmed cancellation on booking update; add explicit no-show/extend-stay; preserve/extend front-desk board; add atomic guest+booking; expand maintenance open and add read/escalate/resolve.
25. Legacy `/housekeeping/:id/dirty` is compatibility-only for historical blocking `MAINTENANCE -> DIRTY`; new UI uses canonical maintenance resolve.
26. Generic booking PATCH/direct room status cannot bypass canonical lifecycle/maintenance commands.
27. New/additive API surface must update OpenAPI/client types before browser acceptance.
28. Material operator evidence is server-validated: cancellation/no-show terminal reason min 6; active reassignment reason min 6; escalation note min 6; resolution note min 6.
29. Room-scoped maintenance detail is available through canonical `GET /api/v1/housekeeping/:id/maintenance` using `maintenance.read`; no-case returns `{maintenance_case:null}`.
30. An active checked-in overrun (`hotel_local_date >= check_out`) cannot be reassigned until extended to a future checkout or checked out. This is intentional target correction D2, not source parity.
31. The only authorized differences from accepted source behavior are those listed in `20-intentional-target-departures.md`. Any additional divergence requires a new decision before BUILD proceeds.

## Current authorized target departures

D1 authoritative hotel-local operational date; D2 overrun reassignment guard; D3 explicit no-show/extend-stay commands; D4 server-enforced active reassignment reason; D5 atomic inline guest+reservation; D6 occupied maintenance/dedicated capabilities; D7 restore/extend source front-desk board; D8 invoice consistency hardening.

## Human Gates

None remain open for the defined wave. Previously proposed financial gates were closed by accepted source evidence: date/room update pricing and checkout settlement semantics are observable and contractual.

## Deferred product decisions

Any further source departure requires explicit authorization, including frozen nightly rates, new check-in/cancellation/no-show cutoffs, automated refund/retention/penalty, split-stay extension, multiple simultaneous maintenance cases, richer maintenance SLA/category model, paid push/WebSockets or production/cutover changes.

## Implementation latitude after phase exit

Once authorized, BUILD may choose internal module/file layout, helpers, SQL organization, component decomposition and exact low-cost polling interval. It may not alter binding states, transitions, pricing, evidence requirements, RBAC, canonical API ownership, registered departures, cross-module consequences or acceptance criteria without a new decision.