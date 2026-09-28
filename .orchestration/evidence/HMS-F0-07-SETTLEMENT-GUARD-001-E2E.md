# F0.7 Integrated checkout evidence

Environment: local Wrangler Worker on `127.0.0.1:8787`, Vite on `127.0.0.1:4175`, isolated temporary persistence `/tmp/hms-f07-e2e-MLlUBx/state`, real local D1 migrations through 0028, and Playwright CLI browser. All fixtures used synthetic IDs and were isolated from repository/default Wrangler state. No application mocks were used for these checkout requests.

## Desktop — 1280×900

Fixture: `f07-desktop-booking`, guest `F07 Desktop Guest`, room 305, total 15,000 cents, CHECKED_IN, no invoice/payment.

- API POST `settled` was issued with all checkout confirmations and returned HTTP 409. The UI showed the localized inline account/booking conflict; selected booking and Reception lane remained available. A repeated `settled` attempt returned 409 again because the account remained unpaid (not a harness retry).
- Changed to authorized `pending-approved`, reference `manager-approved-2026`; the real API returned HTTP 200. Reception refreshed from the server; the checked-out booking left the active “En casa” queue.
- Wrangler D1 read after success: booking `CHECKED_OUT`, total 15000, policy `pending-approved`; exactly one invoice `PENDING` amount 15000, paid 0, ledger 0, `paid_at=NULL`; room 305 `DIRTY` with housekeeping `DIRTY`; inventory nights 0; exactly one CHECK_OUT event. Event JSON records the same total/invoice/paid/ledger/remaining/credit snapshot and `paid_at=NULL`.
- Screenshots: `output/playwright/f0-7-desktop-settlement-conflict.png`, `output/playwright/f0-7-desktop-success.png`.

## Mobile — 375×844

Fixture: `f07-mobile-booking`, guest `F07 Mobile Guest`, room 303, total 20,000 cents, CHECKED_IN, no invoice/payment.

- Selected the booking within mobile Reception, chose `pending-approved` with reference `approved-ref-2026`, and checked reviewed charges, room release and housekeeping handoff.
- Real API POST returned HTTP 200. Authoritative refresh reduced active in-house queue from 2 to 1 and removed the selected booking task.
- Wrangler D1 read: booking `CHECKED_OUT`; exactly one invoice `PENDING` amount 20000, paid 0, ledger 0, `paid_at=NULL`; room 303 `DIRTY`; inventory nights 0; exactly one CHECK_OUT event whose account snapshot has remaining 20000 and credit 0. No payment was fabricated.
- Screenshot: `output/playwright/f0-7-mobile-success.png`.

## Additional executable evidence

- Executing D1: `npx vitest run apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts` — 1 test passed, covering settlement matrix, both deterministic stale interleavings, exact rollback and event/account snapshots.
- Clean migration rehearsal: `wrangler d1 migrations apply` for `CONTROL_DB`, `HOTEL_DEMO_DB` and `HOTEL_SECOND_DB`, each using the same newly-created temporary `--persist-to` directory. All migrations including `0028_checkout_settlement_guard.sql` applied successfully; temporary state was removed afterward.
- API response-loss/replay proof in `scripts/cf-i03-regression.sh`: a successful real Worker checkout POST deliberately discards its response body, then authoritative booking read confirms CHECKED_OUT; retry returns the typed already-recorded 409. D1 confirms exactly one CHECK_OUT event and invoice, zero fabricated payments. The same regression proves duplicate checkout does not duplicate the event/invoice.
- RBAC regression explicitly activates a receptionist membership without `bookings.checkout.override`; pending-approved is denied with 403 and unchanged booking/event/invoice state. Final `npm run test:cf-i03` exited 0 after both response-loss and RBAC assertions; output: `/tmp/hms-f07-cf-i03-final2.log`.
- Sequential regressions: CF-I03 PASS (exit 0), CF-I04 PASS (exit 0; composed by the runner), CF-I05 PASS after its process-group initialization/cleanup race repair, CF-I06 PASS. Each runner used isolated temporary Wrangler persistence.
- Foundation aggregate rerun on the final source/test diff: `npm run check` PASS, 32 files / 144 tests; captured at `output/playwright/f0-7-npm-check-final.log`. TypeScript, build, architecture/i18n/budgets, query plans, Wrangler API/Web dry-runs and staging SPA dry-run also PASS (dry-run only; these were freshly run before only the shell regression assertion changed).
- `scripts/cf-product-flow-regression.sh` was attempted with an isolated temporary Wrangler store and alternate local Vite port, but its browser phase could not import the undeclared/missing npm package `playwright`. This is a runner dependency limitation, not a passing result. Required checkout UI evidence above was executed independently with the Playwright CLI against the real local Worker/D1.

## Isolation and cleanup

The product-flow runner previously deleted shared `apps/api/.wrangler/state/v3/d1`; it was changed to use only its own temporary Wrangler persistence. For the manual checkout session, browser, Wrangler and Vite processes started by this task were stopped; exact temp DB state was removed. The pre-existing Vite listener on port 4174 was not touched. No remote D1 or real/customer row was accessed.
