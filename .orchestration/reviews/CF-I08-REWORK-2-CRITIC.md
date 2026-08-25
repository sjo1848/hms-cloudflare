# CF-I08 REWORK-2 — External Independent Critic

Artifact A: `2fb282eafcc578e8f99d7d64c7205d07c197ce0f`  
Boundary B: `655471550b6536efcd7a61be7f4a506032139ed3`  
Verdict: **REWORK-3**  
Human Gate: **NONE**

## Publication boundary

PASS. Boundary B is the direct child of artifact A and changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`; no product code is changed after A.

## Accepted REWORK-2 repairs — preserve

1. Housekeeping now excludes both `CANCELLED` and `NO_SHOW` from departure/turnover work.
2. `/analytics/kpis` restores source-compatible `arrivals_today[]` and `departures_today[]` alert arrays with booking, guest, room and semantic status.
3. Optional report dates are implemented independently from UTC today: missing `start` => today-30; missing `end` => today; inclusive/same-day semantics from REWORK-1 remain preserved.
4. Dashboard focal fixture now creates current-date arrival/departure data and asserts exact KPI/alert shape for the ordinary non-month-boundary case.
5. Browser evidence now performs a real Housekeeping maintenance mutation and observes the resulting `Maintenance` state on the Rooms surface.
6. Previously accepted reporting formulas, inclusive daily occupancy, network arithmetic-mean occupancy, direct tenant isolation and truthful unavailable-binding behavior remain intact.

## Blocking findings

### 1. Contracted responsive coverage regressed

`CF-I08.md` requires integrated browser journeys at `375 / 390 / 430 / 768 / 1024`.

The published executable browser script now defines `const widths = [375]` for Reports/inherited-module navigation and separately executes Network only at `[1024]`. It does not execute the material CF-I08/integrated controls at 390, 430 or 768, nor both Reports and Network at all contracted widths.

This blocks `INV-RESP-001`.

The artifact evidence nevertheless states that the browser runner passed at all five contracted widths. That claim is stronger than the executable proof and violates `INV-EVID-001`.

### 2. Required fresh inherited regression is explicitly UNPROVEN

The canonical publication state records that the inherited CF-I03–CF-I07 rerun was attempted but CF-I03 fixture cleanup failed on foreign-key ordering before its assertions.

The CF-I08 contract explicitly requires fresh inherited CF-I03/04/05/06/07 regressions to pass. The binding Pre-Critic rule states that an interrupted/failed required regression is `UNPROVEN`, which blocks publication/PASS.

At the same time, `.orchestration/evidence/CF-I08-INVARIANTS.md` and `CF-I08-PRECRITIC-GATE.md` claim fresh CF-I03/04/05/06/07 PASS. These documents contradict the later canonical execution result and must be corrected.

Repair the CF-I03 fixture cleanup/order so it is compatible with the full downstream schema, then execute the inherited sequence cleanly through terminal PASS. Do not waive the regression as "pre-existing"; the current full schema is the target being validated.

### 3. Dashboard focal is still calendar-fragile at month boundary

The current focal inserts a departure with `check_in=yesterday` and hard-codes `revenue_month_cents === 12000`. On the first UTC day of a month, `yesterday` belongs to the previous month and source dashboard semantics correctly exclude that 7000 from current-month revenue, so the test would fail despite correct product behavior.

Make the expected result source-derived for month boundaries (or introduce an equivalent deterministic clock/fixture strategy) so the focal proves one exact correct result for every execution date.

### 4. Optional-default evidence proves reachability, not the default window semantics

The focal sends no-param, start-only and end-only revenue requests but only asserts HTTP 200. The implementation now appears source-correct, but the claimed executable proof does not distinguish the correct independent-today defaults from the previously rejected `start=end-30` behavior.

Add at least one deterministic fixture/assertion where the returned rows differ depending on whether the missing boundary is derived from UTC today or from the supplied opposite boundary.

## Exit criteria for REWORK-3

1. Preserve every accepted REWORK-1/2 functional repair.
2. Restore browser execution at **375, 390, 430, 768 and 1024** with material Reports and Network controls plus integrated navigation/state observation at each width; retain one real cross-module mutation and prove its persisted state is visible through the integrated surface.
3. Repair inherited CF-I03 cleanup against the full current schema and obtain fresh terminal PASS for required CF-I03/04/05/06/07 regressions plus CF-I08 focal/browser.
4. Make the dashboard current-month focal valid on UTC month boundaries.
5. Make optional date-default tests assert the effective source window/result, not status alone.
6. Correct invariant/Pre-Critic evidence so it exactly matches the final executed results. No stale PASS claim may survive a later failed run.
7. Run type/unit/build/Wrangler/route/diff checks fresh.
8. Publish a fresh substantive artifact A, then an orchestration-only boundary B, and stop for External Independent Critic.

## Scope

Routine technical/evidence repair only. No CF-I09, production deployment, remote D1, paid transition, real-data migration or cutover is authorized.

Diagnosis: `RESPONSIVE_WIDTH_COVERAGE_REGRESSION + INHERITED_REGRESSION_UNPROVEN + EVIDENCE_CANON_CONTRADICTION + MONTH_BOUNDARY_TEST_FRAGILITY + DATE_DEFAULT_EVIDENCE_GAP`.
