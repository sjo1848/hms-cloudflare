# TASK CONTRACT — HMS-ROADMAP-CTRL-REWORK-001

Task ID: `HMS-ROADMAP-CTRL-REWORK-001`
Phase: `BOUNDED ROADMAP REWORK`
Branch: `planning/hms-implementation-roadmap-f0-a-h`
Prior Artifact A: `6a119f9ee7c90b6df5c1b5cfbf5d552db8313468`
Prior Boundary B: `6afbd247b9b4d7ae0ec1227bfd007bf25aec34f9`
Authority: Controller Review Drive `1xbNP7RWTriKXGqWMTwFV3xoRIFYPvJwENn3tsozHHlM`; frozen Blueprint 001 / Reconciliation 007 / Final Disposition 008.

## Objective and allowed scope

Repair only findings CTRL-RM-01 through CTRL-RM-04 in the existing roadmap package. Deliver a new immutable roadmap A2 and orchestration-only B2. No implementation authorization is granted.

## Acceptance

1. Audit every repository surface/path named in Foundation 0, Blocks A–H, Master, matrices and referenced roadmap notes against checked-in paths. Existing files must be verified. Any future file is labeled `PROPOSED NEW SURFACE`; conceptual endpoints/modules are not represented as existing files. Record path-audit evidence.
2. Reconcile Block E start prerequisites, DAG graph/edge table/critical path, Master sequencing and all parallelism statements: F0 + A + required room/capability contracts allow E to start; B is a later Reception ↔ HK/Maintenance integration checkpoint unless concrete frozen evidence proves otherwise.
3. Separate Booking Account/Receivables from Cash. No pending invoice/balance is part of cash received, cash/non-cash totals, expected/counted cash or difference; optional navigation link must be distinctly labeled and not in reconciliation arithmetic.
4. Financial account grain is Booking/Stay. Replace guest-global account wording with `Booking Account/Folio`; Guest may navigate to a stay account, but owns no global financial account in this model.
5. Run consistency checks across Master, DAG, Foundation, Blocks, Traceability and Evidence. No product code/schema/data/test/build/migration, issue, PR, merge, staging or deploy action.
6. Fresh independent Critic, preferably a different reviewer from Gauss, reviews corrected exact roadmap content; persist actual verdict/findings and repairs before A2.
7. A2 contains substantive roadmap + task/evidence/critic record. B2 changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`, records exact A2 SHA, sets `external_review.required=true`, `resume_authorized=false`, and final state `ROADMAP_REWORK_COMPLETE_AWAITING_CONTROLLER_REVIEW`.

## Invariant classification

All registry invariants apply to the documentary roadmap rework; no runtime behavior is being changed. Existing acceptance mapping in `HMS-IMPLEMENTATION-ROADMAP-001` remains binding and is refined here:

| ID | Class | This rework's evidence |
|---|---|---|
| INV-ATOMIC-001 / INV-AUDIT-001 / INV-DOMAIN-001 | APPLIES | Preserve financial/domain contracts while correcting ownership terminology and cash grain; do not claim behavior changed. |
| INV-TENANT-001 / INV-RBAC-001 / INV-CF-I07-001 | APPLIES | Path inventory must identify actual auth and route surfaces, not fictional route files; backend remains authority. |
| INV-PARITY-001 / INV-ENUM-001 | APPLIES | No blueprint rewrite; corrected plans preserve canonical financial and room semantics. |
| INV-UX-001 / INV-ORDER-001 / INV-RESP-001 | APPLIES | E sequencing change preserves its own workflows and explicitly retains B integration; matrices remain operation-level. |
| INV-EVID-001 / INV-STATE-001 | APPLIES | Path audit is evidence-backed; publish A2 then orchestration-only B2. |
| INV-LEGACY-001 / INV-MONEY-001 | APPLIES | Cutover provenance and cents/ledger invariants remain unchanged; Receivables are excluded from cash sums. |
| INV-CF-I07-002 / -003 / -004 | APPLIES | Block G mutation/admin evidence and runner-cleanup requirements are retained; no false test PASS. |
| INV-CF-I08-001 / -002 / -003 / -004 / -005 | APPLIES | Analytics/network/date/state and continuity surfaces are verified against actual repository paths; evidence requirements retained. |
| INV-SCOPE-001 | APPLIES | Exact CTRL-RM findings only; no product implementation or next-scope absorption. |

## Forbidden actions

No product source/schema/test changes; no migration execution or data mutation; no implementation issues/PR; no merge, staging, deploy, main or production; do not alter frozen Blueprint documents. Do not begin Foundation 0.

## Publication boundary

Run documentary Pre-Critic and invariant evidence before A2. A2 is the exact corrected package. B2 is orchestration-only and records A2. Stop at `ROADMAP_REWORK_COMPLETE_AWAITING_CONTROLLER_REVIEW`; no self-authorization to implement.
