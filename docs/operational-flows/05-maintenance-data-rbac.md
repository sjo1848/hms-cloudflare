# 05 — Maintenance data and authorization

Status: `BINDING DEFINITION`

## One open case per room

Preserve the current one-open-maintenance-case-per-room rule for this wave. Multiple simultaneous open cases are deferred.

## Required case fields

Existing case fields remain. Add operational `impact` with values:

- `NON_BLOCKING`
- `RELOCATION_REQUIRED`

Existing cases can be backfilled safely because they were created only for unoccupied maintenance-state rooms; impact does not change their current blocking behavior.

## Resolution result

Maintenance resolution depends on current occupancy:

- resolved while room still `OCCUPIED` -> case `RESOLVED`, room stays `OCCUPIED`, recorded return state is `OCCUPIED`;
- resolved after room entered `MAINTENANCE` -> room becomes `DIRTY`, recorded return state is `DIRTY`.

Therefore the current schema/trigger assumption that every resolved case returns `DIRTY` must be expanded.

## Event semantics

Opening or resolving a maintenance case may be a case-state change without a physical room-state change. Audit/event rules must allow:

- open while `OCCUPIED`: `OCCUPIED -> OCCUPIED` with open case;
- resolve while `OCCUPIED`: `OCCUPIED -> OCCUPIED` with resolved case;
- open while unoccupied: current room state -> `MAINTENANCE`;
- resolve from `MAINTENANCE`: `MAINTENANCE -> DIRTY`.

No event may claim a room transition that did not occur.

## Capabilities

Separate maintenance permissions from cleaning transitions:

- `maintenance.read`
- `maintenance.report`
- `maintenance.resolve`

Recommended role mapping:

- `admin`: read/report/resolve;
- `ops`: read/report/resolve;
- `receptionist`: read/report;
- `housekeeping`: read/report/resolve.

`housekeeping.write` continues to authorize cleaning transitions, not to be the only way to report a guest-room defect.

## UX consequence

Reception can report an incident from the active stay without gaining permission to start/finish cleaning or resolve technical work. Housekeeping/ops can execute the maintenance workflow.