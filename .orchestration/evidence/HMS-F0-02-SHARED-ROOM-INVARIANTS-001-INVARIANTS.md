# HMS-F0-02-SHARED-ROOM-INVARIANTS-001 — Invariant Evidence

Artifact candidate: local implementation branch `impl/hms-foundation-0`; exact immutable A/B publication is pending this evidence freeze.  
Task Contract: `.orchestration/contracts/HMS-F0-02-SHARED-ROOM-INVARIANTS-001.md`  
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`  
Authority: Blueprint 001, Reconciliation 007 Amendment A, Final Disposition 008; Foundation 0 authorization RG1–RG7.

F0.2 updates the existing Check-in, Checkout, Housekeeping, and Maintenance command surfaces plus forward migration `0023`. Tests use disposable Miniflare D1 or isolated local Wrangler persistence populated only with synthetic fixtures. F0.2 room-version guarantees cover only commands named in its contract; reassignment is expressly deferred to F0.4. No real operational D1 was connected or mutated.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `shared-room-commands.executing-d1.test.ts`, `check-in-concurrency.executing-d1.test.ts`; guarded transition/version and event-trigger rollback; concurrent check-in and HK start/finish/resolve have one winner and one event; K1→K2 stale resolution and same-visible-state ABA leave exact rows/events unchanged. | F0.2 commands only; reassignment remains an explicit F0.4 dependency. |
| INV-AUDIT-001 | APPLIES | PASS | Same executing-D1 tests assert one event on success, no event on stale/unauthorized/rollback; event details bind before/after dimensions and exact version. CF-I05 synthetic runner reasserts transition event counts and rollback. | |
| INV-DOMAIN-001 | APPLIES | PASS | Changed surfaces expose existing domain commands only; tests call check-in, checkout, HK and maintenance routes/repositories; no generic room-state mutation endpoint introduced. `git diff` scope audit limited to those command/read-model surfaces and their tests. | |
| INV-TENANT-001 | APPLIES | PASS | `room-state-route.executing-d1.test.ts` uses two operational D1s and the actual application routing: selected hotel returns only its rows; a hotel-A member supplying hotel-B object context is denied and the other D1 has zero mutation/event; unknown hotel/binding fails closed. | |
| INV-RBAC-001 | APPLIES | PASS | `room-state-route.executing-d1.test.ts` and `shared-room-commands.executing-d1.test.ts` establish an authenticated active member/selected tenant, prove allowed housekeeping write, and prove receptionist cannot resolve maintenance (403, unchanged case/dimensions/events). CF-I05 independently covers denied list/start/resolve. | |
| INV-PARITY-001 | APPLIES | PASS | Executing-D1 transition assertions implement the 007/008 matrix: check-in preserves HK/maintenance/service; checkout sets HK DIRTY and preserves maintenance/service; cleaning mutates only HK; maintenance open/escalate/resolve mutates case/impact only; NON_BLOCKING advisory remains nonblocking; BLOCKING on OCCUPIED preserves occupancy; resolution does not invent DIRTY. | |
| INV-ENUM-001 | APPLIES | PASS | `0023_room_state_command_guards.sql` and executing-D1 matrix assert semantic state values and compatible legacy projection; existing `domain.test.ts`/F0.1 D1 tests reject unsupported dimension values/fail closed. | |
| INV-UX-001 | N/A | N/A | No product UI or journey changed; API and existing command behavior only. | |
| INV-ORDER-001 | N/A | N/A | No queue ordering, priority, or next-item behavior changed. | |
| INV-RESP-001 | N/A | N/A | No responsive surface changed. | |
| INV-EVID-001 | APPLIES | PASS | Fresh `npm run check` (27 files/98 tests), `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, `bash -n scripts/cf-i05-regression.sh`, and CF-I05 exit 0 are listed in the Pre-Critic record; claims are linked to executable assertions. | No browser claim; F0.2 has no UI change. |
| INV-LEGACY-001 | APPLIES | PASS | Shared-room executing-D1 fixture preserves `MAINTENANCE` + only open NON_BLOCKING as unresolved; attempted resolve is 409 with exact zero drift/event. Explicit no-open-case `/dirty` legacy recovery creates and resolves a current, attributed case atomically; CF-I05 asserts same actor, hotel, request, reason, timestamp, case/event identity and `legacy_recovery=true`. | No anonymous backfill case/event or fabricated historical record is created; current attributed command evidence is explicitly recorded. |
| INV-MONEY-001 | N/A | N/A | No financial value, invoice, payment, or pricing mutation changed. | |
| INV-STATE-001 | APPLIES | PASS | Publication is planned as non-circular implementation Artifact A followed by orchestration/evidence-only Boundary B that records exact A; no self-SHA or self-approval is claimed. | Exact hashes are entered after commits; external review remains required. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit authorization surface changed. | |
| INV-CF-I07-002 | N/A | N/A | No admin mutation changed. | |
| INV-CF-I07-003 | N/A | N/A | No role downgrade operation changed. | |
| INV-CF-I07-004 | APPLIES | PASS | `scripts/cf-i05-regression.sh` now uses a fresh owned Wrangler process group and isolated temp persistence, emits terminal PASS only after `stop_worker`; cleanup checks for live processes and tolerates an already-absent process group. `bash -n` PASS; complete `bash scripts/cf-i05-regression.sh` exit 0 with terminal PASS. | During validation, `ps` returning 1 under `pipefail` prematurely aborted the old check; repaired and rerun. |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic changed. | |
| INV-CF-I08-002 | N/A | N/A | No network analytics changed. | |
| INV-CF-I08-003 | N/A | N/A | No report query/date semantics changed. | |
| INV-CF-I08-004 | N/A | N/A | No booking state enum changed. | |
| INV-CF-I08-005 | N/A | N/A | No report clock/default date or continuity behavior changed. | |
| INV-SCOPE-001 | APPLIES | PASS | Scope audit: F0.2 command consistency/version guards, tests, and CF-I05 runner repair only; no reassignment (F0.4), finance, UI, booking workflow, Blocks A–H, real-data action, PR, merge, staging, main, deploy, or production. | |

## Mutation inventory

| Operation | Authoritative conditional mutation | Zero-row/stale behavior | Audit/event behavior | Deterministic evidence |
|---|---|---|---|---|
| Check-in | booking/status + room occupancy/version guarded in the D1 operation | conflict; booking/room/inventory/event unchanged | one CHECK_IN event correlated with exact resulting room version | `check-in-concurrency.executing-d1.test.ts` |
| Checkout | exact checked-in booking, room version, current dimension/case snapshot | conflict; no partial booking/room/event | one CHECK_OUT event; dimensions preserved except HK DIRTY | `check-in-concurrency.executing-d1.test.ts`; `shared-room-commands.executing-d1.test.ts` |
| HK start/finish | expected HK state + exact room version and unchanged non-HK dimensions | conflict; no second transition/event | exact CLEANING_START/FINISH details | shared-room tests; CF-I05 race |
| Maintenance open/escalate/resolve and explicit dirty recovery | current room version + case identity/open-case set and dimension constraints | conflict; K1 cannot mutate replacement K2; no partial write/event | event binds case, actor, hotel, request and dimensions | shared-room tests; route integration; CF-I05 |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Shared transitions preserve independent room dimensions and current case identity | Shared-room executing-D1 migration/API assertions | Synthetic executing D1 |
| Check-in race yields one winner/event and NON_BLOCKING is preserved | Lifecycle executing-D1 test | Synthetic executing D1 |
| Tenant routing and mutation capability boundary are real application behavior | Room-state route test with two D1 bindings and active identity/membership | Synthetic integrated API/D1 |
| Existing CF-I05 behavior remains intact | `bash scripts/cf-i05-regression.sh`, exit 0 and terminal PASS; runner owns cleanup | Isolated local Wrangler + synthetic D1/API |
| Current suite/types/build/architecture/budgets/query plans/dry-runs pass | Exact fresh commands in Pre-Critic record | Local checks; Wrangler dry-run only |
| No real data changed | Miniflare fixtures and isolated `/tmp` Wrangler persistence; no live DB credentials, migration target, cutover or pricing bootstrap invoked | Execution boundary evidence |

## Publication decision

- [x] Every registry invariant is explicitly classified; no applicable invariant is FAIL/UNPROVEN.
- [x] F0.2 executable contract and fresh validation pass.
- [x] Scope audit passes; the reassignment/version limitation is disclosed.
- [ ] Exact Artifact A / Boundary B hashes are entered after local publication commits.
- [ ] Independent Critic verdict is pending; this file is evidence, not a self-approval.
