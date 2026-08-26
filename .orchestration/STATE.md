# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-26  
Global Project Mode: `DELIVERY`  
Phase: `BUILD / VALIDATE READINESS`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 PASS / CF-I09 REWORK-4 ARTIFACT A5 PUBLISHED`

Runtime: `WAITING_EXTERNAL_REVIEW` — REWORK-4 acceptance runtime repaired and A5 published; awaiting Independent Critic.

Current objective: obtain Independent Critic review of exact Artifact A5 and boundary B5 before Human Local Product Acceptance.

## CANONICAL SOURCES

- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- CF-I09 contract: `.orchestration/contracts/CF-I09.md`.
- Prior A4 technical review: `.orchestration/reviews/CF-I09-A4-CRITIC.md`.
- Current post-PASS verdict: `.orchestration/reviews/CF-I09-POST-PASS-REWORK-4.md`.
- Local acceptance runbook: `docs/cf-i09-local-operational-readiness.md`.
- Machine state: `.orchestration/STATUS.json`.
- Method: `.orchestration/MULTIAGENT-EXECUTION.md`, `.orchestration/PRECRITIC-MULTIAGENT.md`, `.orchestration/PRECRITIC-GATE.md`.

## VALIDATED RESULTS PRESERVED

- CF-I01 through CF-I08 remain accepted.
- CF-I09 A1/B1 — REWORK-1.
- CF-I09 A2/B2 — REWORK-2.
- CF-I09 A3/B3 — REWORK-3.
- CF-I09 A4 `fcb4dd464e8d34f80c27c034e48ec9bc62c912f3` / B4 `5d315de8ed6cccb585b16929e56e7371f819bd5e` closed lifecycle/source/RBAC parity findings.
- A4's prior readiness PASS is reopened only because new real acceptance-bootstrap execution evidence disproved the claimed local startup/readiness path.

## REWORK-4 DIAGNOSIS

The focal rehearsal and actual Human acceptance runtime use different persistence modes:

- `scripts/migration/test-rehearsal.sh` enables `CF_I09_ISOLATED_PERSISTENCE=1`, avoiding shared three-D1 lock contention.
- `scripts/cf-i09-local-reset.sh` invokes the same rehearsal against `apps/api/.wrangler/state` without that mode, returning all bindings to the known shared persistence root.
- Real acceptance execution therefore hangs during reset; backup/restore, smoke and `local-start --reset` cannot proceed.

Diagnosis: `ACCEPTANCE_RUNTIME_PERSISTENCE_MODE_MISMATCH + SHARED_D1_RESET_HANG + LOCAL_READINESS_EVIDENCE_OVERCLAIM`.

## REWORK-4 EXIT

Codex must autonomously:

1. preserve all accepted A4 source parity, lifecycle exactness, tenant/RBAC, money and replay/failure guarantees;
2. repair the actual local acceptance persistence/runtime topology, not merely the isolated focal test;
3. ensure reset, reconciliation, Worker startup, backup/export/restore, smoke and Human browsing use the same intended CONTROL_DB + HOTEL_DEMO_DB + HOTEL_SECOND_DB state;
4. eliminate or deterministically bypass the Wrangler 4.125 shared-persistence hang without remote resources or production-topology changes;
5. add bounded regression where a hanging reset is a test failure, never a successful workaround;
6. execute the exact acceptance sequence fresh: focal rehearsal → backup/restore rehearsal → complete Worker+D1/browser smoke → `local-start --reset` → `/ready` + frontend + three-D1 verification → clean stop;
7. repeat reset/start/stop enough to prove no stale-process/lock dependency;
8. rerun contracted inherited CF-I03–CF-I08 plus unit/type/build/Wrangler/static/scope checks;
9. complete fresh Internal QA/Critic + Integration Review explicitly attempting to reproduce the original hang;
10. update runbook/invariant/Pre-Critic evidence so readiness claims match the exact Human path;
11. publish fresh substantive A5 then orchestration-only B5 with exact A5 SHA and stop `WAITING_EXTERNAL_REVIEW`;
12. no Human Gate, remote D1, paid resource, production, real-data migration, DNS/Access production change or cutover.

## DELIVERY SEQUENCE

`CF-I09 REWORK-4 → External Independent Critic → Human Local Product Acceptance → Cloudflare test environment authorization → Cloudflare validation → production-readiness/release gates`.

## NEXT AUTHORIZED ACTION

`CF_I09_EXTERNAL_INDEPENDENT_CRITIC_REVIEW_A5`

Human routine relay is forbidden. Human Product Acceptance remains deferred until external review of A5 passes.
