# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 REWORK-1 ARTIFACT PUBLISHED — INDEPENDENT CRITIC PENDING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I07.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I07-CRITIC.md`.
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
- CF-I07 REWORK-1 artifact A `0a1698995e4f4d36e86a0b88c19f06932469fde7` — Independent Critic pending.

## CF-I07 ACCEPTED FOUNDATION TO PRESERVE

- Cloudflare Access remains the authentication perimeter; no HMS password recreation.
- CONTROL_DB hotel memberships and separate network membership exist.
- A central target capability module exists and inventory/bookings/housekeeping/billing were moved toward it.
- undeclared Worker/D1 binding names are rejected;
- explicit user membership create/role/deactivate operations exist;
- network analytics remains truthfully deferred to CF-I08;
- no CF-I08, production, remote-D1, paid-resource or cutover scope entered the artifact.

## CF-I07 REWORK-1 REPAIRS COMPLETED

1. Active hotel→operational binding ownership is now unique and binding reuse is rejected before metadata/audit side effects.
2. The source-sensitive RBAC matrix is centralized across all migrated routes; receptionist invoice listing is denied, ops audit read is retained and admin-only checkout override is enforced.
3. User role/deactivate and hotel plan mutations conditionally audit only when their authoritative write changes exactly one row.
4. Shared Access identities are compatibility-checked and cannot be rewritten/reactivated by a tenant-local admin.
5. Audit reads combine control and operational provenance within tenant scope; global network events are excluded from hotel-admin reads.
6. Plan tiers are constrained to `BASIC | PRO | ENTERPRISE` across migration, API and UI.
7. Users mobile detail/focus-return/confirmation and Network material controls execute at all contracted widths.
8. Fresh CF-I03/04/05/06 runners emit PASS; invariant and Pre-Critic evidence was rewritten to executable claims.

Full verdict and exit criteria: `.orchestration/reviews/CF-I07-CRITIC.md`.

Diagnosis repaired: `CONTROL_PLANE_BINDING_ALIAS + RBAC_CANON_DRIFT + ADMIN_MUTATION_STALE_AUDIT + AUDIT_SCOPE_GAP + PLAN_ENUM_PARITY + UX_RESPONSIVE_GAP + INHERITED_REGRESSION_UNPROVEN`.
Human Gate: `NONE`.
Blocker: `NONE`.

## CARRY-FORWARD DEBT

Source `NoShow` booking/departure exclusion is not yet representable in the target booking enum. Resolve explicitly before final migration readiness, at latest CF-I09; imported NoShow rows must not become Housekeeping tasks.

## DELIVERY SEQUENCE

`CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

Paid Cloudflare resources, irreversible provisioning/cutover, product-intent changes or final Product Acceptance remain Human Gates if/when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## BLOCKERS

None. CF-I07 REWORK-1 is routine and authorized.

## NEXT AUTHORIZED ACTION

Independent Critic audits fresh CF-I07 REWORK-1 artifact A `0a1698995e4f4d36e86a0b88c19f06932469fde7` against the contract and evidence. Codex must not begin CF-I08 before CF-I07 PASS.

The completed bounded wave included:

1. enforce exclusive active hotel→configured D1 binding ownership and prove binding-reuse rejection;
2. restore the exact source-canonical capability matrix, centralize all migrated backend routes, and enforce admin-only checkout override;
3. make user role/deactivate and hotel admin mutations exact-winner + exactly-once truthful-audit operations under concurrency;
4. protect shared Access identity mapping from tenant-local cross-tenant rewrite/reactivation;
5. implement a provenance-preserving tenant audit read model with no global/cross-tenant leakage;
6. restore `BASIC/PRO/ENTERPRISE` plan-tier semantics across DB/API/UI;
7. restore material Users mobile/detail/delete/focus and Network responsive workflows, including accepted tenant roles;
8. obtain fresh CF-I03/04/05/06 regression PASS and execute focal/browser/build/type/Wrangler/route checks;
9. correct invariant and Pre-Critic evidence so no required FAIL/UNPROVEN/overclaim remains;
10. publish a fresh substantive artifact A plus one orchestration-only boundary B pointing exactly to A and stop for Independent Critic.

Do not begin CF-I08 before CF-I07 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
