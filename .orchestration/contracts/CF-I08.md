# TASK CONTRACT — CF-I08

TASK ID: `CF-I08`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME ORCHESTRATOR / ANALYTICS + REPORTING + INTEGRATION WAVE`  
STATUS: `READY / AUTHORIZED AFTER CF-I07 PASS`

## OBJECTIVE

Migrate and integrate the accepted HMS analytics, reporting and multi-hotel KPI capabilities to the Cloudflare target while preserving source financial/reporting semantics, tenant isolation, RBAC, date-range behavior, operational UX and responsive product integration across the already-migrated application.

CF-I08 is also the first full integrated product pass: it must prove that Reception, Rooms/Guests, lifecycle, Housekeeping/Maintenance, Billing, Users/Admin, Reports and Network surfaces coexist correctly in one responsive target without weakening prior accepted invariants.

## CANONICAL INPUTS

- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Source reporting service: `backend/src/application/reporting_service.rs`.
- Source reporting handlers/routes and repositories.
- Source reports UX: `frontend/src/features/reports/ReportsPage.tsx`.
- Source network analytics UX: `frontend/src/features/dashboard/HotelNetworkPage.tsx` and hotel service.
- Source RBAC canon: `docs/validation/rbac-canon-v1.json`.
- Accepted target baseline through CF-I07 PASS artifact `fdf9c6f82c3c5066152e49ecba70268d669a640f`.
- `.orchestration/INVARIANTS.md` and `.orchestration/PRECRITIC-GATE.md`.

## SOURCE SEMANTICS TO PRESERVE

At minimum preserve or explicitly map:

- dashboard summary KPIs including occupancy rate, active bookings, current-period revenue, arrivals/departures/check-ins where represented;
- ADR derived from revenue / active bookings with zero-safe behavior;
- RevPAR derived from occupancy × ADR with source-equivalent rounding/cent semantics;
- revenue report over an explicit validated date range;
- occupancy report over an explicit validated date range;
- network KPI summary over configured hotels, including total hotels, active bookings, total revenue, average occupancy and per-hotel rows;
- per-hotel network rows with plan tier, occupancy, active bookings, revenue, ADR and RevPAR;
- deterministic source ordering where material, including network rows by descending revenue unless the source defines another explicit order;
- source date defaults/range validation where applicable;
- integer-cent money semantics throughout reporting outputs.

Do not substitute placeholder/random analytics, browser-computed financial values or cross-tenant client aggregation for authoritative backend reporting.

## RBAC / TENANT CONTRACT

- hotel analytics/reporting read capabilities must match the source-canonical capability matrix;
- `admin` / `ops` report/analytics access must remain source-equivalent;
- roles without the relevant report capability fail closed;
- network multi-hotel analytics is an explicit network/control-plane capability and must not become ordinary tenant access;
- each hotel report reads only its selected operational D1;
- cross-hotel aggregation may coordinate server-side reads across configured D1 bindings, but no client-supplied binding name can select a database;
- one-hotel-per-D1 ownership and CF-I07 Access/RBAC guarantees remain binding;
- errors from a missing/unconfigured hotel binding must fail truthfully rather than silently omitting a hotel from totals.

## REPORTING / FINANCIAL INTEGRITY

Applicable: `INV-MONEY-001`, `INV-TENANT-001`, `INV-RBAC-001`, `INV-PARITY-001`, `INV-ORDER-001`, `INV-ENUM-001` where serialization differs, `INV-EVID-001`, `INV-RESP-001`, `INV-STATE-001`, `INV-SCOPE-001`.

Required:

- integer cents only for revenue/ADR/RevPAR;
- explicit zero denominators and empty-range behavior;
- deterministic date boundaries, including end-date semantics matching source;
- cancelled/non-revenue/booking-state inclusion rules mapped from source repository queries;
- occupancy numerator/denominator semantics mapped from source, not guessed from room status alone;
- no double counting across payments/invoices/bookings;
- network totals must equal their per-hotel authoritative inputs under deterministic fixtures;
- report reads must not mutate operational state except source-equivalent read/audit telemetry where explicitly required.

## API / TARGET SURFACES

Implement source-equivalent target routes using the existing `/api/v1` convention. Exact route names should preserve source contracts where already canonical, including equivalents of:

- dashboard/analytics KPI summary;
- revenue report;
- occupancy report;
- `/hotels/network-kpis` replacing the CF-I07 truthful placeholder;
- any feature/plan metadata needed to render the accepted reports/network UX.

Temporary `/v2`, duplicate or shadow report routes are forbidden.

## UX / INTEGRATED PRODUCT

### Reports

Preserve the material source journey:

- reports route reachable only for authorized roles;
- date-range controls;
- revenue and occupancy views/cards/tables/charts where product-significant;
- loading, error, empty and success states;
- values and labels reflect backend results, not frontend approximations;
- mobile task flow remains usable without horizontal overflow.

### Network analytics

Complete the CF-I07 deferred network KPI shell with real authoritative analytics:

- range selection;
- all-properties / selected-property filtering;
- total hotels, network revenue, active bookings and average occupancy;
- per-property benchmark rows;
- revenue/occupancy ranking where present in source;
- property drill-down with occupancy, revenue, ADR, RevPAR and plan context;
- no false KPI when a store is unavailable.

### Integrated responsive application

Execute representative end-to-end navigation and state integration across:

- Reception / bookings lifecycle;
- Rooms / guests;
- Housekeeping / maintenance;
- Billing / cash operations;
- Users / security admin;
- Reports;
- Network admin/analytics where network identity is used.

Contracted widths: `375 / 390 / 430 / 768 / 1024`.

This integrated pass must catch broken navigation, stale auth role assumptions, incompatible enum/display mappings, horizontal overflow, hidden actions, cross-module state corruption and report values that disagree with underlying accepted business data.

## REQUIRED ADVERSARIAL TESTS

At minimum:

- known deterministic fixture where expected revenue/occupancy/ADR/RevPAR are independently calculable;
- zero active bookings / zero denominator behavior;
- empty report range;
- invalid date range rejection;
- cancellation/non-revenue state negative case according to source semantics;
- report role allow/deny matrix;
- tenant-A report cannot read tenant-B data;
- network totals exactly equal deterministic Hotel A + Hotel B fixtures;
- network ranking expected identity is asserted independently of target output order;
- missing/unconfigured operational binding produces truthful failure and no partial misleading summary;
- cents remain exact for values that would expose floating-point errors;
- all inherited CF-I03/04/05/06/07 focal regressions pass fresh;
- browser integrated journeys at all contracted widths.

## EVIDENCE / PRE-CRITIC

Before publication:

- explicit source→target reporting semantics matrix;
- explicit KPI formula/date-boundary/state-inclusion mapping;
- `.orchestration/evidence/CF-I08-INVARIANTS.md`;
- `.orchestration/evidence/CF-I08-PRECRITIC-GATE.md`;
- focal deterministic D1/API report regression;
- multi-hotel aggregation regression with two real configured local D1 bindings;
- responsive Reports + Network browser regression;
- integrated cross-module browser smoke/journey evidence;
- fresh inherited CF-I03–CF-I07 regressions;
- unit/type/build/Wrangler dry-run and route-uniqueness checks;
- no applicable invariant `FAIL` or `UNPROVEN`.

Publication follows `INV-STATE-001`: substantive artifact A, exact orchestration-only boundary B, then stop for Independent Critic.

## FORBIDDEN ACTIONS

- CF-I09 production migration rehearsal/cutover/readiness work beyond evidence needed to prove report semantics;
- real production D1 creation/mutation;
- production deployment/cutover;
- paid Cloudflare transition without Human Gate;
- changing accepted billing/lifecycle/security product intent to simplify reporting;
- browser-side cross-tenant database aggregation;
- fake/placeholder analytics presented as real.

## DONE WHEN

Authoritative hotel and network analytics/reporting match source semantics, money/date/state rules are deterministic, RBAC/tenant isolation remain intact, the deferred network KPI shell is backed by real two-hotel data, Reports and Network UX work at all contracted widths, all prior migrated modules coexist in an integrated responsive pass, all inherited/focal regressions pass fresh, publication A+B is correct, and the artifact stops for Independent Critic without entering CF-I09 or production scope.
