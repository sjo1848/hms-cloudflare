# 15 — Lifecycle event and audit contract

Status: `BINDING DEFINITION`

## Required event families

The workflow wave must persist truthful evidence for at least:
- `CHECK_IN`;
- `CANCEL`;
- `NO_SHOW`;
- `LATE_ARRIVAL`;
- `REASSIGN`;
- `EXTEND_STAY`;
- `CHECK_OUT`;
- `MAINTENANCE_OPEN`;
- `MAINTENANCE_ESCALATE`;
- `MAINTENANCE_RESOLVE`;
- cleaning start/finish using the existing housekeeping event contract.

Exact enum/string names may vary only if API/tests/consumers remain explicit and semantically equivalent.

## Common event truth

Every success event includes hotel/tenant, actor identity, request identity where available, absolute timestamp and command-specific material facts. Hotel-local operational date is included where date semantics/history matter but never replaces the absolute timestamp.

A success event exists iff the authoritative mutation won. Invalid evidence, stale state, lost concurrency race or rolled-back transaction creates no success event.

## Command details

### Check-in
Room id, guest count, accepted checklist facts and operational-date context. Under D9, booking total is unchanged; event must not report a price delta.

### Cancellation
Assigned room, stay dates, terminal reason, inventory-release result and operational-date context. Booking total remains unchanged; no refund/penalty is implied.

### No-show
Assigned room, hotel-local date, stay dates, terminal reason and inventory-release result. Booking total remains unchanged; no automatic financial disposition.

### Late arrival
ETA, note, actor/recorded timestamp and booking id. Booking remains CONFIRMED. No room/inventory/booking-total/invoice mutation; event must not imply one.

### Reassignment
Old/new room, effective hotel-local date, moved remaining-night interval, resulting old-room state, blocking case id if applicable, operational reason, pricing inputs/result and invoice reconciliation outcome.

### Extension
Old/new checkout, added-night interval, pricing input, old/new total, extra charges and invoice reconciliation outcome.

### Checkout
Room id, resulting room state, downstream work target, payment policy/reference and confirmations. Settlement uses the pre-existing authoritative booking total; checkout itself has no accommodation repricing delta under D9.

### Maintenance open
Room, case id, prior physical state, impact, priority, reason, assignee and resulting physical state (including truthful same-state events).

### Maintenance escalation
Case id, old/new impact, escalation note, physical state before/after and actor.

### Maintenance resolve
Case id, resolution note, physical state before/after and actor; same-state resolution must be represented truthfully.

## Pricing-event rule

Only pricing-affecting commands (room/date changes, reassignment, extension, extra charges or future explicitly priced operations) may record a booking-total delta. State/evidence-only lifecycle events must preserve total and must not fabricate a financial change.

## Existing target gaps to close

Current Cloudflare target does not yet provide all terminal/arrival/maintenance event semantics above. Each implementation increment must close its corresponding event gap atomically with the business mutation.