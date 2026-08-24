# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I07.md`.
- Last Independent Critic: `.orchestration/reviews/CF-I06-REWORK-3-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`, Independent Critic `.orchestration/reviews/CF-I06-REWORK-3-CRITIC.md`.

### CF-I06 accepted guarantees

- exact integer-cent invoice/payment/extra-charge/cash-closure semantics;
- concurrent payment does not overpay;
- close-cash revalidates the authoritative snapshot with inclusive shift opening semantics;
- close ownership uses a server-only operation token rather than client `x-request-id`;
- closure audit is trigger-generated in the same D1 insert transaction;
- `TRANSFER` is source-equivalent non-cash;
- two real configured operational D1 bindings prove bidirectional tenant isolation;
- forbidden/unknown roles fail closed for financial writes;
- positive settlement and durable settlement event metadata are proven;
- authoritative extra-charge batch rollback is exercised;
- billing/cash UX works at 375/390/430/768/1024;
- inherited CF-I03/04/05 regressions pass;
- no production, remote data, paid resource or cutover entered scope.

## CARRY-FORWARD DEBT

Source `NoShow` booking/departure exclusion is not yet representable in the target booking enum. Resolve explicitly before final migration readiness, at latest CF-I09; imported NoShow rows must not become Housekeeping tasks.

## ACTIVE INCREMENT — CF-I07 USERS / RBAC / AUDIT / HOTEL-NETWORK ADMIN

Contract: `.orchestration/contracts/CF-I07.md`.

CF-I07 is the primary security/cross-tenant administration boundary and is now authorized.

Scope includes:

- Access-backed identity/membership user management;
- centralized backend RBAC/capability semantics across migrated modules;
- user create/invite/register, delete/deactivate and role-management behavior compatible with Cloudflare Access;
- durable admin/audit read model and exactly-once audit for admin mutations;
- hotel/control-plane administration using only server-configured operational D1 bindings;
- explicit network-level authorization for cross-hotel administration;
- source-equivalent Users and Hotel Network administrative UX, including mobile behavior;
- full tenant/RBAC/adversarial/browser evidence and fresh inherited CF-I03–CF-I06 regressions.

Cloudflare Access remains the approved perimeter. CF-I07 must not recreate password authentication inside HMS merely to imitate the source.

## BINDING LEARNED RULES

- client-supplied correlation ids are trace metadata only, never authoritative ownership/version/idempotency tokens;
- exact winner comes from the authoritative write result or a server-only operation token;
- real cross-tenant isolation requires real distinct configured tenant stores where the contract calls for it;
- frontend guards never substitute backend capability enforcement;
- route duplication/shadowing blocks publication;
- required regression failure or runner interruption is `UNPROVEN`, not PASS;
- pre-validation rejection is not sufficient evidence for multi-write rollback.

## DELIVERY SEQUENCE

`CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

Paid Cloudflare resources, irreversible provisioning/cutover, product-intent changes or final Product Acceptance remain Human Gates if/when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

Codex autonomously executes CF-I07 under `.orchestration/contracts/CF-I07.md`:

1. source parity pre-flight for Users, route guards, auth/admin handlers and Hotel Network administration;
2. explicit Cloudflare Access identity/auth adaptation mapping;
3. centralized target capability/RBAC matrix;
4. CONTROL_DB user/membership/admin domain operations with exactly-once audit;
5. network-level hotel/control-plane administration restricted to server-configured bindings;
6. adversarial tenant/RBAC/stale/duplicate/admin tests;
7. source-equivalent responsive Users and Hotel Network admin UX;
8. full inherited CF-I03/04/05/06 regressions, unit/type/build/Wrangler/route-uniqueness checks;
9. invariant + Pre-Critic evidence with no FAIL/UNPROVEN;
10. publish substantive artifact A + orchestration-only boundary B;
11. stop for Independent Critic or a real Human Gate.

Do not begin CF-I08 before CF-I07 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.