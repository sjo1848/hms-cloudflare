# CF-I08 — External Independent Critic

Artifact A: `ed7afe4722650933bc704c1d5f02150cbda82996`  
Boundary B: `6c94e7e8dce4b02d3f2110dca135dd7674a2f794`  
Verdict: **REWORK-1**  
Human Gate: **NONE**

## Boundary validation

PASS. Boundary B is the direct child of artifact A and changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`. No substantive product code is changed by B.

## Executive finding

CF-I08 does not yet preserve the accepted source reporting semantics. The implementation and focal regression define a new range/night-based analytics model and then prove that model against itself. This conflicts with the source reporting repository/service and with the CF-I08 contract's parity-first requirement.

The security foundation from CF-I07 is not reopened. The rework is reporting/analytics semantics plus evidence/integrated-browser closure.

## Blocking findings

### P1 — Dashboard KPI contract is not source-equivalent

Source `/api/v1/analytics/kpis` has no required date range and represents the current dashboard state:

- current-month revenue from month start;
- states exclude `CANCELLED` and `NO_SHOW` for revenue;
- today's confirmed check-ins;
- all active `CONFIRMED`/`CHECKED_IN` bookings;
- today's occupancy = distinct occupied rooms / all rooms;
- arrivals and departures today;
- ADR = `revenue_month_cents / active_bookings_count` with zero-safe behavior;
- RevPAR = `occupancy_rate * ADR / 100`, with source integer conversion semantics.

Target `/analytics/kpis` requires `start` and `end` and instead reports range revenue, overlap-active bookings, room-night occupancy, non-out-of-order denominator, ADR = revenue / occupied nights and RevPAR = revenue / available nights. It also omits source dashboard fields such as today's check-ins, arrivals and departures.

Required repair: port the source dashboard contract exactly or provide an explicit approved adaptation. No such adaptation is approved.

### P1 — Revenue report date/state/API semantics drift

Source revenue report:

- `start`/`end` are optional and default to `today-30` / `today`;
- same-day ranges are valid;
- end date is inclusive (`check_in <= end`);
- excludes both `CANCELLED` and `NO_SHOW`;
- returns the source daily row collection ordered ascending.

Target:

- requires both dates;
- rejects `start == end`;
- treats end as exclusive (`check_in < end`);
- excludes only `CANCELLED`;
- returns a target wrapper object containing `rows`, `booking_count` and `total_revenue_cents` rather than preserving the source report collection contract.

Required repair: restore source defaults, inclusive range behavior, same-day validity, non-revenue-state semantics and source-equivalent response shape/granularity unless a documented compatibility adapter preserves existing consumers.

### P1 — Occupancy report implements a different product definition

Source occupancy report emits one row per day from `start` through `end` inclusive. For each day:

- numerator = distinct rooms with booking state `CONFIRMED` or `CHECKED_IN` and `check_in <= day < check_out`;
- denominator = all hotel rooms;
- daily occupancy rate is calculated from those values.

Target emits one aggregate object over `[start,end)` using `room_inventory_nights`, counts every non-`CANCELLED` claimed night, excludes `OUT_OF_ORDER` rooms from the denominator, and adds target-defined ADR/RevPAR fields.

This is not a serialization difference; it changes report meaning and UX data granularity.

Required repair: implement the source daily occupancy series and exact state/denominator/date predicates. Any extra aggregate card must be derived from the source-equivalent series without replacing the source report.

### P1 — Network KPI aggregation is not source-equivalent

Source network KPI behavior combines:

- per-hotel dashboard summary semantics for occupancy, active bookings, ADR and RevPAR;
- requested-range revenue report for per-hotel/network revenue;
- arithmetic mean of per-hotel occupancy rates for `average_occupancy_rate`;
- rows ordered by descending revenue;
- source `HotelNetworkSummary` field semantics.

Target instead reuses the range/night model for all per-hotel metrics and calculates network occupancy as a weighted aggregate `totalOccupied / totalAvailable`. It also changes output field names/shape (`active_bookings`, `revenue_cents`, `rows`) from source concepts (`total_active_bookings`, `total_revenue_cents`, `hotels`).

Required repair: build network totals from source-equivalent per-hotel inputs, preserve arithmetic mean occupancy and source-compatible output semantics. Missing configured D1 must continue to fail truthfully rather than partially aggregate.

### P1 — NoShow/non-revenue parity remains unproven in reporting

Source revenue excludes `NO_SHOW` and occupancy only includes `CONFIRMED`/`CHECKED_IN`. Target currently cannot represent `NO_SHOW` and the focal test only proves `CANCELLED` exclusion.

The previously carried NoShow migration debt may remain a CF-I09 import/readiness item, but CF-I08 cannot claim full report-state parity while its report queries would count an imported/unrecognized non-revenue state incorrectly.

Required repair: make reporting predicates explicit and import-safe for source non-revenue semantics, with deterministic `NO_SHOW`/equivalent fixture or a documented normalization layer that CF-I09 can exercise.

### P1 — Evidence proves the target invention rather than source parity

`cf-i08-regression.sh` asserts:

- occupancy `2 / 60 = 3.33%` over an exclusive 31-day window;
- ADR `12345 / 2 = 6173`;
- RevPAR `12345 / 60 = 206`.

Those expected values come from the target's new night-based formulas, not from the source `ReportingService`. The parity document repeats these target rules as if they were source mappings. Therefore `INV-PARITY-001` and `INV-EVID-001` are not satisfied.

Required repair: derive fixture expectations independently from immutable source queries/formulas, then make the target conform to those expectations.

### P1 — Integrated browser evidence is reachability-heavy, not an integrated product journey

For previously migrated modules, the CF-I08 browser script navigates to a route, waits for a heading and checks overflow. That does not prove the contract's integrated state journey or catch cross-module corruption. Reports only refreshes and checks labels; Network checks labels/ranking presence without exercising range/filter/drill-down controls.

Required repair: at each contracted width, execute material Reports and Network controls. Add at least one deterministic integrated product sequence that crosses accepted modules and verifies state/data continuity, not only route rendering. Reuse prior module-specific browser regressions where appropriate rather than duplicating every old journey.

### P2 — Tenant-A report isolation test is missing

The contract explicitly requires a tenant-A report to be unable to read tenant-B data. The focal regression proves a tenant admin cannot call the network endpoint, but does not directly attempt Hotel A identity + Hotel B report selection and assert zero tenant-B leakage.

Required repair: add the direct cross-tenant report read denial with known distinct tenant fixtures.

## Accepted foundation to preserve

- CF-I07 Access/RBAC/control-plane guarantees.
- Report capabilities remain admin/ops only according to source canon.
- Network fan-out is server-side and uses configured bindings.
- Missing/unconfigured network binding returns a truthful unavailable error.
- Two real local operational D1 bindings are used for multi-hotel evidence.
- Integer cents are used for stored monetary values.
- Publication A→B is valid.
- No CF-I09, production, remote-D1, paid-resource or cutover scope entered the artifact.

## REWORK-1 exit criteria

Codex must autonomously:

1. map immutable source reporting queries/service formulas to target before changing tests;
2. restore source dashboard KPI semantics and response fields;
3. restore revenue defaults, inclusive end/same-day behavior and non-revenue-state rules;
4. restore daily occupancy series with source numerator/denominator/state/date rules;
5. restore source ADR/RevPAR formulas and integer conversion behavior;
6. restore network per-hotel/total/average semantics and source-compatible field meanings;
7. add deterministic fixtures that distinguish source formulas from the rejected target formulas;
8. prove NoShow/equivalent non-revenue reporting semantics without prematurely performing CF-I09 real-data migration;
9. add direct tenant-A→tenant-B report denial;
10. strengthen Reports/Network material browser actions and one cross-module state/data continuity journey at 375/390/430/768/1024;
11. rerun fresh CF-I03–CF-I07 regressions plus focal/browser/type/build/Wrangler/route checks;
12. correct parity/invariant evidence so no claim is stronger than executable source-derived proof;
13. publish fresh artifact A plus orchestration-only boundary B and stop for Independent Critic.

CF-I09 remains unauthorized until CF-I08 receives Independent Critic PASS.
