# Block D Rooms — Frozen Surface, Workflow, API and Capability Inventory

Status: **FROZEN BEFORE PRODUCT CODE**. Inspection at base `044ad756b0081d2a54083ea89c782557e97a351f`; branch `impl/hms-block-d-rooms`.

## Current user-visible surfaces

| Surface | Current implementation | Current capability/behavior | Known gap for Block D |
|---|---|---|---|
| `/rooms` board | `apps/web/src/features/rooms/RoomsPage.tsx`; `rooms-operational.css` | room count, derived “available now”/occupied/arrivals summary, client search over number/type/status/guest, two-column card board | Cards collapse dimensions into one `StatusBadge`; no operational filters; no range selector; list/detail and booking context are local state only |
| Selected room | Same component | guest/booking situation inferred from first 100 bookings, room number/type/rate, room status badge, holds list | occupant/guest is not linked; capped booking context may be absent; no dimension breakdown/readiness reasons/maintenance facts/room URL identity |
| Room metadata | Expandable Add Room; inline Edit Room | number, free-text room type, integer-cent price | create/edit forms share the workspace surface; action visibility presently relies partly on CSS capability selectors |
| Holds | Selected-room inline form and rows | create uses hard-coded `Other`; list and delete; initial/detail/error/loading states | no edit control although PATCH exists; limited validation/context feedback; no range-specific display |
| Responsive | Existing two-pane resource layout; stacks selected detail above list below 760px | room cards become one column below 980px; status counts reflow | mobile is a stacked desktop layout; context/selection does not survive reload/navigation |

## Exact Block D workflows (current route inventory)

| Workflow ID | Current UI | Existing API | Capability | Block D treatment |
|---|---|---|---|---|
| ROOM-01 Inspect/search operational room board | `/rooms` | `GET /rooms` | `rooms.read` | workspace over all authoritative dimensions, readiness, impact and independent search/filters |
| ROOM-02 Create room | Add Room form | `POST /rooms` | `rooms.write` | preserve number/type/nonnegative integer-cent rate; no lifecycle state fields |
| ROOM-03 Edit room/rate | selected-room form | `PATCH /rooms/:id` | `rooms.write` | preserve only number/type/rate fields; reject/never render generic status editing |
| ROOM-04 Inspect holds | selected-room list | `GET /rooms/:id/holds`, `GET /rooms/holds/board` | `rooms.read` | preserve selection and distinguish overlapping/current/future ranges |
| ROOM-05 Create hold | selected-room form | `POST /rooms/:id/holds` | `rooms.write` | expose backend-supported `Vip`, `Maintenance`, `Owner`, `Compliance`, `Commercial`, `Other`; server remains overlap authority |
| ROOM-06 Edit hold | no UI action | `PATCH /rooms/:id/holds/:hold_id` | `rooms.write` | add focused, recoverable edit from existing hold; retain server 409 truth |
| ROOM-07 Remove hold | hold row delete | `DELETE /rooms/:id/holds/:hold_id` | `rooms.write` | preserve operation; clear confirmation/context only as contract requires |
| ROOM-09 Follow room occupant/arrival to Booking/Guest | details display text only | `GET /front-desk/board` provides tenant-local booking, guest, room and open maintenance context | `bookings.read`; optional guest navigation also `guests.read` | stable navigable context where destination supports selected IDs; capability-gated; no booking mutation |
| Date-range sellability | absent | `GET /rooms/available?start&end` requires `rooms.search`, but `ADVANCE_RESERVABLE_ROOM_SQL` is legacy and response explicitly says `LEGACY_FILTER_NOT_CANONICAL` | `rooms.search` | do not use it as a canonical answer. Contract freezes an optional interval read on existing `GET /rooms`, using F0.1's existing pure predicate and tenant D1 evidence |
| Room maintenance context | dimension only; no case detail | `GET /front-desk/board` context under `bookings.read`; `GET /housekeeping/:id/maintenance` under `maintenance.read` | respective read capabilities | read-only facts/context only; no report/escalate/resolve or housekeeping commands |

## Backend/API source inventory

- Registration: `apps/api/src/index.ts` mounts existing `inventory.ts`; there is no `routes/rooms.ts` and none is required.
- `apps/api/src/routes/inventory.ts`: `/rooms`, `/rooms/available`, holds board/detail/create/edit/delete, room detail/create/edit; all route guards and request/validation behavior inspected.
- `apps/api/src/modules/room-state/domain.ts`: canonical `deriveRoomOperationalState` and `deriveDateRangeSellability`; dimensions/readiness are authoritative domain output.
- `apps/api/src/modules/room-state/read-model.ts`: `ROOM_DIMENSION_SELECT`, unknown/conflicting evidence handling and legacy status projection.
- `apps/api/src/modules/inventory/availability.ts`, `apps/api/src/room-availability.ts`: booking availability helpers and expressly legacy advance-reservable predicate.
- `apps/api/src/routes/front-desk.ts`: `GET /front-desk/board` tenant-local contextual bookings and open maintenance summary; requires `bookings.read`.
- `apps/api/src/routes/housekeeping.ts`: maintenance detail read requires `maintenance.read`; housekeeping and maintenance commands are outside Block D.
- `apps/api/src/auth/capabilities.ts`: role/capability source; `/api/v1/auth/me` is UI capability source. `apps/web/src/app/navigation.ts` already gates `/rooms` on `rooms.read`.
- Persisted room/hold/inventory schema files are existing read/write stores only: migrations 0001–0004, 0009, 0020–0025. This Task Contract adds no migration.
- Existing room-state/domain and route tests include `domain.test.ts`, `room-state-route.executing-d1.test.ts`, `room-dimensions.executing-d1.test.ts`, hold/availability tests. Directed additions belong beside these and the local Worker/D1 browser runner.

## Cross-module boundary

Block D may link to the existing Reception case, Guest directory and Housekeeping destination; it cannot redesign or add their workflows. Reception/Housekeeping data is optional context and must fail independently when its capability/read is unavailable; canonical room dimensions continue to render. All state mutations in this task remain existing room metadata and room-hold commands. No Housekeeping/Maintenance state transition is exposed from Rooms.
