# PM-INVARIANTS-001 — Learned Invariants and Pre-Critic Admission Gate

Status: `APPROVED / BINDING`  
Effective: immediately, including the active CF-I05 REWORK.

## Decision

Defect classes that have already been discovered by Independent Critic are promoted into durable reusable invariants. Codex must prove applicable learned invariants before a substantive artifact is admitted to External Independent Critic.

Binding artifacts:

- `.orchestration/INVARIANTS.md`
- `.orchestration/PRECRITIC-GATE.md`
- `.orchestration/evidence/INVARIANT-EVIDENCE-TEMPLATE.md`

## Operating rule

For every new Task Contract and every substantive REWORK:

1. Codex reads the invariant registry before planning.
2. Applicable invariant IDs are mapped to acceptance/evidence.
3. Codex runs the mandatory Pre-Critic Gate before artifact publication.
4. Codex persists `.orchestration/evidence/<TASK-ID>-INVARIANTS.md`.
5. Any applicable invariant that is `FAIL` or `UNPROVEN` blocks artifact publication and is repaired autonomously.
6. External Independent Critic remains mandatory at the substantive boundary; this decision does not permit self-PASS.

## Defect promotion

When a future Independent Critic discovers a root-cause pattern that can recur across tasks/projects, the reusable rule must be added to `.orchestration/INVARIANTS.md` before the next delivery wave begins.

This is intentionally different from recording a bug history. The registry stores recurring correctness rules.

## Purpose

Reduce repeated Critic/REWORK cycles by moving known failure detection earlier into Codex self-adversarial QA, while preserving independent external review.

## Human Gate

None. This changes execution quality control under the already-approved Project Method; it does not alter product intent, architecture, cost, security acceptance, migration/cutover or Product Acceptance authority.
