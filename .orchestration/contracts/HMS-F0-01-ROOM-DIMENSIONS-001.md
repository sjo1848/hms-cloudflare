# Task Contract — F0.1 Authoritative room dimensions

Task ID: `HMS-F0-01-ROOM-DIMENSIONS-001`  
Parent: `HMS-FOUNDATION-0-START-001`  
Authority: Foundation 0 Authorization Drive `18JGIQxyl8Bh6_w7H3eW1qdPL7jfUsdSLk43aE-G-90A`; Blueprint 001, Reconciliation 007, Final Disposition 008; roadmap A2/B2.  
Dependency: frozen semantics only. This contract does not authorize F0.2 or later work.

## Requirement → expected surfaces → acceptance → evidence

**Requirement:** represent Occupancy, Housekeeping, Maintenance Impact and Service State independently; derive readiness and date-range sellability from the frozen rules. `rooms.status` is legacy compatibility, not the authoritative multiplexed state.

**Inspected current surfaces:** `apps/api/schema/hotel-migrations/0001_foundation.sql`, `0009_housekeeping_maintenance.sql`, `0020_maintenance_impact.sql`; `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`; `apps/api/src/modules/inventory/availability.ts`; `apps/api/src/routes/inventory.ts`, `routes/housekeeping.ts`, `routes/lifecycle.ts`, `routes/bookings.ts`; `apps/api/src/room-availability.ts`; `apps/web/src/features/rooms/RoomsPage.tsx`, `features/housekeeping/HousekeepingPage.tsx`, `features/reception/ReceptionPage.tsx`.

**PROPOSED NEW SURFACE:** additive forward migration for dimension storage; only supporting shared types/derivation/tests if needed. Exact storage names must be contract-derived and preserve the frozen enum meanings.

**Acceptance:**

1. Additive schema stores distinct room dimensions without destroying legacy `rooms.status` or history.
2. Inventory room read responses expose separate occupancy, housekeeping, maintenance impact, service state and reasoned readiness. Existing `status` remains explicitly legacy compatibility output in this increment.
3. Define canonical predicates for readiness and date-range sellability from frozen docs; unknown or contradictory combinations fail closed. Until F0.3 establishes evidence-backed state mapping and the later range predicate is implemented, date-range sellability is explicitly `UNRESOLVED`, not inferred from legacy `status`.
4. Backfill/rehearsal mapping never weakens currently protective state. In particular, OCCUPIED can coexist with maintenance; BLOCKING does not overwrite occupancy or housekeeping; NON_BLOCKING alone does not block sellability; check-in requires VACANT + READY + IN_SERVICE and no open BLOCKING case; checkout yields VACANT + DIRTY without rewriting maintenance/service.
5. Existing consumers remain compatible during this increment; do not opportunistically migrate unrelated command flows. If a schema trigger makes a safe additive representation impossible, stop and document the concrete contradiction before inventing new semantics.
6. Executing-D1 tests cover enum validity, compatible/invalid combinations, fail-closed unknowns, existing-record projection, tenant scoping and unchanged legacy behavior. No real tenant data.

## Non-goals

No real-data cutover, no room adjudication, no reassignment/pricing/lifecycle redesign, no Blocks A–H, no destructive migration, no UI redesign. Do not treat successful migration execution as proof of correct mapping.

## Concurrency, audit, recovery

F0.1 introduces no new business command unless strictly necessary to establish the dimension contract. Any write path added must use conditional exact-winner semantics, atomic audit/event, and hotel-scoped identity. Schema rollout is additive and readers tolerate old rows. Recovery is forward-only; ambiguous source state stays unresolved and unavailable, never silently READY.

## Invariant map (registry is exhaustive)

| Invariant | Applicability | Required proof |
|---|---|---|
| INV-ATOMIC-001 | APPLIES if any write/transition is introduced | zero-row stale test; exact state and event rollback |
| INV-AUDIT-001 | APPLIES if transition emits event | success exactly once; rejected/stale zero |
| INV-DOMAIN-001 | APPLIES | static route/write-path audit; no generic status bypass |
| INV-TENANT-001 | APPLIES | authorized hotel fixture and cross-tenant denial/no mutation |
| INV-RBAC-001 | APPLIES only if a protected API is changed; otherwise N/A | if applicable, allowed/denied backend capability tests |
| INV-PARITY-001 | APPLIES | frozen room predicates mapped and positive/negative tests |
| INV-ENUM-001 | APPLIES | semantic mapping across D1/API; target literal fixtures |
| INV-UX-001 | N/A | no user journey/UI behavior changed in this F0.1 increment |
| INV-ORDER-001 | N/A | no queue ranking/next-item behavior changed |
| INV-RESP-001 | N/A | no responsive surface changed |
| INV-EVID-001 | APPLIES | every claim tied to named executable proof |
| INV-LEGACY-001 | APPLIES if legacy state/cases are synthesized; otherwise N/A | provenance assertions or explicit no-synthesis proof |
| INV-MONEY-001 | N/A | no monetary state or calculation changed |
| INV-STATE-001 | APPLIES at substantive publication | non-circular Artifact A + orchestration-only Boundary B |
| INV-CF-I07-001 | N/A | no protected admin/network/audit route |
| INV-CF-I07-002 | N/A | no admin mutation |
| INV-CF-I07-003 | N/A | no role downgrade |
| INV-CF-I07-004 | N/A | no CI regression runner introduced/changed unless scope expands |
| INV-CF-I08-001 | N/A | no reporting arithmetic |
| INV-CF-I08-002 | N/A | no network analytics |
| INV-CF-I08-003 | N/A | no reports/date query |
| INV-CF-I08-004 | N/A | no expanded booking states |

## Gate

Development evidence: migration schema assertions + executing D1 contract tests + affected route/domain regression + diff/route audit. Pre-Critic invariant evidence is required. This task is complete only when evidence proves dimensional semantics, not merely build success. Fresh Independent Critic is required at material Foundation gates as directed by the approved program and at F0 aggregate. No real-data action is authorized.
