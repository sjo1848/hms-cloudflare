# TASK CONTRACT — HMS-IMPLEMENTATION-ROADMAP-001

TASK ID: `HMS-IMPLEMENTATION-ROADMAP-001`  
PROJECT: `HMS Cloudflare`  
PHASE: `IMPLEMENTATION ROADMAP PLANNING`  
BRANCH: `planning/hms-implementation-roadmap-f0-a-h`  
REPOSITORY BASE: `00f1ef8af3ad1225669b93ffeed1c327b78771ec`  
AUDITED PRODUCT BASELINE: `b9197e278e227a8e3da5ecb867d6d430f69c1d2f`  
AUTHORITY: Handoff `HMS-CODEX-IMPLEMENTATION-ROADMAP-HANDOFF-009`; frozen Blueprint 001, Reconciliation 007, Final Disposition 008.

## Objective

Produce a complete, repository-grounded, reviewable implementation roadmap for Foundation 0 and Blocks A–H. Distinguish frozen architecture obligations, current repository behavior, existing evidence, proposed contract/evidence, and unanswered product decisions. This is planning only; no product source, schema, or data is changed or executed.

## Deliverables

Under `docs/implementation-roadmap/`:

1. `HMS-IMPLEMENTATION-ROADMAP-MASTER-V1.md` — ordered work, gates, baseline/drift and scope.
2. `HMS-IMPLEMENTATION-ROADMAP-DEPENDENCY-DAG-V1.md` — hard/soft edges, parallel work, integration points.
3. `HMS-FOUNDATION-0-CONTRACT-V1.md` — F0.1–F0.12 contracts and cross-cutting cutover requirements.
4. `HMS-BLOCK-CONTRACTS-A-H-V1.md` — per-block contracts A–H.
5. `HMS-BLUEPRINT-BLOCK-TRACEABILITY-V1.md` — Blueprint requirement owner/dependencies/evidence.
6. `HMS-TEST-EVIDENCE-MATRIX-V1.md` — evidence classes mapped to each F0 and A–H gate.
7. `HMS-ROOM-STATE-CUTOVER-PLAN-V1.md` and `HMS-ACTIVE-STAY-PRICING-BOOTSTRAP-PLAN-V1.md`.
8. `HMS-IMPLEMENTATION-ROADMAP-RISK-REGISTER-V1.md` and `HMS-IMPLEMENTATION-ROADMAP-OPEN-DECISIONS-V1.md`.
9. `HMS-IMPLEMENTATION-ROADMAP-CRITIC-V1.md` only if a distinct, non-author reviewer is available; otherwise record `INDEPENDENT_CRITIC_UNAVAILABLE` and do not simulate.

Also update `.orchestration/STATE.md`, `.orchestration/STATUS.json`, and create `.orchestration/evidence/HMS-IMPLEMENTATION-ROADMAP-001-INVARIANTS.md`.

## Scope / prohibited actions

Read repository, frozen architecture sources, existing audit/evidence and specialist findings. Create roadmap/documentation and governance evidence only. No code, product tests/build required unless a read-only command is needed to establish a repository fact; no migration execution, data mutation, issues, implementation PR, merge, staging, deploy, production, or beginning Foundation 0.

Do not redesign frozen architecture. Any implementation-impossible contradiction must be `ROADMAP_BLOCKER` with exact source and repo citations; do not invent a rule. Foundation sub-gates and bounded questions explicitly accepted by Disposition 008 are not architecture blockers.

## Acceptance

- Read and apply handoff 009 and controlling documents 001/007/008; 007/008 prevail over earlier text.
- Establish exact current branch/HEAD/worktree and remote relation; compare current product-code/migration changes to audited baseline.
- Every F0.1–F0.12 and A–H contract includes objective, requirements, concrete current repo surfaces, dependencies, non-goals, API/data/UI contract, migration/cutover, concurrency/idempotency, compatibility, QA, evidence, Development Gate, Independent Critic, Controller/Human Gate, rollback/recovery and unresolved questions.
- DAG distinguishes hard/soft dependencies, safe parallelism and integration points; F0.12 gates affected A–H, cash validation gates only Block F Cash.
- Trace all required Blueprint categories to a single owning block, dependent blocks and evidence; no orphan/duplicate ownership.
- Cutover plans are data-safe and non-executing; preserve no-false-ready, no fabricated history/payment/charge, explicit ambiguity handling, recovery and reconciliation.
- Test/evidence matrix distinguishes unit/API/D1/concurrency/idempotency/cutover/browser/responsive/accessibility/build/budget/critic evidence; no inherited PASS is claimed as freshly rerun.
- Risk register material only; open decisions limited to actual Controller/Human/Product inputs.
- Independent read-only specialists are used where available; independent critic only if a fresh reviewer not involved in planning is available.
- Pre-Critic checks every requirement and evidence claim, scope, source authority and blocker classification. Invariant file complete before publishing artifact.
- Final state is `ROADMAP_COMPLETE_AWAITING_CONTROLLER_REVIEW`, implementation authorization remains NONE, `resume_authorized=false`, promotion remains BLOCKED.

## Invariant mapping

| Invariant | Classification | Planning acceptance/evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | F0, lifecycle and finance contracts specify exact-winner/zero-row/ABA and all-or-none evidence. |
| INV-AUDIT-001 | APPLIES | Contracts require event iff winning mutation; test matrix checks exact event counts and zero failed side effects. |
| INV-DOMAIN-001 | APPLIES | Lifecycle/HK/maintenance/finance flows remain explicit domain commands; map repo routes and tests. |
| INV-TENANT-001 | APPLIES | Per-block API/RBAC evidence requires tenant-routed success/denial and no cross-tenant drift where relevant. |
| INV-RBAC-001 | APPLIES | F0 capability authority and each protected block retain backend enforcement; denial evidence is specified. |
| INV-PARITY-001 | APPLIES | Blueprint semantics map explicitly to repo behavior/contracts; any differences remain visible, no silent expansion. |
| INV-ENUM-001 | APPLIES | State dimension/value mapping covers legacy DB, API and UI semantic normalization. |
| INV-UX-001 | APPLIES | Blocks retain workflow and context architecture; UX evidence is operational, not page-only. |
| INV-ORDER-001 | APPLIES | Reception/HK queue ordering and next-case evidence are mapped to source/contract rules. |
| INV-RESP-001 | APPLIES | Responsive evidence matrix requires material workflow execution at WIDE/COMPACT/NARROW plus keyboard/reduced-height. |
| INV-EVID-001 | APPLIES | Every claim is tied to immutable source, repository path, test/evidence class or labeled proposal/UNKNOWN. |
| INV-LEGACY-001 | APPLIES | Both cutover plans prohibit anonymous/fabricated recovery records and require provenance if recovery records are created. |
| INV-MONEY-001 | APPLIES | F0.5–F0.9/Block F preserve integer cents, ledger truth, atomicity, idempotency and response-loss tests. |
| INV-STATE-001 | APPLIES | Documentary artifact A then orchestration-only boundary B with exact A SHA; no self-referential SHA. |
| INV-CF-I07-001 | APPLIES | Block G/Admin/Network maps centralized capability checks and forbids role-name bypass. |
| INV-CF-I07-002 | APPLIES | Block G mutation evidence includes semantic no-op/no-audit behavior. |
| INV-CF-I07-003 | APPLIES | Block G downgrade QA specifies same-subject allowed-before/denied-after evidence if that behavior is in scope. |
| INV-CF-I07-004 | APPLIES | Evidence/gate runner contracts require owned process cleanup before PASS markers. |
| INV-CF-I08-001 | APPLIES | Block G reporting evidence retains integer-cent, zero-safe arithmetic. |
| INV-CF-I08-002 | APPLIES | Network evidence proves server-side allow-list aggregation and failure truthfulness. |
| INV-CF-I08-003 | APPLIES | Report date/state semantics remain explicit and tested. |
| INV-CF-I08-004 | APPLIES | Expanded room/maintenance values are cross-module predicates in F0 and Blocks B–G. |
| INV-CF-I08-005 | APPLIES | Hotel-clock/default continuity requirements and deterministic date fixtures mapped. |
| INV-SCOPE-001 | APPLIES | Diff allowlist documentation/governance only; no product artifacts, issue or PR. |

## Stop / publication boundary

Finish the package, perform documentary Pre-Critic, create immutable roadmap artifact A and orchestration-only B if committing is supported by the active runtime. No implementation follows. Stop with `ROADMAP_COMPLETE_AWAITING_CONTROLLER_REVIEW`; the requested Controller/Human gate is approval/rework of this roadmap package only. A later explicit authorization is required before Foundation 0 implementation, schema/data migration, issue/PR, promotion or deployment.
