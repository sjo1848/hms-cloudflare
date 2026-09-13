# 03D — Hotel operational time

Status: `BINDING DEFINITION`

## Problem

Operational dates cannot be derived from Worker UTC or from the browser's local timezone. No-show eligibility, housekeeping board date, Reception priority, reassignment remaining nights and report defaults must agree on the hotel's calendar day.

## Rule

Every hotel has one authoritative IANA timezone, for example `America/Argentina/Mendoza` for the current Mendoza hotel.

Server-side domain operations derive `hotel_local_date` from that timezone. Client clocks may display information but do not decide lifecycle eligibility.

## Required uses

- no-show eligibility;
- `today` / overdue arrival and departure classification;
- housekeeping default board date;
- remaining-night range during in-stay reassignment;
- stay-extension date validation;
- operational read-model date;
- report/default range semantics where hotel-local day matters.

## Configuration

Timezone belongs to hotel configuration/control metadata and must be returned through trusted hotel/auth context or an equivalent server-owned configuration path.

Existing Mendoza staging/demo hotels may be explicitly seeded/backfilled as `America/Argentina/Mendoza`. New hotel registration must provide/derive a valid IANA timezone rather than inheriting the operator browser timezone.

## No-show v1 cutoff

Until a configurable no-show cutoff is separately approved, v1 is conservative: a booking may be marked `NO_SHOW` only when `hotel_local_date > check_in`.

Same-day arrival remains overdue/attention when appropriate but cannot be marked no-show merely because the clock passed midnight UTC or because an operator is in another timezone.

A configurable same-day cutoff is deferred product policy.