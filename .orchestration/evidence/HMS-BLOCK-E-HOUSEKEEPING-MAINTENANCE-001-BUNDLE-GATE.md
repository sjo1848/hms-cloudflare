# Block E — Bundle Budget Gate

Task Contract: .orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md  
Base: 3f06c7b52b8c5f57754e705071b7cee6a5668d05  
Branch: impl/hms-block-e-housekeeping-maintenance

## Measurement

Production vite build completed; measurement uses the same gzipSync method as scripts/check-cloudflare-budgets.mjs.

| Asset | Baseline | Current | Delta | Delta % | Ceiling | Result |
|---|---:|---:|---:|---:|---:|---|
| JS raw | 329,618 B | 330,742 B | +1,124 B | +0.341% | 330,000 B | FAIL by 742 B |
| JS gzip | 93,456 B | 93,737 B | +281 B | +0.301% | 100,000 B | PASS |
| CSS raw | 54,297 B | 54,297 B | 0 B | 0.000% | 55,000 B | PASS |
| CSS gzip | 10,138 B | 10,138 B | 0 B | 0.000% | 15,000 B | PASS |
| Aggregate raw | 383,915 B | 385,039 B | +1,124 B | +0.293% | — | — |
| Aggregate gzip | 103,594 B | 103,875 B | +281 B | +0.271% | — | — |

The emitted web JavaScript is the initial/entry payload (one JS asset in this build): 330,742 raw / 93,737 gzip. No separate runtime-loading or browser timing claim is made.

## Optimization attempt and disposition

- The approved ceilings were not changed.
- The existing Vite build already uses Terser with four compression passes and the existing unsafe-arrow/pure-getter settings.
- An additional Terser pass experiment at ten passes reduced the current emitted raw file by only 3 B (330,739 B), which remains 739 B over the ceiling; the experiment was not adopted.
- CSS has been reduced back to its unchanged baseline. JS gzip remains within its approved ceiling.
- node scripts/check-cloudflare-budgets.mjs correctly failed on JS raw. No test suite or final product validation is claimed. No Artifact A, Boundary B, or Independent Critic review was created.
- This is a real BUNDLE_BUDGET_GATE_REQUIRED stop under the frozen contract, not a request to raise the ceiling. The remaining implementation/evidence work is preserved in the local branch and has not been represented as complete.

The bundle raw ceilings remain development growth guardrails. No absolute performance target is inferred from this localhost/build measurement.
