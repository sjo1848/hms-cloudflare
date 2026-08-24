# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 REWORK-3 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I06.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I06-REWORK-2-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.

Carry-forward debt: source `NoShow` departure exclusion must be resolved before final migration readiness, at latest CF-I09.

## CF-I06 — BILLING

Artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d` is complete and awaits a new Independent Critic boundary B. It is not self-approved.

### Accepted repairs from REWORK-2 that must be preserved

- exactly one canonical handler per billing method/path; temporary `-v2` routes removed;
- one inclusive `received_at >= opening` rule shared by balance and close-cash;
- `TRANSFER` included in source-equivalent non-cash subtotal;
- first shift opening derives from earliest payment when no prior closure exists;
- closure audit is emitted by D1 trigger in the same closure insert transaction;
- browser executes charge + payment at 375/390/430/768/1024 and includes overpay, stale-close and successful-close journeys;
- positive settle-payment response path exists;
- forbidden/unknown roles are denied billing balance read;
- fresh CF-I03/04/05 inherited runner PASS is recorded;
- A→B publication boundary is correct;
- no CF-I07, production, remote D1, real-data or paid-resource drift.

### REWORK-3 resolution evidence

- close-cash ownership now uses a server-only operation token; same client `x-request-id` race produces one success, one conflict, one closure and one event;
- hotel-a and hotel-b use separate configured operational D1 bindings; cross-tenant invoice/payment/extra-charge reads and writes return 404 with zero side effects in both stores;
- forbidden and unknown roles are denied financial writes with 403 and unchanged financial state;
- positive settle-payment asserts exact durable payment/event metadata and retry zero-side-effect behavior;
- a local-only injected NOT NULL failure inside the charge batch proves authoritative rollback of charge, booking total and audit event;
- invariant and Pre-Critic evidence are corrected to match these executable proofs;
- focal, browser, inherited, build, type and dry-run checks pass.

Full verdict and exit criteria: `.orchestration/reviews/CF-I06-REWORK-2-CRITIC.md`.

Diagnosis: `REWORK-3_IMPLEMENTED_AWAITING_INDEPENDENT_CRITIC`.
Human Gate: `NONE`.
Blocker: `NONE`.

## BINDING LEARNED RULES

- client-supplied correlation/tracing ids must not be used as ownership or compare-and-set tokens for exact-winner proof;
- exact winner must come from the authoritative write result (`changes=1`) or a server-only operation token;
- when a contract requires real cross-tenant object isolation, unknown/unconfigured binding denial is not equivalent evidence;
- write-capable surfaces require denied-write RBAC evidence when the contract includes writes;
- pre-validation rejection does not by itself prove multi-write rollback/atomicity.

## DELIVERY SEQUENCE

`CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

Local `git pull --ff-only` only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## BLOCKERS

None. CF-I06 REWORK-3 implementation is complete; Independent Critic is the next boundary.

## NEXT AUTHORIZED ACTION

Codex consumed `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I06-REWORK-2-CRITIC.md`, the active contract, source financial services/repositories/UI, learned invariants and Pre-Critic Gate and completed:

1. make close-cash success depend on the authoritative write result or server-only operation token, never reusable client `x-request-id`;
2. add deterministic same-`x-request-id` concurrent close race requiring one success, one conflict, one closure and one event;
3. add second-tenant object isolation read/write fixture with zero side effects;
4. add forbidden and unknown role financial write-denial assertions with unchanged business/audit state;
5. assert positive settle-payment exact durable payment/event metadata plus retry zero-side-effect behavior;
6. add an authoritative extra-charge write-boundary failure proving full rollback;
7. correct invariant/evidence claims and run the complete required gate/regression suite;
8. publish fresh artifact A plus orchestration-only boundary B and stop for Independent Critic.

Artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d` is now awaiting Independent Critic. Do not begin CF-I07 before CF-I06 receives external PASS.

Do not begin CF-I07 before CF-I06 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.
