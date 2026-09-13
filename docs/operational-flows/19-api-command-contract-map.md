# 19 — API command and compatibility map

Status: `BINDING API CONTRACT / IMPLEMENTATION LOCKED`

Canonical routes, payload/evidence rules, authorization, pricing side effects, compatibility and OpenAPI obligations. No parallel API or direct-state bypass.

## Global rules

- API under `/api/v1`; hotel identity only from authenticated context.
- Backend capability checks and evidence validation are authoritative.
- Stale/concurrent conflicts fail closed with no partial mutation/success event.
- Additive compatibility by default; breaking changes need a decision.

## D9 pricing boundary

Pricing-affecting: reservation room change, reservation stay-date change, reassignment, extension, extra charge, or future explicitly priced command.

All other booking metadata/state/evidence writes preserve stored total, including guest/name/ordinary notes-only, check-in, cancellation, no-show, late arrival and checkout. Checkout may update invoice/settlement lifecycle against the preserved total but cannot reprice accommodation.

## Front desk board

`GET /api/v1/front-desk/board` — preserve/extend; `bookings.read`; admin/ops/receptionist allowed, housekeeping/saas_admin denied. Canonical read-only Reception board for operational date, queue priority, readiness/blockers, late-arrival, room, maintenance and optional authoritative Billing context.

## Booking creation / confirmed updates

`POST /api/v1/bookings` — `bookings.write`; existing-guest create; initial pricing normal.

`POST /api/v1/bookings/with-guest` — both `guests.write` + `bookings.write`; atomic guest+booking; failure leaves neither unintended record.

`PATCH /api/v1/bookings/:id` — `bookings.write`; CONFIRMED pre-occupancy data, cancellation and late-arrival context only.

Pricing: room/date change reprices under accepted rule; guest/name/notes-only, cancellation-only and late-arrival-only preserve total.

### Cancellation
`status=CANCELLED`, terminal_reason min 6. No arrival-date cutoff. Release inventory; room/total unchanged; payment/invoice evidence preserved; no automatic financial disposition.

### Late arrival — D10
Required fields: `front_desk.late_arrival_eta`, `front_desk.late_arrival_note` min 6/max 250.

`late_arrival_eta` wire format is RFC3339/ISO-8601 `date-time` with explicit `Z` or numeric offset; timezone-less input is `400`. Server parses absolute instant, requires future instant, converts to hotel IANA timezone and requires hotel-local ETA date in `[check_in,check_out)`. Booking remains CONFIRMED; actor/recorded timestamp/audit persisted; room/inventory/total/invoice unchanged. Re-record allowed under same guards.

Generic PATCH must not implement checked-in reassignment, extension, checkout or no-show.

## Lifecycle commands

`POST /bookings/:id/check-in` — `lifecycle.write`; accepted confirmations + positive guest count; no new date cutoff; CHECKED_IN/OCCUPIED; total unchanged.

`POST /bookings/:id/reassign` — `lifecycle.write`; destination room_id + reason min 6; overrun guard; remaining-night movement/history; room turnover; pricing-affecting destination repricing + extras; invoice reconciliation/audit atomic.

`POST /bookings/:id/check-out` — `lifecycle.write`; pending-approved additionally admin-only override. Preserve checklist/policy/reference. Room DIRTY/MAINTENANCE. Booking total unchanged; invoice/settlement uses existing total.

`POST /bookings/:id/no-show` — `lifecycle.write`; reason min 6; CONFIRMED, never occupied, local date >= check_in; release inventory; room/total unchanged; financial evidence preserved.

`POST /bookings/:id/extend-stay` — `lifecycle.write`; later new_check_out; added nights atomic; pricing-affecting current-room repricing + extras; invoice reconcile; CHECKED_IN/OCCUPIED retained.

## Housekeeping

`GET /housekeeping/board` -> housekeeping.read. `POST /housekeeping/:id/start` -> housekeeping.write, DIRTY->CLEANING. `POST /housekeeping/:id/finish` -> housekeeping.write, CLEANING->AVAILABLE only if no blocker.

## Maintenance

`GET /housekeeping/:id/maintenance` -> maintenance.read; `{maintenance_case:<open>|null}` tenant-scoped.

`POST /housekeeping/:id/maintenance` -> maintenance.report; impact NON_BLOCKING|BLOCKING, priority, reason min 6, assigned_to min 2; transition matrix governs physical state.

`POST /housekeeping/:id/maintenance/:case_id/escalate` -> maintenance.report; escalation_note min 6; OPEN NON_BLOCKING -> OPEN BLOCKING.

`POST /housekeeping/:id/maintenance/:case_id/resolve` -> maintenance.resolve; resolution_note min 6; truthful same-state or MAINTENANCE->DIRTY resolution.

`POST /housekeeping/:id/dirty` -> legacy compatibility only for historical blocking MAINTENANCE resolution; delegate to canonical resolve.

## Authorization summary

Front-desk bookings.read: admin/ops/receptionist. Confirmed booking bookings.write: admin/ops/receptionist. lifecycle.write: admin/ops/receptionist. Inline guest+booking requires guests.write + bookings.write. Maintenance exactly `05-maintenance-data-rbac.md`. Cleaning admin/ops/housekeeping. Pending balance override admin-only. saas_admin has no tenant operations above.

## Errors / contract

400 invalid payload/evidence including timezone-less ETA; 403 capability; 404 tenant-scoped missing entity; 409 invalid/stale/conflicting state. No partial success.

Every additive route/payload/response/enum, date-time format and pricing side-effect rule must be reflected in automated tests and published API/client contracts before browser acceptance.

## Completion rule

Runtime, tests, OpenAPI/client and browser flow use this map. Shadow endpoints, orphan capabilities, hidden repricing, ambiguous timestamp parsing or direct-state shortcuts are scope violations.