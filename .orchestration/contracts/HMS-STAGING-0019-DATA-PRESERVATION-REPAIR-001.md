# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Frozen Repair Contract

Status: `FROZEN BEFORE 0019 REPAIR`

## Authority and bounds

- Controller authorization: Issue #52 comment `5945260364`, `CONTROLLER_DECISION: REPAIR_0019_TRANSACTIONAL_DATA_PRESERVATION`.
- Exact accepted base: `acceptance/staging@0e78050999550d193ff0d352672b233e2f3da472`.
- Dedicated diagnostic branch/worktree remains `staging/d1-sql-splitter-compatibility` / `hms-d1-sql-splitter-compatibility`; all edits are local and not promotional until each gate passes.
- Staging D1s are read-only until all disposable proof and validation phases pass. Never use real hotel data.
- The only migration semantic edit permitted is the smallest transaction-safe repair to `0019_billing_reconciliation.sql` that preserves existing financial data under canonical Wrangler `d1 migrations apply` with foreign keys active. Retain the already-proven exact 35 `SELECT CASE … END;` → `SELECT (CASE … END);` parser-compatibility edits in migrations 0019, 0023, 0024, 0025, 0028 and 0029.
- No deployment-path substitution, ledger editing, check disabling, migration renaming/reordering, product/API/domain/UI policy change, unrelated migration repair, staging write, or deploy is authorized before all conditional gates.

## Requirement → acceptance → evidence

| Requirement | Acceptance | Evidence |
|---|---|---|
| R1 Exact 0018 dependencies inventoried before editing 0019 | Schema columns, constraints, indexes, invoice references, invoice-owned indexes/triggers, and fixture values recorded from pristine 0001–0018 | `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-INVENTORY.md` |
| R2 0019 transaction-safe with foreign keys active | Fresh disposable D1 from original 0001–0018 and deterministic synthetic financial fixture; canonical project Wrangler 4.125.0 `d1 migrations apply --remote`; all fixture rows preserved exactly; 0019 ledger entry once; schema/FK/integrity checks clean | `…-0019-PROOF.md` plus raw outputs |
| R3 Full pending-chain preservation | Separate fresh disposable D1, same original 0001–0018 plus expanded synthetic fixture, then canonical `migrations apply --remote` for 0019–0030; all 12 entries once; financial snapshots unchanged; expected schema and behavioral checks pass | `…-FULL-CHAIN-PROOF.md` plus raw outputs |
| R4 Correct accepted behavior | D11 reconciliation, payment/charge/settlement paths remain valid and existing ledger rows remain authoritative; no fabricated/lost row | Executing-D1 assertions in R2/R3 and regression test |
| R5 Invariant/Pre-Critic gate | Every applicable registry invariant has concrete passing evidence; full invalidated validation set passes before artifact publication | `…-INVARIANTS.md`, `…-PRECRITIC.md`, Results |
| R6 Scope and staging safety | Only authorized migration compatibility and orchestration/evidence files changed; no staging write until Phase 5 | `git diff --name-status`, command records, staging D1 inventory/workflow evidence |

## Exact preservation contract

From the frozen pre-0019 snapshot through migration 0019:

1. Every pre-existing invoice row retains its ID, booking ID, amount, paid amount, status, payment method/reference, paid timestamp and creation timestamp. Only the intended 0019 invoice schema contract may differ.
2. Every pre-existing `payment_entries` row retains every column/value, including primary ID, invoice/booking IDs, integer-cent amount, method, nullable reference/note, actor, received timestamp and nullable `operation_token`.
3. Existing booking and invoice IDs are unchanged. No row is fabricated, silently discarded, duplicated or relinked.
4. All invoice/payment indexes, uniqueness constraints, FKs and triggers have the required post-0019 definitions; `(booking_id, operation_token)` uniqueness remains enforced.
5. `PRAGMA foreign_key_check` returns no rows; `PRAGMA integrity_check` returns `ok`.
6. D11 behavior is equivalent to the accepted pre-repair behavior. Migration 0019 is recorded once through canonical `d1 migrations apply`.

## Frozen representative fixture design

Synthetic-only records will use stable `diag-*` identifiers, two or more bookings, an unpaid invoice, a partial invoice with multiple methods/entries, a fully paid invoice, nullable and non-null notes/references, operation tokens (including a uniqueness negative), charges, and a credit/overpayment case only if the accepted schema/contract supports it. Before applying 0019, persist an ordered projection of every relevant table's exact rows and compare it byte/value-equivalently afterward. The fixture SQL and SHA-256 will be included with the proof before it is executed.

## Invariants and Pre-Critic admission mapping

- `INV-ATOMIC-001` APPLIES: migration is atomic with live FKs; failed statements must leave old schema/data and ledger intact.
- `INV-AUDIT-001` N/A: no business audit/event behavior is being added or changed.
- `INV-DOMAIN-001` APPLIES: D11 payment/reconciliation semantics must remain explicit and unchanged.
- `INV-TENANT-001` N/A: only isolated synthetic disposable D1s; no tenant router change.
- `INV-RBAC-001` N/A: no authorization surface change.
- `INV-PARITY-001` APPLIES: original accepted ledger data and invoice semantics survive canonical migration execution.
- `INV-ENUM-001` N/A: no enum mapping change.
- `INV-UX-001` N/A: no UI change.
- `INV-RESP-001` N/A: no responsive surface change.
- `INV-EVID-001` APPLIES: every preservation claim maps to exact raw output/assertion.
- `INV-LEGACY-001` APPLIES: every pre-existing invoice/payment row survives exactly.
- `INV-MONEY-001` APPLIES: integer-cent payment ledger totals and D11 reconciliation remain consistent.
- `INV-STATE-001` APPLIES: staging refs/DBs stay untouched until authorized conditional gates; state is reconciled at each boundary.
- `INV-CF-I07-001` N/A: no protected authorization surface.
- `INV-CF-I07-002` N/A: no administrative audit operation.
- `INV-CF-I07-003` N/A: no downgrade operation.
- `INV-CF-I07-004` APPLIES: every migration/evidence runner terminates owned processes and verifies cleanup before PASS.
- `INV-CF-I08-001` N/A: no report arithmetic surface.
- `INV-CF-I08-002` N/A: no network aggregation.
- `INV-CF-I08-003` N/A: no report range behavior.
- `INV-CF-I08-004` N/A: no expanded state values.
- `INV-CF-I08-005` N/A: no reporting defaults or browser continuity.
- `INV-SCOPE-001` APPLIES: repair remains migration correctness only and does not absorb product, unrelated migration, F-cash or later-block scope.

No migration 0019 content may be edited until the exact dependency inventory and frozen preservation contract are committed to the worktree evidence (not necessarily Git-committed).

## Stop conditions

Stop and record the exact failing migration/statement if any unrelated migration loses data or drifts semantics. Do not broaden this repair. Do not attempt Phase 5 unless Phase 4 is fully green. Staging remains untouched until then.
