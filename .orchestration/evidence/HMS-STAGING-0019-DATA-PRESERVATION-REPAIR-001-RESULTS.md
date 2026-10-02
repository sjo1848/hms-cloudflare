# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Results

Status: `PHASES 1–4 TECHNICAL GATES PASS; CONDITIONAL STAGING AUTHORIZATION REMAINS TO BE EXERCISED`

## Authority / exact base

- Latest Controller decision: Issue #52 comment `5945260364`, `CONTROLLER_DECISION: REPAIR_0019_TRANSACTIONAL_DATA_PRESERVATION`.
- Base: `acceptance/staging@0e78050999550d193ff0d352672b233e2f3da472`.
- Dedicated worktree/branch: `/home/sjo1848/dev/hms-elite-cloudflare/hms-d1-sql-splitter-compatibility` / `staging/d1-sql-splitter-compatibility`.
- Product scope: migration correctness only. No API/domain/UI changes. Files changed: migration 0019, five already-authorized parser-compatibility lexical edits, an executing-D1 regression, dependent fixed fingerprints, state/status, contract and evidence.

## Repair and disposable evidence

- Pre-edit exact 0018 schema and dependencies: `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-INVENTORY.md`.
- Frozen contract: `.orchestration/contracts/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001.md`.
- Fixture SHA-256: `7869383f24c4f0539e2e87403ff4559db0257d3891d9db2542f66ed667deebf0`.
- Repaired 0019 SHA-256: `2a9ac50148ba1874a0395cc6ed81c8d07151493bb5a699ad6538c9cbe599469c`.
- Isolated 0019 canonical remote proof: `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-0019-PROOF.md`.
- Full 0019–0030 canonical remote proof: `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-FULL-CHAIN-PROOF.md`.
- Both synthetic disposable D1s were deleted. Read-only remote list filter found zero resources with prefix `hms-diag-0019-`.
- Prior failure evidence `.orchestration/evidence/HMS-STAGING-D1-SQL-SPLITTER-COMPAT-001-RESULT.md` is preserved unchanged and remains the historical failure being repaired.

## Validation

- `npm run check`: PASS, 35/35 test files and 176/176 tests (includes transactional 0019 data-preservation regression).
- `npm run types:check`: PASS.
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS, architecture I/II, i18n coverage and budgets.
- `npm run test:d1-query-plan`: PASS.
- `npm run wrangler:dry-run`: PASS, API and Web.
- Staging config dry-runs: PASS, API and Web using placeholder audience and dummy D1 UUIDs only. Generated API config removed.
- `git diff --check`: PASS on the artifact snapshot. Captured Wrangler text was normalized only for trailing horizontal whitespace/blank EOF lines; original and normalized SHA-256 values are recorded in `...-RAW-FORMATTING-MANIFEST.json`; no non-whitespace output content changed.
- Pre-Critic and all 24 invariant classifications: PASS; see linked evidence.

## Bundle / runtime

Baseline equals result because all Web inputs and lockfiles are byte-identical to the exact base:

| Metric | Baseline | Result | Delta | Delta % | Ceiling |
|---|---:|---:|---:|---:|---:|
| JS raw | 338,266 B | 338,266 B | 0 B | 0% | 350,000 B |
| JS gzip | 95,036 B | 95,036 B | 0 B | 0% | 100,000 B |
| CSS raw | 56,587 B | 56,587 B | 0 B | 0% | 60,000 B |
| CSS gzip | 10,490 B | 10,490 B | 0 B | 0% | 15,000 B |
| Aggregate raw | 394,853 B | 394,853 B | 0 B | 0% | — |
| Aggregate gzip | 105,526 B | 105,526 B | 0 B | 0% | — |
| Initial entry raw (HTML + entry JS + CSS) | 395,217 B | 395,217 B | 0 B | 0% | — |
| Initial entry gzip | 105,790 B | 105,790 B | 0 B | 0% | — |

No frontend source changed; JS evaluation/runtime request behavior is unchanged by this migration-only repair. Exact per-file values and source-equality basis are in `...-BUNDLE.json`.

## Environment / next boundary

- Staging D1s have not been written in this repair turn. No staging workflow ran, no Worker deployed, no Access app changed and no acceptance smoke test ran.
- No main/merge/PR/production/real-data/F-cash/Blocks G–H action occurred.
- Artifact A, orchestration Boundary B and Controller review must be recorded before using the conditional Phase 5 staging authorization. Current `STATE.md`/`STATUS.json` remain at the bounded Phase 4 handoff until the exact artifact boundary is frozen.
