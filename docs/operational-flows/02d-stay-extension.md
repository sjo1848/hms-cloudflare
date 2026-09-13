# 02D — Stay extension

Status: `BINDING EXCEPT PRICE POLICY`.

A checked-in guest may extend the stay to a later checkout date. This is an explicit lifecycle operation because it changes active occupancy, future inventory and potentially Billing.

## Preconditions

- booking is `CHECKED_IN`;
- new checkout is later than current checkout;
- same room is intended;
- every added night is free of booking claims, holds and blocking maintenance;
- actor is authorized;
- booking/inventory have not changed concurrently.

## Mutation

One logical atomic operation must validate `[old_check_out, new_check_out)`, claim every added night, update `check_out`, apply the approved `HG-FIN-001` accommodation-price delta, reconcile any existing invoice, preserve booking `CHECKED_IN` and room `OCCUPIED`, and record truthful lifecycle/financial evidence.

Partial extension is forbidden. Failed inventory, booking or Billing correlation leaves all involved state unchanged.

## Price boundary

The current authoritative model does not contain a trustworthy contracted nightly-rate snapshot independent from extra charges. BUILD therefore cannot infer extension price from `total_cents / nights` or silently choose current room price.

`HG-FIN-001` must be resolved before implementing this command. See `08-extension-billing.md` and `13-financial-policy-gates.md`.

## Other boundaries

- Earlier departure is checkout, not date editing.
- Extension does not automatically move the guest.
- Extension does not silently split a stay across rooms.
- If the same room is unavailable, reject without mutation.
- Combined `extend + planned relocation` is deferred.

## UI

`Extend stay -> choose new checkout -> validate added nights -> show added nights + approved price delta + resulting balance -> confirm -> authoritative reload`.

## Acceptance

1. one-night and multi-night extensions succeed only when every added night is valid;
2. any booking/hold/blocking-maintenance conflict rejects the whole extension;
3. replay cannot duplicate inventory/event/financial effects;
4. non-checked-in bookings cannot use extension;
5. booking, invoice, payments and availability remain consistent after success;
6. concurrent invoice/payment change cannot produce partial success.