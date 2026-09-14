# 02D — Stay extension

Status: `BINDING DEFINITION / SOURCE-PARITY PRICING`.

A checked-in stay may extend only to a later checkout in the same room when every added night passes inventory, hold and blocking-maintenance validation. The command claims the added interval, updates checkout, preserves CHECKED_IN/OCCUPIED, applies accepted current-room pricing across total stay nights plus existing extra charges, reconciles Billing, and writes evidence atomically.

D11 in `20-intentional-target-departures.md` is authoritative for every invoice outcome after repricing. Any older assumption that invoice paid amount can never be greater than a newly recalculated amount is superseded. If D11 marks the current invoice state ineligible for a priced mutation, extension fails before any partial domain change.

Earlier departure is checkout, not extension. No automatic room move or split stay is introduced. Frozen-rate pricing remains future product scope.

UI shows checkout change, added nights, price consequence and authoritative Billing consequence before confirm. Acceptance includes both directions of repricing, Billing/inventory concurrency, ineligible invoice state and exact rollback.