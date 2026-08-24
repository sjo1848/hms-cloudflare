# TASK CONTRACT — CF-I06

TASK ID: `CF-I06`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME ORCHESTRATOR / FINANCIAL WAVE`  
STATUS: `READY / AUTHORIZED`

## OBJECTIVE

Migrate the accepted HMS Billing capability to the Cloudflare target while preserving exact monetary semantics, financial atomicity, tenant isolation, backend authorization, audit/request traceability, booking/invoice/payment consistency and the accepted booking-case financial workflow.

This is a high-risk financial boundary. Speed is allowed through one coherent implementation wave, but money/invoice/payment/cash-closure invariants may not be weakened or deferred behind UI assumptions.

## CANONICAL INPUTS

- `AGENTS.md`, `.orchestration/STATE.md`, `.orchestration/STATUS.json`.
- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Source inventory: `docs/source-contract-inventory.md`.
- Source financial services: `backend/src/application/billing_service.rs`, `cash_closure_service.rs`, `booking_transaction_service.rs`, source billing/cash-shift repository implementations and financial tests including `cash_shift_handoff.rs` and `booking_transactional_integrity.rs`.
- Source booking/reception UI and billing-visible booking case surfaces.
- Accepted target foundation through CF-I05 PASS artifact `17372d3200b8e88eec116e97672c12589005103d`.
- Binding decisions and `.orchestration/INVARIANTS.md` + `.orchestration/PRECRITIC-GATE.md`.

## APPLICABLE LEARNED INVARIANTS

Mandatory unless explicitly justified N/A:

- `INV-MONEY-001` — integer cents; exact arithmetic; financial multi-write atomicity.
- `INV-ATOMIC-001` — stale/zero-row/ABA financial mutation cannot report success.
- `INV-AUDIT-001` — financial audit/event side effects exactly once on success, zero on rejected/stale operation.
- `INV-DOMAIN-001` — payments/settlement/closures are explicit domain operations, not generic CRUD.
- `INV-TENANT-001` — booking/invoice/payment/closure data remains hotel-local at authoritative D1 boundary.
- `INV-RBAC-001` — backend financial capabilities authoritative.
- `INV-PARITY-001` — source financial semantics preserved before target convenience.
- `INV-ENUM-001` — payment/invoice/status/method decisions operate on semantic values across representation changes.
- `INV-ORDER-001` — closure/payment/history ordering and next/summary selection preserve source semantics when material.
- `INV-UX-001` — infrastructure migration cannot silently redesign billing workflow.
- `INV-RESP-001` — material financial actions executable at contracted responsive widths where surfaced.
- `INV-EVID-001` — money/atomicity claims backed by executable proof.
- `INV-STATE-001` — publish as substantive artifact A + orchestration-only boundary B.
- `INV-SCOPE-001` — do not absorb CF-I07+ security/admin/report/migration scope.

## SCOPE

### D1 / Domain / API

Implement source-equivalent financial data and operations inside the authorized hotel D1:

1. **Extra charges**
   - `GET /api/v1/bookings/{id}/extra-charges`
   - `POST /api/v1/bookings/{id}/extra-charges`
   - booking must exist in current hotel;
   - description/category validation follows source contract;
   - `amount_cents` integer and valid;
   - adding charge and updating booking total are one atomic business operation in target D1; no compensation-only design when target can guarantee transaction/batch atomicity.

2. **Invoice**
   - `GET /api/v1/invoices`
   - `GET /api/v1/bookings/{id}/invoice`
   - one booking financial invoice identity as source requires;
   - invoice amount/paid/outstanding/status remain exact integer cents;
   - invoice creation/update cannot diverge from booking/payment state.

3. **Payments**
   - `GET /api/v1/bookings/{id}/payments`
   - `POST /api/v1/bookings/{id}/payments`
   - `POST /api/v1/bookings/{id}/settle-payment`
   - amount must be > 0;
   - cannot exceed current remaining invoice balance;
   - payment entry + invoice paid amount/status/method/reference/paid_at commit atomically;
   - full settlement pays exactly the remaining balance;
   - duplicate/stale concurrent payment attempts cannot overpay or create unmatched entries;
   - received actor/reference/note/time retained per source.

4. **Balance / Cash closure**
   - `GET /api/v1/billing/balance`
   - `GET /api/v1/billing/closures`
   - `POST /api/v1/billing/close-cash`
   - balance summarizes unclosed payments from current shift opening plus outstanding invoice totals/count;
   - total/cash/card/payment_count exact;
   - close-cash supports expected cash guard, counted cash, difference, handoff target and notes;
   - negative counted cash rejected;
   - empty handoff rejected;
   - stale expected cash / concurrent close must fail closed with no duplicate closure;
   - closure identity defines the next shift boundary consistently.

5. **Money representation**
   - all business money stored/calculated as INTEGER cents;
   - no float/REAL business representation or JS floating arithmetic for authoritative values;
   - formatting to currency is presentation-only.

### RBAC / Tenant

Preserve source capability intent for:

- `bookings.extra_charges.read`
- `bookings.extra_charges.write`
- `billing.balance.read`
- `billing.close_cash.write`
- `billing.invoices.read`
- `billing.invoice.read`
- booking update capability for payment/settlement where source contract uses it.

Unknown/forbidden role fails closed. Cross-tenant booking/invoice/payment/closure IDs cannot leak existence, mutate balances, create payment entries or alter another hotel’s closure state.

### UX / Browser

Preserve the accepted financial workflow embedded in the booking/reception case and operational billing surfaces:

- selected booking shows charges, invoice/amount paid/outstanding and payment history/context;
- operator can add extra charge and register/settle payment with source-equivalent required fields/validation;
- financial state refreshes after successful mutation and exposes typed failures without silently losing entered data where source preserves it;
- cash balance and close-cash workflow exposes expected vs counted cash, difference, handoff and notes as material operational information;
- no silent redesign of the booking-case workflow merely because the target is React/Workers/D1;
- responsive material financial actions must be proven at widths used by the active booking/reception surfaces; at minimum 375/390/430/768/1024 if the source financial action is reachable there.

## SOURCE PARITY / ACCEPTANCE MATRIX

| Capability | Source semantic | Target acceptance | Required evidence |
|---|---|---|---|
| Extra charge | charge + booking total remain consistent | one atomic operation; exact cents | D1/API + failure rollback |
| Invoice | exact amount, paid amount, pending/paid state | no duplicate/divergent invoice state | D1/API |
| Partial payment | >0 and <= remaining | payment entry + invoice atomic; exact remaining | deterministic API/D1 |
| Full settlement | pay exactly current remaining | no overpay, fully paid state exact | deterministic API/D1 |
| Concurrent payment | stale balance cannot overpay | one valid result; loser fails; no orphan entry | race regression |
| Payment metadata | method/reference/note/actor/time | source-equivalent durable fields | D1 assertions |
| Balance | unclosed total/cash/card/count + outstanding | exact shift/opening semantics | API/D1 |
| Cash close | expected guard + counted/difference/handoff | stale/concurrent close rejected; single closure | race regression |
| Tenant | all financial objects hotel-local | cross-tenant IDs fail closed | security regression |
| RBAC | backend capability authoritative | allow/deny matrix | API regression |
| UX | booking financial case + close cash usable | source workflow/material information preserved | browser |
| Money | integer cents | no authoritative float | schema/static + runtime |

## REQUIRED ADVERSARIAL TESTS

At minimum:

- amount 0 and negative payment rejection;
- payment > remaining rejection with zero payment row and unchanged invoice;
- exact-cent partial payment sequence and full settlement;
- deterministic concurrent payment against same remaining balance proving no overpay/double-entry;
- duplicate/full-settlement retry after paid invoice rejected;
- extra-charge partial-failure/zero-row path proves booking total and charge cannot diverge;
- cross-tenant booking/payment/invoice/closure attempts leave zero target changes;
- forbidden/unknown-role financial access denied at backend;
- stale `expected_cash_amount_cents` close rejected;
- deterministic concurrent close produces one closure only;
- counted cash difference exact for positive/negative difference while counted amount itself cannot be negative;
- cash/card method totals exact;
- semantic enum tests for invoice/payment method/status representation;
- browser validation/success/error at contracted widths;
- full inherited regressions CF-I03/04/05.

## EVIDENCE / PRE-CRITIC

Before publication:

- create `.orchestration/evidence/CF-I06-INVARIANTS.md`;
- create `.orchestration/evidence/CF-I06-PRECRITIC-GATE.md`;
- map each money claim to exact executable D1/API/browser evidence;
- run `npm run check`, types, web build, CF-I03/04/05 inherited regressions, CF-I06 financial regression, browser regression, Wrangler dry-runs, diff check;
- no applicable invariant may remain FAIL/UNPROVEN.

Publication must use corrected `INV-STATE-001`:

1. commit **A** = substantive CF-I06 artifact (code/schema/tests/evidence);
2. commit **B** = orchestration/evidence-only publication boundary pointing exactly to A, `external_review.required=true`, `resume_authorized=false`;
3. stop for Independent Critic.

## FORBIDDEN ACTIONS

- CF-I07 Users/RBAC administration or hotel/network administration.
- CF-I08 analytics/reports/integrated product completion.
- CF-I09 migration/cutover/readiness actions.
- production deployment, remote D1 mutation, real hotel data, paid Cloudflare transition or cutover.
- floats/REAL for authoritative financial amounts.
- self-PASS or skipping external Independent Critic.

## DONE WHEN

A coherent CF-I06 financial artifact satisfies exact-cent and atomicity guarantees, source financial workflow parity, backend RBAC/tenant isolation, deterministic concurrency/closure regressions, browser evidence, full inherited regression and the mandatory invariant/Pre-Critic gates; then A+B publication occurs and Codex stops at Independent Critic.