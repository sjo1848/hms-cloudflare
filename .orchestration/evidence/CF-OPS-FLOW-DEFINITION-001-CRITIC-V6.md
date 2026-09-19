# DEFINITION CRITIC V6 — CF-OPS-FLOW-DEFINITION-001

Artifact reviewed: `35ac11f3eb88b33f9ecb4b071a08965a84558cfb`
Boundary reviewed: `2fba6f6b9d72276f45dfd8dcc0471335a66a7781`
Verdict: `REWORK`

Boundary structure: PASS — one metadata-only commit over A6, changing STATE/STATUS only and retaining the implementation lock.

## F1 — D11 omits the payment-ledger correlation invariant — BLOCKING ACCOUNTING CONTRACT

D11 derives remaining/credit from `paid_amount_cents` and preserves payment entries, but it does not explicitly require the denormalized invoice paid amount to equal the immutable payment ledger. Existing target reconciliation already treats invoice/payment mismatch as invalid evidence.

Required repair:
- bind `paid_amount_cents = SUM(payment_entries.amount_cents)` for the invoice after every successful payment/reconciliation path;
- repricing never creates/deletes/rewrites a payment entry;
- price reconciliation does not fabricate a payment method/reference or claim new cash movement;
- D11 audit distinguishes `price reconciliation` from `payment received`;
- migration/schema/helper and E2E tests prove the correlation before/after upward/downward repricing and credit creation.

## Other V6 review areas
No additional blocking definition defect found in D1-D10, maintenance/RBAC, lifecycle transitions, remaining-night history, ETA semantics, D9 no-repricing, D11 credit arithmetic/VOIDED boundary, API ownership, responsive E2E perimeter or scope isolation.

Result: REWORK F1, republish after repair. Product implementation remains locked.