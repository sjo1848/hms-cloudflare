# 02C — No-show

Status: `BINDING DEFINITION`

## Meaning

`NO_SHOW` is not cancellation. In v1 it means the arrival date has **passed**, the reservation remained confirmed, and the guest never occupied the room.

## Preconditions

- booking status is `CONFIRMED`;
- authoritative `hotel_local_date > check_in`;
- guest has not checked in;
- actor has booking/lifecycle write capability;
- booking state has not changed concurrently.

The full calendar arrival date remains available for normal check-in/cancellation semantics. A configurable same-day cutoff is deferred product policy.

## Authoritative mutation

A no-show operation must atomically:

1. transition booking `CONFIRMED -> NO_SHOW`;
2. release reservation inventory claims;
3. leave physical room state unchanged because no occupancy occurred;
4. record exactly one truthful lifecycle/audit event with actor, hotel, booking, operational date and prior assigned room;
5. remove the booking from active arrival work after authoritative reload.

## Financial boundary

Penalty, retained deposit, first-night charge, refund or other money disposition is deferred. No-show does not invent an automatic financial mutation. Existing payments/invoice context remains auditable for later Billing follow-up.

## UI flow

When a confirmed arrival is overdue (`hotel_local_date > check_in`), Reception may offer `Mark no-show`. The confirmation states that reservation inventory is released and that no-show is distinct from cancellation.

On the arrival date itself, normal check-in remains possible while `hotel_local_date < check_out`; no-show is not yet enabled under v1.

## Postconditions

- booking cannot be checked in without a separately authorized recovery/rebooking path;
- physical room state is unchanged;
- reservation inventory is released;
- Reception/availability counts revalidate immediately.

## Concurrency

If check-in or another booking transition wins first, no-show returns conflict and writes no success event/audit side effect.

## Acceptance

1. arrival date today -> no-show rejected;
2. day after arrival, still confirmed/never occupied -> no-show succeeds;
3. future arrival -> rejected;
4. checked-in booking -> rejected;
5. concurrent check-in wins -> no-show fails with zero state drift;
6. success releases inventory but preserves physical room state.