# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-25  
Global Project Mode: `DELIVERY`  
Phase: `BUILD / VALIDATE READINESS`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 PASS / CF-I09 REWORK-2 IN PROGRESS`

Runtime: `READY_TO_RESUME` — External Independent Critic reviewed CF-I09 Artifact A2 and returned REWORK-2. Code repairs are present; focal three-binding rehearsal has a bounded shared-persistence runtime hang under diagnosis. No Human Gate and no final blocker accepted.

Current objective: complete the accepted HMS Cloudflare migration locally with deterministic source-parity migration, reconciliation, backup/restore and operational readiness so the Human can perform complete local Product Acceptance before any remote Cloudflare deployment.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I09.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I09-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Canonical Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Binding multi-context method: `.orchestration/MULTIAGENT-EXECUTION.md`.
- Binding multi-context admission gate: `.orchestration/PRECRITIC-MULTIAGENT.md`.
- Binding model/token policy: `.orchestration/MODEL-REASONING-POLICY.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`.
- CF-I07 Users / RBAC / Audit / Hotel-Network Admin — PASS — artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f`, boundary B `c52656fcc311f53be9b584346f2afc9e54796ff9`.
- CF-I08 Analytics / Reports / Integrated Responsive Product — PASS — artifact A `ab0af4d70f05d507e80fb6a518f7eff890c239db`, boundary B `0bd005850da7019162a87172c68b5daff139bbed`.
- CF-I09 Artifact A1 `a972bca40ed60505bc42f5ae560977886c2972ab`, boundary B1 `54d8ad2e77b78f4101a14501b7e81ef014c9be2a` — Independent Critic **REWORK-1**.
- CF-I09 Artifact A2 `e483e6b3d973491caa7eb25d119e41d5804f2ae0`, boundary B2 `f9c510c8c2bd6f5bdfc72a9f757e40a149e768e4` — External Independent Critic **REWORK-2**.

## CF-I08 ACCEPTED GUARANTEES — PRESERVE

- source-equivalent revenue/occupancy/dashboard semantics, inclusive dates and same-day ranges;
- `CANCELLED` and `NO_SHOW` excluded from accepted non-revenue/report predicates;
- `NO_SHOW` excluded from Housekeeping departure/turnover work;
- source dashboard alert arrays preserved;
- ADR/RevPAR integer-cent/zero-safe source semantics preserved;
- source-equivalent network metrics, arithmetic-mean occupancy and deterministic ranking;
- direct tenant isolation and server-only D1 binding routing;
- material responsive product evidence at `375/390/430/768/1024`;
- deterministic no-param/start-only/end-only report defaults;
- accepted fresh inherited CF-I03–CF-I07 closure.

## CF-I09 ACCEPTED FOUNDATION — PRESERVE

A1/A2 establish a strong local-only migration/readiness foundation. REWORK-2 must preserve:

- source→CONTROL_DB/per-hotel-D1 rehearsal with explicit two-binding routing;
- UUID/TEXT, integer-cent, DATE/UTC/JSON normalization and explicit source-field disposition;
- `NO_SHOW` migration/report/Housekeeping safety;
- replay refusal before business mutation, partial-run failure handling and deterministic reconciliation;
- exact reconciliation beyond row counts, including references, money, events, tenant ownership and reporting outputs;
- local Access bypass restricted to development + explicit opt-in + loopback;
- `/ready`, reset/start/stop and local-only backup/restore with post-restore reconciliation;
- full local Worker+D1/Playwright product smoke and fresh inherited CF-I03–CF-I08 regressions;
- source-valid `saas_admin` represented as network-only membership, not tenant admin promotion;
- legacy NULL payment and maintenance actor provenance preserved without false attribution;
- truthful model/reasoning receipt and exact A2 publication SHA;
- explicit SaaS browser profile persistence;
- no remote, paid, real-data, production or cutover scope.

## CF-I09 REWORK-2 BLOCKING FINDINGS

Full verdict: `.orchestration/reviews/CF-I09-CRITIC.md`.

1. **Booking NULL actor snapshot parity — P1.** Source `checked_in_by_user_id` / `checked_out_by_user_id` are nullable and target booking snapshot columns are nullable, but A2 writes unknown sentinels into the booking snapshot. Preserve NULL exactly there. Unknown sentinel is only for a reconstructed lifecycle event that actually occurred and whose target event actor is NOT NULL. Add exact reconciliation for booking lifecycle actor snapshot columns and fixture/preflight coverage for event/no-event + NULL/real actor combinations.
2. **Source nullable-actor audit inaccurate — P2.** The claimed `0001–0030` sweep misclassifies source migration families. Correct it from the actual source migrations, including nullable room-hold creator in 0020, check-in/out actors in 0022, terminal/late-arrival actors in 0026, maintenance legacy reporter in 0028, audit actor, payments and every other applicable actor/identity surface.
3. **`saas_admin` tenant-operation DENY evidence missing — P2.** Keep positive network ALLOW and structural no-hotel-membership proof, and add explicit behavioral `403` for migrated `saas_admin` attempting a representative hotel-operational route with hotel context.

Diagnosis: `BOOKING_NULL_ACTOR_SNAPSHOT_PARITY_GAP + SOURCE_NULLABILITY_AUDIT_INACCURATE + SAAS_ADMIN_TENANT_DENY_EVIDENCE_MISSING`.

## METHOD / TOKEN POLICY — BINDING

Every reopened CF-I09 lane follows:

`Orchestrator → Implementer lane(s) → separate Internal QA/Critic → automatic repair/re-test → Integration Reviewer → full regressions/evidence audit → Pre-Critic Gate → artifact A → boundary B → External Independent Critic`.

Model policy is Luna-first:

- Orchestrator `Luna LOW` default, `Luna MEDIUM` only when needed;
- ordinary Implementer `Luna LOW`;
- migration/money/tenant/security/concurrency Implementer `Luna MEDIUM`;
- Internal QA/Critic `Luna MEDIUM`;
- Integration Reviewer `Luna MEDIUM`;
- Luna HIGH narrow/final-risk only;
- Terra only after bounded demonstrated Luna insufficiency;
- Sol prohibited by default and only after bounded Luna + Terra failure on unresolved P0/P1.

Receipt must record actual execution truthfully. Human routine relay is forbidden.

## REWORK-2 EXIT

Codex must autonomously:

1. preserve all accepted A2 repairs and prior CF-I09 foundation;
2. preserve NULL exactly in booking snapshot lifecycle actor columns and restrict unknown sentinel use to real reconstructed lifecycle events requiring non-null actors;
3. add exact actor snapshot reconciliation and deterministic positive/negative fixture/preflight coverage;
4. correct the exhaustive source `0001`–`0030` nullable/legacy actor/identity sweep against actual source migrations;
5. add explicit migrated `saas_admin` hotel-operation DENY behavior while preserving network ALLOW;
6. rerun migration/reconciliation, replay/partial failure, backup/restore and complete local Worker+D1/Playwright smoke;
7. rerun fresh inherited CF-I03–CF-I08 plus type/unit/build/Wrangler/route/diff/scope checks;
8. complete fresh Internal QA/Critic + Integration Review with zero open P0/P1/P2 and truthful model receipts;
9. correct invariant/Pre-Critic evidence so no PASS exceeds executable proof;
10. publish fresh substantive artifact A3 followed by orchestration-only B3 containing exact full A3 SHA;
11. stop in `WAITING_EXTERNAL_REVIEW` for the next External Independent Critic.

## DELIVERY SEQUENCE

`CF-I09 REWORK-2 → External Independent Critic → complete local HMS Human Product Acceptance → Cloudflare test environment → Cloudflare validation → production-readiness/release gates`.

No production, remote D1, real-data migration, paid resource, Access production policy, DNS or cutover action is authorized.

## PENDING HUMAN GATES

None. REWORK-2 is ordinary autonomous technical repair. No blocker is accepted.

Paid Cloudflare resources, irreversible provisioning/cutover, significant unresolved product/security risk tradeoff, real-data production migration and final Human Product Acceptance remain Human Gates only when actually reached.

## NEXT AUTHORIZED ACTION

`CF_I09_REWORK_2_RUNTIME_DIAGNOSIS_THEN_FULL_REHEARSAL_AND_A3`

Codex consumes the canonical critic/state, performs autonomous REWORK-2 through Internal QA/Critic, Integration Review, full regression and Pre-Critic closure, publishes one mature fresh A3+B3, then stops for External Independent Critic. Human relay is not required.
