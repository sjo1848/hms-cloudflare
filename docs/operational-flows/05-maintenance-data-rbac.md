# 05 — Maintenance data and authorization

Status: `BINDING DEFINITION`

## Case cardinality

Preserve one open maintenance case per room in this wave. Multiple independent simultaneous cases are deferred. An existing `NON_BLOCKING` case may be explicitly escalated to `BLOCKING`.

## Required case fields

Existing fields remain. Add `impact`:

- `NON_BLOCKING`
- `BLOCKING`

Existing migrated/open cases that already place an unoccupied room in `MAINTENANCE` must backfill as `BLOCKING` so migration does not weaken current protection.

## Resolution and event semantics

- resolve case while room `OCCUPIED`: case -> `RESOLVED`, room remains `OCCUPIED`, truthful same-state event;
- resolve NON_BLOCKING case while AVAILABLE/DIRTY/CLEANING: room state unchanged;
- resolve BLOCKING case from `MAINTENANCE`: room -> `DIRTY`;
- escalate NON_BLOCKING -> BLOCKING: if occupied, room remains OCCUPIED and future sale is blocked; otherwise room enters MAINTENANCE.

Current schema/trigger assumptions that every maintenance open implies room `MAINTENANCE` and every resolution returns `DIRTY` must be expanded. No event may claim a physical transition that did not occur.

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

`housekeeping.write` continues to govern cleaning transitions rather than being the only route to report a guest-room defect.

## UX consequence

Reception can report an incident from the active stay without gaining cleaning/technical resolution rights. Housekeeping/ops can execute the maintenance case workflow.