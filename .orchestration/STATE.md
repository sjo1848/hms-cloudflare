# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-25  
Global Project Mode: `DELIVERY`  
Phase: `BUILD / VALIDATE READINESS`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 PASS / CF-I09 REWORK-1 AUTHORIZED`

Runtime: `RUNNING` — isolated clean-persist Wrangler/D1 rehearsal and full migration focal PASS; continuing readiness and inherited regressions.

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
- CF-I09 initial artifact A `a972bca40ed60505bc42f5ae560977886c2972ab`, boundary B `54d8ad2e77b78f4101a14501b7e81ef014c9be2a` — Independent Critic **REWORK-1**.

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

## CF-I09 INITIAL FOUNDATION — ACCEPTED AND MUST BE PRESERVED

Artifact A `a972bca40ed60505bc42f5ae560977886c2972ab` established a strong baseline that REWORK-1 must preserve:

- local-only source→CONTROL_DB/per-hotel-D1 rehearsal;
- explicit mapping/type/enum structure and two server-owned hotel bindings;
- integer-cent/DATE/UTC/JSON handling;
- `NO_SHOW` migration/report/Housekeeping safety;
- replay refusal before business mutation and explicit partial-run failure;
- exact reconciliation beyond row counts, including IDs, references, money, events, tenant ownership and reporting outputs;
- local Access bypass restricted to development + explicit opt-in + loopback;
- `/ready` requires all three local stores plus applied migration manifests;
- local reset/start/stop plus backup/restore with post-restore reconciliation;
- real local Worker+D1/Playwright smoke across operational, financial, tenant/network and reporting surfaces;
- no remote, paid, real-data or cutover scope.

## CF-I09 REWORK-1 BLOCKING FINDINGS

Full verdict: `.orchestration/reviews/CF-I09-CRITIC.md`.

1. **Source `saas_admin` parity (P1):** source canon and source demo data contain `saas_admin`, whose capabilities are network-only. Artifact A omits that enum and instead promotes a source hotel `admin` through a target adaptation. REWORK must migrate a real source `saas_admin` to network membership without granting tenant operational capability and must prove source admin does not silently gain network privilege.
2. **Legacy payment receiver NULL (P1):** source migration 0024 legitimately backfills paid invoices into `payment_entries` without `received_by_user_id`. Artifact A rejects this valid source history although target payment actor is NOT NULL. REWORK must preserve unknown historical receiver truthfully, with explicit non-real actor/provenance and exact cents/events.
3. **Legacy maintenance reporter NULL (P1):** source migration 0028 backfills maintenance cases with `reported_by_user_id = NULL`. Artifact A accepts the case but reconstructs a target Housekeeping event whose actor is NOT NULL. REWORK must preserve unknown reporter truth and avoid false attribution.
4. **Historical nullable actor sweep:** perform one consolidated source migrations `0001`–`0030` audit for legacy/nullable actor fields feeding stricter target actor/event fields. Unknown historical actor remains unknown; do not reject valid history or attribute it to the migration operator.
5. **Multi-context/model receipt (P2):** published `CF-I09-INTERNAL-REVIEW.md` lacks the required truthful `role/context → lane → actual model family → reasoning → escalation → outcome` table even though the Luna-first policy was already binding at artifact parent. Recover truthful runtime evidence or rerun bounded review phases under the current policy; never fabricate model history.
6. **Exact publication SHA (P2):** the A→B topology is correct and B is orchestration-only, but canonical metadata records abbreviated `a972bca`; `INV-STATE-001` requires exact full artifact SHA. Fresh A2/B2 must use the full 40-character A2 SHA everywhere canonical.

Diagnosis: `SOURCE_ROLE_PARITY_GAP + LEGACY_NULL_ACTOR_MIGRATION_GAP + HISTORICAL_PROVENANCE_GAP + MULTICONTEXT_MODEL_RECEIPT_MISSING + ABBREVIATED_ARTIFACT_BOUNDARY`.

## METHOD / TOKEN POLICY — BINDING

Every new/reopened CF-I09 lane follows:

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

## REWORK-1 EXIT

Codex must autonomously:

1. preserve accepted CF-I09 foundation;
2. add source-valid `saas_admin`, legacy NULL payment receiver and legacy NULL maintenance reporter fixtures/mappings/tests;
3. complete historical nullable actor/provenance sweep across source baseline;
4. reconcile exact RBAC memberships, actor provenance, financial cents/events and migrated state;
5. rerun migration/reconciliation, replay/partial failure, backup/restore and complete local smoke;
6. rerun fresh inherited CF-I03–CF-I08 plus type/unit/build/Wrangler/route/diff checks;
7. produce truthful model-family/reasoning Internal QA/Critic and Integration Review receipts with zero open P0/P1/P2;
8. correct invariants/Pre-Critic evidence;
9. publish fresh substantive artifact A2 followed by orchestration-only B2 containing exact full A2 SHA;
10. stop for External Independent Critic.

## DELIVERY SEQUENCE

`CF-I09 REWORK-1 → External Independent Critic → complete local HMS Human Product Acceptance → Cloudflare test environment → Cloudflare validation → production-readiness/release gates`.

No production, remote D1, real-data migration, paid resource, Access production policy, DNS or cutover action is authorized.

## PENDING HUMAN GATES

No blocker. Shared-persistence/process contention was isolated; clean temporary persistence resolves it. Full migration and inherited API checks pass. Next: rerun browser smoke with explicit `saas_admin` network profile, then complete Pre-Critic Gate.

Paid Cloudflare resources, irreversible provisioning/cutover, significant unresolved product/security risk tradeoff, real-data production migration and final Human Product Acceptance remain Human Gates when reached.

## NEXT AUTHORIZED ACTION

`CF_I09_AUTONOMOUS_REWORK_1_SOURCE_SAAS_ADMIN_LEGACY_NULL_ACTORS_MODEL_RECEIPT_EXACT_BOUNDARY`

Codex consumes `.orchestration/reviews/CF-I09-CRITIC.md`, performs internal multi-context repair/review until admission gates pass, publishes one mature fresh A2+B2, and stops for External Independent Critic. Human relay is not required.
