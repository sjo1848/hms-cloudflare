# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Pre-Critic Gate

Status: `PASS — IMPLEMENTATION / EVIDENCE GATE; NOT AN INDEPENDENT CRITIC VERDICT`

## Admission

- Controller authorization: Issue #52 comment `5945260364`, `REPAIR_0019_TRANSACTIONAL_DATA_PRESERVATION`.
- Exact source base: `0e78050999550d193ff0d352672b233e2f3da472`; local branch is `staging/d1-sql-splitter-compatibility` in its isolated worktree.
- Frozen Task Contract, 0018 dependency inventory, fixture, before snapshots and 24-invariant classifications exist before the 0019 repair; see Contract and `...-INVENTORY.md`.
- All applicable invariants are PASS in `...-INVARIANTS.md`; no `UNPROVEN`/`FAIL` remains.

## Adversarial checks required by learned patterns

| Risk | Adversarial check | Result |
|---|---|---|
| FK cascade deletes payment child rows during invoice rebuild | exact full-column 0018 payment snapshots before/after canonical remote 0019 apply | PASS: all 3 payment entries unchanged |
| Lost/relinked invoice or booking identity | ordered invoice, booking and payment projections across 0019 and 0019–0030 | PASS: IDs/links unchanged; only explicitly exercised D11 total reduction changed invoice amount/status as specified |
| Token index omitted or widened/narrowed | compare 0018 names/keys and attempt same booking/token duplicate after rebuild | PASS: exact 3 explicit indexes and PK restored; duplicate rejected |
| Nullable legacy values or operation tokens fabricated | NULL and non-NULL refs, notes and tokens in fixture; compare exact projections; 0030 legacy charge token stays NULL | PASS |
| D11 ledger can drift or paid truth can be corrupted | total-reconciliation operation plus direct mismatched paid amount update | PASS: D11 transitions reflect ledger; invalid paid amount rejected by authoritative trigger |
| Migration batch partly commits on failure | append a deliberate failing statement after all 0019 statements in one executing-D1 `batch` | PASS: entire schema/data batch rolled back to the original invoice/payment state |
| Unrelated 0020–0030 migration mutates old financial records | fresh second D1, all 12 canonical migrations, 122-object schema comparison, row/value snapshot | PASS |
| Broken references or damaged SQLite image | remote `foreign_key_check`; read-only exact Wrangler export loaded into isolated SQLite for `integrity_check` | PASS: empty FK check, integrity `ok` |
| Existing protected behavior regresses | full Vitest and executing-D1 billing/checkout suite, D1 query plan, TypeScript/build/architecture/i18n/Wrangler dry-runs | PASS |
| Scope drift or forbidden environment write | diff inventory; Cloudflare D1 list filter for disposable prefix; staging/main/data audit | PASS: only bounded migration/test/evidence files; diagnostics deleted; staging untouched |

## Validation results

- `npm run check`: PASS; TypeScript plus 35 test files / 176 tests.
- `npm run types:check`: PASS; API and Web Wrangler types up to date.
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS; architecture I/II, i18n (25 files), budget checker.
- `npm run test:d1-query-plan`: PASS.
- `npm run wrangler:dry-run`: PASS; API Worker and Web Worker.
- Staging Worker configs rendered only with placeholder audience and disposable dummy D1 IDs; API and Web `wrangler deploy --dry-run` both PASS. Generated API config was removed. No staging credentials/resources were used by these dry-runs.
- Canonical remote fresh 0001–0018 + 0019 + full 0020–0030 migration proof: PASS; both named disposable D1s deleted and remote filtered inventory shows zero remaining `hms-diag-0019-*` resources.
- `git diff --check`: PASS (re-run at artifact freeze).
- Budget report: `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-BUNDLE.json`.

The initial full-suite attempt exposed only stale F0.3 pinned fingerprints derived from the previous migration-schema string. Their deterministic schema digest, migration digest, source digest and report checksum were refreshed in the test after the 0019 DDL change; the isolated test and full suite then passed. No behavior assertion was weakened or removed.

## Boundary eligibility

This gate admits Artifact A preparation only. It is not a substantive PASS or a replacement for the independent external review required by the project method. The exact artifact/boundary pair must be recorded and reviewed before any conditional staging-ref movement if the canonical Controller boundary requires that review. No Block G–H, production, real-data, PR, merge or main action occurred.
