# 02C — No-show

Status: `BINDING DEFINITION`

## Meaning

`NO_SHOW` is not cancellation. It means the arrival date has been reached or passed, the reservation remained confirmed, and the guest did not occupy the room.

## Preconditions

- booking status is `CONFIRMED`;
- authoritative `hotel_local_date >= check_in`;
- guest has not checked in;
- actor has booking/lifecycle write capability;
- terminal reason satisfies the accepted source requirement;
- booking state has not changed concurrently.

This preserves accepted source semantics while replacing UTC/browser date authority with the hotel's operational date.

## Authoritative mutation

A no-show operation must atomically:

1. transition booking `CONFIRMED -> NO_SHOW`;
2. release reservation inventory claims;
3. leave physical room state unchanged because no occupancy occurred;
4. record exactly one truthful lifecycle/audit event with actor, hotel, booking, operational date and prior assigned room;
5. remove the booking from active arrival work after authoritative reload.

## Cancellation relationship

Cancellation and no-show remain distinct terminal choices from `CONFIRMED`. This definition does not add a new calendar cutoff to cancellation because the accepted source does not impose one. Operator intent/evidence distinguishes cancellation from no-show.

## Financial boundary

Penalty, retained deposit, first-night charge, refund or other money disposition is deferred. No-show does not invent an automatic financial mutation. Existing payments/invoice context remains auditable for later Billing follow-up.

## UI flow

From the arrival date onward, Reception may offer `Mark no-show` for an eligible confirmed booking. Confirmation states that reservation inventory is released and that no-show is distinct from cancellation.

## Postconditions

- booking cannot be checked in without a separately authorized recovery/rebooking path;
- physical room state is unchanged;
- reservation inventory is released;
- Reception/availability counts revalidate immediately.

## Concurrency

If check-in or another booking transition wins first, no-show returns conflict and writes no success event/audit side effect.

## Acceptance

1. arrival date today -> no-show can succeed when still confirmed and never occupied;
2. overdue confirmed arrival -> no-show can succeed;
3. future arrival -> rejected;
4. checked-in booking -> rejected;
5. concurrent check-in wins -> no-show fails with zero state drift;
6. success releases inventory but preserves physical room state.