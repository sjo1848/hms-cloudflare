# <TASK-ID> — Invariant Evidence

Artifact candidate: `<HEAD>`  
Task Contract: `.orchestration/contracts/<TASK-ID>.md`  
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

Use one row per invariant from `.orchestration/INVARIANTS.md`.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES/N/A | PASS/N/A/FAIL | test/script/assertion | |
| INV-AUDIT-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-DOMAIN-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-TENANT-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-RBAC-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-PARITY-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-UX-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-RESP-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-EVID-001 | APPLIES | PASS/FAIL | claim→evidence audit | |
| INV-LEGACY-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-MONEY-001 | APPLIES/N/A | PASS/N/A/FAIL | | |
| INV-STATE-001 | APPLIES | PASS/FAIL | canonical boundary | |
| INV-SCOPE-001 | APPLIES/N/A | PASS/N/A/FAIL | diff/scope audit | |

## Mandatory mutation inventory

List every state-changing business operation in this task and its stale/zero-row behavior.

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| | | | | |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| | | integrated / API-D1 / browser / mock / static |

## Publication decision

- [ ] No applicable invariant is FAIL or UNPROVEN.
- [ ] Full Task Contract validation passed.
- [ ] Scope audit passed.
- [ ] Canonical state points to exact artifact.
- [ ] External review is required and Codex does not self-approve PASS.
