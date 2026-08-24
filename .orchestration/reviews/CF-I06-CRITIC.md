# CF-I06 — External Independent Critic

Reviewed artifact A: `907d78629e2432f4ee54006c682f8185b04f7d4b`  
Publication boundary B: `3f3abdadd5c1c6ad80d58308635c55a901c18752`  
Reviewer: ChatGPT External Independent Critic  
Verdict: `REWORK-1`  
Human Gate: `NONE`  
Diagnosis: `FINANCIAL_SNAPSHOT_ATOMICITY + PAYMENT_REJECTION_SIDE_EFFECT + CASH_CLASSIFICATION_PARITY + UX_CASH_CLOSE_GAP + REQUIRED_EVIDENCE_GAPS`

## Summary

Artifact A establishes a useful CF-I06 foundation: integer-cent schema, booking-local invoices/payments/charges, concurrent overpayment protection for an existing invoice, single-opening cash-closure uniqueness, backend capability checks, financial events, booking billing UI and A→B publication are all materially present. Boundary B is orchestration-only and points exactly to A.

CF-I06 cannot PASS yet. The financial contract requires stronger guarantees than the current code/evidence proves. The most important defect is that some decisions are made from mutable financial snapshots outside the authoritative write boundary, while another rejected operation can still leave committed financial state. Source parity also differs in non-cash classification and first-shift semantics, the source cash-close workflow is not present in the target UI, and several mandatory tests were marked complete without executable proof.

This is routine autonomous REWORK. CF-I07 remains unauthorized until a fresh CF-I06 PASS.

## Blocking findings

### P1 — Rejected first payment/overpayment can leave a newly-created invoice committed

`pay()` reads booking/invoice, then executes a D1 batch whose first statement is `INSERT OR IGNORE INTO invoices`. The payment INSERT and invoice UPDATE may legitimately affect zero rows for an overpayment. After `db.batch()` has completed, JavaScript inspects `meta.changes` and throws `409`.

A post-batch JavaScript throw does not roll back a D1 batch that already completed successfully. Therefore a request against a booking with no invoice can be rejected while the batch has still created the invoice. The current regression executes exactly this shape (overpayment before the first valid payment) but only asserts HTTP 409; it does not assert that invoice state remained absent/unchanged.

Required repair:
- make payment admissibility and invoice creation/update one fail-closed write boundary;
- rejected overpayment/stale payment must produce zero new payment rows, zero invoice creation/update and zero financial event;
- add deterministic assertion for the no-invoice overpayment case before and after rejection;
- do not rely on throwing in JavaScript after a successfully committed batch to obtain rollback semantics.

### P1 — Cash close does not revalidate the financial snapshot inside the write boundary

`close-cash` reads latest closure and payment summary before the batch, compares only the caller's expected cash against that pre-read summary, then inserts the closure if `opening_time` has not already been closed.

A payment can arrive after the summary read but before the closure INSERT. The current `NOT EXISTS(cash_closures WHERE opening_time=...)` prevents duplicate closures, but it does not prove that total/cash/non-cash/payment-count are still the same values being closed.

The accepted source explicitly re-reads the actual payment summary inside the closure transaction, compares expected total/cash/card/count against the actual snapshot, and returns `CASH_SHIFT_BALANCE_CHANGED` if any value changed.

Required repair:
- correlate/revalidate total, cash, non-cash/card, payment count and opening boundary in the same authoritative D1 write boundary that creates the closure;
- a payment inserted between pre-read and close must make the close fail with zero closure/event;
- add deterministic stale-snapshot race evidence, not only two concurrent close requests with no intervening payment.

### P1 — TRANSFER is omitted from the source non-cash/card bucket

The source cash summary uses `payment_method <> 'CASH'` for the `card_amount_cents` bucket. Target `/billing/balance` and `close-cash` use only `payment_method='CARD'`.

As a result, TRANSFER contributes to `total_amount_cents` and `payment_count` but disappears from the source-equivalent non-cash/card subtotal and closure snapshot.

Required repair:
- preserve source semantic classification (`CASH` vs non-CASH) or an explicitly equivalent representation;
- add a TRANSFER fixture and assert total, cash, non-cash/card and closure values exactly.

### P1 — Cash balance / close-cash UX required by the contract is absent

CF-I06 requires an operator-visible balance and cash-close workflow with expected cash, counted cash, difference, handoff target and notes. The accepted source has a dedicated `CashShiftCloseSheet` exposing these fields.

The target UI added only the booking-level BillingPanel (invoice, charge, payment/history). No cash-balance/closure UI is present, and the browser script cannot exercise it.

Required repair:
- port/adapt the cash balance + shift-close workflow into the active target surface without redesigning away expected/count/difference/handoff/notes;
- include typed stale-balance/concurrent-close error behavior;
- browser must execute the material close workflow, not only API curl.

### P1 — Mandatory browser matrix and error coverage are incomplete

Task Contract requires at minimum `375/390/430/768/1024`. The committed browser harness executes only `375/430/768/1024`; 390 is missing.

The browser run proves two success mutations (extra charge + payment), but it does not execute the required cash-close flow or meaningful financial validation/error recovery.

Required repair:
- execute 375/390/430/768/1024;
- prove charge/payment validation, successful partial/payment refresh, rejected overpay with input/error state as appropriate, balance and close-cash material controls, stale/typed close error, and no horizontal overflow.

### P1 — Required inherited/security/adversarial evidence was waived rather than passed

The Pre-Critic file states CF-I03/CF-I04/CF-I05 regression chain stopped on a local D1 process lock and labels that a runner limitation. The CF-I06 contract explicitly requires inherited regressions to pass; a runner problem is not product failure, but it is also not PASS evidence.

The focal CF-I06 regression also does not execute the required cross-tenant and forbidden/unknown-role financial cases, does not test the `/settle-payment` endpoint, does not prove positive and negative cash differences, and does not test TRANSFER semantics. `INV-TENANT-001`, `INV-RBAC-001` and parts of `INV-MONEY/PARITY/EVID` are therefore overclaimed.

Required repair:
- fix/isolate the local runner lifecycle or execute inherited suites in a way that produces clean PASS evidence;
- add backend allow/deny role matrix and cross-tenant/unknown-object zero-side-effect tests;
- exercise `/settle-payment` explicitly;
- prove both positive and negative counted-cash differences;
- prove TRANSFER classification;
- add extra-charge failure/consistency evidence required by the contract.

### P2 — Payment-history order differs from accepted source

Source payment history orders newest first (`received_at DESC`, then creation order). Target orders `received_at, id` ascending. CF-I06 declares `INV-ORDER-001` applicable, but the invariant evidence file omits it entirely.

Required repair:
- preserve source payment-history order (or document a semantically equivalent accepted ordering);
- add `INV-ORDER-001` classification/evidence to CF-I06 invariant evidence.

### P2 — First-shift opening_time semantics differ from source

Source defines the first shift opening as the earliest unclosed payment, or current time when there are no payments. Target exposes `0000-01-01T00:00:00.000Z` until the first closure.

This produces a visibly/artificial opening boundary and is not source-equivalent operational information.

Required repair:
- reproduce source first-opening semantics or an explicitly equivalent boundary;
- test no-payment first shift and first-payment shift opening behavior.

## Accepted in artifact A

- monetary storage is INTEGER cents with safe-integer API parsing;
- payment methods/status schema enums are constrained;
- existing-invoice concurrent overpayment fixture produces one success/one conflict and prevents overpay;
- booking-local payment/invoice/charge relations exist;
- financial event structure carries actor/request/hotel metadata;
- single opening-time closure uniqueness prevents duplicate closure of the same already-established opening;
- backend capability map exists;
- booking-level billing UI is integrated with existing Reception rather than replacing it;
- boundary B changes only orchestration state and points exactly to artifact A;
- no CF-I07, production, remote D1, real-data or paid-resource scope entered the artifact.

## Harness / learned-rule consequence

Before the next artifact, strengthen the learned rules so that a business decision derived from mutable state is not considered atomic merely because its later writes are batched. For financial operations in particular, the snapshot used to authorize/price/close the operation must be correlated or revalidated inside the same authoritative write boundary. A JavaScript post-batch `meta.changes` check cannot retroactively roll back already-committed side effects.

Also enforce that a required regression blocked by the test runner remains `UNPROVEN`, not PASS, until executable evidence exists.

## Required next action

Under `PM-AUTONOMY-001`, authorize autonomous CF-I06 REWORK-1:

1. repair payment rejection so a rejected first payment/overpayment leaves invoice/payment/event state unchanged;
2. make cash close revalidate the complete mutable financial snapshot inside its write boundary;
3. restore source non-CASH/TRANSFER classification and first-shift opening semantics;
4. implement target cash balance + close-cash UX parity;
5. restore source payment-history ordering and classify `INV-ORDER-001`;
6. complete the full 375/390/430/768/1024 browser matrix with success/validation/error/close-cash journeys;
7. add missing settle-payment, tenant/RBAC, transfer, positive/negative difference, extra-charge consistency and stale-snapshot regressions;
8. obtain real PASS from inherited CF-I03/04/05 regressions instead of waiving runner failure;
9. update invariant and Pre-Critic evidence so no claim exceeds executable proof;
10. publish fresh artifact A + orchestration-only boundary B and stop for Independent Critic.

Do not begin CF-I07 before a fresh CF-I06 Independent Critic PASS.