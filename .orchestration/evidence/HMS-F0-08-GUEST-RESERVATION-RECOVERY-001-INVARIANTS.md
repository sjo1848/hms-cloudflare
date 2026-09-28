# HMS F0.8 — Invariant Evidence

Task Contract: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`
Evidence scope: local synthetic D1, disposable Wrangler persistence, local Worker + Vite + Playwright CLI. No customer/remote data or deployment was used.

| Invariant | Classification | Status | Evidence |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `reservation-creation.executing-d1.test.ts` 7/7: same-token replay, same-token changed-payload race (one winner), durable guest-stage recovery, booking/audit rollback, and zero partial success. Integrated runner independently persists three successful bookings and a recoverable conflict stage; final D1 proves one original `GUEST_CREATED` remains after a separate confirmed booking uses the same guest. |
| INV-AUDIT-001 | APPLIES | PASS | Executing-D1 tests assert exact operation event/provenance counts on guest and booking success/replay and zero audit rows on injected guest-stage and booking-stage audit failures. |
| INV-DOMAIN-001 | APPLIES | PASS | New-guest and existing-guest reservation paths both use the existing booking repository's canonical availability, room-night, current-rate, pricing-segment and integer-cent total rules. No generic lifecycle/status update was added. |
| INV-TENANT-001 | APPLIES | PASS | Executing-D1 API test attempts foreign token and list reads against a separately selected hotel and confirms fail-closed responses/no foreign identity. Each run uses hotel-local operational D1; no client hotel field selects storage. |
| INV-RBAC-001 | APPLIES | PASS | Executing-D1 API test verifies denied housekeeper mutation and recovery reads, allowed receptionist create/read, and zero business/audit drift on denial. Routes use canonical `hasCapability`. |
| INV-PARITY-001 | APPLIES | PASS | Contract parity retains existing guest validation/email uniqueness and canonical booking validation/pricing. Duplicate email is not merged; executing-D1 tests verify existing guest creation does not manufacture another guest. Existing D11 truth/ledger are not written by the new operation; full D11 4/4 regression passes. |
| INV-ENUM-001 | APPLIES | PASS | Migration `0029_reservation_creation_recovery.sql` constrains guest source and the three operation stages, including valid source/stage pairing. Executing-D1 tests cover allowed stage outcomes; operation stages are not booking statuses. |
| INV-UX-001 | APPLIES | PASS | Integrated Reception browser creates a new guest/booking, reloads after a recoverable BLOCKING-room conflict, selects the saved guest into a distinct operation, confirms the original incomplete token remains visibly recoverable after the other booking succeeds, and observes authoritative queue refresh. |
| INV-ORDER-001 | N/A | N/A | No queue ranking, priority, synthetic item or next-case selection behavior was changed. |
| INV-RESP-001 | APPLIES | PASS | `scripts/cf-f0-08-reservation-recovery-integrated.sh` exercises the actual create controls at desktop 1280×900 and the contracted mobile 375×844, including successful persistence and mobile queue refresh. Screenshots are diagnostic evidence only. |
| INV-EVID-001 | APPLIES | PASS | Fresh rework evidence: full `npm run check` 33 files/151 tests; F0.8 executing-D1 7/7 (including separate-token same-guest case); `types:check`; `web:build`; `architecture:fitness`; D1 query plans; API/Web and staging-SPA Wrangler dry-runs; integrated Worker/D1/Vite/browser exit 0 at 1280×900 and 375×844. Serial CF-I03/04, CF-I05, CF-I06 passed immediately before this narrowly scoped list/width correction and do not cover it; full suite and dedicated integrated evidence were rerun after correction. Exact final log/screenshots under `output/playwright/f0-08-*`. |
| INV-LEGACY-001 | N/A | N/A | No legacy or historical guest/booking records are synthesized, backfilled, or rewritten. A newly created guest is an explicit current user action with actor/hotel/request/time provenance. |
| INV-MONEY-001 | APPLIES | PASS | D1 tests assert canonical integer-cent booking total/pricing segment and no fabricated or modified invoice/payment ledger. Existing D11 executing-D1 suite passes 4/4; CF-I06 passes. Guest and booking audit injected failures roll back their respective operation stages. |
| INV-STATE-001 | APPLIES | PASS AFTER A/B | Publication must use immutable substantive Artifact A followed by orchestration-only Boundary B with exact A SHA, external review required and resume disabled. Pending until publication pair is created and independently reviewed. |
| INV-CF-I07-001 | N/A | N/A | No admin, network, or audit-read authorization route changed. |
| INV-CF-I07-002 | N/A | N/A | No admin semantic no-op mutation is in scope. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade is in scope. |
| INV-CF-I07-004 | APPLIES | PASS | Integrated runner applies migrations in disposable local D1, starts only owned local Worker/Vite/browser processes, verifies their process trees are gone before its terminal PASS; latest run exits 0 and final D1 assertions include one still-incomplete original operation. |
| INV-CF-I08-001 | N/A | N/A | No revenue/occupancy/reporting arithmetic changed. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation or cross-hotel fan-out changed. |
| INV-CF-I08-003 | N/A | N/A | No report date/state query changed. |
| INV-CF-I08-004 | N/A | N/A | No booking or room state enum was expanded; recovery stages are a separate constrained domain. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock, default date range, or cross-surface reporting continuity changed. |
| INV-SCOPE-001 | APPLIES | PASS | Changed product files are limited to F0.8 guest/reservation recovery and its Reception UI, plus the synthetic F0.3 cumulative fingerprint fixture update required by additive migration 0029. No Blocks A–H, real-data action, PR, push, merge, protected branch, deploy or production action. |

## Findings repaired during this increment

- The full architecture fitness check found a direct email-existence D1 query in `routes/bookings.ts`; moved that read into `D1ReservationCreationRepository.emailExists()` rather than weakening the boundary check. Architecture fitness and all dependent validations were rerun.
- Clean full migration chain including forward-only migration 0029 changes the cumulative F0.3 synthetic schema/source/report fingerprints; updated only the pinned expected fingerprints and verified the F0.3 executing-D1 rehearsal 2/2 plus full suite.
- A separate read-only QA reviewer identified missing payload-race, existing-guest, migration source/stage pairing, completion-provenance immutability, initial guest-audit rollback, actionable localized conflict and real integrated-browser coverage. Those were added/repaired and directed/integrated tests pass. Reviewer was not the Independent Critic.

## Boundary

This is F0.8 evidence only. It does not claim the Foundation 0 aggregate gate. Independent Critic of the exact immutable Artifact A + orchestration-only Boundary B remains required before continuing past F0.8.
