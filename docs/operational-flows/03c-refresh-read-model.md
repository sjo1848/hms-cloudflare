# 03C — Revalidation and operational read model

Status: `BINDING DEFINITION / SOURCE-CONTRACT PRESERVING`

## Revalidation

For a ~20-room hotel, no WebSockets by default. Revalidate authoritative state after successful mutation, on focus regain, contextual entry and a modest visible interval (~30 s starting target). Reduce/pause while hidden. Manual refresh remains available.

UI preview is advisory; backend guards every write. Stale state returns conflict + authoritative refresh, never forced replay.

## App-like refresh behavior

`21/22` govern presentation of revalidation:
- first load may use skeletons;
- later refresh keeps known authoritative data visible while showing a subtle refreshing indicator;
- filters/search/selection/list scroll do not reset because a read model refreshes;
- if selected entity still exists, refresh updates it in place;
- if it leaves the active filter after a successful mutation, choose next by canonical priority;
- if it becomes invalid because another actor changed it, show conflict/refreshed state and preserve safe operator input where possible;
- never flash the whole workspace empty between polls.

## Front-desk board

Preserve/restore accepted `GET /api/v1/front-desk/board`; do not invent a parallel board.

Authorization: `bookings.read` -> admin/ops/receptionist; housekeeping/saas_admin denied.

Read model owns enough joined/derived context for Reception:
- generated timestamp + hotel-local operational date;
- booking/guest/current-room identity/states;
- deterministic lane/priority/action semantics;
- immediate readiness/blockers;
- maintenance case/impact;
- arrival/overdue/overrun and late-arrival context;
- authoritative Billing summary only if money invariants remain intact.

## Housekeeping board

`GET /api/v1/housekeeping/board` remains cleaning-oriented under `housekeeping.read`. Filtering/focused-task state is client navigation state from `21/22`; domain queue ordering remains server/accepted semantic truth.

## Boundary / acceptance

Read models derive/aggregate only. Writes remain on canonical commands from `19`.

API/browser evidence proves deterministic priority independent of storage order, role authorization, tenant isolation, cross-module refresh, no filter/context loss and truthful stale-conflict recovery.
