# 16 — Target transition matrix

Status: `BINDING DEFINITION`

## Booking commands

| Current booking | Command | Conditions | Result |
|---|---|---|---|
| CONFIRMED | edit reservation | before occupancy; availability valid | CONFIRMED |
| CONFIRMED | cancel | `hotel_local_date <= check_in` | CANCELLED + inventory released |
| CONFIRMED | check in | `check_in <= hotel_local_date < check_out`, room immediately ready | CHECKED_IN; room OCCUPIED |
| CONFIRMED | no-show | `hotel_local_date > check_in` and never occupied | NO_SHOW + inventory released |
| CHECKED_IN | extend stay | new checkout later; all added nights available; financial policy gate resolved | CHECKED_IN, later checkout |
| CHECKED_IN | reassign room | valid remaining-stay destination | CHECKED_IN on destination; old room DIRTY or MAINTENANCE according to BLOCKING case |
| CHECKED_IN | checkout | release/payment/handoff rules satisfied | CHECKED_OUT; old room DIRTY or MAINTENANCE |
| CHECKED_OUT | lifecycle mutation | none | rejected |
| CANCELLED | lifecycle mutation | none | rejected |
| NO_SHOW | lifecycle mutation | none in v1 | rejected |

No generic status rollback is authorized.

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
| any allowed operational state | open NON_BLOCKING maintenance | physical state unchanged |
| MAINTENANCE | resolve BLOCKING case | DIRTY |
| OCCUPIED | resolve maintenance after mitigation | OCCUPIED |
| AVAILABLE/DIRTY/CLEANING | resolve NON_BLOCKING case | physical state unchanged |

`OUT_OF_ORDER` remains an existing physical state but this wave does not define new transitions into/out of it.

## Availability overlay

A room is excluded from new advance sale if any of the following holds:

- physical state is not advance-reservable under status policy;
- overlapping booking inventory exists;
- overlapping room hold exists;
- open maintenance impact is `BLOCKING`.

Immediate readiness additionally requires physical `AVAILABLE`. An open `NON_BLOCKING` case is an advisory, not a blocker.

## Rejection principle

When a command is not listed as permitted, the default is reject; UI must not invent a path around the domain transition.