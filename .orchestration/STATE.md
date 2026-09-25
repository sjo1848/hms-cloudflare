# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Working directory: `/home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare`
Active branch: `impl/wave-1.2-reception-reassignment-ux`
Base implementation boundary: `9ed9ebc1a42cd13096d526c4d621140f9d3d6a3b`
PR: `#48 (Draft)`
Wave: `1.2 — Reception Reassignment UX/UI`
Status: `OPEN / WAVE 1.2 DEVELOPMENT CHECKPOINT; PROMOTION BLOCKED`
Runtime: `READY_TO_RESUME at Controller checkpoint`

Wave 0.3 and Wave 1.1a are recorded as development passes with the shared/preexisting browser finding; promotion remains blocked. Wave 1.1 backend/domain work reached Controller checkpoint at artifact `b8ed06521d4221fcaac08b838887405339c9cd1e`, using the remote V11 definition branch as read-only contract authority. The external review remains required and is not marked completed.

## VALIDATED EVIDENCE

- D11 executing D1: `4/4 PASS`.
- Foundation CI: PASS.
- Unit/integration suite: `21 files / 88 tests PASS`.
- TypeScript/types: PASS.
- Web build: PASS.
- Cloudflare budgets: PASS.
- D1 critical query plans: PASS.
- Wrangler dry-runs: PASS.
- Staging SPA configuration validation: PASS.
- `scripts/cf-i06-regression.sh`: PASS.
- `scripts/cf-i03-regression.sh`: PASS after final reassignment trigger and financial-event assertions.
- `scripts/cf-i05-regression.sh`: PASS.
- Extra-charge D1 atomic rollback: confirmed.
- `recordExtraCharge()` no longer uses SQLite `changes()` for causal chaining.

Successful extra-charge batch observation: `[1, 2, 1, 1]`. The second result may be `2` because the booking update invokes the D11 invoice reconciliation trigger. Batch success must therefore prove the primary mutation and must not require every statement to report exactly `meta.changes === 1`.

## CURRENT BLOCKER

Required promotion gate: `ux-mobile-browser` — FAIL / FLAKY SHARED RUNNER FINDING.

Housekeeping initial board/date and mutation-refresh race is repaired and the browser trace reaches the end of housekeeping successfully. The shared full gate fails afterward in Reports (`Daily occupancy`) or Users (`No users match this search`) depending on the run; prior runs also recorded concurrent report requests, local `workerd` `broken pipe`, and Vite `socket hang up`. This remains a shared/preexisting runner finding; Reports and Users code were not modified.

The A/B attribution is recorded in `.orchestration/evidence/CF-I06-WAVE-0.3-BROWSER-ATTRIBUTION.md`. The current run passes Housekeeping and fails in Reports; the baseline full run fails earlier in Housekeeping because the Wave 0.3 repair is absent. The Wave 0.3 diff contains no Reports or analytics implementation changes.

The V11 contracts were fetched read-only from `origin/analysis/operational-flow-definition-v11` and are not merged into the implementation branch. Wave 1.2 adds the Reception contextual reassignment surface without changing the reassignment domain implementation, D11, Reports or Users.

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
- Wave 1.2 artifact A is published at `4d7c8c69f9d6684094cc78fef70e5e0e5edb850b`; the browser gate remains a promotion blocker and must not be hidden or promoted around.

## NEXT AUTHORIZED ACTION

Hold at the Wave 1.2 Controller checkpoint for External Independent Critic/controller disposition. Do not modify Reports or Users, and do not merge/deploy/promote.

## MODEL ROUTING

- Orchestrator: Luna LOW.
- Browser investigation/QA: Luna MEDIUM.
- Repair: Luna LOW or MEDIUM according to demonstrated complexity.
- Sol MEDIUM only after a substantive Luna MEDIUM investigation is insufficient.
