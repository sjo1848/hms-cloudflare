# 03D — Hotel operational time

Status: `BINDING DEFINITION`

## Core rule

Operational dates are not authorized by Worker UTC date or browser timezone. Every hotel has one authoritative IANA timezone. Server domain logic derives `hotel_local_date`; client clocks may display information but cannot decide date-sensitive eligibility.

For the current Mendoza hotel the expected configuration is `America/Argentina/Mendoza`.

## Required hotel-local-date uses

- no-show eligibility;
- overdue arrival/departure and overrun classification;
- housekeeping default board date;
- remaining-night range for reassignment;
- stay-extension date validation;
- front-desk operational date;
- report/default range semantics where hotel day matters.

This foundation does not add a new date cutoff to check-in or cancellation.

## Absolute instants versus hotel-local dates — D10

A timestamp representing a real instant (for example late-arrival ETA or audit created_at) must be unambiguous on the wire and in storage.

Late-arrival ETA uses RFC3339/ISO-8601 with explicit `Z` or numeric offset. Server parses the absolute instant, verifies it is future, then converts it to the hotel's IANA timezone to derive the stay date used by `check_in <= eta_hotel_local_date < check_out`. Timezone-less ETA is invalid rather than guessed from browser/server locale.

Audit timestamps remain absolute instants. Hotel-local operational date is additional domain context, not a replacement timestamp.

## Configuration

Timezone belongs to hotel configuration/control metadata and is exposed through trusted server-owned hotel/auth context. Existing Mendoza staging/demo hotel data may be explicitly backfilled as `America/Argentina/Mendoza`; new hotel registration must provide/derive a valid IANA timezone.

## No-show parity

Preserve accepted business timing using the correct hotel calendar: `hotel_local_date >= check_in`. A future booking cannot be marked no-show. A new same-day hour cutoff would require a future product decision.