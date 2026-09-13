# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

Purpose: bind which accepted target/source HTTP contracts are preserved, which existing routes are extended, and which explicit commands must be added. BUILD must not invent parallel APIs when a canonical route is defined here.

## General API rules

- API remains under `/api/v1`.
- Tenant/hotel context comes from authenticated server context, never client-supplied hotel ids.
- Write commands enforce backend capability checks regardless of UI visibility.
- Lifecycle commands are explicit; generic booking PATCH must not become a backdoor for checked-in lifecycle changes.
- Stale/concurrent conflict returns a fail-closed conflict response with no partial mutation or success audit.
- Existing compatible response fields may be extended additively; breaking renames require a separate contract decision.

## Front desk read model

### `GET /api/v1/front-desk/board`

Status: `PRESERVE AND EXTEND`.

This is the canonical Reception operational read model inherited from the accepted source contract. Do not introduce a competing `/operations/front-desk` route.

Extend as needed with additive fields for:
- authoritative operational date / generated timestamp;
- queue lane and deterministic priority;
- readiness and blocker details;
- maintenance case id/impact when relevant;
- late-arrival context;
- current room context;
- optional Billing summary only where authoritative and cheap to produce.

It remains read-only and never performs lifecycle writes.

## Booking creation and pre-occupancy editing

### `POST /api/v1/bookings`

Status: `PRESERVE` for existing-guest reservation creation.

### Atomic inline guest + reservation command

Status: `ADD BOUNDED COMMAND`.

Canonical behavior requires one atomic business operation when Reception creates a new guest inline with a reservation. Exact path is fixed for this wave as:

`POST /api/v1/bookings/with-guest`

Payload contains guest data plus the same booking dates/room/notes required by normal booking creation. Authorization requires both `guests.write` and `bookings.write`. Success returns the created booking with guest identity; any guest/booking/availability conflict leaves neither unintended guest nor booking.

### `PATCH /api/v1/bookings/:id`

Status: `PRESERVE FOR PRE-OCCUPANCY EDIT + CANCELLATION ONLY`.

It may continue to edit `CONFIRMED` reservation data under existing availability rules and to perform the existing `CONFIRMED -> CANCELLED` terminal action with accepted terminal reason/evidence once that evidence is wired into target parity.

It must not implement checked-in reassignment, extension, checkout or no-show as arbitrary generic field/status edits.

## Explicit lifecycle commands

### `POST /api/v1/bookings/:id/check-in`

Status: `PRESERVE / HARDEN`.

Uses `lifecycle.write`. Preserve formal checklist and immediate readiness semantics. Additive response/evidence is allowed.

### `POST /api/v1/bookings/:id/reassign`

Status: `PRESERVE / HARDEN`.

Uses `lifecycle.write`. Extend implementation to remaining-night inventory semantics, old-room turnover, blocking-maintenance routing, source-parity destination repricing, invoice reconciliation and richer audit details.

### `POST /api/v1/bookings/:id/check-out`

Status: `PRESERVE / HARDEN`.

Uses `lifecycle.write`. `pending-approved` additionally requires `bookings.checkout.override`, which remains admin-only. Extend vacancy routing to `DIRTY` versus `MAINTENANCE` according to open `BLOCKING` case while preserving settlement truth and housekeeping handoff semantics.

### `POST /api/v1/bookings/:id/no-show`

Status: `ADD EXPLICIT COMMAND`.

Uses `lifecycle.write`.

Preconditions: booking `CONFIRMED`, `hotel_local_date >= check_in`, never occupied, accepted terminal reason/evidence. Mutation releases reservation inventory, leaves physical room unchanged and records one truthful terminal lifecycle event. Financial refund/penalty automation is not part of this command.

Generic booking PATCH must not become the primary no-show command in the new target workflow.

### `POST /api/v1/bookings/:id/extend-stay`

Status: `ADD EXPLICIT COMMAND`.

Uses `lifecycle.write`.

Payload requires `new_check_out`. Command claims all added nights atomically, keeps booking `CHECKED_IN` and room `OCCUPIED`, applies source-parity repricing, reconciles invoice and records extension event. It rejects partial extension and stale booking/room/Billing state.

## Housekeeping read/cleaning routes

### `GET /api/v1/housekeeping/board`

Status: `PRESERVE AND EXTEND`.

Include occupied rooms only when an open maintenance case exists. Add maintenance impact and context fields additively.

### `POST /api/v1/housekeeping/:id/start`

Status: `PRESERVE`.

Cleaning transition `DIRTY -> CLEANING`, governed by `housekeeping.write`.

### `POST /api/v1/housekeeping/:id/finish`

Status: `PRESERVE`.

Cleaning transition `CLEANING -> AVAILABLE`, governed by `housekeeping.write`, and must fail if a blocking condition makes AVAILABLE untruthful.

## Maintenance commands

### `POST /api/v1/housekeeping/:id/maintenance`

Status: `PRESERVE PATH / EXPAND CONTRACT`.

Authorization changes from generic `housekeeping.write` to `maintenance.report`.

Payload adds mandatory `impact: NON_BLOCKING | BLOCKING` alongside accepted `priority`, `reason`, `assigned_to`.

Opening behavior follows the canonical maintenance model, including occupied-room support and same-state events.

### `POST /api/v1/housekeeping/:id/maintenance/:case_id/escalate`

Status: `ADD EXPLICIT COMMAND`.

Requires `maintenance.report`. Only `OPEN NON_BLOCKING -> OPEN BLOCKING` is permitted in v1. It is idempotent/rejects stale or already-resolved case state. Physical room consequence depends on occupancy: occupied remains occupied and becomes blocked; vacant eligible states enter `MAINTENANCE`.

### `POST /api/v1/housekeeping/:id/maintenance/:case_id/resolve`

Status: `ADD EXPLICIT COMMAND`.

Requires `maintenance.resolve` and a resolution note/evidence according to existing validation standards.

It supports both:
- occupied/non-blocking or mitigated case resolution with no physical room-state change;
- blocking case resolution from `MAINTENANCE -> DIRTY`.

Event details must truthfully reflect whether physical state changed.

### `POST /api/v1/housekeeping/:id/dirty`

Status: `LEGACY COMPATIBILITY ONLY`.

The current route encodes the historical `MAINTENANCE -> DIRTY` resolve path. It must not be reused as the canonical general maintenance-resolution API because that name/contract cannot represent occupied same-state resolution.

During migration it may remain as a compatibility alias only for an open blocking case on a room currently `MAINTENANCE`, internally delegating to the same resolution domain command. New HMS UI must use `/maintenance/:case_id/resolve`. Once compatibility consumers are proven absent, removal requires a separate API deprecation decision.

## Authorization matrix for new/affected commands

- lifecycle commands (`check-in`, `reassign`, `check-out`, `no-show`, `extend-stay`): `lifecycle.write` -> admin, ops, receptionist.
- booking cancellation/pre-occupancy booking writes: existing booking write/update capability set -> admin, ops, receptionist.
- atomic guest+booking create: both `guests.write` + `bookings.write` -> admin, ops, receptionist.
- maintenance read/report/resolve: exactly as `05-maintenance-data-rbac.md`.
- cleaning start/finish: existing `housekeeping.write` -> admin, ops, housekeeping.
- `pending-approved` checkout: `lifecycle.write` plus `bookings.checkout.override`; override remains admin-only.
- `saas_admin` receives none of the tenant operational commands above.

## Error/response contract expectations

Use existing API error semantics and distinguish at minimum:
- `400` malformed/invalid payload or unsupported transition input;
- `403` capability failure;
- `404` tenant-scoped entity not found;
- `409` stale state, invalid current lifecycle state, availability/hold/maintenance conflict or lost concurrency race.

A conflict response may add machine-readable reason codes later, but BUILD must not return success with partial state.

## OpenAPI/client obligation

Every new/additive route or field is reflected in the API contract/client types before browser acceptance is claimed. If the repo uses generated/client drift checks, those gates remain binding.

## Completion rule

A lifecycle/maintenance increment is not complete until implementation, tests, OpenAPI/client contract and browser flow all reference this canonical route map consistently. Parallel shadow endpoints or generic PATCH shortcuts that bypass these commands are scope violations.