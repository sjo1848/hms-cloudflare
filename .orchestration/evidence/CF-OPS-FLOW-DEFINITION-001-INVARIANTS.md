# Invariant evidence

Definition scope only.

PASS: domain commands, source parity/departures, role boundaries, ordering, money exactness requirements, D9 pricing boundary, D10 time semantics, D11 invoice/ledger correlation, immutable payment evidence, fail-closed VOIDED/ledger mismatch behavior, and A/B publication rules are represented by the canonical definition pack.

PASS: D11 explicitly requires `invoice.paid_amount_cents == SUM(payment_entries.amount_cents)` after successful payment/reconciliation and forbids repricing from fabricating payment evidence.

N/A: executable product/browser proof at this phase; those checks remain mandatory in implementation Task Contracts and Pre-Critic evidence.

PASS: branch scope remains documentation and orchestration only.