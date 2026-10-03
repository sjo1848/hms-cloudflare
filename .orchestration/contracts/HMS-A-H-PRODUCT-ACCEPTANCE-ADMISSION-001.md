# Task Contract — Product Acceptance Admission for Integrated A–H Staging Candidate

Status: `FROZEN FOR ADMISSION / NO STAGING ACTION AUTHORIZED`
Task ID: `HMS-A-H-PRODUCT-ACCEPTANCE-ADMISSION-001`
Canonical issue: `https://github.com/sjo1848/hms-cloudflare/issues/56`
Authority: Controller direction in the active project instruction; accepted Block H closure is Issue #54 comment `5963443020`.

## Candidate and branch

- Accepted source candidate: `106b4e98faceaf53a1a0e69650124fff863a9157` — Controller-accepted and remotely verified Block H HEAD.
- Current deployed staging base: `074804329f487c2cfb0a9e5123f1f90b1a0e0252` — remotely verified `acceptance/staging` tip.
- Preparation branch/worktree: `acceptance/hms-a-h-product-acceptance-prep` / `/home/sjo1848/dev/hms-elite-cloudflare/hms-a-h-product-acceptance-prep`, created from the exact accepted H SHA.
- Proposed future staging target: exact source candidate `106b4e98faceaf53a1a0e69650124fff863a9157`; preparation-only commits are governance/evidence and are not the application release target.
- Verified ancestry: merge-base equals current staging base; staging is an ancestor; `0 behind / 12 ahead`; pure fast-forward is mechanically possible, but is not authorized by this contract.

## Objective

Prepare a complete, reviewable admission package for Product Acceptance of the accepted A–H HMS as one integrated staging candidate. Audit exact lineage, every intervening commit/material file, the deployment workflow and its data/configuration impact, and freeze the future authenticated staging acceptance matrix and stop rules.

## Authorized in this task

- Read-only repository/remote-ref/workflow/configuration audit.
- Read-only anonymous HTTP/Cloudflare Access challenge checks.
- Local dependency installation from the unchanged committed lockfile and local production web builds for the two exact source snapshots, solely to compare build/bundle output.
- Preparation-branch orchestration/evidence commits and publication of only this dedicated preparation branch.
- Updating Issues #52 and #56 with factual admission findings.

## Explicitly not authorized

- Moving `acceptance/staging`; triggering or dispatching the staging workflow; deploying Workers; changing Cloudflare Access; any remote D1 read/write beyond the anonymous HTTP probes already performed; fixture reseed or migration execution.
- `main`, merge, production, real hotel data, F-cash/OD-1, Block I, new product behavior, or Wrangler/package/lockfile updates.
- Treating admission PASS as promotion authorization, staging deployment, Human Product Acceptance, or Product Acceptance PASS.

## Frozen requirements and acceptance

| Requirement | Acceptance criterion | Evidence |
|---|---|---|
| PA-01 Exact lineage | Remote accepted H and staging tips match the authorized SHAs; merge-base, ancestry and ahead/behind are recorded; future mechanics are exactly a fast-forward of `acceptance/staging` to H only. | `...-INVENTORY-EVIDENCE-MATRIX.md` and read-only `git ls-remote`/`merge-base`/`rev-list`. |
| PA-02 Candidate audit | Every commit between staging and H and every changed material path is classified as accepted G product, accepted H product/hardening, accepted test/evidence, orchestration metadata, or unexpected/unreviewed. Any unexpected material product/config/schema/dependency change blocks readiness. | Same matrix, exhaustive changed-path manifest, exact Issue #53/#54 Controller records. |
| PA-03 Deployment impact | Workflow trigger/steps, API/Web Worker configuration, Access behavior, migrations, seed preservation, D1 topology, bundle/build and partial-failure behavior are described exactly. No staging mutation is executed. | `...-DEPLOYMENT-IMPACT.md`, unchanged-file diff, Issue #52 Phase 5 evidence, local source builds. |
| PA-04 Prior staging smoke | Determine which prior harness failure is resolved, whether authenticated smoke actually ran, current browser capability, Access login state, and remaining proof. No Access bypass or false acceptance claim. | Issue #52 comments `5946243589` and `5946431862`; Chrome DevTools navigation; anonymous web/API 302 checks. |
| PA-05 Product Acceptance matrix | Freeze the A–H authenticated user journeys and exact viewport/navigation/access/error/recovery assertions; identify every remote mutation as requiring separate Controller authorization and synthetic-only data. | Matrix section “Authenticated smoke matrix”; no smoke run in this admission. |
| PA-06 Invariants | Classify all 24 registry invariants with rationale and evidence scope; distinguish accepted implementation proof from future staging smoke and Human Product Acceptance. | `...-INVARIANTS.md`. |
| PA-07 Admission gate | The self-review may return only `READY TO REQUEST STAGING PROMOTION AUTHORIZATION`; it cannot promote, deploy, mutate remote D1, or declare Product Acceptance. | `...-ADMISSION-PRECRITIC.md` and synchronized `STATE.md`/`STATUS.json`. |

## Proposed mechanics after separate Controller authorization

If and only if the Controller separately authorizes promotion, fast-forward only `acceptance/staging` from `074804329f487c2cfb0a9e5123f1f90b1a0e0252` to the exact H source target `106b4e98faceaf53a1a0e69650124fff863a9157`. That push activates the existing `.github/workflows/deploy-staging.yml` branch-push trigger. Do not use `workflow_dispatch`, a merge commit, or any other branch/ref. This contract does not authorize executing any of those actions.

The full smoke matrix includes read-only journeys and data-changing workflow checks. Any remote D1 mutation required to exercise those commands must be expressly included in the future Controller authorization, use only the initialized synthetic staging fixture, avoid direct SQL, and preserve/reconcile created rows using supported product operations. No real data or Cash workflow is allowed.

## Failure classification and stop rules

- **Critical/security/data integrity:** anonymous access succeeds, tenant/capability bypass, financial/ledger mismatch, migration/data loss, or false success. Stop immediately; do not continue smoke or attempt silent repair.
- **Core workflow:** a contracted A–H journey cannot complete/recover, authoritative state differs, or browser context/history is lost. Stop that acceptance run and report exact route/identity/state/evidence; no Product Acceptance PASS.
- **Operational/integration:** migration pending unexpectedly, seed guard reports partial state, credentials/policy/binding mismatch, API/Web partial deploy, workflow failure, or deployed SHA mismatch. Stop; no bypass, reseed, rollback, or retry that can mutate state without a new Controller direction.
- **Accessibility/responsive:** critical controls unreachable, focus/context contract broken, or severe overflow at a contracted viewport. Record as acceptance failure; do not waive in this admission.
- **Non-blocking cosmetic:** log with exact surface and impact for Controller disposition; do not self-waive material usability or product risks.
- **Rollback:** this admission executes none. The staging workflow has no demonstrated atomic rollback and D1 migrations are not reversed by moving a Git ref. If a later authorized deployment partially fails, stop, preserve evidence/data, and request Controller direction; never force-reset the branch or restore D1 from a guessed snapshot.

## Human Product Acceptance boundary

Only after an independently authorized staging promotion, exact deployed SHA/Workers/migration/preservation/Access verification, and required authenticated A–H smoke can the candidate be presented for Human Product Acceptance. A technical PASS, a staging deploy, or this admission does not equal `PRODUCT_ACCEPTED`.

## Required stop for this task

When lineage/candidate/deployment audits, frozen evidence and admission Pre-Critic pass, publish only the preparation branch and stop at `A_H_STAGING_PROMOTION_READY_AWAITING_CONTROLLER_AUTHORIZATION`. Any material unreviewed candidate change, lineage conflict, unexpected migration/preservation state, Access-policy discrepancy, or other genuine material blocker must instead be recorded in Issue #56 without promotion.
