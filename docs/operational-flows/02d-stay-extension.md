# 02D — Stay extension

Status: `BINDING DEFINITION`

A checked-in guest may extend the stay to a later checkout date. This is a lifecycle operation because it changes active occupancy and future inventory.

## Preconditions

- booking is `CHECKED_IN`;
- new checkout is later than current checkout;
- same room is intended;
- every added night is free of booking claims and holds;
- actor is authorized;
- booking/inventory have not changed concurrently.

## Mutation

One atomic logical operation must validate `[old_check_out, new_check_out)`, claim all added nights, update `check_out`, recalculate the accommodation total with existing HMS rate semantics, preserve booking `CHECKED_IN` and room `OCCUPIED`, and record one extension event with old/new checkout dates.

Partial extension is forbidden.

## Boundaries

- Earlier departure is checkout, not date editing.
- Extension does not automatically move the guest.
- Extension does not silently split a stay across rooms.
- New commercial/discount rules are outside this flow.

If the same room is unavailable, the operation fails without mutation. The UI may then search alternative rooms for the added period. A combined `extend + planned relocation` workflow is deferred.

## UI

`Extend stay -> select new checkout -> validate added nights -> show added nights and updated total -> confirm -> refresh current case`.

## Acceptance

1. one-night and multi-night extensions succeed when fully available;
2. any booking or hold conflict rejects the whole extension;
3. replay cannot duplicate inventory/event effects;
4. non-checked-in bookings cannot use extension;
5. Billing and availability reflect the confirmed new checkout.