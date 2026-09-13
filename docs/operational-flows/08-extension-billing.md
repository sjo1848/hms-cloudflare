# 08 — Stay extension and Billing consistency

Status: `BINDING DEFINITION / SOURCE-PARITY PRICING`.

## Preconditions

A stay extension is allowed only while the booking is `CHECKED_IN`, the requested checkout is later than current checkout, and every added night is available for the current room under authoritative inventory/hold/maintenance rules.

Shortening an active stay is checkout, not extension.

## Atomic mutation

The extension command must atomically:

1. validate the booking is still `CHECKED_IN` and room relation is unchanged;
2. validate/claim every added inventory night in `[old_check_out, new_check_out)`;
3. update `bookings.check_out`;
4. recalculate the booking total using accepted source pricing semantics;
5. reconcile any existing invoice to that authoritative total;
6. persist lifecycle/financial audit only if the same operation wins.

Any conflict returns failure with zero partial mutation.

## Accepted pricing semantics

The accepted source allows date edits and recalculates accommodation using the room's **current** `price_cents` across the full stay duration, then adds existing extra charges:

`authoritative_total = total_stay_nights × current_room_price_cents + extra_charges_total`

V1 preserves this behavior. It must not derive a rate as `prior total / nights`, because extra charges make that invalid.

This source behavior can reprice the accommodation portion of earlier nights if room price changed. That is a known commercial characteristic of the accepted baseline. Replacing it with a contracted-rate snapshot is a future explicit product decision, not an implementation default.

## Invoice consistency

Once authoritative total is recalculated:

- no invoice: booking total updates; invoice may be created by normal Billing flow;
- existing invoice: `amount_cents` must match authoritative booking total;
- if `paid_amount_cents < amount_cents`, invoice cannot remain `PAID`; it becomes `PENDING` and settlement metadata must no longer claim full settlement;
- prior payment entries remain immutable;
- `VOIDED` handling must fail closed unless an existing authorized recovery rule can preserve truth.

Invariant: `0 <= paid_amount_cents <= amount_cents`.

## UI consequence

Before confirmation Reception shows new checkout, added nights, current room price, recalculated accommodation/booking total and resulting remaining balance. This disclosure is material because the source-parity recalculation may affect the accommodation value of the whole stay.

After success, embedded Billing reloads authoritative data.

## Concurrency evidence

Tests cover added-night inventory loss, room price change, concurrent payment/invoice change, stale booking-room relation, replay, and exact rollback of booking/inventory/invoice/events on failure.