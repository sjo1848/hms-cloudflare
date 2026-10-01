# HMS Block E — Housekeeping + Maintenance — Task Contract 001

Status: **FROZEN BEFORE PRODUCT CODE**  
Authorized by the current Controller instruction from exact base `3f06c7b52b8c5f57754e705071b7cee6a5668d05`. Dedicated branch/worktree: `impl/hms-block-e-housekeeping-maintenance`, `/home/sjo1848/dev/hms-elite-cloudflare/hms-block-e-housekeeping-maintenance`. Blocks F–H, promotion, real data and environments remain unauthorized.

## Objective and approved sources

Deliver the roadmap's Housekeeping + Maintenance operational task queue and first-class case: collective discovery; deterministic priority; impact, lifecycle and history; affected confirmed-booking risk; and state-preserving resolution. Preserve the existing Housekeeping task progression and exact maintenance domain semantics. The workspace may evolve only within the existing Housekeeping route and existing API command contracts. Source HMS remains read-only reference.

Binding sources: `docs/implementation-roadmap/HMS-IMPLEMENTATION-ROADMAP-MASTER-V1.md` (Block E and room-state rules), `docs/implementation-roadmap/HMS-BLUEPRINT-BLOCK-TRACEABILITY-V1.md` (row “Housekeeping priority/task progression and maintenance impact/history”), `docs/implementation-roadmap/HMS-BLOCK-CONTRACTS-A-H-V1.md` (E), `docs/cf-i05-housekeeping-maintenance-parity.md`, `.orchestration/contracts/WAVE-1.1A-MAINTENANCE-IMPACT.md`, `.orchestration/contracts/HMS-F0-05-REPAIR-HOUSEKEEPING-AUDIT-RACE-001.md`, `.orchestration/INVARIANTS.md`, and `.orchestration/PRECRITIC-GATE.md`.

Dependencies F0.12, A, F0.1–F0.3 room-state contracts and F0.10 capabilities are present in this base. Block B is an E integration checkpoint, not a hard start dependency. Integrate no Reception behavior in E.

## Frozen domain invariants

- Room truth remains multidimensional: Occupancy `VACANT | OCCUPIED`; Housekeeping `READY | DIRTY | CLEANING`; Maintenance Impact `NONE | NON_BLOCKING | BLOCKING`; Service `IN_SERVICE | OUT_OF_ORDER`. Readiness is derived. Sellability is interval-derived and separate from physical state.
- Maintenance never overwrites Housekeeping. Existing `MAINTENANCE` compatibility spelling is not a canonical dimension/source of truth.
- Existing approved commands only: `DIRTY → CLEANING`; `CLEANING → READY`; open/escalate/resolve maintenance; legacy maintenance recovery. Preserve current eligibility, authorization, validation, audit, atomicity, and typed conflict semantics exactly.
- One open case per room; exact case/room/version guards; audit event iff the winning business mutation commits; stale K1 cannot mutate replacement K2.
- Maintenance impact values and consequences follow existing V11/008 contract. Occupied rooms remain occupied when impact changes; advisory `NON_BLOCKING` does not independently block readiness/sale; `BLOCKING` follows the existing readiness/sellability predicates. Resolve preserves the dimensions required by current contracts; only the approved legacy/maintenance-to-dirty command returns `DIRTY`.
- Affected confirmed future bookings may be labeled at risk when an open `BLOCKING` case affects their room. Never cancel, reassign, move, reprice or mutate a booking automatically.
- Keep source ordering semantics and semantic booking status normalization: eligible checked-in departure risk before ordinary dirty; high-priority open case ahead of ordinary work; CONFIRMED is not CHECKED_IN; orphan departure stays visible but has no invalid room action.

## Authorized implementation boundary

Improve only Housekeeping workspace/read model and its existing API route/tests/evidence as required to provide collective task/case discovery, stable deterministic queue and next-task semantics, explicit State/Attention/Impact, case details and history, affected-booking-risk context, and state-preserving actionable workflows. An additive field in the existing tenant-scoped `GET /housekeeping/board` response is permitted for history and affected confirmed-booking risk because both are explicit Block E read requirements; reuse existing `housekeeping_events`, `maintenance_cases`, `bookings`, room state and existing capabilities. Do not add a route, schema/migration, enum, lifecycle, capability, role map, transition, or data-retention policy. Bound/limit returned history and booking context; keep all queries within selected operational D1 and bind parameters. If requirements cannot be met using existing stored facts and approved predicates, stop `ROADMAP_BLOCKER` rather than infer policy.

UI remains within `apps/web/src/features/housekeeping/` plus exact i18n catalogs/generated types/tests. API changes remain within `apps/api/src/routes/housekeeping.ts`, existing API test files or narrowly named Housekeeping executing-D1 tests. Task-local scripts/evidence may be added. No edit to Rooms, Reception, Booking/Stay, lifecycle, billing, shared capabilities, schema/migrations or app navigation absent a demonstrated strictly necessary approved-contract requirement; reassess as `ROADMAP_BLOCKER` if a boundary crossing is needed.

## Capability/API/data contract

Server-owned `housekeeping.read`, `housekeeping.write`, `maintenance.read`, `maintenance.report`, `maintenance.resolve` remain distinct and enforced by the canonical helper. Preserve exact existing role sets (including receptionist read/report but no resolve; housekeeping read/write/report/resolve; no tenant maintenance capabilities for `saas_admin`) and tenant routing. UI hides unsupported controls but never acts as authorization. No frontend permission truth.

Existing endpoints are the only mutation authority: `GET /housekeeping/dirty`, `GET /housekeeping/board`, `GET /housekeeping/:id/maintenance`, `POST /housekeeping/:id/start`, `/finish`, `/maintenance`, `/maintenance/:case_id/escalate`, `/maintenance/:case_id/resolve`, and legacy `/dirty`. Preserve `/api/v1`, payload/error compatibility and D1 transaction boundaries. No new endpoint/schema.

## Exact current surface inventory

Frozen in `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-INVENTORY.md`. Current primary UI: `HousekeepingPage.tsx`, `useHousekeepingWorkspace.ts`, `model.ts`, `housekeeping-api.ts`, `housekeeping-operational.css`; shared shell supplies route/capability context and i18n. Current API owner: `apps/api/src/routes/housekeeping.ts`; canonical capabilities: `apps/api/src/auth/capabilities.ts`. Existing durable facts: `rooms`, `maintenance_cases`, `housekeeping_events`, `bookings` under existing hotel migrations 0009/0020 and room-state migrations. No dedicated maintenance route/module or schema is assumed.

## Acceptance / evidence

Frozen in `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-EVIDENCE-MATRIX.md`. Includes source parity; deterministic queue order and next item; all state dimensions/readiness; history/event correlation; booking-risk predicates; each action and invalid transition; duplicate/stale/concurrent/ABA/rollback; tenant/RBAC with zero side effects; error/retry/refresh and stale UI response; browser workflow at WIDE/COMPACT/NARROW, reduced height, landscape, keyboard/focus, deep link/reload/Back/Forward; no Block B regression claim beyond relevant inherited entry checks.

Local synthetic Worker + executing D1 is required for integration claims. Unit/API/D1 assertions prove data/domain behavior; browser asserts visible behavior and invokes real local API; screenshots are diagnostic only. Required quality checks include relevant Housekeeping/API tests, existing CF-I05 API and browser regressions, TypeScript/generated types, production build, architecture/i18n/bundle gates, relevant D1 query plans, Wrangler dry-run (no deployment), local Worker + migrated synthetic D1 browser, route uniqueness, scope/diff and process cleanup. Budget ceilings remain JS raw 330000, gzip 100000; CSS raw 55000, gzip 15000. Baseline JS 329618 raw / 93456 gzip; CSS 54297 raw / 10138 gzip; aggregate raw 383915. No ceiling increase. Record baseline → result → delta bytes → delta % for raw, gzip, and initial/entry payload where measurable. Optimize within scope first; if any ceiling still fails, stop `BUNDLE_BUDGET_GATE_REQUIRED`.

## Invariants and Pre-Critic

All 24 registry invariants are classified before code in the companion invariant map. Applicable invariants must pass with named executable proof. The Pre-Critic admission record is `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-PRECRITIC.md`; it is a pre-code scope/admission check, not product evidence or Independent Critic PASS. Final self-adversarial QA and final Pre-Critic must be complete before Artifact A. After Artifact A only evidence/orchestration corrections are allowed until Boundary B. A separate read-only Independent Critic reviews exact A+B; after any substantive REWORK publish a replacement A and fresh B/review. Reconcile STATE/STATUS after verdict; then publish only this branch and await Controller review. No self-approval.

## Non-goals / stop conditions

No Housekeeping/Maintenance new domain semantics, backend contract, schema, capabilities, role policy, automatic guest/booking/room mutation, No-show behavior, billing/finance, Rooms or Reception redesign, Blocks F–H, real data, staging, PR, merge, main, deploy or production. Stop only for `ROADMAP_BLOCKER`, new product policy, material architecture change, unapproved domain contract, real data/promotion, or `BUNDLE_BUDGET_GATE_REQUIRED`. Routine bugs, tests, evidence, metadata, Critic findings and authorized branch publication are autonomous work.
