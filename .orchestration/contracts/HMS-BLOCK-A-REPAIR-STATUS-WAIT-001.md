# Task Contract — Block A external-review wait status

Status: `FROZEN BEFORE REPAIR`
Task ID: `HMS-BLOCK-A-REPAIR-STATUS-WAIT-001`
Artifact A remains immutable: `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867`
Current orchestration boundary: `d9ae9ba2f90e1c1f1c6a2ac09009ccc9cf82b252`

## Finding and objective

Meitner's follow-up accepted the active worktree pointer, canonical-root distinction, exact A, external-review requirement, disabled resume and orchestration-only diff. It found the handoff still directs creation of B after B3 exists and reports `RUNNING` while the only next action is waiting for critic follow-up. Correct only state/dispatch metadata in one new orchestration-only boundary. Use the established runtime state `WAITING_EXTERNAL_REVIEW` (also used by existing project review records); do not use `HUMAN_ACTION_REQUIRED` for an automated critic or `RUNNING` for a passive wait.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Passive critic wait is explicit | `.orchestration/STATUS.json` | `runtime_status=WAITING_EXTERNAL_REVIEW`, `resume_authorized=false`, `external_review.required=true`. | JSON assertions; compare with existing project precedent. |
| No stale boundary creation action | `.orchestration/STATUS.json`, `.orchestration/STATE.md` | Next action is await/collect the Independent Critic follow-up on exact A+B4; no instruction to create B/B3. | Field/text assertions. |
| Immutable artifact identity | `.orchestration/STATUS.json` | `external_review.artifact_head` remains exact A `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867`; active branch/worktree remain exact. | JSON/Git checks. |
| Orchestration-only boundary | Git diff A→B4 | No paths outside `.orchestration/STATE.md`, `.orchestration/STATUS.json`, and this finding's orchestration review evidence. | `git diff --name-status A..B4`, parent and clean-tree checks. |

## Invariants

| Invariant | Classification | Rationale/evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No product mutation. |
| INV-AUDIT-001 | N/A | No product events. |
| INV-DOMAIN-001 | N/A | No domain changes. |
| INV-TENANT-001 | N/A | No tenant access. |
| INV-RBAC-001 | N/A | No authorization changes. |
| INV-PARITY-001 | N/A | No parity behavior changes. |
| INV-ENUM-001 | N/A | No enum changes. |
| INV-UX-001 | N/A | Product UX artifact is unchanged. |
| INV-ORDER-001 | N/A | No queue changes. |
| INV-RESP-001 | N/A | No responsive behavior changes. |
| INV-EVID-001 | APPLIES | Reviewer finding, exact references and follow-up request remain accurately recorded. |
| INV-LEGACY-001 | N/A | No legacy behavior. |
| INV-MONEY-001 | N/A | No financial behavior. |
| INV-STATE-001 | APPLIES | Preserve immutable A and an orchestration-only non-circular boundary; accurately represent blocked external review. |
| INV-CF-I07-001 | N/A | No protected API changes. |
| INV-CF-I07-002 | N/A | No admin mutation changes. |
| INV-CF-I07-003 | N/A | No capability downgrade changes. |
| INV-CF-I07-004 | N/A | No process runner changes. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report range changes. |
| INV-CF-I08-004 | N/A | No state expansion. |
| INV-CF-I08-005 | N/A | No report clock behavior. |
| INV-SCOPE-001 | APPLIES | Strict state/evidence-only diff audit excludes all product/test/data/promotion changes. |

## Prohibited actions and close

Do not modify Artifact A, application, tests, browser evidence, or any Blocks B–H. No real data, PR, merge, staging, deploy or production. Publish the metadata repair as a new boundary, then request critic follow-up against exact A plus that boundary. No Human Gate or ROADMAP_BLOCKER is present.
