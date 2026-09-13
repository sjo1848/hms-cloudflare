# 15 — Lifecycle event and audit contract

Status: `BINDING DEFINITION`

## Events required for next wave

Lifecycle audit must represent at least:

- `CHECK_IN`
- `REASSIGN`
- `CHECK_OUT`
- `NO_SHOW`
- `EXTEND_STAY`
- booking cancellation (`CANCEL` or equivalent domain event)

Exact persisted enum names are implementation latitude if tests and consumers remain explicit.

## Material details

### Check-in

Operational date, room id, guest count and confirmed checklist facts.

### Reassignment

Old room, new room, effective hotel-local date, moved remaining-night range, resulting old-room state, and blocking-maintenance case id when applicable.

### Checkout

Room id, resulting room state, downstream work target (`HOUSEKEEPING` or `MAINTENANCE`), payment policy/reference and required confirmations.

### No-show

Assigned room, hotel-local operational date, original stay dates and inventory-release outcome. No financial penalty is implied.

### Extend stay

Old/new checkout, added-night range and financial delta metadata once HG-FIN-001 is resolved.

### Cancellation

Assigned room, stay dates, hotel-local operational date and inventory release.

## Atomic truth rule

A success event exists iff the corresponding authoritative state mutation won. Failed validation, stale-state conflict or lost concurrency race creates no success event.

## Timestamp versus operational date

Audit `created_at` remains an absolute timestamp. Hotel-local operational date is additional domain context where date eligibility matters; one must not replace the other.

## Cancellation hardening

Current human booking cancellation has no lifecycle event equivalent to check-in/reassign/checkout. The no-show implementation wave should close this audit gap while preserving any existing agent provenance semantics.