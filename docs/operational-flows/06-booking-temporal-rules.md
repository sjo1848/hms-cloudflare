# 06 — Booking temporal rules

Status: `BINDING DEFINITION / SOURCE-PARITY PRESERVING`

All genuinely date-sensitive rules use authoritative `hotel_local_date`. This document does not invent calendar restrictions that the accepted source does not contain.

## Formal check-in

Source parity governs the transition:

- booking is `CONFIRMED`;
- formal check-in checklist/evidence is complete;
- assigned room is immediately ready / physically `AVAILABLE`;
- normal lifecycle/concurrency guards pass.

The accepted source does not add a hard `hotel_local_date` window to `Confirmed -> CheckedIn`, so this definition does not introduce one. Early/late-date conditions may be surfaced as operational context, but a future rule that forbids them requires an explicit product decision.

## Cancellation and no-show

Both remain distinct terminal transitions from `CONFIRMED` and require the accepted terminal evidence/reason.

- `CANCELLED`: no new arrival-date cutoff is introduced by this definition; eligibility ends when the booking leaves `CONFIRMED`.
- `NO_SHOW`: allowed only when `hotel_local_date >= check_in` and the booking remains confirmed/never occupied.
- future booking (`hotel_local_date < check_in`): no-show rejected.

This preserves the source distinction without overloading cancellation or silently changing accepted timing.

## Late arrival

A late-arrival ETA/note keeps the booking `CONFIRMED` and preserves the accepted source semantics. The front desk read model may use it to explain/prioritize the case but it is not a new booking state.

## Stay overrun

If a booking is already `CHECKED_IN` and hotel-local date is at/after checkout, the read model treats it as an overdue departure/overrun attention case.

The normal operator choices are checkout or a separately authorized stay extension if inventory and financial policy permit. The overrun classification itself does not mutate state.

## Queue consequence

Reception should distinguish future arrival, arrival due, overdue confirmed arrival, checked-in departure due, checked-in overdue departure and recorded late arrival. These are derived operational classifications; they must not silently narrow the accepted lifecycle transition graph.

## Future policy boundary

A product decision is required before adding a hard early-check-in date, late check-in cutoff, cancellation cutoff, or configurable no-show hour. BUILD cannot derive such cutoffs from browser time, hotel timezone or operational ranking.