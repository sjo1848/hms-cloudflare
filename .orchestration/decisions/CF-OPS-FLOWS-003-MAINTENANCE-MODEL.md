# DECISION — CF-OPS-FLOWS-003-MAINTENANCE-MODEL

Status: `BINDING`; this decision supersedes conflicting maintenance-impact wording in CF-OPS-FLOWS-001/002 and earlier flow notes.

## Canonical impact enum

- `NON_BLOCKING`
- `BLOCKING`

Do not persist `RELOCATION_REQUIRED` as the domain enum. For an occupied room, `BLOCKING` implies relocation is required; for an unoccupied room it means the room is unavailable for occupancy/sale.

## Physical-state consequences

- NON_BLOCKING open/resolve does not by itself change room physical state.
- BLOCKING opened on `AVAILABLE|DIRTY|CLEANING` moves room to `MAINTENANCE`.
- BLOCKING opened on `OCCUPIED` leaves room `OCCUPIED` until explicit checkout/reassignment vacates it, then room becomes `MAINTENANCE`.
- Vacancy with no BLOCKING case, including an unresolved NON_BLOCKING case, becomes `DIRTY`.
- BLOCKING resolved from `MAINTENANCE` returns room to `DIRTY`.
- Case resolution while room remains `OCCUPIED` may close the case with no room-state change.

## Availability

- BLOCKING case excludes room from new advance sale and immediate readiness.
- NON_BLOCKING case is advisory and does not independently block sale/readiness.

## V1 case cardinality

One open maintenance case per room remains binding. An existing NON_BLOCKING case can be explicitly escalated to BLOCKING. Multiple concurrent independent cases remain deferred.

## Authorization

Maintenance reporting/resolution uses dedicated maintenance capabilities; cleaning permissions are not the sole authorization path for reporting an occupied-room issue.