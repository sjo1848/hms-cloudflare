# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

This file binds canonical routes, payload/evidence rules, authorization, pricing side effects, compatibility and OpenAPI obligations. No parallel API or direct-state bypass is permitted.

## Global API rules

- API remains under `/api/v1`; hotel identity comes only from authenticated server context.
- Backend capability checks are authoritative.
- Material evidence is validated server-side.
- Stale/concurrent conflicts fail closed with no partial mutation or success event.
- Compatible response growth is additive; breaking changes require a new decision.

## D9 pricing-mutation boundary

A booking total changes only when the command is explicitly pricing-affecting.

Pricing-affecting in this wave:
- reservation room change;
- reservation stay-date change;
- in-stay reassignment;
- stay extension;
- extra charge;
- a future command explicitly declared priced.

All other booking metadata/state/evidence writes preserve the stored authoritative total unless a future decision says otherwise. This includes guest reassociation/name, ordinary notes-only update, check-in, cancellation, no-show, late-arrival metadata and checkout.

Checkout may create/reconcile invoice/settlement state against the preserved total but cannot reprice accommodation by itself. Any actual total change must reconcile an existing invoice atomically.

## Front desk board

### `GET /api/v1/front-desk/board`

Status: preserve/extend. Authorization: `bookings.read`.

Allowed: admin, ops, receptionist. Denied: housekeeping, saas_admin.

Canonical Reception read model; read-only. May add operational date/timestamp, queue lane/priority, readiness/blockers, late-arrival context, room, maintenance impact/id and authoritative Billing summary. No competing board route.

## Booking creation / confirmed booking updates

### `POST /api/v1/bookings`
Authorization: `bookings.write`. Existing-guest reservation creation; initial total follows normal booking pricing.

### `POST /api/v1/bookings/with-guest`
Authorization: both `guests.write` + `bookings.write`. Atomic guest+booking. Validation/duplicate/availability/lost-room failure leaves neither unintended guest nor booking.

### `PATCH /api/v1/bookings/:id`
Authorization: `bookings.write`. Allowed for CONFIRMED pre-occupancy data, cancellation and late-arrival context.

Pricing rule:
- room or stay-date change -> pricing-affecting, accepted current-room repricing + extras;
- guest reassociation/name-only, ordinary notes-only, cancellation-only or late-arrival-only -> total unchanged.

#### Cancellation
`status=CANCELLED`, `terminal_reason` min 6. No arrival-date cutoff. Release inventory; room unchanged; total unchanged; payment/invoice evidence preserved; no automatic refund/penalty.

#### Late arrival
`front_desk.late_arrival_eta` + `front_desk.late_arrival_note` (min 6/max 250). CONFIRMED only; ETA future and hotel-local ETA date in `[check_in,check_out)`. Persist actor/recorded timestamp/audit. No room, inventory, total or invoice mutation. Re-record allowed under same guards.

Generic PATCH must not implement checked-in reassignment, extension, checkout or no-show.

## Lifecycle commands

### `POST /api/v1/bookings/:id/check-in`
`lifecycle.write`; accepted confirmations + positive guest count; no new date cutoff; booking CHECKED_IN, room OCCUPIED; total unchanged.

### `POST /api/v1/bookings/:id/reassign`
`lifecycle.write`; payload destination `room_id` + reason min 6; overrun guard; remaining-night inventory only; preserve history; room turnover; pricing-affecting destination-current-price repricing + extras; invoice reconciliation and audit atomic.

### `POST /api/v1/bookings/:id/check-out`
`lifecycle.write`; pending-approved additionally requires admin-only `bookings.checkout.override`. Preserve checklist/policy/reference contract. Room -> DIRTY or MAINTENANCE. Booking total unchanged; invoice/settlement uses existing total.

### `POST /api/v1/bookings/:id/no-show`
`lifecycle.write`; terminal_reason min 6; CONFIRMED, never occupied, `hotel_local_date >= check_in`. Release inventory; room unchanged; total unchanged; financial evidence preserved; no automatic disposition.

### `POST /api/v1/bookings/:id/extend-stay`
`lifecycle.write`; later `new_check_out`; all added nights atomic; pricing-affecting current-room repricing + extras; invoice reconcile; booking CHECKED_IN, room OCCUPIED.

## Housekeeping

`GET /api/v1/housekeeping/board`: `housekeeping.read`, preserve/extend cleaning board.

`POST /api/v1/housekeeping/:id/start`: `housekeeping.write`, DIRTY -> CLEANING.

`POST /api/v1/housekeeping/:id/finish`: `housekeeping.write`, CLEANING -> AVAILABLE only if no blocker makes result false.

## Maintenance

`GET /api/v1/housekeeping/:id/maintenance`: `maintenance.read`; returns `{maintenance_case:<open>|null}` tenant-scoped.

`POST /api/v1/housekeeping/:id/maintenance`: `maintenance.report`; impact NON_BLOCKING|BLOCKING, priority, reason min 6, assigned_to min 2; physical consequence follows transition matrix.

`POST /api/v1/housekeeping/:id/maintenance/:case_id/escalate`: `maintenance.report`; escalation_note min 6; OPEN NON_BLOCKING -> OPEN BLOCKING only.

`POST /api/v1/housekeeping/:id/maintenance/:case_id/resolve`: `maintenance.resolve`; resolution_note min 6; same-state resolution where appropriate or MAINTENANCE -> DIRTY after blocking vacancy.

`POST /api/v1/housekeeping/:id/dirty`: legacy compatibility only for historical blocking MAINTENANCE resolution; delegate to canonical resolution. New UI uses explicit resolve.

## Authorization summary

- front-desk `bookings.read`: admin/ops/receptionist.
- confirmed booking `bookings.write`: admin/ops/receptionist.
- lifecycle.write: admin/ops/receptionist.
- guest+booking: guests.write + bookings.write.
- maintenance: exactly `05-maintenance-data-rbac.md`.
- cleaning: admin/ops/housekeeping via housekeeping.write.
- pending balance override: admin-only.
- saas_admin: none of these tenant operations.

## Error / contract obligations

400 invalid payload/evidence; 403 capability; 404 tenant-scoped not found; 409 invalid/stale/conflicting state. No partial success.

Every additive route/payload/response/enum and pricing side-effect rule must be represented in tests and published API/client contracts before browser acceptance.

## Completion rule

Runtime, automated tests, OpenAPI/client and browser flow must all use this map. Shadow endpoints, orphan capabilities, hidden repricing or direct-state shortcuts are scope violations.