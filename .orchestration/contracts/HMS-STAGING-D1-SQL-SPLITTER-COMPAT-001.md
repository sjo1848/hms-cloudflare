# HMS Staging — D1 SQL Splitter Compatibility Contract

Status: `FROZEN BEFORE REPAIR EXPERIMENT`

## Authority and exact base

- Canonical Controller decision: Issue #52 comment `5944972953`, `CONTROLLER_DECISION: PROVE_SQL_SPLITTER_COMPATIBILITY_THEN_RESUME_STAGING`.
- Exact accepted staging base: `0e78050999550d193ff0d352672b233e2f3da472` (`acceptance/staging` was verified at this SHA before creating this dedicated worktree).
- Dedicated branch/worktree: `staging/d1-sql-splitter-compatibility` / `hms-d1-sql-splitter-compatibility`.
- No staging D1, migration file, Access application, Worker or workflow may be changed during Phases 1–3.

## Objective

Prove on a disposable remote D1 whether the Controller's minimal lexical compatibility hypothesis resolves `0019_billing_reconciliation.sql` through the canonical Wrangler `d1 migrations apply --remote` path. Only if that succeeds, scan and apply the same exact parenthesization to hazardous trigger-body guard occurrences in migrations 0019–0030, then prove the complete pending chain on a fresh disposable D1. Preserve all SQL predicates, RAISE messages, trigger timing, schema objects, ordering, PRAGMAs, and business semantics.

## Frozen bounded transformation

For trigger guard statements only, transform:

`SELECT CASE <same expression> END;`

to:

`SELECT (CASE <same expression> END);`

No other edits, parser workaround, Wrangler version change, migration rename/reorder, product/API/domain/schema semantic change or staging mutation is authorized. Phase 1 tests only migration 0019 using Wrangler 4.125.0 and the exact existing pre-0019 synthetic baseline. If Phase 1 fails, stop as `D1_SQL_COMPATIBILITY_REPAIR_FAILED`; do not broaden or apply the repair to repository migrations.

## Conditional continuation and acceptance

Only if Phase 1 passes:

1. Compare migrated schema/trigger definitions and representative behavioral guard outcomes with the original migration run through the known-good direct/import path or local executing-D1 path; prove the lexical edit is semantically equivalent.
2. Scan 0019–0030 for only this hazardous exact lexical shape. Change only matching trigger guard statements whose inner CASE terminator is statement-closing `END;`; preserve filenames/order and record every before/after line.
3. On a new disposable D1, apply the canonical pre-0019 synthetic baseline, then apply every migration 0019–0030 through Wrangler 4.125.0 `d1 migrations apply --remote`.
4. Require all migrations once, no unexpected schema objects, required triggers present, representative guard behavior correct, and disposable D1 deleted after evidence capture. A different later failure stops as `D1_SQL_COMPATIBILITY_REPAIR_FAILED` with its exact migration/statement; do not invent another workaround.
5. Only after full disposable proof, persist exact repair/evidence and run the Controller-listed affected validation. No acceptance/staging movement until all gates pass.

## Evidence requirements

- Original migration SHA-256 and exact candidate diff.
- D1 database IDs, exact baseline hash, Wrangler version, command, output/result and query/schema/behavior observations.
- Phase 1 result before any accepted migration file is edited.
- Full-chain migration ledger and schema/trigger/behavior evidence if Phase 1 passes.
- Exact changed-file/line manifest, full validation, ancestry to the accepted base and staging-ref identity before any authorized fast-forward.
- Delete every disposable D1 after capturing evidence. Never include real hotel data.

## Explicit exclusions

No staging retry until the Controller-authorized proof and validation phases are complete. No staging D1 writes in diagnostic phases, no seed/deploy/smoke, no `main`, merge commit, production, real data, F-cash, Blocks G–H, or policy/budget/toolchain changes.

## Invariant mapping

The complete per-invariant classification and evidence plan is frozen in `.orchestration/evidence/HMS-STAGING-D1-SQL-SPLITTER-COMPAT-001-INVARIANTS.md` before the experiment.
