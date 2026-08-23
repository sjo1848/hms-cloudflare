# TASK CONTRACT — CF-I03

TASK ID: `CF-I03`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `CONTEXTUAL SPECIALIST / BUILD`  
STATUS: `READY`

## OBJECTIVE

Implement the accepted bookings, availability and room-night overlap-protection parity increment on the passed CF-I02 rooms/guests/holds foundation. Preserve the same-origin `/api/v1` contract, Access → CONTROL_DB membership → authorized hotel-D1 boundary, integer-cents semantics and half-open date behavior. Do not implement reception lifecycle, billing, housekeeping, reporting, network administration or other later increments.

## CANONICAL INPUTS

- `AGENTS.md`, `.orchestration/STATE.md` and `.orchestration/STATUS.json`.
- Approved design: `docs/migration-design-package.md`, especially sections 8–13 and 20.
- Source parity reference: `docs/source-contract-inventory.md`, especially J-01, J-05, P-02, P-03 and P-05.
- CF-I01 and CF-I02 contracts, artifacts and independent reviews.
- Runtime authorization recorded by `8a6f2d8`.

## SCOPE

### API and hotel operational D1

Implement the booking/availability contract needed for the increment:

- `GET /bookings` with bounded filters suitable for the source list/calendar surface;
- `POST /bookings` for reservation/walk-in creation;
- `GET /bookings/{id}`;
- `PATCH /bookings/{id}` for non-lifecycle booking data updates only;
- `GET /rooms/available` compatibility with active booking claims as well as holds;
- the room-night claim schema and atomic booking create/update/cancel claim replacement seam.

Booking creation and date/room changes must validate `check_in < check_out`, guest and room ownership in the authorized hotel D1, reject held or already-claimed room nights, and maintain booking plus claims atomically. Active/non-cancelled bookings must have one claim per occupied night with a unique `(room_id, stay_date)` key. Cancellation must release claims atomically. Direct lifecycle status transitions (check-in, checkout and reassignment workflows) remain later scope.

### UI

Add a responsive, browser-testable `/bookings` surface with:

- authenticated same-origin API client;
- booking list/loading/empty/validation/typed-error states;
- booking creation with guest, room and date selection;
- availability results that reflect holds and active booking claims;
- booking detail/edit affordance limited to the scoped non-lifecycle fields;
- no billing, check-in/out, housekeeping, reporting or network feature expansion.

## AUTHORIZATION AND DATA INVARIANTS

- Never trust a client hotel identifier to authorize or select a database.
- Bookings, claims, rooms, guests and holds remain in the authorized operational hotel D1; control-plane data stays narrow.
- Cross-hotel room/guest/booking references must fail closed.
- Money is integer cents; booking total is an integer-cent value derived from nights × room rate unless the accepted source contract requires an explicit override.
- Date intervals are half-open and all overlap checks use `existing.start < requested.end AND existing.end > requested.start`.
- No production deployment, remote D1 mutation, real-data access or paid Cloudflare resource.

## REQUIRED ACCEPTANCE

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Booking create/list/detail/update | `/bookings`, booking API | Valid reservation/walk-in persists with tenant-local room/guest, dates, status and integer-cent total; invalid input returns typed errors. | API/domain tests and UI/browser evidence. |
| Availability | room selector/API | Required dates validate; holds and active booking claims exclude rooms; adjacent half-open intervals remain available. | Query/route tests and UI evidence. |
| Overlap protection | hotel D1 booking/claim schema | Concurrent or repeated conflicting active claims cannot occupy the same room-night; failed mutation leaves no partial booking/claims. | Database constraint and atomicity/regression tests. |
| Cancellation | booking API | Cancellation releases room-night claims atomically and makes the room available again. | API/domain tests. |
| Tenant boundary | all booking routes | Authorized hotel A cannot resolve hotel B room/guest/booking IDs or use an unknown binding. | Routing/DB regression tests. |
| UI states/scope | `/bookings` | Loading, empty, validation, unauthorized/forbidden and server-error states are observable; later feature surfaces are absent. | Component/browser evidence and diff review. |

## DECISION LATITUDE

The Specialist may choose schema column names, repository/helper layout, booking status representation, local fixtures, test organization and UI component structure, provided the contract and invariants remain intact. It may not change CF-DATA-001, the Access boundary, Workers/Hono/TypeScript/D1 target, `/api/v1` compatibility objective, cost boundary or increment boundaries.

## FORBIDDEN ACTIONS

- Check-in, checkout, room reassignment lifecycle, billing, payments, housekeeping, users/RBAC, reports or network feature implementation.
- Production deployment, remote D1 mutation, paid Cloudflare activation or real-data access.
- Shared operational database or client-controlled database selection.
- Skipping independent Critic review or self-approving substantive work.

## REQUIRED OUTPUTS

- API, D1 migration/query, React/Vite UI and tests within this scope.
- Exact artifact commit SHA persisted before Critic review.
- Independent Critic review with exact reviewed HEAD, evidence, findings and verdict.
- Updated `.orchestration/STATE.md` and `.orchestration/STATUS.json` after each terminal task verdict.

## CRITIC FOCUS

Actively test for missing booking routes, API-only parity claims, cross-tenant leakage, unbound/raw SQL, inclusive date-end errors, hold/booking overlap gaps, non-atomic booking/claim writes, invalid cancellation behavior, floating-point money, missing UI states and accidental later-increment scope.

## DONE WHEN

All scoped acceptance criteria are evidenced, the artifact is committed, and an independent Critic returns `PASS` or bounded rework obtains a fresh `PASS`. Then derive the next authorized task or persist the applicable legitimate stop condition.
