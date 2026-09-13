# 03C — Revalidation and operational read model

Status: `BINDING DEFINITION / SOURCE-CONTRACT PRESERVING`

## Revalidation strategy

For a ~20-room hotel, start simple. Do not introduce WebSockets by default.

Operational screens revalidate authoritative state:

- immediately after their own successful mutation;
- when browser/tab regains focus;
- on a modest periodic interval while the operational screen is visible (target about 30 seconds; implementation may tune within a reasonable low-cost range);
- when navigating into a context via query/deep link.

Polling pauses or reduces when page is hidden. Manual refresh remains available.

## Stale-action rule

UI previews are advisory. Every mutation is revalidated by backend guards. If state changed between preview and confirmation, return conflict and refresh the case rather than forcing or replaying stale intent.

## Front-desk read-model direction

Accepted source already defines the `/api/v1/front-desk/board` contract and an `action_queue` so frontend does not reconstruct turn priority locally. The next wave must preserve/restore and extend that contract rather than invent a parallel `/operations/front-desk` endpoint.

Target direction:

`GET /api/v1/front-desk/board?date=<hotel-local-date>`

It remains a read model only. It may join/derive enough context to drive Reception priority/readiness without moving write authority out of explicit domain commands.

Minimum target context:

- generated timestamp and authoritative operational date;
- booking identity/status/dates;
- guest identity/name;
- room identity/number/physical state;
- accepted source queue lane/title/detail/primary action semantics;
- deterministic priority/order;
- immediate room readiness;
- maintenance case/impact when relevant;
- contextual arrival/overdue/late-arrival classification;
- optional Billing summary only when produced without weakening money invariants.

## Housekeeping read model

Existing `/api/v1/housekeeping/board` remains authoritative for housekeeping-oriented work. Do not duplicate it unless a later contract proves a specific gap.

## Boundary

Read models derive and aggregate; they never perform lifecycle writes. Check-in, checkout, reassignment, extension, cancellation/no-show, cleaning and maintenance transitions remain explicit domain commands.

## Acceptance

Browser and API evidence must prove Reception priority from known fixtures independently of storage order, preserve source queue semantics, and revalidate after cross-module mutations.