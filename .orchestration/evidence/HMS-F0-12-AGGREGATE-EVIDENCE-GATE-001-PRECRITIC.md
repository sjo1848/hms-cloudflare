# Pre-Critic — HMS-F0-12 Aggregate Evidence / Activation Gate

Task Contract: `.orchestration/contracts/HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001.md`.
Gate type: contract-admission Pre-Critic, before evidence consolidation/runner changes.

## Contract completeness / source parity

- PASS: authority is the frozen Foundation 0 contract §F0.12, A2/B2 roadmap, evidence matrix, cutover/bootstrap plans, frozen Blueprint/Reconciliation/Final Disposition. No TO-BE or product semantics are changed. Individual cutover/bootstrap acceptance rows are not claimed PASS until the aggregate crosswalk supplies exact evidence.
- PASS: scope explicitly limits work to F0.1–F0.11 aggregate evidence and synthetic cutover/bootstrap readiness; real data, Blocks A–H, PR/push/merge/main/staging/deploy/production are forbidden.
- PASS: increment-level evidence preserves exact artifact identities and prior critic dispositions; `PASS_WITH_CONDITIONS` conditions must have linked closure proof. No verdict is transferable across artifact pairs.
- PASS: synthetic hotel/record examples are individually named and distinguished; F0.3 readiness spelling remains exactly `READY_FOR_ARRIVAL`; `UNRESOLVED`, `HELD`, and other quarantine states cannot count as activation-eligible or be relabeled READY. Records are reported as isolated test assertions, never current persisted hotel inventory.
- PASS: F0.12 gate output is explicitly not live-data authorization or promotion approval.

## Invariant admission map

| Invariant | Class | Adversarial acceptance before publication |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Missing zero-drift/race/replay evidence remains UNPROVEN; synthetic repeat is exact and no real mutation path runs. |
| INV-AUDIT-001 | APPLIES | Every mutation claim links winner/event evidence; rejected paths link zero-event/no-drift evidence. |
| INV-DOMAIN-001 | APPLIES | Per-increment semantics remain separate; aggregate status cannot erase holds or domain blockers. |
| INV-TENANT-001 | APPLIES | Synthetic hotels remain separate; foreign/missing identity cannot be counted as reconciled. |
| INV-RBAC-001 | APPLIES | F0.10 exact backend capability and denial evidence is required, not inferred from UI visibility. |
| INV-PARITY-001 | APPLIES | Every acceptance maps to frozen authority; do not fill missing coverage by inventing convenient behavior. |
| INV-ENUM-001 | APPLIES | Unknown classifications/status/checkpoints fail closed and are not normalized into success. |
| INV-UX-001 | APPLIES | Required integrated UI rows cannot be replaced by mock/API-only evidence. |
| INV-ORDER-001 | APPLIES | F0.11 next-case/queue evidence must use fixed expected identity, not the target's own first item. |
| INV-RESP-001 | APPLIES | Viewport-specific proofs remain exact; do not infer narrow/mobile from desktop. |
| INV-EVID-001 | APPLIES | Each claim records immutable input, command, fixture, exit, output path/hash; missing/interrupted means UNPROVEN. |
| INV-LEGACY-001 | APPLIES | Unknown/unresolved rows stay quarantined; no anonymous, READY or sellable fallback. |
| INV-MONEY-001 | APPLIES | Financial aggregate cites exact cents, invoice/payment ledger, charge and payment preservation evidence; no inferred historical pricing. |
| INV-STATE-001 | APPLIES | Exact immutable A then orchestration-only B; exact critic pair; no self-SHA or self-PASS. |
| INV-CF-I07-001 | APPLIES | F0.10 capability evidence is explicitly included and checked for role-name bypass. |
| INV-CF-I07-002 | APPLIES | F0.10 no-op write/audit proof is explicitly included. |
| INV-CF-I07-003 | APPLIES | F0.10 downgrade uses same subject and operation before/after. |
| INV-CF-I07-004 | APPLIES | Fresh runner owns and verifies process cleanup; no terminal PASS before cleanup. |
| INV-CF-I08-001 | N/A | No reporting arithmetic is changed or claimed in Foundation 0. |
| INV-CF-I08-002 | N/A | No network aggregation changes or claims. |
| INV-CF-I08-003 | N/A | No report date/state behavior changes or claims. |
| INV-CF-I08-004 | N/A | No CF-I08 state expansion; F0 classifications remain covered by INV-ENUM-001. |
| INV-CF-I08-005 | N/A | No reporting clock/continuity changes. |
| INV-SCOPE-001 | APPLIES | Diff audit permits only F0.12 contract/evidence, justified validator and orchestration; unrelated worktree edits remain excluded. |

## Mutation, security and scope adversarial checks

- No live/customer D1 binding, default persistent Wrangler state, production or source reference store may be read or written. Every executing-D1 run must create isolated synthetic databases and report identities.
- No F0.12 report may claim a customer hotel is clear based on synthetic fixture results. F0.3's accepted-digest path writes a test-scoped simulation marker; F0.6 executes a synthetic activation that writes pricing segments in its isolated test D1. Neither authorizes or represents live activation.
- A missing report, missing digest, unresolved evidence reference, nonzero command exit, stale artifact SHA, omitted tenant, unknown row class or different second-generation checksum must fail aggregate readiness.
- Existing shared Reports/Users/workerd and inherited CF-I04 findings remain promotion findings; do not modify them or fold them into F0.12.
- Existing dirty output/screenshots/scripts are user-owned/out-of-scope unless proven to be exact contracted F0.12 evidence; do not clean, reset or stage them.

## Evidence claim audit / publication boundary

- The current F0.3/F0.6 evidence contains synthetic row-level classifications, replay/checksum and test-local activation assertions. The current repository has no single aggregate F0.1–F0.11 manifest; exact absence/presence and required-surface determination must be independently checked before creating a proposed validator. F0.3 cutover-plan §6 and F0.6 bootstrap-plan §§3–5 each receive an explicit row-by-row disposition; uncovered requirements stay UNPROVEN.
- This is an admission gate only. It does not claim aggregate test PASS, complete evidence, cutover readiness for real data, F0.12 Development Gate PASS or Foundation 0 completion.
- Task Contract requires separate read-only Contract and DB/Data review before substantive aggregate generation. Their findings must be dispositioned within scope before proceeding.

`PRE-CRITIC ADMISSION: PASS WITH REVIEW PREREQUISITE`

Contract review initially found bounded evidence-mapping and wording gaps. James' read-only follow-up confirms all three contract-review findings are discharged; Galileo's read-only follow-up confirms the exact F0.3 readiness enum and synthetic-test labeling, and identified the F0.6 wording corrected above. The reviewers found no `ROADMAP_BLOCKER`. This final admission Pre-Critic passes for F0.12 aggregate evidence work only; row-level cutover/bootstrap proof remains to be established, and no real-data operation is authorized.

`PRE-CRITIC ADMISSION: PASS — CONTRACT FINDINGS DISCHARGED`
