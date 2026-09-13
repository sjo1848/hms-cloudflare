# 01 — Domain model

Status: `BINDING DEFINITION / SOURCE-PARITY PRESERVING`.

## Booking lifecycle

Target states:

`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`

Alternative terminal paths from `CONFIRMED`:

- `CANCELLED`
- `NO_SHOW`

`CANCELLED` and `NO_SHOW` are distinct terminal outcomes with accepted terminal evidence. `NO_SHOW` is eligible from the hotel-local arrival date (`hotel_local_date >= check_in`) when the guest never occupied the room. `CHECKED_OUT` means actual occupancy ended. A checked-in stay is extended through an explicit lifecycle command; shortening an occupied stay is checkout. Terminal states do not roll back through generic mutation.

This definition does not add a new calendar cutoff to accepted source check-in or cancellation behavior.

## Physical room state

Physical states remain:

`AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`, `OUT_OF_ORDER`.

Normal turnover:

`AVAILABLE -> OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`.

Blocking-maintenance turnover:

`AVAILABLE|DIRTY|CLEANING -> MAINTENANCE -> DIRTY -> CLEANING -> AVAILABLE`.

After a guest actually occupied a room, vacating it never makes it directly `AVAILABLE`.

## Sellable availability and readiness

Future sellability is derived from room-state policy, booking inventory, holds, open blocking maintenance and other explicit out-of-service rules. Immediate check-in readiness is stricter: the assigned room must be physically `AVAILABLE` with no blocking condition.

Therefore:

`physical room state != future sellable availability != immediate readiness`.

## Maintenance case model

A maintenance incident is a case independent from room physical state.

Case impact:

- `NON_BLOCKING` — advisory; it does not itself change physical state or block sale.
- `BLOCKING` — room is not fit for new occupancy.

Impact is separate from priority. If a blocking case opens on a vacant room, the room enters `MAINTENANCE`. If it opens while `OCCUPIED`, the room remains occupied until explicit relocation/checkout succeeds; future sale is blocked. When a blocking case remains open after vacancy, the room enters `MAINTENANCE`. Resolving from maintenance returns it to `DIRTY` before normal cleaning.

V1 preserves one open case per room. Escalation from non-blocking to blocking is explicit; multiple simultaneous independent cases are deferred.

## Inventory ownership

Booking inventory and room state change atomically when a lifecycle command affects both.

- Check-in retains stay claims and makes the room occupied.
- Checkout releases unneeded inventory and makes the old room `DIRTY` or `MAINTENANCE` according to open blocking maintenance.
- Reassignment uses authoritative hotel-local operational date and moves only remaining stay inventory `[effective_date, check_out)` to the destination. Historical nights stay associated with the previous room.
- Extension claims only added nights `[old_check_out, new_check_out)` and succeeds only if all remain available.
- No-show releases reservation inventory without dirtying the room because no occupancy occurred.

A partial booking/room/inventory transition is failure.

## Operational time

Where calendar date is an accepted business predicate, use server-derived `hotel_local_date` from the hotel's persisted IANA timezone. Browser-local or raw UTC date does not authorize such decisions. This foundation does not create new date gates for transitions that source behavior does not date-restrict.

## Financial relationship and pricing

`booking.total_cents`, invoices and payments are distinct but related facts. Payment entries are immutable evidence. Any successful operation that changes authoritative booking total must reconcile any existing invoice in the same logical operation.

For accepted source-covered room/date updates, accommodation pricing uses total stay nights × current selected room price, then extra charges are added. Reassignment therefore uses destination current room price; extension uses current assigned room price with new total nights. A future frozen/contracted-rate model requires an explicit product decision.

Checkout `settled` requires an authoritative fully paid account; `pending-approved` remains the governed positive-balance exception.

## Audit principle

Every successful lifecycle mutation records truthful audit/event data for the winning operation with actor, hotel, request identity and material transition details. Failed, stale or lost-race mutations create no success event.