# 06 — Booking temporal rules

Status: `BINDING DEFINITION / SOURCE-PARITY PRESERVING EXCEPT EXPLICIT DEPARTURES`

All genuinely date-sensitive rules use authoritative `hotel_local_date`. This document does not invent calendar restrictions unless they are explicitly registered in `20-intentional-target-departures.md`.

## Formal check-in

Source parity governs the transition:

- booking is `CONFIRMED`;
- formal check-in checklist/evidence is complete;
- assigned room is immediately ready / physically `AVAILABLE`;
- normal lifecycle/concurrency guards pass.

The accepted source does not add a hard `hotel_local_date` window to `Confirmed -> CheckedIn`, so this definition does not introduce one. Early/late-date conditions may be surfaced as operational context, but a future rule that forbids them requires an explicit product decision.

## Cancellation and no-show

Both remain distinct terminal transitions from `CONFIRMED` and require accepted terminal evidence/reason.

- `CANCELLED`: no new arrival-date cutoff; eligibility ends when booking leaves `CONFIRMED`.
- `NO_SHOW`: allowed when `hotel_local_date >= check_in` and booking remains confirmed/never occupied.
- future booking (`hotel_local_date < check_in`): no-show rejected.

This preserves source timing while using hotel-local rather than UTC/browser date authority.

## Late arrival

A late-arrival ETA/note keeps booking `CONFIRMED` and preserves accepted source semantics. The front-desk board may use it for explanation/priority but it is not a new booking state.

## Stay overrun

If booking is `CHECKED_IN` and `hotel_local_date >= check_out`, the read model treats it as an overdue departure/overrun attention case.

Normal operator choices are:
- checkout now; or
- extend to a later checkout if added nights are available.

Target-specific rule: an overrun stay cannot be reassigned to another room until a valid future checkout exists through extension. This restriction is deliberately stricter than accepted source behavior because reassignment otherwise has no authoritative remaining-night interval. It is explicitly governed by departure `D2` in `20-intentional-target-departures.md`.

The overrun classification itself does not mutate state.

## Queue consequence

Reception distinguishes future arrival, arrival due, overdue confirmed arrival, checked-in departure due, checked-in overdue departure and recorded late arrival. These are derived classifications; they must not silently narrow lifecycle transitions beyond explicit target departures.

## Future policy boundary

A new early-check-in date restriction, late check-in cutoff, cancellation cutoff or configurable no-show hour requires a product decision. BUILD cannot derive such cutoffs from browser time, hotel timezone or queue ranking.