# HMS F0.8 — Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`

## Gate results

1. **Contract completeness — PASS.** Frozen contract predates implementation and maps all 24 registry invariants; scope is guest + reservation recoverable creation, synthetic/local only. No retention duration or cleanup behavior was invented.
2. **Source parity — PASS.** Existing guest validators, email uniqueness and canonical booking availability/date/rate/integer-cent/pricing-segment path are reused. Existing guest selection remains. No guest merge, booking state change, D11 policy change, or duplicate canonical endpoint.
3. **Mutation/concurrency — PASS.** Operation token + normalized payload digest bind replay; exact guest/booking/stage identities and D1 batches gate event writes. Executing-D1 race proves one result for same-token different payload; response-loss, blocked-room recovery and injected late audit failures prove replay and rollback; completed stage/provenance is guarded by migration triggers. No SQLite `changes()` causal chaining.
4. **Security — PASS.** Current membership capabilities are checked at create/recovery endpoints; storage is selected from authenticated hotel context; tests exercise denied role and a separately routed second hotel. A token is not authorization. No client hotel selector.
5. **UX parity — PASS.** Reception retains its booking task surface, visibly offers new guest creation and persisted guest recovery, and refreshes queue after Worker-confirmed success. No ranking/next-case semantics changed.
6. **Browser evidence — PASS.** Actual local Wrangler Worker + clean migrated D1 + Vite/Playwright CLI at 1280×900 and 390×844. New-guest success/price, blocked-room 409 with persisted guest, reload and explicit saved-guest recovery, mobile success and queue refresh are asserted. Screenshots are diagnostic, not the sole proof.
7. **Evidence claim audit — PASS.** Invariant matrix names the executable tests, full suite, serial CF regressions, build/type/fitness/query-plan/Wrangler dry-runs and integrated runner. Stale failure-only logs from earlier fixture/harness debugging are excluded; final run log is exit 0 and confirms process cleanup.
8. **Full regression and scope — PASS.** `npm run check` 33 files/151 tests; directed F0.8+F0.3 tests 9/9; types/build/architecture/i18n/budgets/query plans; API/Web and staging-SPA dry-run; CF-I03/04, CF-I05 and CF-I06 serial; `git diff --check`; route uniqueness manually verified for the three exact `/reservation-creation-operations` method/path pairs. No real data, Blocks A–H, PR, push, merge, main, staging mutation, deploy or production.
9. **Invariant evidence — PASS.** `.orchestration/evidence/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001-INVARIANTS.md` classifies all 24 invariants. INV-STATE-001 is satisfied only after separate A/B publication and external review; it does not self-approve F0.8.

## Findings and repairs

- Architecture fitness first failed because `routes/bookings.ts` directly queried D1 for duplicate email detection. The query moved to the focused repository; fitness, types, complete tests, regressions and integrated Worker/D1 browser were rerun.
- The additive 0029 migration changed cumulative synthetic F0.3 fingerprints. Updated test pins were confirmed by F0.3 executing-D1 2/2 and the complete 33-file/151-test run.
- Initial integrated-harness fixture/accessibility/assertion issues were repaired in the runner; earlier failure-only API/migration/web logs are not claimed as evidence. Latest integrated run passes and verifies owned Worker/Vite process cleanup.

## Exact claims

- Integrated run: `scripts/cf-f0-08-reservation-recovery-integrated.sh`, exit 0; final log `output/playwright/f0-08-reservation-recovery.log`; screenshots `output/playwright/f0-08-reception-recovery-desktop.png` and `...-mobile.png`.
- Budget after build: JS 299,642/300,000 raw and 86,895/100,000 gzip; CSS 40,668/50,000 raw and 8,000/15,000 gzip.
- The existing broad product-flow runner's missing-`playwright` caveat remains unchanged and is not claimed as PASS; this increment's direct Playwright CLI integration is separate evidence.
- No invoice/payment rows were fabricated or mutated by this reservation workflow; F0.8 did not implement a new D11 reconciliation policy.

## Outcome

`PRE-CRITIC: PASS — INTERNAL GATE ONLY`

This is not an Independent Critic verdict and not a Foundation 0 aggregate PASS. Freeze substantive Artifact A, create orchestration-only Boundary B, obtain a fresh Independent Critic on exact A+B, then follow the approved Foundation 0 DAG.
