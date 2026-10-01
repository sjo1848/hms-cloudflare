# Block F Account/Finance — Frozen Inventory

Baseline: `39ee0a2b38e7205b8e041e792e16ee469c996241`
Task Contract: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`
Inspection is read-only; no product changes were made while preparing this inventory.

## Existing API / domain / capability surfaces

| Surface | Current behavior / authority | Capability / persistence |
|---|---|---|
| `apps/api/src/routes/billing.ts` | GET booking invoice, invoice portfolio, booking payments, extra charges and charge operation lookup; POST payment, settle-payment and extra charge; also Cash balance/closures/close (gated, out of scope) | canonical capability checks; authenticated operational D1; money fields in integer cents |
| `apps/api/src/modules/billing/domain.ts` | cents validation, payment target, payment method normalization, D11 reconciliation checks, operation payload matching | pure domain functions and tests |
| `apps/api/src/modules/billing/d1-payment-repository.ts` + `ports.ts` | payment/charge durable mutations and reads | D1; charge mutation uses F0.9 durable operation identity; payments use existing idempotency contract |
| `apps/api/src/auth/capabilities.ts` | canonical server-owned role grants | `billing.invoice.read`, `billing.invoices.read`, `bookings.extra_charges.read/write`, `bookings.update`, balance/close capabilities; no new grants in scope |
| hotel migrations 0010, 0015, 0016, 0019 and subsequent F0 migrations | legacy billing, payment identity scope, D11 reconciliation and forward-only F0 support | Never rewrite historical migrations or financial ledger during this task |
| API tests | `domain.test.ts`, `d1-billing-reconciliation.executing-d1.test.ts`, plus route/capability and F0.7/F0.9 tests | synthetic D1/Worker only |

## Existing web surfaces and context

| Surface | Current behavior / gap to assess |
|---|---|
| `apps/web/src/features/billing/BillingWorkspace.tsx` | One account panel with explicit Booking selector, amount summary, extra charge and payment forms/history; a separate CashBalancePanel is rendered on the legacy direct route. Billing read requests invoice/payments/charges concurrently. F0.9 charge token is persisted/recovered. Payment identity is component-state only and is lost on reload after ambiguous response; exact full-payment replay is checked after remaining-balance validation. Account summary must show credit distinct from remaining and become directly reachable from the selected Booking/Stay Case with a reliable return target. |
| `apps/web/src/features/billing/billing-workspace.css` | Account and Cash presentation share styles; inspect before changing and do not alter Cash behavior. |
| `apps/web/src/app/AppShell.tsx` | `/billing` compatibility route, capability gated; route label maps to Finance. |
| `apps/web/src/app/navigation.ts` | No Billing navigation item by design; existing Reception navigation/Case is primary Booking/Stay context. |
| `apps/web/src/features/reception/*` | Reception Case displays Booking/Stay account summary when available; inspect its existing link/action affordances before any integration. |
| `apps/web/src/i18n/locales/{en,es-AR}/billing.ts` | Existing Finance, account, charge, payment, Cash translations. Keep both locales in parity for any changed text. |

## Existing workflows and boundaries

- Booking/Stay account read: authoritative invoice plus payment and charge history.
- Extra charge: F0.9 operation identity, same-payload replay, lookup/recovery, D11 reconciliation and audit event pair.
- Payment: existing explicit payment mutation and immutable payment entry; checkout settlement guarded separately by F0.7.
- Cash close: existing routes/UI exist but ownership semantics remain unresolved under OD-1 and are not part of this implementation increment. Keep the legacy direct `/billing` route as-is; a new contextual account task launched from Case omits Cash so it does not pull the gated workflow into F-account. Do not alter Cash files/routes/API or calculations.
- Receivables: outstanding Booking Account amounts; never part of Cash totals/counts/difference.

## Confirmed constraints / pre-implementation observations

- Task Contract, Block Contracts, Blueprint and evidence matrix all distinguish F-account from F-cash.
- Issue #52 explicitly preserves the real-hotel Cash validation as a separate Product Acceptance/Human Gate.
- F0.9 provides the stable charge-token contract. F0.7 defines settlement at the checkout mutation boundary. F0.10 owns capability truth. F0.11 owns authoritative refresh semantics. F0.12 owns aggregate evidence consistency.
- Existing `/billing` is a compatibility route; there is no billing item in the main navigation. Any new contextual affordance must use already-approved Booking/Stay context and existing capability, and remain within this Task Contract.
- No new API/domain/schema contract is currently required. If implementation reveals otherwise, stop at `ROADMAP_BLOCKER` and record the exact gap in Issue #52.
