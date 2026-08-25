# HMS Cloudflare — Multi-Context Pre-Critic Admission Gate

Status: `BINDING`  
Applies to: every substantive task/rework from CF-I09 onward and any earlier task reopened after this rule.

This supplements `.orchestration/PRECRITIC-GATE.md`, `.orchestration/MULTIAGENT-EXECUTION.md` and `.orchestration/MODEL-REASONING-POLICY.md`.

Before artifact A publication, Codex MUST prove all of the following:

1. **Orchestration decomposition exists** — implementation work was divided into explicit lanes/scopes/dependencies rather than one undifferentiated pass.
2. **Role/reasoning assignment exists** — every runtime context is recorded with role, lane and reasoning tier (or truthful runtime equivalent) according to `.orchestration/MODEL-REASONING-POLICY.md`.
3. **Implementer and reviewer are separated** — a logically distinct Internal QA/Critic context reviewed the candidate after implementation. If runtime lacks true subagents, the fallback separation is explicitly recorded and cannot be called multi-agent.
4. **Risk lanes are not under-provisioned** — migration, money, tenant/security, concurrency/data-integrity Implementers use at least the `MEDIUM` intent; ordinary bounded Implementers may use `LOW`.
5. **Review roles use review-grade reasoning** — Runtime Orchestrator, Internal QA/Critic and Integration Reviewer use `MEDIUM` intent by default.
6. **HIGH is justified, not default** — any `HIGH` usage identifies the concrete unresolved P0/P1 issue that survived a genuine MEDIUM attempt; broad routine HIGH usage is an admission failure.
7. **Adversarial QA occurred before publication** — the reviewer checked Task Contract requirements, source parity, applicable invariants, negative paths and evidence claims; it did not only rerun happy-path tests.
8. **Automatic rework closure occurred** — every blocking internal finding is repaired and re-tested without Human relay unless a legitimate Human Gate exists.
9. **Integration Review occurred after repairs** — cross-module behavior, inherited regressions, scope boundaries and canonical evidence consistency were checked on the integrated candidate.
10. **Internal review receipt exists** at `.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md` and identifies exact role assignments, checks, findings, escalations and dispositions.
11. **Zero open P0/P1/P2 issues** remain. P3 debt is explicitly listed and cannot undermine a required acceptance claim.
12. **Evidence cannot contradict execution** — if any later run fails/interruption occurs, earlier PASS text is superseded and publication is blocked until fresh closure.
13. **Main Pre-Critic Gate passes only after this gate.** Passing the ordinary gate without this internal-review gate does not admit an artifact to External Independent Critic.
14. **External Critic is the final independent boundary, not routine QA.** A simple deterministic defect that the internal gate could have found must be repaired internally before artifact publication.

Failure of any item is `INTERNAL_ADMISSION_FAIL`; Codex must continue autonomous rework and MUST NOT publish artifact A or stop for the Human.
