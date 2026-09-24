# WAVE-1.1-REASSIGNMENT — invariant evidence

Artifact scope: checked-in in-stay room reassignment backend/domain command,
forward migration `0021_reassignment_remaining_nights.sql`, and the minimum
Reception reason-field/API contract wiring. Reports, Users and broad Reception
redesign remain outside scope.

## Contract and source authority

- V11 authority: `origin/analysis/operational-flow-definition-v11`, read-only
  documents 02a, 06, 07, 16, 17, 19 and 20.
- Task contract: `.orchestration/contracts/WAVE-1.1-REASSIGNMENT.md`.
- Migration is forward-only; no historical migration was edited.

## Registry classification and evidence

| Invariant | Status | Evidence |
|---|---|---|
| INV-ATOMIC-001 | PASS | `scripts/cf-i03-regression.sh` executing D1 suite: remaining-night success, BLOCKING/overrun/VOIDED/ledger/stale/hold rejection and exact zero-drift assertions. Migration trigger aborts the batch when the exact remaining inventory, room states, booking total and reconciliation event are not jointly true. |
| INV-AUDIT-001 | PASS | CF-I03 asserts one REASSIGN event on success and zero events on rejected billing/stale paths; the trigger is on the unconditional REASSIGN insert, so an absent/invalid mutation aborts rather than becoming success. |
| INV-DOMAIN-001 | PASS | Reassignment remains a dedicated lifecycle route/repository command; no generic booking PATCH path was added. `npm run check` and route tests pass. |
| INV-TENANT-001 | PASS | Lifecycle route uses authenticated hotel routing/context; CF-I03 includes unknown-binding and cross-tenant denial with no event drift. |
| INV-RBAC-001 | PASS | Existing lifecycle capability enforcement remains authoritative; CF-I03 checks forbidden lifecycle mutation and restores the fixture role only for subsequent checks. |
| INV-PARITY-001 | PASS | V11 rules are encoded for CHECKED_IN-only, overrun, hotel-local effective date, elapsed-history preservation, destination availability, housekeeping handoff and D11 eligibility. Directed CF-I03 assertions pass. |
| INV-ENUM-001 | PASS | Canonical storage values are explicit in the repository/migration: `CHECKED_IN`, `AVAILABLE`, `OCCUPIED`, `DIRTY`, `MAINTENANCE`, `REASSIGN`, and `PRICE_RECONCILIATION`; source/target semantics are mapped in the task contract. |
| INV-UX-001 | PASS (bounded) | The wave preserves the existing Reception journey and adds only required reason submission/response details. Full reassignment UX is intentionally deferred to the next authorized UI increment; this artifact does not claim that later UI as complete. |
| INV-RESP-001 | N/A | No new responsive reassignment UI is claimed in this backend-enabler wave. |
| INV-EVID-001 | PASS | Claims below map to named executable tests, migration SQL, V11 source, and build/type gates. The shared browser failure is recorded separately and not relabeled as a Wave 1.1 PASS. |
| INV-LEGACY-001 | N/A | No legacy maintenance-case synthesis or recovery record is introduced. |
| INV-MONEY-001 | PASS | Integer-cent destination repricing plus extra charges; payment entries are untouched. CF-I03 asserts zero payments for the successful no-invoice fixture; CF-I06 and the 4 D11 executing-D1 tests pass. VOIDED and ledger mismatch are rejected before mutation. |
| INV-STATE-001 | PASS | Artifact and orchestration publication are kept as separate commits; the final boundary records the exact artifact SHA without self-reference. |
| INV-ORDER-001 | N/A | Reassignment does not rank or select an operational queue. |
| INV-CF-I07-001..004 | N/A | No admin/network route or role/plan mutation is changed. |
| INV-CF-I08-001..005 | N/A | Reports is explicitly outside this wave. The shared Reports/Users browser finding is not repaired here. |
| INV-SCOPE-001 | PASS | Changes are limited to lifecycle reassignment, its forward migration, directed regression fixtures, and the minimum Reception reason contract. No deploy, staging, main or production action occurred. |

## Executed evidence

- `npm run types:check`: PASS.
- `npm run check`: PASS, 21 files / 88 tests.
- D11 executing-D1 suite: 4/4 PASS.
- `npm run web:build`: PASS; JS 278,621 raw / 80,927 gzip.
- `npm run architecture:fitness`: PASS.
- `npm run test:d1-query-plan`: PASS.
- `npm run wrangler:dry-run`: PASS for API and web.
- `npm run test:cf-i03`: PASS after the final migration and assertion changes.
- `npm run test:cf-i05`: PASS.
- `npm run test:cf-i06`: PASS in an isolated serial run.
- `CI_BROWSER_STANDARD=1 npm run test:cf-i05-browser`: reaches the integrated browser suite and fails in shared pre-existing runner surfaces (`Reports/Daily occupancy` in one run; `Users/No users match this search` in the latest run). Housekeeping reaches completion. This is a promotion finding, not a Wave 1.1 reassignment claim, and no Reports/Users code was changed.

## Mutation inventory

The reassignment batch changes only the current booking, remaining inventory
claims, old/destination room physical states, and lifecycle/financial evidence.
The D11 trigger remains the invoice reconciliation authority. Payment entries
are never inserted, updated or deleted. Rejected/stale paths are covered by
zero-drift assertions.

## Pre-Critic boundary statement

Technical development evidence for this increment is complete subject to the
shared browser/promotion finding above. This file is not an Independent Critic
review and does not set `external_review.completed=true`.
