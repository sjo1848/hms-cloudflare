# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

This file binds canonical routes, payload/evidence rules, authorization, pricing side effects, compatibility and OpenAPI obligations. BUILD must not invent parallel APIs or bypass these commands.

## Global API rules

- API remains under `/api/v1`; tenant/hotel identity comes only from authenticated server context.
- UI visibility never substitutes backend capability checks.
- Material evidence is validated server-side.
- Stale/concurrent conflicts fail closed with no partial domain mutation or success audit.
- Compatible response growth is additive; breaking changes require a new decision.
- Evidence text uses accepted validation limits unless specified otherwise.

### Pricing-mutation boundary — D9

Commands must distinguish **pricing-affecting** from **state/evidence-only** writes.

Pricing-affecting writes: room/date changes, extension/reassignment, extra charges, or another command explicitly defined as priced. These may change authoritative booking total under their defined pricing rule and must reconcile any existing invoice.

State/evidence-only writes: check-in, cancellation, no-show, late-arrival metadata and checkout. These **preserve the existing booking total**. They must not copy the accepted source generic-update side effect that recalculates accommodation from the current room catalog price. Checkout may create/reconcile invoice/settlement state against the existing total, but does not reprice accommodation by itself.

## Front desk read model

### `GET /api/v1/front-desk/board`

Status: `PRESERVE AND EXTEND`. Authorization: `bookings.read`.

Roles: admin/ops/receptionist allowed; housekeeping/saas_admin denied tenant board access.

Canonical Reception read model; no competing board route. Read-only. May add operational date/timestamp, queue lane/priority, readiness/blockers, late-arrival context, room, maintenance case impact/id and optional authoritative Billing summary.

## Booking creation and confirmed-booking updates

### `POST /api/v1/bookings`
Authorization: `bookings.write`. Existing-guest reservation creation; initial total uses the normal booking pricing rule.

### `POST /api/v1/bookings/with-guest`
Authorization: both `guests.write` and `bookings.write`. Atomic guest+booking intent. Validation/duplicate/availability failure leaves no unintended guest or booking.

### `PATCH /api/v1/bookings/:id`
Status: confirmed pre-occupancy edits, cancellation and late-arrival context only. Authorization: `bookings.write`.

A pre-occupancy room/date edit is pricing-affecting and uses accepted source repricing. A cancellation or late-arrival-only write is state/evidence-only and preserves booking total.

#### Cancellation
`status=CANCELLED`, `terminal_reason` min 6. CONFIRMED only; no arrival-date cutoff. Release inventory, room unchanged, total unchanged, payment/invoice evidence preserved; no automatic refund/penalty.

#### Late arrival
Source-compatible nested metadata:
- `front_desk.late_arrival_eta`
- `front_desk.late_arrival_note` min 6/max 250.

CONFIRMED only; ETA future and hotel-local ETA date in `[check_in,check_out)`. Persist ETA/note/actor/recorded timestamp/audit. No room, inventory, total or invoice mutation. Re-record allowed under same guards.

Generic PATCH must not implement checked-in reassignment, extension, checkout or no-show.

## Explicit lifecycle commands

### `POST /api/v1/bookings/:id/check-in`
Authorization: `lifecycle.write`. Required check-in confirmations + positive guest count. No new calendar cutoff. **Preserve booking total**; this command changes lifecycle/room state, not price.

### `POST /api/v1/bookings/:id/reassign`
Authorization: `lifecycle.write`. Payload `room_id` + reason min 6. Pricing-affecting: move remaining inventory, preserve history, room turnover, destination-current-price repricing + extras, invoice reconciliation and audit atomically. Registered overrun guard applies.

### `POST /api/v1/bookings/:id/check-out`
Authorization: `lifecycle.write`; `pending-approved` additionally requires admin-only `bookings.checkout.override`. Preserve current checklist/policy/reference contract. Room becomes DIRTY or MAINTENANCE according to blocking maintenance. **Preserve booking total**; invoice creation/reconciliation and settlement validation use that existing total.

### `POST /api/v1/bookings/:id/no-show`
Authorization: `lifecycle.write`. `terminal_reason` min 6. CONFIRMED, never occupied, `hotel_local_date >= check_in`. Release inventory, room unchanged, **booking total unchanged**, payment/invoice evidence preserved, no automatic financial disposition.

### `POST /api/v1/bookings/:id/extend-stay`
Authorization: `lifecycle.write`. `new_check_out` later than current. Pricing-affecting: atomically claim all added nights, update checkout, source repricing using current assigned-room price + extras, reconcile invoice, audit. Booking remains CHECKED_IN; room remains OCCUPIED.

## Housekeeping read and cleaning

`GET /api/v1/housekeeping/board`: `housekeeping.read`, preserve/extend cleaning board.

`POST /api/v1/housekeeping/:id/start`: `housekeeping.write`, DIRTY -> CLEANING.

`POST /api/v1/housekeeping/:id/finish`: `housekeeping.write`, CLEANING -> AVAILABLE only if no blocking condition makes result false.

## Maintenance commands

`GET /api/v1/housekeeping/:id/maintenance`: `maintenance.read`; returns `{maintenance_case:<open case>|null}` tenant-scoped.

`POST /api/v1/housekeeping/:id/maintenance`: `maintenance.report`; requires impact NON_BLOCKING|BLOCKING, priority, reason min 6, assigned_to min 2. Opening behavior follows transition matrix.

`POST /api/v1/housekeeping/:id/maintenance/:case_id/escalate`: `maintenance.report`; escalation_note min 6; OPEN NON_BLOCKING -> OPEN BLOCKING only.

`POST /api/v1/housekeeping/:id/maintenance/:case_id/resolve`: `maintenance.resolve`; resolution_note min 6; same-state resolution where appropriate or MAINTENANCE -> DIRTY for blocking case after vacancy.

`POST /api/v1/housekeeping/:id/dirty`: legacy compatibility only for historical open BLOCKING case on MAINTENANCE, delegating to canonical resolution semantics. New UI uses explicit resolve.

## Authorization matrix

- front-desk board `bookings.read`: admin/ops/receptionist.
- confirmed booking writes/cancel/late arrival `bookings.write`: admin/ops/receptionist.
- lifecycle write: admin/ops/receptionist.
- inline guest+booking: both guests.write + bookings.write.
- maintenance: exactly `05-maintenance-data-rbac.md`.
- cleaning: admin/ops/housekeeping via housekeeping.write.
- pending balance override: admin-only.
- saas_admin: none of these tenant operational actions.

## Error semantics

400 invalid payload/evidence; 403 capability; 404 tenant-scoped not found; 409 invalid/stale/conflicting domain state. No partial success.

## OpenAPI/client obligation

Every additive route/payload/response/enum and pricing side-effect contract is reflected in API/client types and tests before browser acceptance.

## Completion rule

Implementation, automated tests, OpenAPI/client and browser flow must all use this canonical contract. Shadow endpoints, orphan capabilities, undocumented pricing side effects or direct-state shortcuts are scope violations.