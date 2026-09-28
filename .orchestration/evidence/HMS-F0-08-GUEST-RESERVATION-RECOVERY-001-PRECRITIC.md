# HMS F0.8 — Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`

## Gate results

1. **Contract completeness — PASS.** Frozen contract predates implementation and maps all 24 registry invariants; scope is guest + reservation recoverable creation, synthetic/local only. No retention duration or cleanup behavior was invented.
2. **Source parity — PASS.** Existing guest validators, email uniqueness and canonical booking availability/date/rate/integer-cent/pricing-segment path are reused. Existing guest selection remains. No guest merge, booking state change, D11 policy change, or duplicate canonical endpoint.
3. **Mutation/concurrency — PASS.** Operation token + normalized payload digest bind replay; exact guest/booking/stage identities and D1 batches gate event writes. Executing-D1 race proves one result for same-token different payload; response-loss, blocked-room recovery and injected late audit failures prove replay and rollback; completed stage/provenance is guarded by migration triggers. No SQLite `changes()` causal chaining.
4. **Security — PASS.** Current membership capabilities are checked at create/recovery endpoints; storage is selected from authenticated hotel context; tests exercise denied role and a separately routed second hotel. A token is not authorization. No client hotel selector.
5. **UX parity — PASS.** Reception retains its booking task surface, visibly offers new guest creation and persisted guest recovery, and refreshes queue after Worker-confirmed success. No ranking/next-case semantics changed.
6. **Browser evidence — PASS.** Actual local Wrangler Worker + clean migrated D1 + Vite/Playwright CLI at 1280×900 and the contracted 375×844. New-guest success/price, blocked-room 409 with persisted guest, reload, explicit saved-guest recovery, original incomplete operation still visible after a distinct booking succeeds, mobile success and queue refresh are asserted. Final D1 totals are 3 guests, 3 confirmed bookings, 3 completed operations, 6 operation events and exactly 1 original `GUEST_CREATED` pending stage. Screenshots are diagnostic, not the sole proof.
7. **Evidence claim audit — PASS.** Invariant matrix names the executable tests, full suite, serial CF regressions, build/type/fitness/query-plan/Wrangler dry-runs and integrated runner. Stale failure-only logs from earlier fixture/harness debugging are excluded; final run log is exit 0 and confirms process cleanup.
8. **Full regression and scope — PASS.** After rework, `npm run check` 33 files/151 tests; F0.8 executing-D1 7/7; types/build/architecture/i18n/budgets/query plans; API/Web and staging-SPA dry-run; integrated Worker/D1/Vite browser and final exact D1 assertion pass; `git diff --check`; route uniqueness manually verified for the three exact `/reservation-creation-operations` method/path pairs. CF-I03/04, CF-I05, CF-I06 passed immediately before the bounded correction and affected no touched behavior. No real data, Blocks A–H, PR, push, merge, main, staging mutation, deploy or production.
9. **Invariant evidence — PASS.** `.orchestration/evidence/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001-INVARIANTS.md` classifies all 24 invariants. INV-STATE-001 is satisfied only after separate A/B publication and external review; it does not self-approve F0.8.

## Findings and repairs

- Architecture fitness first failed because `routes/bookings.ts` directly queried D1 for duplicate email detection. The query moved to the focused repository; fitness, types, complete tests, regressions and integrated Worker/D1 browser were rerun.
- The additive 0029 migration changed cumulative synthetic F0.3 fingerprints. Updated test pins were confirmed by F0.3 executing-D1 2/2 and the complete 33-file/151-test run.
- Independent Critic finding `HIGH` showed that a distinct confirmed booking for the same guest hid the original `GUEST_CREATED` operation. The incomplete list now reflects only the operation's own stage; executing-D1 and integrated browser assertions prove the original remains visible after a separate booking. The `MEDIUM` 390px evidence-width finding is repaired by running the same mobile interaction at 375×844.
- The first expanded D1 test run exposed a shared-fixture token collision; assigned unique operation tokens and reran F0.8 7/7. The first integrated correction pass exposed the runner's own stale `NOT EXISTS` final-state oracle; changed it to require exactly one unresolved original stage and reran the full integrated runner.
- Initial integrated-harness fixture/accessibility/assertion issues were repaired in the runner; earlier failure-only API/migration/web logs are not claimed as evidence. Latest integrated run passes and verifies owned Worker/Vite process cleanup.

## Exact claims

- Integrated run: `scripts/cf-f0-08-reservation-recovery-integrated.sh`, exit 0; final log `output/playwright/f0-08-reservation-recovery.log`; screenshots `output/playwright/f0-08-reception-recovery-desktop.png` and `...-mobile.png`.
- Budget after build: JS 299,642/300,000 raw and 86,895/100,000 gzip; CSS 40,668/50,000 raw and 8,000/15,000 gzip.
- The existing broad product-flow runner's missing-`playwright` caveat remains unchanged and is not claimed as PASS; this increment's direct Playwright CLI integration is separate evidence.
- No invoice/payment rows were fabricated or mutated by this reservation workflow; F0.8 did not implement a new D11 reconciliation policy.

## Outcome

`PRE-CRITIC: PASS — INTERNAL GATE ONLY`

This is not an Independent Critic verdict and not a Foundation 0 aggregate PASS. Freeze substantive Artifact A, create orchestration-only Boundary B, obtain a fresh Independent Critic on exact A+B, then follow the approved Foundation 0 DAG.
