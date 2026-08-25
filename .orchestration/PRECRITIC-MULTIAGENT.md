# HMS Cloudflare — Multi-Context Pre-Critic Admission Gate

Status: `BINDING`  
Applies to: every substantive task/rework from CF-I09 onward and any earlier task reopened after this rule.

This supplements `.orchestration/PRECRITIC-GATE.md`, `.orchestration/MULTIAGENT-EXECUTION.md` and `.orchestration/MODEL-REASONING-POLICY.md`.

Before artifact A publication, Codex MUST prove all of the following:

1. **Orchestration decomposition exists** — implementation work was divided into explicit lanes/scopes/dependencies rather than one undifferentiated pass.
2. **Model-family + reasoning assignment exists** — every runtime context is recorded with role, lane, actual model family and reasoning tier (or truthful runtime equivalent) according to `.orchestration/MODEL-REASONING-POLICY.md`.
3. **Luna-first policy was followed** — all roles start from Luna unless a specific recorded family-escalation condition applies. Terra/Sol cannot be chosen merely because a task is important.
4. **Implementer and reviewer are separated** — a logically distinct Internal QA/Critic context reviewed the candidate after implementation. If runtime lacks true subagents, the fallback separation is explicitly recorded and cannot be called multi-agent.
5. **Risk lanes are not under-provisioned** — migration, money, tenant/security, concurrency/data-integrity Implementers use at least `Luna MEDIUM` intent; ordinary bounded Implementers may use `Luna LOW`.
6. **Review roles use review-grade reasoning** — Internal QA/Critic and Integration Reviewer use `Luna MEDIUM` by default. Orchestrator uses `Luna LOW` by default and escalates to `Luna MEDIUM` only when cross-lane complexity requires it.
7. **Family escalation is proven necessary** — any Terra usage identifies the bounded problem and prior Luna attempt/result. Any Sol usage additionally identifies the prior bounded Terra attempt/result. Missing this chain is an admission failure.
8. **HIGH is justified, not global** — Luna HIGH is narrow/final-risk reasoning, not a routine project default. Sol is not a synonym for HIGH and remains prohibited by default.
9. **Adversarial QA occurred before publication** — the reviewer checked Task Contract requirements, source parity, applicable invariants, negative paths and evidence claims; it did not only rerun happy-path tests.
10. **Automatic rework closure occurred** — every blocking internal finding is repaired and re-tested without Human relay unless a legitimate Human Gate exists.
11. **Integration Review occurred after repairs** — cross-module behavior, inherited regressions, scope boundaries and canonical evidence consistency were checked on the integrated candidate.
12. **Internal review receipt exists** at `.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md` and identifies exact model/role assignments, checks, findings, escalations and dispositions.
13. **Zero open P0/P1/P2 issues** remain. P3 debt is explicitly listed and cannot undermine a required acceptance claim.
14. **Evidence cannot contradict execution** — if any later run fails/interruption occurs, earlier PASS text is superseded and publication is blocked until fresh closure.
15. **Main Pre-Critic Gate passes only after this gate.** Passing the ordinary gate without this internal-review/model-family gate does not admit an artifact to External Independent Critic.
16. **External Critic is the final independent boundary, not routine QA.** A simple deterministic defect that the internal gate could have found must be repaired internally before artifact publication.

Failure of any item is `INTERNAL_ADMISSION_FAIL`; Codex must continue autonomous rework and MUST NOT publish artifact A or stop for the Human.
