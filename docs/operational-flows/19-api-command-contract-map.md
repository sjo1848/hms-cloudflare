# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

Canonical routes, payload/evidence rules, authorization, pricing/Billing side effects, compatibility and OpenAPI obligations. No parallel API or direct-state bypass.

## Global rules
API remains under `/api/v1`; hotel identity comes only from authenticated context. Backend capability/evidence checks are authoritative. Stale/conflicting writes fail closed with no partial mutation/success event. Additive compatibility is default.

## Pricing / Billing boundary — D9/D11
Pricing-affecting: reservation room/date change, reassignment, extension, extra charge, or future explicitly priced command. Other booking metadata/state/evidence writes preserve stored total.

Every priced command with an existing invoice uses the same D11 reconciliation semantics. If D11 marks the invoice state ineligible, return `409` before any domain/financial success mutation.

Invoice/Billing response views used by these workflows must expose or allow deterministic derivation of authoritative `amount_cents`, `paid_amount_cents`, `remaining_cents`, `credit_cents`, `status` and `paid_at`. No new invoice status is introduced.

## Front desk board
`GET /api/v1/front-desk/board` — preserve/extend; `bookings.read`; admin/ops/receptionist allowed, housekeeping/saas_admin denied. Canonical read-only Reception model.

## Booking creation / confirmed updates
`POST /api/v1/bookings` — `bookings.write`; existing-guest create.

`POST /api/v1/bookings/with-guest` — `guests.write` + `bookings.write`; atomic guest+booking.

`PATCH /api/v1/bookings/:id` — `bookings.write`; CONFIRMED pre-occupancy data, cancellation and late-arrival only. Room/date change is priced and must pass D11 before commit; guest/name/notes-only, cancellation-only and late-arrival-only preserve total.

Cancellation: `status=CANCELLED`, terminal reason min 6, no arrival cutoff; release inventory, preserve room/total and existing financial evidence.

Late arrival D10: `front_desk.late_arrival_eta` RFC3339 with explicit Z/offset plus note min 6/max 250. Future instant, converted to hotel timezone and local stay-date validated. Context/audit only; no room/inventory/total/invoice mutation.

Generic PATCH cannot implement checked-in reassignment, extension, checkout or no-show.

## Lifecycle commands
`POST /bookings/:id/check-in` — `lifecycle.write`; accepted checklist + positive guest count; CHECKED_IN/OCCUPIED; total unchanged.

`POST /bookings/:id/reassign` — `lifecycle.write`; destination + reason min 6; remaining-night semantics; room turnover/history; destination repricing; D11 reconciliation; ineligible invoice -> 409 before move.

`POST /bookings/:id/check-out` — `lifecycle.write`; pending-approved additionally admin-only override. Total unchanged. Settlement uses existing authoritative Billing; D11-ineligible invoice cannot authorize checkout.

`POST /bookings/:id/no-show` — `lifecycle.write`; reason min 6; eligible CONFIRMED; release inventory; room/total unchanged.

`POST /bookings/:id/extend-stay` — `lifecycle.write`; later checkout; added nights atomic; current-room repricing; D11 reconciliation; ineligible invoice -> 409 before extension.

## Billing mutations relevant to this wave
Existing extra-charge route remains canonical. Extra charge is a priced mutation and must use D11 reconciliation in the same atomic operation; ineligible invoice state returns 409 before charge success is persisted.

Existing payment routes must reject new collection when authoritative `remaining_cents = 0`. They never consume or rewrite D11 derived credit.

Existing invoice/payment reads remain canonical and are extended additively as needed for the D11 view contract.

## Housekeeping
`GET /housekeeping/board` -> housekeeping.read. `POST /housekeeping/:id/start` -> housekeeping.write, DIRTY->CLEANING. `POST /housekeeping/:id/finish` -> housekeeping.write, CLEANING->AVAILABLE only if truthful.

## Maintenance
`GET /housekeeping/:id/maintenance` -> maintenance.read; current case or null.
`POST /housekeeping/:id/maintenance` -> maintenance.report; impact, priority, reason, assignee.
`POST /housekeeping/:id/maintenance/:case_id/escalate` -> maintenance.report; note min 6.
`POST /housekeeping/:id/maintenance/:case_id/resolve` -> maintenance.resolve; note min 6.
`POST /housekeeping/:id/dirty` -> legacy compatibility only for historical blocking resolution.

## Authorization
Front-desk bookings.read: admin/ops/receptionist. Confirmed booking bookings.write: admin/ops/receptionist. lifecycle.write: admin/ops/receptionist. Inline guest+booking requires both write capabilities. Maintenance follows `05`. Cleaning admin/ops/housekeeping. Pending balance override admin-only. saas_admin has no tenant operations above.

## Errors / contracts
400 invalid payload/evidence; 403 capability; 404 tenant-scoped missing entity; 409 invalid/stale/conflicting state including D11 fail-closed invoice state. No partial success.

Every additive route/payload/response/enum/derived Billing field, date-time format and pricing effect must be represented in automated tests and published OpenAPI/client contracts before browser acceptance.

## Completion rule
Runtime, tests, OpenAPI/client and browser flow use this map. Shadow endpoints, orphan capabilities, hidden repricing, divergent reconciliation helpers, ambiguous timestamp parsing or direct-state shortcuts are scope violations.