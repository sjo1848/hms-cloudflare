# HMS-F0-07 — Invariant Evidence

Task Contract: `.orchestration/contracts/HMS-F0-07-SETTLEMENT-GUARD-001.md`
Evidence type: executing Miniflare D1, clean local Wrangler D1, local Wrangler Worker + Vite + real browser; synthetic fixtures only.
Real-data status: **no remote/customer D1, live checkout, cutover or production data was read or written**.

| Invariant | Applies? | Status | Concrete evidence |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `check-in-concurrency.executing-d1.test.ts`: conditional D1 winner; full payment committed between account snapshot and batch; extra charge committed between snapshot and batch; both stale checkouts reject with exact booking/room/inventory/account/event assertions. Late CHECK_OUT event failure rolls back booking, room version, inventory, invoice and event. Two-checkout contention yields one event. |
| INV-AUDIT-001 | APPLIES | PASS | Executing-D1 exact event counts/provenance for success, unpaid/partial/VOIDED/ledger mismatch/invoice-total mismatch rejection, stale payment/charge, concurrent duplicate and late-event failure. Real local browser D1 read confirms exactly one CHECK_OUT event per successful booking. |
| INV-DOMAIN-001 | APPLIES | PASS | Only lifecycle checkout command performs the transition; migration 0028 guards CHECKED_IN → CHECKED_OUT and CHECK_OUT event truth. Invalid/no-settlement paths are rejected without row drift; route duplicate checkout is actionable conflict. |
| INV-TENANT-001 | APPLIES | PASS | Checkout uses the membership-selected operational D1; CF-I03 isolated local API regression covers membership, unknown binding and absent foreign booking; two hotel operational stores were migrated independently. No checkout path accepts a client database selector. |
| INV-RBAC-001 | APPLIES | PASS | CF-I03 extension proves receptionist membership is active and the same subject has `bookings.write` but lacks `bookings.checkout.override`; pending-approved checkout is 403 with unchanged booking/event/invoice state. Admin checkout success is covered by integrated Worker/browser. |
| INV-PARITY-001 | APPLIES | PASS | Frozen J-04/CF-I04 policy mapping remains `settled` vs authorized `pending-approved`; executing-D1 covers no invoice, zero total, partial, exact payment, credit, VOIDED, amount mismatch and ledger mismatch. No payment entry is created by checkout. |
| INV-ENUM-001 | APPLIES | PASS | Executing-D1 and migration tests assert `PENDING`, `PAID`, `VOIDED`, `settled` and `pending-approved` semantics; zero-total invoice is D11-derived `PAID` with `paid_at=NULL`, without fabricating a payment. |
| INV-UX-001 | APPLIES | PASS | Checkout remains in the selected Reception booking task. Real local desktop/mobile flow confirms inline 409 guidance, retained context before retry, no optimistic success, and authoritative queue refresh after 200. Screenshots are diagnostic artifacts under `output/playwright/f0-7-*.png`. |
| INV-ORDER-001 | N/A | N/A | F0.7 does not change reception queue rank, next-case or synthetic work-item ordering. |
| INV-RESP-001 | APPLIES | PASS | Real Worker/D1 browser checkout exercised at desktop 1280×900 and mobile 375×844, including a 409 and successful authorized pending checkout; Reception refresh reflected the authoritative result. |
| INV-EVID-001 | APPLIES | PASS | Executable evidence is mapped in `HMS-F0-07-SETTLEMENT-GUARD-001-E2E.md`; mocks were not used for integrated checkout. The broad product-flow runner's missing `playwright` package is recorded as a runner limitation, not represented as a product PASS; equivalent required checkout evidence was executed through the Playwright CLI against local Worker/D1. |
| INV-LEGACY-001 | N/A | N/A | No legacy history is synthesized, backfilled or reinterpreted. |
| INV-MONEY-001 | APPLIES | PASS | All checkout arithmetic is integer cents. D11 exact ledger/amount/status snapshots, stale payment/charge and invoice mismatches, credit, positive receivable, event rollback and zero-payment creation are asserted. CF-I06 passes. |
| INV-STATE-001 | APPLIES | PENDING A/B | Publication must use immutable Artifact A followed by orchestration-only Boundary B; external Independent Critic is required before this task is accepted. No self-SHA or self-approved substantive PASS is claimed. |
| INV-CF-I07-001 | N/A | N/A | No admin, network, audit or protected-route authorization shortcut changed. |
| INV-CF-I07-002 | N/A | N/A | No admin semantic no-op mutation changed. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade workflow changed. |
| INV-CF-I07-004 | APPLIES | PASS | CF-I03–I06 terminate sequentially with their owned local Worker/D1 fixtures cleaned. The manually launched F0.7 browser/Worker/Vite processes were closed and their exact temporary D1 directory removed; the regression runner that failed to load `playwright` also cleaned its own temporary fixture. |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic changed. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation changed. |
| INV-CF-I08-003 | N/A | N/A | No reporting date/state query changed. |
| INV-CF-I08-004 | N/A | N/A | No room/booking state value was added or changed. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock/default-date behavior changed. |
| INV-SCOPE-001 | APPLIES | PASS | Diff is bounded to F0.7 checkout settlement enforcement, its migration, Reception conflict recovery, directed/regression tests and evidence. No Blocks A–H, real data, PR/push/merge, main, staging mutation, deploy or production. |

## Reviewer finding and disposition

Read-only DB/concurrency reviewer Leibniz (GPT-6 Luna Medium) confirmed that the conditional checkout update binds booking total, invoice identity/status/amount/paid amount/`paid_at`, and ledger sum. The reviewer identified missing exact assertions for inventory/charges, lack of a deterministic intervening-charge case, and omission of `paid_at` from the durable event snapshot. Those are repaired in the current diff: the event trigger and event JSON bind `paid_at`; executing-D1 now interposes both a real payment and an extra charge after snapshot but before batch, asserts no checkout drift, and asserts fresh retry uses current charge-adjusted account truth. Invoice uniqueness is guaranteed by D11 migration 0019 (`invoices.booking_id UNIQUE`).

The reviewer also noted that both successful serial orders for checkout/payment and checkout/charge need exact evidence. Existing tests cover payment/charge committed before checkout and billing operations after checkout, plus the controlled stale interleavings and a simultaneous payment/checkout case; the final independent critic must specifically assess whether that matrix is sufficient.

## Publication check

- [x] Every registry invariant is classified.
- [x] All applicable implementation/test/browser evidence is local and synthetic.
- [ ] Mandatory Pre-Critic Gate complete against final fresh results.
- [ ] Immutable Artifact A and orchestration-only Boundary B frozen.
- [ ] Fresh Independent Critic verdict received; no implementer self-approval.
