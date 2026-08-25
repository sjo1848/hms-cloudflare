# CF-I08 REWORK-4 Pre-Critic Gate

| Gate | Result | Exact evidence |
|---|---|---|
| Contract/scope | PASS | `.orchestration/contracts/CF-I08.md`; no CF-I09, production or Human Gate scope entered. |
| Source semantics | PASS | `docs/cf-i08-analytics-reporting-parity.md`; immutable HMS source queries/formulas were read before test expectations. |
| Dashboard KPI parity | PASS | Focal `/analytics/kpis` proves current dashboard shape, month revenue, active states, today fields, all-room occupancy and source ADR/RevPAR derivation. |
| Revenue parity | PASS | Optional/default path, same-day validity, inclusive end and `CANCELLED` + `NO_SHOW` exclusion are executable. |
| Occupancy parity | PASS | Inclusive daily series, distinct-room numerator, `CONFIRMED`/`CHECKED_IN` predicate and all-room denominator are executable. |
| Network parity | PASS | Two configured local D1s, source dashboard-derived per-hotel metrics, arithmetic mean occupancy, exact totals/ranking and truthful unavailable binding. |
| Security/isolation | PASS | Fresh inherited RBAC regression plus direct Hotel-A identity → Hotel-B report denial; browser proves housekeeping denial. |
| Responsive/integrated UX | PASS | Fresh CF-I08 browser PASS at 375/390/430/768/1024 with material controls, cross-module navigation and screenshot. |
| Invariants | PASS | `.orchestration/evidence/CF-I08-INVARIANTS.md`; no applicable FAIL/UNPROVEN remains. |
| Regression/build/static | PASS | Fresh CF-I03/04/05/06/07 focal, CF-I07 browser, `npm run check`, web build, Wrangler dry-run and route/diff checks. |
| Publication boundary | READY | Publish substantive A, resolve exact SHA, publish orchestration-only B, then stop for Independent Critic. |

## Strengthened REWORK-2 checks

| Check | Result | Exact evidence |
|---|---|---|
| Enum expansion cross-module safety | PASS | Housekeeping SQL excludes `CANCELLED` and `NO_SHOW`; focal fixture proves NoShow is absent from departures and turnover. |
| Dashboard output shape | PASS | `/analytics/kpis` exact assertion proves arrays with booking, guest, room and semantic status fields. |
| Independent date defaults | PASS | Focal runner exercises no-param, start-only, end-only, same-day and inverted ranges. |
| Deterministic focal state | PASS | Current-date D1 fixture asserts one exact dashboard result, independent of prior fixed-date rows. |
| Cross-module continuity | PASS | Browser runner mutates Housekeeping through local API and verifies the resulting room state in Rooms UI. |

| Contracted responsive widths | PASS | Fresh browser execution covers 375, 390, 430, 768 and 1024 for Reports and Network controls, with Rooms continuity after the real mutation. |
| Fresh inherited regressions | PASS | Fresh terminal markers CF-I03/04, CF-I05, CF-I06 and CF-I07 all completed after FK-aware cleanup. |
| Month-boundary dashboard | PASS | Focal expected revenue/ADR/RevPAR derive from whether yesterday is on or before the current UTC month start. |
| Effective default window | PASS | End-only fixture includes an old row outside today-30 but inside supplied-end-30 and asserts only the source-independent result. |
| No-param and start-only default windows | PASS | Focal assertions verify both rows in the today-30 window and the single row from the supplied start through UTC today. |
| Integrated all-width state | PASS | One real maintenance mutation is followed by Rooms `Maintenance` assertions at 375, 390, 430, 768 and 1024, with overflow checks. |

Codex does not self-declare product PASS. The next boundary is External Independent Critic; CF-I09 remains unauthorized.
