# 06 — Booking temporal rules

Status: `BINDING DEFINITION / SOURCE-PARITY EXCEPT REGISTERED DEPARTURES`

Genuine date-sensitive rules use authoritative hotel-local date. No calendar restriction is invented unless registered in `20-intentional-target-departures.md`.

## Check-in

CONFIRMED + formal checklist + immediately ready AVAILABLE room + normal concurrency guards. No hard hotel-local-date check-in window is added; early/late context may be surfaced without narrowing source transition eligibility.

## Cancellation / no-show

Both are distinct terminal CONFIRMED transitions requiring terminal evidence.
- CANCELLED: no new arrival-date cutoff.
- NO_SHOW: `hotel_local_date >= check_in`, still confirmed, never occupied.
- future booking: no-show rejected.

## Late arrival — D10 time semantics

Late-arrival ETA/note keeps booking CONFIRMED and is operational context, not a state.

Wire ETA must be RFC3339/ISO-8601 with explicit Z/offset. Server parses the absolute instant, requires it to be future, converts it to the hotel's persisted IANA timezone, and validates `check_in <= eta_hotel_local_date < check_out`. Timezone-less input is invalid; browser timezone cannot change eligibility. The board may use valid late-arrival context for explanation/priority without narrowing lifecycle transitions.

## Stay overrun — D2

If CHECKED_IN and `hotel_local_date >= check_out`, classify overdue/overrun. Operator may checkout or extend to a later valid checkout. Reassignment is rejected until extension establishes a future interval or checkout ends occupancy. Classification itself does not mutate state.

## Queue consequence

Reception distinguishes future arrival, arrival due, overdue confirmed arrival, recorded late arrival, checked-in departure due and checked-in overrun. These are derived classifications, not hidden lifecycle gates.

## Future policy boundary

A new early-check-in restriction, late check-in cutoff, cancellation cutoff or configurable no-show hour requires a new product decision.