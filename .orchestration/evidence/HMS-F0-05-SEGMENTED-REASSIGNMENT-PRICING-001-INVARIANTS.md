# HMS-F0-05 — Invariant Evidence

Task Contract: `.orchestration/contracts/HMS-F0-05-SEGMENTED-REASSIGNMENT-PRICING-001.md`
Bounded repair contract: `.orchestration/contracts/HMS-F0-05-REPAIR-HOUSEKEEPING-AUDIT-RACE-001.md`
Evidence type: local synthetic D1 / Worker / browser only.

| Invariant | Applies? | Status | Concrete evidence |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `apps/api/src/modules/lifecycle/reassignment-interval.executing-d1.test.ts`: 14 executing-D1 tests cover exact room-night sets, payment-after-quote, same booking and shared-destination races, ABA and injected final-event rollback. `apps/api/src/modules/room-state/shared-room-commands.executing-d1.test.ts` and `scripts/cf-i05-regression.sh` prove one housekeeping state transition/event under two concurrent callers. `scripts/cf-i06-regression.sh` proves extra-charge reconciliation atomicity. |
| INV-AUDIT-001 | APPLIES | PASS | F0.5 executing-D1 tests assert one correlated REASSIGN / PRICE_RECONCILIATION event set for the winner and no events on rejected/stale paths. Shared room-command D1 test plus CF-I05 assert one CLEANING_START event for the advanced room version; guarded event insert prevents stale loser audit. |
| INV-DOMAIN-001 | APPLIES | PASS | Booking create/edit tests and `reassignment-interval.executing-d1.test.ts`; route uniqueness check; generic edit remains CONFIRMED-only and reassignment uses lifecycle command. Housekeeping repair retains existing transition predicates. |
| INV-TENANT-001 | APPLIES | PASS | `scripts/cf-wave12-reassignment-integrated.sh` exercises hotel A with a foreign booking persisted only in HOTEL_SECOND_DB and asserts not-found/no cross-tenant mutation. Existing D1/API tenant routing tests pass in full suite. |
| INV-RBAC-001 | APPLIES | PASS | Integrated reassignment runner proves authorized success and forbidden attempt with authenticated hotel membership; API route tests preserve backend capability checks. |
| INV-PARITY-001 | APPLIES | PASS | F0.5 exact cent/segment projection, current destination rate and frozen booking interval are asserted in executing-D1 and integrated quote tests; no historical inference or added enum policy. |
| INV-ENUM-001 | N/A | N/A | No new cross-representation status predicate/value was added. |
| INV-UX-001 | APPLIES | PASS | F0.5 price quote is shown in the existing Reception reassignment task; only quote-related UI additions, no unrelated workflow redesign. Integrated desktop/mobile assertions exercise the same operational task. |
| INV-ORDER-001 | N/A | N/A | No queue ranking or next-case logic changed. |
| INV-RESP-001 | APPLIES | PASS | `scripts/cf-wave12-reassignment-integrated.sh` verifies the real Worker/D1 price-impact/success flow at desktop width and the stale-conflict recovery at 375px mobile. |
| INV-EVID-001 | APPLIES | PASS | This evidence maps claims to executing-D1 tests, CF regression scripts and local integrated browser runner. `output/playwright/f05-reassignment-authoritative-quote-desktop.png` and success/mobile screenshots are diagnostic; assertions remain executable. |
| INV-LEGACY-001 | N/A | N/A | No historical booking pricing was inferred or bootstrapped; F0.6 owns synthetic legacy classification/bootstrap. |
| INV-MONEY-001 | APPLIES | PASS | `pricing-segments.test.ts`, 14 executing-D1 reassignment tests, D11 4/4, and CF-I06 assert integer-cent totals, preserved charges/payment entries, invoice reconciliation, VOIDED/mismatch rejection, concurrency and rollback. |
| INV-STATE-001 | APPLIES | PASS AFTER A/B | This file is included in Artifact A. The following orchestration-only Boundary B must identify A's exact SHA, keep external review required, and disable resume; no self-referential SHA is placed in A. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit authorization surface changed. |
| INV-CF-I07-002 | N/A | N/A | No admin/network plan or role mutation changed. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade behavior changed. |
| INV-CF-I07-004 | APPLIES | PASS | Integrated Worker/Vite/browser and CF regression runners use owned temporary persistence and verify cleanup of owned process trees before exit; latest reassignment browser run exited 0. |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic changed. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation changed. |
| INV-CF-I08-003 | N/A | N/A | No reporting query changed; reassignment uses F0.4 hotel-local date. |
| INV-CF-I08-004 | N/A | N/A | No room or booking state was added. |
| INV-CF-I08-005 | APPLIES | PASS | `reassignment-interval.executing-d1.test.ts` covers hotel-local effective date and checkout boundary; integrated runner compares search/availability, quote and command over the same `[effective_date, check_out)` interval. |
| INV-SCOPE-001 | APPLIES | PASS | Changed-path review is limited to F0.5 pricing/quote/persistence, required runner repairs, and the bounded existing-housekeeping audit-race repair required by INV-ATOMIC/AUDIT and CF-I05. No F0.6 bootstrap, Blocks A–H, real data, PR, merge, staging, deploy or production. |

## Boundary notes

- The initial integrated browser assert observed the old room because it waited for only the board response while Reception publishes the new queue after its parallel board/rooms/guests load resolves. Replaced that test race with a state-based DOM wait; no timeout inflation or arbitrary sleep.
- CF-I05 reproduced a real shared command defect: a stale concurrent housekeeping caller could commit an unconditional audit event after its room update affected zero rows. A narrow version-bound `INSERT … SELECT` guard was added without `changes()` chaining. The current code has not been independently accepted; exact A+B review remains required.
- One early CF-I06 invocation before the runner's isolation repair used the default local Wrangler fixture store and mutated named synthetic fixture rows only. The harness was corrected to use a unique temporary persistence directory; all later CF-I06 runs use isolated temporary D1. No remote, customer, staging, or production data was accessed or mutated.

## Publication check

- [x] All applicable invariants have reproducible evidence; INV-STATE-001 is materialized by the subsequent exact A/B boundary.
- [x] No `UNPROVEN`/`FAIL` applicable invariant remains.
- [x] Only synthetic/local data was used; no live migration/cutover was executed.
- [ ] Fresh exact-pair Independent Critic review pending after A+B publication.
