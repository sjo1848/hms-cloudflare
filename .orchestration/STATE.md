# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 INDEPENDENT CRITIC PENDING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I06.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I06-REWORK-1-CRITIC.md`.
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

REWORK-2 implementation is complete and published as artifact A `8d4584fe8e9f1afecef104d32d900513d57d32c8`. It is not self-approved; the next boundary is the Independent Critic.

Artifact A `291ee7ae60ddd3c0abec8ff6b921666f3e86e76f` + boundary B `8989df5239b97eff436d6a6b63d9dd2973ce250b` received Independent Critic `REWORK-2`.

### Accepted repairs that must be preserved

- payment history newest-first;
- `TRANSFER` normalized as non-cash in the intended snapshot semantics;
- first-shift opening derives from earliest payment when no prior closure exists;
- first-invoice creation is guarded by the requested payment amount;
- balance/close-cash UX now exists;
- browser includes 390 and typed overpay/stale-close errors;
- A→B publication boundary remains correct;
- no CF-I07, production, remote D1, real-data or paid-resource drift.

### REWORK-2 resolution evidence

- billing route static test proves one registration per canonical method/path and no v2 endpoint;
- one inclusive `received_at >= opening` rule is shared by balance and close-cash;
- close winner is correlated by request id, and a D1 trigger writes exactly one `CASH_CLOSURE` event in the same transaction;
- focal regression proves rejected extra-charge atomicity, positive settle-payment, cross-tenant binding denial, forbidden/unknown role denial, opening/order semantics and closure event count;
- browser regression executes charge plus payment at 375/390/430/768/1024, plus overpay, stale-close and successful close;
- fresh CF-I03 + CF-I04 and CF-I05 runners pass; CF-I05 serializes only local D1 inspection around local Worker restarts;
- pre-critic gate and invariant evidence are updated with no required UNPROVEN item.

### Historical REWORK-1 findings resolved in this artifact

1. `apps/api/src/routes/billing.ts` contains duplicate registrations for canonical `POST /billing/close-cash` and `GET /billing/balance`, plus uncontracted `/billing/balance-v2` and `/billing/close-cash-v2`. Effective financial semantics are therefore shadowed/ambiguous rather than single-source.
2. One duplicate close-cash implementation conditionally inserts a closure, then discovers any row by `opening_time`, then audits separately. A losing request can observe the winner's row and cannot prove its own transition won; this violates exact-winner and exactly-once audit semantics.
3. Duplicate implementations contain both `received_at >= opening` and `received_at > opening`, which disagree on whether the first payment at the opening timestamp belongs to the shift.
4. Browser enumerates 375/390/430/768/1024 but only checks shell overflow per width; material financial actions run once after the loop. `INV-RESP-001` is not satisfied.
5. Positive `/settle-payment` behavior remains unproven; only the already-settled conflict path is tested.
6. Cross-tenant object access and forbidden/unknown-role financial denial remain unproven; unknown-hotel denial is not sufficient.
7. Extra-charge rejected/partial-failure atomicity remains unproven.
8. Required fresh CF-I03/04/05 inherited regressions remain explicitly `UNPROVEN` due the local runner lock path.
9. Pre-Critic evidence overclaims completeness despite required UNPROVEN items and insufficient per-width material browser execution.

Full verdict and exit criteria: `.orchestration/reviews/CF-I06-REWORK-1-CRITIC.md`.

Diagnosis: `REWORK-2_IMPLEMENTED_AWAITING_INDEPENDENT_CRITIC`.
Human Gate: `NONE`.
Blocker: `NONE`.

## BINDING EXECUTION RULES FOR REWORK-2

- exactly one handler per canonical billing method/path;
- no temporary/v2 product endpoints unless explicitly authorized;
- one canonical inclusive shift boundary used by both balance and close-cash;
- close-cash must prove the current request won the conditional mutation and produce exactly one event in the same logical operation;
- route uniqueness/static duplicate detection must be part of Pre-Critic evidence;
- each contracted responsive width must execute a material financial control/journey, not only render/overflow checks;
- required regression runner failure remains `UNPROVEN`, never PASS.

## DELIVERY SEQUENCE

`CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

Local `git pull --ff-only` only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## BLOCKERS

None. CF-I06 REWORK-2 is routine and authorized.

## NEXT AUTHORIZED ACTION

Codex has read `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I06-REWORK-1-CRITIC.md`, the active contract, source financial services/repositories/UI, learned invariants and Pre-Critic Gate; then autonomously completed:

1. remove duplicate/shadowed canonical billing routes and uncontracted v2 endpoints;
2. leave one authoritative balance + close-cash implementation with inclusive opening semantics;
3. make closure winner proof and audit exactly-once atomic/correlated;
4. add positive settle-payment, cross-tenant binding, forbidden/unknown-role, extra-charge failure, closure-event and opening-boundary fixtures;
5. execute material browser financial interaction at 375/390/430/768/1024, including a successful close and stale/error path;
6. obtain fresh required CF-I03/04/05 regression PASS evidence by isolating the runner lifecycle;
7. make invariant/Pre-Critic evidence match executable proof exactly;
8. publish fresh artifact A plus orchestration-only boundary B and stop for Independent Critic.

The implementation, validations and evidence above are complete. Artifact A `8d4584fe8e9f1afecef104d32d900513d57d32c8` is now awaiting Independent Critic. Do not start CF-I07 until CF-I06 receives external PASS.

Do not begin CF-I07 before CF-I06 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.
