# HMS-F0-06 — Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001.md`
Invariant evidence: `.orchestration/evidence/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001-INVARIANTS.md`
Scope: synthetic/local active-stay pricing classifier, digest-bound shadow staging and explicitly synthetic activation only.

## 1. Contract completeness

- Frozen F0.6 Task Contract exists and maps all 24 durable invariants.
- No product policy is inferred: only explicit synthetic historical source evidence yields traceable segments; aggregate-only or conflicting data stays held.
- Real active stays, live bootstrap/cutover, Blocks A–H and product API/UI are outside scope and untouched.

## 2. Source parity and data model

- Booking/Stay is the account grain; D11 remains authoritative for invoice/payment truth.
- Shadow candidates are stored separately from operational quote inputs until an explicitly synthetic activation batch commits.
- Existing destination room price is not used as historical price evidence; source rate version and source references are preserved.
- Migration `0026` is forward-only; migration history is not rewritten.
- Duplicate source room IDs are now a conflict class, and exact persisted child-array cardinality is checked in the activation transaction.

## 3. Mutation, concurrency and recovery sweep

- Exact source digest and baseline snapshot guard booking, invoice, charges, payments, room versions, inventory keys and the full canonical `booking_pricing_segments` set before activation.
- Already-segmented stays are held; migration `0027` compares the exact staged/current canonical segment set inside the activation batch before `SHADOWED → ACTIVATING`.
- Executing-D1 tests cover same-manifest concurrent activation, replay/idempotency, stale/equal-count ledger substitution, inventory ABA, injected staging batch rollback/recovery, injected late activation rollback and two-hotel D1 isolation.
- A replay after a successful concurrent winner cannot append duplicate segments; both calls converge on `COMPLETE` with two exact segments.
- Financial account values, extra charges, payment rows, paid_at, lifecycle and inventory remain exactly unchanged through shadow and synthetic activation.
- No causal `changes()` dependency is used.

## 4. Security and tenant sweep

- No new product authorization route exists.
- Foreign hotel source is rejected before staging. Separate synthetic hotel D1s use distinct run IDs; activating one leaves the other held and unchanged.
- Integrated inherited reassignment E2E retains two-tenant object isolation assertions.

## 5. UI / browser scope

- F0.6 adds no UI. The inherited F0.4 Worker/D1/Vite/Playwright regression was rerun after the final test correction.
- It asserts hotel-local remaining interval is identical for destination availability search, displayed effective-date preview/quote and reassignment command; it also asserts real D1 persistence, authoritative refresh and stale 409 recovery at desktop/mobile.
- Screenshots are diagnostic only; the browser script's response, visible state and persisted D1 assertions are the evidence.

## 6. Evidence claim audit

| Claim | Executable evidence |
|---|---|
| Five explainable classes; no inferred historical price; deterministic manifest | `active-stay-pricing-bootstrap.executing-d1.test.ts` |
| Shadow quote isolation; full D11/account preservation; provenance; replay | Same executing-D1 suite, shadow/activation case |
| Duplicate identity quarantined; exact persisted snapshot cardinality checked | Duplicate-room test + `0026_active_stay_pricing_bootstrap_shadow.sql` activation guard |
| Existing canonical pricing stays are held; late segment-set drift is rejected even if booking scalar version fields are restored | Pre-segmented and post-staging mutation executing-D1 cases + `0027_active_stay_bootstrap_segment_snapshot_guard.sql` |
| Concurrent activation, separate-hotel D1 isolation, staging recovery, ABA and atomic rollback | Same executing-D1 suite |
| Clean migration chain through 0027 | Wrangler local `d1 migrations apply` on fresh temporary persistence for CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB; exit 0 |
| F0.4 remaining interval across search/preview/mutation, mobile conflict and authoritative refresh | `scripts/cf-wave12-reassignment-integrated.sh`; final run exit 0 |
| Full suite | `npm run check`: PASS, 32 files / 144 tests |
| Type/build/fitness/budget/query-plan/Wrangler | `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, API/Web/staging-config Wrangler dry-runs |
| Inherited API/domain regressions | `npm run test:cf-i03`, `test:cf-i04`, `test:cf-i05`, `test:cf-i06`, run sequentially; all PASS |

## 7. Full regression and scope

- `npm run check`: PASS, 32 files / 144 tests. Includes F0.4 14/14 executing-D1, D11 4/4, F0.6 11/11 and F0.3 synthetic rehearsal 2/2.
- Clean local Wrangler migration chains 0001–0027: PASS for CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB on fresh temporary local persistence.
- Types, web build/budgets, architecture fitness, D1 query plans, Wrangler API/Web dry-runs and staging SPA config dry-run: PASS.
- CF-I03, CF-I04, CF-I05 and CF-I06 sequential local regression scripts: PASS.
- Integrated browser regression after repair: `scripts/cf-wave12-reassignment-integrated.sh` exited 0 with real local Worker/D1/Vite. Candidate search/quote/preview/mutation retained one hotel-local remaining-stay interval; desktop success persisted to the new room and refreshed the authoritative queue; mobile stale mutation returned 409, retained context, refreshed state and exposed the newly BLOCKING destination as unavailable.
- No real/customer D1, remote state, production, staging mutation, deployment, push, PR, merge or Blocks A–H.

## 8. Findings / rework

- `F0.6-R1`: duplicate room identity could be collapsed by `INSERT OR IGNORE`; fixed at classifier and transactional snapshot-cardinality guard; adversarial test passes.
- `F0.6-IC-01 HIGH`: Galileo found the exact canonical segment set was missing from source snapshot/activation guard. Repaired and covered by a held pre-segmented stay plus a segment-set change after shadowing with booking version/token/timestamp restored; migration 0027's exact guard rejects atomically. Fresh A2+B2 Independent Critic is pending; no PASS is claimed.
- F0.3 pinned cumulative-schema fingerprints were updated to reflect additive migration 0026; all behavioral rehearsal assertions remain unchanged and pass.
- F0.4 migration 0024 parser issue was fixed earlier by equivalent boolean predicates; current clean migration chain and F0.4 executing-D1/browser regressions pass.
- Initial parallel regression invocation was invalidated by fixed-port contention and a test timeout under artificial process load. All relevant regressions were rerun serially, and full check passed without contention. No timeout was increased.
- Browser log contains expected stale-operation 409s and a 404 lookup for a not-yet-open maintenance case plus missing favicon; no 5xx. The direct maintenance fixture mutation asserted HTTP 201, the stale reassign asserted HTTP 409, and the entire integrated scenario exited 0. The 404 diagnostic was also present in prior runs; no Reports/Users/Housekeeping changes were made.

## Gate result

`PRE-CRITIC: PASS` for publication eligibility only. This is not an Independent Critic verdict and does not self-declare the F0.6 Development Gate. Publish immutable Artifact A, then orchestration-only Boundary B, and require a fresh Independent Critic on that exact pair before continuing to F0.7.
