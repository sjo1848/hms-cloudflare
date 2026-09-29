# HMS-F0-11-CRITIC-HANDOFF-RECONCILIATION-001 — Bounded Orchestration Repair

Status: `FROZEN BEFORE METADATA CHANGE`
Authority: fresh Independent Critic `REWORK` on exact Artifact A2 `f7c8d28db1ce1dd6839f1f182260537f0e2d4898` + Boundary B4 `173aed525d42198012d89d386ff60eafe3138e78`.
Scope: metadata/evidence reconciliation only. Artifact A2 and all product/test/evidence blobs within A2 remain immutable.

## Objective

Make the exact-pair Independent Critic handoff internally consistent after B3 was superseded by B4 for the separately discovered stale F0.10 boundary field.

## Findings → acceptance → evidence

| Finding | Acceptance | Evidence |
|---|---|---|
| `F0-11-IC-A2-B4-01 HIGH`: `STATUS.json.external_review.review_path` still names the never-reviewed A2+B3 report path | B5 identifies exact A2 and itself; `review_path` names the exact intended A2+B5 review output; `last_audited_head` records B4 as the last actually reviewed boundary; `last_verdict` preserves the B4 `REWORK` without transferring it | exact B5 machine state and preserved B4 Critic report |
| `F0-11-IC-A2-B4-02 MEDIUM`: immutable A2 Pre-Critic/invariant prose names the originally intended B3 boundary | Do not rewrite A2. B5/STATE explicitly classify A2's B3 wording as historical packaging text superseded by B4, preserve its meaning, and direct the new reviewer to exact A2+B5 | B5 state plus this frozen contract and the B4 Critic report |

## Invariant mapping

| Invariant | Class | Rationale / evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation or product behavior changes. |
| INV-AUDIT-001 | N/A | No business audit/event changes. |
| INV-DOMAIN-001 | N/A | No domain behavior changes. |
| INV-TENANT-001 | N/A | No data access/routing changes. |
| INV-RBAC-001 | N/A | No authorization changes. |
| INV-PARITY-001 | N/A | No source/domain parity behavior changes. |
| INV-ENUM-001 | N/A | No enum changes. |
| INV-UX-001 | N/A | No user-facing behavior changes. |
| INV-ORDER-001 | N/A | No queue/order behavior changes. |
| INV-RESP-001 | N/A | No responsive behavior changes. |
| INV-EVID-001 | APPLIES | Preserve exact prior verdict and distinguish historical A2 prose from the exact current A2+B5 handoff; B4 critic response is retained verbatim in substance. |
| INV-LEGACY-001 | N/A | No recovery record behavior changes. |
| INV-MONEY-001 | N/A | No financial state/calculation changes. |
| INV-STATE-001 | APPLIES | Immutable A2 plus new orchestration-only B5 identifies exact A2, disables resume and requires a new fresh critic; no self-SHA or self-approval. |
| INV-CF-I07-001 | N/A | No privileged route changes. |
| INV-CF-I07-002 | N/A | No admin mutation changes. |
| INV-CF-I07-003 | N/A | No downgrade behavior changes. |
| INV-CF-I07-004 | N/A | No process runner changes. |
| INV-CF-I08-001 | N/A | No reporting arithmetic changes. |
| INV-CF-I08-002 | N/A | No network aggregation changes. |
| INV-CF-I08-003 | N/A | No reporting query/date behavior changes. |
| INV-CF-I08-004 | N/A | No state enum expansion. |
| INV-CF-I08-005 | N/A | No reporting clock/continuity behavior changes. |
| INV-SCOPE-001 | APPLIES | Only `.orchestration/STATE.md`, `.orchestration/STATUS.json`, and this review-disposition evidence may change; A2 and product files stay identical. |

## Forbidden

- Do not amend, cherry-pick, rewrite or otherwise change A2.
- Do not claim the B4 `REWORK` is a product defect or an Independent Critic PASS.
- Do not change `external_review.required` to false, enable resume, or declare F0.11/F0.12 PASS.
- No real data, migration/cutover, PR, push, merge, main, staging, deploy, production or Blocks A–H.

## Pre-Critic and gate

The final Pre-Critic must verify exact A2 hash/content unchanged, B5 only changes orchestration/evidence files, valid JSON, exact future review path, correct historical `last_audited_head`, monotonically incremented event sequence, external review required, and resume disabled. Then freeze B5 and request a fresh independent Critic on A2+B5.

This bounded metadata repair does not close F0.11 or Foundation 0.
