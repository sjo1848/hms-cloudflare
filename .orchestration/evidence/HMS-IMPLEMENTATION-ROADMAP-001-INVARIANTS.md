# HMS-IMPLEMENTATION-ROADMAP-001 — Mandatory Invariant Evidence

Artifact type: planning/documentation. Audit baseline: product `b9197e278e227a8e3da5ecb867d6d430f69c1d2f`; repo/documentary baseline inspected at `00f1ef8af3ad1225669b93ffeed1c327b78771ec`. This file proves the roadmap *plans* evidence and preserves constraints; it does not assert application runtime/tests/migrations passed. Evidence sources are the frozen Blueprint 001 / Reconciliation 007 / Final Disposition 008 and the repository paths cited in the roadmap. Independent critic is handled separately.

| Invariant | Status | Planning artifact/evidence and rationale |
|---|---|---|
| INV-ATOMIC-001 | PASS | F0.2/.4/.7/.9, Blocks C/F and matrix define exact-winner mutation, zero-row/stale behavior, business atomicity and adverse D1 evidence. No code mutation claimed. |
| INV-AUDIT-001 | PASS | F0.2/.4/.9 and Blocks C/E/F require event iff winning transition, exact audit/event counts and zero events on rejection. |
| INV-DOMAIN-001 | PASS | Blocks B–F model lifecycle, HK, maintenance, booking/account as explicit domain commands; no generic CRUD redesign. |
| INV-TENANT-001 | PASS | All protected block evidence requires authoritative hotel routing, scoped success/denial and zero cross-tenant side effects. |
| INV-RBAC-001 | PASS | F0.10 and Blocks A/G specify canonical server capability authority and deny-path evidence; client visibility is not authorization. |
| INV-PARITY-001 | PASS | Master/F0/A–H bind to frozen architecture and distinguish observed repo from future contract; no silent feature expansion. |
| INV-ENUM-001 | PASS | F0.1 and Blocks B/D/E require semantic dimension mapping across DB/API/UI and no unknown-to-ready coercion. |
| INV-UX-001 | PASS | Blocks A–H and matrix require workflow/context behavior, not infrastructure-only completion or API-only parity claims. |
| INV-ORDER-001 | PASS | B/E/H and matrix demand deterministic priority fixtures with expected identities independent of target storage/render order. |
| INV-RESP-001 | PASS | Evidence matrix/H require material controls at WIDE/COMPACT/NARROW, reduced height and keyboard/focus; shell-only proof excluded. |
| INV-EVID-001 | PASS | All package files label future evidence vs repo facts; candidate existing tests explicitly not claimed fresh PASS; cutover rehearsal is not real-data cutover. |
| INV-LEGACY-001 | PASS | Room/pricing plans preserve provenance, prohibit fabricated history and require actor/time/reason for corrective adjudication; ambiguous legacy rows quarantined. |
| INV-MONEY-001 | PASS | F0.5–F0.9 and Block F preserve integer cents, payment ledger truth, atomicity, idempotency and response-loss/rollback evidence. |
| INV-STATE-001 | PASS | Task Contract requires artifact A followed by orchestration-only boundary B recording A's exact SHA; no self-referential SHA. |
| INV-CF-I07-001 | PASS | F0.10 / Block G forbid role-name bypass; central capability helper and route scan/positive-negative tests required. |
| INV-CF-I07-002 | PASS | Block G specifies semantic no-op behavior and zero audit rows. |
| INV-CF-I07-003 | PASS | Block G and evidence matrix require same-subject privileged operation allowed before and denied after downgrade. |
| INV-CF-I07-004 | PASS | Evidence matrix and shared evidence rules require runner-owned process cleanup verified before PASS. |
| INV-CF-I08-001 | PASS | Block G and matrix require integer-cent, zero-safe reports with independently calculable fixtures. |
| INV-CF-I08-002 | PASS | Block G requires bounded server-side allow-listed Network aggregation and truthful unavailable-store result. |
| INV-CF-I08-003 | PASS | Block G requires explicit date/range/state semantics and deterministic report fixtures. |
| INV-CF-I08-004 | PASS | F0.1 and Blocks B–G map expanded room/maintenance dimensions into every relevant predicate. |
| INV-CF-I08-005 | PASS | F0.2/.11 and evidence matrix require explicit hotel-local date/clock fixtures, deterministic refresh and continuity. |
| INV-SCOPE-001 | PASS | Master/DAG separate F0, A–H and F-cash conditional gate; no unrelated workflow/backend work is authorized. |

## Pre-Critic Gate (planning artifact)

- **Contract completeness:** Task Contract exists; deliverables, prohibited operations, acceptance and invariant mapping are explicit.
- **Source authority:** Handoff and frozen 001/007/008 were read directly from Drive. 007/008 take precedence over earlier conflicting text. No architecture contradiction was identified.
- **Mutation/concurrency sweep:** every planned financial/lifecycle cutover contract names mutable snapshots, exact winner, stale/ABA and zero-side-effect evidence. Runtime correctness is unproven until future implementation tests.
- **Security sweep:** tenant and server-authoritative capability obligations are mapped; this plan does not claim those future tests have passed.
- **UX parity sweep:** A–H preserve the frozen interaction/workflow architecture; responsive evidence is operation-level.
- **Browser/evidence sweep:** local Worker/D1 vs mock vs synthetic cutover evidence is distinguished; named existing tests are candidates, not fresh execution.
- **Scope audit:** only Markdown/orchestration planning artifacts; no product source/schema/data/issues/PR/merge/staging/deploy action.
- **Blocker classification:** none found. Unknown live-data distribution, cash ownership, and cutover window are bounded Open Decisions, not architecture contradictions.
- **Independent Critic:** Gauss, fresh read-only GPT-6 Luna Medium reviewer; final verdict `PASS` after two bounded review/repair cycles. Initial findings and their corrections are recorded in `docs/implementation-roadmap/HMS-IMPLEMENTATION-ROADMAP-CRITIC-V1.md`. Reviewer confirmed the current DAG edge table/diagram/critical path consistency. No architecture blocker identified.

This PASS applies solely to the completeness and constraint preservation of the *planning evidence*. The roadmap remains `AWAITING_CONTROLLER_REVIEW`; no implementation authorization exists.
