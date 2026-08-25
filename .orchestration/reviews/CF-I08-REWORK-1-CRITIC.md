# CF-I08 REWORK-1 — External Independent Critic

Verdict: `REWORK-2`
Human Gate: `NONE`
Artifact A reviewed: `6030be4d63e0a4424d6142bce5bac4e6d9b5f422`
Boundary B reviewed: `e6aabf0256cf33bbc8817f21238ee460f95708a6`

## Accepted repairs to preserve

- Boundary B is orchestration-only and points exactly to artifact A.
- Revenue report is again an array of daily rows, uses inclusive `start <= check_in <= end`, accepts same-day ranges and excludes `CANCELLED` + `NO_SHOW`.
- Occupancy report is again an inclusive daily series with distinct occupied rooms, only `CONFIRMED|CHECKED_IN`, and all rooms as denominator.
- Dashboard ADR/RevPAR formulas are restored to source semantics: integer-truncated `revenue_month / active_bookings`, then integer-truncated `occupancy * ADR / 100`.
- Network rows use source-equivalent current dashboard metrics plus range revenue and arithmetic-mean hotel occupancy; configured missing bindings fail truthfully.
- Direct Hotel-A identity selecting Hotel-B report is denied.
- `NO_SHOW` is now representable in the local booking schema for reporting parity.

## Blocking findings

### P1 — `NO_SHOW` schema expansion regresses Housekeeping semantics

CF-I08 adds `NO_SHOW` to the target booking enum/schema, but `GET /housekeeping/board` still queries departures with `b.status NOT IN ('CANCELLED')`. A `NO_SHOW` checkout on the requested day therefore becomes a turnover/departure item, contrary to the source rule that both Cancelled and NoShow are excluded.

This is now an executable product bug, not deferred import debt, because the status is representable in the target DB.

Required repair/evidence:
- Housekeeping departure/turnover predicates exclude both `CANCELLED` and `NO_SHOW`.
- deterministic Hotel-A `NO_SHOW` departure fixture does not appear in `departures_today`, does not set `turnover_today`, and does not become a cleaning action;
- rerun fresh CF-I05 regression plus a new cross-module NoShow assertion after migration 0013.

### P1 — dashboard response shape still loses source operational semantics

Source `DashboardKpis` exposes `arrivals_today: BookingAlert[]` and `departures_today: BookingAlert[]`, each carrying `booking_id`, `guest_name`, `room_number`, and `status`. Artifact A instead returns only `arrivals_today_count` and `departures_today_count`.

The contract requires source-equivalent dashboard fields and arrivals/departures where represented. Counts are not an equivalent representation because downstream dashboard priority/work surfaces can identify and act on the concrete booking alerts.

Required repair/evidence:
- `/analytics/kpis` returns source-compatible `arrivals_today` and `departures_today` arrays with exact source predicates and fields;
- retain `today_check_ins` and all existing KPI fields;
- deterministic fixture asserts identities/statuses, not only counts;
- remove target-only count replacements unless they are additive and do not replace the canonical fields.

### P1 — optional date defaults are not source-equivalent for an `end`-only request

Source handlers default `start` to `today - 30 days` and `end` to `today` independently. Target `optionalRange()` derives default `start` from the supplied `end` (`end - 30 days`). Therefore an `end`-only historical request can succeed on a different window where the source would use `today-30 .. supplied-end` and may reject it as inverted.

Required repair/evidence:
- defaults are computed independently from current date exactly as source;
- explicit tests for no params, start-only, end-only, same-day and inverted ranges;
- freeze/derive deterministic current-date fixtures rather than weakening assertions around wall-clock time.

### P1 — integrated browser contract remains route-reachability evidence, not state integration

The REWORK-1 Critic required a deterministic cross-module state/data continuity journey. Current browser evidence still navigates inherited routes, waits for headings and checks horizontal overflow. It does not prove that a material state change in one accepted module is reflected correctly in another module/reporting surface.

Required repair/evidence:
- at least one browser journey at the contracted responsive set (or source-justified representative widths if the contract/evidence is narrowed) that performs a real material mutation and then verifies its authoritative consequence in another module;
- suitable examples include a booking/billing change reflected in Reports, or lifecycle state reflected in Housekeeping/analytics, using real local API/D1 rather than mocked values;
- preserve existing Reports/Network same-day controls and responsive assertions.

### P2 — focal dashboard evidence is deliberately non-deterministic

The focal regression accepts `revenue_month_cents` as either `0` or `12345`, even though the current fixture and source formula should have one exact expected result for a controlled test date. This masks future wall-clock drift and cannot serve as independent source-derived proof.

Required repair/evidence:
- make dashboard fixtures relative to a controlled/current test date or otherwise deterministic;
- assert one exact revenue, active-booking, occupancy, ADR, RevPAR, arrivals and departures result;
- no `one-of` expectation for source parity.

## Exit criteria for REWORK-2

1. Preserve every accepted reporting/network repair listed above.
2. Fix NoShow propagation across Housekeeping and prove zero turnover/work creation.
3. Restore source dashboard alert arrays and exact field shape.
4. Restore independent optional-date defaults and deterministic date tests.
5. Add real cross-module browser state-continuity evidence.
6. Replace non-deterministic dashboard assertions with exact source-derived expectations.
7. Fresh CF-I03–CF-I07 plus CF-I08 focal/browser/type/build/Wrangler/route checks PASS.
8. Update parity/invariant/Pre-Critic evidence to match executable proof exactly.
9. Publish fresh substantive artifact A + orchestration-only boundary B and stop for Independent Critic.

CF-I09 remains unauthorized until CF-I08 receives Independent Critic PASS.
