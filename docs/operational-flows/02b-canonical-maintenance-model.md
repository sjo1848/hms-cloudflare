# 02B — Canonical maintenance model

Status: `BINDING`; this document supersedes conflicting maintenance-impact/vacancy wording in earlier 02B files.

## Impact values

Use:

- `NON_BLOCKING` — room remains usable/sellable subject to normal physical state and inventory rules.
- `BLOCKING` — room is not fit for new occupancy/sale until the case is resolved. If currently occupied, relocation is required.

Impact is separate from urgency priority.

## Opening a case

### NON_BLOCKING

Opening the case does not change room physical state.

Examples:

- `OCCUPIED -> OCCUPIED` + open case;
- `AVAILABLE -> AVAILABLE` + open case;
- `DIRTY/CLEANING` remain in their current turnover state.

Cleaning may complete while a non-blocking case remains open; the room can become `AVAILABLE` with an advisory incident.

### BLOCKING

- if room is `OCCUPIED`: keep `OCCUPIED`, mark stay as requiring relocation and block future sale;
- if room is `AVAILABLE`, `DIRTY` or `CLEANING`: move room to `MAINTENANCE` immediately and block sale.

## Vacancy from OCCUPIED

- no open blocking case (including no case or only NON_BLOCKING): `OCCUPIED -> DIRTY`;
- open BLOCKING case: `OCCUPIED -> MAINTENANCE`.

Thus a non-blocking issue never skips cleaning and never blocks turnover by itself.

## Resolution

- NON_BLOCKING case resolved while occupied/available/dirty/cleaning: case closes; physical state remains unchanged.
- BLOCKING case resolved while still occupied after mitigation: case closes; room remains `OCCUPIED`.
- BLOCKING case resolved from `MAINTENANCE`: room becomes `DIRTY`, then normal cleaning is required.

## One open case per room in v1

Preserve one open case per room. If an existing NON_BLOCKING case becomes unsafe, use an explicit **escalate impact** operation to `BLOCKING`; do not create a second case. Downgrading a BLOCKING case is not a generic toggle: resolve it when mitigated and reopen a new non-blocking case only if follow-up tracking is required.

Multiple independent simultaneous cases are deferred.

## Readiness and destination rules

- an `AVAILABLE` room with NON_BLOCKING case is ready but carries an advisory warning;
- BLOCKING case is never a valid check-in/reassignment destination;
- NON_BLOCKING may be a destination only with the incident visibly disclosed to the operator.

## Future bookings

Opening BLOCKING maintenance never auto-cancels or auto-reassigns existing future bookings. They become attention cases until maintenance clears or Reception explicitly reassigns them.