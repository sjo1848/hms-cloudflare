# 16 — Target transition matrix

Status: `BINDING DEFINITION / SOURCE-PARITY PLUS REGISTERED TARGET DEPARTURES`

## Booking commands

| Current booking | Command | Conditions | Result |
|---|---|---|---|
| CONFIRMED | edit reservation | pre-occupancy edit; availability valid | CONFIRMED |
| CONFIRMED | record late arrival | future ETA inside stay; note min 6; `bookings.write` | CONFIRMED + late-arrival context updated |
| CONFIRMED | cancel | `terminal_reason` min 6; booking still confirmed | CANCELLED + inventory released |
| CONFIRMED | check in | formal check-in evidence complete; room immediately ready; concurrency guards pass | CHECKED_IN; room OCCUPIED |
| CONFIRMED | no-show | `hotel_local_date >= check_in`; never occupied; `terminal_reason` min 6 | NO_SHOW + inventory released |
| CHECKED_IN | extend stay | new checkout later; all added nights available | CHECKED_IN, later checkout; source repricing + invoice reconciliation |
| CHECKED_IN | reassign room | `hotel_local_date < check_out`; valid remaining-stay destination; `reason` min 6 | CHECKED_IN on destination; old room DIRTY or MAINTENANCE; source destination repricing + invoice reconciliation |
| CHECKED_IN | reassign while overrun | `hotel_local_date >= check_out` | rejected until extension establishes future checkout or checkout ends occupancy |
| CHECKED_IN | checkout | source payment/checklist/handoff rules satisfied | CHECKED_OUT; old room DIRTY or MAINTENANCE |
| CHECKED_OUT | lifecycle mutation | none | rejected |
| CANCELLED | lifecycle mutation | none | rejected |
| NO_SHOW | lifecycle mutation | none in v1 | rejected |

No generic status rollback is authorized. Late arrival is context, not a lifecycle state. No hard calendar guard is added to check-in/cancellation. The overrun reassignment guard is registered target correction D2.

## Source-parity pricing on booking update

For covered room/date changes:

`accommodation_total = total_stay_nights × current selected room price_cents + extra_charges_total`

Reassignment uses destination current price; extension uses current assigned room price with the new total night count. Existing invoice is reconciled atomically. Frozen/contracted-rate pricing is outside this wave.

## Maintenance case transitions

| Current case / room | Command | Evidence / capability | Result |
|---|---|---|---|
| no open case / OCCUPIED | open NON_BLOCKING | reason min 6; `maintenance.report` | OPEN NON_BLOCKING; room OCCUPIED |
| no open case / OCCUPIED | open BLOCKING | reason min 6; `maintenance.report` | OPEN BLOCKING; room OCCUPIED + sale/readiness blocked |
| no open case / AVAILABLE | open NON_BLOCKING | reason min 6; `maintenance.report` | OPEN NON_BLOCKING; room AVAILABLE; sale remains allowed subject to normal inventory/holds |
| no open case / DIRTY | open NON_BLOCKING | reason min 6; `maintenance.report` | OPEN NON_BLOCKING; room DIRTY |
| no open case / CLEANING | open NON_BLOCKING | reason min 6; `maintenance.report` | OPEN NON_BLOCKING; room CLEANING |
| no open case / AVAILABLE/DIRTY/CLEANING | open BLOCKING | reason min 6; `maintenance.report` | OPEN BLOCKING; room MAINTENANCE |
| OPEN NON_BLOCKING | escalate | `escalation_note` min 6; `maintenance.report` | OPEN BLOCKING; physical consequence follows current occupancy/state |
| OPEN case / OCCUPIED | resolve | `resolution_note` min 6; `maintenance.resolve` | RESOLVED; room remains OCCUPIED |
| OPEN BLOCKING / MAINTENANCE | resolve | `resolution_note` min 6; `maintenance.resolve` | RESOLVED; room DIRTY |
| OPEN NON_BLOCKING / AVAILABLE/DIRTY/CLEANING | resolve | `resolution_note` min 6; `maintenance.resolve` | RESOLVED; physical state unchanged |
| RESOLVED | escalate/resolve again | none | rejected/no new success event |

One open maintenance case per room remains the v1 invariant. `NON_BLOCKING` never independently changes physical state or blocks sale/readiness; the underlying physical state still governs normal readiness (for example DIRTY remains not ready because it is DIRTY, not because of the non-blocking case).

## Room physical transitions

| Current room | Trigger | Result |
|---|---|---|
| AVAILABLE | successful check-in | OCCUPIED |
| OCCUPIED | normal checkout/reassign, no BLOCKING maintenance | DIRTY |
| OCCUPIED | checkout/reassign with open BLOCKING maintenance | MAINTENANCE |
| DIRTY | cleaning start | CLEANING |
| CLEANING | cleaning finish with no blocking condition | AVAILABLE |
| AVAILABLE/DIRTY/CLEANING | open BLOCKING maintenance | MAINTENANCE |
| OCCUPIED | open BLOCKING maintenance | OCCUPIED + blocked case; relocation attention |
| OCCUPIED/AVAILABLE/DIRTY/CLEANING | open NON_BLOCKING maintenance | physical state unchanged |
| MAINTENANCE | resolve BLOCKING case | DIRTY |
| OCCUPIED | resolve maintenance after mitigation | OCCUPIED |
| AVAILABLE/DIRTY/CLEANING | resolve NON_BLOCKING case | physical state unchanged |

`OUT_OF_ORDER` remains an existing physical state; this wave defines no new transition into/out of it.

## Availability overlay

A room is excluded from new advance sale when physical-status policy disallows sale, overlapping booking inventory exists, an overlapping hold exists, or an open maintenance case is `BLOCKING`.

Immediate readiness additionally requires physical `AVAILABLE`. `NON_BLOCKING` is advisory and is not an independent blocker.

## Checkout policy parity

`settled` requires authoritative full settlement. `pending-approved` is the positive-balance exception with required reference and admin-only `bookings.checkout.override`. UI declarations cannot bypass backend validation.

## Contract/departure rule

Canonical API/evidence ownership is `19-api-command-contract-map.md`; authorized source departures are exactly `20-intentional-target-departures.md`. If a command/state combination is not permitted by this matrix or another explicit canonical contract, default is reject. BUILD cannot invent another route, transition, cutoff or pricing rule.