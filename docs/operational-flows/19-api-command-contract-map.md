# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

Canonical routes, authorization, evidence, pricing/Billing side effects and compatibility. No parallel API or direct-state bypass.

## Global rules
API remains under `/api/v1`; hotel identity comes only from authenticated context. Backend capability/evidence checks are authoritative. Stale/conflicting writes fail closed with no partial mutation/success event.

## Application bootstrap / navigation capabilities

`GET /api/v1/auth/me` remains the application bootstrap contract.

Target additive response must expose the effective capability set used for UI presentation/navigation, derived server-side from the same canonical capability authority that protects routes. The frontend must not maintain an independent role -> capability matrix for authorization-sensitive visibility.

Minimum bootstrap data for app navigation:
- authenticated identity;
- active hotel context when present;
- role/network context as already supported;
- `capabilities: string[]` — effective tenant capabilities for the active membership;
- `network_capabilities: string[]` — effective network capabilities when relevant, otherwise empty.

Both arrays are server-derived from the canonical capability authority and deterministically ordered for stable clients/tests.

Canonical module visibility:
- Reception `/bookings` -> `bookings.read`;
- Rooms `/rooms` -> `rooms.read`;
- Guests `/guests` -> `guests.read`;
- Housekeeping `/housekeeping` -> `housekeeping.read`;
- Reports `/reports` -> `reports.revenue.read` under the current module contract;
- Users `/users` -> `users.read`;
- Network `/network` -> `saas.hotels.read` from effective network capabilities.

Canonical landing from `/` after bootstrap:
1. `/bookings` when `bookings.read` exists;
2. otherwise `/housekeeping` when `housekeeping.read` exists;
3. otherwise `/network` when `saas.hotels.read` exists in network capabilities;
4. otherwise `/rooms` when `rooms.read` exists;
5. otherwise `/guests` when `guests.read` exists;
6. otherwise `/reports` when `reports.revenue.read` exists;
7. otherwise `/users` when `users.read` exists;
8. otherwise render the in-shell Forbidden/no-authorized-module state.

This landing rule preserves the current operational emphasis while avoiding a false Reception mount for housekeeping/network-only users.

These capability lists are UX hints only: every API request remains backend-authorized. A hidden control/client route guard is never the security boundary. A direct URL to a module lacking its required effective capability renders the in-app forbidden state and performs no ordinary protected module fetch before the guard resolves.

If a previously authorized module later receives backend `403` because membership/capabilities changed, the client refreshes `/auth/me` once, updates navigation/landing truth and presents Forbidden/redirect as appropriate. It must not retry the denied business mutation automatically.

## Pricing / Billing boundary — D9/D11
Pricing-affecting: reservation room/date change, reassignment, extension, extra charge, or future explicitly priced command. Other booking metadata/state/evidence writes preserve stored total.

Every priced command with an existing invoice uses one shared D11 reconciliation contract. After every successful payment or reconciliation, `invoice.paid_amount_cents` must equal the sum of that invoice's immutable `payment_entries.amount_cents`. Repricing never inserts/deletes/rewrites payment entries, never fabricates payment method/reference, and records price reconciliation distinctly from payment receipt. If ledger correlation fails or D11 marks invoice state ineligible, return `409` before domain/financial success mutation.

Billing views used by these workflows expose or deterministically derive `amount_cents`, `paid_amount_cents`, `remaining_cents`, `credit_cents`, `status` and `paid_at`. No new invoice status.

## Front desk board
`GET /api/v1/front-desk/board` — `bookings.read`; admin/ops/receptionist allowed, housekeeping/saas_admin denied. Read-only Reception model.

## Booking creation / confirmed updates
`POST /api/v1/bookings` — `bookings.write`.

`POST /api/v1/bookings/with-guest` — `guests.write` + `bookings.write`; atomic guest+booking.

`PATCH /api/v1/bookings/:id` — `bookings.write`; CONFIRMED pre-occupancy data, cancellation and late-arrival only. Room/date change is priced and must pass D11; guest/name/notes-only, cancellation-only and late-arrival-only preserve total.

Cancellation: `status=CANCELLED`, terminal reason min 6, release inventory, preserve room/total/payment evidence.

Late arrival D10: explicit-offset RFC3339 ETA plus note min 6/max 250; future instant converted to hotel timezone and stay-date validated; context/audit only.

Generic PATCH cannot implement checked-in reassignment, extension, checkout or no-show.

## Lifecycle commands
`POST /bookings/:id/check-in` — `lifecycle.write`; checklist + positive guest count; CHECKED_IN/OCCUPIED; total unchanged.

`POST /bookings/:id/reassign` — `lifecycle.write`; destination + reason min 6; remaining-night movement/history; destination repricing + D11; any invoice/ledger conflict -> 409 before move.

`POST /bookings/:id/check-out` — `lifecycle.write`; pending-approved additionally admin-only override. Total unchanged. Settlement uses existing authoritative Billing; invalid/VOIDED/ledger-mismatched invoice cannot authorize settlement.

`POST /bookings/:id/no-show` — `lifecycle.write`; reason min 6; eligible CONFIRMED; release inventory; room/total unchanged.

`POST /bookings/:id/extend-stay` — `lifecycle.write`; later checkout; added nights atomic; current-room repricing + D11; invoice/ledger conflict -> 409 before extension.

## Billing mutations
Extra charge remains canonical and is a priced mutation using D11 atomically; no successful charge may precede an ineligible invoice/ledger check.

Payment routes reject collection when `remaining_cents = 0`; each successful payment must leave `paid_amount_cents == SUM(payment_entries.amount_cents)`. Derived credit is not consumed automatically.

Invoice/payment reads remain canonical and are extended additively for D11 fields.

## Housekeeping / maintenance
`GET /housekeeping/board` -> housekeeping.read. `POST /housekeeping/:id/start` -> housekeeping.write. `POST /housekeeping/:id/finish` -> housekeeping.write.

`GET /housekeeping/:id/maintenance` -> maintenance.read.
`POST /housekeeping/:id/maintenance` -> maintenance.report.
`POST /housekeeping/:id/maintenance/:case_id/escalate` -> maintenance.report.
`POST /housekeeping/:id/maintenance/:case_id/resolve` -> maintenance.resolve.
`POST /housekeeping/:id/dirty` -> legacy compatibility only.

## Authorization
Front-desk bookings.read: admin/ops/receptionist. Confirmed booking bookings.write: admin/ops/receptionist. lifecycle.write: admin/ops/receptionist. Inline guest+booking requires both writes. Maintenance follows `05`. Cleaning admin/ops/housekeeping. Pending balance override admin-only. saas_admin has no tenant operations above.

## Errors / contracts
400 invalid payload/evidence; 403 capability; 404 tenant-scoped missing entity; 409 invalid/stale/conflicting state including D11 ledger/invoice failure. No partial success.

Every additive route/payload/response/derived Billing field/date-time/pricing effect must be represented in automated tests and published OpenAPI/client contracts before browser acceptance.

Runtime, tests, OpenAPI/client and browser flow must use this map. Shadow endpoints, hidden repricing, divergent reconciliation helpers, ledger drift, ambiguous timestamps or direct-state shortcuts are scope violations.