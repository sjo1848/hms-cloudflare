# 09 — Technical prerequisites for the next workflow wave

Status: `BINDING DELIVERY GATE`

## Frontend JavaScript headroom
Accepted staging is approximately `319858 / 320000` raw JS. Before material workflow UI, reduce total generated raw JS to `<=300000` without raising the budget or removing accepted behavior.

## Operational timezone / instant foundation
Before date-sensitive flows, persist server-owned IANA timezone, configure current Mendoza data explicitly, expose trusted context, derive hotel-local date server-side, and enforce explicit-offset RFC3339 where an absolute instant is required. Browser/server timezone cannot alter eligibility.

## Pricing / Billing foundation — D8/D9/D11
Backend paths must distinguish priced from non-priced mutations. State/evidence-only commands never invoke generic repricing. Every real total change reconciles invoice atomically under one D11 implementation.

Wave 0.3 requires a forward Billing migration and shared reconciliation helper before later priced flows:
- historical migration `0010_billing.sql` remains immutable;
- relax the legacy constraint forbidding prior paid amount above a later invoice amount;
- preserve `PENDING|PAID|VOIDED` status vocabulary;
- maintain `invoice.paid_amount_cents = SUM(payment_entries.amount_cents)` after every successful payment/reconciliation;
- derive remaining/credit from authoritative amount and ledger-correlated paid amount;
- repricing cannot insert/delete/rewrite payment entries or fabricate payment method/reference;
- reconciliation audit is distinct from payment receipt;
- centralize status/paid_at/credit/remaining behavior so room/date edit, reassignment, extension and extra charge cannot diverge;
- detect VOIDED or ledger mismatch before any partial priced domain mutation;
- payment routes reject new collection when remaining is zero.

Migration/rehearsal tests must include upward repricing, downward repricing with overpayment credit, PAID->PENDING, PENDING->PAID, ledger mismatch failure and VOIDED failure with zero partial state.

## Other migration coordination
Incremental changes also include hotel timezone configuration; no-show/extension/arrival events; maintenance impact/occupied semantics/capabilities; and reassignment remaining-night/history guards.

## Delivery rule
Historical migrations are never rewritten. Forward migrations/backfills are rehearsal-tested. No UI/domain increment can claim E2E correctness before the prerequisite invariants it depends on are available.