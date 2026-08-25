# HMS Cloudflare — Model / Reasoning Policy by Runtime Role

Status: `BINDING`
Applies to: every new substantive lane, increment or REWORK started after this policy revision. Do not restart already-completed work solely to retrofit model assignment.

Purpose: conserve Codex tokens/credits while preserving enough reasoning capacity for migration, security, money, tenant isolation and independent review. Role separation remains mandatory under `.orchestration/MULTIAGENT-EXECUTION.md`.

## Binding model-family policy

**Luna is the default and primary Codex model family for every runtime role.**

The method MUST NOT choose Terra or Sol merely because a task is important. First increase reasoning effort **inside Luna**. Model-family escalation is narrower and more expensive than reasoning escalation.

Family escalation order:

`Luna → Terra → Sol`

Rules:

1. Start on `Luna` for Orchestrator, Implementers, Internal QA/Critic and Integration Reviewer.
2. Escalate Luna reasoning (`LOW → MEDIUM → HIGH`) before changing family when the runtime supports those levels.
3. `Terra` may be used only for a **bounded task/question** after a genuine Luna attempt at the appropriate reasoning tier is insufficient. Record the concrete failure/reason.
4. `Sol` is **prohibited by default**. It may be used only for a bounded unresolved P0/P1 problem after Luna and then Terra have demonstrably failed or cannot safely resolve the issue.
5. Never move an entire lane/project to Terra or Sol when only one narrow question needs escalation.
6. Routine implementation, formatting, docs, predictable test repair and P3 cleanup stay on Luna.
7. Never claim Luna/Terra/Sol execution that the runtime did not actually expose or use.

## Default role assignment

| Runtime role | Model family | Default reasoning | Rule |
|---|---|---:|---|
| Runtime Orchestrator | `Luna` | `LOW` | Default economical orchestration. Raise to Luna `MEDIUM` for cross-lane architecture/risk planning when needed. |
| Ordinary Implementer | `Luna` | `LOW` | Normal bounded code/config/test work. |
| Migration / money / tenant / security / concurrency Implementer | `Luna` | `MEDIUM` | Required for material migration correctness, integrity, financial, tenant, auth or concurrency work. |
| Internal QA / Critic | `Luna` | `MEDIUM` | Independent adversarial review; LOW is not the approval default. |
| Integration Reviewer | `Luna` | `MEDIUM` | Cross-module, inherited regression, scope and evidence review. |
| Final security/readiness review for migration/release increments | `Luna` | `HIGH` | Narrow final high-risk review where the contract warrants it; still Luna first. |
| Exceptional unresolved P0/P1 | `Terra`, then `Sol` only if necessary | `MEDIUM/HIGH` as justified | Family escalation is last resort and must be bounded. |

## Reasoning escalation inside Luna

Start at the role default.

`Luna LOW → Luna MEDIUM` when any of the following appears:

- architecture or cross-module coupling;
- migration/source-to-target semantic mapping;
- concurrency/atomicity/ABA/stale-write behavior;
- money/invoices/payments/cash closure;
- tenant isolation, RBAC, authentication or security boundaries;
- data reconciliation, backup/restore or rollback reasoning;
- adversarial critique or integration review;
- repeated failure showing the lane is no longer routine.

`Luna MEDIUM → Luna HIGH` only for a concrete high-risk question, final security/readiness review, or unresolved P0/P1 defect that genuinely needs stronger reasoning.

Only after the appropriate Luna tier has been genuinely attempted may the Orchestrator consider `Terra`. Only after a bounded Terra attempt fails may `Sol` be considered for the same unresolved P0/P1 issue.

## Token / credit conservation guard

- Luna is the project default because conserving tokens/credits is an explicit operating constraint.
- Prefer several small Luna contexts with clear scopes over one oversized expensive context.
- Keep ordinary Implementers on Luna LOW.
- Use Luna MEDIUM selectively for risky implementation and reviewer roles.
- Use Luna HIGH narrowly; do not turn it into the default.
- Terra is an exception, not a normal reviewer/implementer choice.
- Sol is the last resort and never the default Orchestrator, Implementer, Critic or Integration model.
- Do not rerun a full lane at a more expensive family when only one bounded issue requires escalation.

## Independence rule

Model strength does not replace reviewer independence.

A Luna MEDIUM/HIGH Implementer cannot approve its own work. Internal QA/Critic and Integration Reviewer remain logically separate contexts/phases according to `.orchestration/MULTIAGENT-EXECUTION.md`.

## Runtime fallback

If the runtime does not expose the named Luna/Terra/Sol families or explicit LOW/MEDIUM/HIGH controls, Codex must map truthfully to the closest available equivalents while preserving the intent:

- cheapest capable coding family/mode for routine work;
- stronger reasoning without changing family first;
- more expensive/stronger family only after demonstrated insufficiency;
- strongest family only for bounded unresolved P0/P1 work.

The internal review receipt must state the actual runtime mapping. Never invent a model family or reasoning tier.

## Pre-publication receipt

Before artifact A, `.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md` must include:

`role/context → lane → actual model family → reasoning tier → escalation reason, if any → outcome`

Any Terra/Sol use must identify:

`bounded problem → Luna attempt/result → Terra attempt/result (when Sol is used) → reason escalation was necessary`

A material deviation from this policy without concrete rationale is `INTERNAL_ADMISSION_FAIL` and must be corrected before publication.
