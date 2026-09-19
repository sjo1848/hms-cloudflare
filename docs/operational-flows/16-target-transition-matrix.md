# 16 — Target transition matrix

Status: `BINDING / SOURCE-PARITY PLUS REGISTERED DEPARTURES`

## Booking commands

| Current | Command | Conditions | Result / pricing effect |
|---|---|---|---|
| CONFIRMED | edit reservation | availability valid | CONFIRMED; room/date change priced + D11; metadata-only total unchanged |
| CONFIRMED | record late arrival | future ETA inside stay; note min 6 | CONFIRMED context; total unchanged |
| CONFIRMED | cancel | terminal reason min 6 | CANCELLED + inventory released; total unchanged |
| CONFIRMED | check in | checklist complete; room ready | CHECKED_IN + OCCUPIED; total unchanged |
| CONFIRMED | no-show | local date >= check_in; reason min 6 | NO_SHOW + inventory released; total unchanged |
| CHECKED_IN | extend stay | later checkout; added nights valid; D11 eligible | CHECKED_IN; priced + D11 |
| CHECKED_IN | reassign | non-overrun; destination valid; reason min 6; D11 eligible | destination OCCUPIED; old DIRTY/MAINTENANCE; priced + D11 |
| CHECKED_IN | reassign while overrun | local date >= check_out | rejected until extend/checkout |
| CHECKED_IN | checkout | payment/checklist/handoff valid; valid Billing authority | CHECKED_OUT; room DIRTY/MAINTENANCE; total unchanged |
| terminal | lifecycle mutation | — | rejected |

No generic rollback. Late arrival is context. Check-in/cancellation get no new calendar cutoff.

## Pricing / reconciliation — D9/D11
Only room/date change, reassignment, extension, extra charge or future explicitly priced command may alter total. All such operations reconcile existing invoice under D11 in the same atomic mutation. An invoice condition that D11 marks ineligible causes conflict before any partial state change.

State/evidence-only commands preserve total. D11 also governs the checkout settlement boundary and derived Billing view semantics.

## Maintenance case transitions

| Case / room | Command | Evidence / capability | Result |
|---|---|---|---|
| none / OCCUPIED | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; OCCUPIED |
| none / OCCUPIED | open BLOCKING | reason min 6; maintenance.report | OPEN BLOCKING; OCCUPIED + blocked |
| none / AVAILABLE | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; AVAILABLE |
| none / DIRTY | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; DIRTY |
| none / CLEANING | open NON_BLOCKING | reason min 6; maintenance.report | OPEN NON_BLOCKING; CLEANING |
| none / AVAILABLE/DIRTY/CLEANING | open BLOCKING | reason min 6; maintenance.report | OPEN BLOCKING; MAINTENANCE |
| OPEN NON_BLOCKING | escalate | note min 6; maintenance.report | OPEN BLOCKING; physical consequence follows state |
| OPEN / OCCUPIED | resolve | note min 6; maintenance.resolve | RESOLVED; OCCUPIED |
| OPEN BLOCKING / MAINTENANCE | resolve | note min 6; maintenance.resolve | RESOLVED; DIRTY |
| OPEN NON_BLOCKING / AVAILABLE/DIRTY/CLEANING | resolve | note min 6; maintenance.resolve | RESOLVED; physical state unchanged |
| RESOLVED | repeat | — | rejected; no success event |

One open case/room. NON_BLOCKING does not independently alter state or block sale/readiness.

## Room / availability
AVAILABLE + check-in -> OCCUPIED. Occupied normal vacancy -> DIRTY. Occupied vacancy with open BLOCKING -> MAINTENANCE. DIRTY -> CLEANING -> AVAILABLE. BLOCKING on vacant eligible state -> MAINTENANCE. Resolve BLOCKING from MAINTENANCE -> DIRTY. OUT_OF_ORDER changes are outside scope.

Advance sale is blocked by disallowed physical state, inventory, hold or BLOCKING maintenance. Immediate readiness additionally requires AVAILABLE.

## Checkout
`settled` requires authoritative valid Billing with no remaining balance. Positive balance requires accepted pending-approved reference and admin-only override. D11-ineligible invoice state cannot authorize checkout.

## Contract rule
`19` owns routes/evidence/API effects; `20` owns permitted source divergence. Unlisted command/state combinations default to reject.