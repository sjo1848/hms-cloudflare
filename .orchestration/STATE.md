# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-25  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 REWORK-3 ARTIFACT PUBLISHED — INDEPENDENT CRITIC PENDING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I08.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I08-REWORK-2-CRITIC.md`.
- Binding REWORK-3 Pre-Critic supplement: `.orchestration/PRECRITIC-CF-I08-REWORK-3.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Canonical Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`.
- CF-I07 Users / RBAC / Audit / Hotel-Network Admin — PASS — artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f`, boundary B `c52656fcc311f53be9b584346f2afc9e54796ff9`.
- CF-I08 initial artifact `ed7afe4722650933bc704c1d5f02150cbda82996` — Independent Critic REWORK-1.
- CF-I08 REWORK-1 artifact A `6030be4d63e0a4424d6142bce5bac4e6d9b5f422`, boundary B `e6aabf0256cf33bbc8817f21238ee460f95708a6` — Independent Critic REWORK-2.
- CF-I08 REWORK-2 artifact A `2fb282eafcc578e8f99d7d64c7205d07c197ce0f`, boundary B `655471550b6536efcd7a61be7f4a506032139ed3` — Independent Critic REWORK-3.
- CF-I08 REWORK-3 artifact A `fe174524851e5d2f64baced1001a70466cfc300e` — fresh inherited/focal/browser/build evidence complete; awaiting boundary B publication.

## CF-I08 ACCEPTED FUNCTIONAL FOUNDATION — PRESERVE

The following repairs are accepted and must not regress during REWORK-3:

- revenue reports preserve source inclusive date semantics, same-day ranges and `CANCELLED` + `NO_SHOW` non-revenue exclusion;
- occupancy reports preserve the source inclusive daily series, distinct-room numerator, `CONFIRMED|CHECKED_IN` inclusion and all-room denominator;
- dashboard ADR/RevPAR formulas match the immutable source and remain integer-cent/zero-safe;
- network aggregation uses source-equivalent per-hotel dashboard metrics, range revenue, arithmetic-mean occupancy and deterministic revenue ranking;
- missing configured operational bindings fail truthfully;
- direct Hotel-A identity selecting Hotel-B report data is denied;
- local booking schema represents `NO_SHOW` for parity;
- Housekeeping excludes `NO_SHOW` from departure/turnover work;
- `/analytics/kpis` returns source-compatible `arrivals_today[]` and `departures_today[]` booking alerts with booking/guest/room/status fields;
- optional report dates are implemented independently from UTC today;
- browser continuity performs a real Housekeeping maintenance mutation and observes `Maintenance` on the Rooms surface;
- publication A→B remains non-circular and B changes orchestration metadata only.

## CF-I08 REWORK-3 BLOCKING FINDINGS

Full verdict: `.orchestration/reviews/CF-I08-REWORK-2-CRITIC.md`.

1. Contracted responsive coverage regressed: the published browser script executes Reports/integrated navigation only at 375 and Network only at 1024. The contract requires material integrated evidence at `375 / 390 / 430 / 768 / 1024`.
2. Required fresh inherited regression is UNPROVEN: canonical publication state records CF-I03 fixture cleanup failed on foreign-key ordering before assertions. The contract requires fresh CF-I03/04/05/06/07 PASS.
3. Evidence files overclaim all-five-width browser PASS and fresh inherited PASS despite the executable/canonical result above.
4. Dashboard current-month focal is calendar-fragile: its hard-coded 12000 revenue expectation is wrong on the first UTC day of a month because the departure booking's check-in is then in the previous month.
5. No-param/start-only/end-only tests currently assert HTTP 200 but do not prove the effective independent source default window; implementation appears corrected but executable semantic proof is incomplete.

Diagnosis: `RESPONSIVE_WIDTH_COVERAGE_REGRESSION + INHERITED_REGRESSION_UNPROVEN + EVIDENCE_CANON_CONTRADICTION + MONTH_BOUNDARY_TEST_FRAGILITY + DATE_DEFAULT_EVIDENCE_GAP`.
Human Gate: `NONE`.
Blocker: `NONE` — routine REWORK-3 is authorized.

## CF-I08 REWORK-3 AUTHORIZED WORK

Codex must autonomously:

1. preserve every accepted functional repair above;
2. restore material Reports, Network and integrated state/navigation browser execution at 375, 390, 430, 768 and 1024; retain one real cross-module mutation and prove persisted state through the integrated UI;
3. repair CF-I03 fixture cleanup so it respects the full current downstream schema/foreign keys, then obtain fresh terminal PASS for required CF-I03/04/05/06/07 regressions;
4. make dashboard current-month focal expectations source-derived and valid across UTC month boundaries;
5. make optional no-param/start-only/end-only tests prove the actual default window/result, not status alone;
6. correct `.orchestration/evidence/CF-I08-INVARIANTS.md` and `CF-I08-PRECRITIC-GATE.md` so they match the final completed execution exactly;
7. run fresh CF-I08 focal/browser plus unit/type/build/Wrangler/route/diff checks;
8. publish a fresh substantive artifact A plus orchestration-only boundary B and stop for Independent Critic.

## DELIVERY SEQUENCE

`CF-I08 REWORK-3 → CF-I09 → complete local HMS Product Acceptance → Cloudflare test environment → Cloudflare validation → production-readiness/release gates`.

After CF-I09, the complete application may be run locally for Human Product Acceptance before remote Cloudflare deployment.

## PENDING HUMAN GATES

None.

Paid Cloudflare resources, irreversible provisioning/cutover, product-intent changes or final Product Acceptance remain Human Gates if/when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## NEXT AUTHORIZED ACTION

`INDEPENDENT_CRITIC_AUDIT_CF_I08_REWORK_3_ARTIFACT_fe17452`

Do not begin CF-I09 before CF-I08 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
