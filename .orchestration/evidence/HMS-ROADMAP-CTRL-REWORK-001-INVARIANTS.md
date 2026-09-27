# HMS-ROADMAP-CTRL-REWORK-001 — Invariant Evidence

Artifact candidate: pending A2 commit (this evidence is part of Artifact A2)
Task Contract: `.orchestration/contracts/HMS-ROADMAP-CTRL-REWORK-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

This is documentary roadmap rework only. No business mutation, build, migration, test execution, product source edit, or data action was performed.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | CTRL-RM-03 checked across Block F, traceability, evidence matrix, Master; cash arithmetic is received-payment-only. | No runtime operation changed. |
| INV-AUDIT-001 | APPLIES | PASS | F0/Block contracts retain exact event/idempotency requirements; no behavioral claims were changed. | Documentary preservation only. |
| INV-DOMAIN-001 | APPLIES | PASS | Contract inventories distinguish route/domain source files and future surfaces; no generic CRUD capability added. | No implementation. |
| INV-TENANT-001 | APPLIES | PASS | F0.2/F0.8 and Block G surface paths identify actual tenant-aware route/capability sources; path checker found no unexplained absent path. | 9 explicitly absent paths are marked absent, not current. |
| INV-RBAC-001 | APPLIES | PASS | Actual `apps/api/src/auth/capabilities.ts`, route files and UI consumers remain identified; no frontend authority substitution proposed. | — |
| INV-PARITY-001 | APPLIES | PASS | Frozen Blueprint files were not modified; only roadmap corrections CTRL-RM-01..04. | — |
| INV-ENUM-001 | APPLIES | PASS | Existing state/capability contracts unchanged; no enum or predicate was redefined. | — |
| INV-UX-001 | APPLIES | PASS | Block E parallelism adjustment retains Reception integration checkpoint; no workflow design altered. | — |
| INV-ORDER-001 | APPLIES | PASS | E/B dependency correction retains integration prerequisite before C/H; queue semantics unchanged. | — |
| INV-RESP-001 | APPLIES | PASS | Existing responsive evidence requirements retained in Block/Evidence contracts. | No new responsive implementation claimed. |
| INV-EVID-001 | APPLIES | PASS | `HMS-ROADMAP-REPOSITORY-SURFACE-AUDIT-V1.md`; final path check: 111 unique explicit path refs, 102 present, 9 explicitly absent/negated, 0 unexplained absent; `git diff --check` PASS. | Test candidates are explicitly not claimed freshly executed. |
| INV-LEGACY-001 | APPLIES | PASS | Room State Cutover and Active-Stay Pricing Bootstrap plans retain quarantine/provenance and no-false-ready rules. | CTRL-RM corrections do not change cutover policy. |
| INV-MONEY-001 | APPLIES | PASS | Booking Account/Folio grain remains Booking/Stay; Cash and Receivables explicitly separate in Block F, Master, Traceability and Test Matrix. | Pending/credit amounts affect no cash metrics. |
| INV-STATE-001 | APPLIES | PASS | A2 then orchestration-only B2 publication plan is recorded; no self-approved PASS. | Final controller review remains required. |
| INV-CF-I07-001 | APPLIES | PASS | Block G continues to cite centralized capability authority and actual admin route; no role bypass proposed. | — |
| INV-CF-I07-002 | APPLIES | PASS | Block G no-op/audit requirements preserved. | No mutation behavior changed. |
| INV-CF-I07-003 | APPLIES | PASS | Block G downgrade evidence requirement preserved. | — |
| INV-CF-I07-004 | APPLIES | PASS | Exact regression candidates remain listed; no runner PASS claim made. | — |
| INV-CF-I08-001 | APPLIES | PASS | Reports contract retains cents/zero-safe assertions; financial terminology corrections do not alter metrics. | — |
| INV-CF-I08-002 | APPLIES | PASS | Network API surface maps to actual analytics/admin source files; contract unchanged. | — |
| INV-CF-I08-003 | APPLIES | PASS | Report date/state requirements retained. | — |
| INV-CF-I08-004 | APPLIES | PASS | Existing canonical state predicate requirements retained. | — |
| INV-CF-I08-005 | APPLIES | PASS | Deterministic clock/continuity requirements retained. | — |
| INV-SCOPE-001 | APPLIES | PASS | `git diff --name-only` limited to roadmap documents and orchestration/evidence; no product code, schema, tests, packages or runtime configuration. | No implementation started. |

## Mandatory mutation inventory

No state-changing business operation exists in this documentary task.

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| N/A | No product operation performed | N/A | No business events written | N/A |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Declared current repository paths exist | Automated filesystem check of explicit path references in roadmap docs: 111 unique references; 102 exist; 9 are explicitly absent/negated; none unexplained | static |
| E has no B start dependency and keeps integration checkpoint | Master, DAG graph/edge/critical path, Block E contract, parallelism text | static |
| Cash excludes Receivables from reconciliation arithmetic | Block F-cash, Master, Traceability, Evidence Matrix | static |
| Account financial grain is Booking/Stay | Master, F-account contract, Traceability, Evidence Matrix | static |
| Formatting check passes | `git diff --check` exit 0 | static |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Full Task Contract documentary validation passed, subject to fresh Critic confirmation.
- [x] Scope audit passed.
- [ ] Canonical state points to exact artifact (to be set by B2).
- [x] External review is required; Codex does not self-approve substantive PASS.
