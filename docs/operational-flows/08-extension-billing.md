# 08 — Stay extension and Billing consistency

Status: `BINDING DEFINITION`

## Price delta

V1 extension preserves the accommodation value already booked and adds:

`extension_delta_cents = current_room_price_cents * added_nights`.

Existing nights are not silently repriced. Discounts, upgrade/downgrade adjustments and negotiated rates are separate explicit Billing policy.

## Atomic financial consistency

The extension operation changes booking total and inventory together. If an invoice already exists, its amount must be reconciled in the same logical operation.

Rules:

- no invoice: update booking total; invoice may be created later by normal Billing flow;
- `PENDING` invoice: increase `amount_cents` by the extension delta; preserve paid amount;
- `PAID` invoice: increase `amount_cents`, change status to `PENDING`, clear `paid_at`, preserve prior payment entries and paid amount;
- `VOIDED` invoice: extension is rejected pending explicit Billing recovery; do not silently resurrect a voided invoice.

The schema invariant `paid_amount_cents <= amount_cents` must remain true.

## Audit

A successful extension records:

- lifecycle event identifying old/new checkout and added nights;
- financial audit/event identifying `extension_delta_cents` when delta > 0.

Both represent the same winning business operation; a failed extension writes neither success event.

## Billing UI consequence

After extension, embedded Billing refreshes and shows the new total/remaining balance. A previously paid stay that gains an extension visibly becomes pending for the additional balance.

## Concurrency

If payment, invoice state, room inventory or booking state changes concurrently so that the expected extension cannot be proven, extension returns conflict and refreshes authoritative data instead of partially applying the change.