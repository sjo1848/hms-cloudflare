# TASK CONTRACT — CF-I05

TASK ID: `CF-I05`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME ORCHESTRATOR / ACCELERATED OPERATIONAL WAVE`  
STATUS: `READY`

## OBJECTIVE

Implement the accepted HMS Housekeeping + Maintenance increment on the integrated CF-I04 foundation. Preserve the approved Cloudflare Access boundary, control-plane membership and authorized hotel-D1 routing, tenant-local relational integrity, explicit room-state transitions, actor/hotel/request traceability and same-origin `/api/v1` behavior. This is a parity migration increment, not a product redesign.

The wave must be implemented as one coherent artifact with internal deterministic checkpoints. Do not create external micro-boundaries between schema, API, UI and evidence. Stop only after the single immutable artifact is ready for Independent Critic, or at a real Human Gate/blocker.

## CANONICAL INPUTS

- `AGENTS.md`, `.orchestration/STATE.md`, `.orchestration/STATUS.json`.
- Approved design and scope: `docs/migration-design-package.md`.
- Source contract: `docs/source-contract-inventory.md`, especially J-06, P-10, P-15, P-17 and P-18.
- Binding decisions: `.orchestration/decisions/CF-DATA-001.md`, `CF-UX-PARITY-001.md`, `PM-AUTONOMY-001.md`.
- Read-only source baseline `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`, especially `housekeeping_service.rs`, `maintenance_service.rs`, `maintenance_workflow.rs`, housekeeping routes, `HousekeepingPage`, `HousekeepingRoomWorkspace`, `MaintenanceCaseActions` and housekeeping queue tests.
- Accepted integrated CF-I04 artifact `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.

## SCOPE

### Domain / D1 / API

Implement the hotel-operational Housekeeping + Maintenance surface:

- Housekeeping dirty queue and board with room status, room context and today’s departure context where available.
- Domain transitions: `DIRTY → CLEANING → AVAILABLE`; maintenance entry from `AVAILABLE`, `DIRTY` or `CLEANING` as allowed by the source state machine; `MAINTENANCE → DIRTY`; same-state no-op may be accepted; all other transitions reject.
- Maintenance case open: one open case per room, priority `LOW|MEDIUM|HIGH|URGENT`, trimmed reason length 6–250, trimmed assignee length 2–100, actor and timestamp ownership, tenant-local room relation.
- Maintenance case resolve: trimmed resolution note length 6–250, resolver and timestamp, durable `RESOLVED` state, explicit `return_status=DIRTY`, room returns to `DIRTY` atomically.
- Legacy `MAINTENANCE` room without an open case must be resolvable through an explicit synthesized/backfilled case path without inventing an unowned cross-tenant relation.
- API paths under `/api/v1`: `GET /housekeeping/dirty`, `GET /housekeeping/board`, `POST /housekeeping/{id}/start`, `POST /housekeeping/{id}/finish`, `POST /housekeeping/{id}/maintenance`, `POST /housekeeping/{id}/dirty`.
- Backend capability authority: `housekeeping.read/write` for `admin`, `ops`, `housekeeping`; receptionist and unknown roles fail closed.
- All state/case/audit writes for one operation remain atomic inside the authorized hotel D1. No CONTROL_DB + hotel-D1 transaction is allowed.

### UX / Browser

Adapt the source `/housekeeping` board to the current React/Vite target without redesigning its workflow:

- route/navigation reachability for `/housekeeping`;
- dirty/cleaning/available/maintenance filters and room/guest search where board data supports it;
- room workspace tabs or equivalent summary/action/maintenance information architecture;
- explicit start cleaning, finish cleaning, open maintenance case and resolve-to-dirty actions;
- required validation, loading, typed error and success refresh states;
- read-only/forbidden behavior for receptionist and unauthorized roles;
- mobile/desktop usability at 375/390/430/768/1024, including action controls and maintenance evidence fields.

### QA / Security

Adversarially prove invalid transition rejection, duplicate open-case rejection, meaningful text validation, atomic rollback/preservation, tenant isolation, role capability denial, legacy maintenance resolution, audit traceability, board consistency and browser behavior. QA/Security evidence is separate from implementation reasoning; no self-declared Independent Critic PASS.

## SOURCE PARITY MATRIX

| Requirement | Source surface / behavior | Target surface | Acceptance | Evidence |
|---|---|---|---|---|
| Dirty queue | `HousekeepingPage`, `getDirtyRooms`, J-06 | `/housekeeping`, `GET /housekeeping/dirty` | Dirty and cleaning rooms are visible with tenant-local room context | API/D1 + browser |
| Board/context | `HousekeepingService::get_board`, `HousekeepingPage`, queue tests | `GET /housekeeping/board`, board filters/cards | Board includes eligible room states and departure/maintenance context without cross-tenant data | API contract + browser |
| Cleaning start | `start_cleaning`, `POST /housekeeping/{id}/start` | Same API and room workspace action | Only `DIRTY → CLEANING`; atomic room/event update; invalid states reject | D1/API regression |
| Cleaning finish | `finish_cleaning`, `POST /housekeeping/{id}/finish` | Same API and room workspace action | Only `CLEANING → AVAILABLE`; atomic event; invalid states reject | D1/API regression + browser |
| Maintenance open | `mark_maintenance`, `MaintenanceCaseActions` | `POST /housekeeping/{id}/maintenance`, maintenance form | Allowed source state enters `MAINTENANCE`; case is open, prioritized, owned, audited, tenant-local and unique per room | D1/API + UI validation |
| Maintenance resolve | `return_to_dirty`, `MaintenanceCaseActions` | `POST /housekeeping/{id}/dirty`, resolution form | Open/legacy case resolves atomically; room becomes `DIRTY`; note/resolver/time retained | D1/API + browser |
| State machine | `RoomStatus::can_transition_to`, J-06 | D1 transition guards/API | Valid transitions only; same-state no-op policy explicit; no direct generic PATCH bypass | adversarial SQL/API |
| Authorization | source RBAC canon | API capability map and UI handling | admin/ops/housekeeping allowed; receptionist/unknown denied | role matrix regression |
| Tenant isolation | source composite FKs/RLS obligation, J-09 | per-hotel D1 + room/case FK checks | cross-tenant room/case IDs cannot read/write/create relations | routing/API/D1 regression |
| Traceability | source audit events and case actor fields, J-06/P-17 | housekeeping events/case fields | actor subject, hotel, request ID, timestamps retained for every mutation | D1 assertions |
| Responsive parity | source housekeeping workspace/queue tests, J-11 | React `/housekeeping` | lifecycle actions and maintenance forms usable at 375/390/430/768/1024 | Playwright screenshots/journey |
| Scope boundary | CF-I05 increment / CF-I06 separation | target diff | no billing, payments, settlement, RBAC administration, network administration or migration/cutover | diff/scope audit |

## DATA / ATOMICITY INVARIANTS

- `maintenance_cases.hotel_id` and `room_id` are tenant-local by topology and foreign-key relation; no client-selected database binding.
- At most one `OPEN` case exists for a room in one hotel.
- Opening a case and moving the room to `MAINTENANCE` commit together or neither commits.
- Resolving a case and moving the room to `DIRTY` commit together or neither commits.
- A room transition must verify the expected current state in the same D1 write boundary.
- Case status, priority, reason, assignee, reporter/resolver, timestamps, return status and event trace are durable.
- No production deployment, remote D1 mutation, real-data migration, paid resource or cutover action.

## REQUIRED VALIDATION

- unit/API tests for parsing, capabilities and state/case rules;
- D1 migration application and `scripts/cf-i05-regression.sh` covering valid/invalid transitions, rollback, duplicate cases, tenant/role denial and traceability;
- browser journey through `/housekeeping` at 375/390/430/768/1024;
- `npm run check`, `npm run web:build`, `npm run types:check`, `npm run wrangler:dry-run`, `git diff --check`;
- self-critic checklist against every row of the parity matrix and exact scope diff.

## RESPONSIBILITY / REVIEW BOUNDARY

This runtime uses `RUNTIME_CAPABILITY_FALLBACK`; no separate Specialist contexts are exposed. Domain/Engineering, UX and QA/Security responsibilities remain separated in the plan, implementation passes, test harness and evidence. Codex may self-critic for defect discovery but cannot self-approve substantive PASS. The exact final artifact requires an external Independent Critic.

## FORBIDDEN ACTIONS

- CF-I06 billing, invoices, payments, settlement or cash closure.
- Users/RBAC administration, hotels/network administration, analytics/reports or product redesign.
- Generic room-status PATCH bypass of housekeeping domain transitions.
- Cross-database transaction, production/remote mutation, real data, paid Cloudflare activation or cutover.
- Publishing intermediate substantive artifacts or asking Human routine approval.

## DONE WHEN

The single artifact contains contract-complete D1/API/UX implementation, adversarial QA, responsive/browser evidence, full regression, self-critic checklist and updated canonical state. Codex then publishes one immutable artifact with `external_review.required=true` and stops. CF-I06 is not started.
