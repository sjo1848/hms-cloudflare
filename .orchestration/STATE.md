# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-25  
Global Project Mode: `DELIVERY`  
Phase: `BUILD / VALIDATE READINESS`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 PASS / CF-I09 ACTIVE+AUTHORIZED`

Runtime: `WAITING_EXTERNAL_REVIEW` — CF-I09 artifact A is published; boundary B records the external Independent Critic stop.

Current objective: complete the accepted HMS Cloudflare migration locally with deterministic data-migration rehearsal, reconciliation, backup/restore and operational readiness so the Human can perform complete local Product Acceptance before any remote Cloudflare deployment.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I09.md`.
- Last Independent Critic: `.orchestration/reviews/CF-I08-REWORK-4-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Canonical Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Binding multi-context method: `.orchestration/MULTIAGENT-EXECUTION.md`.
- Binding multi-context admission gate: `.orchestration/PRECRITIC-MULTIAGENT.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`.
- CF-I07 Users / RBAC / Audit / Hotel-Network Admin — PASS — artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f`, boundary B `c52656fcc311f53be9b584346f2afc9e54796ff9`.
- CF-I08 Analytics / Reports / Integrated Responsive Product — PASS — artifact A `ab0af4d70f05d507e80fb6a518f7eff890c239db`, boundary B `0bd005850da7019162a87172c68b5daff139bbed`, Independent Critic `.orchestration/reviews/CF-I08-REWORK-4-CRITIC.md`.

## CF-I08 ACCEPTED GUARANTEES — PRESERVE

- source-equivalent revenue/occupancy/dashboard semantics, inclusive dates and same-day ranges;
- `CANCELLED` and `NO_SHOW` excluded from non-revenue/report predicates as accepted by source;
- `NO_SHOW` excluded from Housekeeping departure/turnover work;
- source dashboard alert arrays preserved;
- ADR/RevPAR integer-cent/zero-safe source semantics preserved;
- source-equivalent network per-hotel metrics, arithmetic-mean occupancy and deterministic ranking preserved;
- direct tenant isolation and server-only D1 binding routing preserved;
- Reports/Network material controls plus persisted Housekeeping→Rooms state verified at `375/390/430/768/1024`;
- no-param/start-only/end-only report defaults proven by deterministic returned-row assertions;
- fresh inherited CF-I03/04/05/06/07 plus CF-I08 focal/browser/build/type/Wrangler/static closure accepted.

## METHOD CORRECTION — NOW BINDING

The project MUST NOT return to the old pattern `Codex publishes → External Critic finds routine defect → Codex republishes`.

From CF-I09 onward, every substantive wave must obey `.orchestration/MULTIAGENT-EXECUTION.md` and `.orchestration/PRECRITIC-MULTIAGENT.md`:

`Orchestrator → Implementer lane(s) → separate Internal QA/Critic → automatic repair/re-test → Integration Reviewer → full regressions/evidence audit → Pre-Critic Gate → artifact A → boundary B → External Independent Critic`.

Before artifact publication, Codex must persist `.orchestration/evidence/<TASK-ID>-INTERNAL-REVIEW.md` containing lane decomposition, implementer receipts, separate adversarial QA findings, repair disposition, integration review and zero open P0/P1/P2 issues.

If the runtime cannot create true subagents, it must truthfully use isolated review phases and record the fallback. It cannot claim multi-agent execution that did not occur.

Routine technical REWORK is work, not permission and does not involve the Human. The Human remains Product/Risk Authority only.

## ACTIVE INCREMENT — CF-I09

Artifact A: `a972bca` (internal evidence and invariant gate admitted).

Contract: `.orchestration/contracts/CF-I09.md`.

CF-I09 scope:

- deterministic local PostgreSQL-source-semantics → CONTROL_DB/per-hotel D1 migration rehearsal;
- explicit type/enum/identity/tenant/money/audit mapping;
- two-hotel machine-checkable reconciliation;
- `NO_SHOW` migration safety across reports and Housekeeping;
- replay/duplicate/failure safety;
- local CONTROL_DB + per-hotel D1 backup/restore rehearsal;
- local health/readiness/start/reset path;
- complete local integrated product smoke using real Worker + D1 surfaces;
- fresh inherited CF-I03–CF-I08 regressions;
- mandatory multi-context internal-review receipt before any External Critic publication.

No production, remote D1, real-data migration, paid resource, Access production policy, DNS or cutover action is authorized.

## DELIVERY SEQUENCE

`CF-I09 → External Independent Critic → complete local HMS Human Product Acceptance → Cloudflare test environment → Cloudflare validation → production-readiness/release gates`.

The first Human product test remains the complete local HMS after CF-I09 technical PASS; no partial preview is required.

## PENDING HUMAN GATES

None for CF-I09 local build/readiness work.

Paid Cloudflare resources, irreversible provisioning/cutover, significant unresolved product/security risk tradeoff, real-data production migration and final Human Product Acceptance remain Human Gates when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## NEXT AUTHORIZED ACTION

`CF_I09_MULTI_CONTEXT_MIGRATION_REHEARSAL_RECONCILIATION_BACKUP_RESTORE_LOCAL_READINESS`

Codex reads the active Task Contract and binding multi-context method, decomposes CF-I09 into independent implementation/QA/integration lanes, repairs internally until admission gates pass, publishes one mature fresh artifact A plus orchestration-only boundary B, then stops for External Independent Critic or a legitimate Human Gate.
