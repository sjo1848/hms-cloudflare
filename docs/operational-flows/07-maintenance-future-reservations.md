# 07 — Maintenance and future reservations

Status: `BINDING DEFINITION`

## New sales

An open `BLOCKING` maintenance case blocks new advance reservations for that room, including while a current guest still occupies it.

An open `NON_BLOCKING` case does not by itself block advance sale; normal holds, booking inventory and physical-state policy still apply.

## Existing future reservations

Opening a blocking case does **not** silently cancel or auto-reassign an already confirmed future reservation.

Instead, each overlapping future confirmed reservation becomes an operational attention case until one of these occurs:

1. maintenance is resolved early enough and the room returns to a valid readiness path;
2. Reception explicitly moves the future confirmed booking using the normal pre-occupancy booking-edit/reassignment path;
3. the booking later ends through its normal cancellation/no-show lifecycle.

## Front-desk read model consequence

A future booking must expose a known blocking maintenance condition before arrival day. Current occupancy must not hide a blocker for a later arrival.

Minimum derived context:

- open maintenance case id;
- impact;
- current room physical state;
- affected booking/stay interval;
- recommended action: monitor resolution or explicitly reassign the future booking.

## No automatic guest move

The system never auto-reassigns a current or future booking because of maintenance. It may suggest valid alternatives, but human confirmation remains required.

## Acceptance

- new booking search excludes rooms with an open blocking case;
- an existing confirmed future booking remains intact but is flagged;
- resolving maintenance clears the blocker after authoritative revalidation;
- explicit future-booking reassignment clears the affected booking without altering another current occupied stay;
- non-blocking advisory does not falsely remove sellable inventory;
- cross-tenant identifiers cannot influence blocker evaluation.