# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Working directory: `/home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare`
Active branch: `impl/wave-1.1-reassignment`
Base implementation boundary: `b28595ddf90056d39d31e331a85b1a193936f9ec`
PR: `#47 (Draft)`
Wave: `1.1 — In-Stay Reassignment`
Status: `OPEN / DEVELOPMENT IN PROGRESS; PROMOTION BLOCKED`
Runtime: `RUNNING`

Wave 0.3 and Wave 1.1a are recorded as development passes with the shared/preexisting Reports browser finding; promotion remains blocked. Wave 1.1 is authorized from the immutable Wave 1.1a boundary, using the remote V11 definition branch as read-only contract authority. The external review remains required for later frozen integration/promotion and is not marked completed.

## VALIDATED EVIDENCE

- D11 executing D1: `4/4 PASS`.
- Foundation CI: PASS.
- Unit/integration suite: inherited `87/87 PASS` before Wave 1.1 changes.
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

Required promotion gate: `ux-mobile-browser` — FAIL / FLAKY SHARED RUNNER FINDING.

Housekeeping initial board/date and mutation-refresh race is repaired and the browser trace reaches the end of housekeeping successfully. The full gate now fails afterward in Reports waiting for `Daily occupancy`; prior runs also recorded concurrent `/reports/revenue` and `/reports/occupancy` requests, local `workerd` `broken pipe`, and Vite `socket hang up`. This is recorded as an additional runner/runtime finding; CF-I08 Reports code is out of CF-I06 scope and has not been modified.

The A/B attribution is recorded in `.orchestration/evidence/CF-I06-WAVE-0.3-BROWSER-ATTRIBUTION.md`. The current run passes Housekeeping and fails in Reports; the baseline full run fails earlier in Housekeeping because the Wave 0.3 repair is absent. The Wave 0.3 diff contains no Reports or analytics implementation changes.

The V11 contracts were fetched read-only from `origin/analysis/operational-flow-definition-v11` and are not merged into the implementation branch.

The original investigation categories were:

1. test race;
2. application initialization race;
3. stale/duplicate fetch;
4. hotel-local date mismatch;
5. housekeeping domain/runtime regression;
6. local worker/runtime failure after housekeeping, at the Reports surface.

## GOVERNANCE

- No merge.
- No deploy.
- No acceptance/staging mutation.
- No main mutation.
- No production changes.
- PR remains isolated/draft.
- Wave 1.1 may proceed for development under its active Task Contract; the browser gate remains a promotion blocker and must not be hidden or promoted around.

## NEXT AUTHORIZED ACTION

Implement and validate the active `WAVE-1.1-REASSIGNMENT` contract. Do not modify Reports, do not merge/deploy/promote, and preserve the later external-review requirement.

## MODEL ROUTING

- Orchestrator: Luna LOW.
- Browser investigation/QA: Luna MEDIUM.
- Repair: Luna LOW or MEDIUM according to demonstrated complexity.
- Sol MEDIUM only after a substantive Luna MEDIUM investigation is insufficient.
