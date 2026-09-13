# 07 — Maintenance and future reservations

Status: `BINDING DEFINITION`

## New sales

An open `RELOCATION_REQUIRED` maintenance case blocks new advance reservations for that room, even while the current guest still occupies it.

An open `NON_BLOCKING` case does not by itself block advance sale; normal holds/inventory/status rules still apply.

## Existing future reservations

Opening a relocation-required case does **not** silently cancel or reassign an already confirmed future reservation.

Instead, any overlapping future confirmed reservation becomes an operational attention case until one of these occurs:

1. maintenance is resolved early enough and the room returns to a valid readiness path;
2. Reception explicitly reassigns the future confirmed booking using the existing confirmed-booking edit/reassignment capability;
3. the future booking is cancelled/no-show according to normal lifecycle rules.

## Front-desk read model consequence

The future booking must expose a maintenance blocker so staff sees it before arrival day. A room being occupied today must not hide a known blocker for tomorrow's arrival.

Minimum derived context:

- open maintenance case id;
- impact;
- current room state;
- whether the case overlaps the booking's operational readiness;
- recommended action: monitor/resolve or reassign confirmed booking.

## No automatic guest move

The system never auto-reassigns a future booking because of maintenance. It may suggest valid rooms, but human confirmation remains required.

## Acceptance

- new booking search excludes relocation-required room;
- existing confirmed future booking remains intact but flagged;
- resolving maintenance clears blocker after revalidation;
- explicit future-booking reassignment clears blocker without modifying the current occupied stay;
- cross-tenant IDs cannot influence the blocker.