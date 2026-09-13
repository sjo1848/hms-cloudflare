# 03C — Revalidation and operational read model

Status: `BINDING DEFINITION`

## Revalidation strategy

For a ~20-room hotel, start simple. Do not introduce WebSockets by default.

Operational screens should revalidate authoritative state:

- immediately after their own successful mutation;
- when the browser/tab regains focus;
- on a modest periodic interval while the operational screen is visible (target: about 30 seconds, implementation may tune within a reasonable low-cost range);
- when navigating into a context via query/deep link.

Polling must pause or reduce when the page is hidden. Manual refresh remains available.

## Stale-action rule

UI previews are advisory. Every mutation is revalidated by backend guards. If state changed between preview and confirmation, return conflict and refresh the case rather than forcing or replaying stale intent.

## Read-model direction

Current Reception, Rooms and Guests independently derive operational meaning from `/bookings`, `/rooms` and `/guests`. This is acceptable at current scale but duplicates rules.

Before adding more derived rules, create one server-owned operational read model for front-desk work. Preferred direction:

`GET /operations/front-desk?date=<hotel-local-date>`

It should return enough joined/derived context to drive Reception priority and room readiness without moving write authority into the read model.

Minimum candidate fields:

- generated timestamp and operational date;
- booking identity/status/dates;
- guest identity/name;
- room identity/number/physical state;
- derived lane/reason/priority;
- immediate room readiness;
- maintenance blocker/impact when relevant;
- optional billing summary only if it can be produced without weakening money invariants.

## Housekeeping read model

The existing `/housekeeping/board` remains the authoritative housekeeping-oriented read model. Do not duplicate it unless a later contract proves a specific gap.

## Boundary

Read models may derive and aggregate. They never perform lifecycle writes. Check-in, checkout, reassignment, extension, no-show, cleaning and maintenance transitions remain explicit domain commands.