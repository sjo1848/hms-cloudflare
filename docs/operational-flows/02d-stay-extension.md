# 02D — Stay extension

Status: `BINDING DEFINITION / SOURCE-PARITY PRICING`.

A checked-in guest may extend the stay to a later checkout date. This is an explicit lifecycle operation because it changes active occupancy, future inventory and Billing.

## Preconditions

- booking is `CHECKED_IN`;
- new checkout is later than current checkout;
- same room is intended;
- every added night is free of booking claims, holds and blocking maintenance;
- actor is authorized;
- booking/inventory/Billing state have not changed concurrently.

## Mutation

One logical atomic operation must validate `[old_check_out, new_check_out)`, claim every added night, update `check_out`, recalculate the authoritative booking total using accepted source pricing semantics, reconcile any existing invoice, preserve booking `CHECKED_IN` and room `OCCUPIED`, and record truthful lifecycle/financial evidence.

Partial extension is forbidden. Failed inventory, booking, price or Billing correlation leaves all involved state unchanged.

## Pricing parity

Accepted source behavior permits booking date edits and recalculates accommodation as:

`total stay nights × current room price_cents`

then adds existing extra charges.

V1 extension preserves that observable behavior. This means extending an active stay can reprice the accommodation portion of the whole stay if the room price changed since the original reservation.

A future change to a frozen contracted-rate snapshot is a product/commercial decision and requires explicit authorization; it is not the default implementation path.

## Other boundaries

- Earlier departure is checkout, not date editing.
- Extension does not automatically move the guest.
- Extension does not silently split a stay across rooms.
- If the same room is unavailable for any added night, reject without mutation.
- Combined `extend + planned relocation` is deferred.

## UI

`Extend stay -> choose new checkout -> validate added nights -> show recalculated accommodation total + extra charges + resulting balance -> confirm -> authoritative reload`.

Because accepted pricing may reprice the whole accommodation portion, the confirmation must make the resulting total visible before the operator commits.

## Acceptance

1. one-night and multi-night extensions succeed only when every added night is valid;
2. any booking/hold/blocking-maintenance conflict rejects the whole extension;
3. source-parity total uses new total nights × current room price plus extra charges;
4. existing invoice is reconciled atomically to the new authoritative total;
5. replay cannot duplicate inventory/event/financial effects;
6. non-checked-in bookings cannot use the dedicated extension command;
7. concurrent invoice/payment/price change cannot produce partial success.