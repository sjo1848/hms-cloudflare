# REWORK V6 CLOSURE — CF-OPS-FLOW-DEFINITION-001

Status: `CLOSED FOR PRE-CRITIC V7`

Source critic: `CF-OPS-FLOW-DEFINITION-001-CRITIC-V6.md`.

## F1 — payment-ledger correlation — CLOSED

D11 now binds invoice paid truth to immutable payment evidence:
- after every successful payment/reconciliation, `invoice.paid_amount_cents = SUM(payment_entries.amount_cents)` for that invoice;
- repricing inserts/deletes/modifies no payment entry;
- repricing preserves existing payment method/reference and does not claim cash/payment receipt;
- price reconciliation audit is distinct from payment receipt;
- ledger mismatch fails closed before any priced domain mutation;
- VOIDED remains fail-closed;
- E2E acceptance proves upward/downward repricing, credit, timestamp transitions and exact ledger correlation.

Propagated to departure register D11, E2E matrix, API contract, master, technical prerequisites, binding decision, operational invariants and invariant evidence.

## Scope isolation

Definition work remains documentation/orchestration only. Runtime, schema implementation, CI budgets, staging, production and main are untouched.

## Result

Critic V6 finding is materially closed. Next action: Pre-Critic V7. Implementation remains locked.