# 08 — Stay extension and Billing consistency

Status: `BINDING EXCEPT PRICE POLICY`.

## Preconditions

A stay extension is allowed only while the booking is `CHECKED_IN`, the requested checkout is later than the current checkout, and every added night is available for the current room under the authoritative hotel-local operational date and inventory rules.

Shortening an active stay is not an extension; it is handled through checkout semantics.

## Inventory mutation

The extension command must atomically:

1. validate the booking is still `CHECKED_IN`;
2. validate the current room relation has not changed;
3. claim each added inventory night in `[old_check_out, new_check_out)`;
4. update `bookings.check_out`;
5. update accommodation/booking total according to the approved extension price policy;
6. reconcile any existing invoice;
7. persist lifecycle and financial audit only if the same operation wins.

A conflict on any added night returns conflict with zero partial mutation.

## Price policy — HUMAN GATE

The existing target and accepted source model do not persist a reliable contracted nightly-rate snapshot that can be separated from later extra charges. Therefore BUILD must not invent extension pricing.

`HG-FIN-001` must choose one policy before this increment is implemented:

- preserve the original contracted accommodation nightly rate by adding an explicit rate/accommodation snapshot to the stay;
- charge the room's current price at extension time;
- require an operator-entered extension rate/amount with appropriate authorization.

Recommended product direction: persist an explicit contracted accommodation-rate snapshot and preserve that rate for ordinary extensions. This is a recommendation, not authorization.

## Invoice consistency

Once the extension delta is known by the approved pricing policy, booking and invoice state must stay consistent in one logical operation.

Rules:

- no invoice: update booking total; invoice may be created later by normal Billing flow;
- `PENDING` invoice: increase `amount_cents` by the approved extension delta and preserve `paid_amount_cents`;
- `PAID` invoice: increase `amount_cents`; if the new amount exceeds `paid_amount_cents`, status becomes `PENDING` and `paid_at` is cleared while prior payment entries remain immutable;
- `VOIDED` invoice: reject the extension pending an explicit Billing recovery rule; never silently resurrect a voided invoice.

The invariant `0 <= paid_amount_cents <= amount_cents` must always hold.

## Audit

A successful extension records the old/new checkout, added nights and approved financial delta. Failed/stale/conflicted operations write no success lifecycle or financial event.

## UI consequence

Reception must show the requested new checkout, added nights, availability result, approved price delta and resulting balance before confirmation. After success, embedded Billing reloads from authoritative data.

## Concurrency evidence

Tests must cover inventory loss, concurrent payment/invoice change, stale booking-room relation, repeated request, and exact rollback of booking/inventory/invoice/events on failure.