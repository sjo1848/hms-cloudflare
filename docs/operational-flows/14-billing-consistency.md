# 14 — Billing consistency

Status: `BINDING ACCOUNTING CONTRACT`.

D9 defines which operations may change the booking total. D11 in `20-intentional-target-departures.md` is the authoritative contract for reconciliation when a priced mutation changes an existing invoice, including credit/overpayment representation, settlement-state derivation, `paid_at` handling, payment immutability, the legacy invoice constraint migration, and the fail-closed boundary for a VOIDED invoice.

This document therefore binds the following high-level rules:
- only explicitly priced operations may reprice a booking;
- every real total change and invoice reconciliation are one atomic business mutation;
- state/evidence-only commands preserve booking total;
- payment history is immutable;
- checkout evaluates the already-authoritative financial state and never reprices accommodation;
- no automatic refund, credit transfer, or VOIDED recovery workflow is introduced by this wave;
- D11 regression proofs are mandatory before acceptance.

Room/date repricing continues to use total stay nights × current selected-room price plus existing extra charges. Reassignment uses destination price; extension uses the currently assigned room price. Extra charges are priced mutations.

Any contradiction between this summary and D11 is resolved in favor of D11.