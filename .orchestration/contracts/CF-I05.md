# TASK CONTRACT — CF-I05

TASK ID: `CF-I05`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME ORCHESTRATOR / ACCELERATED OPERATIONAL WAVE`  
STATUS: `READY / REWORK-1 AUTHORIZED`

## OBJECTIVE

Implement the accepted HMS Housekeeping + Maintenance increment on the integrated CF-I04 foundation. Preserve the approved Cloudflare Access boundary, control-plane membership and authorized hotel-D1 routing, tenant-local relational integrity, explicit room-state transitions, actor/hotel/request traceability and same-origin `/api/v1` behavior. This is a parity migration increment, not a product redesign.

The wave must be implemented as one coherent artifact with internal deterministic checkpoints. Do not create external micro-boundaries between schema, API, UI and evidence. Stop only after the single immutable artifact is ready for Independent Critic, or at a real Human Gate/blocker.

## CANONICAL INPUTS

- `AGENTS.md`, `.orchestration/STATE.md`, `.orchestration/STATUS.json`.
- Approved design and scope: `docs/migration-design-package.md`.
- Source contract: `docs/source-contract-inventory.md`, especially J-06, P-10, P-15, P-17 and P-18.
- Binding decisions: `.orchestration/decisions/CF-DATA-001.md`, `CF-UX-PARITY-001.md`, `PM-AUTONOMY-001.md`, `PM-INVARIANTS-001.md`.
- Learned invariant registry: `.orchestration/INVARIANTS.md`.
- Mandatory artifact admission gate: `.orchestration/PRECRITIC-GATE.md`.
- Current external REWORK: `.orchestration/reviews/CF-I05-CRITIC.md`.
- Read-only source baseline `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`, especially `housekeeping_service.rs`, `maintenance_service.rs`, `maintenance_workflow.rs`, housekeeping routes, `HousekeepingPage`, `HousekeepingRoomWorkspace`, `MaintenanceCaseActions` and housekeeping queue tests.
- Accepted integrated CF-I04 artifact `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.

## APPLICABLE LEARNED INVARIANTS

The following registry rules are mandatory for CF-I05 and its REWORK. Codex must persist `.orchestration/evidence/CF-I05-INVARIANTS.md` before the next artifact is published.

- `INV-ATOMIC-001` — stale/zero-row cleaning and maintenance mutations cannot produce false success.
- `INV-AUDIT-001` — housekeeping audit/events exist exactly once on success and never on stale/rejected operations.
- `INV-DOMAIN-001` — housekeeping/maintenance transitions cannot be bypassed through generic room CRUD.
- `INV-TENANT-001` — hotel routing and object access fail closed.
- `INV-RBAC-001` — backend `housekeeping.read/write` remains authoritative.
- `INV-PARITY-001` — source maintenance and state semantics are not weakened for target convenience.
- `INV-UX-001` — preserve the accepted queue → selected room → focused workspace interaction model.
- `INV-RESP-001` — material Housekeeping actions must be executable at 375/390/430/768/1024.
- `INV-EVID-001` — evidence documentation may not overstate mock/shell/browser coverage.
- `INV-LEGACY-001` — synthesized legacy maintenance recovery retains recovery actor/tenant/time/provenance.
- `INV-STATE-001` — reviewed artifact and canonical state must converge.
- `INV-SCOPE-001` — accelerated CF-I05 must not absorb CF-I06 or later high-risk scope.
- `INV-MONEY-001` — `N/A` for CF-I05; financial operations remain forbidden scope.

## SCOPE

### Domain / D1 / API

Implement the hotel-operational Housekeeping + Maintenance surface:

- Housekeeping dirty queue and board with room status, room context and today’s departure context where available.
- Domain transitions: `DIRTY → CLEANING → AVAILABLE`; maintenance entry from `AVAILABLE`, `DIRTY` or `CLEANING` as allowed by the source state machine; `MAINTENANCE → DIRTY`; same-state no-op may be accepted; all other transitions reject.
- Maintenance case open: one open case per room, priority `LOW|MEDIUM|HIGH|URGENT`, trimmed reason length 6–250, trimmed assignee length 2–100, actor and timestamp ownership, tenant-local room relation.
- Maintenance case resolve: trimmed resolution note length 6–250, resolver and timestamp, durable `RESOLVED` state, explicit `return_status=DIRTY`, room returns to `DIRTY` atomically.
- Legacy `MAINTENANCE` room without an open case must be resolvable through an explicit synthesized/backfilled case path without inventing an unowned cross-tenant relation. The synthesized case must retain the recovery actor and provenance per `INV-LEGACY-001`.
- API paths under `/api/v1`: `GET /housekeeping/dirty`, `GET /housekeeping/board`, `POST /housekeeping/{id}/start`, `POST /housekeeping/{id}/finish`, `POST /housekeeping/{id}/maintenance`, `POST /housekeeping/{id}/dirty`.
- Backend capability authority: `housekeeping.read/write` for `admin`, `ops`, `housekeeping`; receptionist and unknown roles fail closed.
- All state/case/audit writes for one operation remain atomic inside the authorized hotel D1. No CONTROL_DB + hotel-D1 transaction is allowed.
- Conditional state updates must fail the whole business operation if the authoritative mutation affects zero rows; final-state-only triggers are not sufficient proof of `INV-ATOMIC-001`.

### UX / Browser

Adapt the source `/housekeeping` board to the current React/Vite target without redesigning its workflow:

- route/navigation reachability for `/housekeeping`;
- dirty/cleaning/available/maintenance filters and room/guest search where board data supports it;
- preserve the source queue → selected room → focused room workspace model, with summary/action/maintenance information architecture or a semantically equivalent focused workspace;
- explicit start cleaning, finish cleaning, open maintenance case and resolve-to-dirty actions;
- required validation, loading, typed error and success refresh states;
- draft reason/assignee/resolution state must be scoped/reset per selected room so data does not leak across rooms;
- read-only/forbidden behavior for receptionist and unauthorized roles;
- mobile/desktop usability at 375/390/430/768/1024, including action controls and maintenance evidence fields.

### QA / Security

Adversarially prove invalid transition rejection, duplicate open-case rejection, meaningful text validation, atomic rollback/preservation, tenant isolation, role capability denial, legacy maintenance resolution, audit traceability, board consistency and browser behavior. QA/Security evidence is separate from implementation reasoning; no self-declared Independent Critic PASS.

Concurrency coverage must include deterministic stale/duplicate attempts for cleaning start/finish and maintenance resolution with exact event-count and final-state assertions.

## SOURCE PARITY MATRIX

| Requirement | Source surface / behavior | Target surface | Acceptance | Evidence |
|---|---|---|---|---|
| Dirty queue | `HousekeepingPage`, `getDirtyRooms`, J-06 | `/housekeeping`, `GET /housekeeping/dirty` | Dirty and cleaning rooms are visible with tenant-local room context | API/D1 + browser |
| Board/context | `HousekeepingService::get_board`, `HousekeepingPage`, queue tests | `GET /housekeeping/board`, board filters/workspace | Board includes eligible room states and departure/maintenance context without cross-tenant data | API contract + browser |
| Cleaning start | `start_cleaning`, `POST /housekeeping/{id}/start` | Same API and room workspace action | Only `DIRTY → CLEANING`; stale concurrent attempt cannot succeed or audit twice | deterministic D1/API regression |
| Cleaning finish | `finish_cleaning`, `POST /housekeeping/{id}/finish` | Same API and room workspace action | Only `CLEANING → AVAILABLE`; stale concurrent attempt cannot succeed or audit twice | deterministic D1/API regression + browser |
| Maintenance open | `mark_maintenance`, `MaintenanceCaseActions` | `POST /housekeeping/{id}/maintenance`, maintenance form | Allowed source state enters `MAINTENANCE`; case is open, prioritized, owned, audited, tenant-local and unique per room | D1/API + UI validation |
| Maintenance resolve | `return_to_dirty`, `MaintenanceCaseActions` | `POST /housekeeping/{id}/dirty`, resolution form | Open/legacy case resolves atomically; stale concurrent resolution cannot succeed or audit twice; room becomes `DIRTY`; note/resolver/time retained | deterministic D1/API + browser |
| Legacy recovery | source maintenance repository recovery path | synthesized target case | recovery actor, tenant, time and provenance retained | D1 assertions |
| State machine | `RoomStatus::can_transition_to`, J-06 | D1 transition guards/API | Valid transitions only; same-state no-op policy explicit; no direct generic PATCH bypass | adversarial SQL/API + diff/search |
| Authorization | source RBAC canon | API capability map and UI handling | admin/ops/housekeeping allowed; receptionist/unknown denied | role matrix regression |
| Tenant isolation | source composite FKs/RLS obligation, J-09 | per-hotel D1 + room/case FK checks | cross-tenant room/case IDs cannot read/write/create relations | routing/API/D1 regression |
| Traceability | source audit events and case actor fields, J-06/P-17 | housekeeping events/case fields | actor subject, hotel, request ID, timestamps retained exactly once for every successful mutation | D1 assertions |
| UX workflow parity | source `HousekeepingPage` + `HousekeepingRoomWorkspace` | React `/housekeeping` | queue → selected room → focused workspace preserved; room drafts do not leak | browser |
| Responsive parity | source housekeeping workspace/queue tests, J-11 | React `/housekeeping` | lifecycle actions and maintenance forms usable at 375/390/430/768/1024 | reproducible Playwright journey |
| Scope boundary | CF-I05 increment / CF-I06 separation | target diff | no billing, payments, settlement, RBAC administration, network administration or migration/cutover | diff/scope audit |

## DATA / ATOMICITY INVARIANTS

- `maintenance_cases.room_id` is tenant-local by operational-D1 topology and foreign-key relation; no client-selected database binding.
- At most one `OPEN` case exists for a room in one hotel.
- Opening a case and moving the room to `MAINTENANCE` commit together or neither commits.
- Resolving a case and moving the room to `DIRTY` commit together or neither commits.
- Cleaning start/finish and maintenance resolution must prove that the authoritative expected-state mutation occurred inside the same write boundary before audit/event success can commit.
- A room transition must verify the expected current state in the same D1 write boundary.
- Case status, priority, reason, assignee, reporter/resolver, timestamps, return status and event trace are durable.
- No production deployment, remote D1 mutation, real-data migration, paid resource or cutover action.

## REQUIRED VALIDATION

- unit/API tests for parsing, capabilities and state/case rules;
- D1 migration application and `scripts/cf-i05-regression.sh` covering valid/invalid transitions, rollback, duplicate cases, deterministic stale/concurrent cleaning and resolve cases, tenant/role denial and traceability;
- exact event-count assertions proving `INV-AUDIT-001`;
- browser journey through the focused `/housekeeping` workflow at 375/390/430/768/1024, exercising start cleaning, finish cleaning, maintenance open and maintenance resolve, with validation/error/success states;
- browser proof that per-room form drafts reset/scope correctly;
- `npm run check`, inherited CF-I03/CF-I04 regressions where required, `npm run web:build`, `npm run types:check`, `npm run wrangler:dry-run`, `git diff --check`;
- self-critic checklist against every row of the parity matrix and exact scope diff;
- mandatory `.orchestration/PRECRITIC-GATE.md` execution;
- mandatory `.orchestration/evidence/CF-I05-INVARIANTS.md` with every applicable registry invariant `PASS` or justified `N/A` before artifact publication.

## RESPONSIBILITY / REVIEW BOUNDARY

This runtime uses `RUNTIME_CAPABILITY_FALLBACK`; no separate Specialist contexts are exposed. Domain/Engineering, UX and QA/Security responsibilities remain separated in the plan, implementation passes, test harness and evidence. Codex may self-critic for defect discovery but cannot self-approve substantive PASS. The exact final artifact requires an external Independent Critic.

## FORBIDDEN ACTIONS

- CF-I06 billing, invoices, payments, settlement or cash closure.
- Users/RBAC administration, hotels/network administration, analytics/reports or product redesign.
- Generic room-status PATCH bypass of housekeeping domain transitions.
- Cross-database transaction, production/remote mutation, real data, paid Cloudflare activation or cutover.
- Publishing intermediate substantive artifacts or asking Human routine approval.
- Publishing the next artifact while any applicable learned invariant is `FAIL` or `UNPROVEN`.

## DONE WHEN

The single artifact contains contract-complete D1/API/UX implementation, adversarial QA, responsive/browser evidence, full regression, the completed invariant evidence file, mandatory Pre-Critic Gate evidence, self-critic checklist and updated canonical state. Codex then publishes one immutable artifact with `external_review.required=true` and stops. CF-I06 is not started.
