# HMS-F0-01-ROOM-DIMENSIONS-001 — Invariant Evidence

Artifact candidate: implementation currently in progress on `impl/hms-foundation-0`; no standalone immutable artifact published.  
Task Contract: `.orchestration/contracts/HMS-F0-01-ROOM-DIMENSIONS-001.md`  
Authority: frozen Blueprint 001, Reconciliation 007 Amendment A and Final Disposition 008; Foundation 0 Authorization RG1–RG7.  
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

F0.1 changed additive room storage and read projection only. No business command, domain-state mutation, audit event, real operational D1 migration, UI implementation or customer data action occurred. Migration verification executed only in disposable Miniflare D1 synthetic databases.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No business write/command introduced; route additions are SELECT-only. | Migration alters schema only in disposable test D1. |
| INV-AUDIT-001 | N/A | N/A | No event/audit mutation introduced. | — |
| INV-DOMAIN-001 | APPLIES | PASS | `apps/api/src/routes/inventory.ts` exposes read-only canonical projection and retains existing commands; `room-state-route.executing-d1.test.ts` exercises `/api/v1/rooms`; diff audit finds no dimension PATCH or generic state write. | — |
| INV-TENANT-001 | APPLIES | PASS | `room-state-route.executing-d1.test.ts`: two operational D1s return only selected hotel's room; unknown hotel returns 403. Runtime route obtains the DB only from `context.get('operationalDatabase')`; no client DB selector added. | Read path only. |
| INV-RBAC-001 | APPLIES | PASS | Same executing-D1 route test proves `receptionist` allowed and `housekeeping` denied 403 on `rooms.read`. | No capability map changed. |
| INV-PARITY-001 | APPLIES | PASS | Exact 007 enum/predicate mapping appears in `domain.ts`; tests cover check-in readiness, OCCUPIED + BLOCKING coexistence, preservation of Housekeeping, and negative readiness. | Frozen product behavior not broadened. |
| INV-ENUM-001 | APPLIES | PASS | Canonical stored values are checked by `0022_room_state_dimensions.sql`; `domain.test.ts` covers known enum semantics and unsupported literals fail closed. Legacy `rooms.status` remains separate and unchanged. | — |
| INV-UX-001 | N/A | N/A | No user-visible workflow/UI changed; API read contract only. | — |
| INV-ORDER-001 | N/A | N/A | No queue ranking or next-item behavior changed. | — |
| INV-RESP-001 | N/A | N/A | No responsive UI or interaction changed. | — |
| INV-EVID-001 | APPLIES | PASS | Claims below map to exact executing-D1/unit commands and outputs; static `git diff --check`; Worker/API+Web Wrangler dry-run. | No browser or live-migration claim. |
| INV-LEGACY-001 | APPLIES | PASS | `room-dimensions.executing-d1.test.ts`: existing AVAILABLE and MAINTENANCE records retain scalar status while new dimensions remain NULL; legacy MAINTENANCE without current BLOCKING evidence projects unresolved even if a NON_BLOCKING case and READY/IN_SERVICE values exist; no synthetic history/case generated. | Explicitly avoids reconstructing hidden Housekeeping state. |
| INV-MONEY-001 | N/A | N/A | No financial value or operation changed. | — |
| INV-STATE-001 | N/A | N/A | F0.1 is an internal increment in the active Foundation task; no immutable publication boundary is claimed here. Aggregate Foundation Artifact A/B publication remains mandatory at F0.12. | Must be PASS at the aggregate publication boundary. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit route. | — |
| INV-CF-I07-002 | N/A | N/A | No admin mutation. | — |
| INV-CF-I07-003 | N/A | N/A | No role downgrade. | — |
| INV-CF-I07-004 | N/A | N/A | No regression runner or process-lifecycle script changed. | Existing Vitest runners own Miniflare disposal via `afterEach`. |
| INV-CF-I08-001 | N/A | N/A | No reporting/revenue arithmetic. | — |
| INV-CF-I08-002 | N/A | N/A | No multi-hotel analytics. | — |
| INV-CF-I08-003 | N/A | N/A | No report date/state query. | — |
| INV-CF-I08-004 | N/A | N/A | No booking state enum expanded. | — |
| INV-CF-I08-005 | N/A | N/A | No clock-sensitive behavior changed. | — |
| INV-SCOPE-001 | APPLIES | PASS | Changed files are confined to the F0.1 room-state contract, additive migration, read projection, focused D1/domain tests, and orchestration/evidence. No Blocks A–H or unrelated product scope. | Scope audit at aggregate gate will include all F0 work. |

## Mandatory mutation inventory

No state-changing business operation was introduced.

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| N/A | No product mutation | N/A | No business event emitted | Executing-D1 API test is read-only |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Forward migration adds constrained nullable fields and preserves existing data | `npx vitest run apps/api/src/modules/room-state/room-dimensions.executing-d1.test.ts --maxWorkers=2`; checks old scalar values and NULL dimensions, invalid enums rejected | executing-D1 synthetic |
| Operational dimensions and readiness are separate and fail closed | `domain.test.ts`; `room-dimensions.executing-d1.test.ts`; exact reason assertions | unit + executing-D1 synthetic |
| API read is hotel-scoped and capability-gated | `room-state-route.executing-d1.test.ts`; two hotel DBs, allowed and denied roles, unknown hotel denial | integrated API + executing-D1 synthetic |
| Regression suite passes | `npm run check`: 26 files / 97 tests PASS | local suite |
| Types pass | `npm run types:check`: API and web Wrangler types current | local validation |
| Worker configs parse/package | `npm run wrangler:dry-run`: API and Web dry-runs exit successfully | local dry-run; no deploy |
| Patch formatting passes | `git diff --check` exit 0 | static |
| No real tenant data was changed | Test fixtures instantiate disposable Miniflare D1; no wrangler migration/apply, production bindings, cutover or pricing bootstrap command executed | execution-scope evidence |

## Publication decision

- [x] No applicable F0.1 invariant is FAIL or UNPROVEN.
- [x] F0.1 contract checks and focused regression passed.
- [x] Scope audit passed for F0.1.
- [ ] Foundation aggregate canonical state points to final exact Artifact A (F0.12).
- [ ] Independent Critic / aggregate publication boundary; no self-approval claimed.
