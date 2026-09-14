# 01 — Domain model

Status: `BINDING DEFINITION / SOURCE-PARITY PLUS REGISTERED HARDENING`.

## Booking lifecycle
`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with terminal alternatives `CANCELLED` and `NO_SHOW`. No generic rollback. No-show is eligible when `hotel_local_date >= check_in` and the guest never occupied the room. Check-in/cancellation gain no new calendar cutoff. Late arrival is operational metadata on CONFIRMED, not a state.

## Physical room state
States: `AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`, `OUT_OF_ORDER`. Normal turnover is `AVAILABLE -> OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`. Open BLOCKING maintenance at vacancy routes to MAINTENANCE; resolution returns DIRTY before cleaning. An occupied room never becomes directly AVAILABLE when vacated.

## Sellability / readiness
Physical state, future sellability and immediate readiness are distinct. Sellability combines physical policy, inventory, holds and BLOCKING maintenance. Immediate readiness requires AVAILABLE with no blocker.

## Maintenance
Maintenance is independent from physical room state. NON_BLOCKING is advisory/state-preserving. BLOCKING prevents new occupancy; occupied guest remains until explicit reassignment/checkout. V1 one open case/room.

## Inventory ownership
Lifecycle changes affecting booking/room/inventory are atomic. Reassignment moves only remaining `[effective_date,check_out)` claims and preserves elapsed room history. Extension claims only the added interval. No-show releases claims without dirtying room.

## Operational time
Genuine date predicates use server-derived hotel-local date from persisted IANA timezone. Browser/UTC date cannot authorize them. D10 governs late-arrival absolute-instant parsing.

## Financial relationship / D9-D11
Booking total, invoice and payment history are distinct related facts. Only explicitly priced operations may alter booking total: room/date edit, reassignment, extension, extra charge or future expressly priced command. Source-covered room/date pricing uses total stay nights × current selected-room price plus extras.

State/evidence-only operations preserve total: guest/name/notes-only update, check-in, cancellation, no-show, late arrival and checkout. This is D9.

Every actual total change reconciles any existing invoice in the same logical operation according to D11 in `20-intentional-target-departures.md`. D11 is authoritative for prior-payment edge cases, derived Billing values, status/timestamp reconciliation, schema compatibility and ineligible invoice state. Payment history is not rewritten by repricing.

Checkout settlement uses the D11-authoritative Billing result; checkout itself never reprices accommodation.

## Audit principle
Every successful lifecycle/arrival/maintenance/financial mutation records truthful actor/hotel/request/material details only when authoritative state mutation wins. Failed/stale/lost-race operations create no success event.