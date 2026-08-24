# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 REWORK-3 ARTIFACT PUBLISHED — INDEPENDENT CRITIC PENDING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I07.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I07-REWORK-2-CRITIC.md`.
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
- CF-I07 initial artifact `5ed90137b2b58d69f16cca088b014153bf52eb4a` — Independent Critic REWORK-1.
- CF-I07 REWORK-1 artifact `0a1698995e4f4d36e86a0b88c19f06932469fde7`, boundary `de2279e984da1ad0fc3cc78de877d7900b31e64a` — Independent Critic REWORK-2.
- CF-I07 REWORK-2 artifact `87cf6c953e24b9374644f53c636c4d5a8574bea7`, boundary `cc13528a8809861aa17011251de6f60466019995` — Independent Critic REWORK-3.
- CF-I07 REWORK-3 artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f` — browser authorization/evidence, process cleanup and exact audit-count closure; awaiting Independent Critic.

## CF-I07 ACCEPTED BACKEND/SECURITY FOUNDATION — PRESERVE

The following are accepted and must not regress during REWORK-3:

- Cloudflare Access remains the authentication perimeter; no HMS password recreation.
- Active hotel → operational D1 ownership is unique and already-consumed/undeclared bindings are rejected.
- Target capability map matches the source-sensitive RBAC canon for the migrated surfaces.
- `saas_admin` has only the canonical network hotel capabilities and cannot read `/audit/events` without a qualifying hotel capability/membership.
- receptionist cannot list all invoices; ops retains tenant audit read.
- lifecycle consumes the central capability authority and `pending-approved` checkout requires admin-only `bookings.checkout.override`.
- shared Access identity rows cannot be tenant-locally rewritten/reactivated.
- user role/deactivate and hotel plan mutations use conditional authoritative writes; same-role/same-plan requests reject before semantic audit.
- real allowed-before/denied-after admin→ops downgrade evidence exists.
- tenant-A role/deactivate attempts against a tenant-B-only membership fail and preserve tenant-B state with zero tenant-A target audit.
- tenant hotel-admin audit combines control + operational provenance without global-control leakage.
- plan tier domain is `BASIC | PRO | ENTERPRISE`.
- fresh CF-I03/04/05/06 terminal PASS is recorded in the REWORK-2 artifact evidence.
- no CF-I08, production, remote-D1, paid-resource or cutover scope entered the artifact.

## CF-I07 REWORK-3 — REMAINING BLOCKERS — REPAIRED IN ARTIFACT A

Full verdict: `.orchestration/reviews/CF-I07-REWORK-2-CRITIC.md`; all listed findings are addressed and evidenced in the artifact.

1. Browser forbidden-RBAC proof is invalid: the browser fixture does not seed `subject-hk` as an active hotel-A housekeeping membership, so `No authorized hotel membership` proves an earlier membership guard, not capability denial.
2. Browser/Pre-Critic evidence overclaims create success/error, role commit, deactivation confirmation/focus return and forbidden behavior relative to the actual assertions and responsive widths.
3. `INV-CF-I07-004` remains UNPROVEN because process cleanup issues kill/pkill but does not positively verify the owned Worker/process tree is gone before terminal PASS.
4. Same-plan 409 behavior is correct, but the promoted no-op invariant requires an exact durable `HOTEL_PLAN_CHANGE` count after the repeated request.

Diagnosis: `AUTHZ_FIXTURE_FALSE_PROOF + RESPONSIVE_UX_EVIDENCE_OVERCLAIM + PROCESS_CLEANUP_UNPROVEN + EXACT_AUDIT_COUNT_GAP`.
Human Gate: `NONE`.
Blocker: `NONE`.

## REWORK-3 AUTHORIZED WORK

Codex must autonomously:

1. preserve every accepted backend/security repair above;
2. seed a real Access identity + active hotel-A `housekeeping` membership in browser evidence and prove `/users` is denied by capability rather than missing membership/routing;
3. make browser assertions explicitly prove the user-visible create success/error or validation state, role mutation + committed value, deactivation confirmation + deterministic focus return, and forbidden UX with coverage matching the contract/evidence wording;
4. narrow evidence wording where a behavior is intentionally representative rather than per-width;
5. add bounded process termination verification (`wait`/poll/`kill -0` equivalent) and fail before PASS if an owned Worker/Vite/Playwright process remains;
6. assert exact durable `HOTEL_PLAN_CHANGE` count after success + same-plan retry;
7. rerun focal + fresh CF-I03/04/05/06 + browser + type/build/Wrangler checks from a clean sequence;
8. publish fresh substantive artifact A plus orchestration-only boundary B and stop for Independent Critic.

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

## NEXT AUTHORIZED ACTION

Independent Critic audits exact immutable artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f` against the active contract, REWORK-2 review, invariants, Pre-Critic evidence and fresh regression/browser evidence. Codex must not begin CF-I08 before CF-I07 PASS.

Completed REWORK-3 scope: valid housekeeping browser auth fixture and capability denial, explicit responsive UX assertions, recursive owned-process termination verification, exact same-plan durable audit count, fresh focal/browser/inherited regressions and complete build/type/Wrangler gate.

Do not begin CF-I08 before CF-I07 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
