# 14 — Billing consistency

Status: `BINDING ACCOUNTING CONTRACT`.

D9 defines which operations may change booking total. D11 in `20-intentional-target-departures.md` is authoritative for reconciliation after a priced mutation.

Binding accounting summary:
- only explicitly priced operations may reprice a booking;
- every real total change and invoice reconciliation are one atomic business mutation;
- state/evidence-only commands preserve booking total;
- payment entries are immutable payment evidence;
- after every successful payment/reconciliation, invoice paid amount equals the sum of its payment entries;
- price reconciliation never creates/deletes/rewrites a payment entry and does not fabricate payment method/reference or cash movement;
- checkout evaluates the already-authoritative financial state and never reprices accommodation;
- no automatic refund, credit transfer, or VOIDED recovery workflow is introduced;
- full D11 regression proof is mandatory.

Room/date repricing continues to use total stay nights × current selected-room price plus existing extra charges. Reassignment uses destination price; extension uses currently assigned-room price. Extra charges are priced mutations.

Any contradiction between this summary and D11 is resolved in favor of D11.