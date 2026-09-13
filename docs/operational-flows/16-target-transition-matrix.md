# 16 — Target transition matrix

Status: `BINDING / SOURCE-PARITY PLUS REGISTERED DEPARTURES`

## Booking commands

| Current | Command | Conditions | Result / pricing effect |
|---|---|---|---|
| CONFIRMED | edit reservation | availability valid | CONFIRMED; room/date change is pricing-affecting |
| CONFIRMED | record late arrival | future ETA inside stay; note min 6; `bookings.write` | CONFIRMED; context only; **total unchanged** |
| CONFIRMED | cancel | terminal reason min 6 | CANCELLED + inventory released; **total unchanged** |
| CONFIRMED | check in | checklist complete; room ready | CHECKED_IN + room OCCUPIED; **total unchanged** |
| CONFIRMED | no-show | `hotel_local_date >= check_in`; reason min 6 | NO_SHOW + inventory released; **total unchanged** |
| CHECKED_IN | extend stay | later checkout; added nights free | CHECKED_IN; pricing-affecting + invoice reconcile |
| CHECKED_IN | reassign | non-overrun; destination valid; reason min 6 | destination OCCUPIED; old DIRTY/MAINTENANCE; pricing-affecting + invoice reconcile |
| CHECKED_IN | reassign while overrun | `hotel_local_date >= check_out` | rejected until extend/checkout |
| CHECKED_IN | checkout | payment/checklist/handoff valid | CHECKED_OUT; room DIRTY/MAINTENANCE; **booking total unchanged**; settlement/invoice uses existing total |
| terminal | lifecycle mutation | — | rejected |

No generic status rollback. Late arrival is context, not state. Check-in/cancellation get no new calendar cutoff.

## Pricing mutation rule — D9

Pricing-affecting: room/date change, reassignment, extension, extra charge, or future explicitly priced command. Source pricing for room/date changes is total stay nights × current selected-room price + extras.

State/evidence-only: check-in, cancellation, no-show, late arrival, checkout. These preserve booking total even though accepted source generic update could incidentally reprice them. Existing invoice/payment evidence is not rewritten except checkout settlement/invoice mechanics against the preserved total.

## Maintenance case transitions

| Case / room | Command | Evidence / capability | Result |
|---|---|---|---|
| none / OCCUPIED | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; room OCCUPIED |
| none / OCCUPIED | open BLOCKING | reason min 6; maintenance.report | OPEN BLOCKING; room OCCUPIED + blocked |
| none / AVAILABLE | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; room AVAILABLE |
| none / DIRTY | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; room DIRTY |
| none / CLEANING | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; room CLEANING |
| none / AVAILABLE/DIRTY/CLEANING | open BLOCKING | reason min 6; maintenance.report | OPEN BLOCKING; room MAINTENANCE |
| OPEN NON_BLOCKING | escalate | escalation_note min 6; maintenance.report | OPEN BLOCKING; physical consequence follows state |
| OPEN / OCCUPIED | resolve | resolution_note min 6; maintenance.resolve | RESOLVED; room OCCUPIED |
| OPEN BLOCKING / MAINTENANCE | resolve | resolution_note min 6; maintenance.resolve | RESOLVED; room DIRTY |
| OPEN NON_BLOCKING / AVAILABLE/DIRTY/CLEANING | resolve | resolution_note min 6; maintenance.resolve | RESOLVED; physical state unchanged |
| RESOLVED | repeat escalate/resolve | — | rejected; no success event |

One open case/room. NON_BLOCKING never independently changes physical state or blocks sale/readiness.

## Room transitions

AVAILABLE + check-in -> OCCUPIED. OCCUPIED + normal vacancy -> DIRTY. OCCUPIED + vacancy with open BLOCKING -> MAINTENANCE. DIRTY -> CLEANING -> AVAILABLE. Open BLOCKING on vacant eligible state -> MAINTENANCE. Open/resolve NON_BLOCKING leaves physical state unchanged. Resolve BLOCKING from MAINTENANCE -> DIRTY. OUT_OF_ORDER transitions are outside scope.

## Availability / checkout

Advance sale is blocked by disallowed physical state, overlapping inventory, hold or open BLOCKING maintenance. Immediate readiness additionally requires AVAILABLE. NON_BLOCKING is advisory.

Checkout `settled` requires full authoritative settlement; positive balance requires accepted pending-approved reference and admin-only override.

## Contract rule

`19-api-command-contract-map.md` owns routes/evidence; `20-intentional-target-departures.md` owns permitted source divergence. Unlisted command/state combinations default to reject.