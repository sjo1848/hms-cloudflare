# 14 — Billing consistency

Status: `BINDING TECHNICAL/ACCOUNTING + SOURCE-PARITY INVARIANT`.

## Booking total and invoice

When an invoice exists for a booking, any successful operation that changes authoritative booking total must reconcile invoice amount/status in the same logical operation.

If authoritative amount exceeds `paid_amount_cents`:

- invoice status is `PENDING`;
- prior payment entries remain immutable;
- prior `paid_at` must not continue to represent current full settlement.

A `PAID` invoice cannot remain `PAID` with `paid_amount_cents < amount_cents`.

## Source-parity booking repricing

Accepted source booking updates recalculate accommodation using total stay nights × current selected room price, then add extra charges. Therefore active-stay extension and in-stay reassignment in this wave preserve that pricing behavior and must reconcile the invoice to the resulting total.

A future contracted/frozen-rate model is a deliberate product departure, not an implementation default.

## Extra charges

Current target behavior updates invoices only when invoice status is already `PENDING`. This can leave a paid invoice stale if a later charge is added. Billing hardening must reconcile/reopen the invoice or reject the total-increasing operation atomically; stale paid state is forbidden.

## Checkout source parity

Checkout reads authoritative Billing state in the same decision window as checkout policy validation. UI checkbox/text alone is not evidence of settlement.

Accepted source semantics are binding:

- `settled` requires the account to be fully paid;
- `pending-approved` is the governed positive-balance exception;
- existing operational reference and override capability requirements apply.

## No-show / cancellation

Operational state changes do not delete payment entries and do not manufacture refunds or penalties. Financial follow-up remains visible and auditable unless a later policy explicitly authorizes automatic disposition.

## Audit and concurrency

Money-affecting mutations must meet `INV-MONEY-001`: no success without business mutation + truthful audit/event, no audit-only false success, exact rollback on stale/conflict paths, and idempotency/retry safety where relevant.