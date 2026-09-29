# F0.12 Contract / DB-Data Review Disposition

Task: `.orchestration/contracts/HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001.md`.
Review mode: two separate read-only reviewers, GPT-6 Luna Medium. No files/tests/migrations/data were run by reviewers.

## Contract Reviewer — James

Recommendation: bounded `REWORK` before aggregate work; no `ROADMAP_BLOCKER`, architecture contradiction or synthetic-only boundary breach.

1. `HIGH`: aggregate contract did not explicitly disposition all binding Room State Cutover Plan §6 criteria. Repaired by adding a row-by-row `PROVEN` / `UNPROVEN` / `NOT_APPLICABLE` crosswalk for mapping/edge cases; duplicate/orphan/unknown accounting; counts/checksums; two clean rehearsals; failure/restart; date-range inventory/holds; open-case uniqueness; provenance; and post-activation verification, with exact evidence required and live post-activation excluded.
2. `HIGH`: aggregate contract did not enumerate Active-Stay Pricing Bootstrap Plan §§3–5 cases and preservation criteria. Repaired with explicit synthetic case matrix and exact post-state checks for booking, charges, invoice/paid_at, payment rows, inventory, lifecycle/financial events and replay. Missing evidence is explicitly `UNPROVEN`.
3. `MEDIUM`: admission Pre-Critic overstated source-parity completion. Repaired: it now requires the row-by-row cutover/bootstrap dispositions and states these are not PASS until exact evidence is assembled.

## DB/Data Reviewer — Galileo

No blocker. Manifest can be built from repository evidence and synthetic test assertions only, provided it is labeled as test output and not a live inventory. Findings:

1. `MEDIUM`: preserve F0.3 exact enum `MAPPED`, readiness `READY_FOR_ARRIVAL`, sellability `SELLABLE` for `ready-room`; do not normalize to `READY`. Repaired in Task Contract.
2. `LOW`: distinguish isolated synthetic test assertions from persistent/live hotel rows. Repaired in Task Contract and Pre-Critic; explicitly label F0.3 `hotel-synthetic-a`, F0.6 `synthetic-hotel`, and the separate `Hotel Norte` browser fixture as synthetic test evidence. No live activation implied.
3. Follow-up precision: the Pre-Critic initially called F0.6's `stay-a` path a “test-local simulation,” although it writes synthetic pricing segments into isolated test D1. Repaired in the final Pre-Critic: F0.3 writes only a test-scoped marker, while F0.6 executes synthetic activation against isolated test D1; neither is live activation.

Reviewer independently confirmed that F0.6 evidence asserts only `stay-a` as the synthetic candidate; aggregate-only, conflict, mismatch and voided candidates are `HELD`; full/overpaid cases, tenant separation, replay and exact financial/operational preservation have test evidence. This remains reviewer inspection, not a new test execution.

## Disposition / gate

James' follow-up confirmed all contract findings are discharged. Galileo's follow-up confirmed his enum/fixture findings and the final F0.6 wording repair. All reviewer findings are addressed in the current contract and Pre-Critic before substantive F0.12 aggregate generation. This closes contract-admission rework only; it does not prove the cutover/bootstrap crosswalk rows, aggregate evidence completeness, F0.12 Development Gate or Foundation 0 completion. F0.12 work may proceed under the explicit synthetic-only boundary.
