# 14 — Billing consistency

Status: `BINDING TECHNICAL/ACCOUNTING INVARIANT`; unsupported extension pricing remains governed by `HG-FIN-001`.

## Booking total and invoice

When an invoice exists for a booking, any successful operation that increases authoritative booking total must reconcile invoice amount in the same logical operation.

If new amount exceeds `paid_amount_cents`:

- invoice status is `PENDING`;
- prior payment entries remain immutable;
- a previously final `paid_at` no longer represents current settlement and must not be presented as fully settled.

A `PAID` invoice cannot remain `PAID` with `paid_amount_cents < amount_cents`.

## Extra charges

Current target behavior updates invoices only when invoice status is already `PENDING`. This can leave a paid invoice stale if a later charge is added. Future Billing hardening must reconcile/reopen the invoice or reject the total-increasing operation atomically; the invariant is that stale paid state is forbidden.

## Checkout source parity

Checkout must read authoritative Billing state in the same decision window as checkout policy validation. UI checkbox/text alone is not evidence of settlement.

Accepted source semantics are binding:

- `settled` requires the account to be fully paid;
- `pending-approved` is the governed positive-balance exception;
- the existing operational reference and override capability requirements apply.

This is not a new commercial-policy choice.

## No-show / cancellation

Operational state changes do not delete payment entries and do not manufacture refunds or penalties. Financial follow-up remains visible and auditable unless a later policy explicitly authorizes automatic disposition.

## Audit

Money-affecting mutations must meet `INV-MONEY-001`: no success without business mutation + audit/event, no audit-only false success, and idempotency/retry safety where relevant.