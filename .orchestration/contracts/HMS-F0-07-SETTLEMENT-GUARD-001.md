# HMS-F0-07 — Settlement Guard at Checkout Mutation Boundary

Status: `FROZEN BEFORE IMPLEMENTATION`  
Authority: Foundation 0 Implementation Authorization RG1–RG7; Roadmap A2/B2; `HMS-FOUNDATION-0-CONTRACT-V1.md` §F0.7; `HMS-IMPLEMENTATION-ROADMAP-DEPENDENCY-DAG-V1.md`; `HMS-TEST-EVIDENCE-MATRIX-V1.md`; Blueprint 001 / Reconciliation 007 / Final Disposition 008.  
Dependencies: F0.2, F0.5 and F0.6. Their exact accepted artifacts remain unchanged.

## Objective

Make checkout evaluate the current Booking Account/Folio truth at the authoritative D1 mutation boundary. A stale booking/invoice/payment/charge snapshot must neither authorize an invalid `settled` checkout nor incorrectly reject a checkout that is valid under the latest account state. Checkout domain writes, room/inventory handoff, invoice creation where absent, and its event remain one atomic operation.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Required evidence |
|---|---|---|---|
| Preserve accepted checkout policy semantics. | Existing `POST /api/v1/bookings/:id/check-out`, `CheckoutPolicy`, and Reception checkout form. | `settled` is accepted only when current invoice/account amount is covered by current ledger truth (`paid_amount_cents >= amount_cents`); `pending-approved` retains its existing backend `bookings.checkout.override` capability and trimmed reference minimum of 6. Neither policy records a new payment. | API+executing-D1 tests for unpaid, partial, exactly paid, credit, override-authorized and override-denied cases; exact cents and zero writes on rejection. |
| Resolve current account truth and preserve D11. | Existing lifecycle repository, billing repository/migration triggers; **PROPOSED NEW FORWARD SURFACE:** `apps/api/schema/hotel-migrations/0028_checkout_settlement_guard.sql`. | Before `CHECKED_IN → CHECKED_OUT`, invoice amount matches current booking total; status is not `VOIDED`; invoice paid amount equals `SUM(payment_entries)`; status/paid_at remain D11-derived. When no invoice exists, effective account amount is current booking total and ledger paid is zero; create the invoice only inside successful checkout. A zero-total/no-invoice account is settled; a positive amount without invoice is not. | Executing-D1 exact account snapshots for missing, pending, paid, credit, VOIDED and ledger mismatch; clean Wrangler chain through 0028. |
| Serialize checkout against concurrent payment/charge/account changes. | Existing `D1LifecycleRepository.checkout`, `D1PaymentRepository`, lifecycle/billing routes; forward trigger if needed. | Bind/revalidate booking total, invoice identity/status/amount/paid_at, and ledger sum in the same D1 batch that wins checkout. D11 charge reconciliation and payment-ledger triggers remain authoritative. A payment/charge committed before checkout is evaluated as current; checkout committed first is a valid earlier serial outcome and later payment/charge keeps its existing contract. Do not broaden post-checkout billing policy. | Both commit orders and controlled simultaneous races for checkout vs payment and checkout vs extra charge; assert exact booking, room, inventory, invoice, payment, charge and event state. Stale losing checkout returns conflict and creates no event. |
| Preserve atomic domain transition and audit. | Existing checkout batch and `lifecycle_events.CHECK_OUT`. | Booking, room state/version, inventory release, invoice creation, and exactly one event commit or all roll back. Event stores the policy and safe account snapshot (integer cents, invoice/status, paid/ledger/remaining/credit) that justified the transition; actor/hotel/request provenance is preserved. | Executing-D1 exact winner, two-checkout race, zero-row/stale account tests and injected final-event failure; exact state/event counts and provenance. |
| Make response-loss outcome recoverable. | Existing booking/front-desk board, invoice read, checkout response/conflict. No new route unless a concrete contract gap is proven. | If response is lost after commit, a subsequent authoritative booking + invoice read and durable checkout event identify the completed transition and current account. A repeated command never creates another room transition or event; it returns an actionable typed conflict describing already-completed/current state rather than a generic server error. | Worker/API simulation that commits checkout but drops the first response, then queries booking/account and retries; exactly one event and no duplicate effects. |
| Expose actionable, non-sensitive account conflict. | Existing checkout API error envelope and Reception selected-booking checkout task. | A settlement/stale conflict identifies current total, paid, remaining/credit and invoice state sufficiently for account review; no payment references or unrelated guest data are exposed. UI keeps selected booking/context and shows the conflict inline; no optimistic checkout success. | Real local Worker/D1 browser/API flow with stale 409, rendered current-account guidance, authoritative refresh, focus retained, desktop and mobile widths. |
| Keep authorization and tenant isolation authoritative. | Existing lifecycle middleware/capabilities and membership-selected operational D1. | Existing checkout capability rules stay backend-authoritative. `pending-approved` remains admin/authorized override only. Account IDs are resolved only inside the selected hotel D1; cross-tenant and unauthorized attempts leave all rows/events unchanged. | Allowed and denied role cases with proven identity/membership, plus second-hotel object isolation and exact zero drift. |

## Approved settlement interpretation and preserved behavior

- Source contract J-04 and CF-I04 establish the two choices: `settled`, or `pending-approved` with authorized override and a closing reference; charge-review, release and housekeeping-handoff confirmations remain required.
- F0.7's frozen “settlement predicate” means `settled` must be backed by the current Booking Account/Folio and payment ledger, not merely the operator's selected string. This implements existing semantics; it does not add a payment or alter checkout UI policy choices.
- `pending-approved` permits an outstanding positive balance only under the existing override capability/reference contract. It does not waive a `VOIDED` invoice or ledger mismatch, because those states do not provide trustworthy current account truth.
- D11 remains authoritative: `paid_amount_cents = SUM(payment_entries.amount_cents)`; remaining and credit are nonnegative derived values; status is `PAID` iff paid is at least amount, otherwise `PENDING`; checkout never edits payment entries or fabricates method/reference.
- Transactions are serial. If payment/charge commits before checkout's guarded write, checkout evaluates the updated truth. If checkout commits first, a later billing command remains governed by its existing behavior; F0.7 does not add a new post-checkout billing restriction. The checkout event records the balance at the checkout instant.
- On response loss, recovery uses authoritative booking and invoice reads plus the durable checkout event. This increment does not require cross-hotel operations, a new global account, or a new payment source of truth.

## Current repository surfaces

- `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`
- `apps/api/src/modules/lifecycle/ports.ts`
- `apps/api/src/modules/lifecycle/domain.ts`
- `apps/api/src/routes/lifecycle.ts`
- `apps/api/src/modules/billing/d1-payment-repository.ts`
- `apps/api/src/modules/billing/domain.ts`
- `apps/api/src/routes/billing.ts`
- `apps/api/schema/hotel-migrations/0019_billing_reconciliation.sql` (read-only compatibility reference; do not edit historical migration)
- `apps/api/schema/hotel-migrations/0023_room_state_command_guards.sql` (read-only compatibility reference; do not edit historical migration)
- `apps/web/src/features/reception/ReceptionPage.tsx` (minimum user-visible conflict/recovery feedback only)
- `apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts` and `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts` (existing test surfaces to extend only where appropriate)
- **PROPOSED NEW SURFACE:** dedicated checkout settlement executing-D1/API regression if existing tests cannot express the required interleavings.
- **PROPOSED NEW SURFACE:** forward-only `0028_checkout_settlement_guard.sql` if a DB-level event/settlement boundary is needed; no migration history rewrite.

## Non-goals / forbidden

- No new settlement policy, invoice status, payment method, payment entry, global guest account, or separate financial truth.
- No changing the existing `pending-approved` capability/reference rule or checkout confirmations.
- No redefining billing behavior after checkout; preserve current payment/charge domain behavior and test serial ordering without imposing a new product restriction.
- No unrelated Reception/Billing redesign, cash/shift work, Blocks A–H, or additional Foundation node.
- No historical migration edits, real/customer data, live cutover, remote D1, PR, push, merge, `main`, staging mutation, deploy, or production.

## Concurrency, exact-winner, and recovery matrix

| Adversarial case | Required result |
|---|---|
| `settled` with no invoice and positive total; partial payment; payment below charge-adjusted total | 409; no checkout, room/inventory/invoice/event mutation. |
| `settled` exactly paid or paid in credit | Success; exact D11 state and account snapshot in one event; no ledger mutation. |
| `pending-approved` with positive remaining and authorized role + valid reference | Success; remaining stays receivable; no fabricated payment. |
| `pending-approved` without capability/reference | 403/400 as applicable; zero domain/account/event mutation. |
| VOIDED invoice or invoice/ledger mismatch, either checkout policy | Fail closed with safe current-account conflict; zero drift. |
| Payment/charge commits after checkout's snapshot but before its batch | Checkout loses against exact current booking/invoice/ledger snapshot; no partial transition/event; response identifies current state. |
| Payment/charge commits before checkout snapshot/batch | Checkout evaluates new values; `settled` may succeed only if now fully settled; otherwise only authorized `pending-approved` can proceed. |
| Checkout commits before payment/charge | Checkout event reflects its exact prior account snapshot; following billing operation follows its existing contract and reconciles via D11; no duplicate checkout/event. |
| Two checkouts or lost response/retry | One transition/event; retry outcome is queryable from authoritative booking/account state and durable event; no duplicate room/inventory/invoice/event effects. |
| Failure injected after booking transition but before final event | Entire D1 business operation rolls back, including invoice creation, room/version and inventory. |

## All-registry invariant classification

| Invariant | Classification | Acceptance/evidence mapping |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Exact conditional winner, stale account/version/ABA, race orders, late rollback, exact rows and no false success. |
| INV-AUDIT-001 | APPLIES | Exactly one checkout event iff winner; zero on stale/denied/rejected; exact actor/hotel/request/account snapshot. |
| INV-DOMAIN-001 | APPLIES | Checkout/payment/charge stay explicit domain commands; no generic status/account update path. |
| INV-TENANT-001 | APPLIES | Selected hotel D1, second-hotel isolation and zero cross-tenant mutations/events. |
| INV-RBAC-001 | APPLIES | Checkout and pending-override capability matrix; denied identity cannot mutate. |
| INV-PARITY-001 | APPLIES | Preserve J-04/CF-I04 checkout policy, reference and confirmation semantics; no inferred exception. |
| INV-ENUM-001 | APPLIES | Preserve `settled` / `pending-approved` meaning across route/domain/storage/UI predicates. |
| INV-UX-001 | APPLIES | Keep checkout in selected booking workflow; current-account conflict is actionable, contextual and not toast-only. |
| INV-ORDER-001 | N/A | Checkout does not change queue ranking/next-case semantics. |
| INV-RESP-001 | APPLIES | Integrated checkout/conflict controls exercised at contracted desktop and mobile widths. |
| INV-EVID-001 | APPLIES | Each claim maps to exact executing-D1/API/browser command; no claim from mocks alone. |
| INV-LEGACY-001 | N/A | No legacy case is synthesized or backfilled. |
| INV-MONEY-001 | APPLIES | Integer cents, D11 ledger truth, exact conflict snapshots, race and rollback proof. |
| INV-STATE-001 | APPLIES | Immutable Artifact A + orchestration-only Boundary B + fresh Independent Critic. |
| INV-CF-I07-001 | N/A | No protected admin/network/audit authorization route changes. |
| INV-CF-I07-002 | N/A | No admin no-op mutation. |
| INV-CF-I07-003 | N/A | No membership/plan downgrade flow. |
| INV-CF-I07-004 | APPLIES | Integrated Worker/Vite/browser runner verifies owned-process cleanup before PASS. |
| INV-CF-I08-001 | N/A | No report or analytics arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No reporting date/state query. |
| INV-CF-I08-004 | N/A | No new booking/room state enum. |
| INV-CF-I08-005 | N/A | No report clock/default-date or cross-surface date behavior. |
| INV-SCOPE-001 | APPLIES | F0.7 only; no Blocks A–H, unrelated billing/UX, real data or promotion. |

## Validation, gates, and rollback

Required: exact-cent domain tests; executing-D1 checkout/account tests; checkout RBAC/tenant/API evidence; payment and charge interleavings in both serial orders and controlled contention; two-checkout race; VOIDED/mismatch/partial/paid/credit/no-invoice cases; injected late event failure; response-loss recovery; local Worker/D1/browser conflict and success; `npm run check`; types; web build and budgets if UI changes; architecture fitness; D1 query plans; clean Wrangler migration chain through any new forward migration; Wrangler API/Web/staging SPA dry-runs; sequential CF-I03–I06 regressions; `git diff --check`; invariant evidence; mandatory Pre-Critic Gate.

Rollback: a failed batch leaves booking, room/version, room-night claims, invoice, payments, charges and events unchanged. No raw-status repair. A completed checkout is corrected only through an explicit authorized lifecycle domain command; this contract does not invent such a command.

Development Gate: all accepted checkout policies are enforced against exact current account truth; successful settlement/handoff is atomic and auditable; stale/conflict outcomes are actionable and queryable; all relevant interleavings preserve D11; no contract contradiction remains. Independent finance/concurrency Critic is required. No Human Gate is currently indicated; if implementing reveals a genuine conflict between approved J-04 policy and the frozen F0.7 mutation-boundary contract, stop only that policy subproblem and document evidence rather than inventing semantics.

## Reviewer record

Pasteur — read-only Contract/DB review, GPT-6 Luna Medium, confirmed the current policy sources define `settled` vs authorized `pending-approved`; found no `ROADMAP_BLOCKER` or product-policy ambiguity. Runtime lacks settlement truth checks and account interleaving tests; recommendations are represented in this contract. This internal review is not Independent Critic acceptance.
