# 14 — Billing consistency

Status: `BINDING TECHNICAL/ACCOUNTING INVARIANT`; commercial choices in `13-financial-policy-gates.md` remain Human Gates.

## Booking total and invoice

When an invoice exists for a booking, any successful operation that increases authoritative booking total must reconcile invoice amount in the same logical operation.

If new amount exceeds `paid_amount_cents`:

- invoice status is `PENDING`;
- prior payment entries remain immutable;
- a previously final `paid_at` no longer represents current settlement and must not be presented as fully settled.

A `PAID` invoice cannot remain `PAID` with `paid_amount_cents < amount_cents`.

## Extra charges

Current behavior updates invoices only when invoice status is already `PENDING`. This leaves a paid invoice stale if a later charge is added. Future Billing hardening must reopen/reconcile the invoice or reject the charge; preferred invariant is reconcile and reopen unless a later Human Gate chooses stricter workflow.

## Checkout consistency

Checkout must read authoritative Billing state in the same decision window as checkout policy validation. UI checkbox/text alone is not evidence of settled balance.

The exact commercial enforcement of `settled` is HG-FIN-002, but regardless of that choice the UI must display authoritative total, paid and remaining amount for the active Reception booking.

## No-show / cancellation

Operational state changes do not delete payment entries. They do not manufacture refunds or penalties. Financial follow-up remains visible and auditable.

## Audit

Money-affecting mutations must meet `INV-MONEY-001`: no success without business mutation + audit/event, no audit-only false success, idempotency/retry safety where relevant.