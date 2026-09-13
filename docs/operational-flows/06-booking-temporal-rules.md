# 06 — Booking temporal rules

Status: `BINDING DEFINITION`

All rules use authoritative `hotel_local_date`.

## Check-in eligibility

Normal check-in is allowed only when:

- booking is `CONFIRMED`;
- `check_in <= hotel_local_date < check_out`;
- assigned room is immediately `READY` / physically `AVAILABLE`;
- normal lifecycle guards still pass.

A future booking (`hotel_local_date < check_in`) cannot check in through the normal flow. Early-arrival-before-date override is deferred product policy.

A confirmed booking with `hotel_local_date >= check_out` cannot check in. It must be resolved as no-show or another separately authorized recovery path.

## Cancellation versus no-show

V1 rule:

- cancellation is allowed while `hotel_local_date <= check_in` and booking remains `CONFIRMED`;
- once `hotel_local_date > check_in`, an unoccupied confirmed booking is resolved as `NO_SHOW`, not late cancellation.

This preserves the operational distinction between a cancellation communicated by/for the guest and a missed arrival.

Admin correction/reversal of an incorrectly recorded no-show is deferred; BUILD must not invent status rollback.

## Stay overrun

If a booking is `CHECKED_IN` and `hotel_local_date >= check_out`, the stay is an overdue departure/overrun and remains an attention case.

The operator has two normal paths:

- checkout now; or
- extend the stay to a later checkout date if availability permits.

Reassignment of an overrun stay requires first establishing a valid future checkout through extension; otherwise there is no authoritative remaining inventory interval to move.

## Queue consequence

Reception ranking must distinguish:

- future arrival;
- arrival due today;
- overdue confirmed arrival;
- checked-in departure due today;
- checked-in overdue departure/overrun.

Temporal classification is server-derived once the front-desk read model exists.