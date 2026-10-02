# HMS-STAGING-D1-SQL-SPLITTER-COMPAT-001 — Invariant Evidence

Artifact candidate: bounded migration compatibility repair, only if the full proof passes.
Task Contract: `.orchestration/contracts/HMS-STAGING-D1-SQL-SPLITTER-COMPAT-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

All 24 registry invariants are classified before the experiment. `UNPROVEN` remains the evidence status until the relevant phase has executed.

| Invariant | Applies? | Status | Acceptance / evidence plan | Rationale |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No product mutation is implemented; verify failed disposable migration rolls back and ledger is not marked applied. | Database migration transaction behavior is separately verified; no domain operation exists. |
| INV-AUDIT-001 | N/A | N/A | None. | No business audit/event mutation. |
| INV-DOMAIN-001 | N/A | N/A | Compare original and repaired trigger effects only if phase 1 passes. | No new domain transition or CRUD surface. |
| INV-TENANT-001 | N/A | N/A | Use isolated synthetic D1, never a tenant D1. | Diagnostic has no application tenant routing. |
| INV-RBAC-001 | N/A | N/A | None. | No authorization/API surface changed. |
| INV-PARITY-001 | APPLIES | FAIL | Exact repaired migration chain versus original direct-import chain: all 122 schema object names/definitions match after normalizing only authorized parentheses, but `migrations apply` deletes the existing synthetic payment entry while original direct import preserves it. | The target canonical execution path is not semantically equivalent. |
| INV-ENUM-001 | N/A | N/A | None. | No enum/serialization change. |
| INV-UX-001 | N/A | N/A | None. | No user workflow/UI changed. |
| INV-ORDER-001 | N/A | N/A | Preserve migration file ordering and prove 0019–0030 ledger sequence. | Operational queue ordering is out of scope. |
| INV-RESP-001 | N/A | N/A | None. | No responsive interface changed. |
| INV-EVID-001 | APPLIES | PASS | `.orchestration/evidence/HMS-STAGING-D1-SQL-SPLITTER-COMPAT-001-RESULT.md` records hashes, exact database IDs, commands, migration ledger, normalized schema comparison, row snapshots and differential guard behavior. | Evidence explicitly records the failed semantic-equivalence gate; no PASS is claimed for the repair. |
| INV-LEGACY-001 | APPLIES | FAIL | Synthetic `diagnostic-payment-full` exists after original direct-import chain but is absent after repaired chain via `migrations apply`; the latter leaves the invoice and its paid amount. | The migration-path rebuild does not preserve a dependent legacy payment row. |
| INV-MONEY-001 | APPLIES | FAIL | After repaired `migrations apply`, updating the synthetic booking total fails `D11 payment ledger mismatch` because the payment row is gone; original chain updates total/invoice to 11000, preserves paid 10000, sets PENDING, and retains the payment. | Financial ledger truth differs under the canonical migration path. |
| INV-STATE-001 | APPLIES | UNPROVEN | No artifact or publication boundary is eligible; local state marks the exact migration compatibility gate and awaits Controller direction. | Do not publish an artifact while parity/data-preservation invariants fail. |
| INV-CF-I07-001 | N/A | N/A | None. | No capability or role-name authorization code changes. |
| INV-CF-I07-002 | N/A | N/A | None. | No administrative audit mutation. |
| INV-CF-I07-003 | N/A | N/A | None. | No capability downgrade. |
| INV-CF-I07-004 | APPLIES | PASS | All diagnostic Wrangler commands exited; all four disposable D1 resources were deleted and a final remote name filter returned no `hms-diag-sqlsplit-*` resources. | No long-lived diagnostic resource/process remains. |
| INV-CF-I08-001 | N/A | N/A | None. | No reports/aggregations. |
| INV-CF-I08-002 | N/A | N/A | None. | No network or cross-tenant aggregation. |
| INV-CF-I08-003 | N/A | N/A | None. | No report date/state predicates. |
| INV-CF-I08-004 | N/A | N/A | None. | No expanded operational state values. |
| INV-CF-I08-005 | N/A | N/A | None. | No report clock defaults or continuity. |
| INV-SCOPE-001 | APPLIES | PASS | Diff is exactly 35 authorized parenthesization edits in six pending migration files plus task contract/evidence/state/status. No staging writes, deploy/retry, real data, F-cash or Blocks G–H. | Stop at the failed semantic-equivalence gate; no Phase 3/4 action. |

## Business mutation inventory

No product business operation is implemented. Disposable D1 schema migration writes are explicitly authorized only on named synthetic diagnostic databases; verify migration rollback on failure and delete every diagnostic database after capturing evidence. Staging D1s remain read-only until the conditional Phase 4 action.

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Staging inventory is read-only and coherent | Prior Issue #52 diagnosis; reconfirmed only if needed with read-only D1 queries | Remote D1 read |
| Exact lexical repair makes 0019 migratable | Phase 1 disposable remote migration result | Remote D1 executing migration |
| Repair is semantically equivalent | Original/repaired schema, trigger and deterministic guard assertions | Remote/local executing D1 |
| All pending migrations are compatible | Fresh disposable D1 full 0019–0030 `migrations apply` | Remote D1 executing migrations |

## Publication decision

No substantive artifact is eligible until all conditional acceptance evidence exists and the mandatory Pre-Critic gate passes. A failing Phase 1 yields a bounded technical stop and no accepted migration edits.
