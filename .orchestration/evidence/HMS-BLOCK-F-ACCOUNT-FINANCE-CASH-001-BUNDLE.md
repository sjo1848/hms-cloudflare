# Block F Account/Finance — Bundle Baseline

Measured on the clean exact base `39ee0a2b38e7205b8e041e792e16ee469c996241` before product edits using `npm run web:build` and `npm run architecture:fitness`.

| Metric | Baseline | Active ceiling |
|---|---:|---:|
| JS raw | 334638 B | 350000 B |
| JS gzip | 94467 B | 100000 B |
| CSS raw | 55652 B | 60000 B |
| CSS gzip | 10384 B | 15000 B |
| Aggregate raw (JS + CSS) | 390290 B | n/a |
| Aggregate gzip (JS + CSS) | 104851 B | n/a |
| Initial/entry payload raw (HTML + entry JS/CSS) | 390654 B | n/a |
| Initial/entry payload gzip | 105117 B | n/a |

Baseline result: all active ceilings pass. Final evidence must report `baseline → result → delta bytes → delta %` for each metric, include aggregate raw/gzip and initial/entry payload, and identify any runtime loading evidence that can be reproduced locally. A ceiling breach is a hard `BUNDLE_BUDGET_GATE_REQUIRED`; no policy increase is authorized by this task.
