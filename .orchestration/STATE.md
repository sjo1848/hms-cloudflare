# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-25  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 REWORK-2 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I08.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I08-REWORK-1-CRITIC.md`.
- Prior CF-I08 Critic: `.orchestration/reviews/CF-I08-CRITIC.md`.
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
- CF-I08 initial artifact `ed7afe4722650933bc704c1d5f02150cbda82996` — Independent Critic REWORK-1.
- CF-I08 REWORK-1 artifact A `6030be4d63e0a4424d6142bce5bac4e6d9b5f422`, boundary B `e6aabf0256cf33bbc8817f21238ee460f95708a6` — Independent Critic REWORK-2.

## CF-I08 REWORK-1 ACCEPTED REPAIRS — PRESERVE

- Revenue report again uses source inclusive dates, accepts same-day ranges and excludes `CANCELLED` + `NO_SHOW`.
- Occupancy report again emits the source inclusive daily series using distinct rooms, `CONFIRMED|CHECKED_IN` and all rooms as denominator.
- Dashboard ADR/RevPAR formulas are restored to source semantics and integer conversion behavior.
- Network aggregation uses current per-hotel dashboard metrics plus range revenue, arithmetic-mean occupancy and deterministic revenue ranking.
- Missing configured bindings fail truthfully.
- Direct Hotel-A identity selecting Hotel-B report is denied.
- Local booking schema now represents `NO_SHOW` for reporting parity.
- Artifact publication A -> B is non-circular and B is orchestration-only.

## CF-I08 REWORK-2 BLOCKING FINDINGS

Full verdict: `.orchestration/reviews/CF-I08-REWORK-1-CRITIC.md`.

1. Adding `NO_SHOW` made an existing Housekeeping predicate unsafe: `/housekeeping/board` excludes only `CANCELLED`, so `NO_SHOW` can now become a departure/turnover cleaning item. Source excludes both Cancelled and NoShow.
2. `/analytics/kpis` still replaces source `arrivals_today[]` / `departures_today[]` booking alerts with count-only fields, losing booking/guest/room/status semantics required by the accepted dashboard contract.
3. Optional report defaults still drift for an `end`-only request: source defaults start from current date independently; target derives start from supplied end.
4. Integrated browser evidence remains inherited-route reachability/overflow rather than a real cross-module state/data continuity journey.
5. Dashboard focal evidence accepts multiple possible revenue values based on wall-clock drift instead of one deterministic source-derived result.

Diagnosis: `ENUM_EXPANSION_CROSS_MODULE_REGRESSION + DASHBOARD_RESPONSE_SHAPE_DRIFT + OPTIONAL_DATE_DEFAULT_DRIFT + INTEGRATED_STATE_EVIDENCE_GAP + WALL_CLOCK_TEST_NONDETERMINISM`.
Human Gate: `NONE`.
Blocker: `NONE` — routine REWORK-2 is authorized.

## CF-I08 REWORK-2 AUTHORIZED WORK

Codex must autonomously:

1. preserve every accepted REWORK-1 repair above;
2. update Housekeeping departure/turnover predicates to exclude `NO_SHOW` and prove a NoShow departure creates no turnover/cleaning work;
3. restore source-compatible `arrivals_today` and `departures_today` alert arrays in dashboard KPIs, with booking id, guest, room and status;
4. restore source-independent optional date defaults and test no-param/start-only/end-only/same-day/inverted ranges;
5. make dashboard fixtures deterministic and assert one exact revenue/occupancy/ADR/RevPAR/arrival/departure result;
6. add at least one real browser cross-module state/data continuity journey using local API/D1 and user-visible surfaces;
7. rerun fresh CF-I03–CF-I07 plus CF-I08 focal/browser/type/build/Wrangler/route checks;
8. correct parity/invariant/Pre-Critic evidence and promote the reusable enum-expansion/default/output-shape lessons into the harness;
9. publish fresh substantive artifact A plus orchestration-only boundary B and stop for Independent Critic.

## DELIVERY SEQUENCE

`CF-I08 REWORK-2 → CF-I09 → complete local HMS Product Acceptance → Cloudflare test environment → Cloudflare validation → production-readiness/release gates`.

After CF-I09, the complete application may be run locally for Human Product Acceptance before remote Cloudflare deployment.

## PENDING HUMAN GATES

None.

Paid Cloudflare resources, irreversible provisioning/cutover, product-intent changes or final Product Acceptance remain Human Gates if/when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## NEXT AUTHORIZED ACTION

`CF_I08_AUTONOMOUS_REWORK_2_NOSHOW_CROSS_MODULE_DASHBOARD_ALERTS_DATE_DEFAULTS_STATE_CONTINUITY`

Codex reads canonical state plus `.orchestration/reviews/CF-I08-REWORK-1-CRITIC.md`, executes REWORK-2 autonomously, publishes fresh artifact A + orchestration-only boundary B, then stops for Independent Critic.

Do not begin CF-I09 before CF-I08 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
