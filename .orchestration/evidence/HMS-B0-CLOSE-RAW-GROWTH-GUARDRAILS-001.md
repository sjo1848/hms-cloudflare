# B0 Closure — Runtime Diagnosis and Development Growth Guardrails

Status: `CLOSED; Block B admitted under its frozen contract`

## Diagnosis

The accepted isolated local Worker/D1 + production Vite + Chrome DevTools investigation is `.orchestration/evidence/HMS-B0-RUNTIME-LOAD-INVESTIGATION-001.md`. It measured FCP ~260 ms, LCP ~758 ms and Queue-ready ~2,928 ms. `/front-desk/board` completed at ~1,085 ms, while `/rooms`, `/guests` and `/reservation-creation-operations` completed at ~2,866 ms. The three ancillary requests started within 6 ms of each other (concurrent); `loadReceptionQueue()` awaited all four via `Promise.all`, and the hook exposed board rows only after all resolved. Queue rows are built from board data, so those auxiliary reads do not block the data needed to display them. Evidence identifies Reception critical-path coupling over local backend/D1 reads as the material cause. Bundle parse/evaluation was not measured as a separate CPU total, and no result is generalized to production/field CWV.

No further B0 investigation or optimization was performed. Block B first acceptance is causal: queue rendering must not be gated by those three auxiliary reads; no localhost absolute timing target is introduced.

## Budget policy and baseline → result → delta

The Controller-authorized raw ceilings are **development aggregate static-asset growth guardrails**, not performance targets. The checker remains active and continues to include every emitted JS/CSS asset.

| Asset metric | Baseline | Result/ceiling | Delta | Delta % |
|---|---:|---:|---:|---:|
| JS raw emitted | 299,976 B | 299,976 B | 0 B | 0.00% |
| JS raw guardrail | 300,000 B | 330,000 B | +30,000 B | +10.00% |
| JS gzip emitted | 86,915 B | 86,915 B | 0 B | 0.00% |
| JS gzip ceiling | 100,000 B | 100,000 B | 0 B | 0.00% |
| CSS raw emitted | 48,615 B | 48,615 B | 0 B | 0.00% |
| CSS raw guardrail | 50,000 B | 55,000 B | +5,000 B | +10.00% |
| CSS gzip emitted | 9,193 B | 9,193 B | 0 B | 0.00% |
| CSS gzip ceiling | 15,000 B | 15,000 B | 0 B | 0.00% |

No product or asset bytes changed in B0 closure, so measured asset deltas are zero. Initial/entry payload remains separately evidenced by the runtime investigation: JS encoded 86,915 B and CSS encoded 9,193 B. Initial API request timing and FCP/LCP/Queue-ready remain local runtime evidence, not budget metrics.

## B0 validation

- `npm run web:build`: PASS. Emitted one JS and one CSS entry file. JS raw `299,976 B → 299,976 B` (`0 B`, `0.00%`); JS gzip `86,915 B → 86,915 B` (`0 B`, `0.00%`). CSS raw `48,615 B → 48,615 B` (`0 B`, `0.00%`); CSS gzip `9,193 B → 9,193 B` (`0 B`, `0.00%`). Initial/entry asset payload equals these aggregate JS/CSS outputs in this build; locale JSON and HTML are outside the checker and remain separately reported in the runtime review.
- `npm run architecture:fitness`: PASS; architecture boundaries `16`, Architecture Fitness II, i18n coverage `25` files, and aggregate static asset budget checker all passed. Exact checker result: JS raw/gzip `299976/86915` against `330000/100000`; CSS raw/gzip `48615/9193` against `55000/15000`.
- `git diff --check`: PASS.
- The clean B0 worktree contains no Reception implementation, Block B tests/runners, or Block B architecture changes.

## Closure conditions

- `scripts/check-cloudflare-budgets.mjs` still checks aggregate emitted JS and CSS and retains both gzip ceilings.
- The six-criterion policy review's unresolved condition 5 was resolved by accepted evidence: the initial UI had a material queue delay caused by fetch coupling, which is explicitly assigned to Block B; no bundle-led optimization follows from that evidence.
- This B0 checkpoint contains no Block B product code. Before Block B product edits, its frozen Task Contract, inventory, invariant map, evidence matrix and Pre-Critic will be restored selectively from the recovery snapshot into the clean Block B branch and revalidated against this checkpoint.
- Block B has not started in this clean B0 checkpoint. C–H have not started. No PR, merge, main, staging, deploy, production or real data action occurred.
