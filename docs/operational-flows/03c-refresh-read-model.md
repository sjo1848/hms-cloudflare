# 03C — Revalidation and operational read model

Status: `BINDING DEFINITION / SOURCE-CONTRACT PRESERVING`

## Revalidation

For a ~20-room hotel, no WebSockets by default. Revalidate authoritative state after successful mutation, on focus regain, on contextual entry, and at a modest visible-screen interval (~30 s starting target). Reduce/pause while hidden. Manual refresh remains available.

UI preview is advisory; backend guards every write. Stale state returns conflict + authoritative refresh, never forced replay.

## Front-desk board

Preserve/restore accepted `GET /api/v1/front-desk/board`; do not invent a parallel board.

Authorization is binding: `bookings.read` -> admin/ops/receptionist; housekeeping/saas_admin denied tenant board access.

Read model only. It owns enough joined/derived context for Reception:
- generated timestamp + authoritative hotel-local operational date;
- booking/guest/current-room identity and states;
- deterministic lane/priority/action semantics;
- immediate readiness/blockers;
- maintenance case/impact where relevant;
- arrival/overdue/overrun and late-arrival context;
- optional authoritative Billing summary only if money invariants remain intact.

Late-arrival context is rendered from validated server data; the board does not reinterpret browser-local ETA eligibility.

## Housekeeping board

`GET /api/v1/housekeeping/board` remains the cleaning-oriented read model under `housekeeping.read`. Reception does not need that capability merely to inspect room maintenance; least-privilege room maintenance detail uses the canonical maintenance.read route.

## Boundary / acceptance

Read models derive/aggregate only. Lifecycle, cancellation/no-show, arrival metadata, cleaning and maintenance writes remain on canonical commands from `19`.

API/browser evidence proves deterministic priority independent of storage order, source queue semantics, role authorization, tenant isolation and refresh after cross-module mutations.