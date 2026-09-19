# 08 — Stay extension and Billing consistency

Status: `BINDING DEFINITION / SOURCE-PARITY PRICING`.

A checked-in stay extension moves checkout later only when every added night is valid. Inventory/date/pricing/invoice/audit effects commit atomically or not at all.

Pricing remains `total stay nights × current room price + existing extra charges`. Replacing that with a frozen rate requires a future product decision.

Invoice reconciliation is governed exclusively by D11 in `20-intentional-target-departures.md` and by `14-billing-consistency.md`. The older invariant in this document that required paid amount never to exceed invoice amount is **superseded**. A priced extension must support every D11 reconciliation outcome and must fail closed when D11 says invoice state is not eligible for priced mutation.

UI shows new checkout, added nights, current room price, recalculated total and authoritative Billing consequence before confirmation. Acceptance includes both upward/downward total changes, concurrent Billing change, ineligible invoice state, inventory conflict and full rollback.