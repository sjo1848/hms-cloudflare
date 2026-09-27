# Task Contract — F0.2 shared domain/event invariants

Task ID: `HMS-F0-02-SHARED-ROOM-INVARIANTS-001`  
Parent: `HMS-FOUNDATION-0-START-001`  
Depends on: F0.1 `HMS-F0-01-ROOM-DIMENSIONS-001`; migration 0022; canonical dimension derivation.  
Scope: converge existing Check-in, Checkout, Housekeeping and Maintenance commands on independent room dimensions while retaining bounded legacy compatibility. Does not start F0.3 cutover or F0.4 reassignment.

## Requirement → expected surfaces → acceptance → evidence

**Binding semantics:** Reconciliation 007 Amendment A and Final Disposition 008 sections 3–5. Occupancy values are `VACANT|OCCUPIED`; Housekeeping `READY|DIRTY|CLEANING`; Maintenance Impact derives from open cases with any BLOCKING case dominant; Service `IN_SERVICE|OUT_OF_ORDER`; readiness is derived. Unknown/conflicting evidence fails closed.

**Current surfaces:** `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/modules/lifecycle/domain.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/routes/housekeeping.ts`, `apps/api/src/routes/front-desk.ts`, `apps/api/src/routes/inventory.ts`; migrations `0007_lifecycle_atomic_guards.sql`, `0009_housekeeping_maintenance.sql`, `0013_noshow_reporting_parity.sql`, `0020_maintenance_impact.sql`, `0021_reassignment_remaining_nights.sql`; `apps/api/src/modules/room-state/domain.ts` and `read-model.ts`.

**PROPOSED NEW SURFACE:** additive forward migration recreating only affected guards/triggers; focused executing-D1 shared-transition regression file if no current test owns the matrix.

### Acceptance matrix

| Command | Required transition | Must remain unchanged |
|---|---|---|
| Check-in | require authoritative assignment, VACANT, Housekeeping READY, IN_SERVICE, no open BLOCKING; occupancy becomes derived OCCUPIED | Housekeeping, Maintenance Impact, Service |
| Checkout | booking CHECKED_OUT; occupancy derives VACANT; Housekeeping becomes DIRTY | Maintenance cases/impact and Service State |
| Start cleaning | Housekeeping DIRTY→CLEANING only | Occupancy, Maintenance, Service |
| Finish cleaning | Housekeeping CLEANING→READY only; readiness remains NOT_READY under BLOCKING | Occupancy, Maintenance, Service |
| Open/escalate/resolve maintenance | change only case/impact; preserve Occupancy, Housekeeping, Service; resolution does not default HK to DIRTY | all other dimensions |

No future booking is cancelled/reassigned. No new ETA or maintenance gate on a particular cleaning task is invented. Current capability semantics and tenant routing remain authoritative. Existing `rooms.status` may be maintained as a compatibility projection only; it cannot override canonical fields. Any required legacy trigger must verify the real dimension transition and exact current case/booking identity.

## Mutation/concurrency and events

- Every command remains one business operation: conditional exact-winner primary mutation, dependent dimension/case/inventory writes and actor/hotel/request audit all commit atomically or roll back.
- Zero-row primary transitions cannot emit success/event. Cases correlate by exact ID to prevent maintenance ABA; repeated resolving of stale case K1 cannot affect replacement K2.
- Add an additive per-room monotonic state version (or demonstrate an equivalent transactionally enforced token) so stale room snapshots fail even if visible state leaves and returns to the same enum. Dimension-changing writes advance it exactly once; audit details/guards correlate to the winning version.
- F0.2 version coverage is limited to the commands listed in this contract. Existing reassignment is explicitly outside F0.2; F0.4 must update canonical occupancy/room dimensions and advance the same room version before any repository-wide/global ABA-safety claim is made. No F0.2 evidence may describe the version as covering reassignment.
- Occupancy derives from CHECKED_IN booking assignment; multiple/conflicting assignments are unresolved and fail closed.
- Rejected readiness, stale case, stale room/dimension, and unauthorized command leave all dimensions, booking/case rows and event counts exactly unchanged.
- A legacy `MAINTENANCE` room whose open case is only `NON_BLOCKING` remains unresolved; resolving that case cannot clear the legacy protective state. Explicit legacy recovery is permitted only through the existing audited `/dirty` recovery path when no open case exists.
- Event vocabulary and actor/time/request fields remain compatible. Events represent only actual transitions; historical events are not rewritten or fabricated.

## Migration / non-goals / recovery

Forward-only trigger/schema migration; no historical edits, destructive column rebuild or data backfill in this task. F0.3 owns synthetic cutover mapping. Do not implement reassignment interval/pricing, settlement, booking/account, charge idempotency, capabilities refresh, frontend UI or Blocks A–H. On failure use forward correction; no real customer D1 is attached to tests.

## Invariant applicability

| Invariant | Applicability and required evidence |
|---|---|
| INV-ATOMIC-001 | APPLIES — primary transition and all dependent writes/events rollback on zero-row/stale; deterministic ABA and K1→K2 replacement tests. |
| INV-AUDIT-001 | APPLIES — exactly one truthful event on winning command, zero on rejection/stale. |
| INV-DOMAIN-001 | APPLIES — commands only; static/API proof no generic state bypass. |
| INV-TENANT-001 | APPLIES — allowed tenant and cross-tenant/unknown binding denial; zero foreign mutations/events. |
| INV-RBAC-001 | APPLIES — authorized and denied command roles with authenticated membership. |
| INV-PARITY-001 | APPLIES — 007/008 transition matrix positive/negative tests. |
| INV-ENUM-001 | APPLIES — stored/API enums and target literals exercise canonical predicates. |
| INV-UX-001 | N/A — no workflow/UI changes. |
| INV-ORDER-001 | N/A — no queue ranking or next-item changes. |
| INV-RESP-001 | N/A — no responsive UI surface. |
| INV-EVID-001 | APPLIES — every claim linked to executing test/static proof. |
| INV-LEGACY-001 | APPLIES — no anonymous event/case synthesis; assert provenance if recovery is added. |
| INV-MONEY-001 | N/A — no billing/account amount mutation. |
| INV-STATE-001 | APPLIES at publication — non-circular A/B with exact remote-resolvable artifact. |
| INV-CF-I07-001 | N/A — no admin/network/audit route. |
| INV-CF-I07-002 | N/A — no admin mutation. |
| INV-CF-I07-003 | N/A — no role downgrade. |
| INV-CF-I07-004 | N/A unless regression runner is modified; if modified, prove owned process cleanup. |
| INV-CF-I08-001 | N/A — no reporting arithmetic. |
| INV-CF-I08-002 | N/A — no network analytics. |
| INV-CF-I08-003 | N/A — no report query. |
| INV-CF-I08-004 | N/A — no booking enum expansion. |
| INV-CF-I08-005 | N/A — no clock-sensitive work. |
| INV-SCOPE-001 | APPLIES — diff audit proves F0.2 only; no reassignment or later F0 node. |

## Gate

Evidence: executing-D1 tests for the full transition matrix over the relevant forward migration chain; stale/zero-row and K1→resolved→K2 ABA; exact event counts and actor/hotel/request; existing API/UI compatibility; backend capability denial and tenant-routed mutation with foreign object ID denial; migration guard proof; full `npm run check`, types, relevant Wrangler dry-run and diff/scope audit. This is a material domain/concurrency gate and requires an Independent Critic separate from implementer and internal reviewer before any F0.2 artifact is declared accepted. No live data, PR, merge or promotion.
