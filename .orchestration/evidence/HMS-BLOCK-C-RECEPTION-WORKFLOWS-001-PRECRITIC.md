# Block C Pre-Critic — implementation admission freeze

Task: HMS-BLOCK-C-RECEPTION-WORKFLOWS-001
Base: fc2daa783b8ef361e39e6945dbdfe2bfe6345b98
Branch: impl/hms-block-c-reception-workflows
Phase: pre-implementation

## Admission status

**PASS FOR IMPLEMENTATION ADMISSION ONLY.** This is not implementation validation, Technical PASS or Independent Critic review. Product-code implementation may start because the Task Contract, exact source inventory, API/capability inventory, all-registry classification, requirement/evidence matrix and reviewer observations are frozen in this documentation commit. No implementation result is claimed yet.

## Pre-code adversarial findings addressed in contract

- Existing source has only Check-in URL task state; create/edit/reassign/checkout are inline or local toggles. Contract requires each new task route, Case identity, browser/application Back ordering and preserved lane/search/filter/query/hash/scroll/focus.
- Existing Edit and Checkout success paths close the Case before authoritative refresh. Contract requires task stay open until fresh result; preserve context/draft on errors.
- Creation is a staged recoverable operation, not one guest+booking transaction. Contract preserves exact operation token+payload on uncertainty; changed payload is a new operation, with an authoritative operation lookup before recovery.
- Reassignment must keep quote token bound to the exact effective remaining interval and current versions; a 409 discards/reloads/requotes instead of retrying stale data.
- Checkout policy choice is not evidence of settlement; F0.7 server ledger/account guard and override capability/reference stay authoritative.
- Extension, No-show and Late Arrival are absent from complete backend/domain/capability contract and are explicitly deferred. No UI-only substitute is allowed.
- Existing browser runner caveats and limits are disclosed in the evidence matrix; mocks/screenshots cannot prove integrated behavior.
- Five separate read-only reviewers inspected distinct lenses: lifecycle/domain, UX/interaction, concurrency/idempotency, responsive/accessibility and QA/evidence. They found no ROADMAP_BLOCKER for the five supported workflows. Their exact observations are recorded in the frozen inventory and their messages are not treated as Independent Critic approval.

## Contract and invariant gate

- Scope and forbidden D–H/promotion/real-data actions are explicit.
- All 24 registry invariant IDs are classified APPLIES or N/A in HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INVARIANTS.md.
- Requirement → surface → acceptance → evidence is frozen in HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-EVIDENCE-MATRIX.md and the Task Contract.
- No unresolved product policy, new lifecycle meaning, architecture topology or backend contract is presumed. If code reveals that a current approved capability cannot meet the requirement, stop that subproblem as ROADMAP_BLOCKER.
- Budget baseline and active ceilings are frozen; no ceiling increase authorized.

## Required final gate (not yet evaluated)

Before Artifact A: run all contract validations and adversarial scenarios; update the invariant evidence with PASS/N/A evidence; update this Pre-Critic with actual results; check exact claims/limitations, bundle deltas, process cleanup, diff/scope/route checks and Block B regressions. Any applicable invariant FAIL/UNPROVEN blocks artifact publication and is repaired before proceeding. Then freeze A and create orchestration-only B for separate read-only Independent Critic.
