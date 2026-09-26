# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Working directory: `/home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare`
Active branch: `impl/ux-ui-reception-checkin`
Definition artifact A: `23b7da3c9836edfaefa2bcf4943ee27f479b2f2a`
Base snapshot: `6ffd6f9aa8e6836d60cbeba5383494605e5611cc` on `review/ux-operational-current`
Active task: `UX-UI-RECEPTION-CHECKIN-001`
Task Contract: `.orchestration/contracts/UX-UI-RECEPTION-CHECKIN-001.md`
Phase: `Reception + Guided Check-in UI BUILD`
Status: `RUNNING — explicitly authorized by the current Human task request`
Runtime: `RUNNING`, `resume_authorized=false`; prior P0.1 and Wave 1.2 independent reviews remain required before promotion.

This task is limited to the Reception + Guided Check-in interaction reference implementation. Its detailed design contract is the current user request. The named “HMS Cloudflare — Reception + Guided Check-in — UI Contract & Wireframes v1” was not found in the local snapshot, available remote branch trees or searchable Git history; this limitation is recorded in the task contract, and no additional visual behavior is inferred from it. The task-specific Independent Critic boundary will be published after implementation and evidence. No other workflow is authorized.

## P0.1 CURRENT EVIDENCE AND PRE-CRITIC

- Task Contract: `.orchestration/contracts/P0.1-RECEPTION-ARRIVAL-CHECKIN.md`.
- Evidence: `.orchestration/evidence/P0.1-RECEPTION-ARRIVAL-CHECKIN.md` and its `-INVARIANTS.md` companion.
- `npm run check`: `23 files / 91 tests PASS`, including D11 executing D1 `4/4`, front-desk board `2/2`, and concurrent check-in exact-winner `1/1`.
- `npm run types:check`, web build, architecture fitness, i18n, budgets, D1 critical query plans, Wrangler dry-runs and staging SPA config dry-run: PASS. Final JS raw `291301` bytes against `300000` ceiling.
- Directed mock browser at 375/1280: PASS, including dirty Back/Forward, 409/failed refresh, double-submit, no-next focus and URL selection. CF-I04 mock browser at 375/390/430/768/1024: PASS.
- Real local Wrangler Worker + migrated D1 + Vite browser at mobile 375 and desktop 1280: PASS. Actual BLOCKING race returns 409, repairs/refresh then succeeds; NON_BLOCKING advisory succeeds; blocked booking stays unchanged; persisted D1 has exactly one CHECK_IN event per winner and intact invoices/payments. Final isolated fixture `.hms-local/p0-1-aCKaJg`; screenshots under `output/playwright/p0-1-integrated-*`.
- Multi-agent runtime capability: `true`. Separate UX/contract, backend engineering, UX adversarial, DB/Data and final read-only UX review were used; final reviewer findings on URL and no-next focus were repaired and retested. Luna Medium reviewers/engineering; no Sol escalation. Pre-Critic is internal only.
- No schema migration or new lifecycle write path. Front-desk board is the sole runtime queue authority; the unused client/browser-date ranking helper was removed.

Finding `P01-EXT-01`: inherited `npm run test:cf-i04` shell regression fails after successful check-in at reassignment without an invoice (expected 200, got 409). Existing reassignment code conditionally omits `PRICE_RECONCILIATION` when no invoice exists; existing migration 0021 demands that event on repricing. The relevant repository, migration and shell regression script have no P0.1 diff. This is not a P0.1-introduced defect, is **not** represented as a green inherited shell gate, and remains outside check-in scope. Broader V11 Billing-selector coupling is separately deferred as `P01-DEFER-01`; P0.1 does not claim V11-wide Reception parity.

Wave 0.3 and Wave 1.1a are recorded as development passes with the shared/preexisting browser finding; promotion remains blocked. Wave 1.1 backend/domain work reached Controller checkpoint at artifact `b8ed06521d4221fcaac08b838887405339c9cd1e`, using the remote V11 definition branch as read-only contract authority. The external review for Wave 1.2 remains required and is not marked completed.

## PRIOR VALIDATED EVIDENCE (HISTORICAL)

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

## PROMOTION FINDING (NOT A P0.1 DEVELOPMENT BLOCKER)

Required promotion gate: `ux-mobile-browser` — FAIL / FLAKY SHARED RUNNER FINDING.

Housekeeping initial board/date and mutation-refresh race is repaired and the browser trace reaches the end of housekeeping successfully. The shared full gate fails afterward in Reports (`Daily occupancy`) or Users (`No users match this search`) depending on the run; prior runs also recorded concurrent report requests, local `workerd` `broken pipe`, and Vite `socket hang up`. This remains a shared/preexisting runner finding; Reports and Users code were not modified.

The A/B attribution is recorded in `.orchestration/evidence/CF-I06-WAVE-0.3-BROWSER-ATTRIBUTION.md`. The current run passes Housekeeping and fails in Reports; the baseline full run fails earlier in Housekeeping because the Wave 0.3 repair is absent. The Wave 0.3 diff contains no Reports or analytics implementation changes.

The V11 contracts were fetched read-only from `origin/analysis/operational-flow-definition-v11` and are not merged into the implementation branch. Wave 1.2 adds the Reception contextual reassignment surface and the minimum backend repair required by the real integrated flow; D11, Reports and Users remain otherwise unchanged. The separate discovery branch `definition/operational-ux-workflow-roadmap` has completed its documentation-only definition at artifact A `23b7da3c9836edfaefa2bcf4943ee27f479b2f2a`; it does not clear the Wave 1.2 independent-review requirement or promotion block.

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
- Wave 1.2 artifact A is published at `47b9fed9300d1a77f5f20ddafadbd79a5514b6b8`; the browser gate remains a promotion blocker and must not be hidden or promoted around.
- Real integrated E2E evidence is recorded for independent fresh success and conflict sessions against local Wrangler Worker/D1 plus Vite preview at mobile width 375px. The success path persisted the reassignment and D11 repricing; the conflict path preserved booking/billing truth and emitted no partial events.
- The integrated run exposed a duplicate `PRICE_RECONCILIATION` insert in the reassignment repository; artifact A removes the duplicate. The receptionist UI uses the existing per-room `maintenance.read` route because the receptionist role does not have `housekeeping.read`; no capability expansion was made.

## APPROVED ROADMAP DEFINITION

Task Contract: `.orchestration/contracts/UX-OPERATIONAL-WORKFLOW-ROADMAP-001.md`
Scope: workflow discovery/definition only; no production code changes.
Artifact: `docs/ux-operational-workflow-roadmap-001.md`.
Invariant evidence: `.orchestration/evidence/UX-OPERATIONAL-WORKFLOW-ROADMAP-001-INVARIANTS.md`.
Proposed P0: Reception/check-in continuity, reassignment, extension, checkout,
Housekeeping. Proposed P1: new/edit reservation, late arrival, no-show,
cancellation, payments, extra charges, Maintenance. Proposed P2:
administrative/read-only work. First workflow recommendation: Reception
arrival→check-in→next-case continuity.

Human Gate decision `UX-ROADMAP-HG-001` approved P0.1 Reception arrival / guided
check-in with conditions. Other P0 workflows remain outside this increment.
Operator frequency is a qualitative proxy because telemetry and interviews
were unavailable. The local acceptance-runtime attempt did not reach the
browser (`invalid maintenance resolve transition` during migration rehearsal);
this is an inspection limitation, not a production finding.

## NEXT AUTHORIZED ACTION

Complete UX-UI-RECEPTION-CHECKIN-001: implement shadcn Sheet/Drawer responsive check-in surfaces; run directed and integrated Worker/D1 desktop/mobile validation; obtain separate UX/adversarial and QA review; execute Pre-Critic/invariant evidence; then publish artifact A and orchestration boundary B. Stop at the Reception + Check-in UI Controller Checkpoint. Prior P0.1/Wave 1.2 reviews, global browser findings and promotion restrictions remain recorded and unresolved.

## MODEL ROUTING

- Orchestrator: Luna LOW.
- Browser investigation/QA: Luna MEDIUM.
- Repair: Luna LOW or MEDIUM according to demonstrated complexity.
- Sol MEDIUM only after a substantive Luna MEDIUM investigation is insufficient.
