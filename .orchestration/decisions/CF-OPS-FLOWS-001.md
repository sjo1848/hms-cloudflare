# DECISION — CF-OPS-FLOWS-001

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`
Canonical summary: `docs/operational-flows/00-master-definition.md`

## Binding decisions

1. Room physical state, future sellability and immediate readiness are distinct concepts.
2. Vacating a room that was occupied never makes it directly `AVAILABLE`.
3. Maintenance is a case independent from room physical state; impact values are `NON_BLOCKING | BLOCKING`, separate from priority.
4. `NON_BLOCKING` is advisory and does not itself change physical room state or block sale.
5. `BLOCKING` excludes new occupancy. If already occupied, guest remains until explicit relocation/checkout; after vacancy the room is `MAINTENANCE` until resolved, then `DIRTY` before cleaning.
6. V1 preserves one open maintenance case per room; escalation to `BLOCKING` is explicit.
7. Reassignment of a checked-in stay moves only remaining inventory from `effective_date=max(check_in, hotel_local_date)` through checkout; historical room-night ownership is not rewritten.
8. `NO_SHOW` is distinct from cancellation, is eligible from the hotel-local arrival date (`hotel_local_date >= check_in`), releases reservation inventory and does not dirty a room that was never occupied.
9. Accepted source lifecycle timing is preserved: this definition does not add a new calendar-day cutoff to `CONFIRMED -> CHECKED_IN` or `CONFIRMED -> CANCELLED`. Formal check-in still requires the accepted checklist and immediate room readiness; cancellation still requires accepted terminal evidence.
10. All genuinely date-sensitive rules use server-derived hotel-local operational date from a persisted IANA timezone.
11. Checked-in extension is an explicit lifecycle command; it extends checkout forward and claims every added night atomically. Shortening is checkout. Split-stay/auto-relocation is deferred.
12. Reception shows readiness/blockers before check-in and controls embedded Billing selection by the same `booking_id`.
13. Checkout/reassignment handoff is represented by resulting room state: `DIRTY` routes to Housekeeping; open blocking maintenance routes to Maintenance.
14. Successful Reception actions preserve filter/search, reload authoritative data and continue to the next item according to queue priority.
15. Stable-ID query parameters preserve navigation context only; they never authorize data access.
16. Freshness v1 uses refresh-after-mutation, focus revalidation and modest visible-screen polling; WebSockets are not required by current evidence.
17. Before material UI growth, total generated raw JS must be reduced to `<=300000` without raising the existing 320000 budget or removing accepted behavior.
18. Payment entries remain immutable evidence; any authoritative increase in booking total must reconcile an existing invoice in the same logical operation.
19. Accepted checkout financial semantics are binding: `settled` requires a fully paid account; `pending-approved` is the governed positive-balance exception with the accepted reference/override requirements.
20. Human cancellation, no-show, extension, reassignment and checkout must emit truthful lifecycle/audit evidence only when the authoritative mutation wins.

## Human Gate

### HG-FIN-001 — extension rate basis

The new dedicated extension command requires an explicit approved rate basis. BUILD may not derive it from `total_cents / nights` or silently choose a commercial policy. Recommended direction: persist a contracted accommodation-rate snapshot and preserve it for ordinary extensions.

This gate blocks P0.4 price mutation. It does not reopen already-defined source checkout settlement semantics.

## Deferred policy

No-show/cancellation refund, retention or penalty; split-stay extension; multiple simultaneous maintenance cases; richer maintenance SLA/category model; push/WebSocket infrastructure; production/cutover changes; any future hard early/late check-in or cancellation cutoff.

## Implementation latitude after phase exit

Once authorized, Codex may choose file/module layout, helpers, SQL organization, component decomposition and exact low-cost polling interval, provided all binding semantics, source-parity requirements and invariants remain satisfied.