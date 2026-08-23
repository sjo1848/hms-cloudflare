# HMS Cloudflare — Source Contract Inventory

Status: DESIGN evidence for `CF-SOURCE-CONTRACT-001`  
Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`  
Inventory date: 2026-08-23  
Target: `sjo1848/hms-cloudflare`  

This document records the observable source contract that the Cloudflare migration must preserve. It does not select a D1 tenancy topology, implement target code, migrate data, or add product scope. The source repository was cloned read-only at the pinned SHA and was not modified.

## Evidence and completeness

| Evidence | Ref | Use |
|---|---|---|
| Product scope and accepted surfaces | `README.md` lines 1–80 | Reception, dashboard, rooms, housekeeping, billing, administration, multi-hotel, security, mobile and quality gates. |
| Canonical router | `backend/src/infrastructure/web/routes/mod.rs:115–291` | Runtime route and method inventory, handler and backend capability middleware. |
| OpenAPI contract | `backend/openapi.yaml:12–1077` | Schema/path cross-check and compatibility surface. |
| Frontend route tree | `frontend/src/App.tsx:95–203` | User-visible routes, frontend capability guards and error surfaces. |
| Backend capability canon | `backend/src/infrastructure/web/middleware/rbac_generated.rs:1–104` | Role/capability vocabulary and role matrix. |
| Auth boundary | `backend/src/infrastructure/web/middleware/auth.rs:13–106`; `frontend/src/features/auth/AuthContext.tsx:1–96` | Public auth exceptions, CSRF, token/cookie handling and `/auth/me` bootstrap. |
| Domain lifecycle and money | `backend/src/domain/models.rs:7–221,304–325`; `backend/src/application/booking_service.rs:44–240` | Status transitions, operational checklists, integer cents, date validity, availability and audit. |
| Tenant and database guarantees | `backend/migrations/0003_add_booking_overlap_constraint.sql`; `0007_enable_multi_tenancy.sql`; `0010_tenant_constraints.sql`; `0011_tenant_fk_integrity.sql`; `0015_rls_phase1_tenant_policies.sql`; `0017_rls_bypass_default_false.sql`; `0030_rls_remaining_tenant_tables.sql` | PostgreSQL guarantees requiring explicit target translation. |
| Representative backend tests | `backend/tests/booking_flow.rs`; `booking_transactional_integrity.rs`; `cash_shift_handoff.rs`; `maintenance_workflow.rs`; `rbac_authorization.rs`; tenant test files | Acceptance and security evidence references. |
| Representative frontend tests | `frontend/src/App.guards.test.tsx`; feature/component `*.test.tsx` files | UI guard, workflow, responsive and observable-surface evidence. |

Completeness checks performed at the pinned baseline:

- Router extraction: 51 `/api/v1` operations.
- OpenAPI extraction: 51 `/api/v1` operations.
- Result: no method/path discrepancy found. Router parameters use `:id`/`:hold_id`; OpenAPI uses `{id}`/`{hold_id}` for the same paths.
- Frontend API usage contains all contract paths through the centralized API services and direct telemetry call; frontend route tree covers `/`, `/bookings`, `/rooms`, `/calendar`, `/guests`, `/housekeeping`, `/users`, `/network`, `/reports`, `/login`, `/forbidden` and wildcard not-found handling.
- The source README states core reception widths of 375, 390 and 430 pixels in CI; frontend implementation also has explicit 768px and 1024px responsive transitions.

## Product surface map

| Surface | Frontend evidence | Primary contract/API areas | Observable scope |
|---|---|---|---|
| Reception / bookings | `frontend/src/features/bookings/**`; route `/bookings` | bookings, front-desk board, guests, rooms/availability, holds, billing and auth | Reservations, arrivals/departures, walk-ins, guest case, check-in/out, charges and payments. |
| Calendar | `frontend/src/features/schedule/**`; route `/calendar` | bookings list/update and availability | Reservation timeline/agenda and booking context. |
| Rooms | `frontend/src/features/rooms/**`; route `/rooms` | rooms, availability, status, bulk status, holds | Inventory, room state, rates, holds and maintenance context. |
| Guests | `frontend/src/features/guests/**`; route `/guests` | guests, bookings context | Guest records and selection in reception. |
| Housekeeping | `frontend/src/features/housekeeping/**`; route `/housekeeping` | housekeeping boards and transitions | Dirty/cleaning/available/maintenance workflow and handoff. |
| Users / RBAC | `frontend/src/features/users/**`; route `/users` | users, auth/me, audit | Tenant user administration and capability denial. |
| Reports | `frontend/src/features/reports/**`; route `/reports` | revenue and occupancy reports | Financial/occupancy reporting. |
| Dashboard | `frontend/src/features/dashboard/DashboardHome.tsx`; route `/` | analytics KPIs, front-desk board, billing balance, housekeeping and report data | Arrivals, departures, occupancy, cash activity and prioritized operations. |
| Hotel network | `frontend/src/features/dashboard/HotelNetworkPage.tsx`; route `/network` | hotels, network KPIs, plan, feature flags | SaaS-level hotel network administration; not tenant-admin scope. |
| Auth and errors | `features/auth`, `features/errors`; `/login`, `/forbidden`, wildcard | native auth compatibility endpoints and `/auth/me` | Login/session bootstrap/logout, forbidden and not-found/error states. |

## Complete routed API inventory

Capability is the backend-authoritative middleware requirement. `Auth public` means the endpoint is an intentional native-auth exception to the normal authenticated API boundary. `Authenticated` means the auth middleware still applies but no additional capability middleware is attached.

| Method | Path | Capability / auth | Purpose | Primary surface |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | Auth public; rate-limited | Native credential login and access/refresh issuance. | Login |
| POST | `/api/v1/auth/refresh` | Auth public; rate-limited + CSRF rules | Refresh session/token. | Session bootstrap |
| POST | `/api/v1/auth/logout` | Auth public; rate-limited + CSRF rules | Revoke/logout session. | Session |
| GET | `/api/v1/auth/me` | Authenticated | Current user/hotel/role bootstrap. | Auth, all protected surfaces |
| GET | `/api/v1/hotels` | `saas.hotels.read` | List hotels/network entities. | Network |
| POST | `/api/v1/hotels` | `saas.hotels.write` | Create hotel. | Network administration |
| GET | `/api/v1/hotels/network-kpis` | `saas.hotels.read` | Network-level KPIs. | Network/dashboard |
| PATCH | `/api/v1/hotels/{id}/plan` | `saas.hotels.write` | Change hotel plan tier. | Network administration |
| GET | `/api/v1/feature-flags` | Authenticated | Read hotel feature flags. | Dashboard/network |
| GET | `/api/v1/rooms` | `rooms.read` | List rooms. | Rooms, reception |
| POST | `/api/v1/rooms` | `rooms.write` | Create room. | Rooms administration |
| GET | `/api/v1/rooms/available` | `rooms.search` | Search room availability for dates. | Reception, calendar, rooms |
| GET | `/api/v1/rooms/holds/board` | `rooms.read` | Board of room holds. | Rooms, reception |
| POST | `/api/v1/rooms/bulk-status` | `rooms.status.write` | Bulk room state transition. | Rooms |
| GET | `/api/v1/rooms/{id}` | `rooms.read` | Room detail. | Rooms |
| PATCH | `/api/v1/rooms/{id}` | `rooms.write` | Update room metadata/rate. | Rooms administration |
| PATCH | `/api/v1/rooms/{id}/status` | `rooms.status.write` | Domain room-state transition. | Rooms, housekeeping |
| GET | `/api/v1/rooms/{id}/holds` | `rooms.read` | List holds for a room. | Rooms |
| POST | `/api/v1/rooms/{id}/holds` | `rooms.write` | Create dated room hold. | Rooms, availability |
| PATCH | `/api/v1/rooms/{id}/holds/{hold_id}` | `rooms.write` | Update room hold. | Rooms |
| DELETE | `/api/v1/rooms/{id}/holds/{hold_id}` | `rooms.write` | Delete room hold. | Rooms |
| GET | `/api/v1/bookings` | `bookings.read` | List/filter bookings. | Reception, calendar |
| POST | `/api/v1/bookings` | `bookings.write` | Create reservation/walk-in booking. | Reception |
| GET | `/api/v1/front-desk/board` | `bookings.read` | Reception queue/arrival/departure board. | Dashboard, reception |
| PATCH | `/api/v1/bookings/{id}` | `bookings.update` | Update booking data; status changes use transactional workflow. | Reception, calendar |
| GET | `/api/v1/bookings/{id}/extra-charges` | `bookings.extra_charges.read` | List extra charges. | Booking case/billing |
| POST | `/api/v1/bookings/{id}/extra-charges` | `bookings.extra_charges.write` | Add extra charge in integer cents. | Booking case/billing |
| GET | `/api/v1/guests` | `guests.read` | Search/list guests. | Guests, reception |
| POST | `/api/v1/guests` | `guests.write` | Create guest. | Guests, walk-in |
| GET | `/api/v1/users` | `users.read` | List tenant users. | Users |
| POST | `/api/v1/users` | `users.write` | Create user/role. | Users |
| DELETE | `/api/v1/users/{id}` | `users.delete` | Delete tenant user. | Users |
| GET | `/api/v1/analytics/kpis` | `analytics.kpis.read` | Dashboard KPIs. | Dashboard |
| GET | `/api/v1/audit/events` | `audit.events.read` | Audit event listing. | Users/audit, operations |
| GET | `/api/v1/billing/balance` | `billing.balance.read` | Current balance and outstanding settlement summary. | Dashboard, billing |
| GET | `/api/v1/billing/closures` | `billing.balance.read` | Cash closure history. | Billing |
| POST | `/api/v1/billing/close-cash` | `billing.close_cash.write` | Reconcile and close cash shift. | Billing |
| GET | `/api/v1/invoices` | `billing.invoices.read` | List invoices. | Billing/reports |
| GET | `/api/v1/bookings/{id}/invoice` | `billing.invoice.read` | Booking invoice. | Booking case/billing |
| GET | `/api/v1/bookings/{id}/payments` | `billing.invoice.read` | Booking payment history. | Booking case/billing |
| POST | `/api/v1/bookings/{id}/payments` | `bookings.update` | Register booking payment. | Booking case/billing |
| POST | `/api/v1/bookings/{id}/settle-payment` | `bookings.update` | Settle booking payment state. | Booking case/checkout |
| GET | `/api/v1/housekeeping/dirty` | `housekeeping.read` | Dirty-room queue. | Housekeeping |
| GET | `/api/v1/housekeeping/board` | `housekeeping.read` | Housekeeping board with room/maintenance context. | Housekeeping |
| POST | `/api/v1/housekeeping/{id}/start` | `housekeeping.write` | Start cleaning transition. | Housekeeping |
| POST | `/api/v1/housekeeping/{id}/finish` | `housekeeping.write` | Finish cleaning and release room. | Housekeeping |
| POST | `/api/v1/housekeeping/{id}/maintenance` | `housekeeping.write` | Move room to maintenance workflow. | Housekeeping |
| POST | `/api/v1/housekeeping/{id}/dirty` | `housekeeping.write` | Return room to dirty state. | Housekeeping |
| GET | `/api/v1/reports/revenue` | `reports.revenue.read` | Revenue report. | Reports |
| GET | `/api/v1/reports/occupancy` | `reports.occupancy.read` | Occupancy report. | Reports |
| POST | `/api/v1/telemetry/ui` | Authenticated | Track UI telemetry event. | All frontend surfaces |

The non-versioned operational endpoints `/`, `/health`, `/ready`, `/metrics`, Swagger UI and OpenAPI JSON are outside the `/api/v1` product inventory. Their routing and auth/public behavior remain relevant to deployment readiness, but they are not product parity endpoints.

## Authentication adaptation boundary

`CF-ARCH-001` selects Cloudflare Access as the target authentication boundary. The source native endpoints are therefore compatibility exceptions, not a target requirement to reproduce username/password plus Argon2.

- Preserve `/api/v1/auth/me` as the application bootstrap contract: the frontend uses it to populate the authenticated user, hotel and role context.
- Mark `/api/v1/auth/login`, `/refresh` and `/logout` as native-auth exceptions. The migration may replace their mechanism with Access/session integration, but must preserve the application’s observable session behavior and typed error handling except for the approved auth-mechanism substitution.
- Source middleware accepts bearer access tokens or `access_token` cookies, performs CSRF validation for state-changing requests, and records hotel/user/role request context (`backend/src/infrastructure/web/middleware/auth.rs:13–106`). The target must preserve equivalent protection and traceability appropriate to Access.
- Frontend guards are supplementary: `RequireAuth` and `RequireCapability` protect routes in `frontend/src/App.tsx`, while backend capabilities remain authoritative.

## Critical invariant map

| Invariant | Source evidence | Migration obligation |
|---|---|---|
| Tenant isolation | `hotel_id` is carried through models/repositories; `0015`, `0017`, `0030` enable/force RLS and fail closed by default. | Preserve tenant isolation at the authoritative backend/data boundary. Do not weaken or choose topology here; `CF-DATA-001` remains open. |
| Cross-tenant relations impossible/rejected | `0011_tenant_fk_integrity.sql` adds composite `(hotel_id,id)` FKs for bookings→rooms/guests, tokens→users, audit, invoices, extra charges and cash closures; `tenant_fk_integrity.rs`. | Explicitly translate composite relational integrity to the target. A request with an object from another hotel must not succeed. |
| Tenant-scoped uniqueness | `0010_tenant_constraints.sql` replaces global room/user/guest uniqueness with `(hotel_id, value)` indexes. | Preserve tenant-scoped uniqueness and collision behavior. |
| Booking date validity and overlap | `models.rs:304–325`; `0003_add_booking_overlap_constraint.sql`; `booking_service.rs:77–112`; `booking_flow.rs`. | Preserve half-open date semantics, `check_out > check_in`, active-booking overlap exclusion and availability/hold checks. |
| Room availability and holds | `booking_service.rs:53–93`; room hold service/repository; room endpoints. | Holds and bookings both block availability; do not reduce to a UI-only check. |
| Booking lifecycle | `models.rs:118–137`; `booking_transactional_integrity.rs`; update service rejects direct status mutation. | Check-in, checkout, reassignment and arrival exceptions remain domain transitions, not generic PATCH CRUD. |
| Check-in completion | `models.rs:140–187`; frontend `BookingCheckInSection*` and `BookingDetailsSheet*`. | Preserve required guest count, document, contact and stay confirmations plus actor/time fields. |
| Checkout and housekeeping handoff | `models.rs:189–206`; `booking_service.rs:220–240`; transactional test. | Preserve settlement/policy/reference, charge review, room release and housekeeping handoff; checkout makes room dirty and audits the transition. |
| Room state machine | `models.rs:7–31`; housekeeping endpoints and `maintenance_workflow.rs`. | Preserve allowed transitions: available→occupied/maintenance, occupied→dirty, dirty→cleaning/maintenance, cleaning→available/maintenance, maintenance→dirty, plus no-op. |
| Integer money | `models.rs:35–42,210–220,563–621`; billing services/tests. | Keep amounts as integer cents; no floating-point conversion. Preserve invoice/payment/charge/closure atomicity. |
| Financial atomicity | `booking_transactional_integrity.rs`; `cash_shift_handoff.rs`; `booking_transaction_service.rs`; cash closure service. | Multi-write operations must commit or roll back together, including invoice/payment/room/audit effects. |
| Backend RBAC | `rbac_generated.rs:1–104`; `rbac.rs`; `rbac_authorization.rs`. | Preserve capability names, role scopes and backend denial. Frontend route guards cannot replace this. |
| Audit/request traceability | audit service/repository, booking service audit calls, auth request context and `audit/events`. | Risk-relevant mutations retain actor, hotel and request traceability; observable audit access remains capability-bound. |
| CSRF/session safety | `auth.rs:30–47`; `utils.rs`; auth tests. | Preserve CSRF requirements for state-changing cookie/session flows and refresh/logout behavior. |
| Rate/security boundary | `routes/mod.rs:60–120`; auth middleware; README quality gates. | Preserve auth rate limiting, security headers, typed errors and operational health/readiness semantics in target design. |

## Representative acceptance journeys

Each journey follows `Requirement → Expected Surface → Acceptance → Evidence`. The evidence column deliberately includes UI evidence for UI-observable behavior and backend/database evidence for invariant-level behavior.

### J-01 — Reservation creation

- Requirement: staff can create a valid reservation for a hotel, room, dates and guest.
- Expected Surface: reception `/bookings`, guest/room selectors, availability result and booking case.
- Acceptance: a valid booking is created with `Confirmed`, integer-cent total based on nights × room rate, guest/room tenant match and audit event; invalid dates, unavailable rooms, overlapping bookings or overlapping holds are rejected.
- Evidence: `POST /api/v1/bookings`; `booking_service.rs:44–129`; `models.rs:304–325`; `backend/tests/booking_flow.rs:22–166`; frontend `WalkInBookingSheet*`, `BookingsPage*`, `BookingDrawer*`.

### J-02 — Walk-in and check-in

- Requirement: receptionist can create/locate a walk-in and complete check-in through the operational checklist.
- Expected Surface: `/bookings` reception workspace, walk-in sheet, booking details/check-in section; mobile stepwise flow.
- Acceptance: walk-in collects stay, guest and room; check-in cannot complete until guest count, document verification, contact confirmation and stay confirmation are true; successful transition is `Confirmed → CheckedIn`, room becomes occupied, actor/time data and audit are recorded.
- Evidence: `POST /bookings`, `PATCH /bookings/{id}` plus application transactional workflow; `models.rs:118–206`; `booking_transactional_integrity.rs:205–392`; frontend `WalkInBookingSheet.tsx`, `BookingCheckInSection.tsx`, `BookingDetailsSheet.test.tsx`.

### J-03 — Room reassignment

- Requirement: an in-house booking can be reassigned safely.
- Expected Surface: booking case reassignment section and room availability picker.
- Acceptance: reassignment preserves tenant, checks destination room availability/holds, updates booking and related room states atomically, and rolls back fully if destination is unavailable.
- Evidence: `booking_transactional_integrity.rs:506–736`; `frontend/src/features/bookings/components/BookingReassignmentSection.tsx`; rooms availability endpoint and `roomService.ts`.

### J-04 — Checkout → housekeeping handoff

- Requirement: authorized staff can complete a checkout and hand the room to housekeeping.
- Expected Surface: booking case checkout section, billing/settlement panel, housekeeping queue/board.
- Acceptance: checkout requires an accepted payment policy, reference when pending-approved, charges reviewed, room release confirmed and housekeeping handoff confirmed; booking becomes `CheckedOut`, room becomes `Dirty`, and housekeeping sees the dirty room.
- Evidence: `models.rs:189–206`; `booking_service.rs:220–240`; `booking_transactional_integrity.rs:34–204`; `frontend/src/features/bookings/components/BookingCheckOutSection.tsx`; `housekeeping/HousekeepingPage.tsx`.

### J-05 — Room hold and availability

- Requirement: staff can place a dated hold and availability excludes held inventory.
- Expected Surface: rooms hold board, room detail, reception room selector and availability picker.
- Acceptance: hold has room, hotel, date interval, typed reason and creator; overlapping hold/booking blocks availability and reservation; update/delete changes the board consistently.
- Evidence: room hold endpoints at `routes/mod.rs:149–177`; `RoomHold` model at `models.rs:82–116`; `booking_flow.rs:136–190`; room hold UI components and service.

### J-06 — Housekeeping transitions and maintenance

- Requirement: housekeeping can move rooms through cleaning and maintenance states.
- Expected Surface: `/housekeeping` dirty queue, board, cleaning and maintenance actions.
- Acceptance: dirty→cleaning→available is valid; maintenance can be entered from allowed states, maintenance cases are owned/audited/transactional, and return path is explicit through dirty; invalid transitions are rejected.
- Evidence: room state machine `models.rs:7–31`; housekeeping routes `routes/mod.rs:259–281`; `maintenance_workflow.rs:13–220`; `HousekeepingRoomWorkspace*`, `MaintenanceCaseActions*`.

### J-07 — Extra charge, payment, settlement and cash closure

- Requirement: staff can record charges/payments, settle a booking and close cash without financial drift.
- Expected Surface: booking billing sections, invoice/payment history, billing balance and cash closure screens.
- Acceptance: charges and payments remain integer cents, invoice/payment/booking state changes are atomic, settlement reflects outstanding balance, closure reconciles total/cash/card/count difference and records handoff; failure leaves no partial mutation.
- Evidence: extra-charge/payment/settlement routes `routes/mod.rs:193–257`; money models; `booking_transactional_integrity.rs:34–204`; `cash_shift_handoff.rs:16–140`; `BookingSupportSections*`, invoice/payment services and billing endpoints.

### J-08 — Role/capability denial

- Requirement: a user can access only the capabilities granted to the role.
- Expected Surface: frontend protected routes and `/forbidden`; backend API response.
- Acceptance: frontend hides/redirects unauthorized routes, but a direct API call is denied by backend capability middleware; role matrix preserves admin, saas_admin, ops, receptionist and housekeeping scopes.
- Evidence: `rbac_generated.rs:1–104`; `rbac_authorization.rs:47–707`; `App.tsx:95–203`; `App.guards.test.tsx:55–201`.

### J-09 — Cross-tenant access attempt

- Requirement: a principal from hotel A cannot read or mutate hotel B data or create cross-hotel relations.
- Expected Surface: API denial or not-found semantics; no foreign tenant data in UI.
- Acceptance: repository scope, composite FKs and RLS prevent cross-tenant reads/writes/inserts; cross-hotel booking→room/guest and other relations are rejected at the database boundary.
- Evidence: `tenant_context_runtime.rs`; `tenant_fk_integrity.rs:5–120`; `tenant_rls_phase1.rs:8–174`; `tenant_rls_remaining.rs:7–129`; migrations `0011`, `0015`, `0017`, `0030`.

### J-10 — Network-level authorized view

- Requirement: only a SaaS-authorized principal can view or mutate network-level hotel data.
- Expected Surface: `/network`, hotel network KPIs and plan controls.
- Acceptance: `saas_admin` can access `saas.hotels.read/write`; tenant roles cannot use network APIs; hotel-scoped operational roles do not gain network scope through frontend navigation.
- Evidence: hotel routes `routes/mod.rs:124–138`; `rbac_generated.rs:54–55`; `rbac_authorization.rs`; `HotelNetworkPage.tsx`; `App.tsx:173–181`.

### J-11 — Desktop and accepted mobile reception widths

- Requirement: reception journeys remain usable at accepted desktop and mobile widths.
- Expected Surface: reception workspace, walk-in and booking sheets, guest/room pickers, focus/error states.
- Acceptance: CI/browser checks cover 375, 390 and 430px; mobile uses stepwise walk-in flow and explicit review; desktop uses multi-panel flow at 1024px; crossing 768px closes mobile pickers and returns focus to the desktop control without losing state.
- Evidence: `README.md` mobile operations section; `WalkInBookingSheet.tsx:53–200,327–481`; `MobilePickerSurface.tsx:35–57`; `WalkInGuestSection.test.tsx`; `MobilePickerSurface.test.tsx`; reception workspace tests.

## Parity / traceability matrix

| ID | Requirement | Expected surface | Acceptance anchor | Evidence anchor |
|---|---|---|---|---|
| P-01 | Session bootstrap and auth adaptation | Login/protected app | Access/session establishes user context; `/auth/me` remains usable; native auth endpoints are explicit exceptions. | `auth.rs`; `AuthContext.tsx`; auth routes/OpenAPI. |
| P-02 | Reservation and walk-in creation | Reception/bookings | Valid booking succeeds; invalid date, room, guest, hold and overlap fail. | J-01/J-02; booking flow tests. |
| P-03 | Calendar visibility | Calendar | Booking dates/status/room context match backend. | `CalendarPage*`; bookings endpoints. |
| P-04 | Room inventory and state | Rooms | Tenant-scoped rooms, rates and valid state transitions. | Room routes; room model; room tests. |
| P-05 | Holds and availability | Rooms/reception | Holds and bookings exclude overlapping availability. | J-05; room hold service/tests. |
| P-06 | Guest records | Guests/reception | Create/search/select guest with tenant scope. | Guest routes; guest UI/services. |
| P-07 | Check-in lifecycle | Booking case | Required checklist and atomic room occupancy transition. | J-02; operational integrity tests. |
| P-08 | Reassignment lifecycle | Booking case | Destination availability and rollback. | J-03. |
| P-09 | Checkout/handoff | Booking + housekeeping | Settlement/release/handoff gates and dirty-room result. | J-04. |
| P-10 | Housekeeping/maintenance | Housekeeping | Valid transitions, case ownership and return path. | J-06. |
| P-11 | Charges, payments, invoices | Booking billing | Integer cents, payment history and atomic settlement. | J-07; finance routes/tests. |
| P-12 | Cash closure | Billing | Reconciliation and shift handoff are durable and auditable. | `cash_shift_handoff.rs`; cash closure service. |
| P-13 | Dashboard/reporting | Dashboard/reports | KPI, revenue and occupancy outputs match source semantics. | Dashboard/reports routes and tests. |
| P-14 | Users/RBAC | Users/forbidden | Backend capability matrix and frontend supplementary guards agree. | J-08; RBAC canon/tests. |
| P-15 | Tenant isolation | All tenant surfaces | No cross-tenant data or relations; DB boundary rejects violations. | J-09; FK/RLS tests. |
| P-16 | Network administration | Network | SaaS scope only for network endpoints and view. | J-10. |
| P-17 | Audit and request traceability | Audit/operations | Actor, hotel and relevant request context survive risk mutations. | Audit service, auth middleware, audit endpoint. |
| P-18 | Responsive reception | Reception mobile/desktop | 375/390/430 mobile and 768/1024 responsive transitions preserve workflow. | J-11; README and frontend responsive tests. |

## PostgreSQL-specific translation obligations

These are obligations to translate explicitly, not a target design decision:

1. PostgreSQL `EXCLUDE USING gist` on `(room_id, daterange(check_in, check_out, '[)'))` for non-cancelled bookings must become an equivalent atomic overlap guarantee.
2. Composite tenant foreign keys backed by unique `(hotel_id,id)` indexes must remain impossible to bypass.
3. PostgreSQL RLS policies, `FORCE ROW LEVEL SECURITY`, session settings (`app.current_hotel_id`, `app.rls_bypass`) and fail-closed default behavior require an equivalent authoritative isolation boundary. `CF-DATA-001` decides topology; this inventory does not.
4. Tenant-scoped unique indexes for username, room number and guest email must preserve collision semantics.
5. SQL transaction boundaries used for booking lifecycle, invoice/payment/charge mutations, room state and audit must translate to target atomic operations.
6. PostgreSQL date/range semantics are half-open and must not become inclusive end-date logic.
7. `BIGINT` integer-cent fields must remain integer-safe in storage, API schemas and UI formatting.
8. PostgreSQL-generated UUIDs, timestamps, check constraints and trigger/policy behavior require explicit target equivalents where observable or security-relevant.
9. Keyset/index performance and tenant-scoped query patterns are part of operational translation; a functionally correct but unbounded cross-tenant query is not parity-complete.

## Unknowns and open evidence gaps

- The source contains both native auth implementation and the approved target Access boundary; exact target claim-to-user/hotel mapping remains an architecture/design concern and must not be invented here.
- The exact accepted visual pixel tolerances, browser matrix and production performance thresholds are referenced by scripts/CI and README but are not restated as numeric contract values in this inventory.
- Some application behavior is distributed across handlers, application services, repositories, migrations and frontend controllers; representative evidence is cited, but this document is not a replacement for source tests during later increment reviews.
- The source migration history includes an RLS bypass setting whose later default is fail-closed; target review must preserve the effective final behavior, not copy intermediate migration text literally.
- The source README describes synthetic demo credentials for local development; no credentials or real guest data are copied into the target.
- `CF-DATA-001` remains unresolved. No A/B/C topology is selected, and no final D1 schema or tenant deployment model is authorized by this artifact.

## Explicit non-scope

- No Cloudflare Worker, React target UI, D1 schema, deployment configuration or migration code is implemented here.
- No source repository mutation, production access, real-data migration or cutover is performed.
- No new customer-facing capability is added.

