# 16 — Target transition matrix

Status: `BINDING DEFINITION / SOURCE-PARITY PRESERVING`

## Booking commands

| Current booking | Command | Conditions | Result |
|---|---|---|---|
| CONFIRMED | edit reservation | pre-occupancy edit; availability valid | CONFIRMED |
| CONFIRMED | cancel | accepted terminal reason/evidence; booking still confirmed | CANCELLED + inventory released |
| CONFIRMED | check in | formal check-in evidence complete; room immediately ready; concurrency guards pass | CHECKED_IN; room OCCUPIED |
| CONFIRMED | no-show | `hotel_local_date >= check_in`; never occupied; accepted terminal reason/evidence | NO_SHOW + inventory released |
| CHECKED_IN | extend stay | new checkout later; all added nights available | CHECKED_IN, later checkout; source-parity repricing + invoice reconciliation |
| CHECKED_IN | reassign room | valid remaining-stay destination | CHECKED_IN on destination; old room DIRTY or MAINTENANCE; source-parity destination repricing + invoice reconciliation |
| CHECKED_IN | checkout | source-parity payment/checklist/handoff rules satisfied | CHECKED_OUT; old room DIRTY or MAINTENANCE |
| CHECKED_OUT | lifecycle mutation | none | rejected |
| CANCELLED | lifecycle mutation | none | rejected |
| NO_SHOW | lifecycle mutation | none in v1 | rejected |

No generic status rollback is authorized.

Calendar date is not added as a new hard guard for check-in/cancellation because accepted source does not impose one. A future cutoff requires an explicit product decision.

## Source-parity pricing on booking update

For date/room changes covered by accepted source behavior:

`accommodation_total = total_stay_nights × current selected room price_cents`

then existing extra charges are added to derive authoritative booking total.

Reassignment therefore uses destination current room price; extension uses current assigned room price with the new total night count. Existing invoice state is reconciled atomically to the authoritative total.

A frozen/contracted-rate model is not part of this wave unless explicitly authorized later.

## Room physical transitions

| Current room | Trigger | Result |
|---|---|---|
| AVAILABLE | successful check-in | OCCUPIED |
| OCCUPIED | normal checkout/reassign, no BLOCKING maintenance | DIRTY |
| OCCUPIED | checkout/reassign with open BLOCKING maintenance | MAINTENANCE |
| DIRTY | cleaning start | CLEANING |
| CLEANING | cleaning finish | AVAILABLE |
| AVAILABLE/DIRTY/CLEANING | open BLOCKING maintenance | MAINTENANCE |
| OCCUPIED | open BLOCKING maintenance | OCCUPIED + blocked case; relocation required |
| allowed operational state | open NON_BLOCKING maintenance | physical state unchanged |
| MAINTENANCE | resolve BLOCKING case | DIRTY |
| OCCUPIED | resolve maintenance after mitigation | OCCUPIED |
| AVAILABLE/DIRTY/CLEANING | resolve NON_BLOCKING case | physical state unchanged |

`OUT_OF_ORDER` remains an existing physical state but this wave does not define new transitions into/out of it.

## Availability overlay

A room is excluded from new advance sale if physical status policy disallows sale, overlapping booking inventory exists, an overlapping room hold exists, or an open maintenance case is `BLOCKING`.

Immediate readiness additionally requires physical `AVAILABLE`. An open `NON_BLOCKING` case is advisory, not an independent blocker.

## Checkout policy parity

`settled` requires authoritative account settlement as defined by accepted source. `pending-approved` is the governed positive-balance exception with accepted reference/override requirements. UI declarations alone do not bypass backend financial validation.

## Rejection principle

When a command is not listed as permitted, default is reject. UI must not invent a path around domain transitions, and implementation must not add a stricter business cutoff/pricing model without an approved product decision.