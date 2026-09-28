# F0.7 Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-07-SETTLEMENT-GUARD-001.md`
Reviewer mode: implementation self-adversarial gate only; not Independent Critic acceptance.

| Gate | Result | Evidence / disposition |
|---|---|---|
| Contract and scope | PASS | F0.7 Task Contract exists before implementation. Diff stays within checkout settlement enforcement, forward migration, Reception conflict recovery, tests and local evidence. |
| Source parity | PASS | `settled` requires current fully-paid Booking Account/Folio; `pending-approved` preserves capability and trimmed reference checks. No new invoice status, payment, method, reference or account grain is introduced. |
| Exact mutation winner | PASS | Checkout update correlates pre-read booking total, invoice identity/status/amount/paid amount/paid_at and ledger sum inside the same D1 batch. The migration independently guards D11 consistency and `CHECK_OUT` event truth. Tests inject full payment and extra charge between snapshot and batch and prove stale checkout loses. |
| Atomic financial/domain writes | PASS | Late CHECK_OUT event abort rolls back booking, room/version, room-night inventory and invoice; exact payment, charge and invoice state remains. D11 payment/charge behavior is preserved. |
| Settlement and mismatch matrix | PASS | Missing invoice/zero and positive total; unpaid; partial; exactly paid; paid in credit; VOIDED; invoice amount mismatch; ledger mismatch; current payment and charge before checkout; post-checkout billing behavior; simultaneous payment/checkout; stale interleavings. |
| Audit truth | PASS | Successful event has actor/hotel/request and integer-cent account snapshot including `paid_at`; D1 event trigger compares that snapshot with current invoice/ledger truth. Rejected operations create no checkout event. |
| Response-loss/replay | PASS | Route returns an actionable already-recorded 409 for a replay after commit. CF-I03 asserts replay status/message, one event/invoice, no payment, and no duplicate transition; `npm run test:cf-i03` exited 0. UI conflict refresh is integrated in real desktop/mobile sessions. |
| RBAC / tenant | PASS | Backend requires `bookings.checkout.override`. CF-I03 establishes an active receptionist membership lacking that capability, asserts 403 and unchanged D1 state; runner exited 0. Existing selected-hotel D1 routing remains server-authoritative. |
| UX/browser/responsive | PASS | Real local Worker+D1 browser flows at desktop 1280×900 and mobile 375×844; 409 inline conflict, authorized success and authoritative Reception refresh. Screenshots are supporting artifacts, not the assertion itself. |
| DB/migrations | PASS | Fresh isolated Wrangler migration chain to 0028 succeeded on CONTROL_DB and both hotel D1 bindings. 0019 remains historical/read-only; 0028 is forward-only. |
| Full regression | PASS | `npm run check` exited 0: 32 files / 144 tests. Types, web build, architecture/i18n/budgets, D1 query plan, Wrangler API/Web/staging SPA dry-runs PASS. CF-I03/04/05/06 passed sequentially on isolated local state; CF-I03 final captured rerun exited 0. |
| Runner/environment | FINDING RECORDED | Broad product-flow CLI runner cannot import missing npm `playwright`; it was not counted PASS. Equivalent checkout flow was exercised by Playwright CLI against real Worker/D1. No package dependency was silently added. |
| Security/scope | PASS | No deployment, remote/local shared-store write, real data, PR, push, merge, main, staging mutation, production, or Blocks A–H. The shared `.wrangler` store was not deleted. |

## Publication disposition

- [x] Amended CF-I03 response-loss/RBAC rerun passed (exit 0); runner cleaned its owned services and temporary D1.
- [x] Final Foundation check captured at 32 files / 144 tests; `git diff --check`, shell syntax and STATUS JSON parse pass.
- [x] STATE/STATUS reconciled; immutable Artifact A and orchestration-only Boundary B frozen before review.
- [ ] Fresh separate Independent Critic on exact A+B; no implementer self-approval.
