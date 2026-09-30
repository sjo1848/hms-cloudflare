# HMS-BLOCK-B-REPAIR-REASSIGN-SUCCESS-NOTICE-001 — Frozen Bounded Repair Contract

Status: `FROZEN BEFORE IMPLEMENTATION`
Parent: `.orchestration/contracts/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001.md`
Finding: during required post-rework `scripts/cf-wave12-reassignment-integrated.sh`, the successful existing reassignment returned HTTP 200 and authoritative queue refresh completed, but the expected user-visible status “Room reassigned” never appeared. In `useReceptionWorkspace.ts`, success was set before `closeCase()` and `load()`; `load()` clears notices, so success feedback is erased. This workflow is regression-only and is not being redesigned.

## Objective and strict scope

Keep the existing success notice observable after the existing reassignment command succeeds, the selected case closes and the authoritative Queue refresh completes. Adjust only notice assignment ordering in `apps/web/src/features/reception/useReceptionWorkspace.ts` and, only if necessary, an assertion in the already-existing `scripts/cf-wave12-reassignment-integrated.playwright.js` to prove the user-visible post-refresh success status. Do not alter command/API/data/lifecycle/quote/permissions behavior or success text. No new workflow/action/surface.

## Invariant mapping

| Invariant | Classification | Acceptance/evidence |
|---|---|---|
| INV-UX-001 | APPLIES | Successful reassignment remains in existing context flow and displays its existing success status after authoritative refresh; integrated browser assertion. |
| INV-DOMAIN-001 | APPLIES | Existing HTTP 200 reassignment and Worker/D1 state remain authoritative and unchanged; wave12 integrated regression. |
| INV-EVID-001 | APPLIES | Exact post-refresh role=status claim is asserted and logged. |
| INV-SCOPE-001 | APPLIES | Diff limited to notice ordering, regression assertion if needed, and evidence/orchestration. No other domain changes. |
| Other registry IDs | N/A for this repair | This presentation-only ordering change does not alter other invariant-controlled behavior; preserve parent evidence and audit the diff. |

## Validation and publication

- Freeze this contract before source edits.
- Re-run the integrated Wave12 Worker+D1/Vite/browser runner to prove HTTP 200, authoritative refresh, visible success status, and unchanged stale 409 path.
- Re-run `npm run check`, type check, production build, architecture/i18n/budget, query plan and Wrangler dry-runs after the final combined CSS/runner/product change.
- Preserve all focused/inherited regression logs and perform `git diff --check`, scope audit, Pre-Critic and invariant evidence.
- The separate WIDE filter repair contract remains in force. Publish one replacement substantive Artifact A containing both bounded repairs and fresh validation, then an orchestration-only Boundary B and a fresh independent read-only critic.

No Human Gate. No new functionality, API/schema/capability/data semantics, Blocks C–H, real data, PR/push/merge/main/staging/deploy/production.
