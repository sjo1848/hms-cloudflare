# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Working directory: `/home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare`
Active branch: `impl/wave-0.3-billing-reconciliation`
Head: `077ebf18af935e00579f590d4a6bb8c0bffb9abd`
PR: `#45`
Wave: `0.3 — D9/D11 Billing Reconciliation`
Status: `OPEN / BLOCKED ON BROWSER GATE`

Wave 0.3 is not PASS. Wave 1.1a has not started.

## VALIDATED EVIDENCE

- D11 executing D1: `4/4 PASS`.
- Foundation CI: PASS.
- Unit/integration suite: `86/86 PASS`.
- TypeScript/types: PASS.
- Web build: PASS.
- Cloudflare budgets: PASS.
- D1 critical query plans: PASS.
- Wrangler dry-runs: PASS.
- Staging SPA configuration validation: PASS.
- `scripts/cf-i06-regression.sh`: PASS.
- Extra-charge D1 atomic rollback: confirmed.
- `recordExtraCharge()` no longer uses SQLite `changes()` for causal chaining.

Successful extra-charge batch observation: `[1, 2, 1, 1]`. The second result may be `2` because the booking update invokes the D11 invoice reconciliation trigger. Batch success must therefore prove the primary mutation and must not require every statement to report exactly `meta.changes === 1`.

## CURRENT BLOCKER

Required gate: `ux-mobile-browser` — FAIL.

Known area: housekeeping browser flow, initial board loading and hotel-local-date interaction. The cause remains under investigation and is not to be hidden with arbitrary sleeps, blind timeout increases or green-only retries.

Investigation must distinguish:

1. test race;
2. application initialization race;
3. stale/duplicate fetch;
4. hotel-local date mismatch;
5. housekeeping domain/runtime regression.

## GOVERNANCE

- No merge.
- No deploy.
- No acceptance/staging mutation.
- No main mutation.
- No production changes.
- PR remains isolated/draft.
- Wave 1.1a must not begin until the browser gate is reproducibly green.

## NEXT AUTHORIZED ACTION

Investigate and repair the Wave 0.3 `ux-mobile-browser` regression, then rerun the required Foundation CI and browser regression. After a reproducibly green browser gate, execute the Pre-Critic Gate and invariant evidence for the exact artifact before external review.

## MODEL ROUTING

- Orchestrator: Luna LOW.
- Browser investigation/QA: Luna MEDIUM.
- Repair: Luna LOW or MEDIUM according to demonstrated complexity.
- Sol MEDIUM only after a substantive Luna MEDIUM investigation is insufficient.
