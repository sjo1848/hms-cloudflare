# HMS Cloudflare — Multi-Context Pre-Critic Admission Gate

Status: `BINDING`  
Applies to: every substantive task/rework from CF-I09 onward and any earlier task reopened after this rule.

This supplements `.orchestration/PRECRITIC-GATE.md` and `.orchestration/MULTIAGENT-EXECUTION.md`.

Before artifact A publication, Codex MUST prove all of the following:

1. **Orchestration decomposition exists** — implementation work was divided into explicit lanes/scopes/dependencies rather than one undifferentiated pass.
2. **Implementer and reviewer are separated** — a logically distinct Internal QA/Critic context reviewed the candidate after implementation. If runtime lacks true subagents, the fallback separation is explicitly recorded and cannot be called multi-agent.
3. **Adversarial QA occurred before publication** — the reviewer checked Task Contract requirements, source parity, applicable invariants, negative paths and evidence claims; it did not only rerun happy-path tests.
4. **Automatic rework closure occurred** — every blocking internal finding is repaired and re-tested without Human relay unless a legitimate Human Gate exists.
5. **Integration Review occurred after repairs** — cross-module behavior, inherited regressions, scope boundaries and canonical evidence consistency were checked on the integrated candidate.
6. **Internal review receipt exists** at `.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md` and identifies exact checks/findings/dispositions.
7. **Zero open P0/P1/P2 issues** remain. P3 debt is explicitly listed and cannot undermine a required acceptance claim.
8. **Evidence cannot contradict execution** — if any later run fails/interruption occurs, earlier PASS text is superseded and publication is blocked until fresh closure.
9. **Main Pre-Critic Gate passes only after this gate.** Passing the ordinary gate without this internal-review gate does not admit an artifact to External Independent Critic.
10. **External Critic is the final independent boundary, not routine QA.** A simple deterministic defect that the internal gate could have found must be repaired internally before artifact publication.

Failure of any item is `INTERNAL_ADMISSION_FAIL`; Codex must continue autonomous rework and MUST NOT publish artifact A or stop for the Human.
