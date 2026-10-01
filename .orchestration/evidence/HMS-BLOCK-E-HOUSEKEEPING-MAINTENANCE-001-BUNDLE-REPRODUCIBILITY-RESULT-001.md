# Block E bundle gate reproducibility result

Status: `BUNDLE_BUDGET_GATE_REQUIRED_AWAITING_CONTROLLER_REVIEW`

## Exact source tested

- WIP reproducibility source checkpoint: `c67c5eeca8c6a215ac4f97240eee50c4db670a50`.
- Branch: `impl/hms-block-e-housekeeping-maintenance`.
- Worktree was clean immediately after the WIP checkpoint and remained clean after build, type check and bundle measurement; generated `dist` output is ignored.
- This is a WIP checkpoint for gate reproducibility, not Artifact A.

## Historical dirty-worktree observation

The previous gate note `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-BUNDLE-GATE-REOPENED-001.md` recorded CSS raw as 55,652 B / 55,000 B, +652 B, using a build from the then-dirty worktree. That dirty source diff has now been preserved unchanged in the exact WIP source checkpoint above. A clean build from that commit emits the same CSS asset hash and exact raw size (55,652 B), so the raw-CSS gate is reproducible from a commit.

The earlier reopened note's gzip values were calculated with gzip level 9, while `check-cloudflare-budgets.mjs` uses Node `gzipSync` defaults. To avoid rewriting that historical record, this result reports canonical checker-compatible gzip values below.

## Clean exact-commit measurement

`npm run web:build`: PASS. Emitted one JS asset (`index-BcPPb7Ss.js`) and one CSS asset (`index-DcIgCO85.css`).

`npm run types:check`: PASS (API and Web Wrangler generated types are up to date).

`node scripts/check-cloudflare-budgets.mjs`: FAIL at `cssRaw budget exceeded: 55652 > 55000`.

| Metric | Baseline | Clean result | Delta | Ceiling | Result |
|---|---:|---:|---:|---:|---|
| JS raw | 329,618 B | 333,186 B | +3,568 B (+1.082%) | 350,000 B | PASS |
| JS gzip (canonical checker algorithm) | 93,456 B | 94,197 B | +741 B (+0.793%) | 100,000 B | PASS |
| CSS raw | 54,297 B | 55,652 B | +1,355 B (+2.496%) | 55,000 B | **FAIL by 652 B** |
| CSS gzip (canonical checker algorithm) | 10,138 B | 10,384 B | +246 B (+2.426%) | 15,000 B | PASS |
| Aggregate raw | 383,915 B | 388,838 B | +4,923 B (+1.282%) | — | — |
| Aggregate gzip | 103,594 B | 104,581 B | +987 B (+0.953%) | — | — |

Initial/entry payload and runtime loading evidence were not measured in this bounded gate rerun.

## Scope

Only the Controller-authorized commands were rerun: production build, `types:check`, and the canonical bundle budget checker. No unit/integration/full suite, browser/runtime validation, architecture/i18n gate, Artifact A, Boundary B, Independent Critic or product acceptance was run. No source, CSS, test or budget changes were made during this reproducibility run. The active gate remains open because CSS raw exceeds its unchanged ceiling.
