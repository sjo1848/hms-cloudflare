# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

Purpose: bind which accepted target/source HTTP contracts are preserved, which existing routes are extended, and which explicit commands must be added. BUILD must not invent parallel APIs when a canonical route is defined here.

## General API rules

- API remains under `/api/v1`.
- Tenant/hotel context comes from authenticated server context, never client-supplied hotel ids.
- Write commands enforce backend capability checks regardless of UI visibility.
- Lifecycle commands are explicit; generic booking PATCH must not become a backdoor for checked-in lifecycle changes.
- Material operator evidence is validated server-side; UI-only reason fields are insufficient.
- Stale/concurrent conflict returns fail-closed conflict with no partial mutation or success audit.
- Existing compatible response fields may be extended additively; breaking renames require a separate contract decision.
- Unless stated otherwise, evidence text uses accepted minimum validation of 6 trimmed characters and current maximum validation limits.

## Front desk read model

### `GET /api/v1/front-desk/board`

Status: `PRESERVE AND EXTEND`.

Canonical Reception operational read model. Do not introduce a competing `/operations/front-desk` route.

Extend additively with operational date/generated timestamp, queue lane/priority, readiness/blockers, maintenance case id/impact, late-arrival context, current room context and optional authoritative Billing summary.

It remains read-only.

## Booking creation and pre-occupancy editing

### `POST /api/v1/bookings`

Status: `PRESERVE` for existing-guest reservation creation.

### `POST /api/v1/bookings/with-guest`

Status: `ADD BOUNDED ATOMIC COMMAND`.

Payload reuses the current guest-create fields plus normal booking `room_id`, `check_in`, `check_out`, optional notes. Authorization requires both `guests.write` and `bookings.write`. Success returns the created booking with guest identity; failure leaves neither unintended guest nor booking.

### `PATCH /api/v1/bookings/:id`

Status: `PRESERVE FOR PRE-OCCUPANCY EDIT + CANCELLATION ONLY`.

For cancellation, canonical payload requires:

```text
status = CANCELLED
terminal_reason = non-empty trimmed text, min 6 chars
```

Cancellation is allowed only while the booking is still `CONFIRMED`; this wave adds no arrival-date cutoff. Mutation releases reservation inventory, preserves physical room state and records terminal actor/time/reason.

Generic PATCH must not implement checked-in reassignment, extension, checkout or no-show.

## Explicit lifecycle commands

### `POST /api/v1/bookings/:id/check-in`

Status: `PRESERVE / HARDEN`.
Authorization: `lifecycle.write`.

Canonical payload preserves current target confirmations:
- `document_verified = true`;
- `contact_confirmed = true`;
- `stay_confirmed = true`;
- positive `check_in_guests_count`;
- optional accepted reference/evidence fields may be carried additively.

No new calendar-day cutoff is introduced.

### `POST /api/v1/bookings/:id/reassign`

Status: `PRESERVE / HARDEN`.
Authorization: `lifecycle.write`.

Canonical payload:

```text
room_id = destination id
reason = trimmed operational reason, min 6 chars
```

The reason is required server-side for a checked-in move, aligning the accepted operator workflow and guaranteeing audit evidence. This is an intentional backend hardening recorded in `20-intentional-target-departures.md`.

Implementation applies remaining-night inventory semantics, old-room turnover, blocking-maintenance routing, destination repricing, invoice reconciliation and detailed audit.

### `POST /api/v1/bookings/:id/check-out`

Status: `PRESERVE / HARDEN`.
Authorization: `lifecycle.write`; `pending-approved` additionally requires admin-only `bookings.checkout.override`.

Preserve current required confirmations and payment fields:
- `charge_reviewed = true`;
- `release_confirmed = true`;
- `handoff_confirmed = true`;
- `check_out_payment_policy = settled | pending-approved`;
- `check_out_reference` required with accepted min length for `pending-approved`.

Vacancy result is `DIRTY` unless an open `BLOCKING` maintenance case requires `MAINTENANCE`.

### `POST /api/v1/bookings/:id/no-show`

Status: `ADD EXPLICIT COMMAND`.
Authorization: `lifecycle.write`.

Canonical payload:

```text
terminal_reason = trimmed text, min 6 chars
```

Preconditions: `CONFIRMED`, never occupied, `hotel_local_date >= check_in`. Releases reservation inventory, leaves physical room unchanged and records terminal event/evidence. No refund/penalty automation.

### `POST /api/v1/bookings/:id/extend-stay`

Status: `ADD EXPLICIT COMMAND`.
Authorization: `lifecycle.write`.

Canonical payload:

```text
new_check_out = ISO hotel stay date later than current check_out
```

Claims all added nights atomically, keeps booking `CHECKED_IN` and room `OCCUPIED`, applies source-parity repricing, reconciles invoice and records extension event. Partial/stale success is forbidden.

## Housekeeping read/cleaning routes

### `GET /api/v1/housekeeping/board`

Status: `PRESERVE AND EXTEND`.
Authorization: existing `housekeeping.read`.

Include occupied rooms only when an open maintenance case exists. Add maintenance impact/context additively.

### `POST /api/v1/housekeeping/:id/start`

Status: `PRESERVE`.
Authorization: `housekeeping.write`.
Transition: `DIRTY -> CLEANING`.

### `POST /api/v1/housekeeping/:id/finish`

Status: `PRESERVE / HARDEN`.
Authorization: `housekeeping.write`.
Transition: `CLEANING -> AVAILABLE` only when no blocking condition makes AVAILABLE untruthful.

## Maintenance read/write commands

### `GET /api/v1/housekeeping/:id/maintenance`

Status: `ADD ROOM-SCOPED READ CONTRACT`.
Authorization: `maintenance.read`.

Returns HTTP 200 with:

```text
{ maintenance_case: <open case view> | null }
```

Room lookup remains tenant-scoped. No open case is not an error and returns `maintenance_case: null`. This gives receptionist/admin/ops/housekeeping a least-privilege case-detail read without granting the full housekeeping board.

### `POST /api/v1/housekeeping/:id/maintenance`

Status: `PRESERVE PATH / EXPAND CONTRACT`.
Authorization: `maintenance.report`.

Canonical payload:
- `impact = NON_BLOCKING | BLOCKING`;
- `priority = LOW | MEDIUM | HIGH | URGENT`;
- `reason` trimmed min 6 chars;
- `assigned_to` trimmed min 2 chars.

Opening behavior follows the canonical maintenance model, including occupied-room support and truthful same-state events.

### `POST /api/v1/housekeeping/:id/maintenance/:case_id/escalate`

Status: `ADD EXPLICIT COMMAND`.
Authorization: `maintenance.report`.

Canonical payload:

```text
escalation_note = trimmed text, min 6 chars
```

Only `OPEN NON_BLOCKING -> OPEN BLOCKING` is allowed. Event records actor, prior/new impact and escalation note. Occupied room remains occupied but blocked; vacant eligible states enter `MAINTENANCE`.

### `POST /api/v1/housekeeping/:id/maintenance/:case_id/resolve`

Status: `ADD EXPLICIT COMMAND`.
Authorization: `maintenance.resolve`.

Canonical payload:

```text
resolution_note = trimmed text, min 6 chars
```

Supports occupied same-state resolution and blocking `MAINTENANCE -> DIRTY`. Event truthfully records whether physical state changed.

### `POST /api/v1/housekeeping/:id/dirty`

Status: `LEGACY COMPATIBILITY ONLY`.

May remain only for an open `BLOCKING` case on a room currently `MAINTENANCE`, internally delegating to the same resolution domain command and requiring the same resolution evidence/capability. New UI must use `/maintenance/:case_id/resolve`. Removal later requires explicit deprecation decision.

## Authorization matrix

- lifecycle commands: `lifecycle.write` -> admin, ops, receptionist.
- pre-occupancy booking writes/cancellation: existing booking write/update set -> admin, ops, receptionist.
- guest+booking create: both `guests.write` + `bookings.write` -> admin, ops, receptionist.
- maintenance: exactly `05-maintenance-data-rbac.md`.
- cleaning: `housekeeping.write` -> admin, ops, housekeeping.
- pending-balance checkout: lifecycle write + `bookings.checkout.override`; override admin-only.
- saas_admin: none of the tenant operational commands above.

## Error semantics

At minimum:
- `400` malformed/invalid payload or unsupported input;
- `403` capability failure;
- `404` tenant-scoped entity/room/explicit case id not found;
- `409` invalid current lifecycle/case state, stale state, availability/hold/maintenance conflict or lost concurrency race.

No success response may accompany partial state.

## OpenAPI/client obligation

Every new/additive route, payload, response field or enum is represented in the API contract/client types before browser acceptance. Existing drift checks remain binding.

## Completion rule

A lifecycle/maintenance increment is incomplete until implementation, tests, OpenAPI/client contract and browser flow use this map consistently. Parallel shadow endpoints, orphan capabilities or generic PATCH/direct-status shortcuts are scope violations.