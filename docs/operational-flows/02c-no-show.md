# 02C — No-show

Status: `BINDING DEFINITION`

## Meaning

`NO_SHOW` is not cancellation. It means the arrival date was reached or passed, the reservation remained confirmed, and the guest did not occupy the room.

## Preconditions

- booking status is `CONFIRMED`;
- current hotel-local date is on or after `check_in`;
- guest has not checked in;
- actor has booking/lifecycle write capability;
- booking state has not changed concurrently.

## Authoritative mutation

A no-show operation must:

1. transition booking `CONFIRMED -> NO_SHOW`;
2. release all remaining inventory claims for that reservation;
3. leave physical room state unchanged because no occupancy occurred;
4. record exactly one lifecycle/audit event with actor, hotel, booking and previous assigned room;
5. remove the booking from arrival/attention work after the transition.

## Financial policy

Financial penalty, retained deposit or first-night charge is explicitly `DEFERRED`. The operational no-show transition must not invent a charge policy. A later billing contract may attach financial consequences without redefining the booking state transition.

## UI flow

For an overdue confirmed arrival, Reception offers three explicit paths when applicable:

- complete check-in;
- mark no-show;
- cancel reservation only if cancellation is still an accepted business action.

`Mark no-show` requires a confirmation that explains that the reservation inventory will be released and that the action is distinct from cancellation.

## Postconditions

- booking cannot be checked in without a separate explicit recovery/rebooking path;
- room does not become dirty;
- future inventory previously claimed by the reservation is released;
- queue counts and room availability revalidate immediately.

## Concurrency

If the guest checks in or the reservation changes before no-show wins the transition, no-show returns conflict and produces no audit/event side effect.

## Acceptance scenarios

1. arrival date today: confirmed booking can become no-show;
2. overdue confirmed arrival: can become no-show;
3. future arrival: no-show rejected;
4. checked-in booking: no-show rejected;
5. concurrent check-in wins: no-show fails with zero state drift;
6. no-show releases inventory but preserves room physical state.