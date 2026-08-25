# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-25  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 REWORK-1 READY FOR PUBLICATION`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I08.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I08-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`.
- CF-I07 Users / RBAC / Audit / Hotel-Network Admin — PASS — artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f`, boundary B `c52656fcc311f53be9b584346f2afc9e54796ff9`.
- CF-I08 Analytics / Reports / Integrated Responsive Product — prior artifact A `ed7afe4722650933bc704c1d5f02150cbda82996` — Independent Critic `REWORK-1`; repaired substantive artifact is ready for publication.

## CF-I07 ACCEPTED GUARANTEES — PRESERVE

- Cloudflare Access remains the authentication perimeter; no HMS password recreation.
- Active hotel → operational D1 ownership is unique; undeclared/already-consumed bindings fail closed.
- Source-sensitive RBAC is centralized and protected routes cannot bypass capability authority by direct role shortcut.
- `saas_admin` remains limited to source-canonical network hotel capabilities.
- receptionist cannot list all invoices; ops retains tenant audit access.
- pending-approved checkout requires admin-only override capability.
- shared Access identity rows cannot be tenant-locally rewritten/reactivated.
- user/admin mutations retain exact-winner and truthful-audit behavior.
- tenant-A cannot mutate tenant-B-only memberships.
- tenant audit provenance/scope and plan tiers remain accepted.
- CF-I07 responsive/admin evidence and runner cleanup remain accepted.

## CF-I08 REWORK-1 — REPAIRED FINDINGS

Full verdict: `.orchestration/reviews/CF-I08-CRITIC.md`.

1. `/analytics/kpis` does not preserve source dashboard semantics: target requires a date range and replaces current-month/today dashboard behavior with range/night metrics; arrivals/departures/today check-ins are omitted.
2. ADR/RevPAR formulas drift from source. Source uses `ADR = revenue_month / active_bookings` and `RevPAR = occupancy × ADR / 100`; target uses revenue/occupied-nights and revenue/available-nights.
3. Revenue reporting changes optional/default dates into required dates, inclusive end into exclusive end, rejects source-valid same-day ranges, excludes only `CANCELLED` instead of `CANCELLED + NO_SHOW`, and changes response contract/granularity.
4. Occupancy reporting replaces the source inclusive daily series (`CONFIRMED|CHECKED_IN`, distinct room/day, all-room denominator) with a range aggregate based on `room_inventory_nights` and non-out-of-order rooms.
5. Network analytics inherits the wrong range/night metrics and computes weighted network occupancy instead of the source arithmetic mean of per-hotel occupancy; source output field semantics also drift.
6. Focal tests and parity documentation prove the target-invented formulas against themselves, violating source-derived parity/evidence obligations.
7. Integrated browser evidence is route reachability/overflow-heavy for inherited modules and does not prove the contract's cross-module state/data continuity; Reports/Network material controls are under-exercised.
8. Direct tenant-A → tenant-B report isolation is not explicitly proven.

Diagnosis repaired: `REPORTING_SOURCE_SEMANTICS_DRIFT + KPI_FORMULA_DRIFT + DATE_BOUNDARY_DRIFT + OCCUPANCY_MODEL_DRIFT + NETWORK_AGGREGATION_DRIFT + EVIDENCE_SELF_REFERENCE + INTEGRATED_BROWSER_GAP`.

Human Gate: `NONE`.  
Blocker: `NONE` — routine rework authorized.

## CF-I08 REWORK-1 AUTHORIZED WORK

Codex must autonomously:

1. derive target expectations directly from the immutable source reporting repository/service/handlers before rewriting tests;
2. restore source dashboard KPI semantics and fields;
3. restore report optional/default dates, inclusive end, same-day validity and source non-revenue-state handling;
4. restore the source daily occupancy series and exact state/room denominator rules;
5. restore source ADR/RevPAR formulas and integer conversion semantics;
6. rebuild network aggregation from source-equivalent per-hotel dashboard/report inputs, including arithmetic-mean occupancy and source-compatible output meanings;
7. make reporting safe for source `NO_SHOW` semantics without prematurely entering CF-I09 real-data migration;
8. add deterministic fixtures specifically distinguishing the accepted source formulas from the rejected target formulas;
9. add direct Hotel-A identity → Hotel-B report denial with distinct fixture data;
10. strengthen Reports/Network browser material actions and at least one deterministic cross-module state/data continuity journey at 375/390/430/768/1024;
11. rerun fresh inherited CF-I03–CF-I07 plus focal/browser/type/build/Wrangler/route checks;
12. correct parity/invariant evidence and promote the reporting root causes into the durable harness;
13. publish fresh substantive artifact A plus orchestration-only boundary B and stop for Independent Critic.

## CARRY-FORWARD DEBT

Source `NoShow` is not yet fully representable in the target booking lifecycle/import model. CF-I08 reporting must nevertheless preserve/fail-safe source non-revenue semantics. Full import representation remains due no later than CF-I09; imported NoShow rows must not become Housekeeping tasks or report revenue/occupancy incorrectly.

## DELIVERY SEQUENCE

`CF-I08 REWORK-1 → CF-I09 → complete local HMS Product Acceptance → Cloudflare test environment → Cloudflare validation → production-readiness/release gates`.

No intermediate partial-product user test is required. After CF-I09, the complete application may be run locally for Human Product Acceptance before remote Cloudflare deployment.

## PENDING HUMAN GATES

None.

Paid Cloudflare resources, irreversible provisioning/cutover, product-intent changes or final Product Acceptance remain Human Gates if/when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## NEXT AUTHORIZED ACTION

`CF_I08_AUTONOMOUS_REWORK_1_SOURCE_REPORTING_SEMANTICS_NETWORK_PARITY_INTEGRATED_BROWSER`

Codex has consumed the critique, repaired CF-I08 from immutable source reporting handlers/repositories, passed focal/inherited/browser/build gates and must publish fresh artifact A + orchestration-only boundary B, then stop for Independent Critic.

Do not begin CF-I09 before CF-I08 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
