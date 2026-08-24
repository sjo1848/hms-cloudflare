# CF-I06 billing parity package

Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.

| Source workflow | Target surface | Acceptance | Evidence |
|---|---|---|---|
| Extra charge updates booking total | `POST /api/v1/bookings/:id/extra-charges` + D1 trigger | charge and total change atomically; positive integer cents | `scripts/cf-i06-regression.sh` |
| Invoice and payment register | invoice/payment GETs and payment POSTs | partial/full settlement, typed methods, references, no overpay | focal regression + unit/typecheck |
| Settlement | `POST /bookings/:id/settle-payment` | exact remaining balance only | API contract implementation |
| Shift balance | `GET /billing/balance` | cash/card/count and pending invoice summary | focal regression |
| Cash handoff | `POST /billing/close-cash`, `GET /billing/closures` | expected cash guard, counted difference, unique shift closure | concurrent focal regression |
| Reception financial workflow | Billing and payments workspace | booking selection, charge, payment, visible history | Playwright widths 375/430/768/1024 and screenshot |

Target preserves the source enum spellings `PENDING`, `PAID`, `VOIDED` and `CASH`, `CARD`, `TRANSFER`. All authoritative monetary columns are SQLite `INTEGER` cents; no financial column uses `REAL`.

Source ordering and opening semantics are preserved: payment history is newest-first; the first shift opens at the earliest unclosed payment, or at the current time when no payment exists. Cash and `TRANSFER` are distinct methods but both contribute to the source-equivalent non-cash/card subtotal.
