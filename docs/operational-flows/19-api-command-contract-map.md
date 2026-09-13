# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

Purpose: bind canonical HTTP routes, payload/evidence rules, authorization, compatibility boundaries and OpenAPI obligations for the complete operational-flow wave. BUILD must not invent parallel APIs or use generic mutations to bypass the commands below.

## Global API rules

- API remains under `/api/v1`.
- Tenant/hotel identity comes only from authenticated server context.
- UI visibility never substitutes backend capability checks.
- Material evidence is validated server-side.
- Stale/concurrent conflicts fail closed: no partial domain mutation and no success audit.
- Compatible response growth is additive; breaking renames require a new decision.
- Unless specified otherwise, operational evidence text is trimmed and uses the accepted minimum of 6 characters and existing maximum limits.

## Front desk read model

### `GET /api/v1/front-desk/board`

Status: `PRESERVE AND EXTEND`.

Authorization: `bookings.read`.

Binding role effect under the current tenant role map:
- `admin`: allowed;
- `ops`: allowed;
- `receptionist`: allowed;
- `housekeeping`: denied;
- `saas_admin`: denied tenant operational access.

This is the canonical Reception read model. Do not create `/operations/front-desk` or another competing board.

It remains read-only and may be extended additively with authoritative operational date/generated timestamp, queue lane/priority, readiness/blockers, late-arrival context, current room, maintenance case id/impact and an optional authoritative Billing summary.

## Booking creation and confirmed-booking updates

### `POST /api/v1/bookings`

Status: `PRESERVE`.

Authorization: `bookings.write`.

Used for reservation creation with an existing guest.

### `POST /api/v1/bookings/with-guest`

Status: `ADD BOUNDED ATOMIC COMMAND`.

Authorization requires both `guests.write` and `bookings.write`.

Payload combines current guest-create fields with normal booking `room_id`, `check_in`, `check_out` and optional booking notes. Success persists both records and returns the resulting booking/guest context. Guest validation, duplicate identity, availability or concurrent room loss leaves neither an unintended guest nor booking.

### `PATCH /api/v1/bookings/:id`

Status: `PRESERVE / EXTEND FOR CONFIRMED PRE-OCCUPANCY DATA, CANCELLATION AND LATE-ARRIVAL CONTEXT`.

Authorization: `bookings.write`.

The booking must remain `CONFIRMED` for the arrival-exception metadata below.

#### Cancellation payload

```text
status = CANCELLED
terminal_reason = trimmed text, min 6 chars
```

No arrival-date cutoff is added. Success releases reservation inventory, leaves physical room state unchanged and records terminal actor/time/reason. No automatic refund/penalty behavior is introduced.

#### Late-arrival payload

Source-compatible shape remains nested front-desk metadata:

```text
front_desk.late_arrival_eta = ISO date-time in the accepted v1 date-time format
front_desk.late_arrival_note = trimmed text, min 6 chars, max 250
```

Binding semantics:
- booking stays `CONFIRMED`;
- ETA must represent a future instant;
- ETA's hotel-local stay date must satisfy `check_in <= eta_date < check_out`;
- successful recording stores ETA, note, actor and recorded timestamp and emits truthful audit evidence;
- recording/re-recording late arrival does not alter room physical state, inventory, booking total or invoice;
- malformed/expired/out-of-stay ETA or invalid note is rejected before mutation.

This preserves the accepted source behavior that late arrival is context, not a lifecycle state. Do not add a separate late-arrival endpoint in this wave.

Generic PATCH must not implement checked-in reassignment, stay extension, checkout or no-show.

## Explicit lifecycle commands

### `POST /api/v1/bookings/:id/check-in`

Status: `PRESERVE / HARDEN`.

Authorization: `lifecycle.write`.

Required evidence preserves the current target contract: `document_verified=true`, `contact_confirmed=true`, `stay_confirmed=true`, positive `check_in_guests_count`. No new calendar-day cutoff is introduced.

### `POST /api/v1/bookings/:id/reassign`

Status: `PRESERVE / HARDEN`.

Authorization: `lifecycle.write`.

Canonical payload:

```text
room_id = destination id
reason = trimmed operational reason, min 6 chars
```

The command enforces the registered overrun guard, moves only remaining-night inventory, preserves historical room-night truth, performs old/destination room transitions, applies source-parity destination repricing, reconciles invoice state and emits detailed audit atomically.

### `POST /api/v1/bookings/:id/check-out`

Status: `PRESERVE / HARDEN`.

Authorization: `lifecycle.write`; `pending-approved` additionally requires admin-only `bookings.checkout.override`.

Preserve required fields: `charge_reviewed=true`, `release_confirmed=true`, `handoff_confirmed=true`, `check_out_payment_policy=settled|pending-approved`, and accepted `check_out_reference` validation for the override path. Vacancy becomes `DIRTY` unless an open `BLOCKING` maintenance case requires `MAINTENANCE`.

### `POST /api/v1/bookings/:id/no-show`

Status: `ADD EXPLICIT COMMAND`.

Authorization: `lifecycle.write`.

Payload:

```text
terminal_reason = trimmed text, min 6 chars
```

Preconditions: `CONFIRMED`, never occupied, `hotel_local_date >= check_in`. Success releases reservation inventory, leaves physical room unchanged and records terminal evidence. No automatic financial disposition.

### `POST /api/v1/bookings/:id/extend-stay`

Status: `ADD EXPLICIT COMMAND`.

Authorization: `lifecycle.write`.

Payload:

```text
new_check_out = hotel stay date later than current check_out
```

All added nights are validated/claimed atomically; booking stays `CHECKED_IN`, room stays `OCCUPIED`, source-parity repricing is applied, any existing invoice is reconciled and one extension event is persisted. Partial/stale success is forbidden.

## Housekeeping read and cleaning routes

### `GET /api/v1/housekeeping/board`

Status: `PRESERVE AND EXTEND`.

Authorization: `housekeeping.read`.

Cleaning-oriented board. Occupied rooms appear only when maintenance work makes them operationally relevant. Add maintenance impact/context fields additively.

### `POST /api/v1/housekeeping/:id/start`

Authorization: `housekeeping.write`. Transition: `DIRTY -> CLEANING`.

### `POST /api/v1/housekeeping/:id/finish`

Authorization: `housekeeping.write`. Transition: `CLEANING -> AVAILABLE` only when no blocking condition makes that result false.

## Maintenance read/write commands

### `GET /api/v1/housekeeping/:id/maintenance`

Status: `ADD ROOM-SCOPED READ CONTRACT`.

Authorization: `maintenance.read`.

Returns HTTP 200 with `{ maintenance_case: <open case view> | null }`. Room lookup is tenant-scoped. `null` truthfully means no open case. This is the least-privilege maintenance read for Reception and does not grant the full housekeeping board.

### `POST /api/v1/housekeeping/:id/maintenance`

Status: `PRESERVE PATH / EXPAND CONTRACT`.

Authorization: `maintenance.report`.

Payload requires `impact=NON_BLOCKING|BLOCKING`, priority `LOW|MEDIUM|HIGH|URGENT`, `reason` min 6 and `assigned_to` min 2. Opening behavior follows the transition matrix for occupied and vacant rooms.

### `POST /api/v1/housekeeping/:id/maintenance/:case_id/escalate`

Authorization: `maintenance.report`.

Payload: `escalation_note` min 6. Only `OPEN NON_BLOCKING -> OPEN BLOCKING` is permitted. Event records actor, old/new impact and note. Physical consequence depends on occupancy.

### `POST /api/v1/housekeeping/:id/maintenance/:case_id/resolve`

Authorization: `maintenance.resolve`.

Payload: `resolution_note` min 6. Supports same-state resolution while occupied/non-blocking and `MAINTENANCE -> DIRTY` for blocking cases after vacancy. Event must state truthfully whether physical state changed.

### `POST /api/v1/housekeeping/:id/dirty`

Status: `LEGACY COMPATIBILITY ONLY`.

May remain only for the historical open `BLOCKING` case on a room currently `MAINTENANCE`, delegates to the same resolution domain command and requires the same resolution evidence/capability. New UI uses `/maintenance/:case_id/resolve`.

## Authorization matrix

- `bookings.read` front-desk board: admin, ops, receptionist.
- `bookings.write` confirmed booking create/edit/cancel/late-arrival metadata: admin, ops, receptionist.
- lifecycle commands: `lifecycle.write` -> admin, ops, receptionist.
- inline guest+booking: both `guests.write` + `bookings.write` -> admin, ops, receptionist.
- maintenance capabilities: exactly `05-maintenance-data-rbac.md`.
- cleaning: `housekeeping.write` -> admin, ops, housekeeping.
- pending-balance checkout: lifecycle write + admin-only `bookings.checkout.override`.
- `saas_admin`: no tenant operational command/read above.

## Error semantics

At minimum:
- `400`: malformed/invalid evidence or unsupported input;
- `403`: capability failure;
- `404`: tenant-scoped entity/room/explicit case id not found;
- `409`: invalid current lifecycle/case state, stale state, availability/hold/maintenance conflict or lost concurrency race.

No success response may accompany partial state.

## OpenAPI/client obligation

Every new/additive route, payload, response field or enum — including `front_desk` late-arrival metadata and board/maintenance fields — must be represented in the published API/client types before browser acceptance. Existing drift gates remain binding.

## Completion rule

An increment is incomplete until implementation, automated tests, OpenAPI/client contract and browser flow all use this map consistently. Shadow endpoints, orphan capabilities, undocumented payloads or generic/direct-status shortcuts are scope violations.