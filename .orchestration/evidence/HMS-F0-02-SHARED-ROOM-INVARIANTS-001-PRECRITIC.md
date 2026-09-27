# HMS-F0-02-SHARED-ROOM-INVARIANTS-001 — Pre-Critic Record

Status: implementer Pre-Critic evidence for the repaired F0.2 candidate; not an Independent Critic verdict.
Authority: frozen Blueprint 001, Reconciliation 007 Amendment A, Final Disposition 008; Foundation 0 authorization and Task Contract.

## Contract and scope

- F0.2 covers Check-in, Checkout, Housekeeping start/finish, and Maintenance open/escalate/resolve/recovery command consistency with independent room dimensions.
- `room_state_version` is monotonic for those listed commands only. Existing `D1LifecycleRepository.reassign()` is not changed here; F0.4 must update canonical occupancy/dimensions and advance the same version before any global/repository-wide ABA-safety assertion.
- Forward migration only: `0023_room_state_command_guards.sql`; migrations 0001–0022 remain unmodified.
- No product UI, F0.3 cutover, F0.4 reassignment, financial path, Blocks A–H, live customer D1, real cutover, or real pricing bootstrap.

## Adversarial findings and repairs

1. **Legacy protective state could be weakened.** Read-only DB reviewer found legacy `MAINTENANCE` plus a current NON_BLOCKING case could be resolved to READY. Command now rejects unresolved legacy protection; executing-D1 regression proves 409 and exact zero drift/events.
2. **Checkout event guard omitted canonical occupancy/maintenance snapshot.** Migration and repository now guard the checked-in booking count, occupancy transition, and unchanged maintenance/service evidence; D1 assertions verify resulting checkout state/event.
3. **HK event details did not expose all unchanged dimensions.** Start/finish event details now record before/after occupancy, maintenance impact, service and version. SQL trigger rejects mismatches against the actual open-case state; rollback regression verifies no state/event partial commit.
4. **Authorization evidence was too indirect.** Actual application route test now uses two operational D1s and seeded active membership; it proves authorized tenant write and foreign-object/cross-tenant denial with zero foreign mutation/event. A receptionist's maintenance-resolution attempt is 403 after identity/membership/routing are established and leaves all rows/events unchanged.
5. **Migration test chain was incomplete.** Relevant forward migrations are applied in executing-D1 command tests, including `0022` and `0023`; lifecycle test applies its required forward chain.
6. **Legacy recovery evidence wording was overbroad (Independent Critic finding).** The existing contract-permitted `/dirty` legacy recovery creates and immediately resolves a current maintenance case in one audited D1 batch; this is not anonymous backfill or fabricated historical evidence. The frozen V11 capability/transition map plus the F0.2 Task Contract expressly allow this exact recovery path when no open case exists. CF-I05 now asserts creator/resolver subject, reason, shared timestamp, exact case/event ID, hotel, request ID and `legacy_recovery=true`. No product behavior changed.
7. **Tenant/RBAC integration test previously did not apply migration 0023 (Independent Critic finding).** The actual-app two-D1 test now applies migrations `0022` and `0023` from their SQL files before its authorized and cross-tenant requests. It asserts event/version details and submits a deliberately invalid event to prove the installed trigger rejects it without adding an event. The receptionist denial is performed with active identity/membership and selected hotel after this migration is installed.
8. **CF-I05 cleanup initially failed under `set -o pipefail`.** Exact cause: when the owned process group disappeared, `ps` returned 1 and the command substitution aborted before later D1 assertions. The cleanup check now treats absent process groups as zero live processes while still failing if any non-zombie process remains. The full regression reran after the legacy provenance assertions and exited 0 with terminal `CF-I05 Housekeeping + Maintenance D1/API regression PASS`; cleanup ran before PASS. `bash -n` passes.

## Fresh validation after final F0.2 code changes

| Command | Result |
|---|---|
| `npx vitest run apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts apps/api/src/modules/room-state/shared-room-commands.executing-d1.test.ts apps/api/src/modules/room-state/room-state-route.executing-d1.test.ts --maxWorkers=1 --testTimeout=30000` | PASS, 3 files / 3 tests; test-timeout override was command-only during measured host contention; repository config unchanged |
| `bash -n scripts/cf-i05-regression.sh` | PASS |
| `bash scripts/cf-i05-regression.sh` | PASS, exit 0 after explicit legacy provenance assertions; synthetic local Wrangler/D1/API; owned process cleanup verified before PASS |
| `npm run check` | PASS, 27 files / 98 tests, default command/test timeout |
| `npm run types:check` | PASS, API + Web Wrangler types current |
| `npm run web:build` | PASS, JS 296,282 raw / 86,084 gzip bytes; CSS 39,586 raw / 7,817 gzip bytes |
| `npm run architecture:fitness` | PASS, architecture checks, i18n, Cloudflare budgets; JS raw budget 300,000; CSS raw 50,000 |
| `npm run test:d1-query-plan` | PASS, arrival/checkout indexes and keyed inventory |
| `npm run wrangler:dry-run` | PASS, API and Web only; no deployment |
| `git diff --check` | PASS |

## Pre-Critic checklist

- Source semantics checked against the F0.2 command matrix; NON_BLOCKING advisory remains sellable and check-in eligible; BLOCKING on OCCUPIED does not change occupancy; resolving maintenance does not manufacture Housekeeping DIRTY.
- Zero-row, stale version, same-state ABA, K1→K2 replacement, concurrent winners, event truth, and exact no-side-effect assertions are executable in D1 tests.
- Denied mutation test proves authenticated subject, active tenant membership and intended D1 routing before capability rejection; denial has zero event/business drift. The actual-app test also installs the exact `0023` trigger migration and asserts trigger enforcement.
- Tenant isolation uses two operational stores and attempts an object from the other hotel; unknown/foreign attempts fail closed.
- Historical migrations are unchanged; `0023` is additive/forward-only. No backfill or real D1 execution occurred.
- No UI changes, so browser/responsive gates are N/A for this increment; directed API/D1 compatibility regression CF-I05 is fresh PASS.
- Scope excludes reassignment. Its lack of room-version/dimension updates remains a known dependency for F0.4, not an F0.2 global guarantee and not hidden.
- Legacy `MAINTENANCE` with only an open NON_BLOCKING case remains fail-closed; explicit no-open-case `/dirty` recovery preserves current actor-attributed command evidence rather than synthesizing anonymous history.
- All registry invariants have a row in the companion invariant file; INV-CF-I07-004 applies because the regression runner changed and is backed by cleanup-aware execution.
- The prior A/B pair received `REWORK`; both findings are addressed as described above, and all validations listed here ran against the repaired candidate. A replacement immutable A/B and fresh critic review remain required; no substantive PASS is self-declared.
