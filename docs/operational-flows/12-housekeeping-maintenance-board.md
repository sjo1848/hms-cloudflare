# 12 — Housekeeping / Maintenance board behavior

Status: `BINDING DEFINITION`

Interaction/focus/filter behavior additionally follows `21-app-interaction-contract.md` and `22-interaction-flow-matrix.md`.

## Board inclusion

Include normal turnover work (`DIRTY`, `CLEANING`, `AVAILABLE`, `MAINTENANCE`) plus `OCCUPIED` rooms with an open maintenance case. Occupied rooms without maintenance do not become housekeeping tasks.

## Filters

Minimum board controls:
- shift/turnover view;
- dirty;
- cleaning;
- maintenance attention;
- room search;
- board date;
- maintenance impact when that context is present.

Filter/search/date state survives ordinary refresh and task mutations. Mobile task close returns to the prior filtered queue/scroll position.

## Focused-task behavior

Desktop keeps queue + selected task visible. Mobile opens a focused full-screen task surface and returns to the same queue position.

State-changing action shows local pending feedback; the entire board is not replaced by a loading screen.

If a successful transition removes the room from the active filter, next task follows canonical operational priority.

## Actions by state

For `OCCUPIED + open maintenance`:
- no cleaning start/finish;
- maintenance detail/impact visible;
- authorized resolve/escalate uses focused maintenance sub-surface;
- BLOCKING provides direct contextual route to Reception;
- NON_BLOCKING remains advisory.

For `MAINTENANCE + open BLOCKING`:
- authorized resolution available;
- resolution -> DIRTY;
- normal cleaning follows.

## Checkout/reassignment routing

No open BLOCKING case -> vacated room DIRTY / Housekeeping.
Open BLOCKING case -> vacated room MAINTENANCE / Maintenance.

UI explains the authoritative resulting state; it does not guess.

## No duplicate handoff

Checkout/reassignment does not require manual creation of a housekeeping task. Room + maintenance state surfaces downstream work.

## Future arrival blocker

Blocking maintenance may link to the future confirmed arrival; Reception owns reassignment. Housekeeping does not mutate future booking assignment.

## Conflict

If another actor changes room/case while the task is open, keep the focused surface, refresh authoritative context, explain the conflict and disable invalid actions. Do not auto-replay.
