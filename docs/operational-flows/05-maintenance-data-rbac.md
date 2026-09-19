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

## Capabilities — binding

Maintenance permissions are separate from cleaning transitions:

- `maintenance.read`
- `maintenance.report`
- `maintenance.resolve`

Binding role mapping:

- `admin`: `maintenance.read`, `maintenance.report`, `maintenance.resolve`;
- `ops`: `maintenance.read`, `maintenance.report`, `maintenance.resolve`;
- `receptionist`: `maintenance.read`, `maintenance.report`; no resolve;
- `housekeeping`: `maintenance.read`, `maintenance.report`, `maintenance.resolve`;
- `saas_admin`: none of the tenant maintenance capabilities.

`maintenance.report` authorizes opening a case and escalating an existing `NON_BLOCKING` case to `BLOCKING`. Escalation is one-way in this wave because increasing impact is a safety/reporting action. Downgrade is not a generic edit: resolve when mitigated and reopen a non-blocking follow-up only if required.

`maintenance.resolve` authorizes case closure/resolution. A receptionist may report or escalate a risk but cannot resolve/close it.

`housekeeping.write` continues to govern cleaning transitions (`DIRTY -> CLEANING -> AVAILABLE`) and is not a substitute for maintenance capabilities. Existing target role intent remains: admin, ops and housekeeping can execute cleaning; receptionist cannot.

## Checkout override boundary

Maintenance capability changes do not broaden financial override authority. `bookings.checkout.override` remains admin-only, matching accepted source and target capability maps.

## UX consequence

Reception can report or escalate an incident from the active stay without gaining cleaning or technical resolution rights. Housekeeping/ops/admin can resolve maintenance according to the binding map. UI visibility is convenience only; backend capability checks remain authoritative.