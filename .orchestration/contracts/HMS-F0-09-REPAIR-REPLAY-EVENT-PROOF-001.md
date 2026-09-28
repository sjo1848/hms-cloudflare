# Task Contract — F0.9 bounded repair: replay event proof

Task ID: `HMS-F0-09-REPAIR-REPLAY-EVENT-PROOF-001`
Parent: `.orchestration/contracts/HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001.md`
Status: `FROZEN BEFORE REPAIR IMPLEMENTATION`
Scope: verify the durable `EXTRA_CHARGE` + `PRICE_RECONCILIATION` pair on replay and recovery lookup; prove rollback when the second event insert fails. Synthetic/local only.

## Findings addressed

- Internal read-only QA found matching-token replay and GET recovery could report success based only on the durable charge row, without revalidating its correlated event pair.
- Internal read-only QA found failure injection covered the first event insert but not failure of the later `PRICE_RECONCILIATION` insert.

These are technical correctness/evidence defects within F0.9; no policy, route, capability, event vocabulary, retention or financial-truth change is authorized.

## Acceptance

1. A replay/recovery result is returned only when exactly one expected `EXTRA_CHARGE` and one expected `PRICE_RECONCILIATION` event are present for the booking/token/charge, share actor/request/hotel provenance, and the reconciliation event points to the first event.
2. A lookup remains available after a later authoritative invoice reconciliation; the result includes the current invoice view and does not re-run D11 or mutate anything.
3. A missing or malformed event pair fails closed; it never creates replacement events or a second charge.
4. A D1 trigger rejecting the second audit-event insertion rolls back the charge, booking, invoice and first event; payment entries remain unchanged.
5. Existing API behavior, `meta.changes` non-causality, D11 semantics, tenant/RBAC and successful response-loss/retry behavior remain intact.

## Surfaces

- `apps/api/src/modules/billing/d1-payment-repository.ts`
- `apps/api/src/routes/billing.ts`
- `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`
- `scripts/cf-f0-09-extra-charge-idempotency.playwright.js` only if needed to assert the HTTP recovery path.

## Forbidden

No new migration/table/event, new capability, event repair/backfill, payment mutation, alternate D11 reconciler, route duplication, real data, Blocks A–H, PR/push/merge/staging/deploy/production.

## Invariant mapping

| Invariant | Classification | Repair acceptance/evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Exact durable charge + pair; second-event rollback; no false replay. |
| INV-AUDIT-001 | APPLIES | Pair exists iff mutation committed; damaged pair fails closed and is never fabricated. |
| INV-DOMAIN-001 | APPLIES | Same existing billing operation/repository; no generic mutation. |
| INV-TENANT-001 | APPLIES | Existing hotel D1 routing; event hotel must match selected tenant. |
| INV-RBAC-001 | APPLIES | Existing read/write capabilities remain authoritative. |
| INV-PARITY-001 | APPLIES | No change to current charge or D11 semantics. |
| INV-ENUM-001 | N/A | No enum/value mapping change. |
| INV-UX-001 | APPLIES | Recovery reports success only with durable correlated outcome. |
| INV-ORDER-001 | N/A | No operational queue ordering. |
| INV-RESP-001 | APPLIES | Existing integrated 1280/375 recovery remains required. |
| INV-EVID-001 | APPLIES | Exact assertions tied to executing-D1 and integrated Worker/D1 evidence. |
| INV-LEGACY-001 | N/A | No historical row is synthesized or relabeled. |
| INV-MONEY-001 | APPLIES | Second-event failure proves full rollback and unchanged ledger/D11 state. |
| INV-STATE-001 | APPLIES | New immutable A + orchestration-only B + fresh independent review. |
| INV-CF-I07-001 | N/A | No admin/network/audit-read route. |
| INV-CF-I07-002 | N/A | No admin semantic no-op mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Integrated runner cleans its owned process tree before PASS. |
| INV-CF-I08-001 | N/A | No analytics output. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state query. |
| INV-CF-I08-004 | N/A | No booking/room state expansion. |
| INV-CF-I08-005 | N/A | No reporting clock/continuity change. |
| INV-SCOPE-001 | APPLIES | Diff limited to event verification and rollback proof within F0.9. |

## Validation

Run the focused executing-D1 suite; route uniqueness; full `npm run check`; types/build/fitness/budgets/query plans; Wrangler API/Web/staging-SPA dry-runs; serial CF-I03–I06; full-chain local Wrangler migration + integrated Worker/D1/browser at 1280×900 and 375×844; `git diff --check`; scope and evidence audit. No timeout increases or retries to fabricate green.

## Recovery

Any missing/duplicate/mismatched audit pair returns a fail-closed conflict/error and causes no additional write. Event repair/backfill is out of scope. If evidence reveals a required new event policy, stop for Controller rather than invent it.
