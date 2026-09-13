# 03D — Hotel operational time

Status: `BINDING DEFINITION`

## Problem

Operational dates cannot be derived from Worker UTC or from the browser's local timezone. No-show eligibility, housekeeping board date, Reception classification, reassignment remaining nights and report defaults must agree on the hotel's calendar day.

## Rule

Every hotel has one authoritative IANA timezone, for example `America/Argentina/Mendoza` for the current Mendoza hotel.

Server-side domain operations derive `hotel_local_date` from that timezone. Client clocks may display information but do not decide date-sensitive lifecycle eligibility.

## Required uses

- no-show eligibility;
- `today` / overdue arrival and departure classification;
- housekeeping default board date;
- remaining-night range during in-stay reassignment;
- stay-extension date validation;
- operational read-model date;
- report/default range semantics where hotel-local day matters.

This timezone foundation does **not** introduce calendar restrictions absent from the accepted source. In particular, the current definition does not add a new arrival-date gate to formal check-in or cancellation.

## Configuration

Timezone belongs to hotel configuration/control metadata and must be returned through trusted hotel/auth context or an equivalent server-owned configuration path.

Existing Mendoza staging/demo hotels may be explicitly seeded/backfilled as `America/Argentina/Mendoza`. New hotel registration must provide/derive a valid IANA timezone rather than inheriting the operator browser timezone.

## No-show parity

Preserve accepted source behavior: a confirmed booking may be marked `NO_SHOW` from its arrival date, expressed with the correct hotel calendar as:

`hotel_local_date >= check_in`.

A future booking (`hotel_local_date < check_in`) cannot be marked no-show.

A different same-day cutoff policy would be a future product decision, not an implementation detail.