# HMS Cloudflare — Binding Multi-Context Execution Protocol

Status: `BINDING`  
Method objective: keep the Human out of routine relay/rework and ensure External Independent Critic receives a mature candidate rather than discovering ordinary implementation/test/evidence defects one at a time.

## Roles

### Runtime Orchestrator

Owns canonical state, Task Contract decomposition, lane assignment, dependency ordering, rework routing, integration sequencing and publication readiness. It does not treat a worker's self-report as PASS.

### Implementer context

Owns bounded code/config/test changes for an assigned lane. It may self-test but cannot approve its own lane for external publication.

### Internal QA / Critic context

Must be logically separated from the Implementer context that authored the candidate. Its job is adversarial review against the Task Contract, source semantics, invariants and executable evidence. It must attempt to falsify claims and report findings by severity. It must not merely restate Implementer evidence.

### Integration Reviewer context

Reviews the integrated candidate after lane repairs. It checks cross-module behavior, inherited regressions, scope boundaries, canonical evidence claims and publication readiness. Integration Review is separate from ordinary implementation work.

### External Independent Critic

ChatGPT/external controller reviews only after internal closure. It remains independent and may issue PASS / REWORK / HUMAN_GATE. It should not be the routine detector of simple script/document mismatch, incomplete known-width coverage or other defects the internal gate can deterministically catch.

### Human

Product/Risk Authority only. Routine technical rework, test repair, evidence correction and orchestration decisions are not Human Gates.

## Required autonomous loop

For every substantive increment or REWORK:

`plan → decompose lanes → implement → lane self-tests → Internal QA/Critic → automatic repair → re-test → Integration Review → automatic repair if needed → full regression → evidence claim audit → Pre-Critic Gate → artifact A → boundary B → External Independent Critic`

REWORK is work, not permission. Codex must autonomously loop internally until publication admission criteria are satisfied or a legitimate Human Gate is reached.

## Independence rule

A candidate cannot be considered internally closed when the same logical context both authored a material change and is the sole reviewer asserting that change is correct. Use separate subagent/context execution where the runtime supports it.

If the runtime cannot spawn true parallel/subagent contexts, it must emulate separation with explicit fresh review phases that do not inherit the Implementer's conclusions as assumptions. It must state this fallback truthfully; it must never claim multi-agent execution that did not occur.

## Internal review receipt

Before any substantive artifact A is published, create/update:

`.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md`

It must contain:

1. **Orchestrator decomposition** — lanes/scopes/dependencies.
2. **Implementer receipt** — changed surfaces and lane tests.
3. **Internal QA/Critic receipt** — adversarial findings, including zero-findings only with exact checks performed.
4. **Repair disposition** — every finding closed, superseded with evidence, or classified as legitimate debt/Human Gate.
5. **Integration Review receipt** — cross-module/inherited/evidence/scope outcome.
6. **Open severity ledger** — no open blocking P0/P1/P2 issue before publication.
7. **Pre-Critic admission** — explicit confirmation that executable evidence and claims agree.

An absent or self-contradictory internal review receipt makes the artifact ineligible for External Independent Critic.

## Severity and external-loop policy

- **P0/P1:** security, tenant isolation, money, data integrity/loss, migration correctness, irreversible operations, material domain semantics. Blocks publication/PASS.
- **P2:** materially broken product behavior or required UX/workflow. Blocks publication/PASS.
- **P3:** documentation polish, redundant/non-material evidence or low-risk cleanup. Must normally be repaired or recorded internally and must not create an external REWORK unless it undermines proof of a contracted P0/P1/P2 behavior or makes canonical evidence untrustworthy.

This severity rule does not allow a Task Contract to be silently weakened. A required acceptance criterion remains required; the purpose is to stop ordinary deterministic evidence defects before publication and avoid external ping-pong.

## Human Gate taxonomy

Human Gate only for:

- paid resource/cost transition;
- material product-intent decision;
- significant security/risk tradeoff that cannot be resolved from accepted policy;
- irreversible external provisioning/cutover or real production data action;
- final Human Product Acceptance.

Everything else routes through autonomous technical rework.

## Publication rule

Artifact A may be published only after the Internal QA/Critic and Integration Reviewer receipts are closed and the binding Pre-Critic Gate passes. Boundary B then stops execution for External Independent Critic.

The Human must not be used as a routine message bus between Orchestrator, Implementer, QA/Critic, Integration Reviewer or External Independent Critic.
