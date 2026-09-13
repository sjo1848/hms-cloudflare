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

Room id, guest count and accepted formal checklist facts; include hotel-local operational date as context, not as a new eligibility cutoff.

### Reassignment

Old room, new room, effective hotel-local date, moved remaining-night range, resulting old-room state, blocking-maintenance case id when applicable, source-parity price input/result and invoice reconciliation outcome.

### Checkout

Room id, resulting room state, downstream work target (`HOUSEKEEPING` or `MAINTENANCE`), payment policy/reference and required confirmations. `settled` must correspond to authoritative full settlement.

### No-show

Assigned room, hotel-local operational date, original stay dates, terminal reason/evidence and inventory-release outcome. No financial penalty is implied.

### Extend stay

Old/new checkout, added-night range, current room price used by source-parity repricing, old/new authoritative booking total, extra-charge total and invoice reconciliation outcome.

### Cancellation

Assigned room, stay dates, terminal reason/evidence, operational date as audit context and inventory release. No new calendar cutoff is implied.

## Atomic truth rule

A success event exists iff the corresponding authoritative state mutation won. Failed validation, stale-state conflict or lost concurrency race creates no success event.

## Timestamp versus operational date

Audit `created_at` remains an absolute timestamp. Hotel-local operational date is additional domain context where date-sensitive semantics or traceability require it; one must not replace the other.

## Cancellation hardening

Current target human booking cancellation lacks a lifecycle event equivalent to check-in/reassign/checkout. The arrival-exception implementation wave should close this audit gap while preserving existing agent provenance semantics.