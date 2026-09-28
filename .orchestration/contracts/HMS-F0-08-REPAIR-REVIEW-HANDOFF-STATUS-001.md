# Task Contract — F0.8 External Review Handoff Status

Task ID: `HMS-F0-08-REPAIR-REVIEW-HANDOFF-STATUS-001`
Parent: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`
Exact prior review pair: A2 `abd9afdd7537ecef29ad4ae099d769c38b137f6d` + B2 `9492f6ba4b866e2e4fefa0fd5a1ae921c1f1ef60`
Status: `FROZEN BEFORE ORCHESTRATION-ONLY REWORK`

## Bounded requirement

Repair only Critic condition `F0.8-IC-A2-B2-01`: persisted dispatch metadata must not say `RUNNING` while the canonical next action passively waits for an Independent Critic. Preserve the frozen Artifact A2 exactly. Record a new orchestration-only boundary B3 with a terminal status, external review required, resume disabled, and explicit stop reason/next action. The repository's existing valid terminal values do not define a dedicated external-review enum; use `READY_TO_RESUME` only as a stopped runtime marker while setting `resume_authorized=false` and `external_review.required=true`. Confirm from `scripts/hms-runtime-watch.sh` that the dispatcher gates on all three and will not resume.

## Acceptance

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Consistent review handoff | `.orchestration/STATE.md`, `.orchestration/STATUS.json` | State and status identify exact A2; status is `READY_TO_RESUME`, `resume_authorized=false`, `external_review.required=true`, with critic as next action and reason review blocks continuation. | JSON parse; state/status consistency assertions; read-only inspection of runtime dispatcher gates. |
| Preserve immutable implementation | Artifact A2 and product tree | No product/schema/test artifact change after A2. | `git diff A2..B3 --` restricted to orchestration metadata and exact comparison. |
| Preserve review separation | Fresh reviewer follow-up | Same critic confirms this bounded condition on exact A2+B3 only; prior `PASS_WITH_CONDITIONS` remains historical unless follow-up explicitly discharges it. | Read-only follow-up evidence. |

## Registry classification

| Invariant | Classification | Rationale |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation changes. |
| INV-AUDIT-001 | N/A | No domain/audit write changes. |
| INV-DOMAIN-001 | N/A | No booking/guest domain behavior changes. |
| INV-TENANT-001 | N/A | No tenant routing changes. |
| INV-RBAC-001 | N/A | No capability changes. |
| INV-PARITY-001 | N/A | No source parity implementation changes. |
| INV-ENUM-001 | N/A | No business enum changes. |
| INV-UX-001 | N/A | No product UI changes. |
| INV-ORDER-001 | N/A | No operational ordering changes. |
| INV-RESP-001 | N/A | No responsive UI changes. |
| INV-EVID-001 | APPLIES | Boundary claim must match canonical persisted state exactly. |
| INV-LEGACY-001 | N/A | No legacy data synthesis. |
| INV-MONEY-001 | N/A | No financial operation changes. |
| INV-STATE-001 | APPLIES | A2 remains immutable; B3 is orchestration-only and points to exact A2. |
| INV-CF-I07-001 | N/A | No admin/network/audit authorization changes. |
| INV-CF-I07-002 | N/A | No admin no-op changes. |
| INV-CF-I07-003 | N/A | No downgrade behavior changes. |
| INV-CF-I07-004 | N/A | No process runner starts. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No analytics fan-out. |
| INV-CF-I08-003 | N/A | No reporting predicates. |
| INV-CF-I08-004 | N/A | No state enum extension. |
| INV-CF-I08-005 | N/A | No date-default/continuity change. |
| INV-SCOPE-001 | APPLIES | Work is limited to exact Critic metadata condition; no product, scope, data, promotion or deployment action. |

## Non-goals

No product change, no re-review of F0.8 functionality, no new status enum, no auto-resume, no PR/push/merge/main/staging/deploy/production, and no Foundation aggregate PASS claim.
