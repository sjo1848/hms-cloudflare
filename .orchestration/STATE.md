# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 REWORK-2 ARTIFACT PUBLISHED — INDEPENDENT CRITIC PENDING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I07.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I07-REWORK-1-CRITIC.md`.
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
- CF-I07 artifact A `5ed90137b2b58d69f16cca088b014153bf52eb4a` — Independent Critic REWORK-1.
- CF-I07 REWORK-1 artifact A `0a1698995e4f4d36e86a0b88c19f06932469fde7`, boundary B `de2279e984da1ad0fc3cc78de877d7900b31e64a` — Independent Critic REWORK-2.
- CF-I07 REWORK-2 artifact A `87cf6c953e24b9374644f53c636c4d5a8574bea7` — fresh RBAC/audit/no-op/downgrade/tenant-isolation/browser/runner repairs; awaiting Independent Critic.

## CF-I07 ACCEPTED FOUNDATION TO PRESERVE

The following repairs from REWORK-1 are accepted and must not regress:

- Cloudflare Access remains the authentication perimeter; no HMS password recreation.
- Active hotel -> operational D1 ownership is unique through a partial unique index.
- Undeclared and already-consumed operational bindings are rejected.
- Receptionist cannot list all invoices; ops retains tenant audit read.
- Lifecycle consumes the central capability helper and `pending-approved` checkout requires admin-only `bookings.checkout.override`.
- Shared Access identity rows are compatibility-checked and cannot be tenant-locally rewritten/reactivated.
- Tenant hotel-admin audit reads combine control + lifecycle + housekeeping + financial provenance and exclude global control events.
- Plan tier domain is `BASIC | PRO | ENTERPRISE` across migration/API/UI.
- Users detail/open-close and Network plan controls are exercised at 375/390/430/768/1024.
- Artifact publication A -> B is non-circular and B is orchestration-only.
- No CF-I08, production, remote D1, paid-resource or cutover scope entered the artifact.

## CF-I07 REWORK-2 BLOCKING FINDINGS — REPAIRED IN ARTIFACT A

1. `saas_admin` still bypasses the canonical capability matrix for `/audit/events`: middleware permits the route and the handler grants access by direct `networkRole === "saas_admin"`, even though the source canon gives `saas_admin` only `saas.hotels.read/write`.
2. Same-role and same-plan requests can still match authoritative rows and emit false `USER_ROLE_CHANGE` / `HOTEL_PLAN_CHANGE` events with no semantic change.
3. The claimed role-downgrade proof is a false positive: receptionist -> ops was tested, but neither role had `users.write` before the change. It does not prove stale elevated permissions disappear.
4. The contract-required tenant-A admin attempt to mutate a tenant-B membership by subject/object id is not directly proven with zero side effects.
5. Browser evidence still lacks create validation/error, deactivate confirmation + actual focus-return assertion, committed role-state synchronization and forbidden route/action journey. Creation success occurs only at 375.
6. `scripts/cf-i07-regression.sh` clears `worker_pid` before EXIT without terminating the Worker, so a successful run can leak Wrangler and compromise clean sequential inherited regression evidence.
7. Evidence overclaims `INV-RBAC-001`, `INV-RESP-001` and `INV-EVID-001`; the parity document is internally contradictory about `saas_admin` audit permission.

Full verdict and exit criteria: `.orchestration/reviews/CF-I07-REWORK-1-CRITIC.md`; all listed findings are addressed by artifact A and evidenced in `.orchestration/evidence/CF-I07-INVARIANTS.md` and `.orchestration/evidence/CF-I07-PRECRITIC-GATE.md`.

Diagnosis: `NETWORK_AUDIT_RBAC_BYPASS + NOOP_AUDIT_FALSE_EVENT + DOWNGRADE_EVIDENCE_FALSE_POSITIVE + ADMIN_BROWSER_EVIDENCE_GAP + RUNNER_LIFECYCLE_DEFECT`.
Human Gate: `NONE`.
Blocker: `NONE`.

## REUSABLE ROOT CAUSES TO PROMOTE DURING REWORK-2

- a capability map is not authoritative if middleware/routes can bypass it with direct role-name shortcuts;
- audit represents semantic mutations, not merely SQL rows matched; same-value no-op changes produce zero change events;
- role downgrade evidence must prove `allowed before -> denied after` for the same subject and privileged operation;
- a runner may claim terminal PASS only after it has cleaned up owned Worker/Vite/process-tree resources.

Codex must promote these into `.orchestration/INVARIANTS.md` and/or the mandatory Pre-Critic Gate before republishing CF-I07.

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

None. CF-I07 REWORK-2 is routine and authorized.

## NEXT AUTHORIZED ACTION

Independent Critic audits exact immutable artifact A `87cf6c953e24b9374644f53c636c4d5a8574bea7` against the active contract, review findings, canonical invariants, Pre-Critic evidence, regression and browser evidence. Codex must not begin CF-I08 before CF-I07 PASS.

The completed bounded wave included:

1. remove the `saas_admin` audit shortcut and make protected admin/audit authorization flow only through the canonical capability authority;
2. make same-role/same-plan requests explicit zero-audit no-ops/rejections while preserving stale/concurrent exact-winner guards;
3. add a real elevated-role downgrade test proving allowed-before then denied-after for the same Access subject;
4. add tenant-A -> tenant-B membership role/deactivate attempts with unchanged tenant-B state and zero audit side effects;
5. complete User admin browser evidence for create success/error, deactivation confirmation, deterministic focus return, committed role display and forbidden UX/backend behavior across representative contracted widths;
6. fix CF-I07 runner lifecycle and obtain a clean sequential focal + fresh inherited CF-I03/04/05/06 terminal PASS with no leaked owned processes;
7. correct parity/invariant/Pre-Critic evidence and promote the reusable root causes above into the harness;
8. publish fresh artifact A `87cf6c953e24b9374644f53c636c4d5a8574bea7` plus orchestration-only boundary B and stop for Independent Critic.

Do not begin CF-I08 before CF-I07 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
