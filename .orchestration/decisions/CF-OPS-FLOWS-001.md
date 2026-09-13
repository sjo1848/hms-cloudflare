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
8. `NO_SHOW` is a terminal booking outcome distinct from cancellation and does not dirty a room that was never occupied.
9. All date-sensitive lifecycle eligibility uses server-derived hotel-local operational date from a persisted IANA timezone.
10. Checked-in extension is an explicit lifecycle command; it extends checkout forward and claims every added night atomically. Shortening is checkout. Split-stay/auto-relocation is deferred.
11. Reception shows readiness/blockers before check-in and controls embedded Billing selection by the same `booking_id`.
12. Checkout/reassignment handoff is represented by resulting room state: `DIRTY` routes to Housekeeping; open blocking maintenance routes to Maintenance.
13. Successful Reception actions preserve filter/search, reload authoritative data and continue to the next item according to queue priority.
14. Stable-ID query parameters preserve navigation context only; they never authorize data access.
15. Freshness v1 uses refresh-after-mutation, focus revalidation and modest visible-screen polling; WebSockets are not required by current evidence.
16. Before material UI growth, total generated raw JS must be reduced to `<=300000` without raising the existing 320000 budget or removing accepted behavior.
17. Payment entries remain immutable evidence; any authoritative increase in booking total must reconcile an existing invoice in the same logical operation.
18. Human cancellation, no-show, extension, reassignment and checkout must emit truthful lifecycle/audit evidence only when the authoritative mutation wins.

## Human Gates

### HG-FIN-001 — extension rate basis

BUILD may not infer an extension nightly rate from booking total or current room price without approval. Recommended direction: persist a contracted accommodation-rate snapshot and preserve it for ordinary extensions.

### HG-FIN-002 — checkout `settled`

BUILD may not decide whether `settled` is financial truth or a manual declaration. Recommended direction: require authoritative remaining balance = 0; positive balance uses `pending-approved` with authorized reference.

These gates block only increments that require the unresolved policy. They do not authorize unrelated implementation while the overall definition phase remains locked.

## Deferred policy

No-show/cancellation refund, retention or penalty; split-stay extension; multiple simultaneous maintenance cases; richer maintenance SLA/category model; push/WebSocket infrastructure; production/cutover changes.

## Implementation latitude after phase exit

Once authorized, Codex may choose file/module layout, helpers, SQL organization, component decomposition and exact low-cost polling interval, provided all binding semantics and invariants remain satisfied.