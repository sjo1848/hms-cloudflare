# HMS Cloudflare — Model / Reasoning Policy by Runtime Role

Status: `BINDING`
Applies to: every new substantive increment or REWORK started after this policy is published. Do not rewrite an already-published immutable artifact solely to retrofit this policy.

Purpose: assign enough reasoning capacity to each Codex runtime role without spending high-reasoning capacity on routine implementation. Role separation remains mandatory under `.orchestration/MULTIAGENT-EXECUTION.md`.

## Model-family rule

Use the current approved Codex coding model available in the runtime. Do not hard-code a transient product/model name into the method when availability can change. The binding part of this policy is the **reasoning tier and escalation rule per role**.

If the runtime exposes several coding-model families, the Orchestrator may select among them, but it must preserve or exceed the capability implied by the reasoning tier below and record any material deviation in the internal review receipt.

## Default role policy

| Runtime role | Default reasoning tier | Rule |
|---|---:|---|
| Runtime Orchestrator | `MEDIUM` | Planning, decomposition, dependency/risk analysis, rework routing and publication readiness require cross-lane reasoning. |
| Ordinary Implementer | `LOW` | Default for bounded code/config/test implementation with clear contract and no P0/P1 risk. |
| Migration / money / tenant / security Implementer | `MEDIUM` | Required when the lane can affect migration correctness, data integrity, financial semantics, tenant isolation, authorization, concurrency or irreversible-risk preparation. |
| Internal QA / Critic | `MEDIUM` | Must reason adversarially and independently from the Implementer; LOW is not the default for approval-quality review. |
| Integration Reviewer | `MEDIUM` | Required for cross-module behavior, inherited regressions, scope/evidence consistency and final internal admission. |
| Exceptional unresolved P0/P1 analysis | `HIGH` | Escalation only; never default. Use only when MEDIUM cannot close a concrete high-risk defect or ambiguity. |

## Escalation rule

Start at the role default. Escalate only when there is a concrete reason.

`LOW → MEDIUM` when any of the following appears:

- architecture or cross-module coupling;
- migration/source-to-target semantic mapping;
- concurrency/atomicity/ABA/stale-write behavior;
- money/invoices/payments/cash closure;
- tenant isolation, RBAC, authentication or security boundaries;
- data reconciliation, backup/restore or rollback reasoning;
- adversarial critique or integration review;
- repeated failure that suggests the lane is not routine anymore.

`MEDIUM → HIGH` only when:

- a specific unresolved P0/P1 defect remains after a genuine MEDIUM attempt; or
- the Orchestrator can identify a concrete high-risk ambiguity that cannot be safely resolved at MEDIUM.

The escalation reason and result must be recorded in `.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md`.

## Cost/efficiency guard

- `LOW` is the implementation default, not the project-wide default.
- `MEDIUM` is the review/risk default.
- `HIGH` is exceptional and must not be used for routine coding, formatting, documentation, ordinary test fixes or predictable P3 cleanup.
- Do not rerun a whole lane at HIGH when only one narrow P0/P1 question requires escalation; isolate the hard question where the runtime permits.

## Independence rule

Reasoning tier does not replace reviewer independence.

A MEDIUM Implementer cannot approve its own work merely because it used more reasoning. Internal QA/Critic and Integration Reviewer remain logically separate contexts/phases according to `.orchestration/MULTIAGENT-EXECUTION.md`.

## Runtime fallback

If the runtime does not expose explicit `LOW / MEDIUM / HIGH` controls, Codex must emulate the intent as closely as possible:

- ordinary implementation = economical/default coding mode;
- risk/review/integration = stronger reasoning mode;
- exceptional P0/P1 escalation = strongest available reasoning mode.

The internal review receipt must state the truthful runtime mapping. Never claim a reasoning tier or model assignment that was not actually available/executed.

## Pre-publication receipt

Before artifact A, the internal review receipt must include a compact role table:

`role/context → lane → reasoning tier (or truthful runtime equivalent) → escalation, if any → outcome`

A material deviation from this policy without rationale is an `INTERNAL_ADMISSION_FAIL` and must be corrected before publication.
